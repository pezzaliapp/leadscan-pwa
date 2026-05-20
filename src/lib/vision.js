// vision.js - invio immagine alla AI Vision configurata e parsing JSON.
// La API key viene letta dalle impostazioni (localStorage), MAI dal codice.
//
// AGGIORNATO: gestione automatica errori 503/overload con:
//   - retry con exponential backoff (3 tentativi)
//   - fallback automatico su modello secondario se il primario resta sovraccarico
//   - messaggi di errore leggibili in italiano

import { FALLBACK_MODEL } from './storage.js'

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
- Se un dato non e leggibile, lascia stringa vuota.
- Se un dato e incerto, inseriscilo anche in campi_da_verificare.
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

// Pausa async (ms).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Errori "transitori" su cui ha senso fare retry o fallback.
// 503 = overload, 429 = rate limit, 500/502/504 = errori server temporanei.
function isTransientStatus(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

// Errore arricchito con status code, per logica di retry.
class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// ---- Chiamata Gemini singola (un solo tentativo) ----
async function callGeminiOnce({ apiKey, model, base64, mimeType }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
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
    throw new ApiError(`Gemini ${res.status}: ${e.slice(0, 200)}`, res.status)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  return parseJsonLoose(text)
}

// ---- Chiamata Gemini con retry + fallback su altro modello ----
// Strategia:
//   1. Prova il modello primario fino a MAX_ATTEMPTS volte con backoff esponenziale.
//   2. Se dopo i tentativi e ancora 503/429, passa al modello di fallback (1 tentativo).
//   3. Errori non-transienti (400, 403, 404) si propagano subito: ritentare non serve.
async function callGemini({ apiKey, model, base64, mimeType }) {
  const primary = model || 'gemini-2.5-flash-lite'
  const MAX_ATTEMPTS = 3
  const BASE_DELAY_MS = 1200  // 1.2s, poi 2.4s, poi 4.8s

  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce({ apiKey, model: primary, base64, mimeType })
    } catch (err) {
      lastErr = err
      const status = err?.status
      // Errori "definitivi": stop subito, non ha senso ritentare
      if (!isTransientStatus(status)) throw err
      // Ultimo tentativo: esci dal loop, andiamo al fallback
      if (attempt === MAX_ATTEMPTS) break
      // Backoff con jitter (+/- 30%) per non sincronizzarci ai picchi
      const jitter = 0.7 + Math.random() * 0.6
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1) * jitter)
    }
  }

  // Tentativo finale: modello di fallback (se diverso)
  const fb = FALLBACK_MODEL.gemini?.[primary]
  if (fb && fb !== primary) {
    try {
      return await callGeminiOnce({ apiKey, model: fb, base64, mimeType })
    } catch (err) {
      // Se anche il fallback fallisce, restituiamo un errore esplicativo
      throw new ApiError(
        `Gemini sovraccarico. Provato ${primary} e fallback ${fb}. Riprova tra qualche minuto.`,
        err?.status || 503
      )
    }
  }
  throw lastErr
}

// ---- OpenAI singolo tentativo ----
async function callOpenAIOnce({ apiKey, model, dataUrl }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
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
    throw new ApiError(`OpenAI ${res.status}: ${e.slice(0, 200)}`, res.status)
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  return parseJsonLoose(text)
}

// ---- OpenAI con retry + fallback (stessa strategia di Gemini) ----
async function callOpenAI({ apiKey, model, dataUrl }) {
  const primary = model || 'gpt-4o-mini'
  const MAX_ATTEMPTS = 3
  const BASE_DELAY_MS = 1200

  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callOpenAIOnce({ apiKey, model: primary, dataUrl })
    } catch (err) {
      lastErr = err
      if (!isTransientStatus(err?.status)) throw err
      if (attempt === MAX_ATTEMPTS) break
      const jitter = 0.7 + Math.random() * 0.6
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1) * jitter)
    }
  }

  const fb = FALLBACK_MODEL.openai?.[primary]
  if (fb && fb !== primary) {
    try {
      return await callOpenAIOnce({ apiKey, model: fb, dataUrl })
    } catch (err) {
      throw new ApiError(
        `OpenAI sovraccarico. Provato ${primary} e fallback ${fb}. Riprova tra qualche minuto.`,
        err?.status || 503
      )
    }
  }
  throw lastErr
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
