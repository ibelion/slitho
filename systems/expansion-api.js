// ==================== EXPANSION API ====================
// Safe expansion API layer for future content and features
// Provides hooks for mods, plugins, and content updates without breaking core

const ExpansionAPI = {
    // Registered hooks
    hooks: {
        beforeGameUpdate: [],
        afterGameUpdate: [],
        beforeRender: [],
        afterRender: [],
        onFoodSpawn: [],
        onFoodEaten: [],
        onSnakeMove: [],
        onLevelComplete: [],
        onGameOver: [],
        onModeStart: [],
        onModeEnd: [],
        onBossSpawn: [],
        onBossDefeat: [],
        onStoryEvent: []
    },
    
    // Content registries (delegates to ContentRegistry)
    contentRegistries: {
        worlds: null,
        levels: null,
        biomes: null,
        powerUps: null,
        enemies: null,
        hazards: null,
        themes: null
    },
    
    // Initialize
    init: function() {
        // Link to ContentRegistry if available
        if (window.ContentRegistry) {
            this.contentRegistries.worlds = window.ContentRegistry.worlds;
            this.contentRegistries.levels = window.ContentRegistry.levels;
            this.contentRegistries.biomes = window.ContentRegistry.biomes;
            this.contentRegistries.powerUps = window.ContentRegistry.powerUps;
            this.contentRegistries.enemies = window.ContentRegistry.enemies;
            this.contentRegistries.hazards = window.ContentRegistry.hazards;
            this.contentRegistries.themes = window.ContentRegistry.themes;
        }
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('ExpansionAPI', this);
        }
        
        window.ExpansionAPI = this;
    },
    
    // Register hook
    registerHook: function(hookName, callback, priority = 100) {
        if (!this.hooks[hookName]) {
            console.warn(`Unknown hook: ${hookName}`);
            return false;
        }
        
        this.hooks[hookName].push({
            callback: callback,
            priority: priority
        });
        
        // Sort by priority (higher priority first)
        this.hooks[hookName].sort((a, b) => b.priority - a.priority);
        
        return true;
    },
    
    // Unregister hook
    unregisterHook: function(hookName, callback) {
        if (!this.hooks[hookName]) return false;
        
        const index = this.hooks[hookName].findIndex(h => h.callback === callback);
        if (index > -1) {
            this.hooks[hookName].splice(index, 1);
            return true;
        }
        
        return false;
    },
    
    // Trigger hook
    triggerHook: function(hookName, ...args) {
        if (!this.hooks[hookName]) return;
        
        for (const hook of this.hooks[hookName]) {
            try {
                hook.callback(...args);
            } catch (e) {
                console.error(`Error in hook ${hookName}:`, e);
                // Continue with other hooks even if one fails
            }
        }
    },
    
    // Register content (delegates to ContentRegistry)
    registerContent: function(type, content) {
        if (!this.contentRegistries[type]) {
            console.warn(`Unknown content type: ${type}`);
            return false;
        }
        
        if (window.ContentRegistry) {
            switch (type) {
                case 'worlds':
                    return window.ContentRegistry.registerWorld(content);
                case 'levels':
                    return window.ContentRegistry.registerLevel(content);
                case 'biomes':
                    return window.ContentRegistry.registerBiome(content);
                case 'powerUps':
                    return window.ContentRegistry.registerPowerUp(content);
                case 'enemies':
                    return window.ContentRegistry.registerEnemy(content);
                case 'hazards':
                    return window.ContentRegistry.registerHazard(content);
                case 'themes':
                    return window.ContentRegistry.registerTheme(content);
                default:
                    return false;
            }
        }
        
        return false;
    },
    
    // Get RNG abstraction (for deterministic randomness)
    getRNG: function() {
        if (window.SyncSafeEngine && window.SyncSafeEngine.getSeededRandom) {
            return window.SyncSafeEngine.getSeededRandom();
        }
        return Math.random();
    },
    
    // Get input abstraction
    getInput: function() {
        if (window.UnifiedInputRouter) {
            return window.UnifiedInputRouter.getCurrentDirection();
        }
        return { dx: 0, dy: 0 };
    },
    
    // Get rendering abstraction
    getRenderer: function() {
        return window.Renderer || null;
    },
    
    // Safe state access
    getGameState: function() {
        if (window.StateManager) {
            return window.StateManager.getStateSnapshot();
        }
        return null;
    },
    
    // Register custom event
    registerCustomEvent: function(eventName, handler) {
        if (window.EventController) {
            if (window.EventController.addEventListener) {
                window.EventController.addEventListener(eventName, handler);
                return true;
            }
        }
        return false;
    },
    
    // Trigger custom event
    triggerCustomEvent: function(eventName, data) {
        if (window.EventController && window.EventController.trigger) {
            window.EventController.trigger(eventName, data);
            return true;
        }
        return false;
    },
    
    // Get version info
    getVersion: function() {
        if (window.VersionManager) {
            return {
                gameVersion: window.VersionManager.gameVersion,
                contentVersion: window.VersionManager.contentVersion,
                saveVersion: window.VersionManager.saveVersion
            };
        }
        return { gameVersion: '1.0.0', contentVersion: '1.0.0', saveVersion: 1 };
    },
    
    // Check if feature is available
    isFeatureAvailable: function(featureName) {
        const featureMap = {
            'multiplayer': !!window.MultiplayerController,
            'story': !!window.StoryMode,
            'bossAI': !!window.BossAI,
            'touch': !!window.TouchInput,
            'gamepad': !!window.GamepadInput,
            'saveSync': !!window.SaveSync
        };
        
        return featureMap[featureName] || false;
    },
    
    // Get all available hooks
    getAvailableHooks: function() {
        return Object.keys(this.hooks);
    },
    
    // Clear all hooks (for cleanup)
    clearAllHooks: function() {
        for (const hookName of Object.keys(this.hooks)) {
            this.hooks[hookName] = [];
        }
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ExpansionAPI.init();
        });
    } else {
        ExpansionAPI.init();
    }
}

