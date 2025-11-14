/**
 * Memory Store - Simplified version for bot operations
 * Provides event logging and episode tracking
 */

// In-memory storage for events (can be replaced with database)
const events = new Map();

/**
 * Log an event for an agent
 * @param {string} agent - Agent name
 * @param {string} type - Event type
 * @param {object} payload - Event data
 */
function logEvent(agent, type, payload) {
  if (!events.has(agent)) {
    events.set(agent, []);
  }

  const event = {
    agent,
    type,
    payload: payload || {},
    timestamp: Date.now()
  };

  events.get(agent).push(event);

  // Keep only last 1000 events per agent to avoid memory issues
  if (events.get(agent).length > 1000) {
    events.get(agent).shift();
  }
}

/**
 * Get recent episodes for an agent
 * @param {string} agent - Agent name
 * @param {number} limit - Maximum number of episodes to return
 * @returns {Array} Recent episodes
 */
function getRecentEpisodes(agent, limit = 50) {
  if (!events.has(agent)) {
    return [];
  }

  const agentEvents = events.get(agent);
  return agentEvents.slice(-limit);
}

/**
 * Clear events for an agent
 * @param {string} agent - Agent name
 */
function clearEvents(agent) {
  events.delete(agent);
}

/**
 * Get all events
 * @returns {Map} All events
 */
function getAllEvents() {
  return events;
}

module.exports = {
  logEvent,
  getRecentEpisodes,
  clearEvents,
  getAllEvents
};
