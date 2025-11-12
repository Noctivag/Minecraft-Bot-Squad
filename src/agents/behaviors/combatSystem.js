const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Advanced Combat System - Self-defense, mob hunting, and team protection
 */
class CombatSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.combatMode = "defensive"; // defensive, aggressive, passive
    this.threats = new Map(); // entity -> { firstSeen, lastSeen, threatLevel }
    this.combatCooldown = 0;
    this.guardPosition = null;
    this.guardRadius = 16;

    this.setupCombatListeners();
  }

  setupCombatListeners() {
    // Monitor for hostile mobs
    this.bot.on("entitySpawn", (entity) => {
      if (this.isHostile(entity)) {
        this.detectThreat(entity);
      }
    });

    // Monitor health changes
    this.bot.on("health", () => {
      if (this.bot.health < 10 && this.bot.health > 0) {
        this.emergencyRetreat();
      }
    });

    // Monitor for attacks
    this.bot.on("entityHurt", (entity) => {
      if (entity === this.bot.entity) {
        this.respondToAttack();
      }
    });
  }

  /**
   * Check if entity is hostile
   */
  isHostile(entity) {
    const hostileMobs = [
      "zombie", "skeleton", "creeper", "spider", "enderman",
      "witch", "blaze", "ghast", "slime", "magma_cube",
      "phantom", "drowned", "husk", "stray", "wither_skeleton",
      "pillager", "vindicator", "evoker", "ravager"
    ];

    return entity.type === "mob" && hostileMobs.some(mob =>
      entity.name?.toLowerCase().includes(mob)
    );
  }

  /**
   * Detect and track threat
   */
  detectThreat(entity) {
    const distance = this.bot.entity.position.distanceTo(entity.position);

    if (distance > 32) return; // Too far to care

    const threatLevel = this.calculateThreatLevel(entity, distance);

    this.threats.set(entity.id, {
      entity,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      threatLevel,
      distance
    });

    logEvent(this.agentName, "threat_detected", {
      mobType: entity.name,
      distance,
      threatLevel
    });

    if (this.combatMode !== "passive" && threatLevel > 5) {
      this.engageThreat(entity);
    }
  }

  /**
   * Calculate threat level based on mob type and distance
   */
  calculateThreatLevel(entity, distance) {
    let level = 5;

    // Distance factor
    if (distance < 5) level += 5;
    else if (distance < 10) level += 3;
    else if (distance < 20) level += 1;

    // Mob type factor
    const mobName = entity.name?.toLowerCase() || "";
    if (mobName.includes("creeper")) level += 3; // Creepers are dangerous
    if (mobName.includes("enderman")) level += 2;
    if (mobName.includes("witch")) level += 2;
    if (mobName.includes("phantom")) level += 2;

    return level;
  }

  /**
   * Engage a threat in combat
   */
  async engageThreat(entity) {
    if (this.combatCooldown > Date.now()) return;

    this.combatCooldown = Date.now() + 500; // 500ms cooldown

    try {
      // Equip best weapon
      await this.equipBestWeapon();

      // Attack the entity
      this.bot.attack(entity);

      recordMetric(this.agentName, "combat_engagement", 1, {
        mobType: entity.name,
        weapon: this.bot.heldItem?.name
      });

      logEvent(this.agentName, "combat", {
        action: "attack",
        target: entity.name,
        health: this.bot.health
      });

      // Follow and attack if still alive
      if (entity.isValid && !entity.metadata[6]) { // Not dead
        this.bot.pathfinder.setGoal(new (require("mineflayer-pathfinder").goals.GoalFollow)(entity, 2), true);
      }

    } catch (err) {
      console.error(`[${this.agentName}] Combat error:`, err.message);
    }
  }

  /**
   * Equip the best available weapon
   */
  async equipBestWeapon() {
    const weaponPriority = [
      "diamond_sword", "iron_sword", "stone_sword", "wooden_sword",
      "diamond_axe", "iron_axe", "stone_axe", "wooden_axe"
    ];

    for (const weaponName of weaponPriority) {
      const weapon = this.bot.inventory.items().find(item =>
        item.name === weaponName
      );

      if (weapon) {
        await this.bot.equip(weapon, "hand");
        return weapon;
      }
    }

    return null;
  }

  /**
   * Emergency retreat when low health
   */
  async emergencyRetreat() {
    console.log(`[${this.agentName}] Emergency retreat! Health: ${this.bot.health}`);

    logEvent(this.agentName, "combat", {
      action: "retreat",
      health: this.bot.health,
      reason: "low_health"
    });

    // Run away from nearest threat
    const nearestThreat = this.findNearestThreat();
    if (nearestThreat) {
      const awayVector = this.bot.entity.position.minus(nearestThreat.position);
      const retreatPos = this.bot.entity.position.offset(
        awayVector.x * 2,
        0,
        awayVector.z * 2
      );

      try {
        const { goals } = require("mineflayer-pathfinder");
        await this.bot.pathfinder.goto(new goals.GoalBlock(
          retreatPos.x, retreatPos.y, retreatPos.z
        ));
      } catch (err) {
        console.error(`[${this.agentName}] Retreat failed:`, err.message);
      }
    }

    // Try to eat food if available
    this.tryEat();
  }

  /**
   * Try to eat food to recover health
   */
  async tryEat() {
    const foods = [
      "cooked_beef", "cooked_porkchop", "cooked_chicken", "cooked_mutton",
      "bread", "apple", "golden_apple", "carrot", "potato", "beetroot"
    ];

    for (const foodName of foods) {
      const food = this.bot.inventory.items().find(item => item.name === foodName);
      if (food) {
        try {
          await this.bot.equip(food, "hand");
          await this.bot.consume();
          console.log(`[${this.agentName}] Ate ${foodName}`);
          return true;
        } catch (err) {
          console.error(`[${this.agentName}] Failed to eat:`, err.message);
        }
      }
    }

    return false;
  }

  /**
   * Respond to being attacked
   */
  respondToAttack() {
    if (this.combatMode === "passive") return;

    const attacker = this.findNearestThreat();
    if (attacker) {
      console.log(`[${this.agentName}] Under attack! Fighting back.`);
      this.engageThreat(attacker);
    }
  }

  /**
   * Find nearest threat
   */
  findNearestThreat() {
    let nearest = null;
    let minDist = Infinity;

    for (const [id, threat] of this.threats.entries()) {
      if (!threat.entity.isValid) {
        this.threats.delete(id);
        continue;
      }

      const dist = this.bot.entity.position.distanceTo(threat.entity.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = threat.entity;
      }
    }

    return nearest;
  }

  /**
   * Set guard mode - protect a specific location
   */
  setGuardMode(position, radius = 16) {
    this.guardPosition = position;
    this.guardRadius = radius;
    this.combatMode = "aggressive";

    console.log(`[${this.agentName}] Now guarding position (${position.x}, ${position.y}, ${position.z})`);

    // Start patrol
    this.startPatrol();
  }

  /**
   * Patrol guard area
   */
  async startPatrol() {
    if (!this.guardPosition) return;

    setInterval(async () => {
      if (!this.guardPosition) return;

      // Check for threats in guard area
      const nearbyMobs = Object.values(this.bot.entities).filter(entity => {
        if (!this.isHostile(entity)) return false;
        const dist = entity.position.distanceTo(this.guardPosition);
        return dist <= this.guardRadius;
      });

      if (nearbyMobs.length > 0) {
        // Engage nearest threat
        this.engageThreat(nearbyMobs[0]);
      } else {
        // Return to guard position
        const dist = this.bot.entity.position.distanceTo(this.guardPosition);
        if (dist > 5) {
          try {
            const { goals } = require("mineflayer-pathfinder");
            await this.bot.pathfinder.goto(new goals.GoalBlock(
              this.guardPosition.x,
              this.guardPosition.y,
              this.guardPosition.z
            ));
          } catch (err) {
            // Ignore pathfinding errors
          }
        }
      }
    }, 3000); // Check every 3 seconds
  }

  /**
   * Set combat mode
   */
  setCombatMode(mode) {
    const validModes = ["defensive", "aggressive", "passive"];
    if (validModes.includes(mode)) {
      this.combatMode = mode;
      console.log(`[${this.agentName}] Combat mode: ${mode}`);
      logEvent(this.agentName, "combat_mode", { mode });
    }
  }

  /**
   * Clean up old threats
   */
  cleanupThreats() {
    const now = Date.now();
    for (const [id, threat] of this.threats.entries()) {
      if (!threat.entity.isValid || (now - threat.lastSeen) > 30000) {
        this.threats.delete(id);
      }
    }
  }

  /**
   * Get combat status
   */
  getStatus() {
    return {
      mode: this.combatMode,
      health: this.bot.health,
      threats: this.threats.size,
      guardPosition: this.guardPosition,
      weapon: this.bot.heldItem?.name || "none"
    };
  }
}

module.exports = { CombatSystem };
