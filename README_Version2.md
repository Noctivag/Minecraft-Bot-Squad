# Minecraft-Bot-Squad

Multi-bot SMP-style squad with:
- Local LLM (Ollama) + internal knowledge base (RAG)
- Coordinator service with Gemini API (capped to 4 calls/hour)
- Crafting planner using minecraft-data
- Plan validator and robust mineflayer integrations (mcData init, reconnect backoff, graceful shutdown)
- Learning: per-bot policies in SQLite, movement tuner (UCB1), reflection loop (LLM JSON patches)
- Internal comms bus + personas for more human-like behavior

## Quick start

1) Install dependencies
```bash
npm install
```

2) Configure environment
- Copy `.env.example` to `.env` and fill in your keys/paths (Gemini API key, Ollama base URL, DB path).

3) Seed database structures
```bash
npm run migrate
```

4) (Optional) Ingest wiki knowledge for RAG
```bash
npm run ingest
```

5) Run the coordinator (Gemini endpoints + rate limiting)
```bash
npm start
```

6) Start reflection cron (policy evolution)
```bash
npm run reflect
```

See:
- README_Gemini_Integration.md for coordinator endpoints and prompt guidelines.
- README_SMP_Squad.md for knowledge, crafting, memory, and comms.
- README_Evolving_Agents.md for autonomous learning and policy tuning.

## License
MIT