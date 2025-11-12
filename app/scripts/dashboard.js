const { ipcRenderer } = require('electron');

// State
let settings = null;
let botStatus = null;
let updateInterval = null;

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const startAllBtn = document.getElementById('startAllBtn');
const stopAllBtn = document.getElementById('stopAllBtn');
const serverHost = document.getElementById('serverHost');
const serverStatus = document.getElementById('serverStatus');
const botsActive = document.getElementById('botsActive');
const botGrid = document.getElementById('botGrid');
const logsContent = document.getElementById('logsContent');
const logFilter = document.getElementById('logFilter');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const exportLogsBtn = document.getElementById('exportLogsBtn');

// Initialize
async function init() {
  // Load settings
  settings = await ipcRenderer.invoke('get-settings');
  updateServerInfo();

  // Load bot status
  await updateBotStatus();

  // Setup event listeners
  setupEventListeners();

  // Start auto-update
  startAutoUpdate();

  addLog('info', 'Dashboard initialized. Ready to start bots.');
}

// Setup event listeners
function setupEventListeners() {
  settingsBtn.addEventListener('click', () => {
    ipcRenderer.send('open-settings');
  });

  startAllBtn.addEventListener('click', async () => {
    startAllBtn.disabled = true;
    addLog('info', 'Starting all bots...');

    const result = await ipcRenderer.invoke('start-bots');

    if (result.success) {
      addLog('success', 'All bots started successfully');
      startAllBtn.disabled = true;
      stopAllBtn.disabled = false;
    } else {
      addLog('error', `Failed to start bots: ${result.error}`);
      startAllBtn.disabled = false;
    }
  });

  stopAllBtn.addEventListener('click', async () => {
    stopAllBtn.disabled = true;
    addLog('info', 'Stopping all bots...');

    const result = await ipcRenderer.invoke('stop-bots');

    if (result.success) {
      addLog('success', 'All bots stopped');
      startAllBtn.disabled = false;
      stopAllBtn.disabled = true;
    } else {
      addLog('error', `Failed to stop bots: ${result.error}`);
      stopAllBtn.disabled = false;
    }
  });

  clearLogsBtn.addEventListener('click', async () => {
    const botName = logFilter.value === 'all' ? null : logFilter.value;
    await ipcRenderer.invoke('clear-logs', botName);
    logsContent.innerHTML = '';
    addLog('info', 'Logs cleared');
  });

  exportLogsBtn.addEventListener('click', async () => {
    const botName = logFilter.value === 'all' ? null : logFilter.value;
    const result = await ipcRenderer.invoke('export-logs', botName);

    if (result.success) {
      addLog('success', `Logs exported to ${result.path}`);
    } else {
      addLog('error', `Failed to export logs: ${result.error}`);
    }
  });

  logFilter.addEventListener('change', () => {
    // TODO: Filter logs by selected bot
  });
}

// Update server info
function updateServerInfo() {
  if (!settings) return;

  const { host, port } = settings.server;
  serverHost.textContent = `${host}:${port}`;
}

// Update bot status
async function updateBotStatus() {
  botStatus = await ipcRenderer.invoke('get-bot-status');

  // Update server status
  if (botStatus.running && botStatus.count > 0) {
    serverStatus.textContent = 'Connected';
    serverStatus.className = 'value status-badge online';
  } else {
    serverStatus.textContent = 'Not Connected';
    serverStatus.className = 'value status-badge offline';
  }

  // Update bot count
  const enabledCount = settings.bots.filter(b => b.enabled).length;
  botsActive.textContent = `${botStatus.count} / ${enabledCount}`;

  // Update bot cards
  updateBotCards();

  // Update log filter
  updateLogFilter();
}

// Update bot cards
function updateBotCards() {
  if (!settings) return;

  botGrid.innerHTML = '';

  settings.bots.forEach(botConfig => {
    const botData = botStatus.bots.find(b => b.name === botConfig.name);
    const card = createBotCard(botConfig, botData);
    botGrid.appendChild(card);
  });
}

