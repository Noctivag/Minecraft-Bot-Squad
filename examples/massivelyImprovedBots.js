/**
 * Massively Improved Bots Example
 * Demonstriert die neuen erweiterten Features:
 * - Erweiterte Selbstkoordination mit dynamischer Gruppenbildung
 * - Menschliches Verhalten (natürliche Bewegungen, Verzögerungen, Fehler)
 * - Idle-Behavior (Bots haben immer etwas zu tun)
 * - Natürliches Chat-System (kontextbewusste Kommunikation)
 */

const { createEnhancedSquad } = require('../src/agents/enhancedAgent');
const advancedCoordination = require('../src/coordination/advancedCoordination');

async function main() {
  console.log('='.repeat(60));
  console.log('MASSIV VERBESSERTE MINECRAFT BOT SQUAD');
  console.log('='.repeat(60));
  console.log('');
  console.log('Features:');
  console.log('✓ Erweiterte Selbstkoordination mit Gruppenbildung');
  console.log('✓ Menschliches Verhalten (natürliche Bewegungen & Pausen)');
  console.log('✓ Idle-Behavior (Bots sind immer beschäftigt)');
  console.log('✓ Natürliches Chat-System (intelligente Dialoge)');
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Erstelle eine Squad mit 5 verschiedenen Bots
    const squad = await createEnhancedSquad({
      host: 'localhost',
      port: 25565,
      bots: [
        {
          name: 'Alpha',
          capabilities: ['mining', 'building', 'combat', 'scouting']
        },
        {
          name: 'Beta',
          capabilities: ['farming', 'building', 'combat']
        },
        {
          name: 'Gamma',
          capabilities: ['mining', 'combat', 'scouting']
        },
        {
          name: 'Delta',
          capabilities: ['building', 'farming']
        },
        {
          name: 'Epsilon',
          capabilities: ['mining', 'farming', 'combat']
        }
      ],
      staggerDelay: 3000 // 3 Sekunden zwischen jedem Bot
    });

    console.log(`\n✓ ${squad.length} Bots erfolgreich erstellt und gestartet!\n`);

    // Alle Bots starten automatisch das autonome Verhalten und Idle-Activities

    // Demonstriere erweiterte Koordination nach 10 Sekunden
    setTimeout(async () => {
      console.log('\n--- DEMONSTRIERE ERWEITERTE KOORDINATION ---\n');

      // Erstelle eine Mining-Gruppe
      console.log('Erstelle Mining-Gruppe...');
      const miningGroupId = await squad[0].createGroup('coordinated mining expedition', 3);

      if (miningGroupId) {
        console.log(`✓ Mining-Gruppe erstellt: ${miningGroupId}`);

        // Führe Gruppenziel aus
        setTimeout(async () => {
          console.log('Gruppe führt Mining-Mission aus...');
          await squad[0].executeGroupObjective(miningGroupId);
        }, 5000);
      }

      // Erstelle eine Exploration-Gruppe nach 20 Sekunden
      setTimeout(async () => {
        console.log('\nErstelle Exploration-Gruppe...');
        const explorationGroupId = await squad[1].createGroup('group exploration mission', 2);

        if (explorationGroupId) {
          console.log(`✓ Exploration-Gruppe erstellt: ${explorationGroupId}`);

          setTimeout(async () => {
            console.log('Gruppe startet Exploration...');
            await squad[1].executeGroupObjective(explorationGroupId);
          }, 5000);
        }
      }, 20000);

    }, 10000);

    // Status-Updates alle 30 Sekunden
    const statusInterval = setInterval(() => {
      console.log('\n' + '='.repeat(60));
      console.log('STATUS UPDATE');
      console.log('='.repeat(60));

      squad.forEach((bot, index) => {
        const status = bot.getStatus();

        console.log(`\n[${bot.name}]`);
        console.log(`  Position: ${status.position ? `${Math.floor(status.position.x)}, ${Math.floor(status.position.y)}, ${Math.floor(status.position.z)}` : 'N/A'}`);
        console.log(`  Health: ${status.health}/20 | Food: ${status.food}/20`);
        console.log(`  Idle Activity: ${status.idleBehavior.currentActivity || 'None'}`);
        console.log(`  Movement Style: ${status.humanBehavior.movementStyle}`);
        console.log(`  Personality: ${status.chatSystem.personality.type}`);

        if (status.idleBehavior.isActive) {
          console.log(`  → Bot ist aktiv und sucht nach Dingen zu tun`);
        }
      });

      // Koordinations-Status
      const coordStatus = advancedCoordination.getStatus();
      console.log('\n[KOORDINATION]');
      console.log(`  Aktive Gruppen: ${coordStatus.activeGroups}`);
      console.log(`  Offene Hilfe-Anfragen: ${coordStatus.pendingHelpRequests}`);
      console.log(`  Geteilte Ressourcen: ${coordStatus.sharedResources}`);

      console.log('\n' + '='.repeat(60));
    }, 30000);

    // Demonstriere Chat-Interaktionen
    setTimeout(() => {
      console.log('\n--- DEMONSTRIERE CHAT-INTERAKTIONEN ---\n');

      // Bots chatten miteinander
      setTimeout(() => squad[0].bot.chat('Hallo Team!'), 1000);
      setTimeout(() => squad[1].bot.chat('Hey Alpha, wie geht es dir?'), 3000);
      setTimeout(() => squad[0].bot.chat('Mir geht es gut! Lasst uns zusammenarbeiten!'), 5000);
      setTimeout(() => squad[2].bot.chat('Gute Idee! Was sollen wir machen?'), 7000);
    }, 15000);

    // Demonstriere Hilfe-System
    setTimeout(() => {
      console.log('\n--- DEMONSTRIERE HILFE-SYSTEM ---\n');
      console.log('Delta fordert Hilfe an...');

      squad[3].requestHelp('Need help with building', 8);
    }, 25000);

    // Demonstriere Ressourcen-Teilen
    setTimeout(() => {
      if (squad[0].bot.entity?.position) {
        console.log('\n--- DEMONSTRIERE RESSOURCEN-SHARING ---\n');
        console.log('Alpha teilt gefundene Ressource...');

        squad[0].shareResource('diamond_ore', squad[0].bot.entity.position, 3);
      }
    }, 35000);

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n\nShutting down bot squad...');
      clearInterval(statusInterval);

      for (const bot of squad) {
        bot.stopAutonomousMode();

        // Stoppe Idle-Verhalten
        if (bot.idleBehavior) {
          bot.idleBehavior.stop();
        }

        bot.bot.quit();
      }

      console.log('All bots disconnected. Goodbye!');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('\n✓ Bots laufen autonom mit allen neuen Features!');
    console.log('✓ Drücke Ctrl+C zum Beenden\n');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Starte das Beispiel
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { main };
