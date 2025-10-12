function buildInspirationPrompt({ biome, teamSize, resources, theme, constraints }) {
  return [
    "Rolle:",
    `Du bist ein erfahrener Minecraft-Architekt und leitest ein Team von ${teamSize} autonomen Bau-Bots.`,
    "",
    "Kontext:",
    `Biome: ${biome}.`,
    `Verfügbare Ressourcen (Kurzüberblick): ${resources}.`,
    `Theme/Setting: ${theme || "kein spezielles Theme"}.`,
    "",
    "Aufgabe:",
    "Generiere 3 unterschiedliche, thematisch passende Bauprojekte. Für jedes Projekt liefere:",
    "1) Einen prägnanten Namen",
    "2) Hauptzweck",
    "3) Kernmaterialien (kurze Liste, priorisiert nach vorhandenen Ressourcen)",
    "4) Eine besondere architektonische Herausforderung",
    "5) Eine grobe Schrittfolge (Mid-Level-Schritte), die gut für eine Bot-Koordinierung geeignet ist",
    "",
    "Constraints:",
    constraints?.length ? `- ${constraints.join("\n- ")}` : "- Nutze vorhandene Ressourcen bevorzugt",
    "",
    "Format:",
    "Gib die Antwort als nummerierte Markdown-Liste mit klaren Unterpunkten aus.",
  ].join("\n");
}

function buildStrategyPrompt({ worldStateJson, mainGoal, horizonMinutes = 60 }) {
  return [
    "Rolle:",
    "Du bist ein strategischer KI-Koordinator für ein Team von autonomen Minecraft-Bots.",
    "",
    "Kontext (aktueller Zustand als JSON):",
    "```json",
    typeof worldStateJson === "string" ? worldStateJson : JSON.stringify(worldStateJson, null, 2),
    "```",
    "",
    "Aufgabe:",
    `Schlage einen strategischen Plan mit 4 priorisierten, hochrangigen Zielen für die nächsten ${horizonMinutes} Minuten vor.`,
    "Nutze vorhandene Aufgaben und Ressourcen effizient. Jeder Schritt soll klar begründet sein.",
    "",
    "Format (JSON):",
    `[
  {
    "ziel_name": "string",
    "begruendung": "string",
    "messbare_kriterien": ["string", "string"],
    "risiken": ["string"],
    "fallbacks": ["string"]
  }
]`,
    "",
    "Hinweis:",
    "- Gib nur valides JSON zurück (ohne zusätzliche Kommentare).",
  ].join("\n");
}

function buildTacticalFixPrompt({ failedStepDescription, errorMessage, localConstraints }) {
  return [
    "Rolle:",
    "Du bist ein präziser Fehlersucher für Bot-Pläne.",
    "",
    "Kontext (fehlgeschlagener Schritt):",
    failedStepDescription,
    "",
    "Fehlermeldung:",
    errorMessage,
    "",
    "Aufgabe:",
    "Schlage eine kleine, taktische Änderung vor, die das Problem adressiert, ohne den gesamten Plan zu verwerfen.",
    "Gib 1-2 konkrete Alternativen.",
    "",
    "Constraints:",
    localConstraints?.length ? `- ${localConstraints.join("\n- ")}` : "- Behalte das Gesamtziel im Blick",
    "",
    "Format (Markdown):",
    "## Alternative(n)\n- Kurzbeschreibung\n- Warum es besser klappt\n- Genaue Anpassung am Schritt X",
  ].join("\n");
}

module.exports = {
  buildInspirationPrompt,
  buildStrategyPrompt,
  buildTacticalFixPrompt,
};