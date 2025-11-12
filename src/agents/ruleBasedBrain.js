/**
 * Rule-Based Intelligent Brain - No LLM required!
 *
 * This brain makes smart decisions using rules, priorities, and state analysis
 * instead of requiring external LLM calls.
 */

const { logEvent } = require("../memory/store");
const { recordMetric } = require("../learning/metrics");

/**
 * Intelligent decision-making system without LLM
 */
class RuleBasedBrain {
  constructor(bot, agentName, capabilities = []) {
    this.bot = bot;
    this.agentName = agentName;
    this.capabilities = capabilities;
    this.currentGoal = null;
    this.goalProgress = 0;
    this.lastDecisionTime = 0;
    this.decisionCooldown = 3000; // 3 seconds between decisions
  }

  /**
   * Main decision-making function
   * Returns an action based on current state and priorities
   */
  async makeDecision(perception, inventory, combat, farming, building) {
    // Check if we should make a new decision
    if (Date.now() - this.lastDecisionTime < this.decisionCooldown) {
      return { action: "wait", reason: "cooldown" };
    }

    this.lastDecisionTime = Date.now();

    // Analyze current state
    const state = this.analyzeState(perception, inventory, combat);

    // Priority-based decision tree

    // 1. SURVIVAL - Highest priority
    if (state.health < 10 || state.danger >= 30) {
      return this.decideSurvival(state, perception, combat);
    }

    // 2. MAINTENANCE - Basic needs
    if (state.hunger < 10 || state.inventoryFull) {
      return this.decideMaintenance(state, inventory);
    }

    // 3. DEFENSE - Moderate threats
    if (state.danger >= 15 && this.capabilities.includes("combat")) {
      return this.decideDefense(state, combat);
    }

    // 4. TASKS - Assigned work
    const assignedTask = this.getAssignedTask();
    if (assignedTask) {
      return this.decideTaskExecution(assignedTask, state);
    }

    // 5. OPPORTUNITIES - Proactive actions
    const opportunity = this.findBestOpportunity(perception, state);
    if (opportunity) {
      return this.decideOpportunity(opportunity, state);
    }

    // 6. IDLE - Default behaviors
    return this.decideIdle(state);
  }

  /**
   * Analyze current bot state
   */
  analyzeState(perception, inventory, combat) {
    const summary = perception.getSummary();

    return {
      health: this.bot.health,
      hunger: this.bot.food,
      position: this.bot.entity.position,
      danger: summary.dangerLevel,
      threats: summary.nearbyMobs.hostile,
      inventoryFull: inventory.isInventoryFull(),
      inventoryUtil: parseFloat(inventory.getUtilization()),
      nearbyResources: summary.resources,
      opportunities: summary.opportunities,
      combatMode: combat.combatMode
    };
  }

  /**
   * SURVIVAL decisions - Escape immediate danger
   */
  decideSurvival(state, perception, combat) {
    console.log(`[${this.agentName}] SURVIVAL MODE: Health ${state.health}, Danger ${state.danger}`);

    logEvent(this.agentName, "decision", {
      type: "survival",
      health: state.health,
      danger: state.danger
    });

    // Try to eat food first
    if (state.hunger < 15) {
      return {
        action: "eat",
        reason: "low_health_and_hunger",
        priority: 10
      };
    }

    // Find safe location and retreat
    const safeLoc = perception.findSafeLocation();

    return {
      action: "retreat",
      reason: "critical_danger",
      priority: 10,
      target: safeLoc?.position || this.calculateRetreatPosition()
    };
  }

  /**
   * MAINTENANCE decisions - Basic needs
   */
  decideMaintenance(state, inventory) {
    console.log(`[${this.agentName}] MAINTENANCE: Hunger ${state.hunger}, Inventory ${state.inventoryUtil}%`);

    // Eat if hungry
    if (state.hunger < 10) {
      return {
        action: "eat",
        reason: "hungry",
        priority: 8
      };
    }

    // Deposit items if inventory full
    if (state.inventoryFull) {
      return {
        action: "deposit",
        reason: "inventory_full",
        priority: 7
      };
    }

    return { action: "wait", reason: "maintenance_check" };
  }

  /**
   * DEFENSE decisions - Fight or protect
   */
  decideDefense(state, combat) {
    console.log(`[${this.agentName}] DEFENSE: Danger ${state.danger}, Threats ${state.threats}`);

    // Set aggressive mode if not already
    if (combat.combatMode !== "aggressive") {
      return {
        action: "combat_mode",
        reason: "threats_detected",
        priority: 7,
        mode: "aggressive"
      };
    }

    // Request help if overwhelmed
    if (state.threats > 3 || state.health < 15) {
      return {
        action: "request_help",
        reason: "overwhelmed",
        priority: 8,
        urgency: 8
      };
    }

    return {
      action: "combat",
      reason: "defend_area",
      priority: 7
    };
  }

