# Enhanced Features Documentation

Diese Dokumentation beschreibt die neu hinzugefügten erweiterten Features für das Minecraft Bot Squad.

## 🚀 Neue Features

### 1. Server-Netzwerk Unterstützung (Backend Server Join)

Bots können jetzt automatisch auf Backend-Server in Proxy-Netzwerken (BungeeCord/Velocity) joinen.

#### Features:
- Automatischer Join auf Backend-Server nach Proxy-Verbindung
- Konfigurierbare Join-Verzögerung
- Automatische Wiederholungsversuche bei Fehlschlagen
- Server-Wechsel während der Laufzeit
- Erkennung von Server-Switch-Nachrichten

#### Verwendung:

```javascript
const { createEnhancedSquad, AuthType } = require("./src/agents/enhancedAgent");

const squad = await createEnhancedSquad({
  host: "proxy.example.com",
  port: 25565,

  // Backend-Server Konfiguration
  backendServer: "survival",  // Name des Backend-Servers
  autoJoinBackend: true,      // Automatisch joinen

  bots: [
    { name: "Bot1", capabilities: ["mining"] }
  ]
});

// Manueller Server-Wechsel
const bot = squad[0];
await bot.bot.serverNetwork.switchServer("creative");
```

#### Konfigurationsoptionen:

```javascript
{
  backendServer: "servername",    // Backend-Server Name
  autoJoinBackend: true,          // Automatisch joinen
  joinDelay: 2000,                // Verzögerung vor Join (ms)
  maxRetries: 3,                  // Max. Wiederholungsversuche
  retryDelay: 5000               // Verzögerung zwischen Versuchen (ms)
}
```

### 2. Authentifizierungs-System

Unterstützung für verschiedene Authentifizierungsmethoden.

#### Unterstützte Authentifizierungstypen:
- **Offline**: Keine Authentifizierung (Cracked Server)
- **Microsoft**: Microsoft-Konto (erforderlich für die meisten Server)
- **Mojang**: Legacy Mojang-Konto (veraltet)

#### Verwendung:

```javascript
const { AuthType } = require("./src/bot");

// Offline-Modus (Cracked Server)
const squad = await createEnhancedSquad({
  host: "localhost",
  authType: AuthType.OFFLINE,
  bots: [...]
});

// Microsoft-Authentifizierung
const squad = await createEnhancedSquad({
  host: "premium-server.com",
  authType: AuthType.MICROSOFT,
  credentials: {
    authCacheDir: "./auth_cache"  // Cache-Verzeichnis für Auth-Tokens
  },
  bots: [...]
});

// Mojang-Authentifizierung (Legacy)
const squad = await createEnhancedSquad({
  host: "server.com",
  authType: AuthType.MOJANG,
  credentials: {
    password: "your_password"  // Nur für Mojang-Accounts
  },
  bots: [...]
});
```

#### Pro-Bot Authentifizierung:

```javascript
const squad = await createEnhancedSquad({
  host: "server.com",
  bots: [
    {
      name: "Bot1",
      authType: AuthType.OFFLINE,
      capabilities: ["mining"]
    },
    {
      name: "Bot2",
      authType: AuthType.MICROSOFT,
      credentials: { authCacheDir: "./auth_cache_bot2" },
      capabilities: ["building"]
    }
  ]
});
```

### 3. Konfigurations-System

Zentrales Konfigurations-Management für alle Bot-Einstellungen.

#### Features:
- JSON-basierte Konfigurationsdateien
- Environment-Variable-Unterstützung
- Validierung der Konfiguration
- Standard-Werte für alle Optionen

#### Verwendung:

```javascript
const { ConfigManager, loadConfig } = require("./src/bot/config");

// Aus Datei laden
const config = ConfigManager.loadFromFile("./bot-config.json");

// Programmatisch erstellen
const config = new ConfigManager({
  server: {
    host: "play.example.com",
    port: 25565
  },
  network: {
    isProxy: true,
    backendServer: "survival"
  },
  authentication: {
    type: "microsoft",
    credentials: {
      authCacheDir: "./auth_cache"
    }
  }
});

// Bot-Konfiguration erstellen
const botConfig = config.createBotConfig("BotName");

// Validierung
const validation = config.validate();
if (!validation.valid) {
  console.error("Config errors:", validation.errors);
}
```

#### Beispiel-Konfigurationsdatei:

