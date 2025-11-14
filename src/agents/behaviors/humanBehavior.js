/**
 * Human Behavior System
 * Macht Bot-Verhalten natürlicher und menschlicher:
 * - Zufällige Verzögerungen
 * - Natürliche Bewegungsmuster
 * - Gelegentliche "Fehler"
 * - Umschauen und Kopfbewegungen
 * - Pausen und Idle-Animationen
 */

const { Vec3 } = require('vec3');

class HumanBehavior {
  constructor(bot) {
    this.bot = bot;
    this.isEnabled = true;

    // Verhaltens-Parameter
    this.reactionTime = { min: 300, max: 1200 }; // ms
    this.pauseChance = 0.15; // 15% Chance für Pause
    this.pauseDuration = { min: 2000, max: 5000 }; // ms
    this.lookAroundChance = 0.25; // 25% Chance umzuschauen
    this.mistakeChance = 0.05; // 5% Chance für "Fehler"

    // State
    this.isPaused = false;
    this.lastAction = Date.now();
    this.lastLookAround = Date.now();
    this.movementStyle = this.randomizeMovementStyle();

    // Statistiken
    this.stats = {
      actionsWithDelay: 0,
      pauses: 0,
      lookArounds: 0,
      mistakes: 0
    };
  }

  /**
   * Randomisiert den Bewegungsstil des Bots
   */
  randomizeMovementStyle() {
    const styles = ['careful', 'normal', 'eager', 'clumsy'];
    const style = styles[Math.floor(Math.random() * styles.length)];

    const modifiers = {
      careful: { speedMod: 0.8, pauseChance: 0.2, mistakeChance: 0.02 },
      normal: { speedMod: 1.0, pauseChance: 0.15, mistakeChance: 0.05 },
      eager: { speedMod: 1.15, pauseChance: 0.08, mistakeChance: 0.08 },
      clumsy: { speedMod: 0.95, pauseChance: 0.12, mistakeChance: 0.12 }
    };

    this.pauseChance = modifiers[style].pauseChance;
    this.mistakeChance = modifiers[style].mistakeChance;

    return style;
  }

  /**
   * Fügt menschliche Verzögerung hinzu
   */
  async addReactionDelay(actionType = 'default') {
    if (!this.isEnabled) return;

    // Verschiedene Reaktionszeiten für verschiedene Aktionen
    const delays = {
      quick: { min: 200, max: 500 },
      default: { min: 300, max: 1200 },
      thinking: { min: 800, max: 2500 },
      slow: { min: 1500, max: 3500 }
    };

    const delayRange = delays[actionType] || delays.default;
    const delay = Math.random() * (delayRange.max - delayRange.min) + delayRange.min;

    this.stats.actionsWithDelay++;
    await this.sleep(delay);
  }

  /**
   * Schaut sich zufällig um (natürliche Kopfbewegungen)
   */
  async lookAround() {
    if (!this.isEnabled || !this.bot.entity) return;

    const now = Date.now();
    if (now - this.lastLookAround < 5000) return; // Nicht zu oft

    if (Math.random() > this.lookAroundChance) return;

    this.lastLookAround = now;
    this.stats.lookArounds++;

    try {
      // Schaue in verschiedene Richtungen
      const directions = [
        { yaw: Math.PI / 4, pitch: 0 },           // Rechts
        { yaw: -Math.PI / 4, pitch: 0 },          // Links
        { yaw: 0, pitch: -Math.PI / 6 },          // Oben
        { yaw: 0, pitch: Math.PI / 8 },           // Unten
        { yaw: Math.PI / 2, pitch: 0 },           // Mehr rechts
        { yaw: -Math.PI / 2, pitch: 0 }           // Mehr links
      ];

      const numLooks = Math.floor(Math.random() * 3) + 2; // 2-4 Blickrichtungen

      for (let i = 0; i < numLooks; i++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const currentYaw = this.bot.entity.yaw;
        const currentPitch = this.bot.entity.pitch;

        await this.bot.look(
          currentYaw + dir.yaw + (Math.random() - 0.5) * 0.3,
          currentPitch + dir.pitch + (Math.random() - 0.5) * 0.2,
          false
        );

        await this.sleep(300 + Math.random() * 500);
      }
    } catch (err) {
      // Ignoriere Look-Fehler
    }
  }

