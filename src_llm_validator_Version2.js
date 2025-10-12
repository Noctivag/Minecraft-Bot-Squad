const KNOWN_COMMANDS = new Set([
  "walk_to",
  "find_tree",
  "mine_block",
  "craft_item",
  "place_block",
  "equip_item",
  "pickup_item",
  "deposit_item",
  "withdraw_item",
  "build_structure_step",
]);

function isVec3(obj) {
  return obj && Number.isFinite(obj.x) && Number.isFinite(obj.y) && Number.isFinite(obj.z);
}

function validateCommand(cmd, worldOrInventory = {}) {
  const errors = [];
  if (!cmd || typeof cmd !== "object") return ["Command must be an object"];
  const { action, params } = cmd;
  if (!KNOWN_COMMANDS.has(action)) errors.push(`Unknown action: ${action}`);

  switch (action) {
    case "walk_to":
      if (!params?.target || !isVec3(params.target)) errors.push("walk_to requires params.target as {x,y,z}");
      if (params?.range && !Number.isFinite(params.range)) errors.push("walk_to params.range must be a number if provided");
      break;
    case "mine_block":
      if (typeof params?.blockName !== "string") errors.push("mine_block requires params.blockName (string)");
      break;
    case "craft_item":
      if (typeof params?.itemName !== "string") errors.push("craft_item requires params.itemName (string)");
      if (params?.count && !Number.isFinite(params.count)) errors.push("craft_item params.count must be a number if provided");
      break;
    case "place_block":
      if (!isVec3(params?.position)) errors.push("place_block requires params.position {x,y,z}");
      if (typeof params?.blockName !== "string") errors.push("place_block requires params.blockName (string)");
      break;
    default:
      break;
  }
  return errors;
}

function validatePlan(plan, worldOrInventory) {
  if (!Array.isArray(plan)) return ["Plan must be an array"];
  const allErrors = [];
  plan.forEach((cmd, i) => {
    const errs = validateCommand(cmd, worldOrInventory);
    if (errs.length) allErrors.push({ index: i, errors: errs });
  });
  return allErrors;
}

module.exports = { validatePlan, KNOWN_COMMANDS };