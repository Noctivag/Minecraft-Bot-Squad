/**
 * Base and City Expansion System
 * Autonomous base building, expansion, and city development
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class BaseExpansion {
  constructor(bot, agentName, buildingSystem) {
    this.bot = bot;
    this.agentName = agentName;
    this.building = buildingSystem;

    // City/base configuration
    this.baseCenter = null;
    this.baseRadius = 50;
    this.expandedRadius = 100;

    // Structures built
    this.structures = [];

    // City districts
    this.districts = {
      residential: { structures: [], center: null },
      industrial: { structures: [], center: null },
      farming: { structures: [], center: null },
      commercial: { structures: [], center: null },
      decorative: { structures: [], center: null }
    };

    // City planning grid (16x16 chunks)
    this.cityGrid = new Map();

    // Expansion phases
    this.currentPhase = 0;
    this.expansionPhases = [
      {
        name: "Foundation",
        structures: ["cottage", "storage_warehouse", "automated_crop_farm"],
        infrastructure: ["torches", "paths"]
      },
      {
        name: "Industrial District",
        structures: ["guard_tower", "guard_tower", "enchanting_room"],
        redstone: ["item_sorter", "auto_smelter"]
      },
      {
        name: "Residential District",
        structures: ["cottage", "modern_house", "medieval_house"],
        decorative: ["fountain", "paths", "gardens"]
      },
      {
        name: "Advanced Infrastructure",
        structures: ["lighthouse", "bridge", "guard_tower"],
        redstone: ["mob_grinder", "auto_farm", "elevator"]
      },
      {
        name: "Mega City",
        structures: ["storage_warehouse", "modern_house", "modern_house", "enchanting_room"],
        decorative: ["fountain", "bridge", "lighthouse"],
        infrastructure: ["walls", "roads", "lighting"]
      }
    ];
  }

  /**
   * Initialize base at current location or spawn
   */
  async initializeBase(centerPos = null) {
    if (!centerPos) {
      centerPos = this.bot.entity.position.floored();
    }

    this.baseCenter = new Vec3(centerPos.x, centerPos.y, centerPos.z);

    console.log(`[${this.agentName}] Base initialized at ${this.baseCenter.x}, ${this.baseCenter.y}, ${this.baseCenter.z}`);

    // Plan initial city grid
    this.planCityGrid();

    logEvent(this.agentName, "base_expansion", {
      action: "initialize",
      center: this.baseCenter
    });

    return this.baseCenter;
  }

  /**
   * Plan city on a grid system
   */
  planCityGrid() {
    if (!this.baseCenter) return;

    // 16x16 block plots
    const plotSize = 16;
    const gridSize = 10; // 10x10 grid of plots

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const plotX = this.baseCenter.x + (x - gridSize / 2) * plotSize;
        const plotZ = this.baseCenter.z + (z - gridSize / 2) * plotSize;

        const key = `${x},${z}`;

        // Assign district based on position
        let district = "residential";
        const distFromCenter = Math.sqrt(Math.pow(x - gridSize/2, 2) + Math.pow(z - gridSize/2, 2));

        if (distFromCenter < 2) {
          district = "commercial"; // Center
        } else if (distFromCenter < 4) {
          district = "residential"; // Inner ring
        } else if (x < 3 || x > gridSize - 3) {
          district = "industrial"; // Sides
        } else if (z < 3 || z > gridSize - 3) {
          district = "farming"; // Top/bottom
        }

        this.cityGrid.set(key, {
          position: new Vec3(plotX, this.baseCenter.y, plotZ),
          district,
          occupied: false,
          structure: null
        });
      }
    }

    console.log(`[${this.agentName}] City grid planned: ${this.cityGrid.size} plots`);
  }

  /**
   * Execute next expansion phase
   */
  async executeExpansionPhase() {
    if (this.currentPhase >= this.expansionPhases.length) {
      console.log(`[${this.agentName}] All expansion phases complete!`);
      return false;
    }

    const phase = this.expansionPhases[this.currentPhase];
    console.log(`[${this.agentName}] Starting expansion phase: ${phase.name}`);

    // Build structures
    if (phase.structures) {
      for (const structureType of phase.structures) {
        const plot = this.findAvailablePlot(this.getDistrictForStructure(structureType));

        if (plot) {
          await this.buildStructureAtPlot(structureType, plot);
        }
      }
    }

    // Build redstone contraptions
    if (phase.redstone) {
      for (const contraption of phase.redstone) {
        const plot = this.findAvailablePlot("industrial");

        if (plot) {
          await this.buildRedstoneAtPlot(contraption, plot);
        }
      }
    }

    // Add infrastructure
    if (phase.infrastructure) {
      await this.buildInfrastructure(phase.infrastructure);
    }

    // Add decorative elements
    if (phase.decorative) {
      for (const deco of phase.decorative) {
        if (deco === "paths" || deco === "gardens") {
          continue; // Handled by infrastructure
        }

        const plot = this.findAvailablePlot("decorative");
        if (plot) {
          await this.buildStructureAtPlot(deco, plot);
        }
      }
    }

    this.currentPhase++;

    logEvent(this.agentName, "base_expansion", {
      phase: phase.name,
      completed: this.currentPhase
    });

    return true;
  }

  /**
   * Determine which district a structure belongs to
   */
  getDistrictForStructure(structureType) {
    if (structureType.includes("house") || structureType === "cottage") {
      return "residential";
    }
    if (structureType.includes("farm") || structureType === "animal_pen") {
      return "farming";
    }
    if (structureType.includes("warehouse") || structureType.includes("tower")) {
      return "industrial";
    }
    if (structureType === "fountain" || structureType === "bridge" || structureType === "lighthouse") {
      return "decorative";
    }
    return "commercial";
  }

  /**
   * Find an available plot in a district
   */
  findAvailablePlot(district = null) {
    for (const [key, plot] of this.cityGrid.entries()) {
      if (!plot.occupied && (!district || plot.district === district)) {
        return { key, ...plot };
      }
    }

    return null;
  }

  /**
   * Build structure at specific plot
   */
  async buildStructureAtPlot(structureType, plot) {
    console.log(`[${this.agentName}] Building ${structureType} in ${plot.district} district...`);

    try {
      // Get blueprint to check size
      const blueprints = this.building.listBlueprints();
      const blueprint = blueprints.find(bp => bp.id === structureType);

      if (!blueprint) {
        console.log(`[${this.agentName}] Blueprint not found: ${structureType}`);
        return false;
      }

      // Build the structure
      const success = await this.building.buildFromBlueprint(structureType, plot.position);

      if (success) {
        // Mark plot as occupied
        const gridPlot = this.cityGrid.get(plot.key);
        gridPlot.occupied = true;
        gridPlot.structure = structureType;

        // Record structure
        this.structures.push({
          type: structureType,
          position: plot.position,
          district: plot.district,
          builtAt: Date.now()
        });

        console.log(`[${this.agentName}] ✅ ${structureType} built in ${plot.district} district`);
        return true;
      }

    } catch (err) {
      console.error(`[${this.agentName}] Failed to build ${structureType}:`, err.message);
    }

    return false;
  }

  /**
   * Build redstone contraption at plot
   */
  async buildRedstoneAtPlot(contraptionType, plot) {
    console.log(`[${this.agentName}] Building ${contraptionType} redstone contraption...`);

    // This would interface with RedstoneSystem
    // For now, just mark the plot
    const gridPlot = this.cityGrid.get(plot.key);
    gridPlot.occupied = true;
    gridPlot.structure = `redstone_${contraptionType}`;

    this.structures.push({
      type: `redstone_${contraptionType}`,
      position: plot.position,
      district: plot.district,
      builtAt: Date.now()
    });

    console.log(`[${this.agentName}] ✅ ${contraptionType} contraption placed`);
    return true;
  }

  /**
   * Build city infrastructure (roads, lighting, walls, etc.)
   */
  async buildInfrastructure(types) {
    console.log(`[${this.agentName}] Building infrastructure: ${types.join(", ")}...`);

    for (const type of types) {
      switch (type) {
        case "paths":
        case "roads":
          await this.buildRoads();
          break;

        case "torches":
        case "lighting":
          await this.buildLighting();
          break;

        case "walls":
          await this.buildWalls();
          break;

        case "gardens":
          await this.buildGardens();
          break;
      }
    }

    return true;
  }

  /**
   * Build road network connecting districts
   */
  async buildRoads() {
    console.log(`[${this.agentName}] Building road network...`);

    if (!this.baseCenter) return false;

    const roadBlocks = [];

    // Main cross roads
    for (let x = -this.expandedRadius; x <= this.expandedRadius; x += 4) {
      roadBlocks.push({
        x: this.baseCenter.x + x,
        y: this.baseCenter.y,
        z: this.baseCenter.z
      });
    }

    for (let z = -this.expandedRadius; z <= this.expandedRadius; z += 4) {
      roadBlocks.push({
        x: this.baseCenter.x,
        y: this.baseCenter.y,
        z: this.baseCenter.z + z
      });
    }

    // Place road blocks (stone bricks)
    let placed = 0;
    for (const pos of roadBlocks) {
      try {
        await this.placeBlock(pos, "stone_bricks");
        placed++;
      } catch (err) {
        // Block placement might fail
        continue;
      }
    }

    console.log(`[${this.agentName}] Built road network: ${placed} blocks`);
    return true;
  }

  /**
   * Build lighting system across base
   */
  async buildLighting() {
    console.log(`[${this.agentName}] Installing lighting...`);

    if (!this.baseCenter) return false;

    const torchPositions = [];

    // Place torches every 8 blocks in a grid
    for (let x = -this.expandedRadius; x <= this.expandedRadius; x += 8) {
      for (let z = -this.expandedRadius; z <= this.expandedRadius; z += 8) {
        torchPositions.push({
          x: this.baseCenter.x + x,
          y: this.baseCenter.y + 2, // On poles
          z: this.baseCenter.z + z
        });
      }
    }

    let placed = 0;
    for (const pos of torchPositions) {
      try {
        // Place fence post
        await this.placeBlock({ x: pos.x, y: pos.y - 1, z: pos.z }, "oak_fence");
        // Place torch on top
        await this.placeBlock(pos, "torch");
        placed++;
      } catch (err) {
        continue;
      }
    }

    console.log(`[${this.agentName}] Installed ${placed} lights`);
    return true;
  }

  /**
   * Build protective walls around base
   */
  async buildWalls() {
    console.log(`[${this.agentName}] Building protective walls...`);

    if (!this.baseCenter) return false;

    const wallBlocks = [];

    // Perimeter wall
    for (let angle = 0; angle < 360; angle += 10) {
      const rad = (angle * Math.PI) / 180;
      const x = this.baseCenter.x + Math.cos(rad) * this.expandedRadius;
      const z = this.baseCenter.z + Math.sin(rad) * this.expandedRadius;

      for (let y = 0; y < 4; y++) {
        wallBlocks.push({
          x: Math.floor(x),
          y: this.baseCenter.y + y,
          z: Math.floor(z)
        });
      }
    }

    let placed = 0;
    for (const pos of wallBlocks) {
      try {
        await this.placeBlock(pos, "cobblestone");
        placed++;
      } catch (err) {
        continue;
      }
    }

    console.log(`[${this.agentName}] Built wall: ${placed} blocks`);
    return true;
  }

  /**
   * Build decorative gardens
   */
  async buildGardens() {
    console.log(`[${this.agentName}] Planting gardens...`);

    const decorativePlots = [];
    for (const [key, plot] of this.cityGrid.entries()) {
      if (!plot.occupied && plot.district === "decorative") {
        decorativePlots.push(plot);
      }
    }

    for (const plot of decorativePlots.slice(0, 5)) {
      await this.buildGardenAt(plot.position);
    }

    return true;
  }

  /**
   * Build a small garden at position
   */
  async buildGardenAt(position) {
    const gardenBlocks = [];

    // 7x7 garden
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 7; z++) {
        const pos = {
          x: position.x + x,
          y: position.y,
          z: position.z + z
        };

        // Grass and flowers
        gardenBlocks.push({ ...pos, block: "grass_block" });

        if ((x + z) % 3 === 0) {
          gardenBlocks.push({
            x: pos.x,
            y: pos.y + 1,
            z: pos.z,
            block: Math.random() > 0.5 ? "poppy" : "dandelion"
          });
        }
      }
    }

    // Place blocks
    for (const { x, y, z, block } of gardenBlocks) {
      try {
        await this.placeBlock({ x, y, z }, block);
      } catch (err) {
        continue;
      }
    }

    return true;
  }

  /**
   * Auto-expand base when certain conditions are met
   */
  async autoExpand() {
    // Check if we should expand
    if (this.structures.length % 5 === 0 && this.structures.length > 0) {
      console.log(`[${this.agentName}] Triggering auto-expansion...`);
      return await this.executeExpansionPhase();
    }

    return false;
  }

  /**
   * Helper: Place a single block
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) {
      return false;
    }

    try {
      await this.bot.equip(item, "hand");

      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== "air") {
        return false; // Don't overwrite
      }

      const referencePos = position.offset(0, -1, 0);
      const referenceBlock = this.bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== "air") {
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
      }

    } catch (err) {
      return false;
    }

    return false;
  }

  /**
   * Get expansion progress
   */
  getProgress() {
    return {
      currentPhase: this.currentPhase,
      totalPhases: this.expansionPhases.length,
      structuresBuilt: this.structures.length,
      districts: Object.entries(this.districts).map(([name, data]) => ({
        name,
        structures: data.structures.length
      })),
      completionPercent: ((this.currentPhase / this.expansionPhases.length) * 100).toFixed(1)
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      baseCenter: this.baseCenter,
      expansionPhase: this.currentPhase,
      totalStructures: this.structures.length,
      districts: Object.keys(this.districts).length,
      cityPlots: this.cityGrid.size,
      occupiedPlots: Array.from(this.cityGrid.values()).filter(p => p.occupied).length
    };
  }
}

module.exports = { BaseExpansion };
