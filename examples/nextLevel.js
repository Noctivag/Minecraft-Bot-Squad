/**
 * Next Level Bot Squad - Demonstration of all advanced features
 *
 * This example shows how to use the enhanced bot system with:
 * - Team coordination and task delegation
 * - Combat and defense systems
 * - Automated farming
 * - Blueprint-based building
 * - Environmental perception
 * - Smart inventory management
 * - Real-time bot-to-bot communication
 */

const { createEnhancedSquad } = require("../src/agents/enhancedAgent");
const { teamCoordinator } = require("../src/coordination/teamCoordinator");
const { realtimeCoordinator } = require("../src/coordination/realtimeCoordinator");

async function main() {
  console.log("=== Next Level Minecraft Bot Squad ===\n");

  // Create a squad with specialized roles
  const squad = await createEnhancedSquad({
    host: process.env.MC_HOST || "localhost",
    port: Number(process.env.MC_PORT) || 25565,
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
  });

  console.log(`\n✓ Squad created with ${squad.length} bots\n`);

  // Wait for all bots to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Demonstrate task coordination
  console.log("=== Demonstrating Team Coordination ===\n");

  // Add some example tasks
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

  // Set up event handlers for coordination
  realtimeCoordinator.on("help_request", (message) => {
    console.log(`⚠️  Help requested by ${message.data.from}: ${message.data.reason} (urgency: ${message.data.urgency})`);
  });

  realtimeCoordinator.on("danger_alert", (message) => {
    console.log(`🚨 Danger alert from ${message.data.from}: ${message.data.dangerType} (severity: ${message.data.severity})`);
  });

  realtimeCoordinator.on("resource_found", (message) => {
    console.log(`💎 ${message.data.finder} found ${message.data.resourceType} at (${message.data.position.x}, ${message.data.position.y}, ${message.data.position.z})`);
  });

  // Status monitoring loop
  setInterval(() => {
    console.log("\n=== Squad Status ===");

    const teamStatus = teamCoordinator.getTeamStatus();
    console.log(`Active Bots: ${teamStatus.total}`);
    console.log(`Tasks: ${teamStatus.tasks.pending} pending, ${teamStatus.tasks.assigned} assigned, ${teamStatus.tasks.completed} completed`);

    const coordStats = realtimeCoordinator.getStats();
    console.log(`Messages: ${coordStats.totalMessages} total, ${coordStats.messageSent} sent, ${coordStats.messagesReceived} received`);

    console.log("\nBot Details:");
    squad.forEach(bot => {
      const status = bot.getStatus();
      console.log(`  ${bot.name}:`);
      console.log(`    Health: ${status.health}/20, Position: (${Math.floor(status.position?.x || 0)}, ${Math.floor(status.position?.y || 0)}, ${Math.floor(status.position?.z || 0)})`);
      console.log(`    Combat: ${status.combat.mode}, Danger Level: ${status.perception.dangerLevel}`);
      console.log(`    Inventory: ${status.perception.health}% full`);
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

    const eli = squad.find(b => b.name === "Eli");
    if (eli) {
      // Start automated farming
      console.log("✓ Eli starting automated farming");

      // Note: Would need to create a farm first in actual gameplay
      // eli.farming.startAutomatedFarming(farmId, "wheat_seeds", 10);
    }

    // Propose a group activity
    const groupTask = teamCoordinator.addTask(
      "build",
      { blueprint: "guard_tower", origin: { x: 150, y: 64, z: 150 } },
      9, // Very high priority
      ["building"]
    );

    console.log("✓ Proposed group building task (guard tower)");

  }, 10000);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\nShutting down bot squad...");

    squad.forEach(bot => {
      bot.stopAutonomousMode();
      bot.bot.quit();
    });

    process.exit(0);
  });

  console.log("\nBot squad is now running autonomously!");
  console.log("Press Ctrl+C to stop.\n");
}

// Run the example
main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
