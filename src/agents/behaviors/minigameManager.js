/**
 * Minigame Manager
 * Detect and play various Minecraft minigames (Bedwars, Skywars, SkyBlock, etc.)
 */

const { logEvent } = require("../../memory/store");

class MinigameManager {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Current minigame
    this.currentGame = null;
    this.gameStartTime = null;

    // Minigame detection patterns
    this.gamePatterns = {
      "bedwars": {
        keywords: ["bed", "bedwars", "generator", "forge", "diamond", "emerald"],
        objectives: ["protect_bed", "destroy_beds", "eliminate_players"],
        teamBased: true
      },
      "skywars": {
        keywords: ["skywars", "chest", "island", "center"],
        objectives: ["eliminate_players", "loot_chests"],
        teamBased: false
      },
      "skyblock": {
        keywords: ["skyblock", "island", "cobblestone", "generator"],
        objectives: ["build", "farm", "mine"],
        teamBased: false
      },
      "the_bridge": {
        keywords: ["bridge", "goal", "score", "pit"],
        objectives: ["score_goals", "eliminate_players"],
        teamBased: true
      },
      "build_battle": {
        keywords: ["build", "theme", "vote", "creative"],
        objectives: ["build_theme", "vote"],
        teamBased: false
      },
      "murder_mystery": {
        keywords: ["murder", "innocent", "detective", "murderer"],
        objectives: ["survive", "find_murderer", "kill_innocents"],
        teamBased: false
      },
      "uhc": {
        keywords: ["uhc", "ultra hardcore", "golden apple", "health"],
        objectives: ["eliminate_players", "survive"],
        teamBased: true
      }
    };

    // Game state
    this.gameState = {
      detected: false,
      gameType: null,
      team: null,
      teammates: [],
      objectives: [],
      score: 0,
      phase: "waiting" // waiting, starting, playing, ending
    };

