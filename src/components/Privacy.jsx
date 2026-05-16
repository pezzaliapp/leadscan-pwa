export default function Privacy() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-100">
          Privacy
        </h1>
      </div>

      <div className="bg-ink-800 border border-ink-600 rounded-2xl p-5 text-[15px] leading-relaxed text-zinc-300">
        Le immagini e i dati restano sul dispositivo, salvo quando l’utente
        avvia volontariamente l’analisi AI. Nessun account, nessun tracking,
        nessun cookie.
      </div>

      <div className="space-y-3 text-sm text-ink-500 leading-relaxed">
        <p>
          <span className="text-zinc-400 font-semibold">Archiviazione.</span> I
          lead e le foto sono salvati localmente nel browser (IndexedDB /
          localStorage). Disinstallando la PWA o cancellando i dati del browser
          i lead vengono rimossi.
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Analisi AI.</span> Solo
          quando premi “Analizza con AI” l’immagine viene inviata al provider
          che hai configurato (Gemini o OpenAI) usando la tua API key. Vale la
          privacy policy del provider scelto.
        </p>
        <p>
          <span className="text-zinc-400 font-semibold">Export.</span> Il CSV è
          generato sul dispositivo e scaricato localmente: nessun invio a
          server esterni.
        </p>
      </div>
    </div>
  )
}
