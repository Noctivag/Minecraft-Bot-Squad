/**
 * Idle Behavior System
 * Sorgt dafür, dass Bots immer etwas Sinnvolles zu tun haben:
 * - Automatische Aktivitätssuche
 * - Exploration und Scouting
 * - Ressourcensuche
 * - Soziale Interaktionen
 * - Wartung und Organisation
 * - Spontane Verhaltensweisen
 */

const { Vec3 } = require('vec3');
const { goals } = require('mineflayer-pathfinder');

class IdleBehavior {
  constructor(bot) {
    this.bot = bot;
    this.isActive = false;
    this.currentActivity = null;
    this.lastActivityChange = Date.now();
    this.activityHistory = [];
    this.maxHistorySize = 20;

    // Präferenzen basierend auf Bot-Fähigkeiten
    this.preferences = this.determinePreferences();

    // Statistiken
    this.stats = {
      explorationCount: 0,
      resourcesFound: 0,
      socialInteractions: 0,
      maintenanceActions: 0,
      totalIdleTime: 0
    };
  }

  /**
   * Bestimmt Aktivitätspräferenzen basierend auf Bot-Fähigkeiten
   */
  determinePreferences() {
    const capabilities = this.bot.capabilities || [];

    return {
      exploration: capabilities.includes('scouting') ? 0.3 : 0.2,
      resourceSearch: capabilities.includes('mining') ? 0.3 : 0.2,
      socializing: 0.15,
      maintenance: 0.15,
      building: capabilities.includes('building') ? 0.2 : 0.1,
      farming: capabilities.includes('farming') ? 0.2 : 0.1
    };
  }

  /**
   * Startet Idle-Verhalten
   */
  async start() {
    if (this.isActive) return;

    this.isActive = true;
    console.log(`[IdleBehavior] ${this.bot.username} startet Idle-Verhalten`);

    this.idleLoop();
  }

  /**
   * Stoppt Idle-Verhalten
   */
  stop() {
    this.isActive = false;
    this.currentActivity = null;
    console.log(`[IdleBehavior] ${this.bot.username} stoppt Idle-Verhalten`);
  }

  /**
   * Hauptschleife für Idle-Aktivitäten
   */
  async idleLoop() {
    while (this.isActive) {
      try {
        const startTime = Date.now();

        // Wähle eine Aktivität
        const activity = this.chooseActivity();

        if (activity) {
          this.currentActivity = activity;
          this.addToHistory(activity);

          console.log(`[IdleBehavior] ${this.bot.username} macht: ${activity}`);

          // Führe Aktivität aus
          await this.executeActivity(activity);

          const duration = Date.now() - startTime;
          this.stats.totalIdleTime += duration;
        }

        // Pause zwischen Aktivitäten
        await this.sleep(2000 + Math.random() * 3000);
      } catch (err) {
        console.log(`[IdleBehavior] ${this.bot.username} Fehler: ${err.message}`);
        await this.sleep(5000);
      }
    }
  }

  /**
   * Wählt eine Aktivität basierend auf Präferenzen und Kontext
   */
  chooseActivity() {
    const activities = [
      { name: 'explore', weight: this.preferences.exploration, condition: () => true },
      { name: 'searchResources', weight: this.preferences.resourceSearch, condition: () => true },
      { name: 'socialize', weight: this.preferences.socializing, condition: () => this.getNearbyBots().length > 0 },
      { name: 'maintenance', weight: this.preferences.maintenance, condition: () => true },
      { name: 'scoutArea', weight: 0.15, condition: () => true },
      { name: 'checkInventory', weight: 0.1, condition: () => true },
      { name: 'lookForChests', weight: 0.15, condition: () => true },
      { name: 'patrolNearby', weight: 0.1, condition: () => true },
      { name: 'collectDrops', weight: 0.12, condition: () => this.getNearbyItems().length > 0 },
      { name: 'watchEnvironment', weight: 0.08, condition: () => true }
    ];

    // Filtere Aktivitäten nach Bedingungen
    const validActivities = activities.filter(a => a.condition());

    // Vermeide Wiederholungen
    const recentActivities = this.activityHistory.slice(-3);
    const availableActivities = validActivities.map(a => {
      const repetitionPenalty = recentActivities.filter(ra => ra === a.name).length * 0.3;
      return {
        ...a,
        adjustedWeight: Math.max(a.weight - repetitionPenalty, 0.01)
      };
    });

    // Gewichtete Zufallsauswahl
    const totalWeight = availableActivities.reduce((sum, a) => sum + a.adjustedWeight, 0);
    let random = Math.random() * totalWeight;

    for (const activity of availableActivities) {
      random -= activity.adjustedWeight;
      if (random <= 0) {
        return activity.name;
      }
    }

    return availableActivities[0]?.name || 'explore';
  }

