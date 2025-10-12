const { reflectAndPatch } = require("../learning/reflectionLoop");

const AGENTS = (process.env.AGENTS || "Alex,Blaze,Cora,Dune,Eli").split(",").map(s => s.trim());

async function tick() {
  for (const a of AGENTS) {
    try {
      const res = await reflectAndPatch(a);
      if (res.ok) {
        console.log(`[Reflection] ${a} patched:`, res.patch);
      } else {
        console.warn(`[Reflection] ${a} failed:`, res.error);
      }
    } catch (e) {
      console.error(`[Reflection] ${a} exception:`, e);
    }
  }
}

function start() {
  tick();
  setInterval(tick, 60 * 60 * 1000);
}

if (require.main === module) start();

module.exports = { start };