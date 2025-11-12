/**
 * Performance Monitoring System
 * Tracks execution times, memory usage, and system health
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map(); // name -> { count, totalTime, avgTime, maxTime, minTime }
    this.startTimes = new Map();
    this.systemHealth = {
      cpuUsage: 0,
      memoryUsage: 0,
      tickRate: 0,
      lastUpdate: Date.now()
    };
  }

  /**
   * Start timing an operation
   */
  start(operationName) {
    this.startTimes.set(operationName, process.hrtime.bigint());
  }

  /**
   * End timing and record metric
   */
  end(operationName) {
    const startTime = this.startTimes.get(operationName);
    if (!startTime) return;

    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = durationNs / 1000000; // Convert to milliseconds

    this.startTimes.delete(operationName);

    // Update metrics
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metric = this.metrics.get(operationName);
    metric.count++;
    metric.totalTime += durationMs;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, durationMs);
    metric.minTime = Math.min(metric.minTime, durationMs);
  }

  /**
   * Measure execution time of a function
   */
  async measure(operationName, fn) {
    this.start(operationName);
    try {
      const result = await fn();
      this.end(operationName);
      return result;
    } catch (err) {
      this.end(operationName);
      throw err;
    }
  }

  /**
   * Update system health metrics
   */
  updateSystemHealth() {
    const usage = process.memoryUsage();

    this.systemHealth = {
      memoryUsage: Math.round(usage.heapUsed / 1024 / 1024), // MB
      memoryTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      uptime: Math.round(process.uptime()), // seconds
      lastUpdate: Date.now()
    };
  }

  /**
   * Get metrics for specific operation
   */
  getMetric(operationName) {
    return this.metrics.get(operationName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics.entries()) {
      result[name] = {
        count: metric.count,
        avgTime: Math.round(metric.avgTime * 100) / 100,
        maxTime: Math.round(metric.maxTime * 100) / 100,
        minTime: metric.minTime === Infinity ? 0 : Math.round(metric.minTime * 100) / 100
      };
    }
    return result;
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    this.updateSystemHealth();
    return this.systemHealth;
  }

  /**
   * Get performance report
   */
  getReport() {
    const metrics = this.getAllMetrics();
    const health = this.getSystemHealth();

    // Find slowest operations
    const slowest = Object.entries(metrics)
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 5)
      .map(([name, data]) => ({ name, avgTime: data.avgTime }));

    // Find most frequent operations
    const frequent = Object.entries(metrics)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, count: data.count }));

    return {
      system: health,
      slowestOperations: slowest,
      frequentOperations: frequent,
      totalOperations: Object.values(metrics).reduce((sum, m) => sum + m.count, 0),
      totalMetrics: Object.keys(metrics).length
    };
  }

  /**
   * Print performance report
   */
  printReport() {
    const report = this.getReport();

    console.log("\n=== Performance Report ===");
    console.log(`Memory: ${report.system.memoryUsage}MB / ${report.system.memoryTotal}MB`);
    console.log(`Uptime: ${report.system.uptime}s`);
    console.log(`Total Operations: ${report.totalOperations}`);
    console.log(`Tracked Metrics: ${report.totalMetrics}`);

    console.log("\nSlowest Operations:");
    report.slowestOperations.forEach(op => {
      console.log(`  ${op.name}: ${op.avgTime}ms avg`);
    });

    console.log("\nMost Frequent Operations:");
    report.frequentOperations.forEach(op => {
      console.log(`  ${op.name}: ${op.count} calls`);
    });

    console.log("========================\n");
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Check if operation is slow
   */
  isSlow(operationName, thresholdMs = 100) {
    const metric = this.metrics.get(operationName);
    return metric && metric.avgTime > thresholdMs;
  }

  /**
   * Get performance warnings
   */
  getWarnings(thresholdMs = 100) {
    const warnings = [];

    for (const [name, metric] of this.metrics.entries()) {
      if (metric.avgTime > thresholdMs) {
        warnings.push({
          operation: name,
          avgTime: Math.round(metric.avgTime * 100) / 100,
          threshold: thresholdMs
        });
      }
    }

    return warnings;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-print report every 5 minutes in debug mode
if (process.env.DEBUG_PERFORMANCE) {
  setInterval(() => {
    performanceMonitor.printReport();
  }, 300000); // 5 minutes
}

module.exports = { performanceMonitor, PerformanceMonitor };
