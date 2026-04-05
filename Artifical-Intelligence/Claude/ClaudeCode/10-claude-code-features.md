# Claude Code: 10 Features (Reviewed)

> Basiert auf einem Artikel von [@sharbel](https://x.com/sharbel/status/2040461006757892273). Ungenauigkeiten korrigiert.

## 1. `ultrathink` — Erhöhter Reasoning-Aufwand

Füge `ultrathink` in jeden Prompt ein, um **High-Effort-Modus** für diesen Turn zu aktivieren.

```plaintext
ultrathink: redesign the auth architecture to handle 10x traffic
```

**Einschränkung:** Es gibt kein separates "Ultra"-Budget über High hinaus. `ultrathink` ist ein Alias für High Effort. Für persistente Einstellung: `/effort high` oder `CLAUDE_CODE_EFFORT_LEVEL=high`.

## 2. `/btw` — Seitenfrage ohne Kontext-Kosten

Stellt eine Frage in einem flüchtigen Overlay, das **nie in die Conversation History** eingeht.

```plaintext
/btw how does token refresh work in OAuth2?
```

- Voller Einblick in den aktuellen Kontext (kann über bereits gelesene Dateien fragen)
- Kein Tool-Zugriff (kann keine neuen Dateien lesen oder Commands ausführen)
- Läuft parallel, während Claude gerade arbeitet
- Mit Space, Enter oder Esc schließen

**Wichtig:** `/btw` wurde erst in **v2.1.72 (März 2026)** eingeführt, nicht seit Jahren in den Docs versteckt.

## 3. Plan Mode + `Ctrl+G` — Plan vor Ausführung bearbeiten

Plan Mode aktivieren:

```bash
claude --permission-mode plan
# oder während Session: Shift+Tab (zweimal)
# oder: /plan
```

Claude liest die Codebase (read-only), stellt Fragen und erstellt einen Plan. Dann:

- **`Ctrl+G`** öffnet den Plan in deinem Texteditor (`$EDITOR`)
- Schritte bearbeiten, löschen, ergänzen, neu ordnen
- Plan wird in `~/.claude/plans/` gespeichert (konfigurierbar)

Danach zurück zu normalem Mode (Shift+Tab) und ausführen lassen.

## 4. Interview-Modus mit `AskUserQuestion` — Spec zuerst

```plaintext
I want to build [brief description]. Interview me in detail
using the AskUserQuestion tool. Ask about technical implementation,
edge cases, and tradeoffs I might not have considered.
Keep interviewing until we've covered everything,
then write a complete spec to SPEC.md.
```

Dann neue Session für die Implementierung starten.

## 5. Subagents für Investigation — Hauptkontext sauber halten

```plaintext
Use subagents to investigate how our authentication
system handles token refresh and whether we have any
existing OAuth utilities I should reuse.
```

Subagents laufen mit eigenem Kontextfenster. Nur die Zusammenfassung landet im Hauptkontext.

> Merkhilfe aus den Docs: `/btw` sieht alles, hat keine Tools. Subagent hat alle Tools, sieht nichts.

## 6. `.worktreeinclude` — Gitignored Files in Worktrees kopieren

Datei `.worktreeinclude` im Projekt-Root erstellen (`.gitignore`-Syntax):

```bash
.env
.env.local
config/secrets.json
```

Dateien, die dem Pattern entsprechen **und** gitignored sind, werden automatisch in jeden neuen Worktree kopiert.

**Einschränkung:** Wenn benutzerdefinierte `WorktreeCreate`-Hooks konfiguriert sind, ersetzt das das Standardverhalten und `.worktreeinclude` wird nicht verarbeitet.

## 7. `/compact Focus on X` — Gezieltes Komprimieren

Statt alles zu löschen (`/clear`) oder Claude selbst entscheiden zu lassen (`/compact`):

```plaintext
/compact Focus on the API changes and the failing tests
```

Kritischer Kontext bleibt erhalten, der Rest wird komprimiert.

## 8. `CLAUDE_CODE_EFFORT_LEVEL` — Globaler Default

In `.zshrc` oder `.bashrc`:

```bash
export CLAUDE_CODE_EFFORT_LEVEL=high
```

Alternativ pro Session: `/effort low|medium|high` oder `/effort ultrathink`.

## 9. Writer/Reviewer Pattern — Zwei Sessions, besserer Code

**Session A** implementiert:

```plaintext
Implement rate limiting for our API endpoints
```

**Session B** reviewed mit frischem Kontext:

```plaintext
Review the rate limiter in @src/middleware/rateLimiter.ts.
Look for edge cases, race conditions, and anything
inconsistent with our existing patterns.
```

Der Reviewer hat keine Bias gegenüber eigenem Code. Laut Anthropic nutzen interne Teams dieses Muster.

## 10. `--from-pr` — Session an PR knüpfen

```bash
claude --from-pr 247
```

Startet eine Session im Kontext eines GitHub-PRs, um Review-Kommentare zu adressieren.

**Einschränkung:** Der Artikel behauptet, es lade die "exakte Session mit vollständigem Kontext aller Entscheidungen". Das ist übertrieben. Es verknüpft eine Session mit dem PR, aber historischer Session-Kontext wird nicht vollständig wiederhergestellt.

## Zusammenfassung der Faktenfehler im Original

| Behauptung | Realität |
|---|---|
| `ultrathink` = "maximales Budget" | Alias für High Effort, kein separates Ultra-Level |
| `/btw` seit langem in den Docs versteckt | Erst März 2026 (v2.1.72) eingeführt |
| `--from-pr` stellt exakten historischen Kontext wieder her | Übertrieben; verknüpft Session mit PR, kein vollständiger Replay |
| Alle Features "nobody uses" | Mehrere sind neu oder gut dokumentiert, nicht versteckt |
