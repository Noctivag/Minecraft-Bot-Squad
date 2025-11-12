/**
 * Exploration System
 * Systematic world exploration, biome discovery, and structure finding
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class ExplorationSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Discovered biomes
    this.discoveredBiomes = new Set();

    // All Minecraft biomes to discover
    this.allBiomes = [
      "plains", "forest", "taiga", "mountains", "swamp", "jungle",
      "desert", "savanna", "badlands", "ocean", "river", "beach",
      "mushroom_fields", "ice_spikes", "snowy_tundra", "snowy_taiga",
      "dark_forest", "birch_forest", "flower_forest", "sunflower_plains",
      "bamboo_jungle", "soul_sand_valley", "crimson_forest", "warped_forest",
      "basalt_deltas", "nether_wastes", "the_end", "small_end_islands",
      "end_midlands", "end_highlands", "end_barrens"
    ];

    // Discovered structures
    this.discoveredStructures = new Map();

    // All structures to find
    this.structureGoals = {
      "village": { priority: 10, dimension: "overworld", found: false },
      "desert_pyramid": { priority: 7, dimension: "overworld", found: false },
      "jungle_pyramid": { priority: 7, dimension: "overworld", found: false },
      "witch_hut": { priority: 6, dimension: "overworld", found: false },
      "ocean_monument": { priority: 8, dimension: "overworld", found: false },
      "woodland_mansion": { priority: 9, dimension: "overworld", found: false },
      "shipwreck": { priority: 5, dimension: "overworld", found: false },
      "buried_treasure": { priority: 6, dimension: "overworld", found: false },
      "ruined_portal": { priority: 6, dimension: "overworld", found: false },
      "mineshaft": { priority: 5, dimension: "overworld", found: false },
      "stronghold": { priority: 10, dimension: "overworld", found: false },
      "nether_fortress": { priority: 9, dimension: "nether", found: false },
      "bastion_remnant": { priority: 8, dimension: "nether", found: false },
      "end_city": { priority: 9, dimension: "end", found: false }
    };

    // Exploration grid (track visited chunks)
    this.exploredChunks = new Set();

    // Exploration strategy
    this.explorationPattern = "spiral"; // spiral, grid, random

    // Exploration center
    this.explorationCenter = null;

    // Exploration radius
    this.explorationRadius = 0;
    this.maxExplorationRadius = 5000; // 5000 blocks

    // Points of interest
    this.pointsOfInterest = [];

    // Exploration stats
    this.distanceTraveled = 0;
    this.lastPosition = null;
  }

  /**
   * Initialize exploration from spawn/current location
   */
  initializeExploration(centerPos = null) {
    if (!centerPos) {
      centerPos = this.bot.entity.position.floored();
    }

    this.explorationCenter = new Vec3(centerPos.x, centerPos.y, centerPos.z);
    this.lastPosition = this.explorationCenter.clone();

    console.log(`[${this.agentName}] Exploration initialized at ${this.explorationCenter.x}, ${this.explorationCenter.z}`);

    logEvent(this.agentName, "exploration", {
      action: "initialize",
      center: this.explorationCenter
    });
  }

  /**
   * Get next exploration target based on pattern
   */
  getNextExplorationTarget() {
    if (!this.explorationCenter) {
      this.initializeExploration();
    }

    let targetPos;

    switch (this.explorationPattern) {
      case "spiral":
        targetPos = this.getSpiralTarget();
        break;

      case "grid":
        targetPos = this.getGridTarget();
        break;

      case "random":
        targetPos = this.getRandomTarget();
        break;

      default:
        targetPos = this.getSpiralTarget();
    }

    return targetPos;
  }

  /**
   * Spiral exploration pattern
   */
  getSpiralTarget() {
    const angle = (this.explorationRadius / 100) * Math.PI * 2;
    this.explorationRadius += 100;

    if (this.explorationRadius > this.maxExplorationRadius) {
      this.explorationRadius = 100; // Reset
    }

    const x = this.explorationCenter.x + Math.cos(angle) * this.explorationRadius;
    const z = this.explorationCenter.z + Math.sin(angle) * this.explorationRadius;

    return new Vec3(Math.floor(x), 64, Math.floor(z));
  }

  /**
   * Grid exploration pattern
   */
  getGridTarget() {
    const gridSize = 200; // 200 blocks per grid cell

    const gridX = Math.floor(this.explorationRadius / gridSize);
    const gridZ = Math.floor((this.explorationRadius % (gridSize * 10)) / gridSize);

    this.explorationRadius += gridSize;

    const x = this.explorationCenter.x + gridX * gridSize;
    const z = this.explorationCenter.z + gridZ * gridSize;

    return new Vec3(x, 64, z);
  }

  /**
   * Random exploration pattern
   */
  getRandomTarget() {
    const range = this.maxExplorationRadius;

    const x = this.explorationCenter.x + (Math.random() * range * 2 - range);
    const z = this.explorationCenter.z + (Math.random() * range * 2 - range);

    return new Vec3(Math.floor(x), 64, Math.floor(z));
  }

  /**
   * Explore to a target location
   */
  async exploreToTarget(targetPos) {
    console.log(`[${this.agentName}] Exploring to ${targetPos.x}, ${targetPos.z}...`);

    try {
      // Navigate to target
      await this.bot.pathfinder.goto(new GoalNear(targetPos.x, targetPos.y, targetPos.z, 10));

      // Update distance traveled
      if (this.lastPosition) {
        const distance = this.lastPosition.distanceTo(this.bot.entity.position);
        this.distanceTraveled += distance;
      }

      this.lastPosition = this.bot.entity.position.clone();

      // Mark chunk as explored
      const chunkX = Math.floor(targetPos.x / 16);
      const chunkZ = Math.floor(targetPos.z / 16);
      this.exploredChunks.add(`${chunkX},${chunkZ}`);

      // Discover biome
      await this.discoverCurrentBiome();

      // Scan for structures
      await this.scanForStructures();

      console.log(`[${this.agentName}] Explored ${this.exploredChunks.size} chunks, ${this.distanceTraveled.toFixed(0)}m traveled`);

      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Exploration failed:`, err.message);
      return false;
    }
  }

  /**
   * Discover current biome
   */
  async discoverCurrentBiome() {
    try {
      const pos = this.bot.entity.position.floored();
      const block = this.bot.blockAt(pos);

      if (block) {
        const biome = block.biome?.name || "unknown";

        if (!this.discoveredBiomes.has(biome) && biome !== "unknown") {
          this.discoveredBiomes.add(biome);
          console.log(`[${this.agentName}] 🌍 Discovered biome: ${biome} (${this.discoveredBiomes.size}/${this.allBiomes.length})`);

          logEvent(this.agentName, "exploration", {
            biome,
            total: this.discoveredBiomes.size
          });
        }
      }
    } catch (err) {
      // Biome detection might fail
    }
  }

  /**
   * Scan for structures nearby
   */
  async scanForStructures() {
    const radius = 100;
    const pos = this.bot.entity.position;

    // Look for specific structure indicators
    const blocks = this.bot.findBlocks({
      matching: (block) => {
        // Desert pyramid: sandstone
        if (block.name === "sandstone" || block.name === "chiseled_sandstone") {
          return true;
        }
        // Jungle temple: mossy cobblestone
        if (block.name === "mossy_cobblestone") {
          return true;
        }
        // Village: beds, bells
        if (block.name === "bed" || block.name === "bell") {
          return true;
        }
        // Ocean monument: prismarine
        if (block.name.includes("prismarine")) {
          return true;
        }
        // Nether fortress: nether bricks
        if (block.name === "nether_bricks") {
          return true;
        }
        // Stronghold: stone bricks with patterns
        if (block.name === "stone_bricks" || block.name === "mossy_stone_bricks") {
          return true;
        }

        return false;
      },
      maxDistance: radius,
      count: 10
    });

    if (blocks && blocks.length > 5) {
      // Likely found a structure
      const structurePos = blocks[0];
      const key = `${Math.floor(structurePos.x / 100)},${Math.floor(structurePos.z / 100)}`;

      if (!this.discoveredStructures.has(key)) {
        this.discoveredStructures.set(key, {
          position: structurePos,
          discoveredAt: Date.now()
        });

        this.pointsOfInterest.push({
          type: "structure",
          position: structurePos,
          importance: 8
        });

        console.log(`[${this.agentName}] 🏛️  Possible structure at ${structurePos.x}, ${structurePos.y}, ${structurePos.z}`);
      }
    }
  }

  /**
   * Find specific structure type
   */
  async findStructure(structureType) {
    const goal = this.structureGoals[structureType];
    if (!goal) {
      console.log(`[${this.agentName}] Unknown structure: ${structureType}`);
      return null;
    }

    if (goal.found) {
      console.log(`[${this.agentName}] Already found ${structureType}`);
      return goal.position;
    }

    console.log(`[${this.agentName}] Searching for ${structureType}...`);

    // Explore until found (simplified - in practice would use /locate command or systematic search)
    for (let i = 0; i < 10; i++) {
      const target = this.getNextExplorationTarget();
      await this.exploreToTarget(target);

      await this.scanForStructures();

      // Check if we found it
      if (this.discoveredStructures.size > 0) {
        // Mark as found
        goal.found = true;
        goal.position = Array.from(this.discoveredStructures.values())[0].position;

        console.log(`[${this.agentName}] ✅ Found ${structureType}!`);
        return goal.position;
      }
    }

    return null;
  }

  /**
   * Mark point of interest
   */
  addPointOfInterest(position, type, importance = 5) {
    this.pointsOfInterest.push({
      type,
      position: new Vec3(position.x, position.y, position.z),
      importance,
      addedAt: Date.now()
    });

    console.log(`[${this.agentName}] 📍 Marked ${type} at ${position.x}, ${position.y}, ${position.z}`);
  }

  /**
   * Get nearest point of interest
   */
  getNearestPOI(type = null) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const poi of this.pointsOfInterest) {
      if (type && poi.type !== type) continue;

      const distance = this.bot.entity.position.distanceTo(poi.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = poi;
      }
    }

    return nearest;
  }

  /**
   * Auto-explore routine
   */
  async autoExplore(duration = 300000) {
    console.log(`[${this.agentName}] Starting auto-exploration for ${duration / 1000}s...`);

    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const target = this.getNextExplorationTarget();
      await this.exploreToTarget(target);

      // Short break
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`[${this.agentName}] Auto-exploration complete!`);
    this.printExplorationStats();
  }

  /**
   * Print exploration statistics
   */
  printExplorationStats() {
    console.log("\n" + "=".repeat(70));
    console.log("  🗺️  EXPLORATION STATISTICS");
    console.log("=".repeat(70));
    console.log(`Biomes Discovered: ${this.discoveredBiomes.size}/${this.allBiomes.length}`);
    console.log(`Chunks Explored: ${this.exploredChunks.size}`);
    console.log(`Distance Traveled: ${(this.distanceTraveled / 1000).toFixed(2)} km`);
    console.log(`Structures Found: ${this.discoveredStructures.size}`);
    console.log(`Points of Interest: ${this.pointsOfInterest.length}`);

    console.log("\nBiomes Found:");
    for (const biome of this.discoveredBiomes) {
      console.log(`  - ${biome}`);
    }

    console.log("=".repeat(70) + "\n");
  }

  /**
   * Get exploration progress
   */
  getProgress() {
    const biomePercent = ((this.discoveredBiomes.size / this.allBiomes.length) * 100).toFixed(1);

    const totalStructures = Object.keys(this.structureGoals).length;
    const foundStructures = Object.values(this.structureGoals).filter(s => s.found).length;
    const structurePercent = ((foundStructures / totalStructures) * 100).toFixed(1);

    return {
      biomesDiscovered: this.discoveredBiomes.size,
      totalBiomes: this.allBiomes.length,
      biomePercent,
      structuresFound: foundStructures,
      totalStructures,
      structurePercent,
      chunksExplored: this.exploredChunks.size,
      distanceTraveled: this.distanceTraveled,
      pointsOfInterest: this.pointsOfInterest.length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      biomesDiscovered: this.discoveredBiomes.size,
      structuresFound: this.discoveredStructures.size,
      chunksExplored: this.exploredChunks.size,
      distanceTraveled: Math.floor(this.distanceTraveled),
      pointsOfInterest: this.pointsOfInterest.length,
      explorationRadius: this.explorationRadius
    };
  }
}

module.exports = { ExplorationSystem };
