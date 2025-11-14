# 🚀 Quick Start - Massively Enhanced Bots

## Installation

```bash
# 1. Dependencies installieren
npm install

# 2. Datenbank migrieren
npm run migrate

# 3. Environment konfigurieren (optional)
cp env_Version2.example .env
# Editiere .env für LLM-Features (optional)
```

## Schnellstart (Ohne LLM)

```bash
# Starte massiv erweiterte Bot-Squad
node examples/massivelyEnhancedSquad.js
```

### Was passiert:

✅ 6 Bots spawnen mit verschiedenen Rollen
✅ Endless Task Generator startet
✅ Bots beginnen mit Early-Game Tasks
✅ Automatische Progression durch Spielphasen
✅ Alle 30 Sekunden: Neue Task-Auswahl
✅ Alle 5 Minuten: Progress Report

## Einzelner Bot (Manuell)

```javascript
const { createEnhancedAgent } = require("./src/agents/enhancedAgent");
const { EndlessTaskGenerator } = require("./src/agents/behaviors/endlessTaskGenerator");
const { AdvancedMiningSystem } = require("./src/agents/behaviors/advancedMining");

async function start() {
  // Bot erstellen
  const bot = await createEnhancedAgent({
    name: "TestBot",
    host: "localhost",
    port: 25565,
    capabilities: ["mining", "building", "farming"]
  });

  // Endless Tasks
  bot.taskGenerator = new EndlessTaskGenerator(bot.bot, "TestBot");
  
  // Advanced Mining
  bot.advancedMining = new AdvancedMiningSystem(bot.bot, "TestBot");

  // Task Loop
  while (true) {
    const task = await bot.taskGenerator.getNextTask();
    console.log(`Task: ${task.desc}`);
    
    // Execute...
    await bot.taskGenerator.completeTask(task.id || task.task);
    
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

start();
```

## Verfügbare Systeme

### 1. Endless Task Generator
```javascript
const taskGen = new EndlessTaskGenerator(bot, name);
const task = await taskGen.getNextTask();
await taskGen.completeTask(task.id);
```

**Features:**
- Phasen: Early → Mid → Late → End → Post Game
- 50+ verschiedene Aufgabentypen
- Automatische Prioritäts-Anpassung
- Niemals ohne Tasks

### 2. Advanced Mining
```javascript
const mining = new AdvancedMiningSystem(bot, name);

// Branch Mining (beste für Diamanten)
await mining.startBranchMining(-59);

// Quarry (entfernt Chunk)
await mining.createQuarry(16, 64);

// Strip Mining (schnell)
await mining.startStripMining(100);
```

### 3. Trading System
```javascript
const trading = new TradingSystem(bot, name);

// Villager finden
const villagers = await trading.scanForVillagers(32);

// Handeln
await trading.tradeWith(villager, "wheat", "emerald", 20);

// Trading Post bauen
await trading.buildTradingPost(position);
```

### 4. Redstone Automation
```javascript
const redstone = new RedstoneSystem(bot, name);

// Auto Farm
await redstone.buildAutoFarm(pos, "wheat");

// Item Sorter
await redstone.buildItemSorter(pos, ["diamond", "iron_ingot"]);

// Auto Smelter
await redstone.buildAutoSmelter(pos);

// Mob Farm
await redstone.buildMobFarm(spawnerPos, "zombie");
```

## Konfiguration

### Server-Einstellungen

```javascript
// In massivelyEnhancedSquad.js
const squadConfig = {
  server: {
    host: "localhost",  // Dein Server
    port: 25565         // Port
  },
  bots: [
    {
      name: "MeinBot",
      role: "miner",
      capabilities: ["mining", "building"],
      focus: ["diamonds", "quarries"]
    }
  ]
};
```

### Bot-Capabilities

Verfügbar:
- `mining` - Mining-Systeme
- `building` - Bau-Systeme
- `farming` - Farm-Systeme
- `trading` - Villager-Trading
- `redstone` - Automation
- `combat` - Kampf-Systeme
- `exploration` - Erkunden

### Task-Fokus

Jeder Bot kann spezialisiert werden:
```javascript
focus: [
  "branch_mining",      // Branch Mining bevorzugen
  "quarries",           // Quarries bauen
  "ore_veins",          // Erzadern finden
  "villager_trading",   // Villager optimieren
  "mega_projects",      // Große Bauprojekte
  "automation"          // Redstone-Automation
]
```

## Monitoring

### Console Output

```
[Miner_Alpha] Phase: mid_game
[Miner_Alpha] Next task: mine_diamonds x16 (Priority: 9)
[Miner_Alpha] Starting branch mining at Y=-59
[Miner_Alpha] Vein detected: diamond_ore (5 blocks)
```

### Progress Reports (alle 5 Min)

```
================================================================================
📊 PROGRESS REPORT
================================================================================

Miner_Alpha (resource_gatherer):
  Phase: mid_game
  Tasks completed: 23
  Mining: 127 ores, 18 veins
  Inventory: 42 unique items

Architect_Prime (master_builder):
  Phase: late_game
  Tasks completed: 31
  Redstone: 5 contraptions built
  Inventory: 38 unique items
================================================================================
```

## Troubleshooting

### Bot startet nicht
```bash
# Checke Server-Verbindung
ping localhost

# Teste manuell
node -e "const mineflayer = require('mineflayer'); const bot = mineflayer.createBot({host:'localhost', port:25565, username:'test'}); bot.on('spawn', () => console.log('OK'));"
```

### Tasks werden nicht ausgeführt
```javascript
// Aktiviere Debug-Logging
bot.bot.on('error', console.error);
bot.logger.level = 'debug';
```

### Inventory voll
```javascript
// Bots leeren automatisch Inventory nicht
// Implementiere manuell:
bot.inventory.depositAllToChest(chestPosition);
```

### Pathfinding-Fehler
```javascript
// Manchmal stecken Bots fest
bot.bot.pathfinder.setGoal(null); // Stop
await bot.bot.waitForTicks(20);
// Retry...
```

## Tipps

1. **Start klein**: Beginne mit 1-2 Bots
2. **Spezialisiere**: Gib jedem Bot eine klare Rolle
3. **Überwache**: Schau regelmäßig in Progress Reports
4. **Koordiniere**: Nutze Team-Funktionen für große Projekte
5. **Geduld**: Manche Tasks dauern lange

## Beispiel-Workflow

```bash
# 1. Bot-Squad starten
node examples/massivelyEnhancedSquad.js

# 2. Warten bis alle Bots spawnen
# => "✨ Squad initialized with 6 bots!"

# 3. Bots beginnen automatisch
# => Early Game Tasks (Holz, Stein, Shelter)

# 4. Nach ~30 Min: Mid Game
# => Mining, Farms, Villages

# 5. Nach ~2 Std: Late Game
# => Diamonds, Nether, Automation

# 6. Nach ~5 Std: Endgame
# => Dragon Fight, End Cities

# 7. Nach ~10 Std: Post Game
# => Mega Projects, Full Automation
```

## Nächste Schritte

- Lese `MASSIVELY_ENHANCED.md` für Details
- Schau in `examples/massivelyEnhancedSquad.js` für Code
- Experimentiere mit verschiedenen Bot-Rollen
- Kombiniere LLM (Ollama/Gemini) für smarter AI

## Support

Bei Problemen:
1. Checke Console-Output
2. Aktiviere Debug-Logging
3. Teste einzelne Systeme isoliert
4. Siehe `README_LLM_OPTIONAL.md` für LLM-Setup

**Viel Erfolg mit deiner massiv erweiterten Bot-Squad! 🚀**
