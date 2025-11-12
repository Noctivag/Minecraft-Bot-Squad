/**
 * Advanced Building System - Beautiful structures and aesthetic designs
 * Extends the basic building system with style and decoration
 */

const { logEvent } = require("../../memory/store");
const { BuildingSystem } = require("./buildingSystem");

class AdvancedBuildingSystem extends BuildingSystem {
  constructor(bot, agentName) {
    super(bot, agentName);
    this.loadAdvancedBlueprints();
  }

  /**
   * Load advanced blueprints with aesthetic designs
   */
  loadAdvancedBlueprints() {
    // BEAUTIFUL HOUSES
    this.blueprints.set("cottage", {
      name: "Cozy Cottage",
      size: { x: 11, y: 7, z: 9 },
      style: "rustic",
      materials: this.getCottageMaterials(),
      blocks: this.generateCottageBlueprint()
    });

    this.blueprints.set("modern_house", {
      name: "Modern House",
      size: { x: 15, y: 8, z: 12 },
      style: "modern",
      materials: this.getModernHouseMaterials(),
      blocks: this.generateModernHouseBlueprint()
    });

    this.blueprints.set("medieval_house", {
      name: "Medieval House",
      size: { x: 9, y: 9, z: 9 },
      style: "medieval",
      materials: this.getMedievalHouseMaterials(),
      blocks: this.generateMedievalHouseBlueprint()
    });

    // FARMS
    this.blueprints.set("automated_crop_farm", {
      name: "Automated Crop Farm",
      size: { x: 17, y: 5, z: 17 },
      type: "farm",
      materials: this.getAutomatedFarmMaterials(),
      blocks: this.generateAutomatedCropFarmBlueprint()
    });

    this.blueprints.set("animal_pen", {
      name: "Animal Breeding Pen",
      size: { x: 11, y: 4, z: 11 },
      type: "farm",
      materials: this.getAnimalPenMaterials(),
      blocks: this.generateAnimalPenBlueprint()
    });

    // UTILITY BUILDINGS
    this.blueprints.set("enchanting_room", {
      name: "Enchanting Room",
      size: { x: 9, y: 6, z: 9 },
      type: "utility",
      materials: this.getEnchantingRoomMaterials(),
      blocks: this.generateEnchantingRoomBlueprint()
    });

    this.blueprints.set("storage_warehouse", {
      name: "Storage Warehouse",
      size: { x: 15, y: 6, z: 15 },
      type: "utility",
      materials: this.getWarehouseMaterials(),
      blocks: this.generateWarehouseBlueprint()
    });

    // DECORATIVE STRUCTURES
    this.blueprints.set("fountain", {
      name: "Decorative Fountain",
      size: { x: 7, y: 5, z: 7 },
      type: "decorative",
      materials: this.getFountainMaterials(),
      blocks: this.generateFountainBlueprint()
    });

    this.blueprints.set("bridge", {
      name: "Stone Bridge",
      size: { x: 5, y: 3, z: 20 },
      type: "infrastructure",
      materials: this.getBridgeMaterials(),
      blocks: this.generateBridgeBlueprint()
    });

    this.blueprints.set("lighthouse", {
      name: "Lighthouse",
      size: { x: 7, y: 20, z: 7 },
      type: "decorative",
      materials: this.getLighthouseMaterials(),
      blocks: this.generateLighthouseBlueprint()
    });

    console.log(`[AdvancedBuildingSystem] Loaded ${this.blueprints.size} blueprints`);
  }

  // COTTAGE BLUEPRINT
  generateCottageBlueprint() {
    const blocks = [];

    // Foundation and floor
    for (let x = 0; x < 11; x++) {
      for (let z = 0; z < 9; z++) {
        blocks.push({ x, y: 0, z, block: "oak_planks" });
      }
    }

    // Walls (mix of oak planks and cobblestone)
    for (let y = 1; y <= 4; y++) {
      for (let x = 0; x < 11; x++) {
        for (let z = 0; z < 9; z++) {
          if (x === 0 || x === 10 || z === 0 || z === 8) {
            // Alternating pattern for rustic look
            const block = ((x + z + y) % 2 === 0) ? "oak_planks" : "cobblestone";

            // Windows at y=2
            if (y === 2 && (x === 3 || x === 7) && z === 0) {
              blocks.push({ x, y, z, block: "glass_pane" });
            }
            // Door at y=1
            else if (y === 1 && x === 5 && z === 0) {
              blocks.push({ x, y, z, block: "oak_door" });
            } else {
              blocks.push({ x, y, z, block });
            }
          }
        }
      }
    }

    // Sloped roof (oak stairs)
    for (let y = 5; y <= 6; y++) {
      const width = 11 - (y - 4) * 2;
      const offset = (y - 4);

      for (let x = offset; x < offset + width; x++) {
        for (let z = 0; z < 9; z++) {
          blocks.push({ x, y, z, block: "oak_stairs" });
        }
      }
    }

    // Chimney
    for (let y = 1; y <= 7; y++) {
      blocks.push({ x: 2, y, z: 2, block: "stone_bricks" });
      blocks.push({ x: 3, y, z: 2, block: "stone_bricks" });
    }
    blocks.push({ x: 2, y: 3, z: 2, block: "campfire" }); // Fireplace

    // Interior decoration
    blocks.push({ x: 8, y: 1, z: 7, block: "bed" });
    blocks.push({ x: 2, y: 1, z: 6, block: "crafting_table" });
    blocks.push({ x: 7, y: 1, z: 2, block: "chest" });
    blocks.push({ x: 1, y: 2, z: 1, block: "torch" });
    blocks.push({ x: 9, y: 2, z: 1, block: "torch" });

    return blocks;
  }

