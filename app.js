// Configuration
const CONFIG = {
    apiKey: 'AIzaSyAcRMhbIN9yAIdy6ZG62daAixaRddEHgSE',
    spreadsheetId: '1Gu69dicSuGUsLmbwWFH8BLVFr_s_KK2mv_qCSIl4WBY',
    habitsSheet: 'Habits',
    logsSheet: 'Logs',
    // Google Apps Script endpoint for writing data
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwg8OXWySRZ8Qzb1JAfie1GG1DvDukpe_A7xgqhY_O_tDHUv_WxYDZIplqJK_8OwzU/exec'
};

// App State
const app = {
    habits: [],
    todayLogs: [],
    allLogs: [],
    currentHabit: null,
    
    // Initialize app
    async init() {
        try {
            this.updateDate();
            await this.loadHabits();
            await this.loadLogs();
            this.render();
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    // Update current date display
    updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    },
    
    // Load habits from Google Sheets
    async loadHabits() {
        const range = `${CONFIG.habitsSheet}!A2:E100`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?key=${CONFIG.apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load habits. Check your API key and spreadsheet permissions.');
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('No habits found in spreadsheet. Please add habits to the Habits sheet.');
        }
        
        this.habits = data.values.map(row => ({
            id: row[0],
            name: row[1],
            type: row[2],
            target: parseFloat(row[3]) || 1,
            source: row[4] || 'manual'
        }));
    },
    
    // Load all logs from Google Sheets
    async loadLogs() {
        const range = `${CONFIG.logsSheet}!A2:E10000`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?key=${CONFIG.apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load logs.');
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            this.allLogs = [];
            this.todayLogs = [];
            return;
        }
        
        this.allLogs = data.values.map(row => ({
            timestamp: row[0],
            date: row[1],
            habitId: row[2],
            habitName: row[3],
            value: row[4]
        }));
        
        // Filter today's logs
        const today = this.getTodayDate();
        this.todayLogs = this.allLogs.filter(log => log.date === today);
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
    
    // Get today's value for a habit
    getTodayValue(habitId) {
        const log = this.todayLogs.find(log => log.habitId === habitId);
        return log ? log.value : null;
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
    
    // Calculate streak (simplified - just counting consecutive days with > 50% completion)
    calculateStreak() {
        // Get unique dates from logs
        const dates = [...new Set(this.allLogs.map(log => log.date))].sort().reverse();
        
        let streak = 0;
        const today = this.getTodayDate();
        
        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const dayLogs = this.allLogs.filter(log => log.date === date);
            
            // Count completed habits for this day
            const completed = dayLogs.filter(log => {
                const habit = this.habits.find(h => h.id === log.habitId);
                if (!habit) return false;
                
                if (habit.type === 'yes_no') {
                    return log.value.toLowerCase() === 'yes';
                } else {
                    return parseFloat(log.value) >= habit.target;
                }
            }).length;
            
            const completionRate = dayLogs.length > 0 ? completed / this.habits.length : 0;
            
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
        this.renderProgress();
        this.renderHabits();
    },
    
    // Render progress circle and stats
    renderProgress() {
        const stats = this.getCompletionStats();
        const streak = this.calculateStreak();
        
        // Update progress text
        document.getElementById('progress-count').textContent = `${stats.completed}/${stats.total}`;
        document.getElementById('completion-rate').textContent = `${stats.percentage}%`;
        document.getElementById('streak-count').textContent = streak;
        
        // Update progress circle
        const circle = document.getElementById('progress-ring');
        const circumference = 2 * Math.PI * 85; // r=85
        const progress = stats.total > 0 ? stats.completed / stats.total : 0;
        const offset = circumference - (progress * circumference);
        
        circle.style.strokeDashoffset = offset;
    },
    
    // Render habits list
    renderHabits() {
        const container = document.getElementById('habits-container');
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const isCompleted = this.isHabitCompleted(habit);
            const value = this.getTodayValue(habit.id);
            
            const card = document.createElement('div');
            card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
            card.onclick = () => this.openHabitModal(habit);
            
            let valueDisplay = '';
            if (value !== null) {
                if (habit.type === 'yes_no') {
                    valueDisplay = `<span class="habit-value has-value">${value}</span>`;
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
        currentValue.textContent = todayValue || 'Not logged';
        
        // Create appropriate input based on habit type
        if (habit.type === 'yes_no') {
            inputContainer.innerHTML = `
                <div class="toggle-buttons">
                    <button class="toggle-btn ${todayValue === 'Yes' ? 'active' : ''}" data-value="Yes">Yes</button>
                    <button class="toggle-btn ${todayValue === 'No' ? 'active' : ''}" data-value="No">No</button>
                </div>
            `;
            
            hint.textContent = 'Did you complete this habit today?';
            
            // Add click handlers
            const buttons = inputContainer.querySelectorAll('.toggle-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    buttons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        } else {
            const currentNum = parseFloat(todayValue) || '';
            inputContainer.innerHTML = `
                <div class="input-group">
                    <label>Enter Value</label>
                    <input type="number" class="input-number" id="habit-input-value" 
                           value="${currentNum}" placeholder="0" min="0" step="1">
                </div>
            `;
            
            hint.textContent = `Target: ${habit.target}. Enter the current value.`;
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
            
            if (!value || value === '') {
                alert('Please enter a value');
                return;
            }
        }
        
        try {
            await this.appendLog(this.currentHabit.id, this.currentHabit.name, value);
            
            // Reload data and update UI
            await this.loadLogs();
            this.render();
            this.closeModal();
        } catch (error) {
            alert('Error saving habit: ' + error.message);
        }
    },
    
    // Append log using Google Apps Script
    async appendLog(habitId, habitName, value) {
        const timestamp = this.getCurrentTimestamp();
        const date = this.getTodayDate();
        
        const response = await fetch(CONFIG.scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Required for Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: timestamp,
                date: date,
                habitId: habitId,
                habitName: habitName,
                value: value
            })
        });
        
        // Note: With no-cors mode, we can't read the response
        // We'll assume success and reload data to verify
        // Wait a moment for the script to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
    },
    
    // Refresh data
    async refreshData() {
        try {
            const loading = document.getElementById('loading');
            loading.style.display = 'flex';
            document.getElementById('main-app').style.display = 'none';
            
            await this.loadHabits();
            await this.loadLogs();
            this.render();
            
            loading.style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
        } catch (error) {
            alert('Error refreshing data: ' + error.message);
        }
    },
    
    // Show history modal
    showHistory() {
        const modal = document.getElementById('history-modal');
        const filter = document.getElementById('history-habit-filter');
        
        // Populate habit filter
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
        
        // Filter logs
        let filteredLogs = [...this.allLogs];
        
        if (habitFilter !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.habitId === habitFilter);
        }
        
        // Filter by date range
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        
        filteredLogs = filteredLogs.filter(log => log.date >= cutoffStr);
        
        // Group by date
        const groupedByDate = {};
        filteredLogs.forEach(log => {
            if (!groupedByDate[log.date]) {
                groupedByDate[log.date] = [];
            }
            groupedByDate[log.date].push(log);
        });
        
        // Sort dates descending
        const dates = Object.keys(groupedByDate).sort().reverse();
        
        if (dates.length === 0) {
            content.innerHTML = '<p class="loading-text">No history found for selected filters.</p>';
            return;
        }
        
        // Render history
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
            
            groupedByDate[date].forEach(log => {
                const entry = document.createElement('div');
                entry.className = 'history-entry';
                entry.innerHTML = `
                    <span class="history-entry-name">${log.habitName}</span>
                    <span class="history-entry-value">${log.value}</span>
                `;
                entriesDiv.appendChild(entry);
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
