/**
 * Bot Management UI Server
 * Provides web interface for managing and monitoring Minecraft bots
 */

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");

class UIServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || "localhost";
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    // Bot management state
    this.bots = new Map();
    this.botTasks = new Map();
    this.activityLog = [];
    this.config = options.config || null;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));

    // CORS
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: Date.now() });
    });

    // Get all bots status
    this.app.get("/api/bots", (req, res) => {
      const botsArray = Array.from(this.bots.values());
      res.json({ bots: botsArray });
    });

    // Get specific bot
    this.app.get("/api/bots/:name", (req, res) => {
      const bot = this.bots.get(req.params.name);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.json({ bot });
    });

    // Get bot tasks
    this.app.get("/api/bots/:name/tasks", (req, res) => {
      const tasks = this.botTasks.get(req.params.name) || [];
      res.json({ tasks });
    });

    // Get activity log
    this.app.get("/api/logs", (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const logs = this.activityLog.slice(-limit);
      res.json({ logs });
    });

    // Get configuration
    this.app.get("/api/config", (req, res) => {
      if (this.config) {
        res.json({ config: this.config.getAll() });
      } else {
        res.json({ config: null });
      }
    });

    // Update configuration
    this.app.post("/api/config", (req, res) => {
      try {
        const { section, key, value } = req.body;
        if (this.config) {
          this.config.set(section, key, value);
          this.broadcast({
            type: "config_updated",
            data: { section, key, value }
          });
          res.json({ success: true });
        } else {
          res.status(400).json({ error: "No config manager available" });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Start bot
    this.app.post("/api/bots/:name/start", async (req, res) => {
      try {
        const { name } = req.params;
        if (this.onBotStart) {
          await this.onBotStart(name, req.body);
          res.json({ success: true });
        } else {
          res.status(501).json({ error: "Bot start not implemented" });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Stop bot
    this.app.post("/api/bots/:name/stop", async (req, res) => {
      try {
        const { name } = req.params;
        if (this.onBotStop) {
          await this.onBotStop(name);
          res.json({ success: true });
        } else {
          res.status(501).json({ error: "Bot stop not implemented" });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Get statistics
    this.app.get("/api/stats", (req, res) => {
      const stats = {
        totalBots: this.bots.size,
        activeBots: Array.from(this.bots.values()).filter(b => b.status === "online").length,
        totalTasks: Array.from(this.botTasks.values()).reduce((sum, tasks) => sum + tasks.length, 0),
        recentLogs: this.activityLog.length
      };
      res.json(stats);
    });

    // Serve UI
    this.app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });
  }

  setupWebSocket() {
    this.wss.on("connection", (ws) => {
      console.log("[UI] Client connected");

      // Send initial data
      ws.send(JSON.stringify({
        type: "init",
        data: {
          bots: Array.from(this.bots.values()),
          config: this.config ? this.config.getAll() : null
        }
      }));

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWSMessage(ws, data);
        } catch (err) {
          console.error("[UI] Invalid WebSocket message:", err);
        }
      });

      ws.on("close", () => {
        console.log("[UI] Client disconnected");
      });
    });
  }

  handleWSMessage(ws, data) {
    // Handle incoming WebSocket messages from client
    switch (data.type) {
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      case "subscribe":
        // Subscribe to specific bot updates
        ws.botSubscription = data.botName;
        break;
      default:
        console.log("[UI] Unknown message type:", data.type);
    }
  }

  // Update bot status
  updateBot(name, data) {
    const existing = this.bots.get(name) || {};
    const updated = {
      ...existing,
      name,
      ...data,
      lastUpdate: Date.now()
    };

    this.bots.set(name, updated);
    this.broadcast({
      type: "bot_update",
      data: updated
    });
  }

  // Update bot tasks
  updateBotTasks(name, tasks) {
    this.botTasks.set(name, tasks);
    this.broadcast({
      type: "tasks_update",
      data: { botName: name, tasks }
    });
  }

  // Add activity log
  addLog(entry) {
    const logEntry = {
      ...entry,
      timestamp: Date.now()
    };

    this.activityLog.push(logEntry);

    // Keep only last 1000 entries
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }

    this.broadcast({
      type: "log",
      data: logEntry
    });
  }

  // Broadcast to all connected clients
  broadcast(message) {
    const json = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    });
  }

  // Register bot event handlers
  registerBot(bot, name) {
    const updateStatus = (status, extra = {}) => {
      this.updateBot(name, {
        status,
        ...extra,
        position: bot.entity?.position,
        health: bot.health,
        food: bot.food,
        gameMode: bot.game?.gameMode
      });
    };

    bot.on("spawn", () => {
      updateStatus("online", { position: bot.entity?.position });
      this.addLog({ botName: name, level: "info", message: "Bot spawned" });
    });

    bot.on("death", () => {
      updateStatus("dead");
      this.addLog({ botName: name, level: "warn", message: "Bot died" });
    });

    bot.on("error", (err) => {
      updateStatus("error", { error: err.message });
      this.addLog({ botName: name, level: "error", message: `Error: ${err.message}` });
    });

    bot.on("end", (reason) => {
      updateStatus("offline", { endReason: reason });
      this.addLog({ botName: name, level: "info", message: `Bot disconnected: ${reason}` });
    });

    bot.on("kicked", (reason) => {
      updateStatus("kicked", { kickReason: reason });
      this.addLog({ botName: name, level: "warn", message: `Bot kicked: ${reason}` });
    });

    bot.on("message", (message) => {
      this.addLog({
        botName: name,
        level: "chat",
        message: message.toString()
      });
    });

    // Update position periodically
    const positionInterval = setInterval(() => {
      if (bot.entity) {
        this.updateBot(name, {
          position: bot.entity.position,
          health: bot.health,
          food: bot.food,
          experience: bot.experience
        });
      }
    }, 5000);

    bot.once("end", () => clearInterval(positionInterval));
  }

  // Start server
  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`[UI] Server running at http://${this.host}:${this.port}`);
        resolve();
      });

      this.server.on("error", reject);
    });
  }

  // Stop server
  stop() {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log("[UI] Server stopped");
          resolve();
        });
      });
    });
  }
}

module.exports = { UIServer };
