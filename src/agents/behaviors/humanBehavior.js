/**
 * Human Behavior Emulation System
 * Makes bots behave more like humans: realistic timing, movements, decisions, mistakes
 */

const { logEvent } = require("../../memory/store");

class HumanBehavior {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Human characteristics
    this.reactionTime = this.randomRange(150, 350); // ms
    this.accuracyLevel = this.randomRange(0.7, 0.95); // 70-95% accuracy
    this.decisionDelay = this.randomRange(100, 400); // ms before making decisions
    this.fatigueLevel = 0; // 0-100, affects performance over time

    // Play style personality
    this.personality = this.generatePersonality();

    // Mouse movement simulation
    this.mouseSmoothness = this.randomRange(0.6, 0.9);
    this.mouseJitter = this.randomRange(0.01, 0.05);

    // Timing variations
    this.clickSpeed = this.randomRange(5, 12); // clicks per second
    this.doubleClickDelay = this.randomRange(100, 200); // ms

    // Behavioral patterns
    this.patterns = {
      checksInventory: this.randomBool(0.8), // 80% chance
      checksTab: this.randomBool(0.7),
      usesSprint: this.randomBool(0.9),
      usesShift: this.randomBool(0.85),
      prefersStrafe: this.randomBool(0.6)
    };

    // Mistakes and humanization
    this.mistakeRate = this.randomRange(0.02, 0.08); // 2-8% mistake rate
    this.hesitationChance = this.randomRange(0.05, 0.15); // 5-15% hesitation

