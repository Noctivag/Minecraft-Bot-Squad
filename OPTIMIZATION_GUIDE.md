# ⚡ Performance Optimization Guide

Complete guide to optimizing your Minecraft Bot Squad for maximum performance!

---

## 🎯 Overview

The bot system includes **5 layers of optimization**:

1. **Configurable Parameters** - Tune every aspect
2. **Multi-Level Caching** - Reduce repeated computations
3. **Performance Monitoring** - Track execution times
4. **Auto-Tuning** - Automatic optimization
5. **Smart Defaults** - Already optimized out of the box!

---

## 📊 Performance Monitoring

### View Performance Reports

```javascript
const { performanceMonitor } = require("./src/utils/performanceMonitor");

// Get full report
performanceMonitor.printReport();

// Get specific metric
const metric = performanceMonitor.getMetric("brain_decision_Alex");
console.log(`Avg decision time: ${metric.avgTime}ms`);

// Get warnings (operations slower than threshold)
const warnings = performanceMonitor.getWarnings(100); // 100ms threshold
warnings.forEach(w => {
  console.log(`⚠️ ${w.operation}: ${w.avgTime}ms`);
});
```

### System Health

```javascript
const health = performanceMonitor.getSystemHealth();
console.log(`Memory: ${health.memoryUsage}MB`);
console.log(`Uptime: ${health.uptime}s`);
```

### Enable Debug Mode

```bash
# Enable performance debugging
export DEBUG_PERFORMANCE=true

# Enable cache debugging
export DEBUG_CACHE=true

# Run your bots
node examples/nextLevel.js
```

---

## 💾 Caching System

### Cache Statistics

```javascript
const { caches, printCacheStats } = require("./src/utils/cache");

// Print all cache stats
printCacheStats();

// Get specific cache stats
const perceptionStats = caches.perception.getStats();
console.log(`Hit rate: ${perceptionStats.hitRate}%`);
console.log(`Size: ${perceptionStats.size}/${perceptionStats.maxSize}`);
```

### Cache Types

| Cache | Purpose | TTL | Size |
|-------|---------|-----|------|
| **perception** | Environmental data | 5s | 500 |
| **pathfinding** | Calculated paths | 30s | 100 |
| **blocks** | Block information | 1min | 1000 |
| **entities** | Entity data | 2s | 200 |
| **inventory** | Inventory states | 10s | 50 |
| **decisions** | Brain decisions | 3s | 100 |

### Custom Caching

```javascript
const { Cache } = require("./src/utils/cache");

// Create custom cache
const myCache = new Cache(100, 60000); // 100 items, 60s TTL

// Use it
myCache.set("key", value);
const data = myCache.get("key");

// Memoization pattern
const result = await myCache.getOrCompute("expensiveOp", async () => {
  return await doExpensiveOperation();
});
```

---

## ⚙️ Configuration Tuning

### Edit Configuration

**File:** `src/config/optimizations.js`

```javascript
module.exports = {
  brain: {
    decisionCooldown: 3000,      // ⬇️ Decrease for faster decisions
    priorityThresholds: {
      survival: 30,              // ⬆️ Increase for more cautious bots
      defense: 15,
      lowHealth: 10,
      lowHunger: 10,
      inventoryFull: 80,
    }
  },

  perception: {
    updateInterval: 2000,        // ⬆️ Increase to reduce CPU usage
    scanRadius: 32,              // ⬇️ Decrease for better performance
    blockScanStep: 2,            // ⬆️ Increase to scan faster (less accuracy)
  },

  autonomous: {
    tickInterval: 5000,          // ⬆️ Increase to reduce CPU usage
    maxConcurrentActions: 1,     // Actions to run simultaneously
  }
};
```

### Quick Tuning Profiles

#### Maximum Performance (Low Resource)
```javascript
{
  brain: { decisionCooldown: 5000 },       // 5s between decisions
  perception: { updateInterval: 5000 },    // 5s between scans
  autonomous: { tickInterval: 10000 },     // 10s ticks
}
```

