import { useState } from 'react'
import { EMPTY_LEAD } from '../lib/vision.js'

// Campi testuali semplici
const TEXT_FIELDS = [
  ['nome', 'Nome'],
  ['cognome', 'Cognome'],
  ['azienda', 'Azienda'],
  ['ruolo', 'Ruolo'],
  ['telefono', 'Telefono'],
  ['email', 'Email'],
  ['pec', 'PEC'],
  ['indirizzo', 'Indirizzo'],
  ['citta', 'Città'],
  ['provincia', 'Provincia'],
  ['categoria_visitatore', 'Categoria visitatore'],
  ['followup_data', 'Data follow-up'],
  ['followup_azione', 'Azione follow-up']
]

// Campi array (inseriti come elenco separato da virgola)
const LIST_FIELDS = [
  ['macchine_interesse', 'Macchine interesse'],
  ['marchi_attuali', 'Marchi attuali'],
  ['materiale_consegnato', 'Materiale consegnato'],
  ['campi_da_verificare', 'Campi da verificare']
]

export default function LeadForm({ initial, photo, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_LEAD, ...initial }))

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setList = (k, v) =>
    set(
      k,
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )

  const flagged = new Set(form.campi_da_verificare || [])

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-100">
          Verifica dati
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          Controlla e correggi prima di salvare.
        </p>
      </div>

      {photo && (
        <img
          src={photo}
          alt="Scansione"
          className="w-full max-h-48 object-contain rounded-xl border border-ink-600 bg-ink-800"
        />
      )}

      {form.qualita_estrazione && (
        <div className="text-xs text-amber-glow bg-amber-glow/10 border border-amber-glow/30 rounded-xl px-4 py-2.5">
          Qualità estrazione: {form.qualita_estrazione}
        </div>
      )}

      {(form.campi_da_verificare?.length || 0) > 0 && (
        <div className="text-xs text-amber-glow bg-amber-glow/10 border border-amber-glow/30 rounded-xl px-4 py-2.5">
          Da verificare: {form.campi_da_verificare.join(', ')}
        </div>
      )}

      <div className="space-y-4">
        {TEXT_FIELDS.map(([key, label]) => (
          <div key={key}>
            <label className="field-label">
              {label}
              {flagged.has(key) && (
                <span className="text-amber-glow ml-1">• verifica</span>
              )}
            </label>
            <input
              className="field-input"
              type={key === 'followup_data' ? 'date' : 'text'}
              value={form[key] || ''}
              onChange={(e) => set(key, e.target.value)}
              placeholder={label}
            />
          </div>
        ))}

        {LIST_FIELDS.map(([key, label]) => (
          <div key={key}>
            <label className="field-label">{label} (separati da virgola)</label>
            <input
              className="field-input"
              type="text"
              value={(form[key] || []).join(', ')}
              onChange={(e) => setList(key, e.target.value)}
              placeholder={label}
            />
          </div>
        ))}

        <div>
          <label className="field-label">Note commerciali</label>
          <textarea
            className="field-input min-h-[120px] resize-y"
            value={form.note_commerciali || ''}
            onChange={(e) => set('note_commerciali', e.target.value)}
            placeholder="Note dalla scrittura a mano, interesse, trattativa…"
          />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <button className="btn-primary" onClick={() => onSave(form)}>
          Salva lead
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>
  )
}
