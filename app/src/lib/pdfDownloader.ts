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
 * Direct PDF Downloader for Invoice & Document elements.
 * Uses an isolated hidden iframe with clean CSS rules to guarantee zero lab()/oklch() errors.
 */
export async function downloadElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
  // Dynamically import html2canvas
  const html2canvasModule = await import('html2canvas')
  const html2canvas = html2canvasModule.default || html2canvasModule

  // 1. Pre-convert all images in element to Base64
  const imgs = Array.from(element.querySelectorAll('img'))
  const originalSrcs: string[] = []

  await Promise.all(
    imgs.map(async (img, idx) => {
      originalSrcs[idx] = img.src
      if (img.src && !img.src.startsWith('data:')) {
        const base64 = await toDataURL(img.src)
        img.src = base64
      }
    })
  )

  // 2. Create an isolated hidden iframe with NO Tailwind v4 lab() stylesheets
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

  // Write clean, standalone HEX/RGB styles inside the iframe
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
            padding: 20px;
            width: 760px;
          }
          .flex { display: flex; }
          .flex-row { flex-direction: row; }
          .flex-col { flex-direction: column; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .items-end { align-items: flex-end; }
          .flex-1 { flex: 1; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
          .gap-2 { gap: 8px; }
          .gap-4 { gap: 16px; }
          .gap-6 { gap: 24px; }
          .w-full { width: 100%; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-extrabold { font-weight: 800; }
          .font-medium { font-weight: 500; }
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14px; }
          .text-base { font-size: 16px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .text-2xl { font-size: 24px; }
          .bg-white { background-color: #ffffff; }
          .bg-slate-50 { background-color: #f8fafc; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .bg-amber-50 { background-color: #fffbeb; }
          .text-slate-900 { color: #0f172a; }
          .text-slate-700 { color: #334155; }
          .text-slate-600 { color: #475569; }
          .text-slate-500 { color: #64748b; }
          .text-blue-900 { color: #1e3a8a; }
          .border { border: 1px solid #e2e8f0; }
          .border-b-2 { border-bottom: 2px solid #0f172a; }
          .border-t { border-top: 1px solid #e2e8f0; }
          .border-t-2 { border-top: 2px solid #cbd5e1; }
          .border-slate-200 { border-color: #e2e8f0; }
          .border-slate-300 { border-color: #cbd5e1; }
          .rounded-xl { border-radius: 12px; }
          .rounded-lg { border-radius: 8px; }
          .rounded-full { border-radius: 9999px; }
          .p-2 { padding: 8px; }
          .p-2-5 { padding: 10px; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-8 { padding: 32px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mb-7 { margin-bottom: 28px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-6 { margin-top: 24px; }
          .pb-4 { padding-bottom: 16px; }
          .pb-5 { padding-bottom: 20px; }
          .pt-3-5 { padding-top: 14px; }
          .pt-5 { padding-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div id="pdf-root">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `)
  iframeDoc.close()

  try {
    // Wait a frame for layout rendering in iframe
    await new Promise((resolve) => setTimeout(resolve, 100))

    const pdfRoot = iframeDoc.getElementById('pdf-root') || iframeDoc.body

    // Render iframe content to canvas (Zero lab() colors exist inside this iframe!)
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

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight))
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  } finally {
    // Cleanup iframe & restore original image srcs
    document.body.removeChild(iframe)
    imgs.forEach((img, idx) => {
      if (originalSrcs[idx]) {
        img.src = originalSrcs[idx]
      }
    })
  }
}
