import { useMemo, useState } from 'react'

function matchLead(lead, q) {
  if (!q) return true
  const d = lead.data || {}
  const hay = [
    d.nome,
    d.cognome,
    d.azienda,
    d.telefono,
    d.email,
    (d.macchine_interesse || []).join(' '),
    d.note_commerciali
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export default function LeadList({
  leads,
  onExport,
  onExportXlsx,
  onExportPdf,
  onDelete,
  onOpen
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(
    () => leads.filter((l) => matchLead(l, q)),
    [leads, q]
  )

  const exportBtn =
    'bg-amber-glow text-ink-900 font-display font-bold text-sm rounded-xl px-4 py-2.5 active:scale-95 transition-transform disabled:opacity-40'
  const disabled = leads.length === 0

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-100">
            Lead salvati
          </h1>
          <p className="text-sm text-ink-500 mt-1">{leads.length} totali</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={exportBtn}
            onClick={onExport}
            disabled={disabled}
          >
            Esporta CSV
          </button>
          <button
            className={exportBtn}
            onClick={onExportXlsx}
            disabled={disabled}
          >
            Esporta Excel
          </button>
          <button
            className={exportBtn}
            onClick={onExportPdf}
            disabled={disabled}
          >
            Esporta PDF
          </button>
        </div>
      </div>

      <input
        className="field-input"
        type="search"
        placeholder="Cerca: nome, azienda, telefono, macchina, note…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="text-center text-ink-500 py-16 text-sm">
          {leads.length === 0
            ? 'Nessun lead ancora. Vai su “Scansione”.'
            : 'Nessun risultato per la ricerca.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const d = lead.data || {}
            const title =
              [d.nome, d.cognome].filter(Boolean).join(' ') ||
              d.azienda ||
              'Lead senza nome'
            return (
              <div
                key={lead.id}
                className="bg-ink-800 border border-ink-600 rounded-2xl p-4"
              >
                <div className="flex gap-3">
                  {lead.photo && (
                    <img
                      src={lead.photo}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-ink-600 shrink-0"
                      onClick={() => onOpen(lead)}
                    />
                  )}
                  <div className="min-w-0 flex-1" onClick={() => onOpen(lead)}>
                    <p className="font-display font-bold text-zinc-100 truncate">
                      {title}
                    </p>
                    {d.azienda && (
                      <p className="text-sm text-ink-500 truncate">
                        {d.azienda}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-ink-500">
                      {d.telefono && <span>{d.telefono}</span>}
                      {d.citta && <span>{d.citta}</span>}
                    </div>
                    {(d.macchine_interesse || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {d.macchine_interesse.slice(0, 4).map((m, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-ink-600 text-zinc-300 rounded-md px-2 py-0.5"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-ink-500 text-xs self-start px-2 py-1 active:text-red-400"
                    onClick={() => {
                      if (confirm('Eliminare questo lead?')) onDelete(lead.id)
                    }}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