    // Session tracking
    this.sessionStartTime = Date.now();
    this.actionsPerformed = 0;
  }

  /**
   * Generate random personality traits
   */
  generatePersonality() {
    const traits = {
      aggressive: this.randomRange(0, 1),
      cautious: this.randomRange(0, 1),
      strategic: this.randomRange(0, 1),
      impulsive: this.randomRange(0, 1),
      patient: this.randomRange(0, 1)
    };

    // Normalize conflicting traits
    if (traits.aggressive > 0.7) traits.cautious *= 0.5;
    if (traits.impulsive > 0.7) traits.patient *= 0.5;

    return traits;
  }

  /**
   * Apply reaction delay (human reaction time)
   */
  async applyReactionDelay() {
    // Add fatigue effect
    const fatigueMultiplier = 1 + (this.fatigueLevel / 100) * 0.5;
    const delay = this.reactionTime * fatigueMultiplier;

    // Add random variation
    const variation = this.randomRange(-50, 50);
    const totalDelay = Math.max(100, delay + variation);

    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * Apply decision delay (thinking time)
   */
  async applyDecisionDelay() {
    // Strategic players take more time
    const strategicMultiplier = 1 + this.personality.strategic * 0.5;
    const delay = this.decisionDelay * strategicMultiplier;

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simulate human mouse movement to target
   */
  async humanLookAt(target, speed = 1.0) {
    // Smooth mouse movement instead of instant snap
    const targetYaw = Math.atan2(target.z - this.bot.entity.position.z,
                                  target.x - this.bot.entity.position.x);
    const targetPitch = Math.atan2(target.y - this.bot.entity.position.y,
                                    Math.sqrt(Math.pow(target.x - this.bot.entity.position.x, 2) +
                                             Math.pow(target.z - this.bot.entity.position.z, 2)));

    const currentYaw = this.bot.entity.yaw;
    const currentPitch = this.bot.entity.pitch;

    // Calculate difference
    let yawDiff = targetYaw - currentYaw;
    let pitchDiff = targetPitch - currentPitch;

    // Normalize angles
    while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
    while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;

    // Smooth movement steps
    const steps = Math.ceil(10 / speed);

    for (let i = 0; i < steps; i++) {
      const progress = (i + 1) / steps;

      // Ease-out curve for natural movement
      const eased = 1 - Math.pow(1 - progress, 2);

      // Add mouse jitter
      const jitterYaw = (Math.random() - 0.5) * this.mouseJitter;
      const jitterPitch = (Math.random() - 0.5) * this.mouseJitter;

      const newYaw = currentYaw + yawDiff * eased + jitterYaw;
      const newPitch = currentPitch + pitchDiff * eased + jitterPitch;

      await this.bot.look(newYaw, newPitch);

      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  /**
   * Simulate human clicking (not perfectly timed)
   */
  async humanClick(action) {
    // Random slight delay
    const delay = this.randomRange(0, 50);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Execute action
    if (action) {
      await action();
    }

    // Track for fatigue
    this.actionsPerformed++;
    this.updateFatigue();
  }

  /**
   * Make decision with human-like uncertainty
   */
  async makeDecision(options) {
    // Apply thinking time
    await this.applyDecisionDelay();

    // Impulsive players decide faster sometimes
    if (this.personality.impulsive > 0.7 && Math.random() > 0.7) {
      return options[Math.floor(Math.random() * options.length)];
    }

    // Strategic players weigh options
    if (this.personality.strategic > 0.7) {
      // Add extra thinking time
      await new Promise(resolve => setTimeout(resolve, this.randomRange(100, 300)));
    }

    // Occasionally make "mistake" (wrong choice)
    if (Math.random() < this.mistakeRate) {
      console.log(`[${this.agentName}] 🤔 Made a human error`);
      return options[Math.floor(Math.random() * options.length)];
    }

    // Return best option (first one assumed best)
    return options[0];
  }

  /**
   * Hesitate before action (human behavior)
   */
  async maybeHesitate() {
    if (Math.random() < this.hesitationChance) {
      // Hesitate
      const hesitationTime = this.randomRange(200, 600);
      await new Promise(resolve => setTimeout(resolve, hesitationTime));

      console.log(`[${this.agentName}] ⏸️  Hesitated`);
      return true;
    }

    return false;
  }

  /**
   * Check inventory (human habit)
   */
  async checkInventory() {
    if (!this.patterns.checksInventory) return;

    if (Math.random() > 0.95) {
      // Occasionally check inventory
      console.log(`[${this.agentName}] 🎒 Checking inventory`);

      // Simulate opening inventory
      await new Promise(resolve => setTimeout(resolve, this.randomRange(500, 1500)));
    }
  }

  /**
   * Check tab list (human habit)
   */
  async checkTabList() {
    if (!this.patterns.checksTab) return;

    if (Math.random() > 0.97) {
      // Occasionally check tab
      console.log(`[${this.agentName}] 📋 Checking tab list`);

      await new Promise(resolve => setTimeout(resolve, this.randomRange(300, 800)));
    }
  }

  /**
   * Simulate walking (not always sprinting)
   */
  shouldSprint() {
    if (!this.patterns.usesSprint) {
      return false;
    }

    // Cautious players sprint less
    if (this.personality.cautious > 0.7 && Math.random() > 0.6) {
      return false;
    }

    // Tired players sprint less
    if (this.fatigueLevel > 50 && Math.random() > 0.7) {
      return false;
    }

    return true;
  }

  /**
   * Simulate sneaking behavior
   */
  shouldSneak(situation = "normal") {
    if (!this.patterns.usesShift) {
      return false;
    }

    // Sneak more when cautious
    if (situation === "dangerous" && this.personality.cautious > 0.5) {
      return Math.random() > 0.3;
    }

    // Occasional sneaking
    return Math.random() > 0.95;
  }

  /**
   * Update fatigue level over time
   */
  updateFatigue() {
    const sessionDuration = Date.now() - this.sessionStartTime;

    // Fatigue increases over time (maxes at 100 after ~30 minutes)
    this.fatigueLevel = Math.min(100, (sessionDuration / 1800000) * 100);

    // Actions also increase fatigue slightly
    this.fatigueLevel = Math.min(100, this.fatigueLevel + 0.001);
  }

  /**
   * Take a break (human behavior)
   */
  async takeBreak() {
    if (this.fatigueLevel > 70 && Math.random() > 0.98) {
      console.log(`[${this.agentName}] ☕ Taking a short break`);

      const breakTime = this.randomRange(2000, 5000);
      await new Promise(resolve => setTimeout(resolve, breakTime));

      // Reduce fatigue slightly
      this.fatigueLevel = Math.max(0, this.fatigueLevel - 10);

      return true;
    }

    return false;
  }

  /**
   * Get current accuracy (affected by fatigue)
   */
  getCurrentAccuracy() {
    const fatigueReduction = (this.fatigueLevel / 100) * 0.2; // Up to 20% reduction
    return Math.max(0.5, this.accuracyLevel - fatigueReduction);
  }

  /**
   * Check if action should miss (human inaccuracy)
   */
  shouldMiss() {
    const accuracy = this.getCurrentAccuracy();
    return Math.random() > accuracy;
  }

  /**
   * Random range helper
   */
  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Random boolean helper
   */
  randomBool(probability = 0.5) {
    return Math.random() < probability;
  }

  /**
   * Get personality summary
   */
  getPersonality() {
    const traits = [];

    if (this.personality.aggressive > 0.7) traits.push("Aggressive");
    if (this.personality.cautious > 0.7) traits.push("Cautious");
    if (this.personality.strategic > 0.7) traits.push("Strategic");
    if (this.personality.impulsive > 0.7) traits.push("Impulsive");
    if (this.personality.patient > 0.7) traits.push("Patient");

    return traits.length > 0 ? traits.join(", ") : "Balanced";
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      personality: this.getPersonality(),
      reactionTime: `${this.reactionTime.toFixed(0)}ms`,
      accuracy: `${(this.accuracyLevel * 100).toFixed(1)}%`,
      currentAccuracy: `${(this.getCurrentAccuracy() * 100).toFixed(1)}%`,
      fatigueLevel: `${this.fatigueLevel.toFixed(1)}%`,
      clickSpeed: `${this.clickSpeed.toFixed(1)} CPS`,
      actionsPerformed: this.actionsPerformed,
      sessionDuration: `${((Date.now() - this.sessionStartTime) / 60000).toFixed(1)} min`
    };
  }

  /**
   * Print behavior profile
   */
  printProfile() {
    console.log("\n" + "=".repeat(70));
    console.log(`  🎭 BEHAVIOR PROFILE - ${this.agentName}`);
    console.log("=".repeat(70));

    console.log(`Personality: ${this.getPersonality()}`);
    console.log(`Reaction Time: ${this.reactionTime.toFixed(0)}ms`);
    console.log(`Accuracy: ${(this.accuracyLevel * 100).toFixed(1)}%`);
    console.log(`Click Speed: ${this.clickSpeed.toFixed(1)} CPS`);

    console.log("\nTraits:");
    console.log(`  Aggressive: ${(this.personality.aggressive * 100).toFixed(0)}%`);
    console.log(`  Cautious: ${(this.personality.cautious * 100).toFixed(0)}%`);
    console.log(`  Strategic: ${(this.personality.strategic * 100).toFixed(0)}%`);
    console.log(`  Impulsive: ${(this.personality.impulsive * 100).toFixed(0)}%`);
    console.log(`  Patient: ${(this.personality.patient * 100).toFixed(0)}%`);

    console.log("\nBehaviors:");
    console.log(`  Checks Inventory: ${this.patterns.checksInventory ? "Yes" : "No"}`);
    console.log(`  Checks Tab: ${this.patterns.checksTab ? "Yes" : "No"}`);
    console.log(`  Uses Sprint: ${this.patterns.usesSprint ? "Yes" : "No"}`);
    console.log(`  Uses Sneak: ${this.patterns.usesShift ? "Yes" : "No"}`);

    console.log("=".repeat(70) + "\n");
  }
}

module.exports = { HumanBehavior };
