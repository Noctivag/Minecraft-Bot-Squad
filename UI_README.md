# 🤖 Bot Management UI

Eine umfassende Web-Oberfläche zur Verwaltung und Überwachung Ihrer Minecraft Bot Squad.

## ✨ Features

### 📊 Dashboard
- **Echtzeit-Statistiken**: Übersicht über alle Bots, aktive Bots, Tasks und Logs
- **Bot-Übersicht**: Schneller Überblick über alle laufenden Bots
- **Aktivitäts-Feed**: Neueste Bot-Aktivitäten in Echtzeit

### 🤖 Bot-Verwaltung
- **Bot-Liste**: Detaillierte Ansicht aller Bots mit Status, Position, Health und Food
- **Bot-Steuerung**: Bots starten, stoppen und überwachen
- **Bot erstellen**: Neue Bots mit individuellen Capabilities hinzufügen
- **Such-Funktion**: Bots schnell finden

### ✅ Task-Tracking
- **Aufgaben-Übersicht**: Alle aktuellen Tasks aller Bots
- **Filter-Optionen**: Nach Bot filtern
- **Status-Anzeige**: Pending, In Progress, Completed

### 📝 Activity Logs
- **Echtzeit-Logs**: Alle Bot-Aktivitäten live verfolgen
- **Filter-Funktion**: Nach Log-Level und Bot filtern
- **Log-Kategorien**: Info, Warning, Error, Chat

### ⚙️ Konfiguration
Umfassende Konfigurationsmöglichkeiten für:
- **Server-Einstellungen**: Host, Port, Version
- **Netzwerk**: Proxy-Server, Backend-Server
- **Authentifizierung**: Offline, Microsoft, Mojang
- **Verhalten**: Auto-Respawn, Sprint-Modus
- **Logging**: Log-Level, Chat-Logs
- **Reconnection**: Auto-Reconnect-Einstellungen

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Konfiguration (Optional)

Erstelle eine `bot-config.json` im Projektverzeichnis:

```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": false
  },
  "network": {
    "isProxy": false,
    "backendServer": null,
    "autoJoinBackend": true
  },
  "authentication": {
    "type": "offline",
    "credentials": {}
  }
}
```

### 3. UI starten

```bash
npm run ui
```

Oder mit Umgebungsvariablen:

```bash
UI_PORT=3000 SERVER_HOST=localhost SERVER_PORT=25565 npm run ui
```

### 4. Browser öffnen

Öffne `http://localhost:3000` in deinem Browser.

## 📖 Verwendung

### Bots hinzufügen

1. Klicke auf den **"+ Add Bot"** Button
2. Gib einen Bot-Namen ein
3. Wähle optional Capabilities (mining, building, farming, combat)
4. Klicke auf **"Create Bot"**

### Bots über die UI verwalten

- **Dashboard**: Übersicht über alle Bots und Aktivitäten
- **Bots**: Detailansicht mit Start/Stop-Buttons
- **Tasks**: Aktuelle Aufgaben aller Bots
- **Logs**: Aktivitäts-Logs in Echtzeit
- **Configuration**: Einstellungen anpassen

### Automatischer Bot-Start

Bots beim Start automatisch starten:

```bash
AUTO_START_BOTS="Bot1,Bot2,Bot3" npm run ui
```

## 🏗️ Architektur

### Backend (Node.js)
- **Express Server**: REST API für Konfiguration und Bot-Management
- **WebSocket Server**: Echtzeit-Updates für UI
- **Bot Manager**: Verwaltet Bot-Lifecycle und Integration

### Frontend (Vanilla JS)
- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **Echtzeit-Updates**: WebSocket-Verbindung für Live-Daten
- **Moderne UI**: Dark Theme mit intuitiver Navigation

## 🔌 API Endpoints

### GET `/api/health`
Gesundheitscheck

### GET `/api/bots`
Liste aller Bots

