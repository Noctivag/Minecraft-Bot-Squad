const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Automated Farming System - Crops, animals, and resource generation
 */
class FarmingSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.farms = []; // { type, position, size, crops }
    this.harvestQueue = [];
    this.isActive = false;
  }

  /**
   * Create a new crop farm
   */
  async createCropFarm(centerPos, size = 9) {
    console.log(`[${this.agentName}] Creating ${size}x${size} crop farm at (${centerPos.x}, ${centerPos.z})`);

    const farm = {
      id: Date.now(),
      type: "crops",
      center: centerPos,
      size,
      plots: [],
      waterSource: null,
      createdAt: Date.now()
    };

    try {
      // Create farmland in a square pattern
      const halfSize = Math.floor(size / 2);

      // Place water source in center
      const waterPos = centerPos.clone();
      await this.placeWaterSource(waterPos);
      farm.waterSource = waterPos;

      // Create farmland around water
      for (let x = -halfSize; x <= halfSize; x++) {
        for (let z = -halfSize; z <= halfSize; z++) {
          if (x === 0 && z === 0) continue; // Skip water center

          const plotPos = centerPos.offset(x, 0, z);

          // Till the soil
          await this.tillSoil(plotPos);

          farm.plots.push({
            position: plotPos,
            crop: null,
            plantedAt: null,
            growth: 0
          });
        }
      }

      this.farms.push(farm);

      logEvent(this.agentName, "farm_created", {
        type: "crops",
        size,
        plots: farm.plots.length
      });

      console.log(`[${this.agentName}] Farm created with ${farm.plots.length} plots`);
      return farm;

    } catch (err) {
      console.error(`[${this.agentName}] Failed to create farm:`, err.message);
      return null;
    }
  }

  /**
   * Place water source
   */
  async placeWaterSource(position) {
    const bucket = this.bot.inventory.items().find(item =>
      item.name === "water_bucket"
    );

    if (!bucket) {
      console.log(`[${this.agentName}] No water bucket available`);
      return false;
    }

    try {
      await this.bot.equip(bucket, "hand");

      // Dig hole for water
      const block = this.bot.blockAt(position);
      if (block && block.name !== "air") {
        await this.bot.dig(block);
      }

      // Place water
      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      await this.bot.placeBlock(referenceBlock, new (require("minecraft-data")(this.bot.version).vec3)(0, 1, 0));

      return true;
    } catch (err) {
      console.error(`[${this.agentName}] Failed to place water:`, err.message);
      return false;
    }
  }

  /**
   * Till soil for farming
   */
  async tillSoil(position) {
    const hoe = this.bot.inventory.items().find(item =>
      item.name.includes("hoe")
    );

    if (!hoe) {
      console.log(`[${this.agentName}] No hoe available`);
      return false;
    }

    try {
      await this.bot.equip(hoe, "hand");

      const block = this.bot.blockAt(position);
      if (block && (block.name === "grass_block" || block.name === "dirt")) {
        await this.bot.activateBlock(block);
        return true;
      }

      return false;
    } catch (err) {
      console.error(`[${this.agentName}] Failed to till soil:`, err.message);
      return false;
    }
  }

  /**
   * Plant seeds in a farm
   */
  async plantSeeds(farmId, seedType = "wheat_seeds") {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return;

    const seeds = this.bot.inventory.items().find(item => item.name === seedType);
    if (!seeds) {
      console.log(`[${this.agentName}] No ${seedType} available`);
      return;
    }

    let planted = 0;

    for (const plot of farm.plots) {
      if (plot.crop) continue; // Already planted

      try {
        await this.bot.equip(seeds, "hand");

        const block = this.bot.blockAt(plot.position);
        if (block && block.name === "farmland") {
          const referenceBlock = this.bot.blockAt(plot.position.offset(0, -1, 0));
          await this.bot.placeBlock(referenceBlock, new (require("minecraft-data")(this.bot.version).vec3)(0, 1, 0));

          plot.crop = seedType.replace("_seeds", "");
          plot.plantedAt = Date.now();
          plot.growth = 0;

          planted++;
        }

        // Break if out of seeds
        if (!this.bot.inventory.items().find(item => item.name === seedType)) {
          break;
        }

      } catch (err) {
        console.error(`[${this.agentName}] Failed to plant seed:`, err.message);
      }
    }

    recordMetric(this.agentName, "seeds_planted", planted);
    console.log(`[${this.agentName}] Planted ${planted} ${seedType}`);
  }

  /**
   * Harvest mature crops
   */
  async harvestCrops(farmId) {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return;

    let harvested = 0;

    for (const plot of farm.plots) {
      if (!plot.crop) continue;

      try {
        const block = this.bot.blockAt(plot.position.offset(0, 1, 0));

        if (!block) continue;

        // Check if crop is mature (age property varies by crop)
        const isMature = block.metadata >= 7; // Most crops mature at age 7

        if (isMature) {
          await this.bot.dig(block);

          harvested++;
          plot.crop = null;
          plot.plantedAt = null;
          plot.growth = 0;
        }

      } catch (err) {
        console.error(`[${this.agentName}] Failed to harvest:`, err.message);
      }
    }

    if (harvested > 0) {
      recordMetric(this.agentName, "crops_harvested", harvested);
      logEvent(this.agentName, "farming", {
        action: "harvest",
        farmId,
        count: harvested
      });

      console.log(`[${this.agentName}] Harvested ${harvested} crops`);
    }

    return harvested;
  }

  /**
   * Start automated farming loop
   */
  startAutomatedFarming(farmId, cropType = "wheat_seeds", intervalMinutes = 10) {
    if (this.isActive) {
      console.log(`[${this.agentName}] Automated farming already active`);
      return;
    }

    this.isActive = true;
    console.log(`[${this.agentName}] Starting automated farming (${cropType}, check every ${intervalMinutes}m)`);

    const farmLoop = async () => {
      if (!this.isActive) return;

      try {
        // Harvest mature crops
        const harvested = await this.harvestCrops(farmId);

        // Replant if we harvested anything
        if (harvested > 0) {
          await this.plantSeeds(farmId, cropType);
        }

        // Schedule next check
        setTimeout(farmLoop, intervalMinutes * 60 * 1000);

      } catch (err) {
        console.error(`[${this.agentName}] Farming loop error:`, err.message);
        setTimeout(farmLoop, intervalMinutes * 60 * 1000);
      }
    };

    // Start the loop
    farmLoop();
  }

  /**
   * Stop automated farming
   */
  stopAutomatedFarming() {
    this.isActive = false;
    console.log(`[${this.agentName}] Stopped automated farming`);
  }

  /**
   * Breed animals
   */
  async breedAnimals(animalType = "cow", count = 2) {
    console.log(`[${this.agentName}] Attempting to breed ${count} ${animalType}s`);

    // Find nearby animals
    const animals = Object.values(this.bot.entities).filter(entity =>
      entity.name?.toLowerCase() === animalType &&
      this.bot.entity.position.distanceTo(entity.position) < 16
    );

    if (animals.length < 2) {
      console.log(`[${this.agentName}] Not enough ${animalType}s nearby (found ${animals.length})`);
      return 0;
    }

    // Get breeding food
    const breedingFood = this.getBreedingFood(animalType);
    const food = this.bot.inventory.items().find(item => item.name === breedingFood);

    if (!food) {
      console.log(`[${this.agentName}] No ${breedingFood} for breeding`);
      return 0;
    }

    let bred = 0;

    try {
      await this.bot.equip(food, "hand");

      // Feed animals
      for (let i = 0; i < Math.min(count, animals.length); i++) {
        const animal = animals[i];

        // Move close to animal
        const { goals } = require("mineflayer-pathfinder");
        await this.bot.pathfinder.goto(new goals.GoalFollow(animal, 2));

        // Activate (feed) the animal
        await this.bot.activateEntity(animal);

        bred++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      recordMetric(this.agentName, "animals_bred", bred);
      logEvent(this.agentName, "farming", {
        action: "breed",
        animalType,
        count: bred
      });

      console.log(`[${this.agentName}] Bred ${bred} ${animalType}s`);

    } catch (err) {
      console.error(`[${this.agentName}] Breeding failed:`, err.message);
    }

    return bred;
  }

  /**
   * Get breeding food for animal type
   */
  getBreedingFood(animalType) {
    const breedingMap = {
      "cow": "wheat",
      "sheep": "wheat",
      "pig": "carrot",
      "chicken": "wheat_seeds",
      "rabbit": "carrot",
      "horse": "golden_apple",
      "llama": "hay_block"
    };

    return breedingMap[animalType] || "wheat";
  }

  /**
   * Collect animal products (eggs, wool, milk)
   */
  async collectProducts(productType = "egg") {
    console.log(`[${this.agentName}] Collecting ${productType}s`);

    let collected = 0;

    try {
      if (productType === "egg") {
        // Pick up eggs from ground
        const eggs = Object.values(this.bot.entities).filter(entity =>
          entity.name === "item" &&
          entity.metadata[7]?.itemId === this.bot.registry.itemsByName.egg?.id &&
          this.bot.entity.position.distanceTo(entity.position) < 16
        );

        for (const egg of eggs) {
          const { goals } = require("mineflayer-pathfinder");
          await this.bot.pathfinder.goto(new goals.GoalFollow(egg, 1));
          collected++;
        }
      }

      if (productType === "wool") {
        // Shear sheep
        const shears = this.bot.inventory.items().find(item => item.name === "shears");
        if (!shears) {
          console.log(`[${this.agentName}] No shears available`);
          return 0;
        }

        await this.bot.equip(shears, "hand");

        const sheep = Object.values(this.bot.entities).filter(entity =>
          entity.name === "sheep" &&
          this.bot.entity.position.distanceTo(entity.position) < 16
        );

        for (const s of sheep) {
          const { goals } = require("mineflayer-pathfinder");
          await this.bot.pathfinder.goto(new goals.GoalFollow(s, 2));
          await this.bot.activateEntity(s);
          collected++;
        }
      }

      if (productType === "milk") {
        // Milk cows
        const bucket = this.bot.inventory.items().find(item => item.name === "bucket");
        if (!bucket) {
          console.log(`[${this.agentName}] No bucket available`);
          return 0;
        }

        await this.bot.equip(bucket, "hand");

        const cows = Object.values(this.bot.entities).filter(entity =>
          entity.name === "cow" &&
          this.bot.entity.position.distanceTo(entity.position) < 16
        );

        for (const cow of cows) {
          const { goals } = require("mineflayer-pathfinder");
          await this.bot.pathfinder.goto(new goals.GoalFollow(cow, 2));
          await this.bot.activateEntity(cow);
          collected++;
        }
      }

      recordMetric(this.agentName, "products_collected", collected);
      console.log(`[${this.agentName}] Collected ${collected} ${productType}s`);

    } catch (err) {
      console.error(`[${this.agentName}] Product collection failed:`, err.message);
    }

    return collected;
  }

  /**
   * Get farming status
   */
  getStatus() {
    const totalPlots = this.farms.reduce((sum, f) => sum + f.plots.length, 0);
    const plantedPlots = this.farms.reduce((sum, f) =>
      sum + f.plots.filter(p => p.crop).length, 0
    );

    return {
      isActive: this.isActive,
      farms: this.farms.length,
      totalPlots,
      plantedPlots,
      utilization: totalPlots > 0 ? (plantedPlots / totalPlots * 100).toFixed(1) + "%" : "0%"
    };
  }
}

module.exports = { FarmingSystem };
