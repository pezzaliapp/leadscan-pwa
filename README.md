# LeadScan PWA

PWA installabile su iPhone per fotografare schede fiera e biglietti da visita,
estrarre i dati commerciali con AI Vision e salvarli in una lista lead
esportabile in CSV. **Offline-first, nessun backend, nessun tracking.**

## Stack

React + Vite · Tailwind CSS · IndexedDB (fallback localStorage) · Service
Worker · compatibile GitHub Pages (`base: "./"`).

## Funzioni

- Scatto foto (fotocamera posteriore) o caricamento da galleria, con preview
- Estrazione dati via AI Vision (Google Gemini **o** OpenAI), API key salvata
  solo in `localStorage`
- Form di verifica completo e modificabile
- Salvataggio lead con foto (base64), id e data
- Ricerca per nome, azienda, telefono, macchina, note
- Export CSV con colonne ordinate (separatore `;`, BOM UTF-8 per Excel)
- Sezione Privacy

## Sviluppo locale

```bash
npm install
npm run dev
```

## Build

```bash
npm install
npm run build      # output in dist/
npm run preview    # anteprima build
```

## Deploy su GitHub Pages

Due opzioni:

**A) Automatico (consigliato).** È incluso il workflow
`.github/workflows/deploy.yml`. Dopo il push su `main`, vai su
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
Ad ogni push il sito viene ricostruito e pubblicato su
`https://pezzaliapp.github.io/leadscan-pwa/`.

**B) Manuale con branch `gh-pages`.**

```bash
npm run build
npx gh-pages -d dist
```

## Configurazione AI

Apri la app → tab **API** → scegli provider (Gemini/OpenAI), incolla la tua
API key e scegli il modello. La chiave non è mai scritta nel codice.

## Privacy

Le immagini e i dati restano sul dispositivo, salvo quando l’utente avvia
volontariamente l’analisi AI. Nessun account, nessun tracking, nessun cookie.
