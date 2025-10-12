const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b-instruct";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

async function generate({ prompt, system, stop, temperature = 0.3, max_tokens = 1024 }) {
  const res = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: [system ? `System:\n${system}\n\n` : "", prompt].join(""),
      options: { temperature, num_predict: max_tokens, stop },
      stream: false
    }),
  });
  if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`);
  const data = await res.json();
  return data.response || "";
}

async function embed(texts) {
  const arr = Array.isArray(texts) ? texts : [texts];
  const res = await fetch(`${base}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: arr })
  });
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data.embeddings)) return data.embeddings;
  if (Array.isArray(data.embedding)) return [data.embedding];
  return [];
}

module.exports = { generate, embed };