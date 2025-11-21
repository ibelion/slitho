// ==================== FEATURED DAILY CHALLENGE MODULE ====================
// Displays the current daily challenge prominently on the mode select screen
// Integrates with existing daily challenge system in game.js

const FeaturedChallenge = {
    enabled: true, // Toggle this to enable/disable the module
    currentChallenge: null,
    timerInterval: null,
    moduleElement: null,
    
    // Challenge difficulty mapping (for display purposes)
    difficultyMap: {
        'no_powerups': { difficulty: 'Medium', icon: '⚡', reward: '50 coins + XP boost' },
        'fog_survival': { difficulty: 'Hard', icon: '🌫️', reward: '75 coins + Achievement' },
        'boss_hunter': { difficulty: 'Hard', icon: '👹', reward: '100 coins + Rare skin' },
        'combo_master': { difficulty: 'Medium', icon: '🔥', reward: '60 coins' },
        'zoom_survivor': { difficulty: 'Hard', icon: '🔍', reward: '80 coins + Badge' }
    },
    
    init: function() {
        if (!this.enabled) return;
        
        // Wait for DOM and game.js to be loaded
        const checkReady = () => {
            const modeSelectScreen = document.getElementById('modeSelectScreen');
            if (modeSelectScreen && (typeof getDailyChallenge === 'function' || window.getDailyChallenge)) {
                this.loadChallenge();
                this.renderChallengeModule();
                this.startTimer();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkReady);
        } else {
            checkReady();
        }
        
        // Also check on window load
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!this.moduleElement) {
                    this.loadChallenge();
                    this.renderChallengeModule();
                    this.startTimer();
                }
            }, 500);
        });
    },
    
    loadChallenge: function() {
        // Use existing getDailyChallenge function from game.js
        let challenge = null;
        
        // Try multiple ways to access getDailyChallenge
        const getChallengeFn = typeof getDailyChallenge === 'function' ? getDailyChallenge :
                              (window.getDailyChallenge && typeof window.getDailyChallenge === 'function') ? window.getDailyChallenge :
                              null;
        
        if (getChallengeFn) {
            try {
                challenge = getChallengeFn();
            } catch (e) {
                console.warn('Failed to get daily challenge:', e);
            }
        }
        
        // Fallback: read from localStorage and reconstruct challenge
        if (!challenge) {
            const today = new Date().toDateString();
            const savedDate = localStorage.getItem('dailyChallengeDate');
            const seed = localStorage.getItem('dailyChallengeSeed');
            
            // Try to get DAILY_CHALLENGES from various sources
            let challenges = null;
            if (typeof DAILY_CHALLENGES !== 'undefined' && Array.isArray(DAILY_CHALLENGES)) {
                challenges = DAILY_CHALLENGES;
            } else if (window.DAILY_CHALLENGES && Array.isArray(window.DAILY_CHALLENGES)) {
                challenges = window.DAILY_CHALLENGES;
            }
            
            if (savedDate === today && seed && challenges && challenges.length > 0) {
                const challengeIndex = parseInt(seed) % challenges.length;
                challenge = challenges[challengeIndex];
            }
        }
        
        if (challenge) {
            this.currentChallenge = {
                ...challenge,
                difficulty: this.difficultyMap[challenge.id]?.difficulty || 'Medium',
                icon: this.difficultyMap[challenge.id]?.icon || '🎯',
                reward: this.difficultyMap[challenge.id]?.reward || 'Coins + Rewards'
            };
        }
    },
    
    getTimeUntilReset: function() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow - now;
    },
    
    formatTimeRemaining: function(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    },
    
    startTimer: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const updateTimer = () => {
            const timeLeft = this.getTimeUntilReset();
            const timerEl = document.getElementById('featuredChallengeTimer');
            if (timerEl) {
                timerEl.textContent = this.formatTimeRemaining(timeLeft);
            }
        };
        
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    },
    
    renderChallengeModule: function() {
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen || !this.currentChallenge) return;
        
        // Check if module already exists
        let module = document.getElementById('featuredChallengeModule');
        if (module) {
            this.moduleElement = module;
            this.updateModuleContent();
            return;
        }
        
        // Create module
        module = document.createElement('div');
        module.id = 'featuredChallengeModule';
        module.className = 'daily-challenge-module';
        this.moduleElement = module;
        
        this.updateModuleContent();
        
        // Insert before mode-buttons
        const modeSelectContent = modeSelectScreen.querySelector('.mode-select-content');
        const modeButtons = modeSelectContent.querySelector('.mode-buttons');
        
        if (modeSelectContent && modeButtons) {
            modeSelectContent.insertBefore(module, modeButtons);
        } else if (modeSelectContent) {
            modeSelectContent.appendChild(module);
        }
        
        // Setup play button
        const playBtn = document.getElementById('featuredChallengePlayBtn');
        if (playBtn && !playBtn._listenerRegistered) {
            playBtn._listenerRegistered = true;
            
            // Use UnifiedButtonHandler if available
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('featuredChallengePlayBtn', () => {
                    this.startChallenge();
                });
            } else {
                playBtn.addEventListener('click', () => {
                    this.startChallenge();
                });
            }
        }
    },
    
    updateModuleContent: function() {
        if (!this.moduleElement || !this.currentChallenge) return;
        
        const isCompleted = localStorage.getItem('dailyChallengeCompleted') === 'true';
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('dailyChallengeDate');
        const completedToday = savedDate === today && isCompleted;
        
        this.moduleElement.innerHTML = `
            <div class="daily-challenge-header">
                <h3>🎯 Daily Featured Challenge</h3>
                <span id="featuredChallengeTimer" class="daily-challenge-timer">--:--:--</span>
            </div>
            <div class="daily-challenge-content">
                <div class="daily-challenge-icon">${this.currentChallenge.icon}</div>
                <div class="daily-challenge-info">
                    <h4 id="featuredChallengeName">${this.currentChallenge.name}</h4>
                    <p id="featuredChallengeDesc">${this.currentChallenge.desc}</p>
                    <div class="daily-challenge-meta">
                        <span class="difficulty-badge difficulty-${this.currentChallenge.difficulty.toLowerCase()}">${this.currentChallenge.difficulty}</span>
                        <span class="reward-badge">${this.currentChallenge.reward}</span>
                        ${completedToday ? '<span class="completed-badge">✓ Completed</span>' : ''}
                    </div>
                </div>
            </div>
            <button id="featuredChallengePlayBtn" class="btn daily-challenge-btn" ${completedToday ? 'disabled' : ''}>
                ${completedToday ? '✓ Challenge Complete' : 'Play Now'}
            </button>
        `;
        
        // Re-setup play button
        const playBtn = document.getElementById('featuredChallengePlayBtn');
        if (playBtn && !playBtn._listenerRegistered) {
            playBtn._listenerRegistered = true;
            
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('featuredChallengePlayBtn', () => {
                    this.startChallenge();
                });
            } else {
                playBtn.addEventListener('click', () => {
                    this.startChallenge();
                });
            }
        }
    },
    
    startChallenge: function() {
        // Hide mode select
        if (typeof hideModeSelect === 'function') {
            hideModeSelect();
        } else if (window.hideModeSelect) {
            window.hideModeSelect();
        }
        
        // Activate daily challenge
        if (typeof window.dailyChallengeActive !== 'undefined') {
            window.dailyChallengeActive = true;
        }
        if (this.currentChallenge && typeof window.dailyChallenge !== 'undefined') {
            window.dailyChallenge = this.currentChallenge;
        }
        
        // Start the game - try different init methods
        if (typeof init === 'function') {
            init();
        } else if (typeof initEndlessMode === 'function') {
            initEndlessMode();
        } else if (window.init && typeof window.init === 'function') {
            window.init();
        } else if (window.initEndlessMode && typeof window.initEndlessMode === 'function') {
            window.initEndlessMode();
        }
        
        // Track challenge start
        localStorage.setItem('dailyChallengeActive', 'true');
    },
    
    // Public method to refresh the module
    refresh: function() {
        this.loadChallenge();
        if (this.moduleElement) {
            this.updateModuleContent();
        } else {
            this.renderChallengeModule();
        }
        this.startTimer();
    },
    
    // Cleanup
    destroy: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.moduleElement && this.moduleElement.parentNode) {
            this.moduleElement.parentNode.removeChild(this.moduleElement);
            this.moduleElement = null;
        }
    }
};

// Export
window.FeaturedChallenge = FeaturedChallenge;

