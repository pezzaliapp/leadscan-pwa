// exportXlsx.js — esporta tutti i lead in un file .xlsx con SheetJS.
// Stesso ordine ed etichette di colonne di exportCsv.js.

import * as XLSX from 'xlsx'
import { COLUMNS, fmtDate } from './exportCsv.js'

// Per ogni colonna, una larghezza ragionevole (in "caratteri").
const COLUMN_WIDTHS = {
  createdAt: 18,
  nome: 16,
  cognome: 18,
  azienda: 28,
  ruolo: 18,
  telefono: 16,
  email: 26,
  pec: 26,
  indirizzo: 26,
  citta: 18,
  provincia: 10,
  categoria_visitatore: 18,
  macchine_interesse: 28,
  marchi_attuali: 22,
  note_commerciali: 40,
  followup_data: 14,
  followup_azione: 24,
  materiale_consegnato: 24,
  campi_da_verificare: 22
}

function cellValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value === undefined || value === null) return ''
  return String(value)
}

export function leadsToWorkbook(leads) {
  const header = COLUMNS.map(([, label]) => label)
  const rows = leads.map((lead) => {
    const data = lead.data || {}
    return COLUMNS.map(([key]) => {
      if (key === 'createdAt') return fmtDate(lead.createdAt)
      return cellValue(data[key])
    })
  })

  const aoa = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Larghezza colonne
  ws['!cols'] = COLUMNS.map(([key]) => ({ wch: COLUMN_WIDTHS[key] || 16 }))

  // Freeze prima riga (intestazione bloccata)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2' }]

  // Intestazione in grassetto
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[addr]) continue
    ws[addr].s = {
      font: { bold: true },
      alignment: { vertical: 'center' }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Lead')
  return wb
}

export function downloadXlsx(leads) {
  const wb = leadsToWorkbook(leads)
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `leadscan_${stamp}.xlsx`)
}
