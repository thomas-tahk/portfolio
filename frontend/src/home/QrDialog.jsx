import { useEffect, useRef, useState } from 'react'

const QR_OPTIONS = {
  type: 'svg',
  margin: 4, // quiet zone, in modules
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#ffffff' }, // fixed: scans in every theme
}

function pageUrl() {
  const url = new URL(window.location.href)
  url.hash = ''
  return url.href
}

async function makeQr(href) {
  const { default: QRCode } = await import('qrcode') // loaded on first tap, not with the page
  const svg = await QRCode.toString(href, QR_OPTIONS)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function QrDialog({ open, onClose }) {
  const dialog = useRef(null)
  const [state, setState] = useState({ status: 'loading', href: '', src: '' })

  useEffect(() => {
    const el = dialog.current
    if (!open) {
      if (el.open) el.close()
      return undefined
    }
    const href = pageUrl()
    let cancelled = false
    setState({ status: 'loading', href, src: '' })
    if (!el.open) el.showModal()
    makeQr(href).then(
      (src) => !cancelled && setState({ status: 'ready', href, src }),
      () => !cancelled && setState({ status: 'error', href, src: '' }),
    )
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <dialog ref={dialog} className="qr-dialog" aria-label="QR code for this page" onClose={onClose}>
      {state.status === 'loading' && <p role="status">Making QR code…</p>}
      {state.status === 'error' && <p role="alert">Could not make the QR code. Open this address instead:</p>}
      {state.status === 'ready' && <img className="qr-image" src={state.src} alt={`QR code for ${state.href}`} />}
      {state.status !== 'loading' && <p className="qr-url">{state.href}</p>}
      <button type="button" className="btn" onClick={() => dialog.current.close()}>
        Close
      </button>
    </dialog>
  )
}
