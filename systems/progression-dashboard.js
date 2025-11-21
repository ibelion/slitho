// ==================== PLAYER PROGRESSION DASHBOARD ====================
// Displays comprehensive player statistics, achievements, and progression

const ProgressionDashboard = {
    stats: {
        highScore: 0,
        totalGames: 0,
        playStreak: 0,
        lastPlayDate: null,
        achievementsUnlocked: 0,
        levelsCompleted: 0,
        itemsUnlocked: 0,
        totalPlayTime: 0,
        playerLevel: 1,
        playerXP: 0
    },
    TOTAL_LEVELS: 20, // Default, will try to get from game
    
    init: function() {
        this.loadStats();
        this.checkPlayStreak();
        this.createDashboardModal();
        this.setupButton();
    },
    
    loadStats: function() {
        // Load saved stats
        const saved = localStorage.getItem('progressionDashboardStats');
        if (saved) {
            try {
                this.stats = { ...this.stats, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load dashboard stats:', e);
            }
        }
        
        // Pull from existing game systems
        const progressionData = localStorage.getItem('progressionData');
        if (progressionData) {
            try {
                const data = JSON.parse(progressionData);
                this.stats.levelsCompleted = Array.isArray(data.unlockedLevels) ? data.unlockedLevels.length : 0;
                this.stats.highestLevel = data.highestLevel || 1;
            } catch (e) {
                console.warn('Failed to parse progression data:', e);
            }
        }
        
        // Get TOTAL_LEVELS from various sources
        if (typeof TOTAL_LEVELS !== 'undefined') {
            this.TOTAL_LEVELS = TOTAL_LEVELS;
        } else if (window.TOTAL_LEVELS) {
            this.TOTAL_LEVELS = window.TOTAL_LEVELS;
        } else if (window.Progression && window.Progression.TOTAL_LEVELS) {
            this.TOTAL_LEVELS = window.Progression.TOTAL_LEVELS;
        }
        
        // High score
        const bestScore = localStorage.getItem('bestEndlessScore');
        if (bestScore) {
            this.stats.highScore = parseInt(bestScore) || 0;
        }
        
        // Games played - try multiple sources
        let gamesPlayed = 0;
        if (typeof gamesPlayed !== 'undefined' && typeof gamesPlayed === 'number') {
            gamesPlayed = window.gamesPlayed;
        }
        // Fallback: estimate from achievements or other data
        if (gamesPlayed === 0) {
            // Try to infer from other stats
            const achievements = this.getAchievements();
            const veteranAchievement = achievements.find(a => a.id === 'veteran');
            if (veteranAchievement && veteranAchievement.unlocked) {
                gamesPlayed = 10; // At least 10 if veteran is unlocked
            }
        }
        this.stats.totalGames = gamesPlayed;
        
        // Player level and XP
        const playerLevel = localStorage.getItem('playerLevel');
        const playerXP = localStorage.getItem('playerXP');
        if (playerLevel) this.stats.playerLevel = parseInt(playerLevel) || 1;
        if (playerXP) this.stats.playerXP = parseInt(playerXP) || 0;
        
        // Items unlocked
        const inventory = localStorage.getItem('snakeInventory');
        const skins = localStorage.getItem('snakeSkins');
        let itemsCount = 0;
        if (inventory) {
            try {
                const inv = JSON.parse(inventory);
                itemsCount += Object.keys(inv).length;
            } catch (e) {}
        }
        if (skins) {
            try {
                const skinData = JSON.parse(skins);
                if (Array.isArray(skinData)) {
                    itemsCount += skinData.filter(s => s.unlocked).length;
                }
            } catch (e) {}
        }
        this.stats.itemsUnlocked = itemsCount;
        
        // Achievements
        const achievements = this.getAchievements();
        this.stats.achievementsUnlocked = achievements.filter(a => a.unlocked).length;
    },
    
    getAchievements: function() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to parse achievements:', e);
            }
        }
        return [];
    },
    
    saveStats: function() {
        try {
            localStorage.setItem('progressionDashboardStats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Failed to save dashboard stats:', e);
        }
    },
    
    checkPlayStreak: function() {
        const today = new Date().toDateString();
        const lastDate = this.stats.lastPlayDate;
        
        if (!lastDate) {
            this.stats.playStreak = 1;
        } else if (lastDate === today) {
            // Already played today, no change
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate === yesterday.toDateString()) {
                this.stats.playStreak++;
            } else {
                this.stats.playStreak = 1;
            }
        }
        
        this.stats.lastPlayDate = today;
        this.saveStats();
    },
    
    createDashboardModal: function() {
        if (document.getElementById('progressionDashboardModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'progressionDashboardModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>📊 Player Dashboard</h2>
                    <button class="modal-close" id="progressionDashboardClose" aria-label="Close Dashboard">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="progressionDashboardContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Register close button
        const closeBtn = document.getElementById('progressionDashboardClose');
        if (closeBtn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('progressionDashboardClose', () => {
                    window.UnifiedButtonHandler.closeModal('progressionDashboardModal');
                });
            } else {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
        }
    },
    
    setupButton: function() {
        // Add button to mode select screen or header
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) return;
        
        // Check if button already exists
        let btn = document.getElementById('progressionDashboardBtn');
        
        if (!btn) {
            // Create button if it doesn't exist
            const modeSelectContent = modeSelectScreen.querySelector('.mode-select-content');
            if (!modeSelectContent) return;
            
            btn = document.createElement('button');
            btn.id = 'progressionDashboardBtn';
            btn.className = 'btn';
            btn.innerHTML = '📊 Dashboard';
            btn.style.cssText = 'margin-top: var(--spacing-md);';
            btn.setAttribute('aria-label', 'Open Player Dashboard');
            
            // Insert after mode-buttons or at end
            const modeButtons = modeSelectContent.querySelector('.mode-buttons');
            if (modeButtons && modeButtons.nextSibling) {
                modeSelectContent.insertBefore(btn, modeButtons.nextSibling);
            } else {
                modeSelectContent.appendChild(btn);
            }
        }
        
        // Always register click handler (even if button already existed)
        if (!btn) {
            console.warn('[ProgressionDashboard] Button not found for setup');
            return;
        }
        
        const showDashboard = () => {
            console.log('[ProgressionDashboard] Showing dashboard');
            this.show();
        };
        
        // Try to register with UnifiedButtonHandler first
        let registeredWithHandler = false;
        if (window.UnifiedButtonHandler && typeof window.UnifiedButtonHandler.registerButton === 'function') {
            try {
                registeredWithHandler = window.UnifiedButtonHandler.registerButton('progressionDashboardBtn', showDashboard);
                if (registeredWithHandler) {
                    console.log('[ProgressionDashboard] Registered with UnifiedButtonHandler');
                } else {
                    console.warn('[ProgressionDashboard] Failed to register with UnifiedButtonHandler');
                }
            } catch (e) {
                console.warn('[ProgressionDashboard] Error registering with UnifiedButtonHandler:', e);
            }
        }
        
        // Add direct event listener only if UnifiedButtonHandler registration failed
        if (!registeredWithHandler) {
            console.log('[ProgressionDashboard] Adding direct click handler as fallback');
            const currentBtn = document.getElementById('progressionDashboardBtn');
            if (currentBtn) {
                // Remove any existing direct listeners by cloning
                const newBtn = currentBtn.cloneNode(true);
                if (currentBtn.parentNode) {
                    currentBtn.parentNode.replaceChild(newBtn, currentBtn);
                }
                
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[ProgressionDashboard] Direct click handler triggered');
                    showDashboard();
                };
                
                newBtn.addEventListener('click', clickHandler);
                console.log('[ProgressionDashboard] Direct click handler added');
            }
        } else {
            console.log('[ProgressionDashboard] Using UnifiedButtonHandler, skipping direct listener');
        }
    },
    
    render: function() {
        const content = document.getElementById('progressionDashboardContent');
        if (!content) return;
        
        this.loadStats();
        
        const levelsCompleted = this.stats.levelsCompleted || 0;
        const totalLevels = this.TOTAL_LEVELS || 20;
        const progressPercent = (levelsCompleted / totalLevels) * 100;
        const circumference = 2 * Math.PI * 50; // radius = 50
        const offset = circumference - (progressPercent / 100) * circumference;
        
        const achievements = this.getAchievements();
        const unlockedAchievements = achievements.filter(a => a.unlocked);
        const recentAchievements = unlockedAchievements.slice(-5).reverse();
        
        content.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">🏆</div>
                    <div class="dashboard-card-content">
                        <h3>High Score</h3>
                        <div class="dashboard-stat-large">${this.stats.highScore}</div>
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">🔥</div>
                    <div class="dashboard-card-content">
                        <h3>Play Streak</h3>
                        <div class="dashboard-stat-large">${this.stats.playStreak} days</div>
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">🎮</div>
                    <div class="dashboard-card-content">
                        <h3>Games Played</h3>
                        <div class="dashboard-stat-large">${this.stats.totalGames}</div>
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">⭐</div>
                    <div class="dashboard-card-content">
                        <h3>Achievements</h3>
                        <div class="dashboard-stat-large">${this.stats.achievementsUnlocked}/${achievements.length}</div>
                    </div>
                </div>
                
                <div class="dashboard-card dashboard-card-wide">
                    <h3>Level Progression</h3>
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring-circle-bg" cx="60" cy="60" r="50" fill="none" stroke-width="8"></circle>
                            <circle class="progress-ring-circle" cx="60" cy="60" r="50" fill="none" stroke-width="8" 
                                    stroke-dasharray="${circumference}" 
                                    stroke-dashoffset="${offset}"></circle>
                        </svg>
                        <div class="progress-ring-text">${levelsCompleted}/${totalLevels}</div>
                    </div>
                    <p style="text-align: center; color: var(--text-secondary); margin-top: var(--spacing-sm);">
                        ${this.stats.highestLevel ? `Highest Level: ${this.stats.highestLevel}` : ''}
                    </p>
                </div>
                
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">🎨</div>
                    <div class="dashboard-card-content">
                        <h3>Items Unlocked</h3>
                        <div class="dashboard-stat-large">${this.stats.itemsUnlocked}</div>
                    </div>
                </div>
                
                ${this.stats.playerLevel > 1 ? `
                <div class="dashboard-card">
                    <div class="dashboard-card-icon">📈</div>
                    <div class="dashboard-card-content">
                        <h3>Player Level</h3>
                        <div class="dashboard-stat-large">${this.stats.playerLevel}</div>
                        <div style="font-size: var(--font-sm); color: var(--text-secondary);">${this.stats.playerXP} XP</div>
                    </div>
                </div>
                ` : ''}
                
                <div class="dashboard-card dashboard-card-wide">
                    <h3>Recent Achievements</h3>
                    <div id="dashboardAchievementsList" class="achievements-list">
                        ${this.renderAchievementsList(recentAchievements)}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderAchievementsList: function(achievements) {
        if (!achievements || achievements.length === 0) {
            return '<p style="color: var(--text-secondary); text-align: center; padding: var(--spacing-md);">No achievements yet. Keep playing!</p>';
        }
        
        return achievements.map(ach => `
            <div class="achievement-item">
                <span class="achievement-icon">${ach.icon || '🏆'}</span>
                <div>
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc || ''}</div>
                </div>
            </div>
        `).join('');
    },
    
    show: function() {
        this.render();
        const modal = document.getElementById('progressionDashboardModal');
        if (modal) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.openModal('progressionDashboardModal');
            } else {
                modal.classList.add('show');
            }
        }
    }
};

// Export
window.ProgressionDashboard = ProgressionDashboard;

