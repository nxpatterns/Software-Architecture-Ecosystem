# Aider Alternatives

## Short List

**Direkte Alternativen (non-mainstream, terminal-first)**

### opencode

(opencode.ai / github.com/sst/opencode) — von den SST-Leuten (Serverless Stack). Go-Binary, TUI, model-agnostic, LSP-Integration, MCP-Support. Explizit auf Token-Bewusstsein gebaut: `plan`\-Agent ist read-only und spart massiv Tokens, `build`\-Agent nur bei Bedarf. Hat ein `max_iterations`\-Limit pro Agent. Relativ neu aber aktiv maintained.

### RTK (opencode-rtk)

Rust-Binary, CLI-Proxy der für Claude Code _und_ OpenCode Bash-Output komprimiert bevor er in den Context geht. Behauptet 60-90% Reduktion bei typischen Dev-Commands (`git status`, `ls`, `grep`, etc.). Hook-first Ansatz: rewritten commands laufen transparent durch, aber Output ist dramatisch kompakter. Das adressiert genau das "verpulvert Tokens"-Problem bei Tool-Outputs.

**Pairing-Empfehlung:** `opencode` + `rtk` — opencode für den Agenten-Loop, rtk als Proxy für alle Bash-Tool-Outputs. Das ist der direkteste Angriff auf das Token-Problem ohne auf Qualität zu verzichten.

### repomix

(github.com/yamadashy/repomix) — unterschätzt, non-mainstream. Rust-Binary, scannt das Repo und erstellt eine komprimierte, strukturierte Zusammenfassung als einzelne Datei (XML/MD/plain). Gedacht als Input für LLMs.

```bash
repomix --include "src/components/**,src/routes/**" --output patterns.md
```

Workflow: einmalig `repomix` auf relevante Verzeichnisse laufen lassen → Output reviewen → daraus `CLAUDE.md`\-Pattern-Regeln destillieren (einmalig mit einem LLM-Call). Das ist **einmalige Arbeit**, keine laufenden Token-Kosten.
