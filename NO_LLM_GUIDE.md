# 🤖 Intelligent Bots WITHOUT LLM

The bot squad now uses **rule-based intelligence** instead of requiring external LLM services. This makes the bots:

- ✅ **Fast** - Instant decisions without API calls
- ✅ **Reliable** - No dependency on external services
- ✅ **Cost-free** - No LLM API costs
- ✅ **Still smart** - Intelligent behavior through rules and priorities

---

## How It Works

Instead of asking an LLM "what should I do?", the bots use a **priority-based decision tree** that analyzes the current state and chooses the best action.

### Decision Priority System

The brain evaluates decisions in this order:

1. **SURVIVAL** (Priority 10) - Escape immediate danger, heal
2. **MAINTENANCE** (Priority 8) - Eat, manage inventory
3. **DEFENSE** (Priority 7) - Fight threats, protect team
4. **TASKS** (Priority 6) - Execute assigned work
5. **OPPORTUNITIES** (Priority 5) - Mine resources, collect items
6. **IDLE** (Priority 1-3) - Explore, wander, check farms

---

## The Rule-Based Brain

**File:** `src/agents/ruleBasedBrain.js`

The brain analyzes:
- **Health** - Am I hurt? Need food?
- **Danger** - Are there threats nearby?
- **Inventory** - Is my inventory full?
- **Opportunities** - Are there resources to gather?
- **Capabilities** - What am I good at?
- **Location** - Where am I? Where should I go?

Then makes smart decisions like:

```javascript
// If health < 10 or danger >= 30
→ RETREAT to safety and eat food

// If inventory full
→ DEPOSIT items to nearest chest

// If hostile mobs nearby and capable of combat
→ ENTER combat mode and fight

// If assigned a task
→ EXECUTE the task

// If see iron ore and capable of mining
→ MINE the iron ore

// If nothing urgent
→ EXPLORE for resources or WANDER
```

---

## Example Usage

```javascript
const { createEnhancedAgent } = require("./src/agents/enhancedAgent");

// Create an intelligent bot (NO LLM required!)
const bot = await createEnhancedAgent({
  name: "Alex",
  host: "localhost",
  port: 25565,
  capabilities: ["mining", "combat", "building"]
});

// The bot is now intelligent and autonomous
bot.startAutonomousMode();

// Every 5 seconds, the bot:
// 1. Analyzes its state (health, danger, inventory, etc.)
// 2. Makes an intelligent decision using rules
// 3. Executes the chosen action
// 4. Repeats

// You can still manually control it:
bot.brain.setGoal("Build a base", 8);
await bot.building.buildFromBlueprint("simple_house", origin);
await bot.mineResource("iron_ore");
```

---

## What Makes Them Smart?

### 1. State Analysis
The brain continuously monitors:
- Current health and hunger
- Nearby threats and their danger level
- Inventory fullness and valuable items
- Available resources and opportunities
- Team status and assigned tasks

### 2. Context-Aware Decisions
The bot adapts its behavior based on:
- **Low health** → Find safety, eat food
- **High danger** → Fight or flee depending on capability
- **Full inventory** → Deposit items before continuing
- **See resources** → Mine if capable and safe
- **No threats** → Explore and gather resources
- **Has task** → Focus on completing it

### 3. Capability-Based Behavior
Each bot has different capabilities:
- **Miners** prioritize finding and mining ores
- **Builders** look for construction opportunities
- **Farmers** maintain farms and collect products
- **Combatants** protect the team and patrol areas

### 4. Team Coordination
Bots work together through:
- Automatic task assignment by team coordinator
- Help requests when overwhelmed
- Resource sharing and alerts
- Priority-based task queue

---

## Decision Examples

### Scenario 1: Bot with low health sees a zombie

```
State Analysis:
- Health: 6/20 (critical!)
- Danger: 35 (high)
- Nearby threats: 1 zombie at 8 blocks

Decision: SURVIVAL
→ Try to eat food
→ Retreat to safe location
→ Alert team if needed

Result: Bot eats bread, runs 30 blocks away, health regenerates
```

### Scenario 2: Bot with full inventory mining

```
State Analysis:
- Health: 18/20 (good)
- Inventory: 95% full
- Nearby: Iron ore deposit

Decision: MAINTENANCE
→ Stop mining
→ Find nearest chest
→ Deposit low-priority items

Result: Bot deposits cobblestone and dirt, keeps tools and valuables
```

### Scenario 3: Idle bot with no tasks