  /**
   * Macht eine zufällige Pause
   */
  async takeRandomPause() {
    if (!this.isEnabled || this.isPaused) return;

    if (Math.random() > this.pauseChance) return;

    this.isPaused = true;
    this.stats.pauses++;

    const duration = Math.random() * (this.pauseDuration.max - this.pauseDuration.min) + this.pauseDuration.min;

    // Während der Pause: umschauen
    const pauseStart = Date.now();
    while (Date.now() - pauseStart < duration) {
      await this.lookAround();
      await this.sleep(1000);
    }

    this.isPaused = false;
  }

  /**
   * Fügt natürliche Variation zu Bewegung hinzu
   */
  async moveWithVariation(goal, pathfinder) {
    if (!this.isEnabled || !pathfinder) {
      pathfinder.setGoal(goal);
      return;
    }

    await this.addReactionDelay('quick');

    // Gelegentlich einen kleinen Umweg nehmen
    if (Math.random() < this.mistakeChance) {
      this.stats.mistakes++;

      // Kleiner "Fehler" - geht kurz in falsche Richtung
      const randomOffset = new Vec3(
        (Math.random() - 0.5) * 4,
        0,
        (Math.random() - 0.5) * 4
      );

      const wrongGoal = new (require('mineflayer-pathfinder').goals.GoalNear)(
        goal.x + randomOffset.x,
        goal.y,
        goal.z + randomOffset.z,
        1
      );

      pathfinder.setGoal(wrongGoal);

      await this.sleep(1000 + Math.random() * 2000);

      // Dann korrigieren
      pathfinder.setGoal(goal);
    } else {
      pathfinder.setGoal(goal);
    }

    // Gelegentlich während der Bewegung umschauen
    if (Math.random() < 0.3) {
      setTimeout(() => this.lookAround(), Math.random() * 3000);
    }
  }

  /**
   * Führt eine Aktion mit menschlichem Verhalten aus
   */
  async performAction(actionFunc, actionType = 'default') {
    if (!this.isEnabled) {
      return await actionFunc();
    }

    // Reaktionsverzögerung
    await this.addReactionDelay(actionType);

    // Gelegentlich umschauen vor der Aktion
    if (Math.random() < 0.2) {
      await this.lookAround();
    }

    // Aktion ausführen
    const result = await actionFunc();

    // Gelegentlich pausieren nach der Aktion
    if (Math.random() < 0.1) {
      await this.takeRandomPause();
    }

    this.lastAction = Date.now();
    return result;
  }

  /**
   * Chattet mit menschlicher Verzögerung
   */
  async chat(message) {
    if (!this.isEnabled) {
      this.bot.chat(message);
      return;
    }

    // Simuliere Tippzeit (50-150ms pro Zeichen)
    const typingTime = message.length * (50 + Math.random() * 100);

    await this.sleep(Math.min(typingTime, 3000)); // Max 3 Sekunden

    this.bot.chat(message);
  }

