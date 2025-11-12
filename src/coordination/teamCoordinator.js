const { logEvent } = require("../memory/store");

/**
 * Team Coordinator - Advanced multi-bot task delegation and coordination
 */
class TeamCoordinator {
  constructor() {
    this.bots = new Map(); // botName -> { bot, status, currentTask, capabilities }
    this.taskQueue = []; // { id, type, priority, assignedTo, status, data }
    this.sharedGoals = []; // { goal, priority, requiredBots, progress }
    this.taskIdCounter = 0;
  }

  /**
   * Register a bot with the team
   */
  registerBot(name, bot, capabilities = []) {
    this.bots.set(name, {
      bot,
      status: "idle",
      currentTask: null,
      capabilities, // e.g., ["mining", "building", "farming", "combat"]
      position: bot.entity?.position || null,
      health: bot.health || 20,
      inventory: bot.inventory?.items() || []
    });
    console.log(`[TeamCoordinator] ${name} registered with capabilities: ${capabilities.join(", ")}`);
  }

  /**
   * Update bot status
   */
  updateBotStatus(name, updates) {
    const botData = this.bots.get(name);
    if (!botData) return;

    Object.assign(botData, updates);
    if (botData.bot) {
      botData.position = botData.bot.entity?.position;
      botData.health = botData.bot.health;
      botData.inventory = botData.bot.inventory?.items() || [];
    }
  }

  /**
   * Add a task to the queue
   */
  addTask(type, data, priority = 5, requiredCapabilities = []) {
    const taskId = ++this.taskIdCounter;
    const task = {
      id: taskId,
      type,
      priority,
      requiredCapabilities,
      assignedTo: null,
      status: "pending",
      data,
      createdAt: Date.now()
    };

    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    console.log(`[TeamCoordinator] Task ${taskId} added: ${type} (priority: ${priority})`);
    this.assignTasks();

    return taskId;
  }

  /**
   * Assign tasks to available bots
   */
  assignTasks() {
    for (const task of this.taskQueue) {
      if (task.status !== "pending") continue;

      // Find best bot for this task
      const availableBot = this.findBestBotForTask(task);
      if (availableBot) {
        task.assignedTo = availableBot;
        task.status = "assigned";

        const botData = this.bots.get(availableBot);
        botData.status = "busy";
        botData.currentTask = task.id;

        console.log(`[TeamCoordinator] Task ${task.id} assigned to ${availableBot}`);
        logEvent(availableBot, "task_assigned", { taskId: task.id, type: task.type });
      }
    }
  }

  /**
   * Find the best bot for a task based on capabilities, location, and availability
   */
  findBestBotForTask(task) {
    let bestBot = null;
    let bestScore = -1;

    for (const [name, botData] of this.bots.entries()) {
      if (botData.status !== "idle") continue;

      // Check capabilities
      const hasCapabilities = task.requiredCapabilities.every(cap =>
        botData.capabilities.includes(cap)
      );
      if (task.requiredCapabilities.length > 0 && !hasCapabilities) continue;

      // Calculate score based on distance, health, and inventory
      let score = 100;

      // Health factor
      score += (botData.health / 20) * 20;

      // Distance factor (if task has location)
      if (task.data?.location && botData.position) {
        const dist = Math.sqrt(
          Math.pow(task.data.location.x - botData.position.x, 2) +
          Math.pow(task.data.location.z - botData.position.z, 2)
        );
        score -= dist / 10; // Closer is better
      }

      // Capability match bonus
      const capabilityBonus = task.requiredCapabilities.filter(cap =>
        botData.capabilities.includes(cap)
      ).length * 10;
      score += capabilityBonus;

      if (score > bestScore) {
        bestScore = score;
        bestBot = name;
      }
    }

    return bestBot;
  }

  /**
   * Complete a task
   */
  completeTask(taskId, result = {}) {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (!task) return;

    task.status = "completed";
    task.completedAt = Date.now();
    task.result = result;

    if (task.assignedTo) {
      const botData = this.bots.get(task.assignedTo);
      if (botData) {
        botData.status = "idle";
        botData.currentTask = null;
      }

      console.log(`[TeamCoordinator] Task ${taskId} completed by ${task.assignedTo}`);
      logEvent(task.assignedTo, "task_completed", { taskId, duration: task.completedAt - task.createdAt });
    }

    // Assign next tasks
    this.assignTasks();
  }

  /**
   * Fail a task
   */
  failTask(taskId, reason = "") {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (!task) return;

    task.status = "failed";
    task.failedAt = Date.now();
    task.failureReason = reason;

    if (task.assignedTo) {
      const botData = this.bots.get(task.assignedTo);
      if (botData) {
        botData.status = "idle";
        botData.currentTask = null;
      }

      console.log(`[TeamCoordinator] Task ${taskId} failed: ${reason}`);
      logEvent(task.assignedTo, "task_failed", { taskId, reason });
    }

    // Optionally retry with lower priority
    if ((task.retries || 0) < 3) {
      this.addTask(task.type, task.data, task.priority - 1, task.requiredCapabilities);
      task.retries = (task.retries || 0) + 1;
    }

    this.assignTasks();
  }

  /**
   * Get team status
   */
  getTeamStatus() {
    const bots = Array.from(this.bots.entries()).map(([name, data]) => ({
      name,
      status: data.status,
      currentTask: data.currentTask,
      health: data.health,
      position: data.position
    }));

    const tasks = {
      pending: this.taskQueue.filter(t => t.status === "pending").length,
      assigned: this.taskQueue.filter(t => t.status === "assigned").length,
      completed: this.taskQueue.filter(t => t.status === "completed").length,
      failed: this.taskQueue.filter(t => t.status === "failed").length
    };

    return { bots, tasks, total: this.bots.size };
  }

  /**
   * Add a shared goal for the team
   */
  addSharedGoal(goal, priority = 5, requiredBots = 1) {
    this.sharedGoals.push({
      goal,
      priority,
      requiredBots,
      progress: 0,
      createdAt: Date.now()
    });

    this.sharedGoals.sort((a, b) => b.priority - a.priority);
    console.log(`[TeamCoordinator] Shared goal added: ${goal}`);
  }

  /**
   * Request help from nearby bots
   */
  requestHelp(botName, reason, urgency = 5) {
    const botData = this.bots.get(botName);
    if (!botData || !botData.position) return [];

    const helpers = [];
    for (const [name, data] of this.bots.entries()) {
      if (name === botName || data.status !== "idle" || !data.position) continue;

      const dist = Math.sqrt(
        Math.pow(data.position.x - botData.position.x, 2) +
        Math.pow(data.position.z - botData.position.z, 2)
      );

      if (dist < 50) { // Within 50 blocks
        helpers.push({ name, distance: dist });
      }
    }

    console.log(`[TeamCoordinator] ${botName} requested help: ${reason} (found ${helpers.length} nearby)`);
    return helpers;
  }
}

// Singleton instance
const teamCoordinator = new TeamCoordinator();

module.exports = { teamCoordinator, TeamCoordinator };
