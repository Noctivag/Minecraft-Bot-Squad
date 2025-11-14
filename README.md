# 🤖 Minecraft Bot Squad - MASSIVELY ENHANCED EDITION

> **Autonome Minecraft-Bots mit endlosen Aufgaben, fortgeschrittener Automatisierung und intelligenter Progression**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Mineflayer](https://img.shields.io/badge/Mineflayer-4.20.1-blue.svg)](https://github.com/PrismarineJS/mineflayer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Highlights

🎯 **Endless Tasks** - Bots haben IMMER sinnvolle Aufgaben
⛏️ **Advanced Mining** - Branch Mining, Quarries, Vein Detection
💎 **Trading System** - Villager Management & Optimization
🔴 **Redstone Automation** - Auto-Farms, Item Sorter, Mob Farms
🏗️ **Smart Building** - Blueprint-basierte Konstruktion
📈 **Progression System** - Early → Mid → Late → End → Post Game
🤝 **Team Coordination** - Multi-Bot Collaboration
🧠 **Optional LLM** - Funktioniert mit/ohne AI (Ollama/Gemini)

## 🚀 Quick Start

### Variante 1: Als CLI-Tool (Empfohlen)

```bash
# Installation
npm install
npm link

# Starte mit einem Kommando!
mcbot-squad start

# Oder starte Web UI
mcbot-squad ui

# Oder starte enhanced Squad
mcbot-squad enhanced
```

### Variante 2: Direkt mit Node.js

```bash
# Installation
npm install

# Starte massiv erweiterte Bot-Squad
node examples/massivelyEnhancedSquad.js

# Oder starte Web UI
npm start
```

**Das war's!** 6 Bots mit verschiedenen Rollen starten und arbeiten autonom.

📖 **Vollständige Installationsanleitung:** siehe [INSTALLATION.md](INSTALLATION.md)

## 📋 Features

### Core Systems

| System | Features | Status |
|--------|----------|--------|
| **Endless Task Generator** | Unendliche Tasks, Phasen-basiert, Auto-Progression | ✅ |
| **Advanced Mining** | Branch Mining, Quarries, Vein Detection | ✅ |
| **Trading System** | Villager Scanning, Trading, Optimization | ✅ |
| **Redstone Automation** | Auto-Farms, Item Sorter, Mob Farms | ✅ |
| **Building System** | Blueprints, Custom Structures | ✅ |
| **Combat System** | Self-Defense, Mob Hunting, Team Protection | ✅ |
| **Farming System** | Crop Farms, Animal Breeding | ✅ |
| **Perception System** | Environment Scanning, Threat Detection | ✅ |
| **Inventory Manager** | Smart Organization, Auto-Deposit | ✅ |

### Progression Phasen

```
Early Game (Survival) 
    ↓
Mid Game (Resource Expansion)
    ↓
Late Game (Advanced Automation)
    ↓
Endgame (Dragon & Beyond)
    ↓
Post Game (Mega Projects) ← ENDLOS
```

### Task-Kategorien

- 🎯 **Milestone Tasks** - Spielfortschritt (Fight Dragon, Build Portal)
- ⛏️ **Resource Gathering** - Materialien sammeln (Mine Diamonds, Gather Wood)
- 🏗️ **Building** - Strukturen bauen (Castle, Trading Hall, Storage)
- 🔧 **Automation** - Redstone/Farms (Auto-Smelter, Mob Farm)
- 🗺️ **Exploration** - Welt erkunden (Find Village, Locate Stronghold)
- 🌾 **Farming** - Nahrung/Tiere (Crop Farm, Breed Animals)
- 💰 **Trading** - Villager-Interaktion (Optimize Trades, Build Hall)
- 🌟 **Mega Projects** - Endgame (Castle, Terraform, Full Automation)

## 🤖 Bot-Rollen

### Architect Prime
**Master Builder** - Mega-Bauprojekte, Ästhetik, Terraforming
```javascript
capabilities: ["building", "redstone", "planning"]
focus: ["mega_projects", "automation", "aesthetics"]
```

### Miner Alpha  
**Resource Gatherer** - Branch Mining, Quarries, Ore-Hunting
```javascript
capabilities: ["mining", "exploration"]
focus: ["branch_mining", "quarries", "ore_veins", "ancient_debris"]
```

### Trader Expert
**Economy Manager** - Villager-Handel, Trading Halls, Emerald-Farming
```javascript
capabilities: ["trading", "breeding", "farming"]
focus: ["villager_trading", "emeralds", "optimization"]
```

### Farmer Pro
**Food Automation** - Crop-Farms, Tier-Zucht, Nahrungsproduktion
```javascript
capabilities: ["farming", "automation"]
focus: ["crop_farms", "animal_breeding", "food_production"]
```

### Engineer Redstone
**Automation Specialist** - Item Sorter, Mob Farms, Contraptions
```javascript
capabilities: ["redstone", "building", "automation"]
focus: ["item_sorters", "mob_farms", "flying_machines"]
```

### Explorer Scout
**World Mapper** - Strukturen finden, Biome kartieren, Schätze jagen
```javascript
capabilities: ["exploration", "combat"]
focus: ["structure_finding", "biome_mapping", "treasure_hunting"]
```

## 💻 Verwendung

### Einzelner Bot

```javascript
const { createEnhancedAgent } = require("./src/agents/enhancedAgent");
const { EndlessTaskGenerator } = require("./src/agents/behaviors/endlessTaskGenerator");

const bot = await createEnhancedAgent({
  name: "MeinBot",
  host: "localhost",
  port: 25565,
  capabilities: ["mining", "building", "trading"]
});

// Endless Tasks
bot.taskGenerator = new EndlessTaskGenerator(bot.bot, "MeinBot");

// Task Loop
while (true) {
  const task = await bot.taskGenerator.getNextTask();
  console.log(`Next: ${task.desc}`);
  
  await executeTask(bot, task);
  await bot.taskGenerator.completeTask(task.id);
  
  await sleep(30000); // 30s
}
```

### Advanced Mining

```javascript
const { AdvancedMiningSystem } = require("./src/agents/behaviors/advancedMining");

bot.mining = new AdvancedMiningSystem(bot.bot, "Miner");

// Branch Mining (optimal für Diamanten)
await bot.mining.startBranchMining(-59);

// Quarry (Chunk entfernen)
await bot.mining.createQuarry(16, 64);

// Strip Mining (schnell)
await bot.mining.startStripMining(100);
```

### Trading System

```javascript
const { TradingSystem } = require("./src/agents/behaviors/tradingSystem");

bot.trading = new TradingSystem(bot.bot, "Trader");

// Villager scannen
const villagers = await bot.trading.scanForVillagers(32);

// Handeln
await bot.trading.tradeWith(villager, "wheat", "emerald", 20);

// Trading Post bauen
await bot.trading.buildTradingPost(position);
```

### Redstone Automation

```javascript
const { RedstoneSystem } = require("./src/agents/behaviors/redstoneSystem");

bot.redstone = new RedstoneSystem(bot.bot, "Engineer");

// Auto Farm
await bot.redstone.buildAutoFarm(pos, "wheat");

// Item Sorter
await bot.redstone.buildItemSorter(pos, ["diamond", "iron_ingot", "gold_ingot"]);

// Auto Smelter
await bot.redstone.buildAutoSmelter(pos);

// Mob Farm
await bot.redstone.buildMobFarm(spawnerPos, "zombie");
```

## 🧠 LLM Integration (Optional)

Das System funktioniert **vollständig ohne LLMs**, kann aber optional erweitert werden:

### Ohne LLM (Standard)
- ✅ Hardcodierte Logik
- ✅ Phasen-basierte Tasks
- ✅ Alle Features verfügbar
- ✅ Minimale Dependencies

### Mit Ollama (Lokal)
- ✅ Intelligente Entscheidungen
- ✅ RAG/Knowledge Base
- ✅ Adaptive Learning
- ✅ Task-Generierung

### Mit Gemini (Cloud)
- ✅ Team-Koordination
- ✅ Strategische Planung
- ✅ Complex Problem Solving
- ⚠️ Rate-Limited (4 calls/hour)

Siehe `README_LLM_OPTIONAL.md` für Details.

## 📊 Monitoring

### Console Output
```
[Miner_Alpha] Phase: mid_game
[Miner_Alpha] Next task: mine_diamonds x16 (Priority: 9)
[Miner_Alpha] Starting branch mining at Y=-59
[Miner_Alpha] Vein detected: diamond_ore (5 blocks)
[Miner_Alpha] ✅ Task completed
```

### Progress Reports (5 Min Intervall)
```
================================================================================
📊 PROGRESS REPORT
================================================================================

Miner_Alpha (resource_gatherer):
  Phase: mid_game
  Tasks completed: 23
  Mining: 127 ores, 18 veins
  Inventory: 42 unique items

Engineer_Redstone (automation_specialist):
  Phase: late_game
  Tasks completed: 31
  Redstone: 5 contraptions built
  Inventory: 38 unique items
================================================================================
```

## 📁 Projektstruktur

```
Minecraft-Bot-Squad/
├── src/
│   ├── agents/
│   │   ├── behaviors/
│   │   │   ├── endlessTaskGenerator.js   # ← ENDLESS TASKS
│   │   │   ├── advancedMining.js          # ← ADVANCED MINING
│   │   │   ├── tradingSystem.js           # ← TRADING
│   │   │   ├── redstoneSystem.js          # ← AUTOMATION
│   │   │   ├── buildingSystem.js
│   │   │   ├── combatSystem.js
│   │   │   ├── farmingSystem.js
│   │   │   ├── perceptionSystem.js
│   │   │   └── inventoryManager.js
│   │   └── enhancedAgent.js
│   ├── bot/
│   ├── coordination/
│   ├── crafting/
│   ├── knowledge/
│   ├── learning/
│   ├── llm/
│   └── memory/
├── examples/
│   ├── massivelyEnhancedSquad.js         # ← START HIER
│   ├── advancedSquad.js
│   └── nextLevel.js
├── MASSIVELY_ENHANCED.md                  # ← VOLLSTÄNDIGE DOKU
├── QUICKSTART_ENHANCED.md                 # ← QUICK START
└── README_LLM_OPTIONAL.md                 # ← LLM CONFIG
```

## 🎯 Beispiel-Workflow

```
1. Bot-Squad startet → Early Game
   └─> Gather Wood (64x)
   └─> Craft Tools
   └─> Build Shelter

2. Nach 30 Min → Mid Game  
   └─> Mine Diamonds
   └─> Build Enchanting Setup
   └─> Create Iron Farm

3. Nach 2 Std → Late Game
   └─> Build Mob Farm
   └─> Auto-Smelter Setup
   └─> Guardian Farm

4. Nach 5 Std → Endgame
   └─> Fight Ender Dragon
   └─> Get Elytra
   └─> Build End Base

5. Nach 10 Std → Post Game (ENDLOS)
   └─> Mega Base Construction
   └─> Terraform Biomes
   └─> Full Automation
   └─> Creative Mega Projects
   └─> ... niemals ohne Tasks!
```

## 🛠️ Technische Details

### Dependencies
- `mineflayer` - Bot-Framework
- `mineflayer-pathfinder` - Navigation
- `minecraft-data` - Game-Data
- `better-sqlite3` - Learning/Memory
- `express` - Coordinator API
- `@google/generative-ai` - Optional (Gemini)

### Requirements
- Node.js 20+
- Minecraft Java Edition Server
- 2GB+ RAM pro Bot
- Vanilla/Spigot/Paper Server

### Performance
- CPU: ~5-10% pro Bot
- RAM: ~100-200MB pro Bot
- Network: Minimal

## 📚 Dokumentation

- **[MASSIVELY_ENHANCED.md](MASSIVELY_ENHANCED.md)** - Vollständige Feature-Dokumentation
- **[QUICKSTART_ENHANCED.md](QUICKSTART_ENHANCED.md)** - Schnellstart-Guide
- **[README_LLM_OPTIONAL.md](README_LLM_OPTIONAL.md)** - LLM-Konfiguration
- **[ENHANCED_FEATURES.md](ENHANCED_FEATURES.md)** - Feature-Übersicht
- **[README_Version2.md](README_Version2.md)** - Original README

## 🤝 Contributing

Contributions willkommen! 

1. Fork das Repo
2. Erstelle Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🙏 Credits

- [Mineflayer](https://github.com/PrismarineJS/mineflayer) - Bot Framework
- [PrismarineJS](https://github.com/PrismarineJS) - Minecraft Tools
- [Ollama](https://ollama.ai/) - Local LLM
- [Google Gemini](https://ai.google.dev/) - Cloud LLM

## 📞 Support

Bei Fragen oder Problemen:
- Öffne ein [GitHub Issue](https://github.com/Noctivag/Minecraft-Bot-Squad/issues)
- Checke die Dokumentation
- Aktiviere Debug-Logging

---

**Made with ❤️ by the Minecraft Bot Squad Team**

*Niemals ohne Aufgaben - Immer am Bauen - Ständig am Verbessern*

🤖 **Happy Botting!** 🎮
