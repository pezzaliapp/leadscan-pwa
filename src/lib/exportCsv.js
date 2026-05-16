// exportCsv.js — esporta tutti i lead in un CSV con colonne ordinate.

const COLUMNS = [
  ['createdAt', 'Data'],
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
  ['categoria_visitatore', 'Categoria'],
  ['macchine_interesse', 'Macchine interesse'],
  ['marchi_attuali', 'Marchi attuali'],
  ['note_commerciali', 'Note commerciali'],
  ['followup_data', 'Follow-up data'],
  ['followup_azione', 'Follow-up azione'],
  ['materiale_consegnato', 'Materiale consegnato'],
  ['campi_da_verificare', 'Campi da verificare']
]

function csvCell(value) {
  let v = value
  if (Array.isArray(v)) v = v.join(' | ')
  if (v === undefined || v === null) v = ''
  v = String(v)
  if (/[",;\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"'
  return v
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('it-IT')
  } catch {
    return iso
  }
}

export function leadsToCsv(leads) {
  const header = COLUMNS.map(([, label]) => csvCell(label)).join(';')
  const rows = leads.map((lead) => {
    const data = lead.data || {}
    return COLUMNS.map(([key]) => {
      if (key === 'createdAt') return csvCell(fmtDate(lead.createdAt))
      return csvCell(data[key])
    }).join(';')
  })
  // BOM UTF-8 -> apertura corretta in Excel con accenti
  return '\uFEFF' + [header, ...rows].join('\r\n')
}

export function downloadCsv(leads) {
  const csv = leadsToCsv(leads)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `leadscan_${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
