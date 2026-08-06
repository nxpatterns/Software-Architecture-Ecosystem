# Beispiel: Oz-Agent-Workflow mit einfacher Validierung

Dieses Dokument zeigt einen **programmierbaren Multi-Stage-Workflow**:

1. **Worker-Agent** setzt eine Aufgabe um
2. **Objektive Gates** (Tests / Lint / Datei-Checks) prüfen hart
3. Optional: **Critic-Agent** prüft den Diff gegen Acceptance Criteria
4. Bei Fehler: Feedback zurück an den Worker (begrenzte Retries)
5. Bei Erfolg: Branch/PR-ready Artifact

> **Voraussetzungen**
>
> - Oz CLI installiert (`oz` im PATH)
> - Auth: `oz login` **oder** `export WARP_API_KEY="wk-..."`
> - Git-Repo als Arbeitsverzeichnis
> - Optional: Agent-Profil-ID für lokale Runs (`oz agent profile list`)

## Architektur (Generator → Verify → Retry)

```text
[start]
   │
   ▼
 Worker (oz agent run)
   │
   ▼
 Automated checks (exit codes)
   │ fail ──────────────────────┐
   ▼ pass                       │
 Critic (optional, oz agent run)│
   │ fail ──────────────────────┤
   ▼ pass                       │
 SUCCESS                        │
   ▲                            │
   └──────── retry < max ───────┘
```

Das ist **kein** spezieller Produktname, sondern ein **Generator–Critic / Verify-Pipeline** mit Outer Loop.

## Dateien im Beispiel

Lege die folgenden Dateien z.B. unter `./scripts/agent-workflow/` in einem Demo-Repo ab.

| Datei | Rolle |
| --- | --- |
| `run-validated-workflow.sh` | Orchestrierung + Retry-Loop |
| `checks.sh` | Harte Validierung (ohne LLM) |
| `prompts/worker.md` | Worker-Auftrag |
| `prompts/critic.md` | Critic-Rubrik |
| `fixtures/tiny-app/` | Mini-Zielprojekt zum Demo |

## 1. Mini-Zielprojekt (Fixture)

`fixtures/tiny-app/sum.js`

```js
// Absichtlich simpel – der Worker soll z.B. multiply ergänzen / Bugs fixen.
function add(a, b) {
  return a + b;
}

module.exports = { add };
```

`fixtures/tiny-app/sum.test.js`

```js
const assert = require("assert");
const { add, multiply } = require("./sum");

assert.strictEqual(add(2, 3), 5);

// Worker-Ziel: multiply implementieren, damit dieser Test grün wird.
assert.strictEqual(multiply(2, 3), 6);

console.log("OK");
```

`fixtures/tiny-app/package.json`

```json
{
  "name": "tiny-app",
  "private": true,
  "scripts": {
    "test": "node sum.test.js"
  }
}
```

## 2. Harte Checks (ohne LLM)

`scripts/agent-workflow/checks.sh`

```bash
#!/usr/bin/env bash
# Objektive Validierung – Exit 0 = pass, sonst fail.
set -euo pipefail

ROOT="${1:-.}"
APP="$ROOT/fixtures/tiny-app"
REPORT_DIR="${REPORT_DIR:-$ROOT/.workflow-reports}"
mkdir -p "$REPORT_DIR"

fail() {
  echo "CHECK FAIL: $*" | tee -a "$REPORT_DIR/checks.log"
  exit 1
}

echo "== checks: working tree sanity ==" | tee "$REPORT_DIR/checks.log"

# 1) Nur erlaubte Pfade geändert? (einfache Policy)
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  mapfile -t CHANGED < <(git -C "$ROOT" status --porcelain | awk '{print $2}')
  for f in "${CHANGED[@]:-}"; do
    [[ -z "${f:-}" ]] && continue
    case "$f" in
      fixtures/tiny-app/*|.workflow-reports/*|scripts/agent-workflow/*) ;;
      *) fail "Änderung außerhalb Allowlist: $f" ;;
    esac
  done
fi

# 2) Keine Secrets-Patterns im Diff (sehr grob)
if command -v git >/dev/null 2>&1; then
  if git -C "$ROOT" diff -- fixtures/tiny-app | grep -Eiq 'api[_-]?key|secret|BEGIN RSA PRIVATE KEY'; then
    fail "Mögliches Secret im Diff"
  fi
fi

# 3) Unit test
echo "== checks: unit tests ==" | tee -a "$REPORT_DIR/checks.log"
(
  cd "$APP"
  npm test
) | tee -a "$REPORT_DIR/checks.log"

echo "CHECK PASS" | tee -a "$REPORT_DIR/checks.log"
```

