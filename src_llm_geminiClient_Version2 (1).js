const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FixedWindowRateLimiter } = require("./rateLimiter");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const limiter = new FixedWindowRateLimiter({ maxPerWindow: 4, windowMs: 60 * 60 * 1000 });

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY ist nicht gesetzt (env).");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: DEFAULT_MODEL });
}

async function generateContentLimited(prompt) {
  if (!limiter.allow()) {
    return {
      ok: false,
      reason: "rate_limited",
      remaining: 0,
      resetInMs: limiter.currentWindowEndsInMs(),
    };
  }
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";
    return { ok: true, text, remaining: limiter.remaining(), resetInMs: limiter.currentWindowEndsInMs() };
  } catch (e) {
    return {
      ok: false,
      reason: `gemini_error: ${e?.message || e}`,
      remaining: limiter.remaining(),
      resetInMs: limiter.currentWindowEndsInMs(),
    };
  }
}

module.exports = { generateContentLimited };