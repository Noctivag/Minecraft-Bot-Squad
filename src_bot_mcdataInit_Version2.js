function setupMcData(bot) {
  function init() {
    try {
      const mcData = require("minecraft-data")(bot.version);
      bot.mcData = mcData;
      console.log(`[${bot.username}] mcData initialisiert für ${bot.version}`);
    } catch (e) {
      console.error(`[${bot.username}] mcData-Init fehlgeschlagen:`, e);
    }
  }
  bot.once("spawn", init);
}
module.exports = { setupMcData };