### GET `/api/bots/:name`
Details zu einem bestimmten Bot

### GET `/api/bots/:name/tasks`
Tasks eines Bots

### POST `/api/bots/:name/start`
Bot starten

### POST `/api/bots/:name/stop`
Bot stoppen

### GET `/api/logs`
Activity Logs abrufen

### GET `/api/config`
Aktuelle Konfiguration abrufen

### POST `/api/config`
Konfiguration aktualisieren

### GET `/api/stats`
Statistiken abrufen

## 🔧 Erweiterte Verwendung

### Programmmatische Integration

```javascript
const { BotManager } = require("./src/ui");
const { ConfigManager } = require("./src/bot/config");

// Konfiguration laden
const config = ConfigManager.loadFromFile("./bot-config.json");

// Bot Manager erstellen
const manager = new BotManager({ config });

// UI initialisieren
await manager.init({ port: 3000 });

// Bots starten
await manager.startBot("Bot1", {
  capabilities: ["mining", "building"]
});

// Bot abrufen
const bot = manager.getBot("Bot1");

// Bot stoppen
await manager.stopBot("Bot1");

// Alle Bots stoppen
await manager.stopAllBots();

// Shutdown
await manager.shutdown();
```

### Custom Bot Integration

```javascript
// Bot manuell registrieren
manager.uiServer.registerBot(yourBot, "CustomBot");

// Bot-Status aktualisieren
manager.uiServer.updateBot("CustomBot", {
  status: "online",
  position: { x: 0, y: 64, z: 0 },
  health: 20,
  food: 20
});

// Tasks aktualisieren
manager.uiServer.updateBotTasks("CustomBot", [
  { name: "Mining", status: "in-progress" },
  { name: "Building", status: "pending" }
]);

// Log hinzufügen
manager.uiServer.addLog({
  botName: "CustomBot",
  level: "info",
  message: "Task completed"
});
```

## 🌐 WebSocket Events

### Client → Server
- `ping`: Keep-alive
- `subscribe`: Bot-Updates abonnieren

### Server → Client
- `init`: Initiale Daten
- `bot_update`: Bot-Status-Update
- `tasks_update`: Task-Update
- `log`: Neuer Log-Eintrag
- `config_updated`: Konfiguration geändert
- `pong`: Keep-alive-Antwort

## 🎨 UI-Anpassung

Die UI kann über CSS-Variablen in `src/ui/public/styles.css` angepasst werden:

```css
:root {
    --primary: #3b82f6;
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    /* ... weitere Variablen */
}
```

## 🔐 Sicherheit

**WICHTIG**: Die UI ist standardmäßig auf `0.0.0.0` gebunden und von überall erreichbar.

Für Produktions-Umgebungen:
- Ändere den Host auf `localhost` oder `127.0.0.1`
- Verwende einen Reverse-Proxy (nginx, Apache)
- Implementiere Authentifizierung
- Verwende HTTPS

## 🐛 Troubleshooting

### UI lädt nicht
- Überprüfe, ob Port 3000 frei ist
- Prüfe die Konsole auf Fehler
- Stelle sicher, dass alle Dependencies installiert sind

### WebSocket verbindet nicht
- Überprüfe die Browser-Konsole
- Stelle sicher, dass der Server läuft
- Prüfe Firewall-Einstellungen

### Bots starten nicht
- Überprüfe die Konfiguration in `bot-config.json`
- Prüfe die Logs im "Logs"-Tab
- Stelle sicher, dass der Minecraft-Server erreichbar ist

## 📝 Umgebungsvariablen

- `UI_PORT`: Port für die UI (Standard: 3000)
- `SERVER_HOST`: Minecraft-Server Host
- `SERVER_PORT`: Minecraft-Server Port
- `AUTO_START_BOTS`: Komma-getrennte Liste von Bot-Namen

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle ein Issue oder Pull Request.

## 📄 Lizenz

MIT
