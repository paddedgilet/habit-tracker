// Configuration
const CONFIG = {
    clientId: '840745006888-k6nvpm03hqn1s5m2rp66oimuggp8g38m.apps.googleusercontent.com',
    spreadsheetId: '1Gu69dicSuGUsLmbwWFH8BLVFr_s_KK2mv_qCSIl4WBY',
    habitsSheet: 'Habits',
    logsSheet: 'Logs',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
    apiKey: 'AIzaSyAcRMhbIN9yAIdy6ZG62daAixaRddEHgSE'
};

// Google API loaded flags
let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;

// App State
const app = {
    habits: [],
    todayLogs: [],
    allLogs: [],
    currentHabit: null,
    tokenRefreshTimer: null,
    
    // Initialize app
    async init() {
        console.log('App initializing...');
        try {
            this.updateDate();
            
            // Wait for Google APIs to load
            console.log('Waiting for Google APIs...');
            await this.waitForGoogleAPIs();
            console.log('Google APIs loaded!');
            
            // Check if user is already signed in
            if (this.isSignedIn()) {
                console.log('User already signed in, loading data...');
                this.scheduleTokenRefresh();
                await this.loadData();
                this.hideLoading();
            } else {
                console.log('User not signed in, showing sign-in screen');
                this.showSignIn();
            }
        } catch (error) {
            console.error('Init error:', error);
            this.showError('Initialization error: ' + error.message);
        }
    },
    
    // Wait for Google APIs to load
    async waitForGoogleAPIs() {
        let attempts = 0;
        const maxAttempts = 50;
        
        return new Promise((resolve, reject) => {
            const checkAPIs = setInterval(() => {
                attempts++;
                
                if (gapiInited && gisInited) {
                    console.log('Both APIs initialized');
                    clearInterval(checkAPIs);
                    resolve();
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkAPIs);
                    reject(new Error('Google APIs failed to load. Please refresh the page.'));
                }
            }, 100);
        });
    },
    
    // Check if user is signed in
    isSignedIn() {
        accessToken = localStorage.getItem('accessToken');
        const expiry = localStorage.getItem('tokenExpiry');
        const lastAuth = localStorage.getItem('lastAuthTime');
        
        // Check if we authenticated within the last 7 days
        if (lastAuth) {
            const daysSinceAuth = (new Date().getTime() - parseInt(lastAuth)) / (1000 * 60 * 60 * 24);
            if (daysSinceAuth > 7) {
                console.log('Auth older than 7 days, need to re-authenticate');
                this.clearAuth();
                return false;
            }
        }
        
        if (accessToken && expiry) {
            const now = new Date().getTime();
            if (now < parseInt(expiry)) {
                console.log('Valid token found');
                return true;
            } else {
                console.log('Token expired, will request new one');
                // Don't clear auth, just request new token
                return 'refresh';
            }
        }
        
        return false;
    },
    
    // Schedule automatic token refresh
    scheduleTokenRefresh() {
        // Clear any existing timer
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
        
        const expiry = localStorage.getItem('tokenExpiry');
        if (expiry) {
            const now = new Date().getTime();
            const expiryTime = parseInt(expiry);
            const timeUntilExpiry = expiryTime - now;
            
            // Refresh 5 minutes before expiry
            const refreshTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
            
            console.log(`Token refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);
            
            this.tokenRefreshTimer = setTimeout(() => {
                console.log('Auto-refreshing token...');
                this.refreshToken();
            }, refreshTime);
        }
    },
    
    // Refresh token silently
    refreshToken() {
        console.log('Requesting new token...');
        
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error('Token refresh failed:', resp);
                // If refresh fails, user needs to sign in again
                this.clearAuth();
                this.showSignIn();
                return;
            }
            
            accessToken = resp.access_token;
            console.log('Token refreshed successfully');
            
            // Store new token and expiry
            const expiry = new Date().getTime() + (3600 * 1000);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('tokenExpiry', expiry.toString());
            
            // Set the token for gapi
            gapi.client.setToken({
                access_token: accessToken
            });
            
            // Schedule next refresh
            this.scheduleTokenRefresh();
        };
        
        // Request token without prompt (silent refresh)
        tokenClient.requestAccessToken({ prompt: '' });
    },
    
    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('lastAuthTime');
        accessToken = null;
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
    },
    
    // Show sign-in screen
    showSignIn() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-app').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 2rem; text-align: center;">
                <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 1rem;">Welcome to Habit Tracker</h2>
                <p style="color: var(--color-text-secondary); margin-bottom: 2rem; max-width: 400px;">
                    Sign in with Google to start tracking your habits. Your data will be stored in your personal Google Sheet.
                </p>
                <button onclick="app.handleAuthClick()" class="btn-primary" style="font-size: 1rem; padding: 1rem 2rem;">
                    🔐 Sign in with Google
                </button>
            </div>
        `;
        document.getElementById('main-app').style.display = 'block';
    },
    
    // Handle sign-in
    handleAuthClick() {
        console.log('Sign-in clicked');
        
        tokenClient.callback = async (resp) => {
            console.log('Auth callback received:', resp);
            
            if (resp.error !== undefined) {
                console.error('Auth error:', resp);
                this.showError('Authentication failed: ' + resp.error);
                return;
            }
            
            accessToken = resp.access_token;
            console.log('Access token received');
            
            // Store token, expiry, and last auth time
            const expiry = new Date().getTime() + (3600 * 1000);
            const authTime = new Date().getTime();
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('tokenExpiry', expiry.toString());
            localStorage.setItem('lastAuthTime', authTime.toString());
            
            // Set the token for gapi
            gapi.client.setToken({
                access_token: accessToken
            });
            
            // Schedule automatic token refresh
            this.scheduleTokenRefresh();
            
            // Load data and show app
            try {
                this.showLoading();
                await this.loadData();
                this.hideLoading();
            } catch (error) {
                console.error('Error loading data:', error);
                this.showError('Failed to load data: ' + error.message);
            }
        };
        
        // Request access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
    },
    
    // Sign out
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken(null);
        }
        
        this.clearAuth();
        location.reload();
    },
    
    // Load all data
    async loadData() {
        console.log('Loading data...');
        
        // Check if we need to refresh token
        const signInStatus = this.isSignedIn();
        if (signInStatus === 'refresh') {
            console.log('Token expired, refreshing...');
            await new Promise((resolve) => {
                tokenClient.callback = async (resp) => {
                    if (resp.error === undefined) {
                        accessToken = resp.access_token;
                        const expiry = new Date().getTime() + (3600 * 1000);
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('tokenExpiry', expiry.toString());
                        gapi.client.setToken({ access_token: accessToken });
                        this.scheduleTokenRefresh();
                    }
                    resolve();
                };
                tokenClient.requestAccessToken({ prompt: '' });
            });
        }
        
        // Restore the main app HTML structure first
        const mainApp = document.getElementById('main-app');
        mainApp.innerHTML = `
            <header class="app-header">
                <div class="header-content">
                    <h1 class="app-title">Daily Tracker</h1>
                    <div class="header-date" id="current-date"></div>
                </div>
            </header>

            <section class="progress-section">
                <div class="progress-circle-container">
                    <svg class="progress-circle" viewBox="0 0 200 200">
                        <circle class="progress-bg" cx="100" cy="100" r="85" />
                        <circle class="progress-bar" cx="100" cy="100" r="85" id="progress-ring" />
                    </svg>
                    <div class="progress-text">
                        <div class="progress-count" id="progress-count">0/15</div>
                        <div class="progress-label">completed</div>
                    </div>
                </div>
                <div class="progress-stats">
                    <div class="stat">
                        <span class="stat-value" id="completion-rate">0%</span>
                        <span class="stat-label">Today</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="streak-count">0</span>
                        <span class="stat-label">Streak</span>
                    </div>
                </div>
            </section>

            <section class="habits-section">
                <div class="section-header">
                    <h2>Your Habits</h2>
                    <button class="btn-secondary" onclick="app.refreshData()">↻ Refresh</button>
                </div>
                <div class="habits-grid" id="habits-container">
                </div>
            </section>

            <section class="actions-section">
                <button class="btn-secondary btn-full" onclick="app.showHistory()">
                    📊 View History
                </button>
            </section>
        `;
        
        this.updateDate();
        await this.loadHabits();
        await this.loadLogs();
        this.render();
    },
    
    // Update current date display
    updateDate() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    },
    
    // Load habits from Google Sheets
    async loadHabits() {
        console.log('Loading habits...');
        try {
            if (!gapi.client.getToken()) {
                const storedToken = localStorage.getItem('accessToken');
                if (storedToken) {
                    gapi.client.setToken({ access_token: storedToken });
                } else {
                    throw new Error('No access token available');
                }
            }
            
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.spreadsheetId,
                range: `${CONFIG.habitsSheet}!A2:E100`,
            });
            
            console.log('Habits response:', response);
            
            const values = response.result.values;
            
            if (!values || values.length === 0) {
                throw new Error('No habits found in spreadsheet. Please add habits to the Habits sheet.');
            }
            
            this.habits = values.map(row => ({
                id: row[0],
                name: row[1],
                type: row[2],
                target: parseFloat(row[3]) || 1,
                source: row[4] || 'manual'
            }));
            
            console.log('Habits loaded:', this.habits.length);
        } catch (error) {
            console.error('Error loading habits:', error);
            throw new Error('Failed to load habits: ' + (error.result?.error?.message || error.message));
        }
    },
    
    // Load all logs from Google Sheets
    async loadLogs() {
        console.log('Loading logs...');
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.spreadsheetId,
                range: `${CONFIG.logsSheet}!A2:E10000`,
            });
            
            const values = response.result.values;
            
            if (!values || values.length === 0) {
                console.log('No logs found');
                this.allLogs = [];
                this.todayLogs = [];
                return;
            }
            
            this.allLogs = values.map(row => ({
                timestamp: row[0],
                date: row[1],
                habitId: row[2],
                habitName: row[3],
                value: row[4]
            }));
            
            // Filter today's logs
            const today = this.getTodayDate();
            this.todayLogs = this.allLogs.filter(log => log.date === today);
            
            console.log('Logs loaded. Total:', this.allLogs.length, 'Today:', this.todayLogs.length);
        } catch (error) {
            console.error('Error loading logs:', error);
            this.allLogs = [];
            this.todayLogs = [];
        }
    },
    
    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    },
    
    // Get current timestamp
    getCurrentTimestamp() {
        return new Date().toISOString();
    },
    
    // Get today's value for a habit (RUNNING SUM for numbers, LATEST for yes/no)
    getTodayValue(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        const logs = this.todayLogs.filter(log => log.habitId === habitId);
        
        if (logs.length === 0) return null;
        
        if (habit && habit.type === 'number') {
            // Return SUM of all logs today
            const sum = logs.reduce((total, log) => {
                const val = parseFloat(log.value);
                return total + (isNaN(val) ? 0 : val);
            }, 0);
            return sum.toString();
        } else {
            // For yes/no, return the latest value
            return logs[logs.length - 1].value;
        }
    },
    
    // Get all today's logs for a habit
    getTodayLogs(habitId) {
        return this.todayLogs.filter(log => log.habitId === habitId);
    },
    
    // Check if habit is completed today
    isHabitCompleted(habit) {
        const value = this.getTodayValue(habit.id);
        
        if (value === null) return false;
        
        if (habit.type === 'yes_no') {
            return value.toLowerCase() === 'yes' || value === '1' || value === 'true';
        } else {
            const numValue = parseFloat(value);
            return !isNaN(numValue) && numValue >= habit.target;
        }
    },
    
    // Calculate completion stats
    getCompletionStats() {
        const completed = this.habits.filter(h => this.isHabitCompleted(h)).length;
        const total = this.habits.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { completed, total, percentage };
    },
    
    // Calculate streak
    calculateStreak() {
        const dates = [...new Set(this.allLogs.map(log => log.date))].sort().reverse();
        
        let streak = 0;
        
        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const dayLogs = this.allLogs.filter(log => log.date === date);
            
            // Group logs by habit and calculate if each is completed
            const habitCompletions = {};
            dayLogs.forEach(log => {
                const habit = this.habits.find(h => h.id === log.habitId);
                if (!habit) return;
                
                if (!habitCompletions[log.habitId]) {
                    habitCompletions[log.habitId] = { habit, values: [] };
                }
                habitCompletions[log.habitId].values.push(log.value);
            });
            
            // Count completed habits
            let completed = 0;
            Object.values(habitCompletions).forEach(({ habit, values }) => {
                if (habit.type === 'yes_no') {
                    // Latest value
                    const latest = values[values.length - 1];
                    if (latest.toLowerCase() === 'yes') completed++;
                } else {
                    // Sum of values
                    const sum = values.reduce((total, val) => total + parseFloat(val), 0);
                    if (sum >= habit.target) completed++;
                }
            });
            
            const completionRate = this.habits.length > 0 ? completed / this.habits.length : 0;
            
            if (completionRate > 0.5) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    },
    
    // Render the UI
    render() {
        console.log('Rendering UI...');
        this.renderHeader();
        this.renderProgress();
        this.renderHabits();
    },
    
    // Render header with sign-out button
    renderHeader() {
        const header = document.querySelector('.app-header .header-content');
        if (header && !header.querySelector('.sign-out-btn')) {
            const signOutBtn = document.createElement('button');
            signOutBtn.className = 'btn-secondary sign-out-btn';
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.style.marginTop = '0.5rem';
            signOutBtn.onclick = () => this.signOut();
            header.appendChild(signOutBtn);
        }
    },
    
    // Render progress circle and stats
    renderProgress() {
        const stats = this.getCompletionStats();
        const streak = this.calculateStreak();
        
        const countEl = document.getElementById('progress-count');
        const rateEl = document.getElementById('completion-rate');
        const streakEl = document.getElementById('streak-count');
        
        if (countEl) countEl.textContent = `${stats.completed}/${stats.total}`;
        if (rateEl) rateEl.textContent = `${stats.percentage}%`;
        if (streakEl) streakEl.textContent = streak;
        
        const circle = document.getElementById('progress-ring');
        if (circle) {
            const circumference = 2 * Math.PI * 85;
            const progress = stats.total > 0 ? stats.completed / stats.total : 0;
            const offset = circumference - (progress * circumference);
            circle.style.strokeDashoffset = offset;
        }
    },
    
    // Render habits list
    renderHabits() {
        const container = document.getElementById('habits-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const isCompleted = this.isHabitCompleted(habit);
            const value = this.getTodayValue(habit.id);
            const logs = this.getTodayLogs(habit.id);
            
            const card = document.createElement('div');
            card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
            card.onclick = () => this.openHabitModal(habit);
            
            let valueDisplay = '';
            if (value !== null) {
                if (habit.type === 'number') {
                    const numValue = parseFloat(value);
                    valueDisplay = `<span class="habit-value has-value">${numValue} ${logs.length > 1 ? `(${logs.length} logs)` : ''}</span>`;
                } else {
                    valueDisplay = `<span class="habit-value has-value">${value}</span>`;
                }
            } else {
                valueDisplay = `<span class="habit-value">Not logged</span>`;
            }
            
            let targetDisplay = '';
            if (habit.type === 'number') {
                targetDisplay = `<div class="habit-target">Target: ${habit.target}</div>`;
            }
            
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-status">${isCompleted ? '✓' : '○'}</div>
                </div>
                ${valueDisplay}
                ${targetDisplay}
            `;
            
            container.appendChild(card);
        });
    },
    
    // Open habit modal
    openHabitModal(habit) {
        this.currentHabit = habit;
        const modal = document.getElementById('habit-modal');
        const title = document.getElementById('modal-title');
        const inputContainer = document.getElementById('modal-input-container');
        const currentValue = document.getElementById('modal-current-value');
        const hint = document.getElementById('modal-hint');
        
        title.textContent = habit.name;
        
        const todayValue = this.getTodayValue(habit.id);
        const todayLogs = this.getTodayLogs(habit.id);
        
        // Display current total or status
        if (todayValue !== null) {
            if (habit.type === 'number') {
                currentValue.textContent = `${todayValue} (${todayLogs.length} log${todayLogs.length !== 1 ? 's' : ''})`;
            } else {
                currentValue.textContent = todayValue;
            }
        } else {
            currentValue.textContent = 'Not logged';
        }
        
        if (habit.type === 'yes_no') {
            inputContainer.innerHTML = `
                <div class="toggle-buttons">
                    <button class="toggle-btn ${todayValue === 'Yes' ? 'active' : ''}" data-value="Yes">Yes</button>
                    <button class="toggle-btn ${todayValue === 'No' ? 'active' : ''}" data-value="No">No</button>
                </div>
            `;
            
            hint.textContent = 'Did you complete this habit today?';
            
            const buttons = inputContainer.querySelectorAll('.toggle-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    buttons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        } else {
            inputContainer.innerHTML = `
                <div class="input-group">
                    <label>Add to Today's Total</label>
                    <input type="number" class="input-number" id="habit-input-value" 
                           value="" placeholder="0" min="0" step="1">
                </div>
            `;
            
            const currentTotal = parseFloat(todayValue) || 0;
            const remaining = Math.max(0, habit.target - currentTotal);
            hint.textContent = `Target: ${habit.target}. Current: ${currentTotal}. Remaining: ${remaining}`;
        }
        
        modal.style.display = 'flex';
    },
    
    // Close habit modal
    closeModal() {
        document.getElementById('habit-modal').style.display = 'none';
        this.currentHabit = null;
    },
    
    // Save habit log
    async saveHabit() {
        if (!this.currentHabit) return;
        
        let value;
        
        if (this.currentHabit.type === 'yes_no') {
            const activeBtn = document.querySelector('.toggle-btn.active');
            if (!activeBtn) {
                alert('Please select Yes or No');
                return;
            }
            value = activeBtn.dataset.value;
        } else {
            const input = document.getElementById('habit-input-value');
            value = input.value;
            
            if (!value || value === '' || parseFloat(value) === 0) {
                alert('Please enter a value greater than 0');
                return;
            }
        }
        
        try {
            await this.appendLog(this.currentHabit.id, this.currentHabit.name, value);
            
            await this.loadLogs();
            this.render();
            this.closeModal();
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving habit: ' + error.message);
        }
    },
    
    // Append log to Google Sheets
    async appendLog(habitId, habitName, value) {
        const timestamp = this.getCurrentTimestamp();
        const date = this.getTodayDate();
        
        console.log('Appending log:', { habitId, habitName, value });
        
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: CONFIG.spreadsheetId,
                range: `${CONFIG.logsSheet}!A:E`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[timestamp, date, habitId, habitName, value]]
                }
            });
            
            console.log('Log saved:', response);
        } catch (error) {
            console.error('Error appending log:', error);
            throw new Error('Failed to save log: ' + (error.result?.error?.message || error.message));
        }
    },
    
    // Refresh data
    async refreshData() {
        try {
            this.showLoading();
            await this.loadHabits();
            await this.loadLogs();
            this.render();
            this.hideLoading();
        } catch (error) {
            console.error('Refresh error:', error);
            alert('Error refreshing data: ' + error.message);
            this.hideLoading();
        }
    },
    
    // Show history modal
    showHistory() {
        const modal = document.getElementById('history-modal');
        const filter = document.getElementById('history-habit-filter');
        
        filter.innerHTML = '<option value="all">All Habits</option>';
        this.habits.forEach(habit => {
            const option = document.createElement('option');
            option.value = habit.id;
            option.textContent = habit.name;
            filter.appendChild(option);
        });
        
        modal.style.display = 'flex';
        this.filterHistory();
    },
    
    // Close history modal
    closeHistoryModal() {
        document.getElementById('history-modal').style.display = 'none';
    },
    
    // Filter and display history
    filterHistory() {
        const habitFilter = document.getElementById('history-habit-filter').value;
        const daysFilter = parseInt(document.getElementById('history-days-filter').value);
        const content = document.getElementById('history-content');
        
        let filteredLogs = [...this.allLogs];
        
        if (habitFilter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.habitId === habitFilter);
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        
        filteredLogs = filteredLogs.filter(log => log.date >= cutoffStr);
        
        const groupedByDate = {};
        filteredLogs.forEach(log => {
            if (!groupedByDate[log.date]) {
                groupedByDate[log.date] = [];
            }
            groupedByDate[log.date].push(log);
        });
        
        const dates = Object.keys(groupedByDate).sort().reverse();
        
        if (dates.length === 0) {
            content.innerHTML = '<p class="loading-text">No history found for selected filters.</p>';
            return;
        }
        
        content.innerHTML = '';
        dates.forEach(date => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'history-day';
            
            const dateObj = new Date(date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            dayDiv.innerHTML = `<div class="history-day-header">${dateStr}</div>`;
            
            const entriesDiv = document.createElement('div');
            entriesDiv.className = 'history-entries';
            
            // Group by habit for this date
            const habitGroups = {};
            groupedByDate[date].forEach(log => {
                if (!habitGroups[log.habitId]) {
                    habitGroups[log.habitId] = {
                        habitName: log.habitName,
                        logs: []
                    };
                }
                habitGroups[log.habitId].logs.push(log);
            });
            
            // Display each habit's logs
            Object.values(habitGroups).forEach(({ habitName, logs }) => {
                const habit = this.habits.find(h => h.name === habitName);
                
                if (habit && habit.type === 'number' && logs.length > 1) {
                    // Show sum for number habits with multiple logs
                    const sum = logs.reduce((total, log) => total + parseFloat(log.value), 0);
                    const entry = document.createElement('div');
                    entry.className = 'history-entry';
                    entry.innerHTML = `
                        <span class="history-entry-name">${habitName}</span>
                        <span class="history-entry-value">${sum} (${logs.length} logs)</span>
                    `;
                    entriesDiv.appendChild(entry);
                } else {
                    // Show each log individually
                    logs.forEach(log => {
                        const entry = document.createElement('div');
                        entry.className = 'history-entry';
                        entry.innerHTML = `
                            <span class="history-entry-name">${log.habitName}</span>
                            <span class="history-entry-value">${log.value}</span>
                        `;
                        entriesDiv.appendChild(entry);
                    });
                }
            });
            
            dayDiv.appendChild(entriesDiv);
            content.appendChild(dayDiv);
        });
    },
    
    // Show/hide loading
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    },
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    },
    
    // Show error
    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-message').textContent = message;
        document.getElementById('error').style.display = 'flex';
    }
};

// Load Google API client library
function gapiLoaded() {
    console.log('GAPI script loaded');
    gapi.load('client', async () => {
        console.log('GAPI client loading...');
        try {
            await gapi.client.init({
                apiKey: CONFIG.apiKey,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            console.log('GAPI client initialized');
            gapiInited = true;
        } catch (error) {
            console.error('GAPI init error:', error);
        }
    });
}

// Load Google Identity Services library
function gisLoaded() {
    console.log('GIS script loaded');
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        callback: '',
    });
    console.log('GIS token client initialized');
    gisInited = true;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