  getCottageMaterials() {
    return {
      "oak_planks": 200,
      "cobblestone": 150,
      "oak_stairs": 80,
      "glass_pane": 6,
      "oak_door": 1,
      "stone_bricks": 12,
      "campfire": 1,
      "bed": 1,
      "crafting_table": 1,
      "chest": 1,
      "torch": 8
    };
  }

  // MODERN HOUSE BLUEPRINT
  generateModernHouseBlueprint() {
    const blocks = [];

    // Concrete foundation
    for (let x = 0; x < 15; x++) {
      for (let z = 0; z < 12; z++) {
        blocks.push({ x, y: 0, z, block: "white_concrete" });
      }
    }

    // Walls (white concrete and glass)
    for (let y = 1; y <= 5; y++) {
      for (let x = 0; x < 15; x++) {
        for (let z = 0; z < 12; z++) {
          if (x === 0 || x === 14 || z === 0 || z === 11) {
            // Large glass windows
            if (y >= 2 && y <= 4 && (x % 3 === 0 || z % 3 === 0)) {
              blocks.push({ x, y, z, block: "glass" });
            }
            // Door
            else if (y === 1 && x === 7 && z === 0) {
              blocks.push({ x, y, z, block: "iron_door" });
            } else {
              blocks.push({ x, y, z, block: "white_concrete" });
            }
          }
        }
      }
    }

    // Flat roof
    for (let x = 0; x < 15; x++) {
      for (let z = 0; z < 12; z++) {
        blocks.push({ x, y: 6, z, block: "white_concrete" });
      }
    }

    // Modern interior
    blocks.push({ x: 2, y: 1, z: 2, block: "crafting_table" });
    blocks.push({ x: 12, y: 1, z: 9, block: "bed" });
    blocks.push({ x: 10, y: 1, z: 2, block: "chest" });

    // Modern lighting
    for (let x = 3; x < 15; x += 4) {
      for (let z = 3; z < 12; z += 4) {
        blocks.push({ x, y: 5, z, block: "glowstone" });
      }
    }

    return blocks;
  }

  getModernHouseMaterials() {
    return {
      "white_concrete": 500,
      "glass": 80,
      "iron_door": 1,
      "glowstone": 12,
      "crafting_table": 1,
      "bed": 1,
      "chest": 3
    };
  }

  // MEDIEVAL HOUSE BLUEPRINT
  generateMedievalHouseBlueprint() {
    const blocks = [];

    // Stone foundation
    for (let x = 0; x < 9; x++) {
      for (let z = 0; z < 9; z++) {
        blocks.push({ x, y: 0, z, block: "cobblestone" });
      }
    }

    // Stone and wood frame walls
    for (let y = 1; y <= 6; y++) {
      for (let x = 0; x < 9; x++) {
        for (let z = 0; z < 9; z++) {
          if (x === 0 || x === 8 || z === 0 || z === 8) {
            // Wood frame every 2 blocks
            if (x % 2 === 0 || z % 2 === 0) {
              blocks.push({ x, y, z, block: "oak_log" });
            } else if (y === 2 && (x === 4 || z === 4)) {
              blocks.push({ x, y, z, block: "glass_pane" });
            } else if (y === 1 && x === 4 && z === 0) {
              blocks.push({ x, y, z, block: "oak_door" });
            } else {
              blocks.push({ x, y, z, block: "cobblestone" });
            }
          }
        }
      }
    }

    // Pointed roof (stairs)
    for (let y = 7; y <= 8; y++) {
      const size = 9 - (y - 6) * 2;
      const offset = (y - 6);

      for (let x = offset; x < offset + size; x++) {
        for (let z = offset; z < offset + size; z++) {
          blocks.push({ x, y, z, block: "stone_brick_stairs" });
        }
      }
    }

    return blocks;
  }

