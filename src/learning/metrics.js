/**
 * Learning Metrics - Simplified version for bot performance tracking
 * Records metrics and computes rewards for learning
 */

// In-memory storage for metrics
const metrics = new Map();

/**
 * Record a metric for an agent
 * @param {string} agent - Agent name
 * @param {string} kind - Metric type (e.g., 'mining', 'combat', 'movement')
 * @param {number} value - Metric value
 * @param {object} ctx - Additional context
 */
function recordMetric(agent, kind, value, ctx = {}) {
  if (!metrics.has(agent)) {
    metrics.set(agent, []);
  }

  const metric = {
    agent,
    kind,
    value,
    ctx,
    timestamp: Date.now()
  };

  metrics.get(agent).push(metric);

  // Keep only last 1000 metrics per agent
  if (metrics.get(agent).length > 1000) {
    metrics.get(agent).shift();
  }
}

/**
 * Compute movement reward based on session data
 * @param {object} session - Session data
 * @returns {number} Reward value
 */
function computeMovementReward(session) {
  let reward = 0;

  if (session.success) reward += 1;
  if (session.timeout) reward -= 1;

  if (typeof session.timeMs === "number") {
    reward -= Math.min(0.5, session.timeMs / 30000);
  }

  if (typeof session.damageTaken === "number") {
    reward -= Math.min(0.5, session.damageTaken / 5);
  }

  return reward;
}

/**
 * Get metrics for an agent
 * @param {string} agent - Agent name
 * @param {number} limit - Maximum number of metrics to return
 * @returns {Array} Recent metrics
 */
function getMetrics(agent, limit = 100) {
  if (!metrics.has(agent)) {
    return [];
  }

  const agentMetrics = metrics.get(agent);
  return agentMetrics.slice(-limit);
}

/**
 * Get metrics by kind
 * @param {string} agent - Agent name
 * @param {string} kind - Metric kind
 * @param {number} limit - Maximum number of metrics to return
 * @returns {Array} Metrics of specified kind
 */
function getMetricsByKind(agent, kind, limit = 100) {
  const agentMetrics = getMetrics(agent, 1000);
  return agentMetrics
    .filter(m => m.kind === kind)
    .slice(-limit);
}

/**
 * Clear metrics for an agent
 * @param {string} agent - Agent name
 */
function clearMetrics(agent) {
  metrics.delete(agent);
}

/**
 * Get all metrics
 * @returns {Map} All metrics
 */
function getAllMetrics() {
  return metrics;
}

module.exports = {
  recordMetric,
  computeMovementReward,
  getMetrics,
  getMetricsByKind,
  clearMetrics,
  getAllMetrics
};
