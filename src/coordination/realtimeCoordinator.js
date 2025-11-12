/**
 * Real-time Coordination System - WebSocket-based bot-to-bot communication
 * Note: Requires 'ws' package - install with: npm install ws
 */

const { logEvent } = require("../memory/store");

/**
 * Lightweight event-based coordination without WebSocket dependency
 * Can be upgraded to WebSocket when package is installed
 */
class RealtimeCoordinator {
  constructor() {
    this.bots = new Map(); // botName -> bot instance
    this.messageQueue = [];
    this.handlers = new Map(); // event type -> handlers
    this.isWebSocketEnabled = false;

    try {
      // Try to load ws package if available
      const WebSocket = require('ws');
      this.isWebSocketEnabled = true;
      console.log("[RealtimeCoordinator] WebSocket support enabled");
    } catch (err) {
      console.log("[RealtimeCoordinator] Running in event-based mode (install 'ws' package for WebSocket support)");
    }
  }

  /**
   * Register a bot with the coordinator
   */
  registerBot(name, bot) {
    this.bots.set(name, {
      bot,
      status: "online",
      lastSeen: Date.now(),
      messagesSent: 0,
      messagesReceived: 0
    });

    console.log(`[RealtimeCoordinator] ${name} registered`);

    // Broadcast join event
    this.broadcast("bot_joined", { name, time: Date.now() }, name);
  }

  /**
   * Unregister a bot
   */
  unregisterBot(name) {
    if (this.bots.has(name)) {
      this.bots.delete(name);
      this.broadcast("bot_left", { name, time: Date.now() });
      console.log(`[RealtimeCoordinator] ${name} unregistered`);
    }
  }

  /**
   * Send message to specific bot
   */
  sendMessage(from, to, messageType, data) {
    const targetBot = this.bots.get(to);

    if (!targetBot) {
      console.log(`[RealtimeCoordinator] Bot '${to}' not found`);
      return false;
    }

    const message = {
      id: Date.now() + Math.random(),
      from,
      to,
      type: messageType,
      data,
      timestamp: Date.now()
    };

    // Add to queue
    this.messageQueue.push(message);

    // Update stats
    const fromBot = this.bots.get(from);
    if (fromBot) fromBot.messagesSent++;
    targetBot.messagesReceived++;

    // Trigger handlers
    this.triggerHandlers(messageType, message);

    console.log(`[RealtimeCoordinator] ${from} -> ${to}: ${messageType}`);

    logEvent(from, "coordination", {
      action: "send_message",
      to,
      type: messageType
    });

    return true;
  }

  /**
   * Broadcast message to all bots
   */
  broadcast(messageType, data, excludeBot = null) {
    for (const [name, botData] of this.bots) {
      if (name === excludeBot) continue;

      const message = {
        id: Date.now() + Math.random(),
        from: "system",
        to: name,
        type: messageType,
        data,
        timestamp: Date.now()
      };

      this.messageQueue.push(message);
      botData.messagesReceived++;

      this.triggerHandlers(messageType, message);
    }

    console.log(`[RealtimeCoordinator] Broadcast: ${messageType} (${this.bots.size - (excludeBot ? 1 : 0)} recipients)`);
  }

