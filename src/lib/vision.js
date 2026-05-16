// vision.js — invio immagine alla AI Vision configurata e parsing JSON.
// La API key viene letta dalle impostazioni (localStorage), MAI dal codice.

export const EXTRACTION_PROMPT = `Analizza questa immagine di una scheda fiera con biglietto da visita e note scritte a penna.
Estrai tutti i dati utili per uso commerciale.
Leggi sia il testo stampato sia la scrittura manuale.
Restituisci SOLO JSON valido, senza testo aggiuntivo.
Schema JSON:
{
  "nome": "",
  "cognome": "",
  "azienda": "",
  "ruolo": "",
  "telefono": "",
  "email": "",
  "pec": "",
  "indirizzo": "",
  "citta": "",
  "provincia": "",
  "categoria_visitatore": "",
  "macchine_interesse": [],
  "marchi_attuali": [],
  "note_commerciali": "",
  "followup_data": "",
  "followup_azione": "",
  "materiale_consegnato": [],
  "qualita_estrazione": "",
  "campi_da_verificare": []
}
Regole:
- Se un dato non è leggibile, lascia stringa vuota.
- Se un dato è incerto, inseriscilo anche in campi_da_verificare.
- Non inventare dati.
- Normalizza telefoni ed email.
- Interpreta abbreviazioni commerciali come MEC, F26, smontagomme, equilibratrice, ponte, assetto.
- La scrittura a mano deve essere interpretata come note commerciali.`

// Schema vuoto: garantisce che il form abbia sempre tutti i campi.
export const EMPTY_LEAD = {
  nome: '',
  cognome: '',
  azienda: '',
  ruolo: '',
  telefono: '',
  email: '',
  pec: '',
  indirizzo: '',
  citta: '',
  provincia: '',
  categoria_visitatore: '',
  macchine_interesse: [],
  marchi_attuali: [],
  note_commerciali: '',
  followup_data: '',
  followup_azione: '',
  materiale_consegnato: [],
  qualita_estrazione: '',
  campi_da_verificare: []
}

// Estrae il primo blocco JSON valido da una risposta testuale.
function parseJsonLoose(text) {
  if (!text) throw new Error('Risposta AI vuota')
  let t = text.trim()
  // rimuove eventuali fence markdown ```json ... ```
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Nessun JSON nella risposta AI')
  return JSON.parse(t.slice(start, end + 1))
}

// Normalizza il risultato sullo schema atteso.
function normalize(raw) {
  const out = { ...EMPTY_LEAD }
  for (const k of Object.keys(EMPTY_LEAD)) {
    if (raw[k] === undefined || raw[k] === null) continue
    if (Array.isArray(EMPTY_LEAD[k])) {
      out[k] = Array.isArray(raw[k])
        ? raw[k].map(String)
        : String(raw[k])
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
    } else {
      out[k] = String(raw[k])
    }
  }
  return out
}

// dataUrl -> { mimeType, base64 }
function splitDataUrl(dataUrl) {
  const m = /^data:(.+?);base64,(.*)$/.exec(dataUrl)
  if (!m) throw new Error('Immagine non valida')
  return { mimeType: m[1], base64: m[2] }
}

async function callGemini({ apiKey, model, base64, mimeType }) {
  const m = model || 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }
      ],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    })
  })
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`Gemini ${res.status}: ${e.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  return parseJsonLoose(text)
}

async function callOpenAI({ apiKey, model, dataUrl }) {
  const m = model || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: m,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  })
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`OpenAI ${res.status}: ${e.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  return parseJsonLoose(text)
}

// API pubblica: analizza un'immagine (dataUrl) usando le impostazioni fornite.
export async function extractFromImage(dataUrl, settings) {
  if (!settings?.apiKey) {
    throw new Error('API key mancante. Vai in Impostazioni e inseriscila.')
  }
  const { base64, mimeType } = splitDataUrl(dataUrl)
  let raw
  if (settings.provider === 'openai') {
    raw = await callOpenAI({
      apiKey: settings.apiKey,
      model: settings.model,
      dataUrl
    })
  } else {
    raw = await callGemini({
      apiKey: settings.apiKey,
      model: settings.model,
      base64,
      mimeType
    })
  }
  return normalize(raw)
}