```json
{
  "server": {
    "host": "play.example.com",
    "port": 25565,
    "version": false
  },
  "network": {
    "isProxy": true,
    "backendServer": "survival",
    "autoJoinBackend": true,
    "joinDelay": 2000,
    "maxRetries": 3
  },
  "authentication": {
    "type": "offline",
    "credentials": {}
  },
  "reconnect": {
    "enabled": true,
    "baseDelayMs": 2000,
    "maxDelayMs": 60000,
    "factor": 2,
    "jitter": true,
    "maxAttempts": -1
  },
  "logging": {
    "level": "info",
    "logChat": true,
    "logEvents": true,
    "logFile": "./logs/bot.log"
  }
}
```

### 4. Verbessertes Reconnect-System

Intelligentes Wiederverbindungs-System mit detaillierter Fehlerbehandlung.

#### Features:
- Exponentieller Backoff mit Jitter
- Fehlerklassifizierung (Netzwerk, Auth, Kick, etc.)
- Event-basiertes System
- Statistiken und Monitoring
- Permanente Ban-Erkennung

#### Verwendung:

```javascript
const squad = await createEnhancedSquad({
  host: "server.com",
  reconnectOptions: {
    enabled: true,
    baseDelayMs: 2000,      // Initiale Verzögerung
    maxDelayMs: 60000,      // Maximale Verzögerung
    factor: 2,              // Exponentieller Faktor
    jitter: true,           // Zufällige Verzögerung hinzufügen
    maxAttempts: -1         // -1 = unbegrenzt
  },
  bots: [...]
});

// Event-Handling
const bot = squad[0];
bot.bot.reconnectManager.on("reconnected", (data) => {
  console.log(`${data.botName} reconnected after ${data.attempt} attempts`);
});

bot.bot.reconnectManager.on("authError", (data) => {
  console.error(`Auth error for ${data.botName}:`, data.error);
});

// Statistiken abrufen
const stats = bot.bot.reconnectManager.getStats();
console.log(`Reconnects: ${stats.successfulReconnects}/${stats.totalReconnects}`);

// Manueller Reconnect
bot.bot.reconnectManager.forceReconnect();
```

#### Reconnect Events:
- `connected`: Bot erfolgreich verbunden
- `reconnected`: Bot erfolgreich wieder verbunden
- `reconnectFailed`: Reconnect-Versuch fehlgeschlagen
- `reconnectScheduled`: Reconnect geplant
- `kicked`: Bot wurde gekickt
- `authError`: Authentifizierungsfehler
- `permanentBan`: Permanenter Ban erkannt
- `maxAttemptsReached`: Maximale Versuche erreicht

### 5. Erweitertes Logging-System

Strukturiertes Logging mit verschiedenen Log-Levels und Ausgabe-Optionen.

#### Features:
- Mehrere Log-Levels (DEBUG, INFO, WARN, ERROR)
- Farbige Console-Ausgabe
- Datei-Logging
- Separate Logger pro Bot
- Chat-Logging
- Event-Logging

#### Verwendung:

```javascript
const { createLogger, configureLogging, LogLevel } = require("./src/bot/logger");

// Globale Logging-Konfiguration
configureLogging({
  level: "info",
  logFile: "./logs/bots.log",
  logChat: true,
  logEvents: true,
  useColors: true
});

// Logger für Bot erstellen
const logger = createLogger("BotName");

// Logging
logger.debug("Debug-Nachricht", { extra: "data" });
logger.info("Info-Nachricht");
logger.warn("Warnung");
logger.error("Fehler", { error: err.message });

// Chat-Logging
logger.chat("PlayerName", "Hello from chat!");

// Event-Logging
logger.event("block_broken", { blockType: "stone", position: { x: 10, y: 64, z: 20 } });

// Log-Level ändern
logger.setLevel("debug");

// Child-Logger mit Kontext
const miningLogger = logger.child("Mining");
miningLogger.info("Found diamond!");  // Output: [BotName:Mining] INFO Found diamond!
```

## 📦 Installation

Die neuen Features sind bereits im Projekt integriert. Keine zusätzliche Installation erforderlich.

## 🎯 Vollständiges Beispiel

