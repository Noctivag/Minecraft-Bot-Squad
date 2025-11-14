/**
 * Advanced Bot Squad Example - Demonstrates all enhanced features
 *
 * This example shows:
 * - Backend server joins for proxy networks (BungeeCord/Velocity)
 * - Authentication support (Microsoft/Mojang/Offline)
 * - Configuration management
 * - Enhanced logging
 * - Improved reconnection handling
 * - Team coordination and task management
 */

require("dotenv").config();
const { createEnhancedSquad } = require("../src/agents/enhancedAgent");
const { teamCoordinator } = require("../src/coordination/teamCoordinator");
const { realtimeCoordinator } = require("../src/coordination/realtimeCoordinator");
const { AuthType } = require("../src/bot");

async function main() {
  console.log("=== Advanced Minecraft Bot Squad ===\n");

  // Configuration for squad
  const squadConfig = {
    // Server configuration
    host: process.env.MC_HOST || "localhost",
    port: Number(process.env.MC_PORT) || 25565,

    // Backend server for proxy networks (BungeeCord/Velocity)
    // Set this to automatically join a backend server after connecting to proxy
    backendServer: process.env.MC_BACKEND_SERVER || null, // e.g., "survival", "lobby"
    autoJoinBackend: true,

    // Authentication (offline, microsoft, or mojang)
    authType: AuthType.OFFLINE, // Change to AuthType.MICROSOFT for premium servers
    credentials: {
      // For Microsoft auth:
      // authCacheDir: "./auth_cache"

      // For Mojang auth (deprecated):
      // password: "your_password"
    },

    // Reconnection settings
    reconnectOptions: {
      enabled: true,
      baseDelayMs: 2000,
      maxDelayMs: 60000,
      factor: 2,
      jitter: true,
      maxAttempts: -1 // -1 = unlimited
    },

    // Stagger delay between bot connections (ms)
    staggerDelay: 3000,

    // Bot configurations
    bots: [
      {
        name: "Alex",
        capabilities: ["mining", "building", "combat"]
      },
      {
        name: "Blaze",
        capabilities: ["building", "farming", "combat"]
      },
      {
        name: "Cora",
        capabilities: ["mining", "combat"]
      },
      {
        name: "Dune",
        capabilities: ["farming", "building"]
      },
      {
        name: "Eli",
        capabilities: ["farming"]
      }
    ]
  };

  try {
    // Create the squad
    const squad = await createEnhancedSquad(squadConfig);

    console.log(`\n✓ Squad created with ${squad.length} bots\n`);

    if (squad.length === 0) {
      console.error("No bots were created. Check server connection and credentials.");
      process.exit(1);
    }

    // Wait for all bots to be ready
    console.log("Waiting for bots to spawn...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // If backend server is configured, wait for bots to join
    if (squadConfig.backendServer) {
      console.log(`Waiting for bots to join backend server: ${squadConfig.backendServer}`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if bots successfully joined backend server
      squad.forEach(bot => {
        if (bot.bot.serverNetwork) {
          const serverInfo = bot.bot.serverNetwork.getServerInfo();
          if (serverInfo.isOnTargetServer) {
            console.log(`✓ ${bot.name} joined backend server: ${serverInfo.currentServer}`);
          } else {
            console.warn(`⚠ ${bot.name} not yet on target server (current: ${serverInfo.currentServer})`);
          }
        }
      });
    }

    console.log("\n=== Demonstrating Team Coordination ===\n");

    // Add tasks for the squad
    const miningTask = teamCoordinator.addTask(
      "mine",
      { resource: "iron_ore", amount: 10 },
      8, // High priority
      ["mining"]
    );

    const buildTask = teamCoordinator.addTask(
      "build",
      { blueprint: "simple_house", origin: { x: 100, y: 64, z: 100 } },
      6,
      ["building"]
    );

    const farmTask = teamCoordinator.addTask(
      "farm",
      { action: "plant", farmId: 1, seedType: "wheat_seeds" },
      5,
      ["farming"]
    );

    console.log(`✓ Added ${teamCoordinator.taskQueue.length} tasks\n`);

    // Set up event handlers for real-time coordination
    realtimeCoordinator.on("help_request", (message) => {
      console.log(
        `⚠️  Help requested by ${message.data.from}: ${message.data.reason} ` +
        `(urgency: ${message.data.urgency})`
      );
    });

    realtimeCoordinator.on("danger_alert", (message) => {
      console.log(
        `🚨 Danger alert from ${message.data.from}: ${message.data.dangerType} ` +
        `(severity: ${message.data.severity})`
      );
    });

    realtimeCoordinator.on("resource_found", (message) => {
      console.log(
        `💎 ${message.data.finder} found ${message.data.resourceType} at ` +
        `(${message.data.position.x}, ${message.data.position.y}, ${message.data.position.z})`
      );
    });

    // Status monitoring loop
    const statusInterval = setInterval(() => {
      console.log("\n=== Squad Status ===");

      const teamStatus = teamCoordinator.getTeamStatus();
      console.log(`Active Bots: ${teamStatus.total}`);
      console.log(
        `Tasks: ${teamStatus.tasks.pending} pending, ` +
        `${teamStatus.tasks.assigned} assigned, ` +
        `${teamStatus.tasks.completed} completed`
      );

      const coordStats = realtimeCoordinator.getStats();
      console.log(
        `Messages: ${coordStats.totalMessages} total, ` +
        `${coordStats.messageSent} sent, ` +
        `${coordStats.messagesReceived} received`
      );

      console.log("\nBot Details:");
      squad.forEach(bot => {
        const status = bot.getStatus();
        const pos = status.position;

        console.log(`  ${bot.name}:`);
        console.log(
          `    Health: ${status.health}/20, ` +
          `Position: (${Math.floor(pos?.x || 0)}, ${Math.floor(pos?.y || 0)}, ${Math.floor(pos?.z || 0)})`
        );
        console.log(
          `    Combat: ${status.combat.mode}, ` +
          `Danger Level: ${status.perception.dangerLevel}`
        );

        // Show reconnection stats if available
        if (bot.bot.reconnectManager) {
          const reconnectStats = bot.bot.reconnectManager.getStats();
          if (reconnectStats.totalReconnects > 0) {
            console.log(
              `    Reconnects: ${reconnectStats.successfulReconnects}/${reconnectStats.totalReconnects} successful`
            );
          }
        }
      });

      console.log("========================\n");
    }, 30000); // Every 30 seconds

    // Demonstrate advanced features after 10 seconds
    setTimeout(async () => {
      console.log("\n=== Demonstrating Advanced Features ===\n");

      const alex = squad.find(b => b.name === "Alex");
      if (alex) {
        // Set combat mode
        alex.combat.setCombatMode("aggressive");
        console.log("✓ Alex set to aggressive combat mode");

        // Scan for chests
        await alex.inventory.scanAndRegisterChests(32);
        console.log("✓ Alex scanned for storage chests");
      }

      // Demonstrate manual server switching (if on proxy network)
      if (squadConfig.backendServer && squad.length > 0) {
        const testBot = squad[0];
        if (testBot.bot.serverNetwork) {
          console.log(`✓ ${testBot.name} can switch servers using bot.serverNetwork.switchServer("servername")`);
        }
      }

    }, 10000);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\nShutting down bot squad gracefully...");

      // Stop monitoring
      clearInterval(statusInterval);

      // Stop all bots
      squad.forEach(bot => {
        console.log(`Disconnecting ${bot.name}...`);
        bot.stopAutonomousMode();

        // Disable reconnection before quitting
        if (bot.bot.reconnectManager) {
          bot.bot.reconnectManager.disable();
        }

        try {
          bot.bot.quit();
        } catch (err) {
          // Ignore quit errors
        }
      });

      console.log("✓ All bots disconnected");
      process.exit(0);
    });

    console.log("\n✓ Bot squad is now running autonomously!");
    console.log("  - Bots will automatically reconnect if disconnected");
    console.log("  - Tasks are being coordinated across the team");
    console.log("  - Real-time communication is active");

    if (squadConfig.backendServer) {
      console.log(`  - Bots will automatically join backend server: ${squadConfig.backendServer}`);
    }

    console.log("\nPress Ctrl+C to stop.\n");

  } catch (err) {
    console.error("Error creating squad:", err);
    process.exit(1);
  }
}

// Run the example
main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