  getMedievalHouseMaterials() {
    return {
      "cobblestone": 200,
      "oak_log": 80,
      "oak_door": 1,
      "glass_pane": 8,
      "stone_brick_stairs": 40
    };
  }

  // AUTOMATED CROP FARM (with redstone)
  generateAutomatedCropFarmBlueprint() {
    const blocks = [];

    // Water channels and farmland
    for (let x = 0; x < 17; x++) {
      for (let z = 0; z < 17; z++) {
        if (x % 4 === 0 || z % 4 === 0) {
          // Water channels
          blocks.push({ x, y: 0, z, block: "water" });
        } else {
          // Farmland
          blocks.push({ x, y: 0, z, block: "farmland" });
        }
      }
    }

    // Fence perimeter
    for (let x = 0; x < 17; x++) {
      blocks.push({ x, y: 1, z: 0, block: "oak_fence" });
      blocks.push({ x, y: 1, z: 16, block: "oak_fence" });
    }
    for (let z = 1; z < 16; z++) {
      blocks.push({ x: 0, y: 1, z, block: "oak_fence" });
      blocks.push({ x: 16, y: 1, z, block: "oak_fence" });
    }

    // Lighting (prevents mob spawns)
    for (let x = 4; x < 17; x += 4) {
      for (let z = 4; z < 17; z += 4) {
        blocks.push({ x, y: 4, z, block: "torch" });
      }
    }

    return blocks;
  }

  getAutomatedFarmMaterials() {
    return {
      "water_bucket": 20,
      "dirt": 200,
      "hoe": 1,
      "oak_fence": 60,
      "torch": 16
    };
  }

  // ENCHANTING ROOM
  generateEnchantingRoomBlueprint() {
    const blocks = [];

    // Floor
    for (let x = 0; x < 9; x++) {
      for (let z = 0; z < 9; z++) {
        blocks.push({ x, y: 0, z, block: "dark_oak_planks" });
      }
    }

    // Walls
    for (let y = 1; y <= 4; y++) {
      for (let x = 0; x < 9; x++) {
        for (let z = 0; z < 9; z++) {
          if (x === 0 || x === 8 || z === 0 || z === 8) {
            blocks.push({ x, y, z, block: "stone_bricks" });
          }
        }
      }
    }

    // Enchanting table in center
    blocks.push({ x: 4, y: 1, z: 4, block: "enchanting_table" });

    // Bookshelves in proper layout (15 for max level)
    const bookshelfPositions = [
      // First ring
      { x: 2, y: 1, z: 2 }, { x: 3, y: 1, z: 2 }, { x: 4, y: 1, z: 2 }, { x: 5, y: 1, z: 2 }, { x: 6, y: 1, z: 2 },
      { x: 2, y: 1, z: 6 }, { x: 3, y: 1, z: 6 }, { x: 4, y: 1, z: 6 }, { x: 5, y: 1, z: 6 }, { x: 6, y: 1, z: 6 },
      { x: 2, y: 1, z: 3 }, { x: 2, y: 1, z: 5 },
      { x: 6, y: 1, z: 3 }, { x: 6, y: 1, z: 5 },
      // Second layer
      { x: 4, y: 2, z: 2 }
    ];

    bookshelfPositions.forEach(pos => {
      blocks.push({ ...pos, block: "bookshelf" });
    });

    return blocks;
  }

  getEnchantingRoomMaterials() {
    return {
      "dark_oak_planks": 81,
      "stone_bricks": 100,
      "enchanting_table": 1,
      "bookshelf": 15
    };
  }

