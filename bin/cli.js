#!/usr/bin/env node

/**
 * Minecraft Bot Squad - CLI Tool
 * Command-line interface for managing Minecraft bots
 */

const { program } = require("commander");
const path = require("path");
const fs = require("fs");

// Package info
const packageJson = require("../package.json");

// Configure commander
program
  .name("mcbot-squad")
  .description("Advanced Minecraft bot squad with management UI")
  .version(packageJson.version);

// UI Command - Start Web UI
program
  .command("ui")
  .description("Start the Web UI for bot management")
  .option("-p, --port <port>", "UI server port", "3000")
  .option("-h, --host <host>", "UI server host", "0.0.0.0")
  .option("--config <path>", "Path to configuration file", "./bot-config.json")
  .option("--auto-start <bots>", "Comma-separated list of bots to start automatically")
  .action(async (options) => {
    console.log("Starting Web UI...\n");

    // Set environment variables
    process.env.UI_PORT = options.port;
    if (options.autoStart) {
      process.env.AUTO_START_BOTS = options.autoStart;
    }

    // Start UI
    require("../examples/withUI.js");
  });

// Squad Command - Start bot squad
program
  .command("squad")
  .description("Start an advanced bot squad")
  .option("--server <host:port>", "Minecraft server (host:port)", "localhost:25565")
  .option("--backend <server>", "Backend server for proxy networks")
  .option("--auth <type>", "Authentication type (offline/microsoft/mojang)", "offline")
  .option("--bots <count>", "Number of bots to start", "5")
  .option("--config <path>", "Path to configuration file")
  .action(async (options) => {
    console.log("Starting bot squad...\n");

    // Parse server
    const [host, port] = options.server.split(":");
    process.env.MC_HOST = host || "localhost";
    process.env.MC_PORT = port || "25565";

    if (options.backend) {
      process.env.MC_BACKEND_SERVER = options.backend;
    }

    // Start squad
    require("../examples/advancedSquad.js");
  });

// Start Command - Quick start with default settings
program
  .command("start")
  .description("Quick start with default settings (UI + squad)")
  .option("-s, --server <host:port>", "Minecraft server", "localhost:25565")
  .option("-p, --port <port>", "UI port", "3000")
  .action(async (options) => {
    console.log("=".repeat(70));
    console.log("🤖 Minecraft Bot Squad - Quick Start");
    console.log("=".repeat(70));
    console.log("");

    const [host, port] = options.server.split(":");
    process.env.MC_HOST = host || "localhost";
    process.env.MC_PORT = port || "25565";
    process.env.UI_PORT = options.port;

    console.log("Server Configuration:");
    console.log(`  Minecraft Server: ${process.env.MC_HOST}:${process.env.MC_PORT}`);
    console.log(`  Web UI: http://localhost:${process.env.UI_PORT}`);
    console.log("");

    // Start UI
    require("../examples/withUI.js");
  });

// Enhanced Command - Start massively enhanced squad
program
  .command("enhanced")
  .description("Start massively enhanced bot squad with all features")
  .option("--server <host:port>", "Minecraft server", "localhost:25565")
  .option("--backend <server>", "Backend server for proxy networks")
  .action(async (options) => {
    console.log("Starting massively enhanced bot squad...\n");

    const [host, port] = options.server.split(":");
    process.env.MC_HOST = host || "localhost";
    process.env.MC_PORT = port || "25565";

    if (options.backend) {
      process.env.MC_BACKEND_SERVER = options.backend;
    }

    // Check if massivelyEnhancedSquad exists
    const enhancedPath = path.join(__dirname, "../examples/massivelyEnhancedSquad.js");
    if (fs.existsSync(enhancedPath)) {
      require(enhancedPath);
    } else {
      console.error("Enhanced squad example not found. Using advanced squad instead.");
      require("../examples/advancedSquad.js");
    }
  });

// Config Command - Create/edit configuration
program
  .command("config")
  .description("Create or edit configuration file")
  .option("-o, --output <path>", "Output path for config file", "./bot-config.json")
  .option("--interactive", "Interactive configuration")
  .action(async (options) => {
    const { ConfigManager } = require("../src/bot/config");

    console.log("Creating configuration file...\n");

    // Default configuration
    const defaultConfig = {
      server: {
        host: "localhost",
        port: 25565,
        version: false
      },
      network: {
        isProxy: false,
        backendServer: null,
        autoJoinBackend: true
      },
      authentication: {
        type: "offline",
        credentials: {}
      },
      reconnect: {
        enabled: true,
        maxAttempts: -1,
        baseDelayMs: 1000
      },
      behavior: {
        autoRespawn: true,
        sprintByDefault: false,
        hideErrors: false
      },
      logging: {
        level: "info",
        logChat: true,
        logEvents: true
      }
    };

    const config = new ConfigManager(defaultConfig);

    // Save config
    try {
      config.saveToFile(options.output);
      console.log(`✓ Configuration saved to: ${options.output}`);
      console.log("");
      console.log("Edit the file to customize your bot settings.");
      console.log("Then start bots with: mcbot-squad ui --config " + options.output);
    } catch (err) {
      console.error("Failed to save configuration:", err.message);
      process.exit(1);
    }
  });

// Info Command - Show system information
program
  .command("info")
  .description("Show system and bot information")
  .action(() => {
    console.log("=".repeat(70));
    console.log("🤖 Minecraft Bot Squad - System Information");
    console.log("=".repeat(70));
    console.log("");
    console.log("Version:", packageJson.version);
    console.log("Node.js:", process.version);
    console.log("Platform:", process.platform);
    console.log("Architecture:", process.arch);
    console.log("");
    console.log("Features:");
    console.log("  ✓ Web UI for bot management");
    console.log("  ✓ Advanced mining system");
    console.log("  ✓ Trading system");
    console.log("  ✓ Redstone automation");
    console.log("  ✓ Building system");
    console.log("  ✓ Combat system");
    console.log("  ✓ Farming system");
    console.log("  ✓ Endless task generator");
    console.log("  ✓ Team coordination");
    console.log("");
    console.log("Documentation:");
    console.log("  README.md - Main documentation");
    console.log("  MASSIVELY_ENHANCED.md - Feature documentation");
    console.log("  QUICKSTART_ENHANCED.md - Quick start guide");
    console.log("");
    console.log("Commands:");
    console.log("  mcbot-squad ui      - Start Web UI");
    console.log("  mcbot-squad squad   - Start bot squad");
    console.log("  mcbot-squad start   - Quick start");
    console.log("  mcbot-squad enhanced - Enhanced squad");
    console.log("  mcbot-squad config  - Create config file");
    console.log("  mcbot-squad --help  - Show all commands");
    console.log("");
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
