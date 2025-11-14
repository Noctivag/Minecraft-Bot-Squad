/**
 * Agent Runtime - Attach runtime behavior to bot
 * Handles events, metrics, and logging
 */

const { logEvent } = require("../memory/store");
const { recordMetric } = require("../learning/metrics");

/**
 * Attach agent runtime to a bot
 * @param {object} bot - Mineflayer bot instance
 * @param {string} agentName - Agent name
 */
async function attachAgentRuntime(bot, agentName) {
  // Track successful movements
  bot.on("goal_reached", () => {
    recordMetric(agentName, "move_success", 1, {
      pos: bot.entity?.position
    });
    logEvent(agentName, "movement", {
      status: "reached",
      pos: bot.entity?.position
    });
  });

  // Track failed movements
  bot.on("path_update", (result) => {
    if (result && result.status === "noPath") {
      recordMetric(agentName, "move_timeout", 1, {
        from: bot.entity?.position
      });
      logEvent(agentName, "movement", {
        status: "timeout"
      });
    }
  });

  // Track health changes
  bot.on("health", () => {
    const health = bot.health;
    const food = bot.food;

    recordMetric(agentName, "health", health, { food });

    if (health < 10) {
      logEvent(agentName, "health", {
        status: "low",
        health,
        food
      });
    }
  });

  // Track spawn
  bot.once("spawn", () => {
    logEvent(agentName, "lifecycle", {
      status: "spawned",
      pos: bot.entity?.position
    });
  });

  // Track kicks/disconnects
  bot.on("kicked", (reason) => {
    logEvent(agentName, "lifecycle", {
      status: "kicked",
      reason: reason
    });
  });

  bot.on("end", (reason) => {
    logEvent(agentName, "lifecycle", {
      status: "disconnected",
      reason: reason
    });
  });

  // Track errors
  bot.on("error", (err) => {
    logEvent(agentName, "error", {
      message: err.message,
      stack: err.stack
    });
  });
}

module.exports = { attachAgentRuntime };