  /**
   * Führt die gewählte Aktivität aus
   */
  async executeActivity(activity) {
    const activities = {
      explore: () => this.explore(),
      searchResources: () => this.searchResources(),
      socialize: () => this.socialize(),
      maintenance: () => this.performMaintenance(),
      scoutArea: () => this.scoutArea(),
      checkInventory: () => this.checkInventory(),
      lookForChests: () => this.lookForChests(),
      patrolNearby: () => this.patrolNearby(),
      collectDrops: () => this.collectDrops(),
      watchEnvironment: () => this.watchEnvironment()
    };

    const activityFunc = activities[activity];
    if (activityFunc) {
      await activityFunc();
    }
  }

  /**
   * Exploration - Erkundet die Umgebung
   */
  async explore() {
    this.stats.explorationCount++;

    if (!this.bot.entity?.position || !this.bot.pathfinder) return;

    // Wähle zufällige Richtung
    const distance = 15 + Math.random() * 25;
    const angle = Math.random() * Math.PI * 2;

    const targetX = this.bot.entity.position.x + Math.cos(angle) * distance;
    const targetZ = this.bot.entity.position.z + Math.sin(angle) * distance;
    const targetY = this.bot.entity.position.y;

    const goal = new goals.GoalNear(targetX, targetY, targetZ, 2);

    // Gelegentliche Kommentare
    if (Math.random() < 0.2) {
      const comments = [
        'Mal schauen was es hier gibt...',
        'Zeit für eine kleine Erkundungstour',
        'Ich schaue mich mal um',
        'Was gibt es hier zu entdecken?'
      ];
      this.bot.chat(comments[Math.floor(Math.random() * comments.length)]);
    }

    this.bot.pathfinder.setGoal(goal);

    // Warte auf Bewegung oder Timeout
    await this.waitForGoalOrTimeout(10000);
  }

  /**
   * Sucht nach wertvollen Ressourcen in der Nähe
   */
  async searchResources() {
    if (!this.bot.entity?.position) return;

    const valuableBlocks = [
      'diamond_ore', 'deepslate_diamond_ore',
      'iron_ore', 'deepslate_iron_ore',
      'gold_ore', 'deepslate_gold_ore',
      'coal_ore', 'deepslate_coal_ore',
      'emerald_ore', 'deepslate_emerald_ore',
      'lapis_ore', 'deepslate_lapis_ore',
      'chest', 'trapped_chest',
      'crafting_table', 'furnace'
    ];

    const searchRadius = 32;
    const foundBlocks = [];

    try {
      for (const blockName of valuableBlocks) {
        const block = this.bot.findBlock({
          matching: (b) => b.name === blockName,
          maxDistance: searchRadius
        });

        if (block) {
          foundBlocks.push(block);
          this.stats.resourcesFound++;

          // Informiere andere (über advancedCoordination)
          if (Math.random() < 0.4) {
            this.bot.chat(`Interessant, hier ist ${blockName}!`);
          }

          break; // Gehe zu erstem gefundenen Block
        }
      }

      if (foundBlocks.length > 0) {
        const target = foundBlocks[0];

        if (this.bot.pathfinder) {
          const goal = new goals.GoalNear(
            target.position.x,
            target.position.y,
            target.position.z,
            3
          );
          this.bot.pathfinder.setGoal(goal);
          await this.waitForGoalOrTimeout(8000);
        }
      } else {
        // Nichts gefunden, erkunde weiter
        await this.explore();
      }
    } catch (err) {
      // Ignoriere Fehler
    }
  }

