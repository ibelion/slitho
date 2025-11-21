// ==================== BATTERY OPTIMIZER ====================
// Battery optimization and low-power mode for mobile devices

const BatteryOptimizer = {
    // Configuration
    config: {
        enabled: true,
        lowPowerMode: false,
        reducedRefreshMode: false,
        dormantWhenUnfocused: true,
        targetFPSLowPower: 30,
        targetFPSNormal: 60,
        checkBatteryAPI: true
    },
    
    // State
    isLowPower: false,
    isDormant: false,
    batteryLevel: 1.0,
    isCharging: false,
    visibilityState: 'visible',
    lastUpdate: 0,
    updateInterval: null,
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.setupBatteryAPI();
        this.setupVisibilityListener();
        this.setupPageUnload();
        this.applyOptimizations();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('BatteryOptimizer', this);
        }
        
        window.BatteryOptimizer = this;
    },
    
    // Load settings from localStorage
    loadSettings: function() {
        const saved = localStorage.getItem('batteryOptimizerSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            } catch (e) {
                console.warn('Failed to load battery optimizer settings:', e);
            }
        }
    },
    
    // Save settings to localStorage
    saveSettings: function() {
        try {
            localStorage.setItem('batteryOptimizerSettings', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save battery optimizer settings:', e);
        }
    },
    
    // Setup Battery API monitoring
    setupBatteryAPI: function() {
        if (!this.config.checkBatteryAPI) return;
        
        // Check for Battery API support
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.updateBatteryStatus(battery);
                
                // Listen for battery level changes
                battery.addEventListener('levelchange', () => {
                    this.updateBatteryStatus(battery);
                });
                
                // Listen for charging changes
                battery.addEventListener('chargingchange', () => {
                    this.updateBatteryStatus(battery);
                });
            }).catch(err => {
                console.warn('Battery API not available:', err);
            });
        }
    },
    
    // Update battery status
    updateBatteryStatus: function(battery) {
        this.batteryLevel = battery.level;
        this.isCharging = battery.charging;
        
        // Auto-enable low power mode if battery is low and not charging
        if (this.batteryLevel < 0.2 && !this.isCharging && !this.isLowPower) {
            this.enableLowPowerMode();
        } else if (this.batteryLevel > 0.5 && this.isCharging && this.isLowPower) {
            this.disableLowPowerMode();
        }
    },
    
    // Setup visibility change listener
    setupVisibilityListener: function() {
        document.addEventListener('visibilitychange', () => {
            this.visibilityState = document.visibilityState;
            
            if (this.config.dormantWhenUnfocused) {
                if (this.visibilityState === 'hidden') {
                    this.enterDormantState();
                } else {
                    this.exitDormantState();
                }
            }
        });
    },
    
    // Setup page unload handler
    setupPageUnload: function() {
        window.addEventListener('beforeunload', () => {
            // Save state before unloading
            this.saveStateBeforeUnload();
        });
        
        // Handle page visibility for mobile
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
    },
    
    // Enter dormant state (page hidden/unfocused)
    enterDormantState: function() {
        if (this.isDormant) return;
        
        this.isDormant = true;
        
        // Reduce update frequency
        if (window.TickEngine) {
            window.TickEngine.setTargetFPS(10); // Very low FPS when hidden
        }
        
        // Pause audio
        if (window.AudioManager) {
            window.AudioManager.pauseAll();
        }
        
        // Reduce particle updates
        if (window.ParticleSystem) {
            window.ParticleSystem.setUpdateRate(0.1); // Update 10% of particles
        }
    },
    
    // Exit dormant state
    exitDormantState: function() {
        if (!this.isDormant) return;
        
        this.isDormant = false;
        
        // Restore update frequency
        const targetFPS = this.isLowPower ? this.config.targetFPSLowPower : this.config.targetFPSNormal;
        if (window.TickEngine) {
            window.TickEngine.setTargetFPS(targetFPS);
        }
        
        // Resume audio
        if (window.AudioManager) {
            window.AudioManager.resumeAll();
        }
        
        // Restore particle updates
        if (window.ParticleSystem) {
            window.ParticleSystem.setUpdateRate(1.0);
        }
    },
    
    // Enable low power mode
    enableLowPowerMode: function() {
        if (this.isLowPower) return;
        
        this.isLowPower = true;
        this.config.lowPowerMode = true;
        this.applyOptimizations();
        this.saveSettings();
        
        // Show notification
        this.showLowPowerNotification();
    },
    
    // Disable low power mode
    disableLowPowerMode: function() {
        if (!this.isLowPower) return;
        
        this.isLowPower = false;
        this.config.lowPowerMode = false;
        this.applyOptimizations();
        this.saveSettings();
    },
    
    // Apply optimizations
    applyOptimizations: function() {
        if (!this.config.enabled) return;
        
        // Set target FPS
        const targetFPS = this.isLowPower ? this.config.targetFPSLowPower : this.config.targetFPSNormal;
        if (window.TickEngine) {
            window.TickEngine.setTargetFPS(targetFPS);
        }
        
        // Reduce particles
        if (this.isLowPower && window.ParticleSystem) {
            const currentMax = window.ParticleSystem.getMaxParticles();
            window.ParticleSystem.setMaxParticles(Math.floor(currentMax * 0.5));
        }
        
        // Reduce visual effects
        if (this.isLowPower) {
            document.documentElement.classList.add('low-power-mode');
        } else {
            document.documentElement.classList.remove('low-power-mode');
        }
        
        // Apply reduced refresh mode
        if (this.config.reducedRefreshMode) {
            this.applyReducedRefresh();
        }
    },
    
    // Apply reduced refresh mode
    applyReducedRefresh: function() {
        // Reduce animation frame rate
        if (window.TickEngine) {
            window.TickEngine.setTargetFPS(30);
        }
        
        // Disable expensive visual effects
        document.documentElement.classList.add('reduced-refresh-mode');
    },
    
    // Remove reduced refresh mode
    removeReducedRefresh: function() {
        document.documentElement.classList.remove('reduced-refresh-mode');
        
        const targetFPS = this.isLowPower ? this.config.targetFPSLowPower : this.config.targetFPSNormal;
        if (window.TickEngine) {
            window.TickEngine.setTargetFPS(targetFPS);
        }
    },
    
    // Save state before unload
    saveStateBeforeUnload: function() {
        // Trigger save if available
        if (window.RobustSaveSystem && window.RobustSaveSystem.save) {
            try {
                window.RobustSaveSystem.save();
            } catch (e) {
                console.warn('Failed to save before unload:', e);
            }
        }
    },
    
    // Handle page hidden
    onPageHidden: function() {
        // Pause game if running
        if (window.StateManager && window.StateManager.getGameRunning()) {
            if (typeof togglePause === 'function') {
                togglePause();
            }
        }
        
        // Reduce background activity
        this.enterDormantState();
    },
    
    // Handle page visible
    onPageVisible: function() {
        // Exit dormant state
        this.exitDormantState();
    },
    
    // Show low power notification
    showLowPowerNotification: function() {
        // Create or update notification
        let notification = document.getElementById('lowPowerNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'lowPowerNotification';
            notification.className = 'low-power-notification';
            notification.innerHTML = `
                <span>🔋 Low Power Mode Enabled</span>
                <button onclick="this.parentElement.remove()">×</button>
            `;
            document.body.appendChild(notification);
        }
        
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    },
    
    // Toggle low power mode
    toggleLowPowerMode: function() {
        if (this.isLowPower) {
            this.disableLowPowerMode();
        } else {
            this.enableLowPowerMode();
        }
    },
    
    // Toggle reduced refresh mode
    toggleReducedRefresh: function() {
        this.config.reducedRefreshMode = !this.config.reducedRefreshMode;
        this.saveSettings();
        
        if (this.config.reducedRefreshMode) {
            this.applyReducedRefresh();
        } else {
            this.removeReducedRefresh();
        }
    },
    
    // Toggle enabled
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.saveSettings();
        this.applyOptimizations();
    },
    
    // Enable
    enable: function() {
        this.config.enabled = true;
        this.saveSettings();
        this.applyOptimizations();
    },
    
    // Disable
    disable: function() {
        this.config.enabled = false;
        this.saveSettings();
        this.exitDormantState();
        this.disableLowPowerMode();
    },
    
    // Get battery level
    getBatteryLevel: function() {
        return this.batteryLevel;
    },
    
    // Check if charging
    isChargingDevice: function() {
        return this.isCharging;
    },
    
    // Get configuration
    getConfig: function() {
        return { ...this.config };
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BatteryOptimizer.init());
} else {
    BatteryOptimizer.init();
}