// Create bot card
function createBotCard(config, data) {
  const card = document.createElement('div');

  const status = data ? data.status : 'offline';
  card.className = `bot-card ${status}`;

  const health = data ? data.health : 0;
  const food = data ? data.food : 0;
  const position = data ? data.position : { x: 0, y: 0, z: 0 };
  const uptime = data ? formatUptime(data.uptime) : '00:00:00';
  const deaths = data ? data.deaths : 0;

  card.innerHTML = `
    <div class="bot-header">
      <div>
        <div class="bot-name">${config.name}</div>
        <div class="bot-role">${config.role}</div>
      </div>
      <div class="status-badge ${status}">${status}</div>
    </div>

    <div class="bot-stats">
      <div class="stat-item">
        <div class="stat-label">Health</div>
        <div class="health-bar">
          <div class="health-fill" style="width: ${(health / 20) * 100}%"></div>
        </div>
        <div class="stat-value">${health.toFixed(1)} / 20</div>
      </div>

      <div class="stat-item">
        <div class="stat-label">Food</div>
        <div class="food-bar">
          <div class="food-fill" style="width: ${(food / 20) * 100}%"></div>
        </div>
        <div class="stat-value">${food.toFixed(1)} / 20</div>
      </div>
    </div>

    <div class="bot-stats">
      <div class="stat-item">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">${uptime}</div>
      </div>

      <div class="stat-item">
        <div class="stat-label">Deaths</div>
        <div class="stat-value">${deaths}</div>
      </div>
    </div>

    <div class="bot-position">
      📍 Position: ${position.x}, ${position.y}, ${position.z}
    </div>

    <div class="bot-controls">
      ${status === 'offline' ?
        `<button class="btn btn-primary btn-small start-bot" data-bot="${config.name}">Start</button>` :
        `<button class="btn btn-danger btn-small stop-bot" data-bot="${config.name}">Stop</button>`
      }
    </div>
  `;

  // Add event listeners for start/stop buttons
  const startBtn = card.querySelector('.start-bot');
  const stopBtn = card.querySelector('.stop-bot');

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      const result = await ipcRenderer.invoke('start-bot', config.name);

      if (result.success) {
        addLog('success', `${config.name} started`, config.name);
      } else {
        addLog('error', `Failed to start ${config.name}: ${result.error}`, config.name);
        startBtn.disabled = false;
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      stopBtn.disabled = true;
      const result = await ipcRenderer.invoke('stop-bot', config.name);

      if (result.success) {
        addLog('success', `${config.name} stopped`, config.name);
      } else {
        addLog('error', `Failed to stop ${config.name}: ${result.error}`, config.name);
        stopBtn.disabled = false;
      }
    });
  }

  return card;
}

// Update log filter dropdown
function updateLogFilter() {
  if (!settings) return;

  const currentValue = logFilter.value;
  logFilter.innerHTML = '<option value="all">All Bots</option>';

  settings.bots.forEach(bot => {
    const option = document.createElement('option');
    option.value = bot.name;
    option.textContent = bot.name;
    logFilter.appendChild(option);
  });

  logFilter.value = currentValue;
}

// Add log entry
function addLog(level, message, bot = null) {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${level}`;

  const time = new Date().toLocaleTimeString();

  entry.innerHTML = `
    <span class="log-time">${time}</span>
    ${bot ? `<span class="log-bot">[${bot}]</span>` : ''}
    <span class="log-message">${message}</span>
  `;

  logsContent.appendChild(entry);
  logsContent.scrollTop = logsContent.scrollHeight;

  // Keep only last 100 log entries
  while (logsContent.children.length > 100) {
    logsContent.removeChild(logsContent.firstChild);
  }
}

// Format uptime
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Start auto-update
function startAutoUpdate() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  updateInterval = setInterval(async () => {
    await updateBotStatus();
  }, 1000);
}

// Listen for IPC events
ipcRenderer.on('settings-loaded', (event, newSettings) => {
  settings = newSettings;
  updateServerInfo();
  updateBotCards();
});

ipcRenderer.on('bot-status', (event, status) => {
  botStatus = status;
  updateBotStatus();
});

ipcRenderer.on('bot-log', (event, log) => {
  addLog(log.level, log.message, log.bot);
});

// Initialize on load
init();
