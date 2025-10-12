function buildReflectionPrompt({ agent, recentSummary, currentPolicy, perfSnapshot }) {
  return [
    "System: Du bist ein präziser Policy-Optimierer für Minecraft-Bots. Gib NUR valides JSON zurück.",
    "",
    `Agent: ${agent}`,
    "Recent Summary:",
    recentSummary || "(leer)",
    "",
    "Current Policy (JSON):",
    JSON.stringify(currentPolicy, null, 2),
    "",
    "Performance Snapshot (JSON):",
    JSON.stringify(perfSnapshot, null, 2),
    "",
    "Aufgabe:",
    "- Analysiere Stärken/Schwächen.",
    "- Schlage kleine, sichere Anpassungen an der Policy vor (JSON-Patch-ähnlich).",
    "- Erhöhe/reduziere skill_weights schrittweise (max ±0.25).",
    "- Passe movement.preferred_arm nur auf existierende Arme an (conservative|balanced|aggressive|scout).",
    "- Passe chat.smalltalk_rate minimal (±0.01) an.",
    "- Begrenze Änderungen; keine großen Sprünge.",
    "",
    "Format:",
    `{
      "skill_weights": {"gather": 1.1, "build": 0.9},
      "movement": {"preferred_arm": "balanced"},
      "chat": {"smalltalk_rate": 0.03},
      "risk": {"prefer_safe_paths": true}
    }`,
    "",
    "Hinweise:",
    "- Keine Kommentare, NUR JSON."
  ].join("\n");
}
module.exports = { buildReflectionPrompt };