## 3. Prompts

### Worker — `scripts/agent-workflow/prompts/worker.md`

```markdown
# Rolle
Du bist der Worker. Du implementierst. Du reviewst nicht abschließend.

# Kontext
Mini-Projekt unter `fixtures/tiny-app/`.
`sum.js` exportiert bisher nur `add`.
`sum.test.js` erwartet zusätzlich `multiply(a, b)`.

# Auftrag
1. Implementiere `multiply` in `sum.js` und exportiere sie.
2. Stelle sicher, dass `npm test` im Ordner `fixtures/tiny-app` grün ist.
3. Ändere keine Dateien außerhalb von `fixtures/tiny-app/`.
4. Keine Secrets, kein Refactoring außerhalb des Auftrags.

# Falls Feedback existiert
Lies `.workflow-reports/latest-feedback.md` (falls vorhanden) und behobe genau diese Punkte.

# Done-Kriterien
- `npm test` exit 0
- Diff nur unter `fixtures/tiny-app/`
```

### Critic — `scripts/agent-workflow/prompts/critic.md`

```markdown
# Rolle
Du bist der Critic/Verifier. Du implementierst NICHT.
Du darfst Dateien lesen und einen Report schreiben, aber keinen Fix committen/coden.

# Prüfe gegen diese Acceptance Criteria
1. `multiply(a,b)` existiert und ist korrekt (Produkt, nicht Summe).
2. `add` ist nicht kaputt.
3. Tests sind sinnvoll grün (kein Test-Löschen / kein `assert` entfernen).
4. Scope: nur `fixtures/tiny-app/`.
5. Kein offensichtlicher Schrott (z.B. `multiply` hardcoded auf 6).

# Output (PFLICHT)
Schreibe genau nach `.workflow-reports/critic-result.md` mit diesem Format:

VERDICT: PASS
oder
VERDICT: FAIL

Danach eine kurze Liste:
- [ ] finding ...

Wenn FAIL: Formuliere actionable Fix-Anweisungen für den Worker.
Wenn PASS: kurz begründen.
```

## 4. Orchestrierungs-Skript

`scripts/agent-workflow/run-validated-workflow.sh`

