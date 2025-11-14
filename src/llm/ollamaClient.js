/**
 * Ollama Client - Optional LLM integration
 * This is a stub implementation for environments without Ollama
 */

/**
 * Generate text using Ollama (stub implementation)
 * @param {object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
async function generate(options) {
  // This is a stub - returns empty string if Ollama is not available
  // In production, this would connect to Ollama API
  console.warn("[Ollama] Ollama client not configured - using stub implementation");
  return "";
}

/**
 * Chat completion using Ollama (stub implementation)
 * @param {object} options - Chat options
 * @returns {Promise<string>} Chat response
 */
async function chat(options) {
  console.warn("[Ollama] Ollama client not configured - using stub implementation");
  return "";
}

/**
 * Check if Ollama is available
 * @returns {boolean} Availability status
 */
function isAvailable() {
  return false;
}

module.exports = {
  generate,
  chat,
  isAvailable
};
