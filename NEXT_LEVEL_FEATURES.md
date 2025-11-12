# 🚀 Next Level Features

This document describes the advanced features that take the Minecraft Bot Squad to the next level!

## 🎯 Overview

The enhanced bot system includes **8 major upgrades**:

1. **Team Coordination System** - Multi-bot task delegation and coordination
2. **Combat & Defense** - Self-defense, mob hunting, and team protection
3. **Automated Farming** - Crop farming, animal breeding, and resource generation
4. **Building Automation** - Blueprint-based construction system
5. **Perception System** - Environmental awareness and threat detection
6. **Inventory Management** - Smart storage, sorting, and item management
7. **Real-time Coordination** - Instant bot-to-bot communication
8. **Enhanced Agent System** - Unified interface for all advanced features

---

## 📦 Features in Detail

### 1. Team Coordination System

**File:** `src/coordination/teamCoordinator.js`

Enables multi-bot task delegation and team management:

```javascript
const { teamCoordinator } = require("./src/coordination/teamCoordinator");

// Register a bot with capabilities
teamCoordinator.registerBot("Alex", bot, ["mining", "building", "combat"]);

// Add a task
const taskId = teamCoordinator.addTask(
  "mine",                          // Task type
  { resource: "iron_ore" },        // Task data
  8,                               // Priority (1-10)
  ["mining"]                       // Required capabilities
);

// Task is automatically assigned to best available bot
// Bot executes and completes the task
teamCoordinator.completeTask(taskId);

// Get team status
const status = teamCoordinator.getTeamStatus();
console.log(`Active bots: ${status.total}`);
console.log(`Tasks: ${status.tasks.pending} pending, ${status.tasks.completed} completed`);
```

**Features:**
- Automatic task assignment based on bot capabilities and availability
- Priority-based task queue
- Distance and health-based bot selection
- Automatic task retry on failure
- Help request system for nearby bots

---

### 2. Combat & Defense System

**File:** `src/agents/behaviors/combatSystem.js`

Provides combat capabilities and self-defense:

```javascript
const { CombatSystem } = require("./src/agents/behaviors/combatSystem");

const combat = new CombatSystem(bot, "Alex");

// Set combat mode
combat.setCombatMode("aggressive"); // or "defensive", "passive"

// Set guard mode - patrol and protect an area
combat.setGuardMode(
  { x: 100, y: 64, z: 100 },  // Position to guard
  16                          // Guard radius
);

// Get combat status
const status = combat.getStatus();
console.log(`Mode: ${status.mode}, Health: ${status.health}, Threats: ${status.threats}`);
```

**Features:**
- Automatic hostile mob detection
- Smart weapon selection (prioritizes diamond > iron > stone > wood)
- Emergency retreat when low health
- Auto-eat food to recover health
- Guard/patrol mode for area protection
- Threat level assessment
- Combat cooldown management

**Combat Modes:**
- **Defensive**: Only attacks when attacked
- **Aggressive**: Actively seeks and attacks nearby hostiles
- **Passive**: Never attacks (flee only)

---

### 3. Automated Farming System

**File:** `src/agents/behaviors/farmingSystem.js`

Automated crop and animal farming:

```javascript
const { FarmingSystem } = require("./src/agents/behaviors/farmingSystem");

const farming = new FarmingSystem(bot, "Eli");

// Create a crop farm
const farm = await farming.createCropFarm(
  { x: 100, y: 64, z: 100 },  // Center position
  9                           // Size (9x9)
);

// Plant seeds
await farming.plantSeeds(farm.id, "wheat_seeds");

// Harvest mature crops
const harvested = await farming.harvestCrops(farm.id);

// Start automated farming loop
farming.startAutomatedFarming(
  farm.id,
  "wheat_seeds",
  10  // Check every 10 minutes
);

// Breed animals
await farming.breedAnimals("cow", 2);

// Collect products
await farming.collectProducts("egg");  // or "wool", "milk"

// Get status
const status = farming.getStatus();
console.log(`Farms: ${status.farms}, Utilization: ${status.utilization}`);
```

**Features:**
- Automatic farmland creation with water source
- Smart planting and harvesting
- Automated farming loop (plant, wait, harvest, repeat)
- Animal breeding system
- Product collection (eggs, wool, milk)
- Multiple farm management

---

### 4. Building Automation

**File:** `src/agents/behaviors/buildingSystem.js`

Blueprint-based construction system:

```javascript
const { BuildingSystem } = require("./src/agents/behaviors/buildingSystem");

const building = new BuildingSystem(bot, "Blaze");

// Build from built-in blueprint
await building.buildFromBlueprint(
  "simple_house",
  { x: 100, y: 64, z: 100 }  // Origin position
);

// List available blueprints
const blueprints = building.listBlueprints();
blueprints.forEach(bp => {
  console.log(`${bp.name} (${bp.size.x}x${bp.size.y}x${bp.size.z})`);
});

// Scan existing structure
const scanned = await building.scanStructure(
  { x: 100, y: 64, z: 100 },  // Corner 1
  { x: 107, y: 69, z: 107 }   // Corner 2
);

// Create custom blueprint from scan
building.createBlueprint(
  "my_house",
  "My Custom House",
  scanned.size,
  scanned.blocks,
  scanned.materials
);

// Get status
const status = building.getStatus();
console.log(`Active builds: ${status.activeBuilds}, Completed: ${status.completedBuilds}`);
```

