import { useEffect, useState } from 'react'
import CameraCapture from './components/CameraCapture.jsx'
import LeadForm from './components/LeadForm.jsx'
import LeadList from './components/LeadList.jsx'
import Settings from './components/Settings.jsx'
import Privacy from './components/Privacy.jsx'
import { extractFromImage } from './lib/vision.js'
import {
  getAllLeads,
  saveLead,
  deleteLead,
  getSettings,
  saveSettings
} from './lib/storage.js'
import { downloadCsv } from './lib/exportCsv.js'
import { downloadXlsx } from './lib/exportXlsx.js'
import { downloadPdf } from './lib/exportPdf.js'

const TABS = [
  ['scan', 'Scansione', '◎'],
  ['leads', 'Lead', '≣'],
  ['settings', 'API', '⚙'],
  ['privacy', 'Privacy', '🛡']
]

export default function App() {
  const [tab, setTab] = useState('scan')
  const [leads, setLeads] = useState([])
  const [settings, setSettings] = useState(getSettings())

  // Stato flusso scansione: idle -> form
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null) // { data, photo }

  useEffect(() => {
    getAllLeads().then(setLeads)
  }, [])

  async function refreshLeads() {
    setLeads(await getAllLeads())
  }

  async function handleAnalyze(dataUrl) {
    setError('')
    if (!settings.apiKey) {
      setError('API key mancante. Apri “API” e inseriscila.')
      setTab('settings')
      return
    }
    setBusy(true)
    try {
      const extracted = await extractFromImage(dataUrl, settings)
      setDraft({ data: extracted, photo: dataUrl })
    } catch (e) {
      setError(e.message || 'Errore durante l’analisi AI.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveLead(formData) {
    const existingId = draft?.id
    const lead = {
      id: existingId || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: draft?.createdAt || new Date().toISOString(),
      photo: draft?.photo || null,
      data: formData
    }
    await saveLead(lead)
    await refreshLeads()
    setDraft(null)
    setTab('leads')
  }

  async function handleDelete(id) {
    await deleteLead(id)
    await refreshLeads()
  }

  function openLead(lead) {
    setDraft({
      id: lead.id,
      createdAt: lead.createdAt,
      photo: lead.photo,
      data: lead.data
    })
    setTab('scan')
  }

  function handleSaveSettings(next) {
    saveSettings(next)
    setSettings(next)
  }

  return (
    <div className="min-h-full flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-ink-700">
        <span className="font-display font-bold text-amber-glow text-lg tracking-tight">
          LeadScan
        </span>
        <span className="text-[10px] uppercase tracking-widest text-ink-500 mt-0.5">
          PWA
        </span>
      </header>

      {/* Contenuto */}
      <main className="flex-1 px-5 py-5 overflow-y-auto">
        {tab === 'scan' &&
          (draft ? (
            <LeadForm
              initial={draft.data}
              photo={draft.photo}
              onSave={handleSaveLead}
              onCancel={() => setDraft(null)}
            />
          ) : (
            <CameraCapture
              onAnalyze={handleAnalyze}
              busy={busy}
              error={error}
            />
          ))}

        {tab === 'leads' && (
          <LeadList
            leads={leads}
            onExport={() => downloadCsv(leads)}
            onExportXlsx={() => downloadXlsx(leads)}
            onExportPdf={() => downloadPdf(leads)}
            onDelete={handleDelete}
            onOpen={openLead}
          />
        )}

        {tab === 'settings' && (
          <Settings settings={settings} onSave={handleSaveSettings} />
        )}

        {tab === 'privacy' && <Privacy />}
      </main>

      {/* Bottom nav */}
      <nav className="flex border-t border-ink-700 bg-ink-900/95 backdrop-blur sticky bottom-0">
        {TABS.map(([id, label, icon]) => (
          <button
            key={id}
            className={`nav-tab ${
              tab === id ? 'text-amber-glow' : 'text-ink-500'
            }`}
            onClick={() => {
              setError('')
              if (id === 'scan' && tab === 'scan') setDraft(null)
              setTab(id)
            }}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
