import { useRef, useState } from 'react'

// Cattura immagine: fotocamera posteriore (capture="environment") o galleria.
// Ridimensiona l'immagine prima dell'invio AI per ridurre peso/banda.
function resizeImage(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CameraCapture({ onAnalyze, busy, error }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const [preview, setPreview] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImage(file)
      setPreview(dataUrl)
    } catch {
      alert('Impossibile leggere l\u2019immagine.')
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-100">
          Nuova scansione
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          Fotografa scheda fiera + biglietto da visita. Poi correggi e salva.
        </p>
      </div>

      <div className="aspect-[3/4] rounded-2xl border border-ink-600 bg-ink-800 overflow-hidden flex items-center justify-center relative">
        {preview ? (
          <img
            src={preview}
            alt="Anteprima"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center px-6">
            <div className="text-5xl mb-3">📷</div>
            <p className="text-sm text-ink-500">
              Nessuna immagine. Scatta una foto o caricala dalla galleria.
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-ink-900/80 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-amber-glow border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-300">Analisi AI in corso…</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {!preview ? (
        <div className="space-y-3">
          <button
            className="btn-primary"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
          >
            Scatta foto
          </button>
          <button
            className="btn-ghost"
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
          >
            Carica dalla galleria
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            className="btn-primary"
            onClick={() => onAnalyze(preview)}
            disabled={busy}
          >
            {busy ? 'Analisi…' : 'Analizza con AI'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => setPreview(null)}
            disabled={busy}
          >
            Rifai foto
          </button>
        </div>
      )}
    </div>
  )
}
