/**
 * Bot Management UI - Client-side Application
 */

class BotManagerApp {
    constructor() {
        this.ws = null;
        this.bots = new Map();
        this.tasks = new Map();
        this.logs = [];
        this.config = null;
        this.currentView = 'dashboard';

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadData();
        this.startPeriodicUpdates();
    }

    // WebSocket Connection
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus(true);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWSMessage(message);
            } catch (err) {
                console.error('Invalid WebSocket message:', err);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus(false);
            // Reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWSMessage(message) {
        switch (message.type) {
            case 'init':
                if (message.data.bots) {
                    message.data.bots.forEach(bot => {
                        this.bots.set(bot.name, bot);
                    });
                }
                if (message.data.config) {
                    this.config = message.data.config;
                    this.loadConfig();
                }
                this.renderCurrentView();
                break;

            case 'bot_update':
                this.bots.set(message.data.name, message.data);
                this.renderCurrentView();
                break;

            case 'tasks_update':
                this.tasks.set(message.data.botName, message.data.tasks);
                if (this.currentView === 'tasks') {
                    this.renderTasksView();
                }
                break;

            case 'log':
                this.logs.push(message.data);
                if (this.logs.length > 1000) {
                    this.logs = this.logs.slice(-1000);
                }
                if (this.currentView === 'logs') {
                    this.addLogEntry(message.data);
                }
                break;

            case 'config_updated':
                this.loadData();
                break;

            case 'pong':
                // Keep-alive response
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('ws-status');
        const text = document.getElementById('ws-status-text');

        if (connected) {
            indicator.classList.add('connected');
            text.textContent = 'Connected';
        } else {
            indicator.classList.remove('connected');
            text.textContent = 'Disconnected';
        }
    }

    // Data Loading
    async loadData() {
        try {
            const [botsRes, logsRes, statsRes, configRes] = await Promise.all([
                fetch('/api/bots'),
                fetch('/api/logs?limit=100'),
                fetch('/api/stats'),
                fetch('/api/config')
            ]);

            const botsData = await botsRes.json();
            const logsData = await logsRes.json();
            const statsData = await statsRes.json();
            const configData = await configRes.json();

            // Update bots
            if (botsData.bots) {
                this.bots.clear();
                botsData.bots.forEach(bot => {
                    this.bots.set(bot.name, bot);
                });
            }

            // Update logs
            if (logsData.logs) {
                this.logs = logsData.logs;
            }

            // Update stats
            if (statsData) {
                this.updateStats(statsData);
            }

            // Update config
            if (configData.config) {
                this.config = configData.config;
                this.loadConfig();
            }

            this.renderCurrentView();
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }

    async loadBotTasks(botName) {
        try {
            const res = await fetch(`/api/bots/${botName}/tasks`);
            const data = await res.json();
            if (data.tasks) {
                this.tasks.set(botName, data.tasks);
            }
        } catch (err) {
            console.error(`Failed to load tasks for ${botName}:`, err);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Add Bot Button
        document.getElementById('add-bot-btn').addEventListener('click', () => {
            this.showAddBotModal();
        });

        // Modal Close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });

        // Add Bot Form
        document.getElementById('add-bot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddBot(e);
        });

        // Config Forms
        this.setupConfigForms();

        // Search and Filters
        document.getElementById('bot-search')?.addEventListener('input', (e) => {
            this.filterBots(e.target.value);
        });

        document.getElementById('task-bot-filter')?.addEventListener('change', (e) => {
            this.renderTasksView();
        });

        document.getElementById('log-level-filter')?.addEventListener('change', (e) => {
            this.renderLogsView();
        });

        document.getElementById('log-bot-filter')?.addEventListener('change', (e) => {
            this.renderLogsView();
        });

        document.getElementById('clear-logs-btn')?.addEventListener('click', () => {
            this.logs = [];
            this.renderLogsView();
        });

        // Auth type change
        document.getElementById('auth-type')?.addEventListener('change', (e) => {
            const cacheGroup = document.getElementById('auth-cache-group');
            if (e.target.value === 'microsoft') {
                cacheGroup.style.display = 'flex';
            } else {
                cacheGroup.style.display = 'none';
            }
        });
    }

    setupConfigForms() {
        const forms = [
            'server-config-form',
            'network-config-form',
            'auth-config-form',
            'behavior-config-form',
            'logging-config-form',
            'reconnect-config-form'
        ];

        forms.forEach(formId => {
            document.getElementById(formId)?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleConfigSubmit(e, formId);
            });
        });
    }

    // View Management
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            bots: 'Bots',
            tasks: 'Tasks',
            logs: 'Activity Logs',
            config: 'Configuration'
        };
        document.getElementById('view-title').textContent = titles[viewName] || viewName;

        this.currentView = viewName;
        this.renderCurrentView();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'bots':
                this.renderBotsView();
                break;
            case 'tasks':
                this.renderTasksView();
                break;
            case 'logs':
                this.renderLogsView();
                break;
            case 'config':
                // Config is already loaded
                break;
        }
    }

    // Dashboard Rendering
    renderDashboard() {
        // Update stats
        const totalBots = this.bots.size;
        const activeBots = Array.from(this.bots.values()).filter(b => b.status === 'online').length;
        const totalTasks = Array.from(this.tasks.values()).reduce((sum, tasks) => sum + tasks.length, 0);
        const recentLogs = this.logs.length;

        this.updateStats({ totalBots, activeBots, totalTasks, recentLogs });

        // Render bot overview
        const botsContainer = document.getElementById('dashboard-bots');
        if (this.bots.size === 0) {
            botsContainer.innerHTML = this.renderEmptyState('🤖', 'No bots running');
        } else {
            const botsArray = Array.from(this.bots.values()).slice(0, 5);
            botsContainer.innerHTML = botsArray.map(bot => this.renderBotCardSimple(bot)).join('');
        }

        // Render recent activity
        const activityContainer = document.getElementById('dashboard-activity');
        if (this.logs.length === 0) {
            activityContainer.innerHTML = this.renderEmptyState('📝', 'No recent activity');
        } else {
            const recentLogs = this.logs.slice(-10).reverse();
            activityContainer.innerHTML = recentLogs.map(log => this.renderActivityItem(log)).join('');
        }
    }

    updateStats(stats) {
        document.getElementById('stat-total-bots').textContent = stats.totalBots || 0;
        document.getElementById('stat-active-bots').textContent = stats.activeBots || 0;
        document.getElementById('stat-total-tasks').textContent = stats.totalTasks || 0;
        document.getElementById('stat-recent-logs').textContent = stats.recentLogs || 0;
    }

    renderBotCardSimple(bot) {
        const statusClass = bot.status || 'offline';
        const position = bot.position ? `${Math.floor(bot.position.x)}, ${Math.floor(bot.position.y)}, ${Math.floor(bot.position.z)}` : 'Unknown';

        return `
            <div class="bot-card">
                <div class="bot-card-header">
                    <div class="bot-name">${bot.name}</div>
                    <span class="bot-status ${statusClass}">${statusClass}</span>
                </div>
                <div class="bot-info">
                    <div class="bot-info-item">
                        <span>Position:</span>
                        <span>${position}</span>
                    </div>
                    ${bot.health !== undefined ? `
                    <div class="bot-info-item">
                        <span>Health:</span>
                        <span>${bot.health}/20</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderActivityItem(log) {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `
            <div class="activity-item">
                <div><strong>${log.botName}</strong>: ${log.message}</div>
                <div class="activity-time">${time}</div>
            </div>
        `;
    }

    // Bots View Rendering
    renderBotsView() {
        const container = document.getElementById('bots-list');

        if (this.bots.size === 0) {
            container.innerHTML = this.renderEmptyState('🤖', 'No bots available');
            return;
        }

        const botsArray = Array.from(this.bots.values());
        container.innerHTML = botsArray.map(bot => this.renderBotCard(bot)).join('');

        // Add event listeners for bot actions
        this.setupBotActions();
    }

    renderBotCard(bot) {
        const statusClass = bot.status || 'offline';
        const position = bot.position ? `${Math.floor(bot.position.x)}, ${Math.floor(bot.position.y)}, ${Math.floor(bot.position.z)}` : 'Unknown';

        return `
            <div class="bot-card" data-bot="${bot.name}">
                <div class="bot-card-header">
                    <div class="bot-name">${bot.name}</div>
                    <span class="bot-status ${statusClass}">${statusClass}</span>
                </div>
                <div class="bot-info">
                    <div class="bot-info-item">
                        <span>Position:</span>
                        <span>${position}</span>
                    </div>
                    ${bot.health !== undefined ? `
                    <div class="bot-info-item">
                        <span>Health:</span>
                        <span>${bot.health}/20 ❤️</span>
                    </div>
                    ` : ''}
                    ${bot.food !== undefined ? `
                    <div class="bot-info-item">
                        <span>Food:</span>
                        <span>${bot.food}/20 🍗</span>
                    </div>
                    ` : ''}
                    ${bot.gameMode !== undefined ? `
                    <div class="bot-info-item">
                        <span>Game Mode:</span>
                        <span>${this.getGameModeName(bot.gameMode)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="bot-actions">
                    ${bot.status === 'online' ? `
                        <button class="btn btn-danger btn-stop" data-bot="${bot.name}">Stop</button>
                    ` : `
                        <button class="btn btn-success btn-start" data-bot="${bot.name}">Start</button>
                    `}
                    <button class="btn btn-secondary btn-view-tasks" data-bot="${bot.name}">Tasks</button>
                </div>
            </div>
        `;
    }

    getGameModeName(mode) {
        const modes = ['Survival', 'Creative', 'Adventure', 'Spectator'];
        return modes[mode] || 'Unknown';
    }

    setupBotActions() {
        document.querySelectorAll('.btn-start').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const botName = e.target.dataset.bot;
                await this.startBot(botName);
            });
        });

        document.querySelectorAll('.btn-stop').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const botName = e.target.dataset.bot;
                await this.stopBot(botName);
            });
        });

        document.querySelectorAll('.btn-view-tasks').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const botName = e.target.dataset.bot;
                document.getElementById('task-bot-filter').value = botName;
                this.switchView('tasks');
            });
        });
    }

    filterBots(query) {
        const cards = document.querySelectorAll('#bots-list .bot-card');
        cards.forEach(card => {
            const botName = card.dataset.bot.toLowerCase();
            if (botName.includes(query.toLowerCase())) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Tasks View Rendering
    async renderTasksView() {
        const container = document.getElementById('tasks-list');
        const filterSelect = document.getElementById('task-bot-filter');

        // Update filter options
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="">All Bots</option>';
        Array.from(this.bots.keys()).forEach(name => {
            filterSelect.innerHTML += `<option value="${name}">${name}</option>`;
        });
        filterSelect.value = currentFilter;

        // Load tasks for all bots if not already loaded
        for (const botName of this.bots.keys()) {
            if (!this.tasks.has(botName)) {
                await this.loadBotTasks(botName);
            }
        }

        // Filter tasks
        let tasksToShow = Array.from(this.tasks.entries());
        if (currentFilter) {
            tasksToShow = tasksToShow.filter(([botName]) => botName === currentFilter);
        }

        if (tasksToShow.length === 0) {
            container.innerHTML = this.renderEmptyState('📋', 'No tasks found');
            return;
        }

        container.innerHTML = tasksToShow.map(([botName, tasks]) => this.renderTaskGroup(botName, tasks)).join('');
    }

    renderTaskGroup(botName, tasks) {
        if (!tasks || tasks.length === 0) return '';

        return `
            <div class="task-group">
                <div class="task-group-header">🤖 ${botName}</div>
                ${tasks.map(task => this.renderTaskItem(task)).join('')}
            </div>
        `;
    }

    renderTaskItem(task) {
        return `
            <div class="task-item">
                <div class="task-name">${task.name || task.content}</div>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
        `;
    }

    // Logs View Rendering
    renderLogsView() {
        const container = document.getElementById('logs-list');
        const levelFilter = document.getElementById('log-level-filter').value;
        const botFilter = document.getElementById('log-bot-filter').value;

        // Update bot filter options
        const botFilterSelect = document.getElementById('log-bot-filter');
        const currentBotFilter = botFilterSelect.value;
        botFilterSelect.innerHTML = '<option value="">All Bots</option>';
        Array.from(this.bots.keys()).forEach(name => {
            botFilterSelect.innerHTML += `<option value="${name}">${name}</option>`;
        });
        botFilterSelect.value = currentBotFilter;

        // Filter logs
        let filteredLogs = this.logs;
        if (levelFilter) {
            filteredLogs = filteredLogs.filter(log => log.level === levelFilter);
        }
        if (botFilter) {
            filteredLogs = filteredLogs.filter(log => log.botName === botFilter);
        }

        if (filteredLogs.length === 0) {
            container.innerHTML = this.renderEmptyState('📝', 'No logs available');
            return;
        }

        container.innerHTML = filteredLogs.slice(-100).reverse().map(log => this.renderLogEntry(log)).join('');

        // Scroll to top
        container.scrollTop = 0;
    }

    renderLogEntry(log) {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `
            <div class="log-entry">
                <span class="log-timestamp">[${time}]</span>
                <span class="log-bot">${log.botName}</span>
                <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-message">${this.escapeHtml(log.message)}</span>
            </div>
        `;
    }

    addLogEntry(log) {
        const container = document.getElementById('logs-list');
        const logHtml = this.renderLogEntry(log);
        container.insertAdjacentHTML('afterbegin', logHtml);

        // Keep only last 100 visible
        const entries = container.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[entries.length - 1].remove();
        }
    }

    // Config Management
    loadConfig() {
        if (!this.config) return;

        // Server config
        if (this.config.server) {
            document.getElementById('server-host').value = this.config.server.host || '';
            document.getElementById('server-port').value = this.config.server.port || '';
            document.getElementById('server-version').value = this.config.server.version || '';
        }

        // Network config
        if (this.config.network) {
            document.getElementById('network-is-proxy').checked = this.config.network.isProxy || false;
            document.getElementById('network-backend').value = this.config.network.backendServer || '';
            document.getElementById('network-auto-join').checked = this.config.network.autoJoinBackend !== false;
        }

        // Auth config
        if (this.config.authentication) {
            document.getElementById('auth-type').value = this.config.authentication.type || 'offline';
            if (this.config.authentication.credentials?.authCacheDir) {
                document.getElementById('auth-cache-dir').value = this.config.authentication.credentials.authCacheDir;
            }
            // Trigger change event to show/hide cache dir
            document.getElementById('auth-type').dispatchEvent(new Event('change'));
        }

        // Behavior config
        if (this.config.behavior) {
            document.getElementById('behavior-auto-respawn').checked = this.config.behavior.autoRespawn !== false;
            document.getElementById('behavior-sprint').checked = this.config.behavior.sprintByDefault || false;
            document.getElementById('behavior-hide-errors').checked = this.config.behavior.hideErrors || false;
        }

        // Logging config
        if (this.config.logging) {
            document.getElementById('log-level').value = this.config.logging.level || 'info';
            document.getElementById('log-chat').checked = this.config.logging.logChat !== false;
            document.getElementById('log-events').checked = this.config.logging.logEvents !== false;
        }

        // Reconnect config
        if (this.config.reconnect) {
            document.getElementById('reconnect-enabled').checked = this.config.reconnect.enabled !== false;
            document.getElementById('reconnect-max-attempts').value = this.config.reconnect.maxAttempts || -1;
            document.getElementById('reconnect-base-delay').value = this.config.reconnect.baseDelayMs || 1000;
        }
    }

    async handleConfigSubmit(e, formId) {
        const form = e.target;
        const formData = new FormData(form);

        // Determine section
        const sectionMap = {
            'server-config-form': 'server',
            'network-config-form': 'network',
            'auth-config-form': 'authentication',
            'behavior-config-form': 'behavior',
            'logging-config-form': 'logging',
            'reconnect-config-form': 'reconnect'
        };

        const section = sectionMap[formId];
        if (!section) return;

        // Convert form data to object
        const updates = {};
        for (const [key, value] of formData.entries()) {
            // Handle checkboxes
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.type === 'checkbox') {
                updates[key] = input.checked;
            } else if (input && input.type === 'number') {
                updates[key] = parseInt(value) || 0;
            } else {
                updates[key] = value;
            }
        }

        // Send updates
        try {
            for (const [key, value] of Object.entries(updates)) {
                await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ section, key, value })
                });
            }
            alert('Configuration saved successfully');
        } catch (err) {
            alert(`Failed to save configuration: ${err.message}`);
        }
    }

    // Bot Management
    showAddBotModal() {
        document.getElementById('add-bot-modal').classList.add('active');
    }

    hideModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async handleAddBot(e) {
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        const capabilities = formData.get('capabilities')?.split(',').map(c => c.trim()) || [];

        try {
            await fetch(`/api/bots/${name}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capabilities })
            });

            this.hideModal();
            form.reset();
            alert(`Bot ${name} created successfully`);
        } catch (err) {
            alert(`Failed to create bot: ${err.message}`);
        }
    }

    async startBot(name) {
        try {
            await fetch(`/api/bots/${name}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            alert(`Bot ${name} started`);
        } catch (err) {
            alert(`Failed to start bot: ${err.message}`);
        }
    }

    async stopBot(name) {
        try {
            await fetch(`/api/bots/${name}/stop`, {
                method: 'POST'
            });
            alert(`Bot ${name} stopped`);
        } catch (err) {
            alert(`Failed to stop bot: ${err.message}`);
        }
    }

    // Utilities
    renderEmptyState(icon, text) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${text}</div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startPeriodicUpdates() {
        // Ping WebSocket every 30 seconds
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        // Refresh data every 10 seconds
        setInterval(() => {
            if (this.currentView === 'dashboard') {
                this.loadData();
            }
        }, 10000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BotManagerApp();
});
