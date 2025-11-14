const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Redstone Automation System - Build and manage redstone contraptions
 */
class RedstoneSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.contraptions = [];
    this.circuits = new Map();
  }

  /**
   * Build automatic farm (observer-based)
   */
  async buildAutoFarm(centerPos, cropType = "wheat") {
    console.log(`[${this.agentName}] Building automatic ${cropType} farm`);

    const farm = {
      type: "auto_farm",
      crop: cropType,
      position: centerPos,
      size: { width: 9, length: 9 },
      components: []
    };

    try {
      // Build farmland layer
      for (let x = 0; x < 9; x++) {
        for (let z = 0; z < 9; z++) {
          const pos = centerPos.offset(x, 0, z);
          await this.placeBlock(pos, "farmland");

          // Plant crops
          if (cropType === "wheat" || cropType === "carrot" || cropType === "potato") {
            await this.plantCrop(pos.offset(0, 1, 0), cropType);
          }
        }
      }

      // Build observer mechanism along one edge
      for (let x = 0; x < 9; x++) {
        const observerPos = centerPos.offset(x, 1, -1);
        await this.placeBlock(observerPos, "observer");
        farm.components.push({ type: "observer", pos: observerPos });

        // Piston above observer
        const pistonPos = centerPos.offset(x, 2, -1);
        await this.placeBlock(pistonPos, "sticky_piston");
        farm.components.push({ type: "sticky_piston", pos: pistonPos });
      }

      // Hopper collection system
      const hopperPos = centerPos.offset(4, 0, -2);
      await this.placeBlock(hopperPos, "hopper");
      farm.components.push({ type: "hopper", pos: hopperPos });

      // Connect to chest
      const chestPos = centerPos.offset(4, 0, -3);
      await this.placeBlock(chestPos, "chest");
      farm.components.push({ type: "chest", pos: chestPos });

      this.contraptions.push(farm);

      await logEvent(this.agentName, "auto_farm_built", {
        crop: cropType,
        size: "9x9",
        components: farm.components.length
      });

      return farm;
    } catch (err) {
      console.error(`[${this.agentName}] Auto farm build failed:`, err.message);
      return null;
    }
  }

  /**
   * Build item sorter system
   */
  async buildItemSorter(startPos, itemTypes = []) {
    console.log(`[${this.agentName}] Building item sorter for ${itemTypes.length} item types`);

    const sorter = {
      type: "item_sorter",
      position: startPos,
      slots: itemTypes.length,
      items: itemTypes,
      components: []
    };

    try {
      // Main hopper line
      for (let i = 0; i < itemTypes.length; i++) {
        const hopperPos = startPos.offset(i * 2, 0, 0);

        // Hopper
        await this.placeBlock(hopperPos, "hopper");
        sorter.components.push({ type: "hopper", pos: hopperPos });

        // Comparator
        const comparatorPos = hopperPos.offset(0, 0, 1);
        await this.placeBlock(comparatorPos, "comparator");
        sorter.components.push({ type: "comparator", pos: comparatorPos });

        // Redstone torch
        const torchPos = hopperPos.offset(1, 0, 1);
        await this.placeBlock(torchPos, "redstone_torch");
        sorter.components.push({ type: "redstone_torch", pos: torchPos });

        // Output chest
        const chestPos = hopperPos.offset(0, -1, 0);
        await this.placeBlock(chestPos, "chest");
        sorter.components.push({ type: "chest", pos: chestPos, itemType: itemTypes[i] });

        // Pre-fill hopper with filter items
        // TODO: Fill hopper with 18x named items + 4x target item
      }

      this.contraptions.push(sorter);

      await logEvent(this.agentName, "item_sorter_built", {
        slots: itemTypes.length,
        components: sorter.components.length
      });

      return sorter;
    } catch (err) {
      console.error(`[${this.agentName}] Item sorter build failed:`, err.message);
      return null;
    }
  }

  /**
   * Build automatic smelter with fuel and ore input
   */
  async buildAutoSmelter(startPos) {
    console.log(`[${this.agentName}] Building automatic smelter`);

    const smelter = {
      type: "auto_smelter",
      position: startPos,
      furnaces: [],
      components: []
    };

    try {
      // Build 4-furnace array
      for (let i = 0; i < 4; i++) {
        const furnacePos = startPos.offset(i * 2, 1, 0);

        // Input hopper (top) for ores
        const inputHopperPos = furnacePos.offset(0, 1, 0);
        await this.placeBlock(inputHopperPos, "hopper");
        smelter.components.push({ type: "input_hopper", pos: inputHopperPos });

        // Furnace
        await this.placeBlock(furnacePos, "furnace");
        smelter.furnaces.push(furnacePos);

        // Fuel hopper (side)
        const fuelHopperPos = furnacePos.offset(0, 0, 1);
        await this.placeBlock(fuelHopperPos, "hopper");
        smelter.components.push({ type: "fuel_hopper", pos: fuelHopperPos });

        // Output hopper (bottom)
        const outputHopperPos = furnacePos.offset(0, -1, 0);
        await this.placeBlock(outputHopperPos, "hopper");
        smelter.components.push({ type: "output_hopper", pos: outputHopperPos });

        // Output chest
        const chestPos = outputHopperPos.offset(0, -1, 0);
        await this.placeBlock(chestPos, "chest");
        smelter.components.push({ type: "output_chest", pos: chestPos });
      }

      this.contraptions.push(smelter);

      await logEvent(this.agentName, "auto_smelter_built", {
        furnaces: smelter.furnaces.length,
        components: smelter.components.length
      });

      return smelter;
    } catch (err) {
      console.error(`[${this.agentName}] Auto smelter build failed:`, err.message);
      return null;
    }
  }

  /**
   * Build mob farm (spawner-based or natural spawning)
   */
  async buildMobFarm(spawnerPos, mobType) {
    console.log(`[${this.agentName}] Building ${mobType} mob farm at spawner`);

    const farm = {
      type: "mob_farm",
      mobType,
      spawner: spawnerPos,
      killChamber: null,
      collection: null,
      components: []
    };

    try {
      // Build spawn chamber (8x8x4)
      for (let x = -4; x <= 4; x++) {
        for (let z = -4; z <= 4; z++) {
          for (let y = 0; y <= 4; y++) {
            const pos = spawnerPos.offset(x, y, z);

            // Walls
            if (Math.abs(x) === 4 || Math.abs(z) === 4) {
              await this.placeBlock(pos, "stone_bricks");
            }
          }
        }
      }

      // Water channels to center
      const waterPos = spawnerPos.offset(0, 0, 4);
      await this.placeBlock(waterPos, "water");
      farm.components.push({ type: "water_source", pos: waterPos });

      // Kill chamber (drop shaft)
      const killChamberPos = spawnerPos.offset(0, -20, 0);
      for (let y = 0; y < 20; y++) {
        const shaftPos = spawnerPos.offset(0, -y, 0);
        await this.bot.dig(this.bot.blockAt(shaftPos));
      }
      farm.killChamber = killChamberPos;

      // Collection hopper at bottom
      const hopperPos = killChamberPos.offset(0, 0, 0);
      await this.placeBlock(hopperPos, "hopper");
      farm.components.push({ type: "collection_hopper", pos: hopperPos });

      // Collection chest
      const chestPos = hopperPos.offset(0, 0, 1);
      await this.placeBlock(chestPos, "chest");
      farm.collection = chestPos;

      this.contraptions.push(farm);

      await logEvent(this.agentName, "mob_farm_built", {
        mobType,
        spawnerPos,
        components: farm.components.length
      });

      return farm;
    } catch (err) {
      console.error(`[${this.agentName}] Mob farm build failed:`, err.message);
      return null;
    }
  }

  /**
   * Build piston door (2x2 or larger)
   */
  async buildPistonDoor(doorPos, size = "2x2") {
    console.log(`[${this.agentName}] Building ${size} piston door`);

    const door = {
      type: "piston_door",
      size,
      position: doorPos,
      components: []
    };

    try {
      // Simple 2x2 piston door
      const pistonPositions = [
        doorPos.offset(0, 0, 0),
        doorPos.offset(1, 0, 0),
        doorPos.offset(0, 1, 0),
        doorPos.offset(1, 1, 0)
      ];

      for (const pos of pistonPositions) {
        await this.placeBlock(pos, "sticky_piston");
        door.components.push({ type: "sticky_piston", pos });
      }

      // Button for activation
      const buttonPos = doorPos.offset(-1, 1, 0);
      await this.placeBlock(buttonPos, "stone_button");
      door.components.push({ type: "button", pos: buttonPos });

      // Redstone wiring
      // TODO: Add redstone dust, repeaters, etc.

      this.contraptions.push(door);

      await logEvent(this.agentName, "piston_door_built", {
        size,
        components: door.components.length
      });

      return door;
    } catch (err) {
      console.error(`[${this.agentName}] Piston door build failed:`, err.message);
      return null;
    }
  }

  /**
   * Build flying machine (TNT duper, item transport, etc.)
   */
  async buildFlyingMachine(startPos, direction = "north") {
    console.log(`[${this.agentName}] Building flying machine traveling ${direction}`);

    const machine = {
      type: "flying_machine",
      position: startPos,
      direction,
      components: []
    };

    try {
      // Slime blocks
      await this.placeBlock(startPos, "slime_block");
      await this.placeBlock(startPos.offset(1, 0, 0), "slime_block");
      machine.components.push({ type: "slime_block", pos: startPos });
      machine.components.push({ type: "slime_block", pos: startPos.offset(1, 0, 0) });

      // Observers (facing each other)
      await this.placeBlock(startPos.offset(0, 0, 1), "observer");
      await this.placeBlock(startPos.offset(1, 0, 1), "observer");
      machine.components.push({ type: "observer", pos: startPos.offset(0, 0, 1) });
      machine.components.push({ type: "observer", pos: startPos.offset(1, 0, 1) });

      // Sticky pistons
      await this.placeBlock(startPos.offset(0, 0, 2), "sticky_piston");
      machine.components.push({ type: "sticky_piston", pos: startPos.offset(0, 0, 2) });

      this.contraptions.push(machine);

      await logEvent(this.agentName, "flying_machine_built", {
        direction,
        components: machine.components.length
      });

      return machine;
    } catch (err) {
      console.error(`[${this.agentName}] Flying machine build failed:`, err.message);
      return null;
    }
  }

  /**
   * Helper: Place block
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) {
      console.warn(`[${this.agentName}] Missing block: ${blockType}`);
      return false;
    }

    try {
      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      if (referenceBlock && referenceBlock.name !== "air") {
        await this.bot.equip(item, "hand");
        await this.bot.placeBlock(referenceBlock, new this.bot.vec3(0, 1, 0));
        await recordMetric(this.agentName, "blocks_placed", 1);
        return true;
      }
    } catch (err) {
      console.warn(`[${this.agentName}] Failed to place ${blockType}:`, err.message);
    }
    return false;
  }

  /**
   * Helper: Plant crop
   */
  async plantCrop(position, cropType) {
    const seeds = {
      wheat: "wheat_seeds",
      carrot: "carrot",
      potato: "potato",
      beetroot: "beetroot_seeds"
    };

    const seedItem = seeds[cropType];
    if (!seedItem) return false;

    return await this.placeBlock(position, seedItem);
  }

  /**
   * Get redstone statistics
   */
  getStatistics() {
    const stats = {
      totalContraptions: this.contraptions.length,
      byType: {}
    };

    for (const contraption of this.contraptions) {
      stats.byType[contraption.type] = (stats.byType[contraption.type] || 0) + 1;
    }

    return stats;
  }
}

module.exports = { RedstoneSystem };