  /**
   * Blockiert mit menschlicher Variation
   */
  async digBlock(block, pathfinder = null) {
    if (!this.isEnabled) {
      await this.bot.dig(block);
      return;
    }

    return this.performAction(async () => {
      // Schaue zum Block
      await this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));

      // Kleine Pause vor dem Abbauen
      await this.sleep(100 + Math.random() * 300);

      // Gelegentlicher "Fehler" - verfehlt den Block beim ersten Versuch
      if (Math.random() < this.mistakeChance * 0.5) {
        // Schaue kurz woanders hin
        const wrongYaw = this.bot.entity.yaw + (Math.random() - 0.5) * 0.5;
        await this.bot.look(wrongYaw, this.bot.entity.pitch, false);
        await this.sleep(300);

        // Korrigiere
        await this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
      }

      // Abbauen
      await this.bot.dig(block);

      // Kurze Pause nach dem Abbauen
      await this.sleep(50 + Math.random() * 200);
    }, 'quick');
  }

  /**
   * Platziert Block mit menschlicher Variation
   */
  async placeBlock(referenceBlock, faceVector, item) {
    if (!this.isEnabled) {
      await this.bot.equip(item, 'hand');
      await this.bot.placeBlock(referenceBlock, faceVector);
      return;
    }

    return this.performAction(async () => {
      // Equip Item
      await this.bot.equip(item, 'hand');
      await this.sleep(100 + Math.random() * 300);

      // Schaue zum Block
      const targetPos = referenceBlock.position.offset(0.5, 0.5, 0.5);
      await this.bot.lookAt(targetPos);
      await this.sleep(100 + Math.random() * 200);

      // Platziere
      await this.bot.placeBlock(referenceBlock, faceVector);

      // Kurze Pause
      await this.sleep(50 + Math.random() * 150);
    }, 'default');
  }

  /**
   * Interagiert mit Entity (z.B. Truhe öffnen)
   */
  async interactWithEntity(entity) {
    if (!this.isEnabled) {
      await this.bot.openContainer(entity);
      return;
    }

    return this.performAction(async () => {
      // Schaue zur Entity
      await this.bot.lookAt(entity.position.offset(0, entity.height / 2, 0));
      await this.sleep(200 + Math.random() * 400);

      // Interagiere
      await this.bot.openContainer(entity);
    }, 'default');
  }

  /**
   * Greift Entity mit menschlicher Variation an
   */
  async attackEntity(entity) {
    if (!this.isEnabled || !entity) {
      await this.bot.attack(entity);
      return;
    }

    return this.performAction(async () => {
      // Schaue zum Ziel
      await this.bot.lookAt(entity.position.offset(0, entity.height / 2, 0));

      // Kleine Verzögerung vor Angriff
      await this.sleep(50 + Math.random() * 150);

      // Gelegentlich daneben schlagen (5% Chance)
      if (Math.random() < 0.05) {
        this.stats.mistakes++;
        // Swing ohne Treffer
        this.bot.swingArm();
        await this.sleep(100 + Math.random() * 200);
      }

      // Echter Angriff
      await this.bot.attack(entity);

      // Kleine Pause nach Angriff
      await this.sleep(100 + Math.random() * 250);
    }, 'quick');
  }

  /**
   * Spontane menschliche Verhaltensweisen
   */
  async performIdleHumanBehavior() {
    if (!this.isEnabled || this.isPaused) return;

    const behaviors = [
      // Umschauen
      async () => {
        await this.lookAround();
      },

      // Kurz springen
      async () => {
        if (this.bot.entity.onGround) {
          this.bot.setControlState('jump', true);
          await this.sleep(100);
          this.bot.setControlState('jump', false);
        }
      },

      // Kurz die Richtung ändern
      async () => {
        const newYaw = this.bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
        await this.bot.look(newYaw, this.bot.entity.pitch, false);
      },

      // Crouch für einen Moment
      async () => {
        this.bot.setControlState('sneak', true);
        await this.sleep(500 + Math.random() * 1500);
        this.bot.setControlState('sneak', false);
      },

      // Arm schwingen
      async () => {
        this.bot.swingArm();
      }
    ];

    const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];

    try {
      await behavior();
    } catch (err) {
      // Ignoriere Fehler bei Idle-Behaviors
    }
  }

  /**
   * Setzt Parameter zurück
   */
  reset() {
    this.isPaused = false;
    this.lastAction = Date.now();
    this.movementStyle = this.randomizeMovementStyle();
  }

  /**
   * Aktiviert/Deaktiviert menschliches Verhalten
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Statistiken abrufen
   */
  getStats() {
    return {
      ...this.stats,
      movementStyle: this.movementStyle,
      isEnabled: this.isEnabled
    };
  }

  /**
   * Sleep-Hilfsfunktion
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HumanBehavior;