  /**
   * Soziale Interaktion mit anderen Bots
   */
  async socialize() {
    this.stats.socialInteractions++;

    const nearbyBots = this.getNearbyBots();

    if (nearbyBots.length === 0) {
      return;
    }

    // Wähle zufälligen Bot
    const targetBot = nearbyBots[Math.floor(Math.random() * nearbyBots.length)];

    // Gehe zu Bot
    if (this.bot.pathfinder) {
      const goal = new goals.GoalNear(
        targetBot.position.x,
        targetBot.position.y,
        targetBot.position.z,
        2
      );

      this.bot.pathfinder.setGoal(goal);
      await this.waitForGoalOrTimeout(8000);
    }

    // Soziale Kommentare
    await this.sleep(1000);

    const greetings = [
      `Hey ${targetBot.username}!`,
      `Hallo ${targetBot.username}, alles klar?`,
      `${targetBot.username}! Wie läuft's?`,
      `Was machst du gerade, ${targetBot.username}?`,
      `${targetBot.username}, brauchst du Hilfe?`
    ];

    if (Math.random() < 0.6) {
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      this.bot.chat(greeting);
    }

    // Bleibe kurz beim anderen Bot
    await this.sleep(2000 + Math.random() * 3000);
  }

  /**
   * Wartungsarbeiten
   */
  async performMaintenance() {
    this.stats.maintenanceActions++;

    const maintenanceTasks = [
      // Inventory organisieren
      async () => {
        if (Math.random() < 0.3) {
          this.bot.chat('Zeit, mein Inventar aufzuräumen');
        }
        await this.sleep(2000);
      },

      // Nach Essen suchen
      async () => {
        const food = this.bot.inventory.items().find(item =>
          item.name.includes('beef') ||
          item.name.includes('pork') ||
          item.name.includes('bread') ||
          item.name.includes('apple')
        );

        if (food && this.bot.food < 18) {
          try {
            await this.bot.equip(food, 'hand');
            await this.bot.consume();
            if (Math.random() < 0.4) {
              this.bot.chat('Mmmh, lecker!');
            }
          } catch (err) {
            // Ignoriere
          }
        }
      },

      // Werkzeuge überprüfen
      async () => {
        if (Math.random() < 0.3) {
          this.bot.chat('Mal sehen, wie meine Werkzeuge aussehen...');
        }
        await this.sleep(1500);
      }
    ];

    const task = maintenanceTasks[Math.floor(Math.random() * maintenanceTasks.length)];
    await task();
  }

  /**
   * Scout die Umgebung nach Gefahren/Chancen
   */
  async scoutArea() {
    if (!this.bot.entity?.position) return;

    // Schaue nach feindlichen Mobs
    const hostileMobs = Object.values(this.bot.entities).filter(entity => {
      if (!entity || !entity.position) return false;

      const dist = entity.position.distanceTo(this.bot.entity.position);
      if (dist > 32) return false;

      const hostileTypes = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
      return hostileTypes.some(type => entity.name?.includes(type));
    });

    if (hostileMobs.length > 0) {
      if (Math.random() < 0.5) {
        this.bot.chat(`Vorsicht, ${hostileMobs.length} feindliche Mobs in der Nähe!`);
      }
    } else {
      // Schaue nach passiven Mobs (Farming-Möglichkeiten)
      const passiveMobs = Object.values(this.bot.entities).filter(entity => {
        if (!entity || !entity.position) return false;

        const dist = entity.position.distanceTo(this.bot.entity.position);
        if (dist > 24) return false;

        const passiveTypes = ['cow', 'sheep', 'pig', 'chicken'];
        return passiveTypes.some(type => entity.name?.includes(type));
      });

      if (passiveMobs.length > 3 && Math.random() < 0.3) {
        this.bot.chat(`Es gibt hier viele Tiere, gut für Farming!`);
      }
    }

    await this.sleep(3000);
  }

  /**
   * Überprüft Inventar
   */
  async checkInventory() {
    if (!this.bot.inventory) return;

    const items = this.bot.inventory.items();

    // Gelegentlich Inventar-Status kommentieren
    if (Math.random() < 0.3) {
      if (items.length > 30) {
        this.bot.chat('Mein Inventar ist ziemlich voll...');
      } else if (items.length < 5) {
        this.bot.chat('Ich sollte mehr Ressourcen sammeln');
      }
    }

    await this.sleep(2000);
  }

