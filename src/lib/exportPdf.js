// exportPdf.js — genera un PDF A4 con una scheda per lead.

import { jsPDF } from 'jspdf'

// --- helper formattazione data ---
function pad(n) {
  return String(n).padStart(2, '0')
}

function fmtDateShort(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function joinList(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ')
  return v || ''
}

function nonEmpty(v) {
  if (Array.isArray(v)) return v.filter(Boolean).length > 0
  return v !== undefined && v !== null && String(v).trim() !== ''
}

// Disegna una pagina/scheda per un singolo lead.
function renderLead(doc, lead, pageWidth, pageHeight) {
  const margin = 40
  const contentWidth = pageWidth - margin * 2
  const d = lead.data || {}
  let y = margin

  // --- foto in alto a destra (se valida) ---
  const photoSize = 120
  let textRightLimit = contentWidth
  if (lead.photo) {
    try {
      const fmt = /^data:image\/(png|jpe?g);/i.exec(lead.photo)
      const type = fmt ? (fmt[1].toLowerCase() === 'png' ? 'PNG' : 'JPEG') : 'JPEG'
      doc.addImage(
        lead.photo,
        type,
        pageWidth - margin - photoSize,
        margin,
        photoSize,
        photoSize,
        undefined,
        'FAST'
      )
      textRightLimit = contentWidth - photoSize - 12
    } catch {
      // immagine non valida: salta senza interrompere il PDF
    }
  }

  // --- intestazione "SCHEDA LEAD · data" ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110)
  const headerLabel = `SCHEDA LEAD · ${fmtDateShort(lead.createdAt)}`
  doc.text(headerLabel, margin, y)
  y += 16

  // --- titolo grande: Nome Cognome ---
  const fullName =
    [d.nome, d.cognome].filter(Boolean).join(' ').trim() || 'Lead senza nome'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20)
  const titleLines = doc.splitTextToSize(fullName, textRightLimit)
  doc.text(titleLines, margin, y + 4)
  y += 22 + (titleLines.length - 1) * 22

  // --- sottotitolo: Ruolo · Azienda ---
  const sub = [d.ruolo, d.azienda].filter(Boolean).join(' · ')
  if (sub) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(80)
    const subLines = doc.splitTextToSize(sub, textRightLimit)
    doc.text(subLines, margin, y)
    y += 14 + (subLines.length - 1) * 14
  }

  // se la foto occupa più della testata, scendi sotto la foto
  if (lead.photo) {
    y = Math.max(y, margin + photoSize + 8)
  }
  y += 6

  // --- linea separatrice ---
  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)
  y += 16

  // Helpers di rendering interno
  function sectionTitle(text) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(150, 110, 20)
    doc.text(text, margin, y)
    y += 14
  }

  function fieldLine(label, value) {
    if (!nonEmpty(value)) return
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(60)
    const labelText = `${label}: `
    const labelWidth = doc.getTextWidth(labelText)
    doc.text(labelText, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)
    const valueText = joinList(value)
    const lines = doc.splitTextToSize(valueText, contentWidth - labelWidth)
    doc.text(lines, margin + labelWidth, y)
    y += 13 * lines.length + 2
  }

  function multilineBlock(label, value) {
    if (!nonEmpty(value)) return
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.text(`${label}:`, margin, y)
    y += 13
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)
    const lines = doc.splitTextToSize(String(value), contentWidth)
    doc.text(lines, margin, y)
    y += 13 * lines.length + 4
  }

  // --- CONTATTI ---
  const hasContatti =
    nonEmpty(d.telefono) ||
    nonEmpty(d.email) ||
    nonEmpty(d.pec) ||
    nonEmpty(d.indirizzo) ||
    nonEmpty(d.citta) ||
    nonEmpty(d.provincia)
  if (hasContatti) {
    sectionTitle('CONTATTI')
    fieldLine('Telefono', d.telefono)
    fieldLine('Email', d.email)
    fieldLine('PEC', d.pec)
    fieldLine('Indirizzo', d.indirizzo)
    fieldLine('Città', d.citta)
    fieldLine('Provincia', d.provincia)
    y += 6
  }

  // --- INTERESSE COMMERCIALE ---
  const hasInteresse =
    nonEmpty(d.categoria_visitatore) ||
    nonEmpty(d.macchine_interesse) ||
    nonEmpty(d.marchi_attuali) ||
    nonEmpty(d.note_commerciali)
  if (hasInteresse) {
    sectionTitle('INTERESSE COMMERCIALE')
    fieldLine('Categoria visitatore', d.categoria_visitatore)
    fieldLine('Macchine interesse', d.macchine_interesse)
    fieldLine('Marchi attuali', d.marchi_attuali)
    multilineBlock('Note commerciali', d.note_commerciali)
    y += 4
  }

  // --- FOLLOW-UP ---
  const hasFollowup =
    nonEmpty(d.followup_data) ||
    nonEmpty(d.followup_azione) ||
    nonEmpty(d.materiale_consegnato)
  if (hasFollowup) {
    sectionTitle('FOLLOW-UP')
    fieldLine('Follow-up data', d.followup_data)
    fieldLine('Follow-up azione', d.followup_azione)
    fieldLine('Materiale consegnato', d.materiale_consegnato)
    y += 4
  }

  // --- CAMPI DA VERIFICARE: banda evidenziata in fondo ---
  if (nonEmpty(d.campi_da_verificare)) {
    const text = `DA VERIFICARE: ${joinList(d.campi_da_verificare)}`
    const lines = doc.splitTextToSize(text, contentWidth - 16)
    const blockHeight = 12 + lines.length * 13
    const blockY = pageHeight - margin - blockHeight
    doc.setFillColor(255, 244, 214)
    doc.setDrawColor(214, 164, 40)
    doc.setLineWidth(0.7)
    doc.rect(margin, blockY, contentWidth, blockHeight, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(140, 90, 0)
    doc.text(lines, margin + 8, blockY + 14)
  }
}

export function downloadPdf(leads) {
  if (!leads || leads.length === 0) return
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  leads.forEach((lead, i) => {
    if (i > 0) doc.addPage()
    renderLead(doc, lead, pageWidth, pageHeight)
  })

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`leadscan_${stamp}.pdf`)
}
