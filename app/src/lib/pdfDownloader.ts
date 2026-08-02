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

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

function buildRgba(r: number, g: number, b: number, a: number): string {
  const [rr, gg, bb] = [r, g, b].map((c) => Math.round(clamp01(c / 255) * 255))
  const alpha = clamp01(a)
  return alpha >= 1 ? `rgb(${rr}, ${gg}, ${bb})` : `rgba(${rr}, ${gg}, ${bb}, ${alpha})`
}

const matVec = (M: number[][], v: number[]): number[] => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
]

const SRGB_GAMMA = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

const D50_TO_D65 = [
  [0.95547345, -0.02309845, 0.06325908],
  [-0.02836971, 1.00999516, 0.02104144],
  [0.01231416, -0.02050765, 1.33036594],
]

const D65_TO_LINEAR_SRGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
]

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const fInv = (f: number): number => {
    const c = f * f * f
    return c > 0.008856 ? c : (116 * f - 16) / 903.3
  }
  const xyz = matVec(D50_TO_D65, [fInv(fx) * 0.96422, fInv(fy), fInv(fz) * 0.82521])
  const lin = matVec(D65_TO_LINEAR_SRGB, xyz)
  return [SRGB_GAMMA(lin[0]) * 255, SRGB_GAMMA(lin[1]) * 255, SRGB_GAMMA(lin[2]) * 255]
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  const xyz = [
    1.2270138511 * l - 0.5577999807 * m + 0.281256149 * s,
    -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s,
    -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s,
  ]
  const lin = matVec(D65_TO_LINEAR_SRGB, xyz)
  return [SRGB_GAMMA(lin[0]) * 255, SRGB_GAMMA(lin[1]) * 255, SRGB_GAMMA(lin[2]) * 255]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = hue / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = l - c / 2
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m]
}

function hwbToRgb(h: number, w: number, b: number): [number, number, number] {
  if (w + b >= 1) {
    const gray = w / (w + b)
    return [gray, gray, gray]
  }
  const [r, g, bb] = hslToRgb(h, 1, 0.5)
  const blend = (c: number) => c * (1 - w - b) + w
  return [blend(r), blend(g), blend(bb)]
}

function splitColorArgs(token: string): { fn: string; parts: string[]; alpha: number } | null {
  const open = token.indexOf('(')
  const close = token.lastIndexOf(')')
  if (open < 0 || close <= open) return null
  const inner = token.slice(open + 1, close).trim()
  let body = inner
  let alpha = 1
  const slash = inner.indexOf('/')
  if (slash >= 0) {
    body = inner.slice(0, slash).trim()
    const aRaw = inner.slice(slash + 1).trim()
    alpha = aRaw.endsWith('%') ? parseFloat(aRaw) / 100 : parseFloat(aRaw)
  }
  const parts = body.split(/\s+/).filter(Boolean)
  if (!parts.length || Number.isNaN(alpha)) return null
  return { fn: token.slice(0, open).trim().toLowerCase(), parts, alpha }
}

function manualModernColorToRgb(token: string): string | null {
  const s = splitColorArgs(token)
  if (!s) return null
  const { fn, parts, alpha } = s
  const pct = (p: string, max: number): number => (p.endsWith('%') ? (parseFloat(p) / 100) * max : parseFloat(p))
  const nums = parts.map(parseFloat)
  if (nums.some((n) => Number.isNaN(n))) return null

  let rgb: [number, number, number] | null = null
  switch (fn) {
    case 'lab':
      rgb = labToRgb(pct(parts[0], 100), nums[1], nums[2])
      break
    case 'lch':
      rgb = labToRgb(
        pct(parts[0], 100),
        nums[1] * Math.cos((nums[2] * Math.PI) / 180),
        nums[1] * Math.sin((nums[2] * Math.PI) / 180),
      )
      break
    case 'oklab':
      rgb = oklabToRgb(pct(parts[0], 1), nums[1], nums[2])
      break
    case 'oklch':
      rgb = oklabToRgb(
        pct(parts[0], 1),
        nums[1] * Math.cos((nums[2] * Math.PI) / 180),
        nums[1] * Math.sin((nums[2] * Math.PI) / 180),
      )
      break
    case 'hsl':
    case 'hsla': {
      const c = hslToRgb(nums[0], pct(parts[1], 1), pct(parts[2], 1))
      rgb = [c[0] * 255, c[1] * 255, c[2] * 255]
      break
    }
    case 'hwb': {
      const c = hwbToRgb(nums[0], pct(parts[1], 1), pct(parts[2], 1))
      rgb = [c[0] * 255, c[1] * 255, c[2] * 255]
      break
    }
    default:
      return null
  }
  if (!rgb) return null
  return buildRgba(rgb[0], rgb[1], rgb[2], alpha)
}

/**
 * Resolve a single color (e.g. oklch(...), lab(...), hsl(...)) to a legacy
 * rgb()/rgba() string html2canvas can parse. Strategy: ask the canvas API to
 * resolve the color, then parse the browser's serialization ("rgb(...)",
 * "color(srgb ...)") and finally fall back to a manual CSS Color 4 conversion.
 * Returns the input unchanged when it is already a safe color or cannot resolve.
 */
function colorToRgb(value: string): string {
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return value
    ctx.fillStyle = '#000000'
    ctx.fillStyle = value
    const resolved = ctx.fillStyle
    if (/^rgba?\(/i.test(resolved)) return resolved

    // Browsers serialize modern color spaces as "color(srgb r g b / a)".
    const srgb = resolved.match(
      /^color\(\s*srgb\s+([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i,
    )
    if (srgb) {
      const part = (p: string) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p))
      const alpha =
        srgb[4] !== undefined ? (srgb[4].endsWith('%') ? parseFloat(srgb[4]) / 100 : parseFloat(srgb[4])) : 1
      return buildRgba(part(srgb[1]) * 255, part(srgb[2]) * 255, part(srgb[3]) * 255, alpha)
    }

    const manual = manualModernColorToRgb(value)
    if (manual) return manual
    return value
  } catch {
    return value
  }
}

/**
 * Replace every modern color function token (oklch, oklab, lab, lch, hsl, hwb,
 * color, color-mix) inside a style value with a browser-resolved rgb() equivalent.
 * Uses a balanced-paren scan so colors nested in gradients, shadows or
 * color-mix() are handled too. html2canvas throws on these color spaces, which
 * is what corrupted earlier PDF exports.
 */
function replaceColorTokens(input: string, replacer: (token: string) => string): string {
  const re = /(color-mix|oklch|oklab|lab|lch|hsla|hsl|hwb|color)\(/gi
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(input))) {
    const start = m.index
    let depth = 1
    let i = m.index + m[0].length
    while (i < input.length && depth > 0) {
      if (input[i] === '(') depth++
      else if (input[i] === ')') depth--
      i++
    }
    const end = i
    out += input.slice(last, start) + replacer(input.slice(start, end))
    last = end
    re.lastIndex = end
  }
  return out + input.slice(last)
}

function resolveModernColors(value: string): string {
  if (!value || !/color-mix|oklch|oklab|lab|lch|hsl|hsla|hwb|color\(/i.test(value)) return value
  return replaceColorTokens(value, (token) => colorToRgb(token))
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