#### Balanced (Default)
```javascript
{
  brain: { decisionCooldown: 3000 },       // 3s between decisions
  perception: { updateInterval: 2000 },    // 2s between scans
  autonomous: { tickInterval: 5000 },      // 5s ticks
}
```

#### High Performance (More Resources)
```javascript
{
  brain: { decisionCooldown: 1000 },       // 1s between decisions
  perception: { updateInterval: 1000 },    // 1s between scans
  autonomous: { tickInterval: 2000 },      // 2s ticks
}
```

---

## 🤖 System Optimizer

### Use the Master Optimizer

```javascript
const { systemOptimizer } = require("./src/utils/optimizer");

// Initialize optimizations
systemOptimizer.initialize();

// Get full report
systemOptimizer.printReport();

// Get optimization suggestions
const suggestions = systemOptimizer.getSuggestions();
suggestions.forEach(s => {
  console.log(`${s.area}: ${s.issue}`);
  console.log(`  → ${s.suggestion}`);
});

// Auto-tune based on performance
systemOptimizer.autoTune();

// Start monitoring (reports every 5 minutes)
systemOptimizer.startMonitoring(5);
```

### Enable Auto-Tuning

```bash
# Enable automatic performance tuning
export AUTO_TUNE=true

node examples/nextLevel.js
```

The system will automatically adjust parameters based on performance!

---

## 🎯 Optimization Strategies

### For Many Bots (10+)

```javascript
// Reduce update frequencies
config.perception.updateInterval = 5000;  // 5s
config.brain.decisionCooldown = 5000;     // 5s
config.autonomous.tickInterval = 10000;   // 10s

// Reduce scan areas
config.perception.scanRadius = 24;        // Smaller radius
config.perception.blockScanStep = 3;      // Coarser scans

// Limit tracking
config.perception.entityScanLimit = 30;   // Fewer entities
config.combat.maxTrackedThreats = 5;      // Fewer threats
```

### For Low-End Hardware

```javascript
// Minimal CPU usage
config.autonomous.tickInterval = 15000;   // 15s ticks
config.perception.updateInterval = 10000; // 10s scans
config.brain.decisionCooldown = 7000;     // 7s decisions

// Disable some features
config.perception.cacheValuableBlocks = false;
config.brain.stateAnalysisCaching = false;
config.building.materialCheckCaching = false;
```

### For High Performance

```javascript
// Faster response times
config.autonomous.tickInterval = 2000;    // 2s ticks
config.perception.updateInterval = 1000;  // 1s scans
config.brain.decisionCooldown = 1000;     // 1s decisions

// More aggressive combat
config.combat.attackCooldown = 300;       // 300ms attacks
config.brain.priorityThresholds.defense = 10; // Earlier defense

// Larger caches
caches.perception = new Cache(1000, 5000);
caches.decisions = new Cache(200, 3000);
```

---

## 📈 Benchmarking

### Measure Bot Performance

```javascript
const { performanceMonitor } = require("./src/utils/performanceMonitor");

// Measure custom operation
performanceMonitor.start("my_operation");
await doSomething();
performanceMonitor.end("my_operation");

// Or use helper
await performanceMonitor.measure("my_operation", async () => {
  return await doSomething();
});

// Check if slow
if (performanceMonitor.isSlow("my_operation", 50)) {
  console.log("Operation is slow!");
}
```

### Bot-Specific Stats

```javascript
// Get brain performance
const brainStats = bot.brain.getPerformanceStats();
console.log(`Decisions: ${brainStats.totalDecisions}`);
console.log(`Avg time: ${brainStats.avgDecisionTime}ms`);
console.log(`Current goal: ${brainStats.currentGoal}`);
```

---

## 🔍 Troubleshooting

### Bot is Slow / Laggy

**Symptoms:** Delayed reactions, stuttering movement

**Solutions:**
1. Increase `autonomous.tickInterval` to 10000ms
2. Increase `brain.decisionCooldown` to 5000ms
3. Reduce `perception.scanRadius` to 24
4. Increase `perception.blockScanStep` to 3

```javascript
config.autonomous.tickInterval = 10000;
config.brain.decisionCooldown = 5000;
config.perception.scanRadius = 24;
config.perception.blockScanStep = 3;
```