  /**
   * Register event handler
   */
  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType).push(handler);
    console.log(`[RealtimeCoordinator] Handler registered for '${eventType}'`);
  }

  /**
   * Trigger handlers for event type
   */
  triggerHandlers(eventType, message) {
    const handlers = this.handlers.get(eventType);

    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (err) {
          console.error(`[RealtimeCoordinator] Handler error for '${eventType}':`, err.message);
        }
      });
    }
  }

  /**
   * Request help from team
   */
  requestHelp(botName, reason, urgency = 5) {
    this.broadcast("help_request", {
      from: botName,
      reason,
      urgency,
      position: this.bots.get(botName)?.bot?.entity?.position
    }, botName);

    console.log(`[RealtimeCoordinator] ${botName} requested help: ${reason} (urgency: ${urgency})`);

    logEvent(botName, "coordination", {
      action: "request_help",
      reason,
      urgency
    });
  }

  /**
   * Respond to help request
   */
  respondToHelp(responderName, requesterId, accepted = true) {
    this.sendMessage(responderName, requesterId, "help_response", {
      accepted,
      responder: responderName,
      eta: accepted ? this.calculateETA(responderName, requesterId) : null
    });

    console.log(`[RealtimeCoordinator] ${responderName} ${accepted ? "accepted" : "declined"} help request from ${requesterId}`);
  }

  /**
   * Calculate ETA between two bots
   */
  calculateETA(bot1Name, bot2Name) {
    const bot1 = this.bots.get(bot1Name);
    const bot2 = this.bots.get(bot2Name);

    if (!bot1?.bot?.entity?.position || !bot2?.bot?.entity?.position) {
      return null;
    }

    const distance = bot1.bot.entity.position.distanceTo(bot2.bot.entity.position);
    const speed = 4.3; // Approximate walking speed in blocks/second

    return Math.ceil(distance / speed); // seconds
  }

  /**
   * Share resource information
   */
  shareResource(botName, resourceType, position, amount) {
    this.broadcast("resource_found", {
      finder: botName,
      resourceType,
      position,
      amount,
      timestamp: Date.now()
    }, botName);

    console.log(`[RealtimeCoordinator] ${botName} shared resource: ${amount}x ${resourceType}`);

    logEvent(botName, "coordination", {
      action: "share_resource",
      resource: resourceType,
      amount
    });
  }

  /**
   * Coordinate group activity
   */
  proposeGroupActivity(proposerName, activity, requiredBots = 2, details = {}) {
    const proposalId = Date.now();

    this.broadcast("activity_proposal", {
      id: proposalId,
      proposer: proposerName,
      activity,
      requiredBots,
      details,
      responses: []
    }, proposerName);

    console.log(`[RealtimeCoordinator] ${proposerName} proposed group activity: ${activity} (needs ${requiredBots} bots)`);

    return proposalId;
  }

  /**
   * Accept group activity
   */
  acceptActivity(botName, proposalId) {
    this.broadcast("activity_response", {
      proposalId,
      responder: botName,
      accepted: true
    });

    console.log(`[RealtimeCoordinator] ${botName} accepted activity proposal ${proposalId}`);
  }

  /**
   * Alert team of danger
   */
  alertDanger(botName, dangerType, position, severity = 5) {
    this.broadcast("danger_alert", {
      from: botName,
      dangerType,
      position,
      severity,
      timestamp: Date.now()
    }, botName);

    console.log(`[RealtimeCoordinator] ${botName} alerted team: ${dangerType} (severity: ${severity})`);

    logEvent(botName, "coordination", {
      action: "alert_danger",
      dangerType,
      severity
    });
  }

  /**
   * Share strategic information
   */
  shareStrategy(botName, strategy, priority = 5) {
    this.broadcast("strategy_update", {
      from: botName,
      strategy,
      priority,
      timestamp: Date.now()
    }, botName);

    console.log(`[RealtimeCoordinator] ${botName} shared strategy (priority: ${priority})`);
  }

  /**
   * Get messages for a specific bot
   */
  getMessages(botName, since = 0) {
    return this.messageQueue.filter(m =>
      m.to === botName && m.timestamp > since
    );
  }

  /**
   * Get all active bots
   */
  getActiveBots() {
    return Array.from(this.bots.entries()).map(([name, data]) => ({
      name,
      status: data.status,
      lastSeen: data.lastSeen,
      position: data.bot?.entity?.position,
      health: data.bot?.health
    }));
  }

  /**
   * Get coordination statistics
   */
  getStats() {
    const totalMessages = this.messageQueue.length;
    const totalSent = Array.from(this.bots.values()).reduce((sum, b) => sum + b.messagesSent, 0);
    const totalReceived = Array.from(this.bots.values()).reduce((sum, b) => sum + b.messagesReceived, 0);

    return {
      activeBots: this.bots.size,
      totalMessages,
      messageSent: totalSent,
      messagesReceived: totalReceived,
      queueSize: this.messageQueue.length,
      handlers: this.handlers.size,
      mode: this.isWebSocketEnabled ? "websocket" : "event-based"
    };
  }

  /**
   * Clean old messages from queue
   */
  cleanupMessages(olderThanMs = 3600000) { // 1 hour default
    const cutoff = Date.now() - olderThanMs;
    const initialSize = this.messageQueue.length;

    this.messageQueue = this.messageQueue.filter(m => m.timestamp > cutoff);

    const removed = initialSize - this.messageQueue.length;
    if (removed > 0) {
      console.log(`[RealtimeCoordinator] Cleaned up ${removed} old messages`);
    }

    return removed;
  }

  /**
   * Update bot heartbeat
   */
  heartbeat(botName) {
    const botData = this.bots.get(botName);
    if (botData) {
      botData.lastSeen = Date.now();
      botData.status = "online";
    }
  }

  /**
   * Check for inactive bots
   */
  checkInactiveBots(timeoutMs = 60000) { // 1 minute default
    const now = Date.now();
    const inactive = [];

    for (const [name, data] of this.bots) {
      if (now - data.lastSeen > timeoutMs) {
        data.status = "offline";
        inactive.push(name);
      }
    }

    if (inactive.length > 0) {
      console.log(`[RealtimeCoordinator] Inactive bots: ${inactive.join(", ")}`);
    }

    return inactive;
  }
}

// Singleton instance
const realtimeCoordinator = new RealtimeCoordinator();

// Periodic cleanup and heartbeat check
setInterval(() => {
  realtimeCoordinator.cleanupMessages();
  realtimeCoordinator.checkInactiveBots();
}, 60000); // Every minute

module.exports = { realtimeCoordinator, RealtimeCoordinator };