```
State Analysis:
- Health: 20/20 (perfect)
- Danger: 0 (safe)
- Capabilities: ["mining", "combat"]
- Nearby: Diamond ore at 15 blocks

Decision: OPPORTUNITY - Mining
→ Navigate to diamond ore
→ Mine the ore
→ Share discovery with team

Result: Bot mines 3 diamonds, alerts team, continues exploring
```

### Scenario 4: Combat bot sees multiple creepers

```
State Analysis:
- Health: 14/20 (okay)
- Danger: 25 (moderate)
- Threats: 3 creepers nearby
- Capability: combat

Decision: DEFENSE
→ Set combat mode to aggressive
→ Request help (3 enemies)
→ Engage nearest threat

Result: Bot fights, teammate arrives to help, threats eliminated
```

---

## Advantages Over LLM-Based Decisions

| Rule-Based | LLM-Based |
|------------|-----------|
| ⚡ Instant (0ms) | 🐌 1-5 seconds per decision |
| 💰 Free | 💸 API costs per call |
| 🎯 Always consistent | 🎲 Can be unpredictable |
| 🔒 Runs offline | 🌐 Requires internet |
| 🪶 Lightweight | 🏋️ Requires external service |
| ✅ No rate limits | ⏱️ Rate limited |

---

## Customizing the Brain

You can customize decision-making by editing `src/agents/ruleBasedBrain.js`:

### Change Priorities
```javascript
// Make bots more aggressive
if (state.danger >= 10) { // Was 15
  return this.decideDefense(state, combat);
}

// Make bots prioritize building
if (this.capabilities.includes("building") && Math.random() > 0.3) { // Was 0.7
  idleActions.push({ action: "build_plan", reason: "improve_base", priority: 4 });
}
```

### Add New Decision Types
```javascript
// Add "trading" behavior
case "trade":
  if (state.nearbyPlayers > 0) {
    return { action: "trade", reason: "player_nearby", priority: 6 };
  }
  break;
```

### Adjust Danger Thresholds
```javascript
// More cautious
if (state.health < 15 || state.danger >= 20) { // Was 10 and 30
  return this.decideSurvival(state, perception, combat);
}
```

---

## Integration with Existing Systems

The rule-based brain works seamlessly with all advanced systems:

```javascript
// Combat system - automatically engages threats
combat.setCombatMode("aggressive");

// Farming system - maintains farms
farming.startAutomatedFarming(farmId, "wheat_seeds", 10);

// Building system - constructs from blueprints
building.buildFromBlueprint("guard_tower", position);

// Perception system - detects opportunities
const opportunities = perception.detectOpportunities();

// Inventory system - manages items
inventory.autoDeposit();

// Team coordinator - assigns tasks
teamCoordinator.addTask("mine", { resource: "diamond_ore" }, 9, ["mining"]);

// Real-time coordination - communicates with team
realtimeCoordinator.requestHelp(name, "Under attack", 8);
```

---

## Performance

The rule-based system is extremely efficient:

- **Decision time**: < 1ms
- **Memory usage**: Minimal (no model loading)
- **CPU usage**: Very low (simple rule evaluation)
- **Network**: Zero (all local)

This means you can run **many more bots** simultaneously without performance issues.

---

## Quick Start

1. **No setup required** - No API keys, no LLM configuration

2. **Run the example**:
   ```bash
   node examples/nextLevel.js
   ```

3. **Watch the bots**:
   - They'll automatically assess their environment
   - Make intelligent decisions
   - Execute actions autonomously
   - Coordinate as a team

4. **All without a single LLM call!**

---

## When to Use LLM vs Rules

**Use Rules (this system) when:**
- ✅ You want fast, consistent behavior
- ✅ You're offline or have unreliable internet
- ✅ You want to avoid API costs
- ✅ You need deterministic behavior
- ✅ You're running many bots

**Use LLM when:**
- 🤔 You need natural language understanding
- 🤔 You want creative, unpredictable behavior
- 🤔 You're doing complex planning (long-term strategy)
- 🤔 You want the bot to learn from text instructions

**Best of both worlds:**
- Use **rules for real-time decisions** (this system)
- Use **LLM for strategic planning** (optional, when needed)
- The systems can work together!

---

## Conclusion

The bots are **intelligent without needing LLM**. They use:

✅ Smart rule-based decision making
✅ Priority-based action selection
✅ State analysis and context awareness
✅ Capability-based behavior
✅ Team coordination
✅ Autonomous operation

All while being **fast, free, and reliable**!

---

## Files

- `src/agents/ruleBasedBrain.js` - The intelligent brain
- `src/agents/enhancedAgent.js` - Integration with all systems
- `examples/nextLevel.js` - Working demonstration

No LLM files needed! 🎉