**Built-in Blueprints:**
- **simple_house** - 7x5x7 wooden house with windows and door
- **storage_shed** - 5x4x5 storage building with chests
- **guard_tower** - 5x12x5 tall tower with ladder
- **farm_plot** - 9x1x9 fenced farm area

**Features:**
- Automatic material checking
- Layer-by-layer construction (bottom to top)
- Progress tracking
- Blueprint scanning and saving
- Custom blueprint creation

---

### 5. Perception System

**File:** `src/agents/behaviors/perceptionSystem.js`

Environmental awareness and threat detection:

```javascript
const { PerceptionSystem } = require("./src/agents/behaviors/perceptionSystem");

const perception = new PerceptionSystem(bot, "Cora");

// Get world summary
const summary = perception.getSummary();
console.log(`Danger Level: ${summary.dangerLevel}`);
console.log(`Nearby Players: ${summary.nearbyPlayers}`);
console.log(`Hostile Mobs: ${summary.nearbyMobs.hostile}`);

// Find nearest resource
const ironOre = perception.findNearestResource("iron_ore");
if (ironOre) {
  console.log(`Found iron ore at distance ${ironOre.distance}`);
}

// Find safe location
const safeLoc = perception.findSafeLocation();
console.log(`Safe location: (${safeLoc.position.x}, ${safeLoc.position.z})`);

// Detect opportunities
const opportunities = perception.detectOpportunities();
opportunities.forEach(opp => {
  console.log(`Opportunity: ${opp.type} - ${opp.resource || opp.animal}`);
});

// Get detailed report
const report = perception.getEnvironmentReport();
console.log(report);
```

**Features:**
- Continuous environmental scanning (every 2 seconds)
- Hostile mob detection and tracking
- Resource detection (ores, chests, structures)
- Danger level assessment
- Opportunity detection (mining, farming, looting)
- Safe location finder
- Player detection and tracking
- Environmental hazard detection (lava, cliffs)

---

### 6. Inventory Management

**File:** `src/agents/behaviors/inventoryManager.js`

Smart storage and item management:

```javascript
const { InventoryManager } = require("./src/agents/behaviors/inventoryManager");

const inventory = new InventoryManager(bot, "Alex");

// Register storage chests
inventory.registerChest(
  { x: 100, y: 64, z: 100 },
  "general",  // Type: general, tools, food, materials, valuables
  50          // Priority
);

// Organize inventory by priority
await inventory.organizeInventory();

// Deposit low-priority items
await inventory.depositItems();

// Withdraw specific item
await inventory.withdrawItem("iron_ingot", 10);

// Auto-deposit when full
await inventory.autoDeposit();

// Drop junk items
await inventory.dropJunk();

// Scan for nearby chests
await inventory.scanAndRegisterChests(32);

// Check inventory
console.log(`Has iron: ${inventory.hasItem("iron_ingot", 5)}`);
console.log(`Iron count: ${inventory.countItem("iron_ingot")}`);

// Get report
const report = inventory.getInventoryReport();
console.log(report);
```

**Features:**
- Item priority system (tools > valuables > food > materials > junk)
- Smart storage management
- Auto-deposit when inventory full
- Chest registration and tracking
- Item withdrawal system
- Junk item detection and disposal
- Inventory utilization tracking
- Reserved slots for essential items

---

### 7. Real-time Coordination

**File:** `src/coordination/realtimeCoordinator.js`

Bot-to-bot communication system:

```javascript
const { realtimeCoordinator } = require("./src/coordination/realtimeCoordinator");

// Register bot
realtimeCoordinator.registerBot("Alex", bot);

// Send message to specific bot
realtimeCoordinator.sendMessage(
  "Alex",
  "Blaze",
  "help_needed",
  { reason: "Under attack", urgency: 8 }
);

// Broadcast to all bots
realtimeCoordinator.broadcast("danger_alert", {
  dangerType: "creeper",
  position: { x: 100, y: 64, z: 100 },
  severity: 7
});

// Request help from team
realtimeCoordinator.requestHelp("Alex", "Low health, need backup", 9);

// Share resource discovery
realtimeCoordinator.shareResource("Dune", "diamond_ore", position, 3);

// Register event handler
realtimeCoordinator.on("help_request", (message) => {
  console.log(`${message.data.from} needs help: ${message.data.reason}`);
  // Respond if available
  realtimeCoordinator.respondToHelp("Blaze", message.data.from, true);
});

// Get stats
const stats = realtimeCoordinator.getStats();
console.log(`Active bots: ${stats.activeBots}, Messages: ${stats.totalMessages}`);
```

