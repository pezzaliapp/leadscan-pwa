// storage.js — persistenza lead su IndexedDB (foto incluse come base64).
// Fallback automatico a localStorage se IndexedDB non disponibile.

const DB_NAME = 'leadscan-db'
const STORE = 'leads'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('no-indexeddb'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ---- Fallback localStorage ----
const LS_KEY = 'leadscan_leads_fallback'
const lsAll = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}
const lsWrite = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr))

export async function saveLead(lead) {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(lead)
      tx.oncomplete = () => resolve(lead)
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    const arr = lsAll().filter((l) => l.id !== lead.id)
    arr.push(lead)
    lsWrite(arr)
    return lead
  }
}

export async function getAllLeads() {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () =>
        resolve(
          (req.result || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        )
      req.onerror = () => reject(req.error)
    })
  } catch {
    return lsAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

export async function deleteLead(id) {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    lsWrite(lsAll().filter((l) => l.id !== id))
    return true
  }
}

// ---- Impostazioni AI (solo localStorage, mai nel codice) ----
const SETTINGS_KEY = 'leadscan_ai_settings'

export function getSettings() {
  try {
    return (
      JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-flash'
      }
    )
  } catch {
    return { provider: 'gemini', apiKey: '', model: 'gemini-1.5-flash' }
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}