```javascript
const { createEnhancedSquad, AuthType } = require("./src/agents/enhancedAgent");
const { configureLogging } = require("./src/bot");

// Logging konfigurieren
configureLogging({
  level: "info",
  logFile: "./logs/squad.log",
  logChat: true
});

async function main() {
  const squad = await createEnhancedSquad({
    // Server
    host: "proxy.example.com",
    port: 25565,

    // Backend-Server (Proxy-Netzwerk)
    backendServer: "survival",
    autoJoinBackend: true,

    // Authentifizierung
    authType: AuthType.MICROSOFT,
    credentials: {
      authCacheDir: "./auth_cache"
    },

    // Reconnect
    reconnectOptions: {
      enabled: true,
      baseDelayMs: 2000,
      maxDelayMs: 60000,
      maxAttempts: -1
    },

    // Bots
    bots: [
      {
        name: "Miner",
        capabilities: ["mining", "combat"]
      },
      {
        name: "Builder",
        capabilities: ["building"]
      },
      {
        name: "Farmer",
        capabilities: ["farming"]
      }
    ]
  });

  console.log(`Squad created with ${squad.length} bots`);

  // Event-Handling
  squad.forEach(bot => {
    if (bot.bot.reconnectManager) {
      bot.bot.reconnectManager.on("reconnected", () => {
        console.log(`${bot.name} reconnected successfully`);
      });
    }
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    squad.forEach(bot => {
      bot.stopAutonomousMode();
      bot.bot.reconnectManager?.disable();
      bot.bot.quit();
    });
    process.exit(0);
  });
}

main();
```

## 🔧 Environment-Variablen

Folgende Environment-Variablen werden unterstützt:

```bash
# Server
MC_HOST=play.example.com
MC_PORT=25565

# Backend-Server (für Proxy-Netzwerke)
MC_BACKEND_SERVER=survival

# Bot-spezifische Variablen mit Prefix
BOT_HOST=server.com
BOT_PORT=25565
BOT_BACKEND_SERVER=creative
```

## 📚 Module-Übersicht

### `/src/bot/`
- `authentication.js` - Authentifizierungs-System
- `config.js` - Konfigurations-Management
- `logger.js` - Logging-System
- `reconnect.js` - Verbindungs-Management
- `serverNetwork.js` - Server-Netzwerk-Funktionalität
- `index.js` - Modul-Export

## 🎮 Beispiele

- `examples/advancedSquad.js` - Vollständiges Beispiel mit allen Features
- `examples/nextLevel.js` - Original-Beispiel (kompatibel mit neuen Features)

## 🐛 Fehlerbehandlung

Alle neuen Module bieten umfassende Fehlerbehandlung:

```javascript
try {
  const squad = await createEnhancedSquad(config);
} catch (err) {
  if (err.message.includes("authentication")) {
    console.error("Auth-Fehler:", err);
    // Handle authentication errors
  } else if (err.message.includes("connection")) {
    console.error("Verbindungsfehler:", err);
    // Handle connection errors
  } else {
    console.error("Unbekannter Fehler:", err);
  }
}
```

## 🔄 Migration von alten Versionen

Alte Code ist weiterhin kompatibel. Die neuen Features sind opt-in:

```javascript
// Alter Code funktioniert weiterhin
const squad = await createEnhancedSquad({
  host: "localhost",
  port: 25565,
  bots: [{ name: "Bot1", capabilities: ["mining"] }]
});

// Neue Features können schrittweise hinzugefügt werden
const squad = await createEnhancedSquad({
  host: "localhost",
  port: 25565,
  backendServer: "survival",  // NEU: Backend-Server
  reconnectOptions: { enabled: true },  // NEU: Reconnect
  bots: [{ name: "Bot1", capabilities: ["mining"] }]
});
```

## 📝 Weitere Informationen

Für weitere Informationen siehe:
- [NEXT_LEVEL_FEATURES.md](./NEXT_LEVEL_FEATURES.md) - Original Features
- [README_Version2.md](./README_Version2.md) - Projekt-Übersicht
- Inline-Dokumentation in den Quellcode-Dateien

## 💡 Tipps

1. **Proxy-Netzwerke**: Setze `backendServer` nur, wenn du ein Proxy-Netzwerk verwendest
2. **Microsoft Auth**: Beim ersten Start wird ein Browser-Login angefordert
3. **Logging**: Verwende `logFile` für Produktions-Deployments
4. **Reconnect**: Deaktiviere Reconnect vor dem Beenden mit `reconnectManager.disable()`
5. **Server-Wechsel**: Verwende `bot.serverNetwork.switchServer()` für manuelle Wechsel

## 🤝 Support

Bei Fragen oder Problemen:
1. Überprüfe die Logs
2. Stelle sicher, dass die Konfiguration gültig ist
3. Teste die Verbindung zum Server manuell
4. Überprüfe die Authentifizierungs-Einstellungen