  // LIGHTHOUSE
  generateLighthouseBlueprint() {
    const blocks = [];

    // Base (wider)
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        blocks.push({ x, y: 0, z, block: "stone_bricks" });
      }
    }

    // Tower (tapered)
    for (let y = 1; y <= 15; y++) {
      const size = 7 - Math.floor(y / 5);
      const offset = Math.floor((7 - size) / 2);

      for (let x = offset; x < offset + size; x++) {
        for (let z = offset; z < offset + size; z++) {
          if (x === offset || x === offset + size - 1 || z === offset || z === offset + size - 1) {
            // Alternating stripes
            const block = (y % 4 < 2) ? "white_concrete" : "red_concrete";
            blocks.push({ x, y, z, block });
          }
        }
      }
    }

    // Top beacon light
    blocks.push({ x: 3, y: 16, z: 3, block: "glowstone" });
    blocks.push({ x: 3, y: 17, z: 3, block: "beacon" });

    // Ladder inside
    for (let y = 1; y < 18; y++) {
      blocks.push({ x: 3, y, z: 3, block: "ladder" });
    }

    return blocks;
  }

  getLighthouseMaterials() {
    return {
      "stone_bricks": 50,
      "white_concrete": 100,
      "red_concrete": 100,
      "glowstone": 1,
      "beacon": 1,
      "ladder": 17
    };
  }

  // FOUNTAIN
  generateFountainBlueprint() {
    const blocks = [];

    // Base pool
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        if (x === 0 || x === 6 || z === 0 || z === 6) {
          blocks.push({ x, y: 0, z, block: "smooth_stone" });
        } else {
          blocks.push({ x, y: 0, z, block: "water" });
        }
      }
    }

    // Center pillar
    for (let y = 1; y <= 3; y++) {
      blocks.push({ x: 3, y, z: 3, block: "smooth_stone" });
    }

    // Water spout
    blocks.push({ x: 3, y: 4, z: 3, block: "water" });

    // Decorative corners
    blocks.push({ x: 1, y: 1, z: 1, block: "sea_lantern" });
    blocks.push({ x: 5, y: 1, z: 1, block: "sea_lantern" });
    blocks.push({ x: 1, y: 1, z: 5, block: "sea_lantern" });
    blocks.push({ x: 5, y: 1, z: 5, block: "sea_lantern" });

    return blocks;
  }

  getFountainMaterials() {
    return {
      "smooth_stone": 40,
      "water_bucket": 10,
      "sea_lantern": 4
    };
  }

  // BRIDGE
  generateBridgeBlueprint() {
    const blocks = [];

    // Main deck
    for (let z = 0; z < 20; z++) {
      for (let x = 0; x < 5; x++) {
        blocks.push({ x, y: 0, z, block: "stone_bricks" });
      }
    }

    // Railings
    for (let z = 0; z < 20; z++) {
      blocks.push({ x: 0, y: 1, z, block: "stone_brick_wall" });
      blocks.push({ x: 4, y: 1, z, block: "stone_brick_wall" });
    }

    // Support pillars every 5 blocks
    for (let z = 5; z < 20; z += 5) {
      for (let y = -3; y < 0; y++) {
        blocks.push({ x: 1, y, z, block: "stone_bricks" });
        blocks.push({ x: 3, y, z, block: "stone_bricks" });
      }
    }

    // Lanterns for lighting
    for (let z = 2; z < 20; z += 4) {
      blocks.push({ x: 0, y: 2, z, block: "lantern" });
      blocks.push({ x: 4, y: 2, z, block: "lantern" });
    }

    return blocks;
  }

  getBridgeMaterials() {
    return {
      "stone_bricks": 150,
      "stone_brick_wall": 40,
      "lantern": 10
    };
  }

  // ANIMAL PEN
  generateAnimalPenBlueprint() {
    const blocks = [];

    // Grass floor
    for (let x = 0; x < 11; x++) {
      for (let z = 0; z < 11; z++) {
        blocks.push({ x, y: 0, z, block: "grass_block" });
      }
    }

    // Fence perimeter
    for (let x = 0; x < 11; x++) {
      blocks.push({ x, y: 1, z: 0, block: "oak_fence" });
      blocks.push({ x, y: 1, z: 10, block: "oak_fence" });
    }
    for (let z = 1; z < 10; z++) {
      blocks.push({ x: 0, y: 1, z, block: "oak_fence" });
      blocks.push({ x: 10, y: 1, z, block: "oak_fence" });
    }

    // Gate
    blocks.push({ x: 5, y: 1, z: 0, block: "oak_fence_gate" });

    // Water trough
    blocks.push({ x: 2, y: 1, z: 2, block: "cauldron" });
    blocks.push({ x: 8, y: 1, z: 8, block: "hay_block" }); // Feeding area

    return blocks;
  }

  getAnimalPenMaterials() {
    return {
      "grass_block": 121,
      "oak_fence": 40,
      "oak_fence_gate": 1,
      "cauldron": 1,
      "hay_block": 4
    };
  }

  // WAREHOUSE
  generateWarehouseBlueprint() {
    const blocks = [];

    // Large storage building with multiple floors

    // Foundation
    for (let x = 0; x < 15; x++) {
      for (let z = 0; z < 15; z++) {
        blocks.push({ x, y: 0, z, block: "stone" });
      }
    }

    // Walls
    for (let y = 1; y <= 5; y++) {
      for (let x = 0; x < 15; x++) {
        for (let z = 0; z < 15; z++) {
          if (x === 0 || x === 14 || z === 0 || z === 14) {
            blocks.push({ x, y, z, block: "stone_bricks" });
          }
        }
      }
    }

    // Chest storage rows
    for (let x = 2; x < 13; x += 2) {
      for (let z = 2; z < 13; z += 3) {
        blocks.push({ x, y: 1, z, block: "chest" });
      }
    }

    return blocks;
  }

  getWarehouseMaterials() {
    return {
      "stone": 225,
      "stone_bricks": 200,
      "chest": 30
    };
  }
}

module.exports = { AdvancedBuildingSystem };
