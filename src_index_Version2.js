const { createCoordinatorServer } = require("./coordination/coordinatorServer");
const { setupGracefulShutdown } = require("./bot/gracefulShutdown");

// Start Coordinator HTTP API (Gemini-limited endpoints)
const coordinator = createCoordinatorServer();

// Hook graceful shutdown
setupGracefulShutdown({ servers: [coordinator], bots: [] });