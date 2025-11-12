const { ipcRenderer } = require('electron');

// State
let settings = null;

// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const closeBtn = document.getElementById('closeBtn');
const settingsStatus = document.getElementById('settingsStatus');

// Tab buttons
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initialize
async function init() {
  // Load settings
  settings = await ipcRenderer.invoke('get-settings');
  loadSettingsToUI();

  // Setup event listeners
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Save button
  saveBtn.addEventListener('click', async () => {
    try {
      saveUIToSettings();
      const success = await ipcRenderer.invoke('save-settings', settings);

      if (success) {
        showStatus('Settings saved successfully!', 'success');
      } else {
        showStatus('Failed to save settings', 'error');
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Reset button
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const success = await ipcRenderer.invoke('reset-settings');

      if (success) {
        settings = await ipcRenderer.invoke('get-settings');
        loadSettingsToUI();
        showStatus('Settings reset to default', 'success');
      } else {
        showStatus('Failed to reset settings', 'error');
      }
    }
  });

  // Close button
  closeBtn.addEventListener('click', () => {
    window.close();
  });
}

// Switch tab
function switchTab(tabName) {
  // Update buttons
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });

  // Update panes
  tabPanes.forEach(pane => {
    pane.classList.remove('active');
  });

  const targetPane = document.getElementById(`${tabName}Tab`);
  if (targetPane) {
    targetPane.classList.add('active');
  }
}

// Load settings to UI
function loadSettingsToUI() {
  if (!settings) return;

  // Server settings
  document.getElementById('serverHost').value = settings.server.host;
  document.getElementById('serverPort').value = settings.server.port;
  document.getElementById('serverVersion').value = settings.server.version;
  document.getElementById('serverAuth').value = settings.server.auth;

  // Bots
  loadBotsToUI();

  // Features
  loadFeaturesToUI();

  // Behavior settings
  document.getElementById('behaviorAutoStart').checked = settings.behavior.autoStart;
  document.getElementById('behaviorReconnect').checked = settings.behavior.reconnectOnDeath;
  document.getElementById('behaviorReconnectDelay').value = settings.behavior.reconnectDelay;
  document.getElementById('behaviorChatMessages').checked = settings.behavior.chatMessages;
  document.getElementById('behaviorCoordination').checked = settings.behavior.coordination;

  // Advanced settings
  document.getElementById('advancedTickRate').value = settings.advanced.tickRate;
  document.getElementById('advancedMaxMemory').value = settings.advanced.maxMemory;
  document.getElementById('advancedPerformanceMode').value = settings.advanced.performanceMode;
  document.getElementById('advancedLogLevel').value = settings.advanced.logLevel;
  document.getElementById('advancedDebug').checked = settings.advanced.debug;
}

// Load bots to UI
function loadBotsToUI() {
  const botsList = document.getElementById('botsList');
  botsList.innerHTML = '';

  settings.bots.forEach((bot, index) => {
    const botDiv = document.createElement('div');
    botDiv.className = 'bot-config';
    botDiv.innerHTML = `
      <div class="bot-config-info">
        <h4>${bot.name}</h4>
        <p>Role: ${bot.role}</p>
      </div>
      <div class="bot-config-controls">
        <label class="checkbox-label">
          <input type="checkbox" class="bot-enabled" data-index="${index}" ${bot.enabled ? 'checked' : ''}>
          <span>Enabled</span>
        </label>
        <input type="text" class="input" style="width: 150px;" placeholder="Bot Name" value="${bot.name}" data-index="${index}" data-field="name">
        <select class="select-input" style="width: 150px;" data-index="${index}" data-field="role">
          <option value="leader" ${bot.role === 'leader' ? 'selected' : ''}>Leader</option>
          <option value="builder" ${bot.role === 'builder' ? 'selected' : ''}>Builder</option>
          <option value="miner" ${bot.role === 'miner' ? 'selected' : ''}>Miner</option>
          <option value="explorer" ${bot.role === 'explorer' ? 'selected' : ''}>Explorer</option>
          <option value="farmer" ${bot.role === 'farmer' ? 'selected' : ''}>Farmer</option>
          <option value="engineer" ${bot.role === 'engineer' ? 'selected' : ''}>Engineer</option>
          <option value="collector" ${bot.role === 'collector' ? 'selected' : ''}>Collector</option>
          <option value="decorator" ${bot.role === 'decorator' ? 'selected' : ''}>Decorator</option>
        </select>
      </div>
    `;
    botsList.appendChild(botDiv);
  });
}

// Load features to UI
function loadFeaturesToUI() {
  const { features } = settings;

  // Combat
  document.getElementById('combatEnabled').checked = features.combat.enabled;
  document.getElementById('combatDifficulty').value = features.combat.difficulty;

  // Defense
  document.getElementById('defenseEnabled').checked = features.defense.enabled;
  document.getElementById('defenseAlert').value = features.defense.alertLevel;

  // Building
  document.getElementById('buildingEnabled').checked = features.building.enabled;
  document.getElementById('buildingAutoExpand').checked = features.building.autoExpand;

  // Mining
  document.getElementById('miningEnabled').checked = features.mining.enabled;
  document.getElementById('miningStripMining').checked = features.mining.stripMining;

  // Storage
  document.getElementById('storageEnabled').checked = features.storage.enabled;
  document.getElementById('storageAutoStock').checked = features.storage.autoStock;

  // Farming
  document.getElementById('farmingEnabled').checked = features.farming.enabled;
  document.getElementById('farmingAutoCrops').checked = features.farming.autoCrops;

  // Redstone
  document.getElementById('redstoneEnabled').checked = features.redstone.enabled;
  document.getElementById('redstoneAutoFarms').checked = features.redstone.autoFarms;

  // Trading
  document.getElementById('tradingEnabled').checked = features.trading.enabled;
  document.getElementById('tradingEmeraldGoal').value = features.trading.emeraldGoal;

  // Exploration
  document.getElementById('explorationEnabled').checked = features.exploration.enabled;
  document.getElementById('explorationRadius').value = features.exploration.radius;

  // Potions
  document.getElementById('potionsEnabled').checked = features.potions.enabled;
  document.getElementById('potionsAutoBrew').checked = features.potions.autoBrew;

  // Achievements
  document.getElementById('achievementsEnabled').checked = features.achievements.enabled;
  document.getElementById('achievementsTrackProgress').checked = features.achievements.trackProgress;

  // Minigames
  document.getElementById('minigamesEnabled').checked = features.minigames.enabled;
  document.getElementById('minigamesAutoDetect').checked = features.minigames.autoDetect;

  // PvP
  document.getElementById('pvpEnabled').checked = features.pvp.enabled;
  document.getElementById('pvpCombatMode').value = features.pvp.combatMode;

  // Bedwars
  document.getElementById('bedwarsEnabled').checked = features.bedwars.enabled;
  document.getElementById('bedwarsStrategy').value = features.bedwars.strategy;
}