  /**
   * TASK execution decisions
   */
  decideTaskExecution(task, state) {
    console.log(`[${this.agentName}] EXECUTING TASK: ${task.type}`);

    return {
      action: "execute_task",
      reason: "assigned_work",
      priority: 6,
      taskId: task.id,
      taskType: task.type
    };
  }

  /**
   * OPPORTUNITY decisions - Proactive actions
   */
  decideOpportunity(opportunity, state) {
    console.log(`[${this.agentName}] OPPORTUNITY: ${opportunity.type} - ${opportunity.resource || opportunity.animal}`);

    const actions = {
      mining: {
        action: "mine",
        resource: opportunity.resource,
        priority: 5
      },
      farming: {
        action: "farm_collect",
        animal: opportunity.animal,
        priority: 4
      },
      looting: {
        action: "loot",
        target: "chest",
        priority: 5
      }
    };

    return actions[opportunity.type] || { action: "wait", reason: "unknown_opportunity" };
  }

  /**
   * IDLE decisions - Default behaviors
   */
  decideIdle(state) {
    // Choose based on capabilities
    const idleActions = [];

    if (this.capabilities.includes("mining")) {
      idleActions.push({
        action: "explore",
        reason: "find_resources",
        priority: 3,
        direction: this.chooseExploreDirection()
      });
    }

    if (this.capabilities.includes("farming") && Math.random() > 0.5) {
      idleActions.push({
        action: "farm_check",
        reason: "maintain_farms",
        priority: 3
      });
    }

    if (this.capabilities.includes("building") && Math.random() > 0.7) {
      idleActions.push({
        action: "build_plan",
        reason: "improve_base",
        priority: 2
      });
    }

    // Default: just wander
    if (idleActions.length === 0) {
      return {
        action: "wander",
        reason: "idle",
        priority: 1,
        direction: this.chooseExploreDirection()
      };
    }

    return idleActions[Math.floor(Math.random() * idleActions.length)];
  }

  /**
   * Find best opportunity from available options
   */
  findBestOpportunity(perception, state) {
    const opportunities = perception.detectOpportunities();

    if (opportunities.length === 0) return null;

    // Score opportunities based on bot state and capabilities
    let bestOpp = null;
    let bestScore = 0;

    for (const opp of opportunities) {
      let score = 50; // Base score

      // Capability match bonus
      if (opp.type === "mining" && this.capabilities.includes("mining")) score += 30;
      if (opp.type === "farming" && this.capabilities.includes("farming")) score += 30;
      if (opp.type === "looting") score += 20;

      // Distance penalty
      if (opp.nearest) {
        score -= opp.nearest / 2;
      }

      // Resource value bonus
      if (opp.resource?.includes("diamond")) score += 50;
      if (opp.resource?.includes("iron")) score += 30;
      if (opp.resource?.includes("coal")) score += 20;

      // Inventory consideration
      if (state.inventoryUtil > 80) score -= 20;

      if (score > bestScore) {
        bestScore = score;
        bestOpp = opp;
      }
    }

    return bestOpp;
  }

  /**
   * Get assigned task from team coordinator
   */
  getAssignedTask() {
    // This would check with teamCoordinator
    // For now, return null (handled by enhanced agent)
    return null;
  }

  /**
   * Choose direction for exploration
   */
  chooseExploreDirection() {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const angle = angles[Math.floor(Math.random() * angles.length)];
    const distance = 20 + Math.random() * 30;

    const rad = angle * Math.PI / 180;
    const pos = this.bot.entity.position;

    return {
      x: Math.floor(pos.x + Math.cos(rad) * distance),
      y: pos.y,
      z: Math.floor(pos.z + Math.sin(rad) * distance)
    };
  }

  /**
   * Calculate retreat position away from danger
   */
  calculateRetreatPosition() {
    const pos = this.bot.entity.position;
    const distance = 30;

    // Random direction away
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.floor(pos.x + Math.cos(angle) * distance),
      y: pos.y,
      z: Math.floor(pos.z + Math.sin(angle) * distance)
    };
  }

  /**
   * Set current goal
   */
  setGoal(goal, priority = 5) {
    this.currentGoal = { goal, priority, startTime: Date.now() };
    console.log(`[${this.agentName}] New goal: ${goal} (priority: ${priority})`);

    logEvent(this.agentName, "goal", { goal, priority });
  }

  /**
   * Get current goal
   */
  getGoal() {
    return this.currentGoal;
  }

  /**
   * Complete current goal
   */
  completeGoal(success = true) {
    if (this.currentGoal) {
      const duration = Date.now() - this.currentGoal.startTime;

      logEvent(this.agentName, "goal_complete", {
        goal: this.currentGoal.goal,
        success,
        duration
      });

      recordMetric(this.agentName, "goal_completion", success ? 1 : 0, {
        goal: this.currentGoal.goal
      });

      this.currentGoal = null;
    }
  }
}

module.exports = { RuleBasedBrain };
