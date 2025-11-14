# LLM-Integration (Optional)

Die LLM-Features sind **optional** und das System funktioniert auch ohne sie mit reduzierter Intelligenz.

## Modi

### 1. Vollständig aktiviert (Empfohlen)
**Gemini + Ollama**
- Maximale Intelligenz
- Adaptives Lernen
- Strategische Koordination

**Setup:**
```bash
npm install  # installiert auch @google/generative-ai
```

`.env`:
```env
GEMINI_API_KEY=your_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
```

### 2. Nur Ollama (Lokal)
**Ohne Gemini-Abhängigkeit**
- Lokales LLM für Bot-Entscheidungen
- Kein Cloud-Service nötig
- Reflection & Learning aktiv

**Setup:**
```bash
npm install --no-optional  # überspringt Gemini
```

`.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true
# GEMINI_API_KEY nicht gesetzt
```

### 3. Komplett ohne LLM
**Hardcodierte Basis-Logik**
- Crafting-System funktioniert weiterhin
- Einfache Task-Listen (explore, mine, craft)
- Kein adaptives Lernen
- Minimale Dependencies

**Setup:**
```bash
npm install --no-optional
```

`.env`:
```env
OLLAMA_ENABLED=false
# GEMINI_API_KEY nicht gesetzt
```

## Feature-Matrix

| Feature | Ohne LLM | Nur Ollama | Vollständig |
|---------|----------|------------|-------------|
| Mineflayer Bot | ✅ | ✅ | ✅ |
| Crafting-Planner | ✅ | ✅ | ✅ |
| Pathfinding | ✅ | ✅ | ✅ |
| Basic Tasks | ✅ | ✅ | ✅ |
| Intelligente Entscheidungen | ❌ | ✅ | ✅ |
| RAG/Knowledge Base | ❌ | ✅ | ✅ |
| Reflection/Learning | ❌ | ✅ | ✅ |
| Team-Koordination | ❌ | ❌ | ✅ |
| Strategische Planung | ❌ | ❌ | ✅ |

## Status-Check

Der Coordinator zeigt den LLM-Status an:

```bash
curl http://localhost:3100/healthz
```

Response:
```json
{
  "ok": true,
  "llm_enabled": true
}
```

## Fallback-Verhalten

- **Brain ohne Ollama**: Verwendet hardcodierte Task-Listen
- **Reflection ohne Ollama**: Überspringt Policy-Updates (logged warning)
- **Coordinator ohne Gemini**: Alle `/llm/*` Endpoints geben `llm_disabled` zurück
- **Knowledge Retrieval**: Funktioniert nur mit Ollama (Embeddings)

## Performance

- **Ohne LLM**: ~5MB RAM, sofortiges Startup
- **Nur Ollama**: ~2GB RAM (Ollama-Server), 100-500ms Latenz
- **Vollständig**: +Minimal overhead für Gemini API-Calls (rate-limited)
