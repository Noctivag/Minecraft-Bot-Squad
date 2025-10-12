function configurePathfinding(bot) {
  try {
    const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
    bot.loadPlugin(pathfinder);
    const mcData = bot.mcData || require("minecraft-data")(bot.version);

    const movements = new Movements(bot, mcData);
    movements.canOpenDoors = true;
    movements.allow1by1towers = true;
    movements.scafoldingBlocks = [];
    movements.digCost = 4;
    movements.placeCost = 4;

    bot.pathfinder.setMovements(movements);

    bot.on("path_update", (r) => {
      if (r.status === "noPath") {
        const pos = bot.entity.position;
        const fallback = new goals.GoalNear(Math.floor(pos.x) + 1, Math.floor(pos.y), Math.floor(pos.z) + 1, 2);
        bot.pathfinder.setGoal(fallback, false);
      }
    });
  } catch (e) {
    console.error(`[${bot.username}] Pathfinding-Setup fehlgeschlagen:`, e);
  }
}
module.exports = { configurePathfinding };