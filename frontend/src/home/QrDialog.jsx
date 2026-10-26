import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

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

export default function QrDialog({ open, onClose }) {
  const dialog = useRef(null)
  const [shown, setShown] = useState(null)

  useEffect(() => {
    const el = dialog.current
    if (!open) {
      if (el.open) el.close()
      return
    }
    const href = pageUrl()
    QRCode.toString(href, QR_OPTIONS).then((svg) => {
      setShown({ href, src: `data:image/svg+xml,${encodeURIComponent(svg)}` })
      if (!el.open) el.showModal()
    })
  }, [open])

  return (
    <dialog ref={dialog} className="qr-dialog" aria-label="QR code for this page" onClose={onClose}>
      {shown && (
        <>
          <img className="qr-image" src={shown.src} alt={`QR code for ${shown.href}`} />
          <p className="qr-url">{shown.href}</p>
        </>
      )}
      <button type="button" className="btn" onClick={() => dialog.current.close()}>
        Close
      </button>
    </dialog>
  )
}
