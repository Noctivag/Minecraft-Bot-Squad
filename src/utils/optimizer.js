/**
 * System Optimizer - Master optimization controller
 * Coordinates all performance optimizations across bot systems
 */

const { performanceMonitor } = require("./performanceMonitor");
const { caches, printCacheStats } = require("./cache");
const config = require("../config/optimizations");

class SystemOptimizer {
  constructor() {
    this.optimizationsApplied = [];
    this.startTime = Date.now();
    this.performanceBaseline = null;
  }

  /**
   * Initialize all optimizations
   */
  initialize() {
    console.log("[Optimizer] Initializing system optimizations...");

    // Apply all configured optimizations
    this.optimizationsApplied.push("Performance monitoring enabled");
    this.optimizationsApplied.push("Multi-level caching system");
    this.optimizationsApplied.push("Configurable parameters");

    console.log(`[Optimizer] Applied ${this.optimizationsApplied.length} optimization layers`);

    // Take baseline measurement
    this.performanceBaseline = this.getSystemMetrics();
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics() {
    const health = performanceMonitor.getSystemHealth();
    const perfReport = performanceMonitor.getReport();

    return {
      memory: health.memoryUsage,
      uptime: health.uptime,
      operations: perfReport.totalOperations,
      slowestOps: perfReport.slowestOperations,
      timestamp: Date.now()
    };
  }

  /**
   * Get optimization report
   */
  getOptimizationReport() {
    const current = this.getSystemMetrics();
    const cacheStats = {};

    // Get all cache statistics
    for (const [name, cache] of Object.entries(caches)) {
      cacheStats[name] = cache.getStats();
    }

    return {
      uptime: Math.round((Date.now() - this.startTime) / 1000) + "s",
      optimizations: this.optimizationsApplied,
      currentMetrics: current,
      baseline: this.performanceBaseline,
      caches: cacheStats,
      config: {
        brainCooldown: config.brain.decisionCooldown + "ms",
        perceptionInterval: config.perception.updateInterval + "ms",
        autonomousTickRate: config.autonomous.tickInterval + "ms"
      }
    };
  }

  /**
   * Print full optimization report
   */
  printReport() {
    const report = this.getOptimizationReport();

    console.log("\n" + "=".repeat(60));
    console.log("               SYSTEM OPTIMIZATION REPORT");
    console.log("=".repeat(60));

    console.log(`\n📊 SYSTEM STATUS`);
    console.log(`  Uptime: ${report.uptime}`);
    console.log(`  Memory: ${report.currentMetrics.memory}MB`);
    console.log(`  Operations: ${report.currentMetrics.operations}`);

    console.log(`\n⚡ OPTIMIZATIONS APPLIED (${report.optimizations.length})`);
    report.optimizations.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt}`);
    });

    console.log(`\n🎯 CONFIGURATION`);
    Object.entries(report.config).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log(`\n💾 CACHE PERFORMANCE`);
    Object.entries(report.caches).forEach(([name, stats]) => {
      console.log(`  ${name}:`);
      console.log(`    Hit Rate: ${stats.hitRate}%`);
      console.log(`    Size: ${stats.size}/${stats.maxSize}`);
      console.log(`    Hits: ${stats.hits}, Misses: ${stats.misses}`);
    });

    if (report.currentMetrics.slowestOps.length > 0) {
      console.log(`\n🐌 SLOWEST OPERATIONS`);
      report.currentMetrics.slowestOps.forEach(op => {
        console.log(`  ${op.name}: ${op.avgTime}ms avg`);
      });
    }

    // Performance warnings
    const warnings = performanceMonitor.getWarnings(50);
    if (warnings.length > 0) {
      console.log(`\n⚠️  PERFORMANCE WARNINGS`);
      warnings.forEach(w => {
        console.log(`  ${w.operation}: ${w.avgTime}ms (threshold: ${w.threshold}ms)`);
      });
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }

  /**
   * Get optimization suggestions based on current performance
   */
  getSuggestions() {
    const suggestions = [];
    const warnings = performanceMonitor.getWarnings(50);

    // Check for slow operations
    warnings.forEach(w => {
      if (w.operation.includes("perception")) {
        suggestions.push({
          area: "Perception",
          issue: `Slow perception updates (${w.avgTime}ms)`,
          suggestion: "Increase config.perception.updateInterval or reduce scanRadius"
        });
      }

      if (w.operation.includes("brain")) {
        suggestions.push({
          area: "Decision Making",
          issue: `Slow brain decisions (${w.avgTime}ms)`,
          suggestion: "Increase config.brain.decisionCooldown or reduce opportunityScanDepth"
        });
      }
    });

    // Check cache performance
    for (const [name, cache] of Object.entries(caches)) {
      const stats = cache.getStats();

      if (stats.hitRate < 50 && stats.hits + stats.misses > 100) {
        suggestions.push({
          area: "Caching",
          issue: `Low ${name} cache hit rate (${stats.hitRate}%)`,
          suggestion: "Increase cache TTL or cache size"
        });
      }

      if (parseFloat(stats.utilization) > 90) {
        suggestions.push({
          area: "Caching",
          issue: `${name} cache nearly full (${stats.utilization}%)`,
          suggestion: "Increase cache maxSize"
        });
      }
    }

    // Check memory
    const health = performanceMonitor.getSystemHealth();
    if (health.memoryUsage > 500) {
      suggestions.push({
        area: "Memory",
        issue: `High memory usage (${health.memoryUsage}MB)`,
        suggestion: "Reduce cache sizes or increase cleanup intervals"
      });
    }

    return suggestions;
  }

  /**
   * Auto-tune based on performance
   */
  autoTune() {
    const suggestions = this.getSuggestions();

    console.log(`[Optimizer] Running auto-tune... (${suggestions.length} issues detected)`);

    let tuned = 0;

    suggestions.forEach(s => {
      // Auto-apply safe optimizations
      if (s.area === "Perception" && s.issue.includes("Slow")) {
        config.perception.updateInterval += 500;
        tuned++;
        console.log(`[Optimizer] Increased perception interval to ${config.perception.updateInterval}ms`);
      }

      if (s.area === "Decision Making" && s.issue.includes("Slow")) {
        config.brain.decisionCooldown += 500;
        tuned++;
        console.log(`[Optimizer] Increased brain cooldown to ${config.brain.decisionCooldown}ms`);
      }
    });

    console.log(`[Optimizer] Auto-tune complete (${tuned} adjustments made)`);

    return tuned;
  }

  /**
   * Reset all optimizations to defaults
   */
  reset() {
    console.log("[Optimizer] Resetting to default configuration...");

    // Reset caches
    for (const cache of Object.values(caches)) {
      cache.clear();
    }

    // Reset performance monitor
    performanceMonitor.reset();

    console.log("[Optimizer] Reset complete");
  }

  /**
   * Start monitoring loop
   */
  startMonitoring(intervalMinutes = 5) {
    console.log(`[Optimizer] Starting monitoring (reporting every ${intervalMinutes} minutes)`);

    setInterval(() => {
      this.printReport();

      // Auto-tune if enabled
      if (process.env.AUTO_TUNE === "true") {
        this.autoTune();
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Singleton instance
const systemOptimizer = new SystemOptimizer();

module.exports = { systemOptimizer, SystemOptimizer };
