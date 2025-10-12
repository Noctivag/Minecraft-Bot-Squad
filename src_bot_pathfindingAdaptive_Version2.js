const { applyAdaptiveMovements } = require("../learning/movementTuner");
const { bus, Topics } = require("../comms/bus");
const { getCurrentPolicy } = require("../learning/policyStore");

function setupAdaptivePathfinding(bot, agent) {
  const { arm } = applyAdaptiveMovements(bot, agent);
  console.log(`[${agent}] Movement arm selected: ${arm}`);

  const unsub = bus.subscribe(Topics.PLAN_FEEDBACK, (msg) => {
    if (msg?.type === "policy_updated" && msg.agent === agent) {
      const policy = getCurrentPolicy(agent);
      if (policy.movement?.preferred_arm) {
        applyAdaptiveMovements(bot, agent);
        console.log(`[${agent}] Policy update applied (movement)`);
      }
    }
  });

  bot.once("end", () => unsub && unsub());
}

module.exports = { setupAdaptivePathfinding };