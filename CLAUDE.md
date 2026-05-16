# CLAUDE.md — Contesto progetto per Claude Code

> Leggi questo file prima di lavorare. Descrive cos'è LeadScan PWA, come è
> strutturata e quali regole seguire. Lavora **solo** dentro questa cartella.

## Cos'è

LeadScan PWA: web app installabile su iPhone per fotografare schede fiera +
biglietti da visita, estrarre i dati commerciali con AI Vision e salvarli in
una lista lead esportabile in CSV. **Offline-first, nessun backend, nessun
account, nessun tracking.** Pensata per uso rapido in fiera (officina:
equilibratrici, smontagomme, sollevatori, assetto, ecc.).

## Stack

- React 18 + Vite 5 (`base: "./"` per GitHub Pages)
- Tailwind CSS 3 (config in `tailwind.config.js`)
- IndexedDB con fallback automatico a localStorage
- Service worker (`public/sw.js`) network-first per funzionare offline
- Deploy automatico via GitHub Actions su GitHub Pages

## Struttura

```
src/
  main.jsx              entry + registrazione service worker
  App.jsx               stato globale, navigazione a tab, flusso scansione
  index.css             Tailwind + classi .btn-primary/.field-input/.nav-tab
  lib/
    vision.js           chiamata AI (Gemini + OpenAI), prompt, parsing JSON
    storage.js          IndexedDB + fallback localStorage; settings AI
    exportCsv.js        export CSV (separatore ;, BOM UTF-8 per Excel)
  components/
    CameraCapture.jsx   scatto/galleria, resize immagine, preview
    LeadForm.jsx        form di verifica modificabile
    LeadList.jsx        lista + ricerca + elimina + apri
    Settings.jsx        provider/API key/modello (solo localStorage)
    Privacy.jsx         testo privacy
public/
  manifest.json  sw.js  icon-192.png  icon-512.png
.github/workflows/deploy.yml   build + deploy su Pages a ogni push su main
```

## Flusso applicativo

`App.jsx` orchestra tutto con un tab attivo e un `draft`:
Scatta/Carica → `extractFromImage()` → `draft` valorizzato → `LeadForm` →
`saveLead()` → lista. Aprire un lead esistente riusa lo stesso form (stesso
`id`, aggiornamento in place).

## Regole tassative

1. **API key**: solo `localStorage` via `storage.js`. MAI scriverla nel
   codice, in file `.env` committati, o hardcodarla per test.
2. **base path**: non rimuovere `base: "./"` da `vite.config.js`, altrimenti
   GitHub Pages si rompe.
3. **PWA**: dopo modifiche a file in `public/` ricordarsi che `sw.js` ha
   `CACHE_VERSION`; se cambi l'app-shell, incrementa la versione.
4. **Schema lead**: la fonte di verità dei campi è `EMPTY_LEAD` in
   `vision.js`. Se aggiungi un campo, aggiornalo lì **e** in `LeadForm.jsx`
   **e** nelle colonne di `exportCsv.js` (ordine colonne incluso).
5. **Lingua UI**: italiano. Mantienila.
6. **Stile**: dark elegante, accent ambra (`amber-glow`), mobile-first,
   pulsanti grandi. Usa le classi component già definite in `index.css`.
7. **Nessun backend**: non introdurre server, DB esterni o dipendenze di rete
   oltre alle API AI scelte dall'utente.

## Comandi

```bash
npm install       # dipendenze
npm run dev        # sviluppo locale
npm run build      # build di produzione in dist/
npm run preview    # anteprima build
```

Verifica sempre che `npm run build` passi prima di committare.

## Git / deploy

- Branch principale: `main`. Push su `main` → GitHub Actions builda e
  pubblica su https://pezzaliapp.github.io/leadscan-pwa/
- Committa in locale liberamente; **il `git push` lo conferma l'utente**.
- Non fare push forzati (`--force`) né riscritture di storia su `main`.
- Non eseguire comandi distruttivi fuori da questa cartella.

## Cosa NON fare

- Non creare account o gestire credenziali/segreti.
- Non aggiungere tracking, analytics, cookie.
- Non spostare/eliminare file fuori dalla cartella di progetto.
- Non cambiare provider AI di default senza richiesta esplicita.
