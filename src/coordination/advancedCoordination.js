/**
 * Advanced Coordination System
 * Ermöglicht Bots sich selbst besser zu koordinieren mit:
 * - Dynamischer Gruppenbildung
 * - Intelligente Ressourcenverteilung
 * - Automatische Hilfe und Unterstützung
 * - Strategische Planung
 */

const { Vec3 } = require('vec3');

class AdvancedCoordination {
  constructor() {
    this.bots = new Map(); // bot.username -> bot reference
    this.groups = new Map(); // groupId -> { leader, members, objective, state }
    this.sharedResources = new Map(); // resourceType -> { locations, claimedBy }
    this.helpRequests = new Map(); // requestId -> { requester, helpers, reason, completed }
    this.strategicPlans = new Map(); // planId -> { objective, steps, assignedBots, progress }

    this.nextGroupId = 1;
    this.nextPlanId = 1;
    this.nextHelpRequestId = 1;
  }

  /**
   * Registriert einen Bot im Koordinationssystem
   */
  registerBot(bot) {
    this.bots.set(bot.username, {
      bot,
      currentGroup: null,
      assignedPlan: null,
      isHelping: false,
      skillLevel: this.assessSkillLevel(bot),
      reliability: 1.0,
      lastActivity: Date.now()
    });

    console.log(`[AdvancedCoord] ${bot.username} registriert - Skill Level: ${this.assessSkillLevel(bot)}`);
  }

  /**
   * Bewertet das Skill-Level eines Bots basierend auf Ausrüstung und Erfahrung
   */
  assessSkillLevel(bot) {
    let level = 0;

    if (!bot.inventory) return level;

    // Check Tools
    const items = bot.inventory.items();
    const hasDiamondTools = items.some(item => item.name.includes('diamond'));
    const hasIronTools = items.some(item => item.name.includes('iron'));

    if (hasDiamondTools) level += 3;
    else if (hasIronTools) level += 2;
    else level += 1;

    // Check Armor
    if (bot.inventory.slots[5]) level += 1; // Helmet
    if (bot.inventory.slots[6]) level += 1; // Chestplate

    return Math.min(level, 10);
  }

  /**
   * Erstellt eine dynamische Gruppe für ein gemeinsames Ziel
   */
  async createGroup(objective, requiredBots = 2, preferredLeader = null) {
    const groupId = `group_${this.nextGroupId++}`;

    // Finde verfügbare Bots
    const availableBots = Array.from(this.bots.entries())
      .filter(([name, data]) => !data.currentGroup && !data.isHelping)
      .sort((a, b) => b[1].skillLevel - a[1].skillLevel);

    if (availableBots.length < requiredBots) {
      console.log(`[AdvancedCoord] Nicht genug Bots verfügbar für Gruppe (brauche ${requiredBots}, habe ${availableBots.length})`);
      return null;
    }

    // Wähle Leader (höchstes Skill Level)
    const leader = preferredLeader || availableBots[0][0];
    const members = availableBots.slice(0, requiredBots).map(([name]) => name);

    const group = {
      id: groupId,
      leader,
      members,
      objective,
      state: 'forming',
      createdAt: Date.now(),
      meetingPoint: null,
      progress: 0
    };

    this.groups.set(groupId, group);

    // Update Bot-Status
    members.forEach(memberName => {
      const botData = this.bots.get(memberName);
      if (botData) botData.currentGroup = groupId;
    });

    console.log(`[AdvancedCoord] Gruppe ${groupId} erstellt für: ${objective}`);
    console.log(`[AdvancedCoord] Leader: ${leader}, Mitglieder: ${members.join(', ')}`);

    // Bestimme Treffpunkt (Position des Leaders)
    const leaderBot = this.bots.get(leader)?.bot;
    if (leaderBot?.entity?.position) {
      group.meetingPoint = leaderBot.entity.position.clone();
      await this.assembleGroup(groupId);
    }

    return groupId;
  }

