# Multi-Agent-Orchestration

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Allgemein](#allgemein)
- [Warp/Oz-Sprache](#warpoz-sprache)
- [Faustregel](#faustregel)

<!-- /code_chunk_output -->

## Allgemein

> Frage: „Kann ich die Prüfung in die Programmierung einbetten, von einem anderen Agent bei einem laufenden Prozess?“

Die Überprüfung kann (teilweise) mitprogrammiert werden. Nur: ein zweiter Agent ersetzt dich nicht vollständig als finale Qualitätsinstanz. Er ersetzt vor allem den billigen, wiederholbaren Teil der Kontrolle.

```plaintext
Worker macht etwas
    → Checker prüft gegen Kriterien
        → fail: zurück an Worker (mit Befund)
        → pass: fertig / nächste Stufe
```

Das ist ein bekanntes Muster aus Multi-Agent-Systemen.

- **Agentic Loop:**	Meist der innere Kreislauf eines Agents: denken → Tool → beobachten → wieder denken, bis fertig. Nicht zwingend „zweiter Agent prüft“.
- **Agentic Graph:**	(Eher Marketingig, höchstens State-Maschines)	Manchmal für Graphen aus Agent-Knoten + Kanten (Wer ruft wen?). Kein stabiler Standardbegriff.

- **Multi-agent workflow / orchestration:**	Mehrere Agents mit Rollen, oft parallel oder in Pipeline.

- **Generator–Critic / Producer–Reviewer:** Einer erzeugt, einer kritisiert. Klassiker.

- **Verifier / Judge pattern:** Explizite Prüfer-Rolle (oft mit Rubrik/Checkliste).

- **Pipeline / staged workflow:** z.B. implement → test → review → PR.
- **Fan-out / Fan-in:** Wenn parallel	Mehrere Worker, danach ein Merge/Review-Schritt.
- **Human-in-the-loop (HITL, Mensch an Gate):** Merge, Prod, Geld, Security.
- **Guardrails / evals:** angrenzend	Automatische Checks (Tests, Linter, Policies) — oft ohne LLM.

Umgangssprachlich sagen Leute oft **„Agentic Loop“**, meinen aber eigentlich: orchestrierter Multi-Agent-Workflow mit Verify-Schritt. Präziser:

> Orchestrated multi-agent pipeline mit Generator–Critic (und optional Human gate)

## Warp/Oz-Sprache

In Warp/Oz-Sprache ist das nah an: Orchestrator + Child Agents (einer baut, einer reviewed), plus normale Qualitätstore (Tests, CI).

Warp selbst betont bei Code Review übrigens bewusst: Interactive Code Review hält den Entwickler in der Kontrolle — AI-reviewt-AI ist möglich, aber nicht das Produktversprechen als Ersatz für dich.

Was man sinnvoll „einbettet“

Nicht „ein Agent schaut drüber und sagt LGTM“, sondern Schichten:

1. Objektive Gates (kein zweiter LLM nötig)

- Unit/Integrationstests
- lint / typecheck / build
- diff gegen erlaubte Dateien
- Security-Scanner, Format-Check

Das ist die härteste Verifikation. Programmierung = Exit-Codes in der Pipeline.

2. Zweiter Agent als Critic (LLM-Verify)
Eigener Prompt/Skill, z.B.:

- „Prüfe Diff nur gegen Acceptance Criteria X/Y/Z“
- „Suche Regressionen, fehlende Tests, Secrets, Breaking API“
- Output strukturiert: PASS | FAIL + konkrete Findings

Wichtig: andere Rolle, andere Anweisung, idealerweise:

- kein Anreiz „hilfreich den Worker zu verteidigen“
- klare Fail-Kriterien
- nur lesen / kommentieren, nicht heimlich mitbauen (sonst kollabieren die Rollen)

3. Schleife bis grün oder Limit

```plaintext
for attempt in 1..N:
  worker → changes
  automated checks → fail? back to worker
  critic agent → fail? back to worker with comments
human final review → merge
```

Das ist der äußere Loop (Workflow-Loop), nicht nur der innere Tool-Loop eines Agents.

4. Du als letztes Gate
Sinnvoll bleibst du bei:

- Produkt-/Domain-Urteil
- riskante Infra (Prod, Daten, Secrets)
- „Ist das die richtige Lösung?“ vs. „Laufen die Checks?“

Was der Critic gut / schlecht kann

Gut automatisierbar

- „Tests grün? Diff scope eingehalten?“
- „Fehlerbehandlung fehlt hier?“
- „PR-Beschreibung vs. tatsächlicher Diff“
- Checklisten aus eurem Style-Guide

Schlecht als alleinige Wahrheit

- gemeinsamer Blindflug (beide Modelle übersehen dasselbe)
- „sieht sauber aus“ ohne Ausführung
- Geschäftsregeln, die nicht im Prompt/Repo stehen
- Bestätigungshaltung, wenn Critic zu weich gepromptet ist

Deshalb: Critic + automatische Checks, nicht Critic statt Checks.

Mini-Architektur (programmierbar)

```plaintext
[Trigger: CLI/CI/Cron]
        │
        ▼
   Orchestrator
      /        \
 Worker      (später)
  implement     \
      │          \
      ▼           ▼
  Test/Lint    Critic-Agent
      \           /
       \         /
        ▼       ▼
      Gate: all green?
       │ no → feedback → Worker
       │ yes
       ▼
  Artifact (branch/PR)
       │
       ▼
  Human review (du)
```

Per Oz CLI grob: ein Run (oder Child-Agents) für Implementierung, ein zweiter mit Review-Prompt auf denselben Diff/PR, Abbruch über Test-Exit-Codes. Das ist Workflow-Orchestrierung, nicht magisch „Agentic Graph“.

## Faustregel

- Inner loop = ein Agent arbeitet.
- Outer loop = System prüft und schickt zurück.
- Zweiter Agent = optionaler Critic im Outer loop.
- Tests/CI = nicht-optionale Wahrheitsschicht.
- Du = Gate für Bedeutung und Risiko.
