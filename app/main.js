const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Bot launcher
const BotLauncher = require('./launcher');

let mainWindow = null;
let settingsWindow = null;
let botLauncher = null;

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'bot-settings.json');

// Default settings
const defaultSettings = {
  server: {
    host: 'localhost',
    port: 25565,
    version: '1.20.1',
    auth: 'offline'
  },
  bots: [
    { name: 'Leader', role: 'leader', enabled: true },
    { name: 'Builder', role: 'builder', enabled: true },
    { name: 'Miner', role: 'miner', enabled: true },
    { name: 'Explorer', role: 'explorer', enabled: true },
    { name: 'Farmer', role: 'farmer', enabled: true },
    { name: 'Engineer', role: 'engineer', enabled: true },
    { name: 'Collector', role: 'collector', enabled: true },
    { name: 'Decorator', role: 'decorator', enabled: true }
  ],
  behavior: {
    autoStart: false,
    reconnectOnDeath: true,
    reconnectDelay: 5000,
    chatMessages: true,
    coordination: true
  },
  features: {
    combat: { enabled: true, difficulty: 'normal' },
    building: { enabled: true, autoExpand: true },
    mining: { enabled: true, stripMining: true },
    farming: { enabled: true, autoCrops: true },
    redstone: { enabled: true, autoFarms: true },
    trading: { enabled: true, emeraldGoal: 1000 },
    exploration: { enabled: true, radius: 5000 },
    defense: { enabled: true, alertLevel: 'normal' },
    achievements: { enabled: true, trackProgress: true },
    storage: { enabled: true, autoStock: true },
    potions: { enabled: true, autoBrew: true },
    minigames: { enabled: true, autoDetect: true },
    pvp: { enabled: true, combatMode: 'balanced' },
    bedwars: { enabled: true, strategy: 'balanced' }
  },
  advanced: {
    tickRate: 50,
    maxMemory: 2048,
    debug: false,
    logLevel: 'info',
    performanceMode: 'balanced'
  }
};

// Load settings
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
}

// Save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    title: 'Minecraft Bot Squad',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'views', 'index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create settings window
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Bot Settings',
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  settingsWindow.loadFile(path.join(__dirname, 'views', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// App ready
app.whenReady().then(() => {
  createMainWindow();

  // Initialize bot launcher
  botLauncher = new BotLauncher(loadSettings());

  // Send initial data to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('settings-loaded', loadSettings());
    mainWindow.webContents.send('bot-status', botLauncher.getStatus());
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (botLauncher) {
      botLauncher.stopAll();
    }
    app.quit();
  }
});

// IPC Handlers

// Get settings
ipcMain.handle('get-settings', () => {
  return loadSettings();
});

// Save settings
ipcMain.handle('save-settings', (event, settings) => {
  const success = saveSettings(settings);
  if (success && botLauncher) {
    botLauncher.updateSettings(settings);
  }
  return success;
});

// Reset settings
ipcMain.handle('reset-settings', () => {
  return saveSettings(defaultSettings);
});

// Open settings window
ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

// Start bots
ipcMain.handle('start-bots', async () => {
  if (!botLauncher) {
    return { success: false, error: 'Bot launcher not initialized' };
  }

  try {
    await botLauncher.startAll();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Stop bots
ipcMain.handle('stop-bots', async () => {
  if (!botLauncher) {
    return { success: false, error: 'Bot launcher not initialized' };
  }

  try {
    await botLauncher.stopAll();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Start individual bot
ipcMain.handle('start-bot', async (event, botName) => {
  if (!botLauncher) {
    return { success: false, error: 'Bot launcher not initialized' };
  }

  try {
    await botLauncher.startBot(botName);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Stop individual bot
ipcMain.handle('stop-bot', async (event, botName) => {
  if (!botLauncher) {
    return { success: false, error: 'Bot launcher not initialized' };
  }

  try {
    await botLauncher.stopBot(botName);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get bot status
ipcMain.handle('get-bot-status', () => {
  if (!botLauncher) {
    return { running: false, bots: [] };
  }
  return botLauncher.getStatus();
});

// Get bot logs
ipcMain.handle('get-logs', (event, botName) => {
  if (!botLauncher) {
    return [];
  }
  return botLauncher.getLogs(botName);
});

// Clear logs
ipcMain.handle('clear-logs', (event, botName) => {
  if (!botLauncher) {
    return false;
  }
  return botLauncher.clearLogs(botName);
});

// Export logs
ipcMain.handle('export-logs', async (event, botName) => {
  if (!botLauncher) {
    return { success: false, error: 'Bot launcher not initialized' };
  }

  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Logs',
      defaultPath: `${botName || 'all'}-logs-${Date.now()}.txt`,
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      const logs = botLauncher.getLogs(botName);
      const logText = logs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
      fs.writeFileSync(filePath, logText);
      return { success: true, path: filePath };
    }

    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Status updates from bot launcher
if (botLauncher) {
  botLauncher.on('status-update', (status) => {
    if (mainWindow) {
      mainWindow.webContents.send('bot-status', status);
    }
  });

  botLauncher.on('log', (log) => {
    if (mainWindow) {
      mainWindow.webContents.send('bot-log', log);
    }
  });
}

console.log('Minecraft Bot Squad v3.0 - Desktop Application');
console.log('Settings path:', settingsPath);
