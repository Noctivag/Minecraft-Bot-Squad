const { setupAdaptivePathfinding } = require("../bot/pathfindingAdaptive");
const { logEvent } = require("../memory/store");
const { recordMetric } = require("../learning/metrics");

async function attachAgentRuntime(bot, agentName) {
  setupAdaptivePathfinding(bot, agentName);

  bot.on("goal_reached", () => {
    recordMetric(agentName, "move_success", 1, { pos: bot.entity.position });
    logEvent(agentName, "movement", { status: "reached", pos: bot.entity.position });
  });

  bot.on("path_update", (r) => {
    if (r.status === "noPath") {
      recordMetric(agentName, "move_timeout", 1, { from: bot.entity.position });
      logEvent(agentName, "movement", { status: "timeout" });
    }
  });

  bot.on("health", () => {
    // Optional: add damage tracking
  });
}

module.exports = { attachAgentRuntime };