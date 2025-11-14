/**
 * Example: Bot Squad with Web UI
 * Demonstrates how to use the management UI with bot squad
 */

const { BotManager } = require("../src/ui");
const { ConfigManager } = require("../src/bot/config");

async function main() {
  console.log("=".repeat(60));
  console.log("🤖 Minecraft Bot Squad - Web UI Example");
  console.log("=".repeat(60));
  console.log("");

  // Load or create configuration
  let config;
  try {
    config = ConfigManager.loadFromFile("./bot-config.json");
    console.log("✓ Configuration loaded from bot-config.json");
  } catch (err) {
    console.log("⚠ No configuration file found, using defaults");
    config = new ConfigManager({
      server: {
        host: process.env.SERVER_HOST || "localhost",
        port: parseInt(process.env.SERVER_PORT) || 25565,
        version: false
      },
      network: {
        isProxy: false,
        backendServer: null,
        autoJoinBackend: true
      },
      authentication: {
        type: "offline",
        credentials: {}
      },
      reconnect: {
        enabled: true,
        maxAttempts: -1,
        baseDelayMs: 1000
      },
      behavior: {
        autoRespawn: true,
        sprintByDefault: false,
        hideErrors: false
      },
      logging: {
        level: "info",
        logChat: true,
        logEvents: true
      }
    });
  }

  // Create bot manager
  const manager = new BotManager({
    config,
    defaultCapabilities: ["mining", "building", "farming", "combat"]
  });

  // Initialize UI server
  const uiPort = parseInt(process.env.UI_PORT) || 3000;
  await manager.init({
    port: uiPort,
    host: "0.0.0.0" // Listen on all interfaces
  });

  console.log("");
  console.log("=".repeat(60));
  console.log(`🌐 Web UI available at: http://localhost:${uiPort}`);
  console.log("=".repeat(60));
  console.log("");
  console.log("Usage:");
  console.log("  1. Open the URL above in your web browser");
  console.log("  2. Configure server settings in the 'Configuration' tab");
  console.log("  3. Add bots using the 'Add Bot' button");
  console.log("  4. Monitor bots in the 'Dashboard' and 'Bots' tabs");
  console.log("  5. View tasks in the 'Tasks' tab");
  console.log("  6. Check activity logs in the 'Logs' tab");
  console.log("");
  console.log("Server Configuration:");
  console.log(`  Host: ${config.get("server").host}`);
  console.log(`  Port: ${config.get("server").port}`);
  console.log(`  Auth Type: ${config.get("authentication").type}`);
  console.log("");

  // Optionally start some bots automatically
  const autoStartBots = process.env.AUTO_START_BOTS;
  if (autoStartBots) {
    const botNames = autoStartBots.split(",").map(name => name.trim());
    console.log(`Starting ${botNames.length} bot(s) automatically...`);

    const results = await manager.startBots(botNames, {
      startDelay: 2000 // 2 second delay between starts
    });

    results.forEach(result => {
      if (result.success) {
        console.log(`✓ Bot ${result.name} started successfully`);
      } else {
        console.error(`✗ Failed to start bot ${result.name}: ${result.error}`);
      }
    });

    console.log("");
  }

  console.log("Press Ctrl+C to stop the server and all bots");
  console.log("");

  // Handle shutdown
  process.on("SIGINT", async () => {
    console.log("\n\nShutting down...");
    await manager.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n\nShutting down...");
    await manager.shutdown();
    process.exit(0);
  });
}

// Run
main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
