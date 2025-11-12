const { logEvent } = require("../../memory/store");

/**
 * Vision and Perception System - Environmental awareness and analysis
 */
class PerceptionSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.worldState = {
      nearbyBlocks: new Map(),
      nearbyEntities: new Map(),
      nearbyPlayers: new Map(),
      dangerLevel: 0,
      lastUpdate: 0
    };
    this.scanRadius = 32;
    this.updateInterval = 2000; // Update every 2 seconds

    this.startPerceptionLoop();
  }

  /**
   * Start continuous perception updates
   */
  startPerceptionLoop() {
    setInterval(() => {
      this.updateWorldState();
    }, this.updateInterval);
  }

  /**
   * Update world state by scanning environment
   */
  updateWorldState() {
    this.worldState.lastUpdate = Date.now();

    // Scan nearby entities
    this.scanEntities();

    // Scan nearby blocks
    this.scanBlocks();

    // Calculate danger level
    this.assessDanger();

    // Detect opportunities
    this.detectOpportunities();
  }

  /**
   * Scan nearby entities
   */
  scanEntities() {
    this.worldState.nearbyEntities.clear();
    this.worldState.nearbyPlayers.clear();

    const entities = Object.values(this.bot.entities);

    for (const entity of entities) {
      if (!entity.position) continue;

      const distance = this.bot.entity.position.distanceTo(entity.position);
      if (distance > this.scanRadius) continue;

      const entityData = {
        id: entity.id,
        type: entity.type,
        name: entity.name,
        position: entity.position,
        distance,
        velocity: entity.velocity,
        health: entity.metadata?.[8] // Health (if available)
      };

      if (entity.type === "player") {
        this.worldState.nearbyPlayers.set(entity.username, entityData);
      } else {
        this.worldState.nearbyEntities.set(entity.id, entityData);
      }
    }
  }

  /**
   * Scan nearby blocks for resources and hazards
   */
  scanBlocks() {
    this.worldState.nearbyBlocks.clear();

    const pos = this.bot.entity.position;
    const scanSize = 16;

    // Scan in chunks to avoid lag
    const valuableBlocks = [
      "diamond_ore", "iron_ore", "gold_ore", "coal_ore",
      "redstone_ore", "lapis_ore", "emerald_ore",
      "chest", "barrel", "furnace", "crafting_table",
      "water", "lava"
    ];

    for (let x = -scanSize; x <= scanSize; x += 2) {
      for (let y = -scanSize; y <= scanSize; y += 2) {
        for (let z = -scanSize; z <= scanSize; z += 2) {
          const blockPos = pos.offset(x, y, z);
          const block = this.bot.blockAt(blockPos);

          if (block && valuableBlocks.includes(block.name)) {
            const distance = pos.distanceTo(blockPos);

            if (!this.worldState.nearbyBlocks.has(block.name)) {
              this.worldState.nearbyBlocks.set(block.name, []);
            }

            this.worldState.nearbyBlocks.get(block.name).push({
              position: blockPos,
              distance,
              block: block.name
            });
          }
        }
      }
    }
  }

  /**
   * Assess danger level based on environment
   */
  assessDanger() {
    let danger = 0;

    // Check for hostile mobs
    for (const [id, entity] of this.worldState.nearbyEntities) {
      if (this.isHostileMob(entity.name)) {
        // Closer = more dangerous
        const threatLevel = Math.max(0, 10 - entity.distance / 2);
        danger += threatLevel;
      }
    }

    // Check for environmental hazards
    const lavaBlocks = this.worldState.nearbyBlocks.get("lava") || [];
    if (lavaBlocks.length > 0) {
      const closestLava = Math.min(...lavaBlocks.map(b => b.distance));
      if (closestLava < 5) danger += 5;
    }

    // Check health
    if (this.bot.health < 10) danger += 5;
    if (this.bot.health < 5) danger += 10;

    this.worldState.dangerLevel = Math.min(danger, 100);

    // Log high danger situations
    if (this.worldState.dangerLevel > 20) {
      logEvent(this.agentName, "perception", {
        type: "high_danger",
        level: this.worldState.dangerLevel
      });
    }
  }

  /**
   * Check if entity is hostile
   */
  isHostileMob(name) {
    const hostileMobs = [
      "zombie", "skeleton", "creeper", "spider", "enderman",
      "witch", "blaze", "ghast", "phantom", "drowned"
    ];

    return name && hostileMobs.some(mob => name.toLowerCase().includes(mob));
  }

  /**
   * Detect opportunities (resources, structures, etc.)
   */
  detectOpportunities() {
    const opportunities = [];

    // Resource opportunities
    for (const [blockType, blocks] of this.worldState.nearbyBlocks) {
      if (blockType.includes("ore")) {
        opportunities.push({
          type: "mining",
          resource: blockType,
          count: blocks.length,
          nearest: blocks.reduce((min, b) => b.distance < min ? b.distance : min, Infinity)
        });
      }

      if (blockType === "chest") {
        opportunities.push({
          type: "looting",
          target: "chest",
          count: blocks.length
        });
      }
    }

    // Animal opportunities (for farming/food)
    const animals = ["cow", "pig", "sheep", "chicken"];
    for (const [id, entity] of this.worldState.nearbyEntities) {
      if (animals.some(animal => entity.name?.toLowerCase().includes(animal))) {
        const existing = opportunities.find(o => o.type === "farming" && o.animal === entity.name);
        if (existing) {
          existing.count++;
        } else {
          opportunities.push({
            type: "farming",
            animal: entity.name,
            count: 1,
            distance: entity.distance
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Find nearest resource of a specific type
   */
  findNearestResource(resourceType) {
    const blocks = this.worldState.nearbyBlocks.get(resourceType);
    if (!blocks || blocks.length === 0) return null;

    return blocks.reduce((nearest, block) =>
      !nearest || block.distance < nearest.distance ? block : nearest
    , null);
  }

  /**
   * Find safe location to retreat to
   */
  findSafeLocation() {
    const pos = this.bot.entity.position;
    const candidates = [];

    // Sample locations in a radius
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      for (let dist = 10; dist <= 30; dist += 10) {
        const x = Math.floor(pos.x + Math.cos(angle) * dist);
        const z = Math.floor(pos.z + Math.sin(angle) * dist);

        const safetyScore = this.evaluateLocationSafety({ x, y: pos.y, z });
        candidates.push({
          position: { x, y: pos.y, z },
          safetyScore
        });
      }
    }

    // Return safest location
    return candidates.reduce((safest, loc) =>
      loc.safetyScore > safest.safetyScore ? loc : safest
    , candidates[0]);
  }

  /**
   * Evaluate safety of a location
   */
  evaluateLocationSafety(position) {
    let safety = 100;

    // Check distance from hostile mobs
    for (const [id, entity] of this.worldState.nearbyEntities) {
      if (this.isHostileMob(entity.name)) {
        const dist = Math.sqrt(
          Math.pow(position.x - entity.position.x, 2) +
          Math.pow(position.z - entity.position.z, 2)
        );

        if (dist < 10) safety -= 30;
        else if (dist < 20) safety -= 10;
      }
    }

    // Check for lava/hazards
    const lavaBlocks = this.worldState.nearbyBlocks.get("lava") || [];
    for (const lava of lavaBlocks) {
      const dist = Math.sqrt(
        Math.pow(position.x - lava.position.x, 2) +
        Math.pow(position.z - lava.position.z, 2)
      );

      if (dist < 5) safety -= 50;
    }

    return Math.max(0, safety);
  }

  /**
   * Analyze biome (simplified - would need actual biome detection)
   */
  analyzeBiome() {
    const blocks = [];

    // Sample blocks nearby
    const pos = this.bot.entity.position;
    for (let i = 0; i < 10; i++) {
      const randomOffset = {
        x: Math.floor(Math.random() * 20) - 10,
        z: Math.floor(Math.random() * 20) - 10
      };

      const block = this.bot.blockAt(pos.offset(randomOffset.x, -1, randomOffset.z));
      if (block) blocks.push(block.name);
    }

    // Determine biome characteristics
    const hasSnow = blocks.some(b => b.includes("snow"));
    const hasSand = blocks.some(b => b.includes("sand"));
    const hasStone = blocks.some(b => b.includes("stone"));

    if (hasSnow) return "snowy";
    if (hasSand) return "desert";
    if (hasStone) return "mountain";

    return "plains";
  }

  /**
   * Get visible players
   */
  getVisiblePlayers() {
    return Array.from(this.worldState.nearbyPlayers.values()).map(p => ({
      username: p.name,
      distance: p.distance,
      position: p.position
    }));
  }

  /**
   * Get perception summary for LLM context
   */
  getSummary() {
    const summary = {
      timestamp: this.worldState.lastUpdate,
      position: this.bot.entity.position,
      health: this.bot.health,
      food: this.bot.food,
      dangerLevel: this.worldState.dangerLevel,
      nearbyPlayers: this.getVisiblePlayers().length,
      nearbyMobs: {
        total: this.worldState.nearbyEntities.size,
        hostile: Array.from(this.worldState.nearbyEntities.values())
          .filter(e => this.isHostileMob(e.name)).length
      },
      resources: {},
      opportunities: this.detectOpportunities()
    };

    // Summarize nearby resources
    for (const [blockType, blocks] of this.worldState.nearbyBlocks) {
      summary.resources[blockType] = {
        count: blocks.length,
        nearest: Math.min(...blocks.map(b => b.distance))
      };
    }

    return summary;
  }

  /**
   * Get detailed environmental report
   */
  getEnvironmentReport() {
    const report = [];

    report.push(`=== Environmental Report for ${this.agentName} ===`);
    report.push(`Position: (${Math.floor(this.bot.entity.position.x)}, ${Math.floor(this.bot.entity.position.y)}, ${Math.floor(this.bot.entity.position.z)})`);
    report.push(`Health: ${this.bot.health}/20, Food: ${this.bot.food}/20`);
    report.push(`Danger Level: ${this.worldState.dangerLevel}/100`);
    report.push("");

    report.push("Nearby Players:");
    const players = this.getVisiblePlayers();
    if (players.length > 0) {
      players.forEach(p => {
        report.push(`  - ${p.username} (${p.distance.toFixed(1)}m away)`);
      });
    } else {
      report.push("  None");
    }
    report.push("");

    report.push("Nearby Mobs:");
    const mobs = Array.from(this.worldState.nearbyEntities.values());
    if (mobs.length > 0) {
      const mobCounts = {};
      mobs.forEach(m => {
        mobCounts[m.name] = (mobCounts[m.name] || 0) + 1;
      });
      Object.entries(mobCounts).forEach(([name, count]) => {
        report.push(`  - ${count}x ${name}`);
      });
    } else {
      report.push("  None");
    }
    report.push("");

    report.push("Nearby Resources:");
    if (this.worldState.nearbyBlocks.size > 0) {
      for (const [blockType, blocks] of this.worldState.nearbyBlocks) {
        const nearest = Math.min(...blocks.map(b => b.distance));
        report.push(`  - ${blocks.length}x ${blockType} (nearest: ${nearest.toFixed(1)}m)`);
      }
    } else {
      report.push("  None detected");
    }

    return report.join("\n");
  }
}

module.exports = { PerceptionSystem };
