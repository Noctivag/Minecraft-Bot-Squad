# 📦 Installation Guide - Minecraft Bot Squad

## Installation als ausführbares Programm

### Variante 1: Globale Installation (Empfohlen)

```bash
# 1. Klone das Repository
git clone https://github.com/Noctivag/Minecraft-Bot-Squad.git
cd Minecraft-Bot-Squad

# 2. Installiere Dependencies
npm install

# 3. Installiere das Programm global
npm link
# oder alternativ:
npm install -g .

# 4. Jetzt kannst du 'mcbot-squad' überall verwenden!
mcbot-squad --help
```

### Variante 2: Lokale Installation

```bash
# 1. Klone das Repository
git clone https://github.com/Noctivag/Minecraft-Bot-Squad.git
cd Minecraft-Bot-Squad

# 2. Installiere Dependencies
npm install

# 3. Verwende npm scripts oder node direkt
npm start
# oder
node bin/cli.js --help
```

### Variante 3: NPM Package (wenn veröffentlicht)

```bash
# Installiere direkt von NPM
npm install -g minecraft-bot-squad

# Verwendung
mcbot-squad --help
```

## 🚀 Verwendung des CLI-Tools

Nach der globalen Installation steht dir das `mcbot-squad` Kommando zur Verfügung:

### Schnellstart

```bash
# Starte Web UI mit Standard-Einstellungen
mcbot-squad start

# Starte Web UI auf einem anderen Port
mcbot-squad start --port 8080

# Starte Web UI mit Server-Konfiguration
mcbot-squad start --server play.example.com:25565
```

### Web UI

```bash
# Starte nur die Web UI
mcbot-squad ui

# Mit eigenem Port
mcbot-squad ui --port 3000

# Mit Auto-Start von Bots
mcbot-squad ui --auto-start "Miner,Builder,Farmer"

# Mit eigener Konfigurationsdatei
mcbot-squad ui --config ./my-config.json
```

### Bot Squad

```bash
# Starte einen Bot-Squad
mcbot-squad squad

# Mit Server-Konfiguration
mcbot-squad squad --server localhost:25565

# Mit Backend-Server (für Proxy-Netzwerke)
mcbot-squad squad --server bungeecord.example.com:25565 --backend survival

# Mit Authentifizierung
mcbot-squad squad --auth microsoft

# Mit eigener Anzahl an Bots
mcbot-squad squad --bots 10
```

### Enhanced Squad

```bash
# Starte den massiv verbesserten Bot-Squad mit allen Features
mcbot-squad enhanced

# Mit Server
mcbot-squad enhanced --server localhost:25565

# Mit Backend-Server
mcbot-squad enhanced --server proxy.example.com:25565 --backend survival
```

### Konfiguration

```bash
# Erstelle eine Konfigurationsdatei
mcbot-squad config

# Mit eigenem Pfad
mcbot-squad config --output ./config/bots.json
```

### System-Informationen

```bash
# Zeige System- und Bot-Informationen
mcbot-squad info
```

## 📋 Verfügbare Kommandos

| Kommando | Beschreibung |
|----------|--------------|
| `mcbot-squad start` | Schnellstart mit Standard-Einstellungen |
| `mcbot-squad ui` | Starte Web UI für Bot-Management |
| `mcbot-squad squad` | Starte einen advanced Bot-Squad |
| `mcbot-squad enhanced` | Starte massively enhanced Squad |
| `mcbot-squad config` | Erstelle Konfigurationsdatei |
| `mcbot-squad info` | Zeige System-Informationen |
| `mcbot-squad --help` | Zeige alle Kommandos |
| `mcbot-squad --version` | Zeige Version |

## ⚙️ Konfiguration

### Konfigurationsdatei erstellen

```bash
mcbot-squad config --output ./bot-config.json
```

Die Konfigurationsdatei enthält:

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
  },
  "reconnect": {
    "enabled": true,
    "maxAttempts": -1,
    "baseDelayMs": 1000
  },
  "behavior": {
    "autoRespawn": true,
    "sprintByDefault": false,
    "hideErrors": false
  },
  "logging": {
    "level": "info",
    "logChat": true,
    "logEvents": true
  }
}
```

### Umgebungsvariablen

Du kannst auch Umgebungsvariablen verwenden:

```bash
# Server-Konfiguration
export MC_HOST=localhost
export MC_PORT=25565
export MC_BACKEND_SERVER=survival

# UI-Konfiguration
export UI_PORT=3000
export AUTO_START_BOTS="Miner,Builder,Farmer"

# Starte dann das Programm
mcbot-squad ui
```

## 🔧 Deinstallation

### Globale Installation entfernen

```bash
# Wenn mit npm link installiert
npm unlink minecraft-bot-squad

# Wenn mit npm install -g installiert
npm uninstall -g minecraft-bot-squad
```

## 🐛 Troubleshooting

### "mcbot-squad: command not found"

**Lösung:**
```bash
# Stelle sicher, dass npm global bin in deinem PATH ist
npm config get prefix

# Füge zu deiner .bashrc oder .zshrc hinzu:
export PATH="$PATH:$(npm config get prefix)/bin"

# Oder installiere erneut
npm link
```

### Permission-Fehler beim Installieren

**Lösung:**
```bash
# Verwende sudo (Linux/Mac)
sudo npm link

# Oder ändere npm prefix zu einem Ordner mit Schreibrechten
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### CLI startet nicht

**Lösung:**
```bash
# Überprüfe Node.js Version (mind. 16.0.0 erforderlich)
node --version

# Installiere Dependencies neu
rm -rf node_modules package-lock.json
npm install

# Teste direkt
node bin/cli.js --help
```

## 📖 Weiterführende Dokumentation

- **[README.md](README.md)** - Haupt-Dokumentation
- **[MASSIVELY_ENHANCED.md](MASSIVELY_ENHANCED.md)** - Feature-Dokumentation
- **[QUICKSTART_ENHANCED.md](QUICKSTART_ENHANCED.md)** - Schnellstart-Guide

## 💡 Beispiele

### Beispiel 1: Lokaler Server

```bash
# Starte Web UI für lokalen Server
mcbot-squad start --server localhost:25565 --port 3000

# Öffne Browser: http://localhost:3000
```

### Beispiel 2: Remote Server

```bash
# Starte Squad auf Remote-Server
mcbot-squad squad --server play.example.com:25565 --bots 5
```

### Beispiel 3: Proxy-Netzwerk (BungeeCord/Velocity)

```bash
# Verbinde zu Proxy und join Backend-Server
mcbot-squad squad \
  --server proxy.example.com:25565 \
  --backend survival
```

### Beispiel 4: Mit Konfigurationsdatei

```bash
# 1. Erstelle Config
mcbot-squad config --output ./my-bots.json

# 2. Bearbeite my-bots.json nach deinen Wünschen

# 3. Starte mit Config
mcbot-squad ui --config ./my-bots.json
```

---

**Happy Botting!** 🤖🎮
