/**
 * Redstone Automation System
 * Build complex redstone contraptions and automated systems
 */

const { logEvent } = require("../../memory/store");

class RedstoneSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.contraptions = [];
  }

  /**
   * Build automatic door system
   */
  async buildAutomaticDoor(position) {
    console.log(`[${this.agentName}] Building automatic door system...`);

    const blocks = [
      // Pressure plates
      { x: 0, y: 0, z: 0, block: "stone_pressure_plate" },
      { x: 0, y: 0, z: 3, block: "stone_pressure_plate" },

      // Doors
      { x: 0, y: 1, z: 1, block: "iron_door" },
      { x: 0, y: 1, z: 2, block: "iron_door" },

      // Redstone wiring
      { x: 1, y: 0, z: 0, block: "redstone_wire" },
      { x: 1, y: 0, z: 1, block: "redstone_wire" },
      { x: 1, y: 0, z: 2, block: "redstone_wire" },
      { x: 1, y: 0, z: 3, block: "redstone_wire" }
    ];

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build item sorter system
   */
  async buildItemSorter(position, itemsToSort = ["iron_ingot", "gold_ingot", "diamond"]) {
    console.log(`[${this.agentName}] Building item sorter for ${itemsToSort.length} items...`);

    const blocks = [];
    const sortingWidth = itemsToSort.length * 3;

    // Input hopper
    blocks.push({ x: 0, y: 1, z: 0, block: "hopper" });

    // Sorting modules (one per item)
    for (let i = 0; i < itemsToSort.length; i++) {
      const x = i * 3 + 2;

      // Comparator and repeater setup
      blocks.push({ x, y: 0, z: 0, block: "redstone_comparator" });
      blocks.push({ x, y: 0, z: 1, block: "redstone_repeater" });

      // Filter hopper (needs to be filled with filter items)
      blocks.push({ x, y: 1, z: 0, block: "hopper" });

      // Output chest
      blocks.push({ x, y: 1, z: 2, block: "chest" });

      // Redstone torch
      blocks.push({ x: x + 1, y: 0, z: 0, block: "redstone_torch" });
    }

    // Overflow chest at end
    blocks.push({ x: sortingWidth, y: 1, z: 0, block: "chest" });

    const success = await this.buildContraption(position, blocks);

    if (success) {
      logEvent(this.agentName, "redstone", {
        type: "item_sorter",
        items: itemsToSort
      });

      console.log(`[${this.agentName}] Item sorter built! Remember to add filter items to hoppers.`);
    }

    return success;
  }

  /**
   * Build automatic farm harvester
   */
  async buildAutoHarvester(position, farmSize = 9) {
    console.log(`[${this.agentName}] Building automatic farm harvester...`);

    const blocks = [];

    // Water channels for crop breaking
    for (let x = 0; x < farmSize; x++) {
      blocks.push({ x, y: 1, z: 0, block: "dispenser" });
      blocks.push({ x, y: 0, z: 0, block: "redstone_wire" });
    }

    // Collection hoppers
    for (let x = 0; x < farmSize; x++) {
      blocks.push({ x, y: 0, z: farmSize + 1, block: "hopper" });
    }

    // Central collection chest
    blocks.push({ x: Math.floor(farmSize / 2), y: 0, z: farmSize + 2, block: "chest" });

    // Redstone clock for timing
    blocks.push({ x: -1, y: 0, z: 0, block: "redstone_repeater" });
    blocks.push({ x: -2, y: 0, z: 0, block: "redstone_repeater" });
    blocks.push({ x: -2, y: 0, z: 1, block: "redstone_wire" });
    blocks.push({ x: -1, y: 0, z: 1, block: "redstone_wire" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build mob farm (basic grinder)
   */
  async buildMobGrinder(position) {
    console.log(`[${this.agentName}] Building mob grinder...`);

    const blocks = [];

    // Spawning platform (dark room)
    for (let x = 0; x < 20; x++) {
      for (let z = 0; z < 20; z++) {
        blocks.push({ x, y: 0, z, block: "stone" });
        if (x === 0 || x === 19 || z === 0 || z === 19) {
          for (let y = 1; y <= 3; y++) {
            blocks.push({ x, y, z, block: "stone" });
          }
        }
      }
    }

    // Water channels to center
    for (let x = 5; x < 15; x += 4) {
      for (let z = 0; z < 20; z++) {
        blocks.push({ x, y: 0, z, block: "water" });
      }
    }

    // Center drop shaft
    for (let y = 0; y < 20; y++) {
      blocks.push({ x: 10, y: -y, z: 10, block: "air" });
    }

    // Kill chamber at bottom
    blocks.push({ x: 10, y: -20, z: 10, block: "hopper" });
    blocks.push({ x: 10, y: -21, z: 10, block: "chest" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build automatic smelter
   */
  async buildAutoSmelter(position, furnaceCount = 4) {
    console.log(`[${this.agentName}] Building automatic smelter array...`);

    const blocks = [];

    for (let i = 0; i < furnaceCount; i++) {
      const x = i * 2;

      // Input hopper (for items to smelt)
      blocks.push({ x, y: 2, z: 0, block: "hopper" });

      // Furnace
      blocks.push({ x, y: 1, z: 0, block: "furnace" });

      // Fuel hopper
      blocks.push({ x, y: 1, z: 1, block: "hopper" });

      // Output hopper
      blocks.push({ x, y: 0, z: 0, block: "hopper" });
    }

    // Central input chest
    blocks.push({ x: -1, y: 3, z: 0, block: "chest" });

    // Central output chest
    blocks.push({ x: -1, y: 0, z: 0, block: "chest" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build piston door (fancy entrance)
   */
  async buildPistonDoor(position, size = 2) {
    console.log(`[${this.agentName}] Building ${size}x${size} piston door...`);

    const blocks = [];

    // Pistons
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        blocks.push({ x: 0, y, z: x, block: "sticky_piston" });
        blocks.push({ x: 1, y, z: x, block: "stone" }); // Door blocks
      }
    }

    // Redstone circuitry
    blocks.push({ x: -1, y: 0, z: 0, block: "lever" });
    for (let x = -1; x < size; x++) {
      blocks.push({ x, y: 0, z: -1, block: "redstone_wire" });
    }

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build elevator (water + soul sand)
   */
  async buildElevator(position, height = 20) {
    console.log(`[${this.agentName}] Building water elevator (height: ${height})...`);

    const blocks = [];

    // Shaft
    for (let y = 0; y < height; y++) {
      // Glass walls
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          if (x === 0 || x === 2 || z === 0 || z === 2) {
            blocks.push({ x, y, z, block: "glass" });
          }
        }
      }
    }

    // Soul sand at bottom (for upward bubbles)
    blocks.push({ x: 1, y: 0, z: 1, block: "soul_sand" });

    // Water source at top
    blocks.push({ x: 1, y: height - 1, z: 1, block: "water" });

    // Sign to hold water
    blocks.push({ x: 1, y: 1, z: 1, block: "sign" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build automatic cow/chicken farm
   */
  async buildAnimalFarm(position, animalType = "cow") {
    console.log(`[${this.agentName}] Building automatic ${animalType} farm...`);

    const blocks = [];

    // Breeding chamber
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        blocks.push({ x, y: 0, z, block: "grass_block" });

        // Walls
        if (x === 0 || x === 7 || z === 0 || z === 7) {
          blocks.push({ x, y: 1, z, block: "fence" });
        }
      }
    }

    // Hopper collection system (for eggs/drops)
    if (animalType === "chicken") {
      for (let x = 2; x < 6; x++) {
        for (let z = 2; z < 6; z++) {
          blocks.push({ x, y: -1, z, block: "hopper" });
        }
      }

      // Chest for collection
      blocks.push({ x: 4, y: -1, z: 0, block: "chest" });
    }

    // Dispenser for automatic feeding
    blocks.push({ x: 4, y: 2, z: 0, block: "dispenser" });

    // Redstone clock
    blocks.push({ x: 5, y: 1, z: 0, block: "redstone_repeater" });
    blocks.push({ x: 6, y: 1, z: 0, block: "redstone_repeater" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build sugarcane/bamboo farm
   */
  async buildCropFarm(position, cropType = "sugar_cane") {
    console.log(`[${this.agentName}] Building automatic ${cropType} farm...`);

    const blocks = [];

    const farmWidth = 10;

    // Water line
    for (let x = 0; x < farmWidth; x++) {
      blocks.push({ x, y: 0, z: 0, block: "water" });
    }

    // Growing space
    for (let x = 0; x < farmWidth; x++) {
      blocks.push({ x, y: 0, z: 1, block: "dirt" });
      blocks.push({ x, y: 1, z: 1, block: cropType });
    }

    // Observer-piston harvester
    for (let x = 0; x < farmWidth; x += 2) {
      blocks.push({ x, y: 2, z: 1, block: "observer" });
      blocks.push({ x, y: 2, z: 2, block: "sticky_piston" });
    }

    // Collection system
    for (let x = 0; x < farmWidth; x++) {
      blocks.push({ x, y: 0, z: 3, block: "hopper" });
    }

    blocks.push({ x: farmWidth / 2, y: 0, z: 4, block: "chest" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build TNT cannon (for fun/mining)
   */
  async buildTNTCannon(position) {
    console.log(`[${this.agentName}] Building TNT cannon...`);

    const blocks = [];

    // Base platform
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 5; z++) {
        blocks.push({ x, y: 0, z, block: "stone" });
      }
    }

    // Barrel (water-filled)
    for (let x = 2; x < 8; x++) {
      blocks.push({ x, y: 1, z: 2, block: "stone" });
      if (x > 2 && x < 7) {
        blocks.push({ x, y: 1, z: 2, block: "water" });
      }
    }

    // TNT dispensers
    blocks.push({ x: 1, y: 1, z: 2, block: "dispenser" }); // Charge
    blocks.push({ x: 8, y: 1, z: 2, block: "dispenser" }); // Projectile

    // Redstone button
    blocks.push({ x: 5, y: 1, z: 0, block: "stone_button" });

    return await this.buildContraption(position, blocks);
  }

  /**
   * Build lighting system (automatic day/night)
   */
  async buildLightingSystem(position, range = 20) {
    console.log(`[${this.agentName}] Building automatic lighting system...`);

    const blocks = [];

    // Daylight sensor
    blocks.push({ x: 0, y: 0, z: 0, block: "daylight_detector" });

    // Redstone wire to lamps
    for (let i = 1; i <= range; i++) {
      blocks.push({ x: i, y: 0, z: 0, block: "redstone_wire" });

      // Lamps every 5 blocks
      if (i % 5 === 0) {
        blocks.push({ x: i, y: 1, z: 0, block: "redstone_lamp" });
      }
    }

    return await this.buildContraption(position, blocks);
  }

  /**
   * Helper: Build contraption from block list
   */
  async buildContraption(origin, blocks) {
    console.log(`[${this.agentName}] Placing ${blocks.length} blocks...`);

    try {
      for (const blockDef of blocks) {
        const pos = {
          x: origin.x + blockDef.x,
          y: origin.y + blockDef.y,
          z: origin.z + blockDef.z
        };

        await this.placeBlock(pos, blockDef.block);
        await new Promise(resolve => setTimeout(resolve, 200)); // Delay for stability
      }

      this.contraptions.push({
        origin,
        blocks: blocks.length,
        builtAt: Date.now()
      });

      console.log(`[${this.agentName}] Contraption built successfully!`);
      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Failed to build contraption:`, err.message);
      return false;
    }
  }

  /**
   * Place a single block
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) {
      console.log(`[${this.agentName}] Missing: ${blockType}`);
      return false;
    }

    try {
      await this.bot.equip(item, "hand");

      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== "air") {
        await this.bot.dig(existingBlock);
      }

      const referencePos = position.offset(0, -1, 0);
      const referenceBlock = this.bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== "air") {
        const Vec3 = require("vec3");
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
      }

      return false;

    } catch (err) {
      return false;
    }
  }

  /**
   * Get contraption statistics
   */
  getStats() {
    return {
      totalContraptions: this.contraptions.length,
      totalBlocks: this.contraptions.reduce((sum, c) => sum + c.blocks, 0)
    };
  }
}

module.exports = { RedstoneSystem };
