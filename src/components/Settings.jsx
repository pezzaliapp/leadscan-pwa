import { useState } from 'react'
import { MODELS_BY_PROVIDER as MODELS } from '../lib/storage.js'

export default function Settings({ settings, onSave }) {
  const [s, setS] = useState(settings)
  const [saved, setSaved] = useState(false)

  const set = (k, v) => {
    setS((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  function handleSave() {
    const next = { ...s }
    if (!MODELS[next.provider].includes(next.model)) {
      next.model = MODELS[next.provider][0]
    }
    onSave(next)
    setS(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-100">
          Impostazioni API
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          La chiave resta solo su questo dispositivo (localStorage). Non viene
          mai inviata a nessuno tranne al provider AI scelto.
        </p>
      </div>

      <div>
        <label className="field-label">Provider AI</label>
        <div className="grid grid-cols-2 gap-3">
          {['gemini', 'openai'].map((p) => (
            <button
              key={p}
              onClick={() => set('provider', p)}
              className={`rounded-xl py-3 font-semibold border transition-colors ${
                s.provider === p
                  ? 'bg-amber-glow text-ink-900 border-amber-glow'
                  : 'bg-ink-700 text-zinc-300 border-ink-600'
              }`}
            >
              {p === 'gemini' ? 'Google Gemini' : 'OpenAI'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">API Key</label>
        <input
          className="field-input"
          type="password"
          autoComplete="off"
          value={s.apiKey || ''}
          onChange={(e) => set('apiKey', e.target.value)}
          placeholder={
            s.provider === 'gemini' ? 'AIza…' : 'sk-…'
          }
        />
      </div>

      <div>
        <label className="field-label">Modello</label>
        <select
          className="field-input"
          value={s.model}
          onChange={(e) => set('model', e.target.value)}
        >
          {MODELS[s.provider].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <button className="btn-primary" onClick={handleSave}>
        {saved ? 'Salvato ✓' : 'Salva impostazioni'}
      </button>

      <div className="text-xs text-ink-500 leading-relaxed bg-ink-800 border border-ink-600 rounded-xl p-4">
        <p className="font-semibold text-zinc-400 mb-1">Come ottenere la key</p>
        <p>
          Gemini: Google AI Studio → “Get API key”. OpenAI: piattaforma OpenAI →
          API keys. Incolla qui sopra: nessuna chiave è scritta nel codice
          dell’app.
        </p>
      </div>
    </div>
  )
}
