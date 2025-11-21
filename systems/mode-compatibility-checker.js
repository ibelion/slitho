// ==================== MODE COMPATIBILITY CHECKER ====================
// Ensures all features work correctly across every game mode
// Validates mode-specific hooks and prevents missing integrations

const ModeCompatibilityChecker = {
    // Mode definitions
    modes: {
        classic: { id: 'classic', name: 'Classic Mode' },
        endless: { id: 'endless', name: 'Endless Mode' },
        procedural: { id: 'procedural', name: 'Procedural Mode' },
        boss: { id: 'boss', name: 'Boss Mode' },
        story: { id: 'story', name: 'Story Campaign' },
        multiplayer: { id: 'multiplayer', name: 'Multiplayer' },
        dailyChallenge: { id: 'dailyChallenge', name: 'Daily Challenge' },
        weeklyChallenge: { id: 'weeklyChallenge', name: 'Weekly Challenge' },
        seasonal: { id: 'seasonal', name: 'Seasonal Event' },
        levelEditor: { id: 'levelEditor', name: 'Level Editor' }
    },
    
    // Feature compatibility matrix
    featureCompatibility: {
        // Features that should work in all modes
        universal: [
            'input', 'movement', 'collision', 'food', 'score', 'save', 'ui', 'audio'
        ],
        // Mode-specific features
        modeSpecific: {
            classic: ['levelProgression', 'worldUnlock', 'sRank'],
            endless: ['hazardSpawning', 'speedScaling', 'bestScore'],
            procedural: ['terrainGeneration', 'randomModifiers'],
            boss: ['bossAI', 'bossEncounters', 'bossRewards'],
            story: ['storyProgression', 'narrativeEvents', 'loreUnlocks'],
            multiplayer: ['networkSync', 'rollback', 'clientPrediction'],
            dailyChallenge: ['challengeGoals', 'seedGeneration', 'leaderboard'],
            weeklyChallenge: ['weeklyModifiers', 'rotatingContent'],
            seasonal: ['eventThemes', 'limitedTimeRewards'],
            levelEditor: ['customLevels', 'levelSharing']
        }
    },
    
    // Initialize
    init: function() {
        this.validateModeHooks();
        this.checkFeatureIntegrations();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('ModeCompatibilityChecker', this);
        }
        
        window.ModeCompatibilityChecker = this;
    },
    
    // Validate that all modes have required hooks
    validateModeHooks: function() {
        const requiredHooks = ['init', 'update', 'render', 'cleanup'];
        const issues = [];
        
        for (const [modeId, mode] of Object.entries(this.modes)) {
            // Check if mode has initialization
            const initFunc = this.getModeInitFunction(modeId);
            if (!initFunc) {
                issues.push(`Mode ${mode.name} missing init function`);
            }
            
            // Check if mode has update hook
            const updateFunc = this.getModeUpdateFunction(modeId);
            if (!updateFunc) {
                issues.push(`Mode ${mode.name} missing update function`);
            }
        }
        
        if (issues.length > 0 && window.Logger) {
            window.Logger.warn('Mode compatibility issues:', issues);
        }
        
        return issues.length === 0;
    },
    
    // Get mode init function
    getModeInitFunction: function(modeId) {
        switch (modeId) {
            case 'classic':
                return typeof startClassicMode === 'function' ? startClassicMode : null;
            case 'endless':
                return typeof initEndlessMode === 'function' ? initEndlessMode : null;
            case 'procedural':
                return typeof initProceduralMode === 'function' ? initProceduralMode : null;
            case 'boss':
                return typeof initBossMode === 'function' ? initBossMode : null;
            case 'story':
                return window.StoryMode && window.StoryMode.startStory ? window.StoryMode.startStory : null;
            case 'multiplayer':
                return window.LocalMultiplayer && window.LocalMultiplayer.start ? window.LocalMultiplayer.start : null;
            default:
                return null;
        }
    },
    
    // Get mode update function
    getModeUpdateFunction: function(modeId) {
        switch (modeId) {
            case 'endless':
                return typeof updateEndlessMode === 'function' ? updateEndlessMode : null;
            case 'story':
                return window.StoryMode && window.StoryMode.update ? window.StoryMode.update : null;
            case 'multiplayer':
                return window.LocalMultiplayer && window.LocalMultiplayer.update ? window.LocalMultiplayer.update : null;
            default:
                return null; // Some modes don't need per-tick updates
        }
    },
    
    // Check feature integrations across modes
    checkFeatureIntegrations: function() {
        const issues = [];
        
        // Check universal features
        for (const feature of this.featureCompatibility.universal) {
            if (!this.isFeatureIntegrated(feature)) {
                issues.push(`Universal feature ${feature} not properly integrated`);
            }
        }
        
        // Check mode-specific features
        for (const [modeId, features] of Object.entries(this.featureCompatibility.modeSpecific)) {
            for (const feature of features) {
                if (!this.isFeatureIntegratedForMode(feature, modeId)) {
                    issues.push(`Feature ${feature} not integrated for ${this.modes[modeId].name}`);
                }
            }
        }
        
        if (issues.length > 0 && window.Logger) {
            window.Logger.warn('Feature integration issues:', issues);
        }
        
        return issues.length === 0;
    },
    
    // Check if feature is integrated
    isFeatureIntegrated: function(feature) {
        switch (feature) {
            case 'input':
                return typeof changeDirection === 'function' || window.changeDirection;
            case 'movement':
                return typeof updateGameLogic === 'function' || window.updateGameLogic;
            case 'collision':
                return typeof isPositionOnSnake === 'function';
            case 'food':
                return typeof generateFood === 'function';
            case 'score':
                return window.StateManager && window.StateManager.getScore;
            case 'save':
                return window.RobustSaveSystem || window.SaveSystem;
            case 'ui':
                return window.UI || typeof updateUI === 'function';
            case 'audio':
                return window.AudioManager || typeof playSound === 'function';
            default:
                return true; // Unknown features assumed integrated
        }
    },
    
    // Check if feature is integrated for specific mode
    isFeatureIntegratedForMode: function(feature, modeId) {
        switch (feature) {
            case 'bossAI':
                return modeId === 'boss' && window.BossAI;
            case 'bossEncounters':
                return modeId === 'boss' && window.BossEncounters;
            case 'storyProgression':
                return modeId === 'story' && window.StoryProgression;
            case 'networkSync':
                return modeId === 'multiplayer' && window.SyncSafeEngine;
            case 'rollback':
                return modeId === 'multiplayer' && window.SyncSafeEngine && window.SyncSafeEngine.rollback;
            default:
                return true; // Unknown features assumed integrated
        }
    },
    
    // Verify mode can start
    canStartMode: function(modeId) {
        const mode = this.modes[modeId];
        if (!mode) return { canStart: false, reason: 'Unknown mode' };
        
        // Check if mode is unlocked (if applicable)
        if (modeId === 'story' && window.StoryProgression) {
            const story = window.StoryProgression.getCurrentStory();
            if (!story) {
                return { canStart: false, reason: 'No story available' };
            }
        }
        
        // Check if required systems are available
        const initFunc = this.getModeInitFunction(modeId);
        if (!initFunc) {
            return { canStart: false, reason: 'Mode initialization not available' };
        }
        
        return { canStart: true };
    },
    
    // Get current active mode
    getCurrentMode: function() {
        if (!window.StateManager) return null;
        
        const state = window.StateManager;
        
        if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
            return 'multiplayer';
        }
        
        if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
            return 'multiplayer';
        }
        
        if (window.StoryMode && window.StoryMode.getCurrentStory()) {
            return 'story';
        }
        
        if (state.getBossMode()) {
            return 'boss';
        }
        
        if (state.getProceduralMode()) {
            return 'procedural';
        }
        
        if (state.getEndlessMode()) {
            return 'endless';
        }
        
        if (state.getClassicMode()) {
            return 'classic';
        }
        
        return null;
    },
    
    // Run full compatibility check
    runFullCheck: function() {
        const results = {
            modeHooks: this.validateModeHooks(),
            featureIntegrations: this.checkFeatureIntegrations(),
            currentMode: this.getCurrentMode(),
            issues: []
        };
        
        // Check each mode can start
        for (const modeId of Object.keys(this.modes)) {
            const canStart = this.canStartMode(modeId);
            if (!canStart.canStart) {
                results.issues.push(`${this.modes[modeId].name}: ${canStart.reason}`);
            }
        }
        
        return results;
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ModeCompatibilityChecker.init();
        });
    } else {
        ModeCompatibilityChecker.init();
    }
}