    // Statistics
    this.stats = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0
    };
  }

  /**
   * Detect current minigame
   */
  detectMinigame() {
    // Check chat messages, scoreboard, tablist for clues
    const messages = this.getRecentChatMessages(20);
    const scoreboard = this.getScoreboardInfo();

    let bestMatch = null;
    let bestScore = 0;

    for (const [gameType, pattern] of Object.entries(this.gamePatterns)) {
      let score = 0;

      // Check keywords in messages
      for (const keyword of pattern.keywords) {
        if (messages.some(msg => msg.toLowerCase().includes(keyword))) {
          score += 10;
        }
      }

      // Check scoreboard
      if (scoreboard) {
        for (const keyword of pattern.keywords) {
          if (scoreboard.toLowerCase().includes(keyword)) {
            score += 15;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = gameType;
      }
    }

    if (bestScore >= 10 && bestMatch !== this.currentGame) {
      this.currentGame = bestMatch;
      this.gameStartTime = Date.now();
      this.gameState.detected = true;
      this.gameState.gameType = bestMatch;

      console.log(`[${this.agentName}] 🎮 Detected minigame: ${bestMatch}`);

      logEvent(this.agentName, "minigame", {
        type: bestMatch,
        confidence: bestScore
      });

      return bestMatch;
    }

    return this.currentGame;
  }

  /**
   * Get recent chat messages
   */
  getRecentChatMessages(count = 10) {
    // This would be populated by chat listeners in actual implementation
    return this.bot.recentMessages || [];
  }

  /**
   * Get scoreboard information
   */
  getScoreboardInfo() {
    try {
      const scoreboard = this.bot.scoreboard;
      if (!scoreboard) return null;

      // Extract scoreboard text
      let text = "";
      for (const [name, item] of Object.entries(scoreboard.itemsMap)) {
        text += item.displayName?.getText() || item.name || "";
      }

      return text;
    } catch (err) {
      return null;
    }
  }

  /**
   * Detect team
   */
  detectTeam() {
    const scoreboard = this.getScoreboardInfo();
    if (!scoreboard) return null;

    // Common team colors
    const teams = ["red", "blue", "green", "yellow", "white", "gray", "pink", "aqua"];

    for (const team of teams) {
      if (scoreboard.toLowerCase().includes(team)) {
        if (this.gameState.team !== team) {
          this.gameState.team = team;
          console.log(`[${this.agentName}] Team: ${team}`);
        }
        return team;
      }
    }

    return null;
  }

  /**
   * Detect teammates
   */
  detectTeammates() {
    const teammates = [];

    // Check nearby players with same team prefix/color
    const nearbyPlayers = Object.values(this.bot.entities).filter(e =>
      e.type === "player" && e.username !== this.bot.username
    );

    // In actual implementation, would check nametag colors, scoreboard teams, etc.
    this.gameState.teammates = teammates;

    return teammates;
  }

  /**
   * Get current objectives
   */
  getCurrentObjectives() {
    if (!this.currentGame) {
      return [];
    }

    const pattern = this.gamePatterns[this.currentGame];
    if (!pattern) {
      return [];
    }

    return pattern.objectives;
  }

  /**
   * Execute minigame strategy
   */
  async executeMinigameStrategy() {
    if (!this.currentGame) {
      this.detectMinigame();
      return false;
    }

    console.log(`[${this.agentName}] Playing ${this.currentGame}...`);

    // Game-specific strategies handled by dedicated systems
    // This manager coordinates overall flow

    return true;
  }

  /**
   * Handle game start
   */
  onGameStart() {
    this.gameState.phase = "playing";
    this.gameStartTime = Date.now();
    this.stats.gamesPlayed++;

    console.log(`[${this.agentName}] 🎮 Game started: ${this.currentGame}`);

    logEvent(this.agentName, "minigame", {
      event: "game_start",
      type: this.currentGame
    });
  }

  /**
   * Handle game end
   */
  onGameEnd(won = false) {
    this.gameState.phase = "ending";

    if (won) {
      this.stats.wins++;
      console.log(`[${this.agentName}] 🏆 Victory in ${this.currentGame}!`);
    } else {
      this.stats.losses++;
      console.log(`[${this.agentName}] 💀 Defeat in ${this.currentGame}`);
    }

    const duration = Date.now() - this.gameStartTime;

    logEvent(this.agentName, "minigame", {
      event: "game_end",
      type: this.currentGame,
      won,
      duration
    });

    // Reset state
    setTimeout(() => {
      this.gameState.phase = "waiting";
      this.currentGame = null;
    }, 5000);
  }

  /**
   * Handle player kill
   */
  onKill(victim) {
    this.stats.kills++;
    console.log(`[${this.agentName}] ⚔️  Eliminated ${victim}`);

    logEvent(this.agentName, "minigame", {
      event: "kill",
      victim
    });
  }

  /**
   * Handle player death
   */
  onDeath(killer = null) {
    this.stats.deaths++;

    if (killer) {
      console.log(`[${this.agentName}] 💀 Eliminated by ${killer}`);
    } else {
      console.log(`[${this.agentName}] 💀 Died`);
    }

    logEvent(this.agentName, "minigame", {
      event: "death",
      killer
    });
  }

  /**
   * Check if in minigame
   */
  isInMinigame() {
    return this.currentGame !== null && this.gameState.phase === "playing";
  }

  /**
   * Get game type
   */
  getGameType() {
    return this.currentGame;
  }

  /**
   * Get team
   */
  getTeam() {
    return this.gameState.team;
  }

  /**
   * Get statistics
   */
  getStats() {
    const winRate = this.stats.gamesPlayed > 0 ?
      ((this.stats.wins / this.stats.gamesPlayed) * 100).toFixed(1) : 0;

    const kd = this.stats.deaths > 0 ?
      (this.stats.kills / this.stats.deaths).toFixed(2) : this.stats.kills;

    return {
      currentGame: this.currentGame,
      gamePhase: this.gameState.phase,
      team: this.gameState.team,
      gamesPlayed: this.stats.gamesPlayed,
      wins: this.stats.wins,
      losses: this.stats.losses,
      winRate: `${winRate}%`,
      kills: this.stats.kills,
      deaths: this.stats.deaths,
      kd
    };
  }

  /**
   * Print game status
   */
  printGameStatus() {
    console.log("\n" + "=".repeat(70));
    console.log("  🎮 MINIGAME STATUS");
    console.log("=".repeat(70));

    if (this.currentGame) {
      console.log(`Game: ${this.currentGame}`);
      console.log(`Phase: ${this.gameState.phase}`);
      console.log(`Team: ${this.gameState.team || "None"}`);
      console.log(`Objectives: ${this.getCurrentObjectives().join(", ")}`);
    } else {
      console.log("No active minigame detected");
    }

    console.log("\nStatistics:");
    const stats = this.getStats();
    console.log(`  Games: ${stats.gamesPlayed} (W: ${stats.wins}, L: ${stats.losses})`);
    console.log(`  Win Rate: ${stats.winRate}`);
    console.log(`  K/D: ${stats.kd} (${stats.kills}/${stats.deaths})`);

    console.log("=".repeat(70) + "\n");
  }
}

module.exports = { MinigameManager };