// Save UI to settings
function saveUIToSettings() {
  // Server settings
  settings.server.host = document.getElementById('serverHost').value;
  settings.server.port = parseInt(document.getElementById('serverPort').value);
  settings.server.version = document.getElementById('serverVersion').value;
  settings.server.auth = document.getElementById('serverAuth').value;

  // Bots
  const botEnabledCheckboxes = document.querySelectorAll('.bot-enabled');
  const botNameInputs = document.querySelectorAll('[data-field="name"]');
  const botRoleSelects = document.querySelectorAll('[data-field="role"]');

  botEnabledCheckboxes.forEach((checkbox, index) => {
    settings.bots[index].enabled = checkbox.checked;
  });

  botNameInputs.forEach((input, index) => {
    settings.bots[index].name = input.value;
  });

  botRoleSelects.forEach((select, index) => {
    settings.bots[index].role = select.value;
  });

  // Features
  settings.features.combat.enabled = document.getElementById('combatEnabled').checked;
  settings.features.combat.difficulty = document.getElementById('combatDifficulty').value;

  settings.features.defense.enabled = document.getElementById('defenseEnabled').checked;
  settings.features.defense.alertLevel = document.getElementById('defenseAlert').value;

  settings.features.building.enabled = document.getElementById('buildingEnabled').checked;
  settings.features.building.autoExpand = document.getElementById('buildingAutoExpand').checked;

  settings.features.mining.enabled = document.getElementById('miningEnabled').checked;
  settings.features.mining.stripMining = document.getElementById('miningStripMining').checked;

  settings.features.storage.enabled = document.getElementById('storageEnabled').checked;
  settings.features.storage.autoStock = document.getElementById('storageAutoStock').checked;

  settings.features.farming.enabled = document.getElementById('farmingEnabled').checked;
  settings.features.farming.autoCrops = document.getElementById('farmingAutoCrops').checked;

  settings.features.redstone.enabled = document.getElementById('redstoneEnabled').checked;
  settings.features.redstone.autoFarms = document.getElementById('redstoneAutoFarms').checked;

  settings.features.trading.enabled = document.getElementById('tradingEnabled').checked;
  settings.features.trading.emeraldGoal = parseInt(document.getElementById('tradingEmeraldGoal').value);

  settings.features.exploration.enabled = document.getElementById('explorationEnabled').checked;
  settings.features.exploration.radius = parseInt(document.getElementById('explorationRadius').value);

  settings.features.potions.enabled = document.getElementById('potionsEnabled').checked;
  settings.features.potions.autoBrew = document.getElementById('potionsAutoBrew').checked;

  settings.features.achievements.enabled = document.getElementById('achievementsEnabled').checked;
  settings.features.achievements.trackProgress = document.getElementById('achievementsTrackProgress').checked;

  settings.features.minigames.enabled = document.getElementById('minigamesEnabled').checked;
  settings.features.minigames.autoDetect = document.getElementById('minigamesAutoDetect').checked;

  settings.features.pvp.enabled = document.getElementById('pvpEnabled').checked;
  settings.features.pvp.combatMode = document.getElementById('pvpCombatMode').value;

  settings.features.bedwars.enabled = document.getElementById('bedwarsEnabled').checked;
  settings.features.bedwars.strategy = document.getElementById('bedwarsStrategy').value;

  // Behavior settings
  settings.behavior.autoStart = document.getElementById('behaviorAutoStart').checked;
  settings.behavior.reconnectOnDeath = document.getElementById('behaviorReconnect').checked;
  settings.behavior.reconnectDelay = parseInt(document.getElementById('behaviorReconnectDelay').value);
  settings.behavior.chatMessages = document.getElementById('behaviorChatMessages').checked;
  settings.behavior.coordination = document.getElementById('behaviorCoordination').checked;

  // Advanced settings
  settings.advanced.tickRate = parseInt(document.getElementById('advancedTickRate').value);
  settings.advanced.maxMemory = parseInt(document.getElementById('advancedMaxMemory').value);
  settings.advanced.performanceMode = document.getElementById('advancedPerformanceMode').value;
  settings.advanced.logLevel = document.getElementById('advancedLogLevel').value;
  settings.advanced.debug = document.getElementById('advancedDebug').checked;
}

// Show status message
function showStatus(message, type = 'success') {
  settingsStatus.textContent = message;
  settingsStatus.className = `settings-status ${type}`;

  setTimeout(() => {
    settingsStatus.textContent = '';
    settingsStatus.className = 'settings-status';
  }, 3000);
}

// Initialize on load
init();
