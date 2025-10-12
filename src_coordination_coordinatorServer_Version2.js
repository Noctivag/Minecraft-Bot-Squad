const express = require("express");
const dotenv = require("dotenv");
const { generateContentLimited } = require("../llm/geminiClient");
const {
  buildInspirationPrompt,
  buildStrategyPrompt,
  buildTacticalFixPrompt,
} = require("../llm/promptTemplates");

dotenv.config();

function createCoordinatorServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  // Raw prompt passthrough (enforced rate limit)
  app.post("/llm/raw", async (req, res) => {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ ok: false, error: "prompt (string) required" });
    }
    const result = await generateContentLimited(prompt);
    return res.status(result.ok ? 200 : 429).json(result);
  });

  app.post("/llm/ideas/inspiration", async (req, res) => {
    const {
      biome,
      teamSize = 5,
      resources = "wood:200, clay:100, stone:30",
      theme,
      constraints,
    } = req.body || {};
    const prompt = buildInspirationPrompt({ biome, teamSize, resources, theme, constraints });
    const result = await generateContentLimited(prompt);
    return res.status(result.ok ? 200 : 429).json(result);
  });

  app.post("/llm/plan/strategy", async (req, res) => {
    const { worldStateJson, mainGoal, horizonMinutes } = req.body || {};
    const prompt = buildStrategyPrompt({ worldStateJson, mainGoal, horizonMinutes });
    const result = await generateContentLimited(prompt);
    return res.status(result.ok ? 200 : 429).json(result);
  });

  app.post("/llm/plan/fix", async (req, res) => {
    const { failedStepDescription, errorMessage, localConstraints } = req.body || {};
    const prompt = buildTacticalFixPrompt({ failedStepDescription, errorMessage, localConstraints });
    const result = await generateContentLimited(prompt);
    return res.status(result.ok ? 200 : 429).json(result);
  });

  const port = Number(process.env.COORDINATOR_PORT || 3100);
  const server = app.listen(port, () => {
    console.log(`[Coordinator] listening on http://localhost:${port}`);
  });

  return server;
}

module.exports = { createCoordinatorServer };