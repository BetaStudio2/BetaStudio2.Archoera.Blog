import { useDocumentStore } from '@/webword/stores/document'
import i18n from '@/i18n'

const t = (key: string): string => (i18n.global as any).t(key)

export function useExport() {
  const docStore = useDocumentStore()

  function getDocHtml(): string {
    return docStore.content || `<h1>${t('wwl.newDocTitle')}</h1><p>${t('wwl.newDocPlaceholder')}</p>`
  }

  function getDocTitle(): string {
    return docStore.docInfo.title || t('wwl.docTitle')
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function exportAsPDF() {
    const contentHTML = getDocHtml()

    const printHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${t('wwl.exportPdfTitle')}</title>
<style>
@page{size:A4;margin:2.54cm 3.18cm;}
html,body{width:100%;height:100%;margin:0;padding:0;background:#fff;}
.print-wrapper{max-width:100%;margin:0 auto;padding:0;font-size:12pt;line-height:1.6;color:#000;font-family:"Microsoft YaHei","SimSun",sans-serif;}
.print-wrapper h1{font-size:22pt;margin:16pt 0 8pt;}
.print-wrapper h2{font-size:16pt;margin:12pt 0 6pt;}
.print-wrapper h3{font-size:13pt;margin:10pt 0 4pt;}
.print-wrapper p{margin:0 0 6pt;}
.print-wrapper ul,.print-wrapper ol{margin:0 0 6pt 18pt;}
.print-wrapper table{border-collapse:collapse;width:100%;}
.print-wrapper td,.print-wrapper th{border:1px solid #ccc;padding:4pt 6pt;}
.print-wrapper,.print-wrapper *{color:#000!important;background:transparent!important;}
@media print{html,body{background:#fff;}.print-wrapper{width:100%!important;max-width:none!important;}html,body,.print-wrapper{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}
</style>
</head>
<body>
<div class="print-wrapper">${contentHTML}</div>
</body>
</html>`

    const oldFrame = document.getElementById('webword-pdf-iframe')
    if (oldFrame) oldFrame.parentNode!.removeChild(oldFrame)

    const iframe = document.createElement('iframe')
    iframe.id = 'webword-pdf-iframe'
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document
    iframeDoc.open()
    iframeDoc.write(printHTML)
    iframeDoc.close()

    iframe.onload = () => {
      iframe.contentWindow!.focus()
      iframe.contentWindow!.print()
    }
  }

  function exportAsHTML() {
    const contentHTML = getDocHtml()
    const title = getDocTitle()
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body{font-family:"Microsoft YaHei","SimSun",sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;font-size:16px;line-height:1.8;color:#333;}
h1{font-size:28px;margin-bottom:16px;}
h2{font-size:22px;margin:24px 0 12px;}
h3{font-size:18px;margin:20px 0 10px;}
p{margin:0 0 12px;}
ul,ol{margin:0 0 12px 24px;}
table{border-collapse:collapse;width:100%;margin:16px 0;}
td,th{border:1px solid #ddd;padding:8px 12px;}
</style>
</head>
<body>${contentHTML}</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, `${title}.html`)
    docStore.docDirty = false
  }

  function exportAsPNG(): Promise<void> {
    return new Promise((resolve, reject) => {
      const contentHTML = getDocHtml()
      const title = getDocTitle()

      const cleanHtml = contentHTML
        .replace(/<img[^>]*>/gi, '')
        .replace(/url\([^)]*\)/gi, 'url()')
        .replace(/@import[^;]*;/gi, '')
        .replace(/background-image\s*:[^;]*;/gi, '')

      const workspace = document.getElementById('workspace') || document.getElementById('doc')
      const rect = workspace ? workspace.getBoundingClientRect() : { width: 800, height: 600 }

      if (!rect.width || !rect.height) {
        alert(t('wwl.exportPngSizeError'))
        reject(new Error('无法获取文档尺寸'))
        return
      }

      const scale = 2
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = rect.width * scale
      canvas.height = Math.max(rect.height, 200) * scale
      ctx.scale(scale, scale)

      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${Math.max(rect.height, 200)}">
<foreignObject width="100%" height="100%">
<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:16px;font-family:Microsoft YaHei,SimSun,sans-serif;color:#000;">
${cleanHtml}
</div>
</foreignObject>
</svg>`

      const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
          ctx.drawImage(img, 0, 0)

          try {
            canvas.toBlob((blob) => {
              if (!blob) {
                alert(t('wwl.exportPngUnsupported'))
                reject(new Error('toBlob failed'))
                return
              }
              downloadBlob(blob, `${title}.png`)
              docStore.docDirty = false
              resolve()
            }, 'image/png')
          } catch (e) {
            alert(t('wwl.exportPngExternalResource'))
            reject(e)
          }
        }
        img.onerror = () => {
          alert(t('wwl.exportPngRenderError'))
          reject(new Error('image load error'))
        }
        img.src = reader.result as string
      }
      reader.onerror = () => {
        alert(t('wwl.exportPngReadError'))
        reject(new Error('reader error'))
      }
      reader.readAsDataURL(svgBlob)
    })
  }

  return {
    exportAsPDF,
    exportAsHTML,
    exportAsPNG,
  }
}
