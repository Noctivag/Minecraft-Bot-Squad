# Evolving SMP Squad (Lernen, Reflexion, adaptive Policies)

Ziele
- Bots verbessern Orientierung/Movement, Crafting, Taktik und sozialen Stil kontinuierlich.
- Lokal laufendes LLM (Ollama) reflektiert regelmäßig und schlägt JSON-Patches vor.
- Bandit-Mechanik testet Parameter-Varianten sicher (UCB1) und misst echte Erfolge.

Ablauf
1) Metriken/Events loggen
2) Movement-Tuner wählt Arm (UCB1)
3) Stündlich: Reflection Loop → JSON-Patch → Validierung → Policy-Update
4) Rollback bei Regression

Start
- `npm run migrate`
- `npm run reflect`

Sicherheit
- Nur valides JSON vom LLM
- Schema/Grenzen (Chat-Rate, Skill-Weights)
- Rollback über Versionshistorie