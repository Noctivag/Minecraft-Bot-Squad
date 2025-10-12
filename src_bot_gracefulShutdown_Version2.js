function setupGracefulShutdown({ servers = [], bots = [] }) {
  const shutdown = () => {
    console.log("Shutting down gracefully...");
    let pending = servers.length + bots.length;

    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        console.log("Shutdown complete.");
        process.exit(0);
      }
    };

    servers.forEach((srv) => {
      try {
        srv.close(() => {
          console.log("HTTP server closed.");
          done();
        });
      } catch (e) {
        console.error("Error closing server:", e);
        done();
      }
    });

    bots.forEach((bot) => {
      try {
        bot.end("shutdown");
      } catch (_) {}
      done();
    });

    if (pending === 0) process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = { setupGracefulShutdown };