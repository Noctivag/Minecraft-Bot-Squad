/**
 * Defense System
 * Protect base from hostile mobs with walls, towers, traps, and active defense
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class DefenseSystem {
  constructor(bot, agentName, combatSystem) {
    this.bot = bot;
    this.agentName = agentName;
    this.combat = combatSystem;

    // Protected area
    this.protectedArea = null;
    this.protectionRadius = 50;

    // Defense structures
    this.defenseStructures = [];

    // Detected threats
    this.threats = new Map();

    // Defense mode
    this.defenseMode = "passive"; // passive, active, fortress

    // Patrol points
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;

    // Alert level
    this.alertLevel = 0; // 0 = safe, 1 = caution, 2 = danger, 3 = emergency

    // Defense stats
    this.threatsDefeated = 0;
    this.lastThreatTime = 0;
  }

  /**
   * Set protected area
   */
  setProtectedArea(centerPos, radius = 50) {
    this.protectedArea = new Vec3(centerPos.x, centerPos.y, centerPos.z);
    this.protectionRadius = radius;

    console.log(`[${this.agentName}] Protected area: ${centerPos.x}, ${centerPos.y}, ${centerPos.z} (radius: ${radius})`);

    // Create patrol points around perimeter
    this.createPatrolPoints();

    logEvent(this.agentName, "defense", {
      action: "set_protected_area",
      radius
    });
  }

  /**
   * Create patrol points around protected area
   */
  createPatrolPoints() {
    this.patrolPoints = [];

    const points = 8; // 8 patrol points
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const x = this.protectedArea.x + Math.cos(angle) * this.protectionRadius;
      const z = this.protectedArea.z + Math.sin(angle) * this.protectionRadius;

      this.patrolPoints.push(new Vec3(Math.floor(x), this.protectedArea.y, Math.floor(z)));
    }

    console.log(`[${this.agentName}] Created ${points} patrol points`);
  }

  /**
   * Scan for threats in protected area
   */
  scanForThreats() {
    if (!this.protectedArea) return [];

    const entities = Object.values(this.bot.entities);
    const threats = [];

    const hostileMobs = [
      "zombie", "skeleton", "creeper", "spider", "enderman",
      "witch", "slime", "phantom", "drowned", "pillager",
      "vindicator", "evoker", "ravager", "piglin", "hoglin",
      "blaze", "ghast", "magma_cube", "wither_skeleton"
    ];

    for (const entity of entities) {
      if (hostileMobs.includes(entity.name) && entity.position) {
        const distance = this.protectedArea.distanceTo(entity.position);

        if (distance <= this.protectionRadius) {
          const threatData = {
            id: entity.id,
            type: entity.name,
            position: entity.position.clone(),
            distance,
            health: entity.health || 20,
            detectedAt: Date.now()
          };

          threats.push(threatData);

          if (!this.threats.has(entity.id)) {
            this.threats.set(entity.id, threatData);
            console.log(`[${this.agentName}] ⚠️  Threat detected: ${entity.name} at ${distance.toFixed(0)}m`);
          }
        }
      }
    }

    // Update alert level
    this.updateAlertLevel(threats.length);

    return threats;
  }

  /**
   * Update alert level based on threats
   */
  updateAlertLevel(threatCount) {
    const oldLevel = this.alertLevel;

    if (threatCount === 0) {
      this.alertLevel = 0; // Safe
    } else if (threatCount <= 2) {
      this.alertLevel = 1; // Caution
    } else if (threatCount <= 5) {
      this.alertLevel = 2; // Danger
    } else {
      this.alertLevel = 3; // Emergency
    }

    if (this.alertLevel > oldLevel) {
      console.log(`[${this.agentName}] 🚨 Alert level: ${this.alertLevel} (${this.getAlertLevelName()})`);
    }
  }

  /**
   * Get alert level name
   */
  getAlertLevelName() {
    const names = ["Safe", "Caution", "Danger", "Emergency"];
    return names[this.alertLevel] || "Unknown";
  }

  /**
   * Defend against threats
   */
  async defendArea() {
    const threats = this.scanForThreats();

    if (threats.length === 0) {
      return false;
    }

    console.log(`[${this.agentName}] Defending against ${threats.length} threats...`);

    // Sort by distance (closest first)
    threats.sort((a, b) => a.distance - b.distance);

    // Engage closest threat
    const threat = threats[0];
    const entity = this.bot.entities[threat.id];

    if (entity && this.combat) {
      console.log(`[${this.agentName}] Engaging ${threat.type}...`);

      try {
        await this.combat.attackEntity(entity);
        this.threatsDefeated++;
        this.lastThreatTime = Date.now();

        // Remove from threats map
        this.threats.delete(threat.id);

        console.log(`[${this.agentName}] ✅ Threat eliminated (total: ${this.threatsDefeated})`);

        logEvent(this.agentName, "defense", {
          action: "threat_defeated",
          type: threat.type
        });

        return true;

      } catch (err) {
        console.error(`[${this.agentName}] Failed to eliminate threat:`, err.message);
      }
    }

    return false;
  }

  /**
   * Patrol perimeter
   */
  async patrol() {
    if (this.patrolPoints.length === 0) {
      console.log(`[${this.agentName}] No patrol points set`);
      return false;
    }

    const targetPoint = this.patrolPoints[this.currentPatrolIndex];

    console.log(`[${this.agentName}] Patrolling to point ${this.currentPatrolIndex + 1}/${this.patrolPoints.length}...`);

    try {
      await this.bot.pathfinder.goto(new GoalNear(targetPoint.x, targetPoint.y, targetPoint.z, 5));

      // Scan for threats at this point
      const threats = this.scanForThreats();
      if (threats.length > 0) {
        await this.defendArea();
      }

      // Move to next patrol point
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;

      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Patrol failed:`, err.message);
      return false;
    }
  }

  /**
   * Build defensive wall around area
   */
  async buildDefensiveWall(height = 4, material = "cobblestone") {
    if (!this.protectedArea) {
      console.log(`[${this.agentName}] No protected area set`);
      return false;
    }

    console.log(`[${this.agentName}] Building defensive wall (${height} blocks high)...`);

    const wallBlocks = [];

    // Circle wall
    for (let angle = 0; angle < 360; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const x = this.protectedArea.x + Math.cos(rad) * this.protectionRadius;
      const z = this.protectedArea.z + Math.sin(rad) * this.protectionRadius;

      for (let y = 0; y < height; y++) {
        wallBlocks.push({
          x: Math.floor(x),
          y: this.protectedArea.y + y,
          z: Math.floor(z),
          block: material
        });
      }
    }

    let placed = 0;
    for (const { x, y, z, block } of wallBlocks) {
      try {
        await this.placeBlock({ x, y, z }, block);
        placed++;
      } catch (err) {
        continue;
      }
    }

    this.defenseStructures.push({
      type: "wall",
      height,
      material,
      blocksPlaced: placed,
      builtAt: Date.now()
    });

    console.log(`[${this.agentName}] ✅ Wall built: ${placed} blocks`);

    logEvent(this.agentName, "defense", {
      action: "wall_built",
      blocks: placed
    });

    return true;
  }

  /**
   * Build defensive tower
   */
  async buildDefensiveTower(position, height = 12) {
    console.log(`[${this.agentName}] Building defensive tower...`);

    const blocks = [];

    // 5x5 base
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        for (let y = 0; y < height; y++) {
          // Hollow interior (only walls)
          if (x === 0 || x === 4 || z === 0 || z === 4 || y === 0) {
            blocks.push({ x, y, z, block: "stone_bricks" });
          }
        }
      }
    }

    // Ladder inside
    for (let y = 1; y < height; y++) {
      blocks.push({ x: 2, y, z: 2, block: "ladder" });
    }

    // Battlements on top
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        if ((x + z) % 2 === 0) {
          blocks.push({ x, y: height, z, block: "stone_brick_wall" });
        }
      }
    }

    // Torches for lighting
    blocks.push({ x: 1, y: height - 1, z: 1, block: "torch" });
    blocks.push({ x: 3, y: height - 1, z: 1, block: "torch" });
    blocks.push({ x: 1, y: height - 1, z: 3, block: "torch" });
    blocks.push({ x: 3, y: height - 1, z: 3, block: "torch" });

    let placed = 0;
    for (const { x, y, z, block } of blocks) {
      try {
        await this.placeBlock({
          x: position.x + x,
          y: position.y + y,
          z: position.z + z
        }, block);
        placed++;
      } catch (err) {
        continue;
      }
    }

    this.defenseStructures.push({
      type: "tower",
      position,
      height,
      blocksPlaced: placed,
      builtAt: Date.now()
    });

    console.log(`[${this.agentName}] ✅ Tower built: ${placed} blocks`);

    return true;
  }

  /**
   * Build trap (lava trap, pitfall, etc.)
   */
  async buildTrap(position, trapType = "pitfall") {
    console.log(`[${this.agentName}] Building ${trapType} trap...`);

    const blocks = [];

    if (trapType === "pitfall") {
      // 5x5x5 pit
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          for (let y = 0; y < 5; y++) {
            blocks.push({ x, y: -y, z, block: "air" });
          }
        }
      }

      // Lava at bottom
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          blocks.push({ x, y: -5, z, block: "lava" });
        }
      }

    } else if (trapType === "lava") {
      // Lava trap with dispenser
      blocks.push({ x: 0, y: 0, z: 0, block: "dispenser" });
      blocks.push({ x: 0, y: -1, z: 0, block: "lava" });
      blocks.push({ x: 1, y: 0, z: 0, block: "stone_pressure_plate" });
    }

    let placed = 0;
    for (const { x, y, z, block } of blocks) {
      try {
        await this.placeBlock({
          x: position.x + x,
          y: position.y + y,
          z: position.z + z
        }, block);
        placed++;
      } catch (err) {
        continue;
      }
    }

    this.defenseStructures.push({
      type: `trap_${trapType}`,
      position,
      blocksPlaced: placed,
      builtAt: Date.now()
    });

    console.log(`[${this.agentName}] ✅ Trap built: ${placed} blocks`);

    return true;
  }

  /**
   * Place a block
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) return false;

    try {
      await this.bot.equip(item, "hand");

      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== "air") {
        return false;
      }

      const referencePos = position.offset(0, -1, 0);
      const referenceBlock = this.bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== "air") {
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
      }
    } catch (err) {
      return false;
    }

    return false;
  }

  /**
   * Get defense status
   */
  getDefenseStatus() {
    const threats = this.scanForThreats();

    return {
      alertLevel: this.alertLevel,
      alertName: this.getAlertLevelName(),
      activeThreats: threats.length,
      threatsDefeated: this.threatsDefeated,
      defenseStructures: this.defenseStructures.length,
      protectedArea: this.protectedArea !== null,
      protectionRadius: this.protectionRadius,
      patrolPoints: this.patrolPoints.length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      threatsDefeated: this.threatsDefeated,
      defenseStructures: this.defenseStructures.length,
      alertLevel: this.alertLevel,
      activeThreats: this.threats.size,
      protectionRadius: this.protectionRadius,
      patrolPoints: this.patrolPoints.length
    };
  }
}

module.exports = { DefenseSystem };
