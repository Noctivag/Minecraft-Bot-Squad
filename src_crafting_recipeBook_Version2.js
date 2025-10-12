const mcDataCache = new Map();

function getMcData(bot) {
  if (bot?.mcData) return bot.mcData;
  const version = bot?.version || "1.20.1";
  if (!mcDataCache.has(version)) {
    mcDataCache.set(version, require("minecraft-data")(version));
  }
  return mcDataCache.get(version);
}

function findItem(data, name) {
  return data.itemsByName[name] || data.blocksByName[name] || null;
}

function getRecipesForItem(data, itemName) {
  const item = data.itemsByName[itemName];
  if (!item) return [];
  const recipes = data.recipes[item.id] || [];
  return recipes;
}

module.exports = { getMcData, findItem, getRecipesForItem };