### High Memory Usage

**Symptoms:** >500MB RAM per bot

**Solutions:**
1. Reduce cache sizes
2. Increase cleanup intervals
3. Disable caching

```javascript
// Reduce cache sizes
caches.perception = new Cache(100, 5000);
caches.blocks = new Cache(200, 30000);

// Or disable caching
config.brain.stateAnalysisCaching = false;
config.perception.cacheValuableBlocks = false;
```

### Bots Missing Threats

**Symptoms:** Getting attacked without responding

**Solutions:**
1. Decrease `perception.updateInterval`
2. Decrease `combat.threatUpdateInterval`
3. Lower `brain.priorityThresholds.defense`

```javascript
config.perception.updateInterval = 1000;      // Check every 1s
config.combat.threatUpdateInterval = 1000;    // Update threats every 1s
config.brain.priorityThresholds.defense = 10; // React to lower danger
```

### Slow Decisions

**Symptoms:** Brain decisions taking >50ms

**Solutions:**
1. Enable state caching
2. Reduce `brain.opportunityScanDepth`
3. Increase decision cooldown

```javascript
config.brain.stateAnalysisCaching = true;
config.brain.opportunityScanDepth = 5;  // Scan fewer opportunities
config.brain.decisionCooldown = 5000;   // Decide less frequently
```

---

## 📊 Performance Targets

### Excellent Performance
- Brain decisions: < 5ms
- Perception updates: < 20ms
- Autonomous ticks: < 50ms
- Cache hit rate: > 70%
- Memory per bot: < 100MB

### Good Performance
- Brain decisions: < 20ms
- Perception updates: < 50ms
- Autonomous ticks: < 100ms
- Cache hit rate: > 50%
- Memory per bot: < 200MB

### Acceptable Performance
- Brain decisions: < 50ms
- Perception updates: < 100ms
- Autonomous ticks: < 200ms
- Cache hit rate: > 30%
- Memory per bot: < 300MB

---

## 🎮 Example Usage

### Complete Optimized Setup

```javascript
const { createEnhancedAgent } = require("./src/agents/enhancedAgent");
const { systemOptimizer } = require("./src/utils/optimizer");
const { performanceMonitor } = require("./src/utils/performanceMonitor");

// Initialize optimizer
systemOptimizer.initialize();

// Create bot
const bot = await createEnhancedAgent({
  name: "OptimizedBot",
  host: "localhost",
  port: 25565,
  capabilities: ["mining", "combat"]
});

// Start with monitoring
bot.startAutonomousMode(5000);
systemOptimizer.startMonitoring(5);

// Check performance every minute
setInterval(() => {
  const stats = bot.brain.getPerformanceStats();
  console.log(`[${bot.name}] Decisions: ${stats.totalDecisions}, Avg: ${stats.avgDecisionTime}ms`);

  // Auto-tune if slow
  if (stats.avgDecisionTime > 50) {
    console.log("Performance degraded, auto-tuning...");
    systemOptimizer.autoTune();
  }
}, 60000);
```

---

## 🚀 Quick Start

1. **Use default config** (already optimized!)

2. **Enable monitoring**:
   ```bash
   export DEBUG_PERFORMANCE=true
   node examples/nextLevel.js
   ```

3. **View reports**:
   ```javascript
   systemOptimizer.printReport();
   ```

4. **Tune if needed**:
   ```javascript
   systemOptimizer.autoTune();
   ```

5. **Enjoy fast, efficient bots!** 🎉

---

## 📝 Summary

The bot system is **already optimized** with smart defaults!

For most users: **No tuning needed** ✅

For advanced users:
- 📊 Monitor with `performanceMonitor`
- ⚙️ Tune with `config/optimizations.js`
- 🤖 Auto-optimize with `systemOptimizer`

---

## Files

- `src/config/optimizations.js` - All configuration parameters
- `src/utils/performanceMonitor.js` - Performance tracking
- `src/utils/cache.js` - Caching system
- `src/utils/optimizer.js` - Master optimizer
- `src/agents/ruleBasedBrain.js` - Optimized brain

Happy optimizing! ⚡
