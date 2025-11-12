/**
 * PvP Combat System
 * Advanced player vs player combat with strategies, combos, and human-like behavior
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class PvpCombatSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Combat stats
    this.kills = 0;
    this.deaths = 0;
    this.damageDealt = 0;
    this.damageReceived = 0;

    // Current target
    this.currentTarget = null;
    this.targetLockTime = 0;

    // Combat mode
    this.combatMode = "balanced"; // aggressive, defensive, balanced, hit_and_run

    // PvP strategies
    this.strategies = {
      "w_tap": { enabled: true, description: "W-tapping for knockback" },
      "strafe": { enabled: true, description: "Strafing to avoid hits" },
      "block_hit": { enabled: true, description: "Block-hitting with sword" },
      "crit": { enabled: true, description: "Critical hits by jumping" },
      "combo": { enabled: true, description: "Continuous combos" },
      "rod": { enabled: true, description: "Fishing rod knockback" },
      "bow_spam": { enabled: true, description: "Bow spam at distance" },
      "pearl_escape": { enabled: true, description: "Ender pearl escapes" }
    };

    // Cooldowns
    this.lastAttack = 0;
    this.lastBlock = 0;
    this.lastStrafe = 0;
    this.lastRod = 0;
    this.attackCooldown = 500; // 0.5s between attacks (1.8 PvP)

    // Hit tracking for combos
    this.consecutiveHits = 0;
    this.lastHitTime = 0;

    // Enemy tracking
    this.enemies = new Map();
    this.enemyScanInterval = 1000;
    this.lastEnemyScan = 0;
  }

  /**
   * Scan for enemy players
   */
  scanForEnemies(range = 32) {
    const now = Date.now();
    if (now - this.lastEnemyScan < this.enemyScanInterval) {
      return Array.from(this.enemies.values());
    }

    this.lastEnemyScan = now;

    const nearbyPlayers = Object.values(this.bot.entities).filter(entity => {
      return entity.type === "player" &&
             entity.username !== this.bot.username &&
             entity.position &&
             this.bot.entity.position.distanceTo(entity.position) <= range;
    });

    // Update enemy tracking
    for (const player of nearbyPlayers) {
      if (!this.enemies.has(player.username)) {
        this.enemies.set(player.username, {
          username: player.username,
          entity: player,
          firstSeen: now,
          lastSeen: now,
          timesHit: 0,
          timesFought: 0
        });
      } else {
        const enemy = this.enemies.get(player.username);
        enemy.lastSeen = now;
        enemy.entity = player;
      }
    }

    return nearbyPlayers;
  }

  /**
   * Select best target
   */
  selectTarget() {
    const enemies = this.scanForEnemies();

    if (enemies.length === 0) {
      this.currentTarget = null;
      return null;
    }

    // Prioritize by: health, distance, threat level
    let bestTarget = null;
    let bestScore = -1;

    for (const enemy of enemies) {
      const distance = this.bot.entity.position.distanceTo(enemy.position);
      const health = enemy.health || 20;

      // Scoring: prefer low health, close distance
      let score = 100;
      score += (20 - health) * 5; // Lower health = higher priority
      score -= distance * 2; // Closer = higher priority

      // If already targeting, give bonus to maintain lock
      if (this.currentTarget && this.currentTarget.username === enemy.username) {
        score += 20;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    if (bestTarget !== this.currentTarget) {
      this.currentTarget = bestTarget;
      this.targetLockTime = Date.now();
      console.log(`[${this.agentName}] 🎯 Targeting: ${bestTarget.username}`);
    }

    return bestTarget;
  }

  /**
   * Execute PvP attack with strategies
   */
  async attackTarget(target = null) {
    if (!target) {
      target = this.selectTarget();
    }

    if (!target) {
      return false;
    }

    const now = Date.now();
    const distance = this.bot.entity.position.distanceTo(target.position);

    // Choose weapon
    await this.equipBestWeapon();

    try {
      // Bow combat at long range
      if (distance > 8 && this.strategies.bow_spam.enabled) {
        await this.bowCombat(target);
        return true;
      }

      // Fishing rod combo
      if (distance > 3 && distance < 8 && this.strategies.rod.enabled) {
        if (now - this.lastRod > 2000) {
          await this.fishingRodCombo(target);
          this.lastRod = now;
        }
      }

      // Melee combat
      if (distance <= 4) {
        await this.meleeCombat(target);
        return true;
      }

      // Chase target
      await this.chaseTarget(target);

    } catch (err) {
      console.error(`[${this.agentName}] PvP attack failed:`, err.message);
    }

    return false;
  }

  /**
   * Melee combat with advanced techniques
   */
  async meleeCombat(target) {
    const now = Date.now();

    // Check attack cooldown
    if (now - this.lastAttack < this.attackCooldown) {
      return;
    }

    // Movement strategy based on combat mode
    await this.executeCombatMovement(target);

    // Attack with techniques
    if (this.strategies.crit.enabled && this.bot.entity.onGround) {
      // Jump for critical hit
      this.bot.setControlState("jump", true);
      await new Promise(resolve => setTimeout(resolve, 50));
      this.bot.setControlState("jump", false);
    }

    // Attack
    await this.bot.attack(target);
    this.lastAttack = now;

    // Track combo
    if (now - this.lastHitTime < 1000) {
      this.consecutiveHits++;
    } else {
      this.consecutiveHits = 1;
    }
    this.lastHitTime = now;

    // W-tap for knockback
    if (this.strategies.w_tap.enabled) {
      this.bot.setControlState("forward", false);
      await new Promise(resolve => setTimeout(resolve, 50));
      this.bot.setControlState("forward", true);
    }

    // Block-hitting
    if (this.strategies.block_hit.enabled && now - this.lastBlock > 500) {
      this.bot.activateItem(); // Right-click to block
      await new Promise(resolve => setTimeout(resolve, 100));
      this.bot.deactivateItem();
      this.lastBlock = now;
    }

    if (this.consecutiveHits >= 3) {
      console.log(`[${this.agentName}] 🔥 ${this.consecutiveHits}-hit combo!`);
    }
  }

  /**
   * Combat movement (strafing, circling)
   */
  async executeCombatMovement(target) {
    const now = Date.now();

    if (!this.strategies.strafe.enabled) {
      // Simple forward movement
      this.bot.setControlState("forward", true);
      return;
    }

    if (now - this.lastStrafe < 300) {
      return; // Don't change strafe too quickly
    }

    const random = Math.random();

    if (this.combatMode === "aggressive") {
      // Aggressive: mostly forward, some strafing
      this.bot.setControlState("forward", true);
      if (random > 0.7) {
        this.bot.setControlState("left", random > 0.85);
        this.bot.setControlState("right", random <= 0.85);
      }

    } else if (this.combatMode === "defensive") {
      // Defensive: lots of strafing, backpedaling
      if (random > 0.5) {
        this.bot.setControlState("left", true);
        this.bot.setControlState("right", false);
      } else {
        this.bot.setControlState("left", false);
        this.bot.setControlState("right", true);
      }

      if (random > 0.7) {
        this.bot.setControlState("back", true);
        this.bot.setControlState("forward", false);
      }

    } else {
      // Balanced: mix of everything
      if (random > 0.6) {
        this.bot.setControlState("forward", true);
      } else if (random > 0.3) {
        this.bot.setControlState("left", random > 0.45);
        this.bot.setControlState("right", random <= 0.45);
      }
    }

    this.lastStrafe = now;

    // Look at target while moving
    await this.bot.lookAt(target.position.offset(0, target.height * 0.8, 0));
  }

  /**
   * Bow combat
   */
  async bowCombat(target) {
    const bow = this.bot.inventory.items().find(i => i.name === "bow");
    if (!bow) return false;

    const arrows = this.bot.inventory.items().find(i => i.name === "arrow");
    if (!arrows) return false;

    try {
      await this.bot.equip(bow, "hand");

      // Look at target with prediction
      const targetVelocity = target.velocity || new Vec3(0, 0, 0);
      const predictedPos = target.position.plus(targetVelocity.scaled(5));
      await this.bot.lookAt(predictedPos.offset(0, target.height * 0.8, 0));

      // Charge bow
      this.bot.activateItem();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Full charge

      // Release
      this.bot.deactivateItem();

      console.log(`[${this.agentName}] 🏹 Bow shot at ${target.username}`);

      return true;

    } catch (err) {
      return false;
    }
  }

  /**
   * Fishing rod combo
   */
  async fishingRodCombo(target) {
    const rod = this.bot.inventory.items().find(i => i.name === "fishing_rod");
    if (!rod) return false;

    try {
      await this.bot.equip(rod, "hand");

      // Cast rod at target
      await this.bot.lookAt(target.position.offset(0, 1, 0));
      this.bot.activateItem();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Reel in
      this.bot.deactivateItem();

      console.log(`[${this.agentName}] 🎣 Fishing rod combo!`);

      // Quick switch back to sword
      await this.equipBestWeapon();

      return true;

    } catch (err) {
      return false;
    }
  }

  /**
   * Chase target
   */
  async chaseTarget(target) {
    if (!target || !target.position) return;

    // Look at target
    await this.bot.lookAt(target.position.offset(0, target.height * 0.8, 0));

    // Sprint toward target
    this.bot.setControlState("forward", true);
    this.bot.setControlState("sprint", true);
  }

  /**
   * Equip best weapon for PvP
   */
  async equipBestWeapon() {
    const weapons = this.bot.inventory.items().filter(i =>
      i.name.includes("sword") || i.name.includes("axe")
    );

    if (weapons.length === 0) return;

    // Prioritize: netherite > diamond > iron > stone > wood
    const priority = ["netherite", "diamond", "iron", "stone", "wooden"];

    let bestWeapon = null;
    for (const material of priority) {
      bestWeapon = weapons.find(w => w.name.includes(material));
      if (bestWeapon) break;
    }

    if (bestWeapon) {
      await this.bot.equip(bestWeapon, "hand");
    }
  }

  /**
   * Emergency escape (low health)
   */
  async emergencyEscape() {
    const health = this.bot.health;

    if (health <= 6) { // 3 hearts or less
      console.log(`[${this.agentName}] 💊 Emergency escape! Health: ${health}`);

      // Try to use ender pearl
      const pearl = this.bot.inventory.items().find(i => i.name === "ender_pearl");
      if (pearl && this.strategies.pearl_escape.enabled) {
        await this.bot.equip(pearl, "hand");

        // Look in escape direction (away from target)
        const escapeAngle = Math.random() * Math.PI * 2;
        const escapeDir = new Vec3(Math.cos(escapeAngle), 0.5, Math.sin(escapeAngle));
        await this.bot.lookAt(this.bot.entity.position.plus(escapeDir.scaled(20)));

        this.bot.activateItem();
        await new Promise(resolve => setTimeout(resolve, 100));
        this.bot.deactivateItem();

        console.log(`[${this.agentName}] 🔮 Ender pearl escape!`);

        return true;
      }

      // Sprint away
      if (this.currentTarget) {
        const awayVector = this.bot.entity.position.minus(this.currentTarget.position).normalize();
        await this.bot.lookAt(this.bot.entity.position.plus(awayVector.scaled(10)));
      }

      this.bot.setControlState("forward", true);
      this.bot.setControlState("sprint", true);

      return true;
    }

    return false;
  }

  /**
   * Set combat mode
   */
  setCombatMode(mode) {
    const validModes = ["aggressive", "defensive", "balanced", "hit_and_run"];
    if (validModes.includes(mode)) {
      this.combatMode = mode;
      console.log(`[${this.agentName}] Combat mode: ${mode}`);
    }
  }

  /**
   * Get combat statistics
   */
  getStats() {
    const kd = this.deaths > 0 ? (this.kills / this.deaths).toFixed(2) : this.kills;

    return {
      kills: this.kills,
      deaths: this.deaths,
      kd,
      damageDealt: this.damageDealt,
      damageReceived: this.damageReceived,
      currentTarget: this.currentTarget?.username || null,
      combatMode: this.combatMode,
      consecutiveHits: this.consecutiveHits,
      enemiesTracked: this.enemies.size
    };
  }
}

module.exports = { PvpCombatSystem };