  /**
   * Versammelt Gruppenmitglieder am Treffpunkt
   */
  async assembleGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group || !group.meetingPoint) return;

    group.state = 'assembling';

    const leaderBot = this.bots.get(group.leader)?.bot;

    // Sende Nachricht an alle Mitglieder
    for (const memberName of group.members) {
      if (memberName === group.leader) continue;

      const botData = this.bots.get(memberName);
      if (!botData) continue;

      const bot = botData.bot;

      try {
        // Bot zum Treffpunkt bewegen
        if (bot.pathfinder) {
          const goal = new (require('mineflayer-pathfinder').goals.GoalNear)(
            group.meetingPoint.x,
            group.meetingPoint.y,
            group.meetingPoint.z,
            3
          );

          bot.pathfinder.setGoal(goal);

          // Nachricht im Chat
          if (leaderBot) {
            setTimeout(() => {
              bot.chat(`Komme zum Treffpunkt, ${group.leader}!`);
            }, Math.random() * 2000);
          }
        }
      } catch (err) {
        console.log(`[AdvancedCoord] Fehler beim Versammeln von ${memberName}: ${err.message}`);
      }
    }

    // Warte auf Versammlung
    setTimeout(() => {
      group.state = 'active';
      console.log(`[AdvancedCoord] Gruppe ${groupId} versammelt und aktiv`);
    }, 10000);
  }

  /**
   * Koordiniert Gruppenaktivität
   */
  async executeGroupObjective(groupId) {
    const group = this.groups.get(groupId);
    if (!group || group.state !== 'active') return;

    const leaderBot = this.bots.get(group.leader)?.bot;
    if (!leaderBot) return;

    console.log(`[AdvancedCoord] Gruppe ${groupId} führt aus: ${group.objective}`);

    // Basierend auf Objective, verschiedene Strategien
    if (group.objective.includes('mining')) {
      await this.coordinatedMining(group);
    } else if (group.objective.includes('building')) {
      await this.coordinatedBuilding(group);
    } else if (group.objective.includes('defense')) {
      await this.coordinatedDefense(group);
    } else if (group.objective.includes('exploration')) {
      await this.coordinatedExploration(group);
    }
  }

  /**
   * Koordiniertes Mining
   */
  async coordinatedMining(group) {
    const leaderBot = this.bots.get(group.leader)?.bot;
    if (!leaderBot) return;

    // Verteile Mining-Bereiche
    const members = group.members.map(name => this.bots.get(name)?.bot).filter(Boolean);
    const spacing = 5; // Blöcke Abstand zwischen Bots

    members.forEach((bot, index) => {
      if (!bot.entity?.position) return;

      const offset = new Vec3(index * spacing, 0, 0);
      const minePos = group.meetingPoint.plus(offset);

      setTimeout(() => {
        if (Math.random() < 0.3) {
          bot.chat(`Ich nehme Bereich ${index + 1}!`);
        }
      }, Math.random() * 3000);
    });

    console.log(`[AdvancedCoord] ${group.members.length} Bots starten koordiniertes Mining`);
  }

  /**
   * Koordiniertes Bauen
   */
  async coordinatedBuilding(group) {
    const leaderBot = this.bots.get(group.leader)?.bot;
    if (!leaderBot) return;

    // Leader gibt Anweisungen
    setTimeout(() => {
      leaderBot.chat(`Team, lasst uns hier bauen! Jeder übernimmt einen Bereich.`);
    }, 1000);

    // Mitglieder bestätigen
    const members = group.members.filter(name => name !== group.leader);
    members.forEach((name, index) => {
      const bot = this.bots.get(name)?.bot;
      if (!bot) return;

      setTimeout(() => {
        const responses = ['Verstanden!', 'Bin bereit!', 'Auf geht\'s!', 'Okay!'];
        bot.chat(responses[index % responses.length]);
      }, 2000 + index * 1000);
    });

    console.log(`[AdvancedCoord] ${group.members.length} Bots starten koordiniertes Bauen`);
  }

  /**
   * Koordinierte Verteidigung
   */
  async coordinatedDefense(group) {
    const leaderBot = this.bots.get(group.leader)?.bot;
    if (!leaderBot) return;

    leaderBot.chat('Verteidigungsformation! Bleibt zusammen!');

    // Bots formieren sich in defensive Position
    const members = group.members.map(name => this.bots.get(name)?.bot).filter(Boolean);
    const radius = 3;

    members.forEach((bot, index) => {
      const angle = (index / members.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (group.meetingPoint && bot.pathfinder) {
        const goal = new (require('mineflayer-pathfinder').goals.GoalNear)(
          group.meetingPoint.x + x,
          group.meetingPoint.y,
          group.meetingPoint.z + z,
          1
        );
        bot.pathfinder.setGoal(goal);
      }
    });

    console.log(`[AdvancedCoord] ${group.members.length} Bots in Verteidigungsformation`);
  }

  /**
   * Koordinierte Exploration
   */
  async coordinatedExploration(group) {
    const leaderBot = this.bots.get(group.leader)?.bot;
    if (!leaderBot) return;

    leaderBot.chat('Team, lasst uns die Umgebung erkunden!');

    // Bots erkunden in verschiedene Richtungen
    const members = group.members.map(name => this.bots.get(name)?.bot).filter(Boolean);
    const directions = [
      new Vec3(20, 0, 0),
      new Vec3(-20, 0, 0),
      new Vec3(0, 0, 20),
      new Vec3(0, 0, -20),
      new Vec3(15, 0, 15),
      new Vec3(-15, 0, -15)
    ];

    members.forEach((bot, index) => {
      if (!bot.entity?.position) return;

      const direction = directions[index % directions.length];
      const explorePos = bot.entity.position.plus(direction);

      if (bot.pathfinder) {
        const goal = new (require('mineflayer-pathfinder').goals.GoalNear)(
          explorePos.x, explorePos.y, explorePos.z, 2
        );
        bot.pathfinder.setGoal(goal);
      }

      setTimeout(() => {
        bot.chat(`Erkunde Richtung ${['Osten', 'Westen', 'Süden', 'Norden'][index % 4]}`);
      }, 2000 + index * 800);
    });

    console.log(`[AdvancedCoord] ${group.members.length} Bots starten Exploration`);
  }

  /**
   * Hilfe-Anfrage System
   */
  async requestHelp(requesterName, reason, urgency = 5) {
    const requestId = `help_${this.nextHelpRequestId++}`;

    const requesterData = this.bots.get(requesterName);
    if (!requesterData) return null;

    const request = {
      id: requestId,
      requester: requesterName,
      reason,
      urgency,
      position: requesterData.bot.entity?.position?.clone(),
      helpers: [],
      completed: false,
      createdAt: Date.now()
    };

    this.helpRequests.set(requestId, request);

    // Finde Helfer
    const availableBots = Array.from(this.bots.entries())
      .filter(([name, data]) => {
        return name !== requesterName &&
               !data.isHelping &&
               !data.currentGroup;
      })
      .map(([name, data]) => ({
        name,
        data,
        distance: request.position ?
          data.bot.entity?.position?.distanceTo(request.position) || 999 :
          999
      }))
      .sort((a, b) => a.distance - b.distance);

    // Wähle nächsten verfügbaren Bot
    if (availableBots.length > 0) {
      const helper = availableBots[0];
      request.helpers.push(helper.name);

      const helperData = this.bots.get(helper.name);
      if (helperData) {
        helperData.isHelping = true;

        // Bot zum Requester schicken
        const helperBot = helperData.bot;
        if (helperBot && request.position && helperBot.pathfinder) {
          const goal = new (require('mineflayer-pathfinder').goals.GoalNear)(
            request.position.x,
            request.position.y,
            request.position.z,
            3
          );

          helperBot.pathfinder.setGoal(goal);

          setTimeout(() => {
            helperBot.chat(`${requesterName}, ich komme dir zu Hilfe!`);
          }, 500);

          setTimeout(() => {
            requesterData.bot.chat(`Danke, ${helper.name}!`);
          }, 1500);
        }
      }

      console.log(`[AdvancedCoord] ${helper.name} hilft ${requesterName} wegen: ${reason}`);
      return requestId;
    }

    console.log(`[AdvancedCoord] Keine Helfer verfügbar für ${requesterName}`);
    return null;
  }

  /**
   * Schließt eine Hilfe-Anfrage ab
   */
  completeHelpRequest(requestId) {
    const request = this.helpRequests.get(requestId);
    if (!request) return;

    request.completed = true;

    // Befreie Helfer
    request.helpers.forEach(helperName => {
      const helperData = this.bots.get(helperName);
      if (helperData) {
        helperData.isHelping = false;
      }
    });

    console.log(`[AdvancedCoord] Hilfe-Anfrage ${requestId} abgeschlossen`);
  }

  /**
   * Ressourcen-Sharing System
   */
  shareResource(finderName, resourceType, position, amount = 1) {
    const key = `${resourceType}_${position.x}_${position.y}_${position.z}`;

    if (!this.sharedResources.has(key)) {
      this.sharedResources.set(key, {
        type: resourceType,
        position: position.clone(),
        amount,
        finder: finderName,
        claimedBy: [],
        discovered: Date.now()
      });

      // Informiere andere Bots
      const finderBot = this.bots.get(finderName)?.bot;
      if (finderBot && Math.random() < 0.5) {
        setTimeout(() => {
          finderBot.chat(`Habe ${resourceType} gefunden bei ${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}!`);
        }, Math.random() * 2000);
      }

      console.log(`[AdvancedCoord] ${finderName} teilt Ressource: ${resourceType} (${amount}x)`);
      return key;
    }

    return null;
  }

  /**
   * Beansprucht eine geteilte Ressource
   */
  claimResource(resourceKey, claimerName) {
    const resource = this.sharedResources.get(resourceKey);
    if (!resource) return false;

    if (!resource.claimedBy.includes(claimerName)) {
      resource.claimedBy.push(claimerName);
      console.log(`[AdvancedCoord] ${claimerName} beansprucht ${resource.type}`);
      return true;
    }

    return false;
  }

  /**
   * Holt alle verfügbaren Ressourcen
   */
  getAvailableResources(botName) {
    const available = [];

    for (const [key, resource] of this.sharedResources.entries()) {
      // Ressourcen die noch verfügbar sind oder nur von wenigen beansprucht
      if (resource.claimedBy.length < 2) {
        available.push({ key, ...resource });
      }
    }

    return available;
  }

  /**
   * Löst eine Gruppe auf
   */
  disbandGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) return;

    // Befreie alle Mitglieder
    group.members.forEach(memberName => {
      const botData = this.bots.get(memberName);
      if (botData) {
        botData.currentGroup = null;
      }
    });

    this.groups.delete(groupId);
    console.log(`[AdvancedCoord] Gruppe ${groupId} aufgelöst`);
  }

  /**
   * Cleanup alte Daten
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 Minuten

    // Alte Hilfe-Anfragen
    for (const [id, request] of this.helpRequests.entries()) {
      if (request.completed || now - request.createdAt > maxAge) {
        this.helpRequests.delete(id);
      }
    }

    // Alte Ressourcen
    for (const [key, resource] of this.sharedResources.entries()) {
      if (now - resource.discovered > maxAge) {
        this.sharedResources.delete(key);
      }
    }

    // Inaktive Gruppen
    for (const [id, group] of this.groups.entries()) {
      if (now - group.createdAt > maxAge) {
        this.disbandGroup(id);
      }
    }
  }

  /**
   * Status-Report
   */
  getStatus() {
    return {
      totalBots: this.bots.size,
      activeGroups: Array.from(this.groups.values()).filter(g => g.state === 'active').length,
      pendingHelpRequests: Array.from(this.helpRequests.values()).filter(r => !r.completed).length,
      sharedResources: this.sharedResources.size
    };
  }
}

// Singleton-Instanz
const advancedCoordination = new AdvancedCoordination();

// Cleanup alle 5 Minuten
setInterval(() => {
  advancedCoordination.cleanup();
}, 5 * 60 * 1000);

module.exports = advancedCoordination;