**Features:**
- Direct bot-to-bot messaging
- Broadcast messaging
- Help request/response system
- Resource sharing
- Danger alerts
- Strategy coordination
- Event-based handlers
- Message queue management
- Heartbeat system
- Automatic cleanup of old messages

**Event Types:**
- `help_request` - Bot needs assistance
- `help_response` - Response to help request
- `danger_alert` - Warning about threats
- `resource_found` - Shared resource discovery
- `activity_proposal` - Group activity coordination
- `bot_joined` / `bot_left` - Bot status changes

---

### 8. Enhanced Agent System

**File:** `src/agents/enhancedAgent.js`

Unified interface combining all features:

```javascript
const { createEnhancedAgent, createEnhancedSquad } = require("./src/agents/enhancedAgent");

// Create single enhanced bot
const alex = await createEnhancedAgent({
  name: "Alex",
  host: "localhost",
  port: 25565,
  capabilities: ["mining", "building", "combat"]
});

// Access all systems
alex.combat.setCombatMode("aggressive");
await alex.farming.createCropFarm(position, 9);
await alex.building.buildFromBlueprint("simple_house", origin);
const summary = alex.perception.getSummary();
await alex.inventory.depositItems();

// Execute tasks
await alex.executeTask(taskId);

// Request help
alex.requestHelp("Under attack", 9);

// Get complete status
const status = alex.getStatus();

// Start autonomous mode
alex.startAutonomousMode(5000); // Tick every 5 seconds

// Create full squad
const squad = await createEnhancedSquad({
  host: "localhost",
  port: 25565,
  bots: [
    { name: "Alex", capabilities: ["mining", "combat"] },
    { name: "Blaze", capabilities: ["building", "farming"] },
    { name: "Cora", capabilities: ["mining", "combat"] }
  ]
});

// All bots start in autonomous mode automatically
```

**Autonomous Mode Features:**
- Automatic task execution from queue
- Auto-deposit when inventory full
- Combat response to threats
- Opportunity detection and action
- Heartbeat updates
- Status reporting

---

## 🎮 Quick Start Example

See `examples/nextLevel.js` for a complete working example:

```bash
# Set environment variables
export MC_HOST=localhost
export MC_PORT=25565

# Run the next-level bot squad
node examples/nextLevel.js
```

The example demonstrates:
- Creating a 5-bot squad with different specializations
- Task coordination and assignment
- Real-time event monitoring
- Status reporting
- Autonomous operation

---

## 🔧 Integration with Existing System

All new features integrate seamlessly with the existing codebase:

```javascript
// Existing brain system can now use enhanced features
const { brainTick } = require("./src/agents/brain");
const { createEnhancedAgent } = require("./src/agents/enhancedAgent");

async function enhancedBrainTick(agentName, bot) {
  // Use perception for better context
  const perception = bot.perception.getSummary();

  // Use existing brain for decision making
  const decision = await brainTick(agentName, {
    inventory: bot.inventory.countItem(),
    goal: "Build a base",
    bot: bot.bot,
    dangerLevel: perception.dangerLevel,
    opportunities: perception.opportunities
  });

  // Execute using enhanced features
  if (decision.plans[0]?.plan?.length) {
    await bot.executeTask(taskId);
  }
}
```

---

## 📊 Performance Considerations

- **Perception System**: Updates every 2 seconds, scans 32-block radius
- **Autonomous Mode**: Default tick rate is 5 seconds (configurable)
- **Message Cleanup**: Automatic cleanup of messages older than 1 hour
- **Heartbeat Check**: Checks for inactive bots every minute

Adjust intervals based on server load:

```javascript
// Slower perception updates
perception.updateInterval = 5000; // 5 seconds

// Slower autonomous ticks
bot.startAutonomousMode(10000); // 10 seconds
```

---

## 🎯 Task Types

The task system supports these built-in types:

- `mine` - Mine a specific resource
- `build` - Build from a blueprint
- `farm` - Plant or harvest crops
- `patrol` - Set up guard/patrol mode
- `collect` - Collect animal products
- `deposit` - Deposit items to storage

Add custom task types in `enhancedAgent.js`:

```javascript
case "custom_task":
  // Your custom logic here
  result = await myCustomFunction(task.data);
  break;
```

---

## 🚀 What's Next?

The bots are now at the next level! They can:

✅ Work together as a coordinated team
✅ Defend themselves and each other
✅ Automate farming and resource generation
✅ Build complex structures from blueprints
✅ Perceive and respond to their environment
✅ Manage inventory intelligently
✅ Communicate in real-time
✅ Operate autonomously

**Possible future enhancements:**
- Machine learning for better decision making
- Advanced pathfinding with obstacle avoidance
- Redstone automation
- Trading systems
- Multi-server coordination
- Voice commands
- Web dashboard for monitoring

---

## 📝 License

MIT License - Same as the main project

## 🙏 Credits

Built on top of the excellent [mineflayer](https://github.com/PrismarineJS/mineflayer) library.
