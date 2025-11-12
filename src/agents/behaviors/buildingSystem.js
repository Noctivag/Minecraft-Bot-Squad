const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Advanced Building System - Blueprint-based construction automation
 */
class BuildingSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.blueprints = new Map();
    this.activeBuilds = [];
    this.loadDefaultBlueprints();
  }

  /**
   * Load default blueprints
   */
  loadDefaultBlueprints() {
    // Simple house blueprint
    this.blueprints.set("simple_house", {
      name: "Simple House",
      size: { x: 7, y: 5, z: 7 },
      materials: {
        "oak_planks": 120,
        "glass": 8,
        "oak_door": 1,
        "torch": 8
      },
      blocks: this.generateHouseBlueprint()
    });

    // Storage shed
    this.blueprints.set("storage_shed", {
      name: "Storage Shed",
      size: { x: 5, y: 4, z: 5 },
      materials: {
        "oak_planks": 60,
        "chest": 8,
        "torch": 4
      },
      blocks: this.generateStorageBlueprint()
    });

    // Guard tower
    this.blueprints.set("guard_tower", {
      name: "Guard Tower",
      size: { x: 5, y: 12, z: 5 },
      materials: {
        "stone_bricks": 200,
        "oak_planks": 50,
        "ladder": 10,
        "torch": 12
      },
      blocks: this.generateTowerBlueprint()
    });

    // Farm plot
    this.blueprints.set("farm_plot", {
      name: "Farm Plot",
      size: { x: 9, y: 1, z: 9 },
      materials: {
        "oak_fence": 32,
        "water_bucket": 1,
        "wheat_seeds": 64
      },
      blocks: this.generateFarmBlueprint()
    });

    console.log(`[BuildingSystem] Loaded ${this.blueprints.size} blueprints`);
  }

  /**
   * Generate house blueprint
   */
  generateHouseBlueprint() {
    const blocks = [];

    // Floor (y=0)
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        blocks.push({ x, y: 0, z, block: "oak_planks" });
      }
    }

    // Walls (y=1 to y=3)
    for (let y = 1; y <= 3; y++) {
      for (let x = 0; x < 7; x++) {
        for (let z = 0; z < 7; z++) {
          // Only edges
          if (x === 0 || x === 6 || z === 0 || z === 6) {
            // Add windows at y=2
            if (y === 2 && (x === 3 || z === 3) && !(x === 3 && z === 0)) {
              blocks.push({ x, y, z, block: "glass" });
            } else if (y === 1 && x === 3 && z === 0) {
              // Door position (leave empty)
              blocks.push({ x, y, z, block: "oak_door" });
            } else {
              blocks.push({ x, y, z, block: "oak_planks" });
            }
          }
        }
      }
    }

    // Roof (y=4)
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        blocks.push({ x, y: 4, z, block: "oak_planks" });
      }
    }

    // Interior torches
    blocks.push({ x: 1, y: 2, z: 1, block: "torch" });
    blocks.push({ x: 5, y: 2, z: 1, block: "torch" });
    blocks.push({ x: 1, y: 2, z: 5, block: "torch" });
    blocks.push({ x: 5, y: 2, z: 5, block: "torch" });

    return blocks;
  }

  /**
   * Generate storage shed blueprint
   */
  generateStorageBlueprint() {
    const blocks = [];

    // Floor
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        blocks.push({ x, y: 0, z, block: "oak_planks" });
      }
    }

    // Walls
    for (let y = 1; y <= 2; y++) {
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            if (!(y === 1 && x === 2 && z === 0)) { // Door
              blocks.push({ x, y, z, block: "oak_planks" });
            }
          }
        }
      }
    }

    // Roof
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        blocks.push({ x, y: 3, z, block: "oak_planks" });
      }
    }

    // Chests along walls
    blocks.push({ x: 1, y: 1, z: 1, block: "chest" });
    blocks.push({ x: 3, y: 1, z: 1, block: "chest" });
    blocks.push({ x: 1, y: 1, z: 3, block: "chest" });
    blocks.push({ x: 3, y: 1, z: 3, block: "chest" });

    return blocks;
  }

  /**
   * Generate tower blueprint
   */
  generateTowerBlueprint() {
    const blocks = [];

    // Base and tower structure
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          // Corners only for tower effect
          if ((x === 0 || x === 4) && (z === 0 || z === 4)) {
            blocks.push({ x, y, z, block: "stone_bricks" });
          }
          // Floor every 3 levels
          if (y % 3 === 0 && x > 0 && x < 4 && z > 0 && z < 4) {
            blocks.push({ x, y, z, block: "oak_planks" });
          }
        }
      }
    }

    // Ladder in center
    for (let y = 1; y < 12; y++) {
      blocks.push({ x: 2, y, z: 2, block: "ladder" });
    }

    // Top platform
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        blocks.push({ x, y: 11, z, block: "stone_bricks" });
      }
    }

    return blocks;
  }

  /**
   * Generate farm plot blueprint
   */
  generateFarmBlueprint() {
    const blocks = [];

    // Fence perimeter
    for (let x = 0; x < 9; x++) {
      blocks.push({ x, y: 0, z: 0, block: "oak_fence" });
      blocks.push({ x, y: 0, z: 8, block: "oak_fence" });
    }
    for (let z = 1; z < 8; z++) {
      blocks.push({ x: 0, y: 0, z, block: "oak_fence" });
      blocks.push({ x: 8, y: 0, z, block: "oak_fence" });
    }

    return blocks;
  }

  /**
   * Start building from blueprint
   */
  async buildFromBlueprint(blueprintId, origin, options = {}) {
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) {
      console.log(`[${this.agentName}] Blueprint '${blueprintId}' not found`);
      return false;
    }

    console.log(`[${this.agentName}] Starting construction: ${blueprint.name}`);

    // Check materials
    const hasMaterials = this.checkMaterials(blueprint.materials);
    if (!hasMaterials && !options.skipMaterialCheck) {
      console.log(`[${this.agentName}] Insufficient materials for ${blueprint.name}`);
      return false;
    }

    const build = {
      id: Date.now(),
      blueprint: blueprintId,
      origin,
      startedAt: Date.now(),
      completedBlocks: 0,
      totalBlocks: blueprint.blocks.length,
      status: "in_progress"
    };

    this.activeBuilds.push(build);

    logEvent(this.agentName, "building", {
      action: "start",
      blueprint: blueprint.name,
      origin
    });

    try {
      // Sort blocks by Y level (bottom to top)
      const sortedBlocks = [...blueprint.blocks].sort((a, b) => a.y - b.y);

      for (const blockDef of sortedBlocks) {
        const pos = {
          x: origin.x + blockDef.x,
          y: origin.y + blockDef.y,
          z: origin.z + blockDef.z
        };

        const success = await this.placeBlock(pos, blockDef.block);
        if (success) {
          build.completedBlocks++;

          if (build.completedBlocks % 10 === 0) {
            console.log(`[${this.agentName}] Progress: ${build.completedBlocks}/${build.totalBlocks}`);
          }
        }
      }

      build.status = "completed";
      build.completedAt = Date.now();

      recordMetric(this.agentName, "buildings_completed", 1);
      logEvent(this.agentName, "building", {
        action: "complete",
        blueprint: blueprint.name,
        duration: build.completedAt - build.startedAt,
        blocks: build.completedBlocks
      });

      console.log(`[${this.agentName}] Construction complete: ${blueprint.name} (${build.completedBlocks} blocks)`);
      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Building failed:`, err.message);
      build.status = "failed";
      build.error = err.message;
      return false;
    }
  }

  /**
   * Place a single block
   */
  async placeBlock(position, blockType) {
    try {
      // Get the item from inventory
      const item = this.bot.inventory.items().find(i => i.name === blockType);
      if (!item) {
        console.log(`[${this.agentName}] Missing material: ${blockType}`);
        return false;
      }

      // Move to position if needed
      const dist = this.bot.entity.position.distanceTo(position);
      if (dist > 4) {
        const { goals } = require("mineflayer-pathfinder");
        await this.bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 3));
      }

      // Clear the space if needed
      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== "air") {
        await this.bot.dig(existingBlock);
      }

      // Equip the item
      await this.bot.equip(item, "hand");

      // Find reference block to place against
      const referencePos = position.offset(0, -1, 0);
      const referenceBlock = this.bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== "air") {
        const Vec3 = require("vec3");
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
      }

      return false;

    } catch (err) {
      console.error(`[${this.agentName}] Failed to place ${blockType}:`, err.message);
      return false;
    }
  }

  /**
   * Check if bot has required materials
   */
  checkMaterials(required) {
    for (const [material, count] of Object.entries(required)) {
      const items = this.bot.inventory.items().filter(i => i.name === material);
      const total = items.reduce((sum, item) => sum + item.count, 0);

      if (total < count) {
        console.log(`[${this.agentName}] Need ${count} ${material}, have ${total}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Create custom blueprint
   */
  createBlueprint(id, name, size, blocks, materials) {
    this.blueprints.set(id, {
      name,
      size,
      blocks,
      materials
    });

    console.log(`[${this.agentName}] Created custom blueprint: ${name}`);
    logEvent(this.agentName, "blueprint", { action: "create", id, name });
  }

  /**
   * Scan existing structure and create blueprint
   */
  async scanStructure(corner1, corner2) {
    console.log(`[${this.agentName}] Scanning structure...`);

    const blocks = [];
    const materials = {};

    const minX = Math.min(corner1.x, corner2.x);
    const maxX = Math.max(corner1.x, corner2.x);
    const minY = Math.min(corner1.y, corner2.y);
    const maxY = Math.max(corner1.y, corner2.y);
    const minZ = Math.min(corner1.z, corner2.z);
    const maxZ = Math.max(corner1.z, corner2.z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.bot.blockAt({ x, y, z });

          if (block && block.name !== "air") {
            blocks.push({
              x: x - minX,
              y: y - minY,
              z: z - minZ,
              block: block.name
            });

            materials[block.name] = (materials[block.name] || 0) + 1;
          }
        }
      }
    }

    const size = {
      x: maxX - minX + 1,
      y: maxY - minY + 1,
      z: maxZ - minZ + 1
    };

    console.log(`[${this.agentName}] Scanned ${blocks.length} blocks (${size.x}x${size.y}x${size.z})`);

    return {
      size,
      blocks,
      materials
    };
  }

  /**
   * List available blueprints
   */
  listBlueprints() {
    return Array.from(this.blueprints.entries()).map(([id, bp]) => ({
      id,
      name: bp.name,
      size: bp.size,
      blocks: bp.blocks.length,
      materials: Object.keys(bp.materials).length
    }));
  }

  /**
   * Get building status
   */
  getStatus() {
    const active = this.activeBuilds.filter(b => b.status === "in_progress");
    const completed = this.activeBuilds.filter(b => b.status === "completed").length;

    return {
      blueprints: this.blueprints.size,
      activeBuilds: active.length,
      completedBuilds: completed,
      currentProgress: active.length > 0
        ? `${active[0].completedBlocks}/${active[0].totalBlocks}`
        : "none"
    };
  }
}

module.exports = { BuildingSystem };
