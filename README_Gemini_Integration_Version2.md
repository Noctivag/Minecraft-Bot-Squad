# Gemini-Integration (4 Calls pro Stunde, zentraler Koordinator)

## Setup
1. Abhängigkeiten
   ```bash
   npm i
   ```
2. Environment
   - `.env` anlegen, basierend auf `.env.example`

3. Start
   ```bash
   npm start
   ```
   Koordinator läuft auf `http://localhost:3100`

## Endpunkte
- `POST /llm/raw` – direkter Prompt
  Payload: `{ "prompt": "..." }`
- `POST /llm/ideas/inspiration`
- `POST /llm/plan/strategy`
- `POST /llm/plan/fix`

Antwort enthält:
```json
{ "ok": true, "text": "...", "remaining": 3, "resetInMs": 3540000 }
```
Oder:
```json
{ "ok": false, "reason": "rate_limited", "remaining": 0, "resetInMs": 123456 }
```

## Prompt-Guidelines
- Rolle, Kontext, Aufgabe, Constraints, Format (JSON oder klar strukturierte Markdown-Listen).
- Nur valides JSON anfordern, wenn maschinell weiterverarbeitet wird.