  /**
   * Sucht nach Truhen
   */
  async lookForChests() {
    if (!this.bot.entity?.position) return;

    try {
      const chest = this.bot.findBlock({
        matching: (block) => block.name === 'chest' || block.name === 'trapped_chest',
        maxDistance: 32
      });

      if (chest) {
        if (Math.random() < 0.4) {
          this.bot.chat('Eine Truhe! Mal schauen was drin ist...');
        }

        if (this.bot.pathfinder) {
          const goal = new goals.GoalNear(
            chest.position.x,
            chest.position.y,
            chest.position.z,
            2
          );

          this.bot.pathfinder.setGoal(goal);
          await this.waitForGoalOrTimeout(10000);
        }
      }
    } catch (err) {
      // Ignoriere
    }
  }

  /**
   * Patrouilliert in der Nähe
   */
  async patrolNearby() {
    if (!this.bot.entity?.position || !this.bot.pathfinder) return;

    const startPos = this.bot.entity.position.clone();
    const patrolPoints = [];

    // Erstelle 3-4 Patrouillenpunkte im Radius
    const numPoints = 3 + Math.floor(Math.random() * 2);
    const radius = 12;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      patrolPoints.push({
        x: startPos.x + Math.cos(angle) * radius,
        y: startPos.y,
        z: startPos.z + Math.sin(angle) * radius
      });
    }

    if (Math.random() < 0.25) {
      this.bot.chat('Ich mache eine kleine Runde...');
    }

    // Gehe Punkte ab
    for (const point of patrolPoints) {
      if (!this.isActive) break;

      const goal = new goals.GoalNear(point.x, point.y, point.z, 2);
      this.bot.pathfinder.setGoal(goal);

      await this.waitForGoalOrTimeout(8000);
      await this.sleep(1000);
    }
  }

  /**
   * Sammelt Items vom Boden auf
   */
  async collectDrops() {
    const nearbyItems = this.getNearbyItems();

    if (nearbyItems.length === 0) return;

    const target = nearbyItems[0];

    if (Math.random() < 0.3) {
      this.bot.chat('Oh, da liegt etwas!');
    }

    if (this.bot.pathfinder) {
      const goal = new goals.GoalNear(
        target.position.x,
        target.position.y,
        target.position.z,
        1
      );

      this.bot.pathfinder.setGoal(goal);
      await this.waitForGoalOrTimeout(5000);
    }
  }

  /**
   * Beobachtet die Umgebung
   */
  async watchEnvironment() {
    if (!this.bot.entity) return;

    // Schaue in verschiedene Richtungen
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    for (const yaw of directions) {
      if (!this.isActive) break;

      await this.bot.look(yaw, 0, false);
      await this.sleep(1000 + Math.random() * 1500);
    }

    if (Math.random() < 0.15) {
      const comments = [
        'Schöne Aussicht hier',
        'Alles ruhig',
        'Keine Gefahren zu sehen',
        'Friedlich hier'
      ];
      this.bot.chat(comments[Math.floor(Math.random() * comments.length)]);
    }
  }

  /**
   * Hilfsfunktionen
   */

  getNearbyBots() {
    if (!this.bot.entity?.position) return [];

    return Object.values(this.bot.entities).filter(entity => {
      if (!entity || !entity.position || entity.type !== 'player') return false;
      if (entity.username === this.bot.username) return false;

      const dist = entity.position.distanceTo(this.bot.entity.position);
      return dist < 30;
    });
  }

  getNearbyItems() {
    if (!this.bot.entity?.position) return [];

    return Object.values(this.bot.entities).filter(entity => {
      if (!entity || !entity.position || entity.type !== 'object') return false;

      const dist = entity.position.distanceTo(this.bot.entity.position);
      return dist < 16;
    });
  }

  async waitForGoalOrTimeout(timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, timeout);

      const onGoalReached = () => {
        clearTimeout(timer);
        this.bot.pathfinder.removeListener('goal_reached', onGoalReached);
        resolve();
      };

      this.bot.pathfinder.once('goal_reached', onGoalReached);
    });
  }

  addToHistory(activity) {
    this.activityHistory.push(activity);
    if (this.activityHistory.length > this.maxHistorySize) {
      this.activityHistory.shift();
    }
    this.lastActivityChange = Date.now();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Status abrufen
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentActivity: this.currentActivity,
      stats: this.stats,
      recentActivities: this.activityHistory.slice(-5)
    };
  }
}

module.exports = IdleBehavior;
