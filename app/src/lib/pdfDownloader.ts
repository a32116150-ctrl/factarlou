import jsPDF from 'jspdf'

/**
 * Convert an image URL (e.g. Supabase storage) to a base64 Data URL
 */
async function toDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(url)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

/**
 * Resolve a single color (e.g. oklch(0.5 0.1 100), hsl(...)) to an rgb() string
 * the browser understands, using the canvas color round-trip. Returns the input
 * unchanged when it is already a safe color or cannot be resolved.
 */
function colorToRgb(value: string): string {
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return value
    ctx.fillStyle = '#000000'
    ctx.fillStyle = value
    const resolved = ctx.fillStyle
    // Canvas serializes sRGB-gamut colors as rgb()/rgba() — that is what
    // html2canvas parses. Anything else ("color(srgb ...)", "oklch(...)")
    // is not safely parseable, so keep the original rather than risk a throw.
    return /^rgba?\(/i.test(resolved) ? resolved : value
  } catch {
    return value
  }
}

/**
 * Replace any modern color function (oklch, oklab, lab, hsl, hwb) found inside
 * a computed style value with a browser-resolved rgb() equivalent. html2canvas
 * throws on these color spaces, which is what corrupted earlier PDF exports.
 */
function resolveModernColors(value: string): string {
  if (!value || !/oklch|oklab|\blab\(|\bhsl\(|\bhwb\(|color-mix/i.test(value)) return value
  return value.replace(
    /(oklch|oklab|lab|hsl|hsla|hwb|color)\([^)]*\)/gi,
    (match) => colorToRgb(match),
  )
}

/**
 * Deep-walk a live source element and its detached clone in parallel, copying
 * every computed style onto the clone as inline styles. This preserves the exact
 * on-screen layout WITHOUT needing the Tailwind stylesheet inside the print
 * document, and converts lab()/oklch() colors to rgb so html2canvas can render.
 */
function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const sourceQueue: HTMLElement[] = [source]
  const targetQueue: HTMLElement[] = [target]

  while (sourceQueue.length) {
    const src = sourceQueue.shift() as HTMLElement
    const tgt = targetQueue.shift() as HTMLElement
    if (!src || !tgt) continue

    const cs = window.getComputedStyle(src)
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i]
      let value = cs.getPropertyValue(prop)
      const priority = cs.getPropertyPriority(prop)
      if (value) value = resolveModernColors(value)
      tgt.style.setProperty(prop, value, priority)
    }

    const srcChildren = Array.from(src.children) as HTMLElement[]
    const tgtChildren = Array.from(tgt.children) as HTMLElement[]
    for (let i = 0; i < srcChildren.length; i++) {
      sourceQueue.push(srcChildren[i])
      targetQueue.push(tgtChildren[i])
    }
  }
}

/**
 * Direct PDF Downloader for Invoice & Document elements.
 * - Clones the element (never mutates the live DOM).
 * - Inlines all computed styles as rgb() so html2canvas sees zero lab()/oklch().
 * - Converts <img> sources to base64 to avoid CORS tainting.
 * - Renders inside an isolated iframe with only a minimal reset stylesheet.
 * - Splits the canvas across multiple A4 pages instead of squashing it.
 */
export async function downloadElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
  // 1. Clone and flatten computed styles before touching images
  const clone = element.cloneNode(true) as HTMLElement
  inlineComputedStyles(element, clone)

  // 2. Pre-convert all images in the CLONE to Base64 (live DOM untouched)
  const imgs = Array.from(clone.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async (img) => {
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await toDataURL(img.src)
        if (base64.startsWith('data:')) img.src = base64
      }
    })
  )

  // 3. Create an isolated hidden iframe — no Tailwind stylesheet, so no lab()
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '-9999px'
  iframe.style.width = '800px'
  iframe.style.height = '1200px'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

  if (!iframeDoc) {
    document.body.removeChild(iframe)
    throw new Error("Impossible de créer le document d'impression")
  }

  // Write a minimal reset + the fully-inlined clone (styles are all inline now)
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
          }
          table { border-collapse: collapse; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div id="pdf-root">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `)
  iframeDoc.close()

  try {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const pdfRoot = iframeDoc.getElementById('pdf-root') || iframeDoc.body

    // Dynamically import html2canvas
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default || html2canvasModule

    const canvas = await html2canvas(pdfRoot, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    // Multi-page slicing: place the full image once, then shift it up page by
    // page so tall invoices are split across A4 pages instead of being squashed.
    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
    heightLeft -= pageHeight
    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  } finally {
    document.body.removeChild(iframe)
  }
}