```bash
#!/usr/bin/env bash
# Demonstriert: Worker → harte Checks → optional Critic → Retry-Loop
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$ROOT/.workflow-reports"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"
USE_CRITIC="${USE_CRITIC:-1}"          # 0 = nur checks.sh
PROFILE_FLAG=()
DRY_RUN="${DRY_RUN:-0}"               # 1 = keine oz-calls, nur Loop-Gerüst

# Optional: oz agent profile list → ID hier oder per Env
if [[ -n "${OZ_PROFILE_ID:-}" ]]; then
  PROFILE_FLAG=(--profile "$OZ_PROFILE_ID")
fi

mkdir -p "$REPORT_DIR"
: >"$REPORT_DIR/workflow.log"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$REPORT_DIR/workflow.log"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1" >&2
    exit 127
  }
}

run_worker() {
  local attempt="$1"
  local prompt_file="$REPORT_DIR/worker-prompt-attempt-${attempt}.md"

  cat "$SCRIPT_DIR/prompts/worker.md" >"$prompt_file"
  if [[ -f "$REPORT_DIR/latest-feedback.md" ]]; then
    {
      echo
      echo "# Feedback aus vorherigem Versuch"
      cat "$REPORT_DIR/latest-feedback.md"
    } >>"$prompt_file"
  fi

  log "Worker attempt $attempt"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN: skip oz worker"
    # Demo-Fallback: absichtlich kaputt lassen beim 1. Versuch, dann „fixen“
    if [[ "$attempt" -ge 2 ]]; then
      cat >"$ROOT/fixtures/tiny-app/sum.js" <<'EOF'
function add(a, b) {
  return a + b;
}
function multiply(a, b) {
  return a * b;
}
module.exports = { add, multiply };
EOF
    fi
    return 0
  fi

  require_cmd oz
  # Prompt als Dateiinhalt übergeben
  oz agent run \
    "${PROFILE_FLAG[@]}" \
    --prompt "$(cat "$prompt_file")"
}

run_checks() {
  log "Running automated checks"
  REPORT_DIR="$REPORT_DIR" bash "$SCRIPT_DIR/checks.sh" "$ROOT"
}

run_critic() {
  log "Running critic agent"
  local critic_prompt="$REPORT_DIR/critic-prompt.md"
  cat "$SCRIPT_DIR/prompts/critic.md" >"$critic_prompt"

  if [[ "$DRY_RUN" == "1" ]]; then
    # Im DRY_RUN: Critic spiegelt checks – wenn tests grün wären, PASS
    if (cd "$ROOT/fixtures/tiny-app" && npm test >/dev/null 2>&1); then
      cat >"$REPORT_DIR/critic-result.md" <<'EOF'
VERDICT: PASS
- multiply vorhanden und Tests grün (dry-run heuristic)
EOF
    else
      cat >"$REPORT_DIR/critic-result.md" <<'EOF'
VERDICT: FAIL
- multiply fehlt oder Tests rot. Bitte multiply(a,b)=a*b exportieren und Tests nicht abschwächen.
EOF
    fi
    return 0
  fi

  require_cmd oz
  oz agent run \
    "${PROFILE_FLAG[@]}" \
    --prompt "$(cat "$critic_prompt")"
}

parse_critic_verdict() {
  local f="$REPORT_DIR/critic-result.md"
  [[ -f "$f" ]] || { echo "FAIL"; return; }
  if grep -Eq '^VERDICT:[[:space:]]*PASS\b' "$f"; then
    echo "PASS"
  else
    echo "FAIL"
  fi
}

compose_feedback() {
  local attempt="$1"
  {
    echo "# Feedback after attempt $attempt"
    echo
    echo "## Automated checks log (tail)"
    tail -n 80 "$REPORT_DIR/checks.log" 2>/dev/null || echo "(no checks log)"
    echo
    if [[ -f "$REPORT_DIR/critic-result.md" ]]; then
      echo "## Critic"
      cat "$REPORT_DIR/critic-result.md"
    fi
  } >"$REPORT_DIR/latest-feedback.md"
  cp "$REPORT_DIR/latest-feedback.md" "$REPORT_DIR/feedback-attempt-${attempt}.md"
}

main() {
  log "Root=$ROOT max_attempts=$MAX_ATTEMPTS use_critic=$USE_CRITIC dry_run=$DRY_RUN"

  # Sanity: fixture existiert
  [[ -d "$ROOT/fixtures/tiny-app" ]] || {
    echo "Fixture missing: $ROOT/fixtures/tiny-app" >&2
    exit 1
  }

  local attempt=1
  while (( attempt <= MAX_ATTEMPTS )); do
    log "======== ATTEMPT $attempt/$MAX_ATTEMPTS ========"
    run_worker "$attempt"

    if ! run_checks; then
      log "Automated checks FAILED"
      compose_feedback "$attempt"
      attempt=$((attempt + 1))
      continue
    fi
    log "Automated checks PASSED"

    if [[ "$USE_CRITIC" == "1" ]]; then
      run_critic
      verdict="$(parse_critic_verdict)"
      log "Critic verdict: $verdict"
      if [[ "$verdict" != "PASS" ]]; then
        compose_feedback "$attempt"
        attempt=$((attempt + 1))
        continue
      fi
    fi

    log "WORKFLOW SUCCESS"
    cat >"$REPORT_DIR/SUCCESS.md" <<EOF
# Workflow success
- attempts: $attempt
- time: $(date -Iseconds)
- critic: $USE_CRITIC
EOF
    exit 0
  done

  log "WORKFLOW FAILED after $MAX_ATTEMPTS attempts"
  compose_feedback "final"
  exit 1
}

main "$@"
```

## 5. Ausführung

```bash
# Im Repo-Root
chmod +x scripts/agent-workflow/*.sh

# A) Nur die Mechanik ohne oz (empfohlen zum Verstehen des Loops)
DRY_RUN=1 MAX_ATTEMPTS=3 ./scripts/agent-workflow/run-validated-workflow.sh

# B) Echter Worker + Checks, ohne Critic-LLM
USE_CRITIC=0 ./scripts/agent-workflow/run-validated-workflow.sh

# C) Voller Flow mit Critic
export OZ_PROFILE_ID="YOUR_PROFILE_ID"   # optional
./scripts/agent-workflow/run-validated-workflow.sh

# Reports
ls -la .workflow-reports/
```

