const { validatePlan } = require("../../llm/validator");

const Skills = {
  walk_to: async (ctx, { target, range = 1 }) => {
    // TODO: Integrate mineflayer pathfinder calls
    return { ok: true };
  },
  mine_block: async (ctx, { blockName }) => {
    return { ok: true };
  },
  craft_item: async (ctx, { itemName, count = 1 }) => {
    return { ok: true };
  },
  place_block: async (ctx, { blockName, position }) => {
    return { ok: true };
  }
};

async function executePlan(ctx, plan) {
  const errors = validatePlan(plan, ctx.worldOrInventory);
  if (errors.length) return { ok: false, errors };
  for (const step of plan) {
    const fn = Skills[step.action];
    const res = await fn(ctx, step.params || {});
    if (!res?.ok) return res;
  }
  return { ok: true };
}

module.exports = { Skills, executePlan };