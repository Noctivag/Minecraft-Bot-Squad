const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function run() {
  const db = new Database(DB_PATH);
  const sql = fs.readFileSync(path.join(__dirname, "schema_migration.sql"), "utf8");
  db.exec(sql);

  const arms = [
    {
      name: "conservative",
      params: { canOpenDoors: true, allow1by1towers: false, maxDropDown: 2, digCost: 6, placeCost: 6, waterCost: 20, lavaCost: 100 }
    },
    {
      name: "balanced",
      params: { canOpenDoors: true, allow1by1towers: true, maxDropDown: 3, digCost: 4, placeCost: 4, waterCost: 12, lavaCost: 100 }
    },
    {
      name: "aggressive",
      params: { canOpenDoors: true, allow1by1towers: true, maxDropDown: 4, digCost: 2, placeCost: 2, waterCost: 8, lavaCost: 100 }
    },
    {
      name: "scout",
      params: { canOpenDoors: true, allow1by1towers: false, maxDropDown: 5, digCost: 5, placeCost: 3, waterCost: 10, lavaCost: 100 }
    }
  ];

  const insertArm = db.prepare("INSERT OR IGNORE INTO movement_arms (name, params_json) VALUES (?, ?)");
  for (const a of arms) insertArm.run(a.name, JSON.stringify(a.params));

  db.close();
  console.log("Migration complete, movement arms seeded.");
}

if (require.main === module) run();

module.exports = { run };