### Erwartetes Verhalten im `DRY_RUN`

| Attempt | Worker-Simulation | Checks | Critic |
| --- | --- | --- | --- |
| 1 | `multiply` fehlt noch | FAIL | — / Feedback |
| 2 | `multiply` wird geschrieben | PASS | PASS |
| Ende | `SUCCESS.md` | | |

## 6. Was hier „Validierung“ ist – bewusst zweistufig

### Stufe A — deterministisch (`checks.sh`)

- Exit-Codes, Allowlist, Secret-Grep, `npm test`
- **Quelle der Wahrheit** für „läuft es?“

### Stufe B — agentisch (Critic)

- Semantik / Schummeln / Scope / sinnvolle Implementierung
- **Unterstützung**, kein Ersatz für Tests
- Output bewusst maschinenlesbar: `VERDICT: PASS|FAIL`

### Outer Loop

- Feedback-Datei → nächster Worker-Lauf
- `MAX_ATTEMPTS` verhindert Endlosschleifen

Das ist die **programmierbare Überprüfung**: nicht „Hoffnung auf einen smarten Agenten“, sondern **Gate-Logik in Bash** + optionale Critic-Stufe.

## 7. Varianten für den Alltag

### CI (GitHub Actions-Skizze)

```yaml
# .github/workflows/agent-fix.yml (Skizze)
jobs:
  agent-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Oz CLI
        run: echo "Install oz + auth via WARP_API_KEY secret"
      - name: Run validated workflow
        env:
          WARP_API_KEY: ${{ secrets.WARP_API_KEY }}
          USE_CRITIC: "1"
          MAX_ATTEMPTS: "2"
        run: ./scripts/agent-workflow/run-validated-workflow.sh
```

### Cloud statt lokal

Ersetze Worker-Schritt konzeptionell durch:

```bash
oz agent run-cloud \
  --environment "$ENV_ID" \
  --prompt "$(cat prompts/worker.md)"
```

Checks können weiterhin lokal auf dem ausgecheckten Diff/PR laufen (nach `git fetch` des Agent-Branches) oder im Cloud-Environment selbst.

### Strenger Critic ohne Schreibrechte

Für den Critic ein **eigenes Agent-Profil** mit:

- Diffs apply: Never / stark eingeschränkt
- Commands: nur read-only + Report schreiben
- Eigenes Verzeichnis-Allowlist

So kollabieren Worker- und Reviewer-Rolle nicht.

## 8. Grenzen (wichtig)

| Automatisierbar | Bleibt bei dir (Human-in-the-loop) |
| --- | --- |
| Tests grün, Lint, Scope-Allowlist | Produktentscheidungen |
| „multiply ist a\*b, nicht hardcoded“ | „Wollen wir das überhaupt so?“ |
| Retry bei klarem Feedback | Merge nach Prod, Secrets, Daten |

Ein zweiter Agent **senkt Review-Last**, er **übernimmt keine Verantwortung**.

## 9. Glossar zu diesem Beispiel

| Begriff | Hier im Skript |
| --- | --- |
| Inner agentic loop | innerhalb eines `oz agent run` (Tool-Zyklen) |
| Outer workflow loop | `while attempt <= MAX_ATTEMPTS` |
| Generator / Worker | `run_worker` |
| Verifier / Critic | `run_critic` + `VERDICT` |
| Hard gate | `checks.sh` Exit-Code |
| Orchestrator | `run-validated-workflow.sh` |

## 10. Minimale Checkliste zum Anpassen an ein echtes Repo

1. `fixtures/tiny-app` durch echtes Modul ersetzen
2. `checks.sh`: echte Test-/Lint-Commands
3. Allowlist auf reale Pfade
4. Worker-/Critic-Prompts = Acceptance Criteria des Tickets
5. `MAX_ATTEMPTS` klein halten (2–3)
6. Erfolg = Branch pushen / Draft-PR öffnen (extra Schritt)
7. Du reviewst den PR weiterhin stichprobenartig
