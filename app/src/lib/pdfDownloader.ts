import html2canvas from 'html2canvas'
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
 * Pre-converts images to Base64 and sanitizes Tailwind v4 lab()/oklch() color functions in onclone.
 */
export async function downloadElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
  // 1. Pre-load all images as Base64 Data URLs
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

  try {
    // 2. Render element to Canvas using html2canvas with lab()/oklch() sanitizer in onclone
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        // Sanitize <style> tags containing unsupported lab() or oklch() color functions
        const styles = Array.from(clonedDoc.querySelectorAll('style'))
        styles.forEach((style) => {
          if (style.innerHTML) {
            style.innerHTML = style.innerHTML
              .replace(/lab\([^)]+\)/gi, '#0f172a')
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/color\(display-p3[^)]+\)/gi, '#0f172a')
          }
        })

        // Ensure all cloned elements use clean inline HEX/RGB colors
        const allNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))]
        allNodes.forEach((node) => {
          const htmlEl = node as HTMLElement
          if (!htmlEl || !htmlEl.style) return

          if (htmlEl.style.cssText) {
            htmlEl.style.cssText = htmlEl.style.cssText
              .replace(/lab\([^)]+\)/gi, '#0f172a')
              .replace(/oklch\([^)]+\)/gi, '#0f172a')
              .replace(/color\(display-p3[^)]+\)/gi, '#0f172a')
          }
        })
      },
    })

    // 3. Create PDF and save file directly
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
    // Restore original img srcs
    imgs.forEach((img, idx) => {
      if (originalSrcs[idx]) {
        img.src = originalSrcs[idx]
      }
    })
  }
}
