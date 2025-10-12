const { getMcData, getRecipesForItem } = require("./recipeBook");

function countInInventory(inventory, itemName) {
  return inventory?.items?.[itemName] || 0;
}
function need(n, have) { return Math.max(0, n - have); }

function planCraft(itemName, count, inventory, bot) {
  const data = getMcData(bot);
  const plan = [];
  const visited = new Set();

  function expand(name, needed) {
    const key = `${name}:${needed}`;
    if (visited.has(key)) return;
    visited.add(key);

    const have = countInInventory(inventory, name);
    const missing = need(needed, have);
    if (missing <= 0) return;

    const recipes = getRecipesForItem(data, name);
    if (!recipes.length) {
      plan.push({ action: "gather", params: { itemName: name, count: missing } });
      return;
    }

    const recipe = recipes[0];
    const craftsNeeded = Math.ceil(missing / (recipe.result?.count || 1));
    for (const inMat of recipe.inShape?.flat()?.filter(Boolean) || recipe.ingredients || []) {
      const inputItem = data.items[inMat.id]?.name;
      if (!inputItem) continue;
      expand(inputItem, craftsNeeded);
    }

    plan.push({ action: "craft_item", params: { itemName: name, count: missing } });
  }

  expand(itemName, count);
  return plan;
}

module.exports = { planCraft };