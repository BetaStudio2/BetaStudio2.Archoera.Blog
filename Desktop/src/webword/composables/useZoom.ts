import { useDocumentStore } from '@/webword/stores/document'

const isFirefox = typeof navigator !== 'undefined' &&
  /Firefox|Zen|Mozilla\/5\.0.*Gecko/i.test(navigator.userAgent) &&
  !/Chrome|Edg|Safari/i.test(navigator.userAgent.replace(/Mozilla|Gecko|Firefox|Zen/g, ''))

export function useZoom() {
  const store = useDocumentStore()

  function setZoom(val: number) {
    store.setZoom(val)
  }

  function getZoom(): number {
    return store.zoom
  }

  function zoomIn() {
    const current = store.zoom
    const step = current >= 120 ? 10 : 5
    setZoom(current + step)
  }

  function zoomOut() {
    const current = store.zoom
    const step = current >= 120 ? 10 : 5
    setZoom(current - step)
  }

  function applyZoom() {
    const wrap = document.getElementById('paperWrap') as HTMLElement | null
    const workspace = document.getElementById('workspace') as HTMLElement | null
    if (!wrap) return
    const zoomVal = store.zoom
    const scale = zoomVal / 100

    wrap.classList.toggle('ff-zoom-mode', isFirefox)
    workspace?.classList.toggle('ff-zoom-mode', isFirefox)

    if (isFirefox) {
      wrap.style.removeProperty('zoom')
      wrap.style.transform = `scale(${scale})`
      wrap.style.transformOrigin = 'top left'
      if (workspace) {
        workspace.style.setProperty('--ff-zoom-scale', String(scale))
      }
    } else {
      wrap.style.setProperty('zoom', `${zoomVal}%`)
      wrap.style.removeProperty('transform')
      if (workspace) {
        workspace.style.removeProperty('--ff-zoom-scale')
      }
    }
  }

  return { setZoom, getZoom, zoomIn, zoomOut, applyZoom }
}
