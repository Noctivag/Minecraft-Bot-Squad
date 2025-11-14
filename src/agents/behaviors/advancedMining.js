const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Advanced Mining System - Smart mining with vein detection and tunnel systems
 */
class AdvancedMiningSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.miningStrategies = ["branch_mining", "strip_mining", "quarry", "vein_mining"];
    this.activeMine = null;
    this.oreVeins = new Map(); // Track discovered ore veins
    this.tunnelNetwork = [];
  }

  /**
   * Start branch mining at optimal depth
   */
  async startBranchMining(depth = -59) {
    console.log(`[${this.agentName}] Starting branch mining at Y=${depth}`);

    const startPos = this.bot.entity.position.clone();
    this.activeMine = {
      type: "branch_mining",
      startPos,
      targetDepth: depth,
      branches: [],
      oresFound: {}
    };

    try {
      // Go to target depth
      await this.descendToDepth(depth);

      // Create main tunnel (100 blocks)
      const mainTunnel = await this.digTunnel(100, "north");
      this.activeMine.mainTunnel = mainTunnel;

      // Create side branches every 4 blocks
      for (let i = 0; i < mainTunnel.length; i += 4) {
        const branchPos = mainTunnel[i];
        await this.bot.pathfinder.goto(branchPos);

        // Dig branch to the east
        const eastBranch = await this.digTunnel(30, "east");
        this.activeMine.branches.push(eastBranch);

        // Dig branch to the west
        const westBranch = await this.digTunnel(30, "west");
        this.activeMine.branches.push(westBranch);
      }

      await logEvent(this.agentName, "branch_mining_complete", {
        oresFound: this.activeMine.oresFound,
        tunnelsCreated: this.activeMine.branches.length + 1
      });

      return this.activeMine.oresFound;
    } catch (err) {
      console.error(`[${this.agentName}] Branch mining error:`, err.message);
      return null;
    }
  }

  /**
   * Dig tunnel in specified direction
   */
  async digTunnel(length, direction) {
    const tunnel = [];
    const directionVectors = {
      north: { x: 0, z: -1 },
      south: { x: 0, z: 1 },
      east: { x: 1, z: 0 },
      west: { x: -1, z: 0 }
    };

    const vec = directionVectors[direction];
    const startPos = this.bot.entity.position.clone();

    for (let i = 0; i < length; i++) {
      const targetPos = startPos.offset(vec.x * i, 0, vec.z * i);

      // Dig 3-high tunnel (feet, head, above)
      for (let y = 0; y <= 2; y++) {
        const blockPos = targetPos.offset(0, y, 0);
        const block = this.bot.blockAt(blockPos);

        if (block && block.name !== "air") {
          // Check if valuable ore
          if (this.isValuableOre(block)) {
            await this.mineOreVein(block);
          } else {
            await this.bot.dig(block);
          }
        }
      }

      tunnel.push(targetPos.clone());

      // Place torches every 8 blocks
      if (i % 8 === 0) {
        await this.placeTorch(targetPos.offset(0, 1, 0));
      }
    }

    return tunnel;
  }

  /**
   * Intelligent ore vein mining
   */
  async mineOreVein(oreBlock) {
    const veinId = `${oreBlock.name}_${Date.now()}`;
    const vein = {
      id: veinId,
      ore: oreBlock.name,
      blocks: [],
      startTime: Date.now()
    };

    console.log(`[${this.agentName}] Found ore vein: ${oreBlock.name}`);

    // Flood fill to find all connected ore blocks
    const toCheck = [oreBlock.position];
    const checked = new Set();

    while (toCheck.length > 0) {
      const pos = toCheck.pop();
      const key = `${pos.x},${pos.y},${pos.z}`;

      if (checked.has(key)) continue;
      checked.add(key);

      const block = this.bot.blockAt(pos);
      if (!block || block.name !== oreBlock.name) continue;

      vein.blocks.push(pos);

      // Check all 6 adjacent blocks
      const adjacent = [
        pos.offset(1, 0, 0), pos.offset(-1, 0, 0),
        pos.offset(0, 1, 0), pos.offset(0, -1, 0),
        pos.offset(0, 0, 1), pos.offset(0, 0, -1)
      ];

      toCheck.push(...adjacent);
    }

    // Mine all ore blocks in vein
    for (const blockPos of vein.blocks) {
      const block = this.bot.blockAt(blockPos);
      if (block && block.name === oreBlock.name) {
        try {
          await this.bot.dig(block);
          await recordMetric(this.agentName, "ore_mined", 1);
        } catch (err) {
          console.warn(`[${this.agentName}] Failed to mine ore at ${blockPos}:`, err.message);
        }
      }
    }

    vein.endTime = Date.now();
    this.oreVeins.set(veinId, vein);

    // Track in active mine stats
    if (this.activeMine) {
      this.activeMine.oresFound[oreBlock.name] = (this.activeMine.oresFound[oreBlock.name] || 0) + vein.blocks.length;
    }

    await logEvent(this.agentName, "ore_vein_mined", {
      ore: oreBlock.name,
      count: vein.blocks.length,
      duration: vein.endTime - vein.startTime
    });

    return vein;
  }

  /**
   * Create automated quarry
   */
  async createQuarry(width = 16, depth = 64) {
    console.log(`[${this.agentName}] Creating ${width}x${width}x${depth} quarry`);

    const startPos = this.bot.entity.position.clone();
    const quarry = {
      type: "quarry",
      startPos,
      width,
      depth,
      layersMined: 0,
      resourcesGathered: {}
    };

    try {
      // Mine layer by layer from top to bottom
      for (let y = 0; y < depth; y++) {
        await this.mineQuarryLayer(startPos.offset(0, -y, 0), width);
        quarry.layersMined++;

        // Return to surface every 16 layers to empty inventory
        if (y % 16 === 0 && y > 0) {
          await this.depositInventory();
        }
      }

      await logEvent(this.agentName, "quarry_complete", {
        size: `${width}x${width}x${depth}`,
        layersMined: quarry.layersMined
      });

      return quarry;
    } catch (err) {
      console.error(`[${this.agentName}] Quarry error:`, err.message);
      return null;
    }
  }

  /**
   * Mine a single quarry layer
   */
  async mineQuarryLayer(layerPos, width) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < width; z++) {
        const blockPos = layerPos.offset(x, 0, z);
        const block = this.bot.blockAt(blockPos);

        if (block && block.name !== "air" && block.name !== "bedrock") {
          await this.bot.dig(block);

          if (this.isValuableOre(block)) {
            await recordMetric(this.agentName, "ore_mined", 1);
          }
        }
      }
    }
  }

  /**
   * Strip mining - remove entire chunks
   */
  async startStripMining(length = 100) {
    console.log(`[${this.agentName}] Starting strip mining for ${length} blocks`);

    const startPos = this.bot.entity.position.clone();

    for (let x = 0; x < length; x++) {
      // Mine 3-wide strip
      for (let z = 0; z < 3; z++) {
        await this.digTunnel(1, "north");
      }

      // Move to next strip
      await this.bot.pathfinder.goto(startPos.offset(x + 1, 0, 0));
    }
  }

  /**
   * Descend to target mining depth safely
   */
  async descendToDepth(targetY) {
    const currentY = Math.floor(this.bot.entity.position.y);

    if (currentY <= targetY) {
      console.log(`[${this.agentName}] Already at or below target depth`);
      return;
    }

    console.log(`[${this.agentName}] Descending from Y=${currentY} to Y=${targetY}`);

    // Dig staircase down
    const blocksToDescend = currentY - targetY;
    const startPos = this.bot.entity.position.clone();

    for (let i = 0; i < blocksToDescend; i++) {
      // Dig block below
      const belowPos = this.bot.entity.position.offset(0, -1, 0);
      const belowBlock = this.bot.blockAt(belowPos);

      if (belowBlock && belowBlock.name !== "air" && belowBlock.name !== "bedrock") {
        await this.bot.dig(belowBlock);
      }

      // Dig forward block for staircase
      const forwardPos = this.bot.entity.position.offset(1, -1, 0);
      const forwardBlock = this.bot.blockAt(forwardPos);

      if (forwardBlock && forwardBlock.name !== "air") {
        await this.bot.dig(forwardBlock);
      }

      // Move down
      await this.bot.pathfinder.goto(this.bot.entity.position.offset(1, -1, 0));
    }

    console.log(`[${this.agentName}] Reached target depth: Y=${Math.floor(this.bot.entity.position.y)}`);
  }

  /**
   * Check if block is valuable ore
   */
  isValuableOre(block) {
    const valuableOres = [
      "coal_ore", "deepslate_coal_ore",
      "iron_ore", "deepslate_iron_ore",
      "gold_ore", "deepslate_gold_ore",
      "diamond_ore", "deepslate_diamond_ore",
      "emerald_ore", "deepslate_emerald_ore",
      "lapis_ore", "deepslate_lapis_ore",
      "redstone_ore", "deepslate_redstone_ore",
      "copper_ore", "deepslate_copper_ore",
      "ancient_debris"
    ];

    return valuableOres.includes(block.name);
  }

  /**
   * Place torch for lighting
   */
  async placeTorch(position) {
    const torch = this.bot.inventory.items().find(item => item.name === "torch");
    if (!torch) return false;

    try {
      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      if (referenceBlock && referenceBlock.name !== "air") {
        await this.bot.equip(torch, "hand");
        await this.bot.placeBlock(referenceBlock, new this.bot.vec3(0, 1, 0));
        return true;
      }
    } catch (err) {
      console.warn(`[${this.agentName}] Failed to place torch:`, err.message);
    }
    return false;
  }

  /**
   * Deposit inventory at base
   */
  async depositInventory() {
    // TODO: Implement pathfinding to base and chest deposit
    console.log(`[${this.agentName}] Depositing inventory (not implemented)`);
  }

  /**
   * Get mining statistics
   */
  getStatistics() {
    const stats = {
      activeMineName: this.activeMine?.type || "none",
      oreVeinsFound: this.oreVeins.size,
      tunnelsCreated: this.tunnelNetwork.length,
      totalOresMined: 0
    };

    if (this.activeMine?.oresFound) {
      stats.oresInCurrentMine = this.activeMine.oresFound;
      stats.totalOresMined = Object.values(this.activeMine.oresFound).reduce((a, b) => a + b, 0);
    }

    return stats;
  }
}

module.exports = { AdvancedMiningSystem };
