function setupReconnect(bot, createBotFn, options = {}) {
  const {
    baseDelayMs = 1000,
    maxDelayMs = 60000,
    factor = 2,
    jitter = true,
  } = options;

  let attempt = 0;
  let reconnecting = false;

  function nextDelay() {
    const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(factor, attempt));
    const withJitter = jitter ? Math.floor(delay * (0.7 + Math.random() * 0.6)) : delay;
    return withJitter;
  }

  async function reconnect() {
    if (reconnecting) return;
    reconnecting = true;
    attempt += 1;
    const delay = nextDelay();
    console.warn(`[${bot.username}] Verbindung verloren. Reconnect in ${delay}ms (Versuch ${attempt})`);
    setTimeout(() => {
      try {
        const newBot = createBotFn();
        // Re-register setup for new bot outside
      } catch (e) {
        console.error("Reconnect fehlgeschlagen:", e);
      } finally {
        reconnecting = false;
      }
    }, delay);
  }

  bot.on("end", reconnect);
  bot.on("kicked", (reason) => {
    console.warn(`[${bot.username}] Kicked: ${reason}`);
    reconnect();
  });
  bot.on("error", (err) => {
    console.error(`[${bot.username}] Error:`, err);
  });
}

module.exports = { setupReconnect };