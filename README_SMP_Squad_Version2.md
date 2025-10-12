# SMP Squad: Wissen, Crafting, Lernen, Kommunikation

Phasen
1) Wissen (RAG) – Markdown-Wissen in `data/wiki` ablegen, `npm run ingest`.
2) Crafting-Planer – nutzt minecraft-data, plant Abhängigkeiten.
3) Lernen/Memory – Episodenlog, Summaries, Prozedurale Playbooks.
4) Kommunikation – Pub/Sub-Bus, Social-Protokoll, Personas.

Prompt-Guidelines (lokales LLM)
- Rolle: „Architekt“, „Strategie-Koordinator“, „Fehlersucher“
- Kontext: Biome, Inventar, Ziele, RAG-Snippets, Episoden-Summary
- Aufgabe: konkrete Outputs (z. B. 3 Projekte, 4 Ziele, 2 Alternativen)
- Constraints: Ressourcen, Risiken, Policies
- Format: JSON (valid!) oder gegliederte Markdown-Listen