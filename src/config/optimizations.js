/**
 * Performance Optimizations for Bot Systems
 * Tunable configuration for maximum efficiency
 */

module.exports = {
  // Perception System Optimizations
  perception: {
    updateInterval: 2000,        // ms between scans (2s default, increase for lower CPU)
    scanRadius: 32,              // blocks to scan (reduce for better performance)
    entityScanLimit: 50,         // max entities to track
    blockScanStep: 2,            // step size for block scanning (2 = skip every other block)
    cacheValuableBlocks: true,   // cache resource locations
    dangerCheckInterval: 1000,   // ms between danger assessments (more frequent = safer)
  },

  // Brain Decision Making Optimizations
  brain: {
    decisionCooldown: 3000,      // ms between decisions (increase to reduce CPU)
    opportunityScanDepth: 10,    // max opportunities to evaluate
    stateAnalysisCaching: true,  // cache state analysis results
    priorityThresholds: {
      survival: 30,              // danger level for survival mode
      defense: 15,               // danger level for defense mode
      lowHealth: 10,             // health threshold for emergency
      lowHunger: 10,             // hunger threshold
      inventoryFull: 80,         // % for inventory full
    }
  },

  // Combat System Optimizations
  combat: {
    attackCooldown: 500,         // ms between attacks
    threatUpdateInterval: 2000,  // ms between threat list updates
    maxTrackedThreats: 10,       // max threats to track simultaneously
    autoEatThreshold: 10,        // auto-eat when health below this
    retreatDistance: 30,         // blocks to retreat when escaping
    patrolInterval: 3000,        // ms between patrol checks
  },

  // Farming System Optimizations
  farming: {
    cropCheckInterval: 60000,    // ms between farm checks (1 minute)
    maxFarms: 5,                 // max farms per bot
    breedingCooldown: 30000,     // ms between breeding attempts
    harvestBatchSize: 10,        // crops to harvest before yielding
  },

  // Building System Optimizations
  building: {
    blocksPerTick: 5,            // blocks to place before yielding
    materialCheckCaching: true,  // cache material availability
    pathfindingTimeout: 10000,   // ms before giving up on reaching position
    retryAttempts: 3,            // times to retry failed block placement
  },

  // Inventory Management Optimizations
  inventory: {
    autoDepositThreshold: 32,    // inventory slots before auto-deposit
    reservedSlots: 9,            // slots to keep free for tools
    scanChestInterval: 300000,   // ms between chest scans (5 minutes)
    organizeCooldown: 60000,     // ms between inventory organizations
    junkDropInterval: 120000,    // ms between junk disposal
  },

  // Team Coordination Optimizations
  coordination: {
    taskAssignmentDelay: 1000,   // ms to wait before assigning tasks
    heartbeatInterval: 30000,    // ms between heartbeat updates
    inactiveTimeout: 60000,      // ms before marking bot inactive
    maxTaskQueueSize: 100,       // max tasks in queue
    taskRetryLimit: 3,           // max retries for failed tasks
  },

  // Real-time Communication Optimizations
  realtime: {
    messageQueueLimit: 1000,     // max messages in queue
    messageCleanupInterval: 60000, // ms between cleanup
    messageRetentionTime: 3600000, // ms to keep messages (1 hour)
    broadcastThrottle: 100,      // ms between broadcasts
  },

  // Autonomous Mode Optimizations
  autonomous: {
    tickInterval: 5000,          // ms between autonomous ticks
    errorRecoveryDelay: 2000,    // ms to wait after error
    maxConcurrentActions: 1,     // actions to run simultaneously
    actionTimeout: 30000,        // ms before canceling stuck action
  },

  // Pathfinding Optimizations
  pathfinding: {
    timeout: 10000,              // ms before giving up
    searchRadius: 100,           // blocks to search for path
    allowSprinting: true,        // enable sprinting
    allowParkour: false,         // enable parkour moves (risky)
    avoidWater: true,            // avoid water paths
    avoidLava: true,             // avoid lava
  },

  // Memory and Logging Optimizations
  system: {
    eventLogBatching: true,      // batch event logs
    eventLogInterval: 5000,      // ms between log flushes
    metricAggregation: true,     // aggregate metrics before storing
    debugMode: false,            // enable verbose logging
    performanceMonitoring: true, // track performance metrics
  }
};
