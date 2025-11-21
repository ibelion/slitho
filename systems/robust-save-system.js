// ==================== ROBUST SAVE SYSTEM ====================
// Production-grade save/load with corruption protection

const RobustSaveSystem = {
    SAVE_VERSION: 3,
    BACKUP_SLOTS: 3,
    MAX_SAVE_SIZE: 1024 * 1024, // 1MB max
    
    // Save data structure
    saveData: null,
    backups: [],
    
    // Initialize
    init: function() {
        this.loadBackups();
        this.loadSaveData();
        this.validateAndRepair();
        this.createBackup();
    },
    
    // Load save data with corruption checks
    loadSaveData: function() {
        try {
            const saved = localStorage.getItem('snakeGameSave');
            if (!saved) {
                this.saveData = this.createDefaultSave();
                return;
            }
            
            // Check size
            if (saved.length > this.MAX_SAVE_SIZE) {
                console.warn('Save file too large, creating new save');
                this.saveData = this.createDefaultSave();
                return;
            }
            
            const parsed = DefensiveUtils.safeParseJSON(saved, null);
            if (!parsed) {
                console.warn('Failed to parse save data, using backup');
                return this.loadFromBackup();
            }
            
            // Version check
            if (!parsed.version || parsed.version < 1) {
                console.warn('Invalid save version, migrating...');
                parsed.version = this.SAVE_VERSION;
            }
            
            // Validate structure
            if (!this.validateSaveStructure(parsed)) {
                console.warn('Save structure invalid, attempting repair...');
                parsed = this.repairSaveData(parsed);
                // Re-validate after repair
                if (!this.validateSaveStructure(parsed)) {
                    console.warn('Repair failed, using default save');
                    this.saveData = this.createDefaultSave();
                    return;
                }
            }
            
            this.saveData = parsed;
            this.migrateIfNeeded();
            
        } catch (e) {
            console.error('Error loading save data:', e);
            this.saveData = this.loadFromBackup() || this.createDefaultSave();
        }
    },
    
    // Validate save structure
    validateSaveStructure: function(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.version || typeof data.version !== 'number') return false;
        
        // Check required fields
        const required = ['progression', 'skillTree', 'settings'];
        for (const field of required) {
            if (!data[field] || typeof data[field] !== 'object') {
                return false;
            }
        }
        
        // Validate progression
        if (!Array.isArray(data.progression.unlockedLevels)) return false;
        if (!data.progression.unlockedLevels.includes(1)) return false; // Level 1 must be unlocked
        
        // Validate skill tree
        if (typeof data.skillTree.skillPoints !== 'number') return false;
        if (data.skillTree.skillPoints < 0) return false;
        
        return true;
    },
    
    // Repair corrupted save data
    repairSaveData: function(data) {
        const repaired = {
            version: this.SAVE_VERSION,
            progression: DefensiveUtils.validateObject(data.progression, {
                unlockedLevels: [1],
                highestLevel: 1,
                unlockedWorlds: [1],
                completedWorlds: [],
                levelBestTimes: {},
                levelRanks: {}
            }),
            skillTree: DefensiveUtils.validateObject(data.skillTree, {
                skillPoints: 0,
                purchasedSkills: {}
            }),
            settings: DefensiveUtils.validateObject(data.settings, {
                theme: 'dark',
                muted: false,
                highContrast: false
            }),
            inventory: DefensiveUtils.validateObject(data.inventory, {}),
            achievements: DefensiveUtils.validateObject(data.achievements, {}),
            skins: DefensiveUtils.validateObject(data.skins, {
                snake: 'default',
                food: 'default',
                unlocked: []
            })
        };
        
        // Ensure Level 1 is unlocked
        if (!repaired.progression.unlockedLevels.includes(1)) {
            repaired.progression.unlockedLevels.push(1);
        }
        
        // Ensure World 1 is unlocked
        if (!repaired.progression.unlockedWorlds.includes(1)) {
            repaired.progression.unlockedWorlds.push(1);
        }
        
        // Validate skill points
        repaired.skillTree.skillPoints = DefensiveUtils.validateNumber(
            repaired.skillTree.skillPoints, 0, Infinity, 0
        );
        
        return repaired;
    },
    
    // Create default save
    createDefaultSave: function() {
        return {
            version: this.SAVE_VERSION,
            progression: {
                unlockedLevels: [1],
                highestLevel: 1,
                unlockedWorlds: [1],
                completedWorlds: [],
                levelBestTimes: {},
                levelRanks: {}
            },
            skillTree: {
                skillPoints: 0,
                purchasedSkills: {}
            },
            settings: {
                theme: 'dark',
                muted: false,
                highContrast: false,
                easingMode: 'smoothstep',
                showGhostReplay: false
            },
            inventory: {},
            achievements: {},
            skins: {
                snake: 'default',
                food: 'default',
                unlocked: []
            }
        };
    },
    
    // Save with validation
    save: function() {
        try {
            // Collect data from all systems
            const data = {
                version: this.SAVE_VERSION,
                progression: this.collectProgressionData(),
                skillTree: this.collectSkillTreeData(),
                settings: this.collectSettingsData(),
                inventory: this.collectInventoryData(),
                achievements: this.collectAchievementsData(),
                skins: this.collectSkinsData()
            };
            
            // Validate before saving
            if (!this.validateSaveStructure(data)) {
                console.error('Save data validation failed, attempting repair...');
                data = this.repairSaveData(data);
            }
            
            // Check size
            const json = DefensiveUtils.safeStringify(data, '{}');
            if (json.length > this.MAX_SAVE_SIZE) {
                console.error('Save data too large, truncating...');
                // Remove non-essential data
                data.ghostReplays = {};
            }
            
            // Save to localStorage
            localStorage.setItem('snakeGameSave', json);
            this.saveData = data;
            
            // Create backup
            this.createBackup();
            
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    },
    
    // Create backup
    createBackup: function() {
        try {
            if (!this.saveData) return;
            
            const backup = {
                timestamp: Date.now(),
                data: JSON.parse(JSON.stringify(this.saveData)) // Deep copy
            };
            
            this.backups.push(backup);
            
            // Keep only last N backups
            if (this.backups.length > this.BACKUP_SLOTS) {
                this.backups.shift();
            }
            
            // Save backups to localStorage
            localStorage.setItem('snakeGameSaveBackups', DefensiveUtils.safeStringify(this.backups, '[]'));
        } catch (e) {
            console.error('Failed to create backup:', e);
        }
    },
    
    // Load backups
    loadBackups: function() {
        try {
            const saved = localStorage.getItem('snakeGameSaveBackups');
            if (saved) {
                this.backups = DefensiveUtils.safeParseJSON(saved, []);
            }
        } catch (e) {
            console.error('Failed to load backups:', e);
            this.backups = [];
        }
    },
    
    // Load from backup
    loadFromBackup: function() {
        if (this.backups.length === 0) {
            return null;
        }
        
        // Get most recent backup
        const backup = this.backups[this.backups.length - 1];
        if (backup && backup.data) {
            console.log('Loading from backup (timestamp: ' + new Date(backup.timestamp).toLocaleString() + ')');
            return backup.data;
        }
        
        return null;
    },
    
    // Restore from backup
    restoreBackup: function(index) {
        if (index < 0 || index >= this.backups.length) {
            return false;
        }
        
        const backup = this.backups[index];
        if (backup && backup.data) {
            this.saveData = backup.data;
            this.save();
            return true;
        }
        
        return false;
    },
    
    // Migrate save if needed
    migrateIfNeeded: function() {
        if (!this.saveData || this.saveData.version >= this.SAVE_VERSION) {
            return;
        }
        
        console.log(`Migrating save from version ${this.saveData.version} to ${this.SAVE_VERSION}`);
        
        // Create backup before migration
        this.createBackup();
        
        // Migration logic - step by step
        let currentVersion = this.saveData.version || 1;
        
        while (currentVersion < this.SAVE_VERSION) {
            switch (currentVersion) {
                case 1:
                    // Migration to v2: Add skill tree structure
                    this.saveData.skillTree = this.saveData.skillTree || {
                        skillPoints: 0,
                        purchasedSkills: {},
                        unlockedBranches: []
                    };
                    currentVersion = 2;
                    break;
                    
                case 2:
                    // Migration to v3: Add settings structure
                    this.saveData.settings = this.saveData.settings || {
                        theme: 'dark',
                        muted: false,
                        highContrast: false,
                        easingMode: 'smoothstep',
                        showGhostReplay: false
                    };
                    currentVersion = 3;
                    break;
                    
                default:
                    // Unknown version, skip to latest
                    currentVersion = this.SAVE_VERSION;
                    break;
            }
        }
        
        this.saveData.version = this.SAVE_VERSION;
        this.save();
    },
    
    // Validate and repair
    validateAndRepair: function() {
        if (!this.saveData) {
            this.saveData = this.createDefaultSave();
            return;
        }
        
        if (!this.validateSaveStructure(this.saveData)) {
            console.warn('Save data invalid, repairing...');
            this.saveData = this.repairSaveData(this.saveData);
            this.save();
        }
    },
    
    // Collect data from systems
    collectProgressionData: function() {
        if (!window.Progression) return this.createDefaultSave().progression;
        
        try {
            return {
                unlockedLevels: window.Progression.getAllLevels()
                    .filter(l => l.unlocked)
                    .map(l => l.id),
                highestLevel: window.Progression.getHighestUnlockedLevel() || 1,
                unlockedWorlds: window.Progression.getAllWorlds()
                    .filter(w => w.unlocked)
                    .map(w => w.id),
                completedWorlds: window.Progression.getAllWorlds()
                    .filter(w => w.completed)
                    .map(w => w.id),
                levelBestTimes: {},
                levelRanks: {}
            };
        } catch (e) {
            console.error('Error collecting progression data:', e);
            return this.createDefaultSave().progression;
        }
    },
    
    collectSkillTreeData: function() {
        if (!window.SkillTree) return this.createDefaultSave().skillTree;
        
        try {
            return {
                skillPoints: DefensiveUtils.validateNumber(window.SkillTree.getSkillPoints(), 0, Infinity, 0),
                purchasedSkills: {}
            };
        } catch (e) {
            console.error('Error collecting skill tree data:', e);
            return this.createDefaultSave().skillTree;
        }
    },
    
    collectSettingsData: function() {
        return {
            theme: localStorage.getItem('snakeTheme') || 'dark',
            muted: localStorage.getItem('snakeMuted') === 'true',
            highContrast: localStorage.getItem('highContrastMode') === 'true',
            easingMode: localStorage.getItem('snakeEasingMode') || 'smoothstep',
            showGhostReplay: localStorage.getItem('showGhostReplay') === 'true'
        };
    },
    
    collectInventoryData: function() {
        return {};
    },
    
    collectAchievementsData: function() {
        return {};
    },
    
    collectSkinsData: function() {
        return {
            snake: localStorage.getItem('currentSnakeSkin') || 'default',
            food: localStorage.getItem('currentFoodSkin') || 'default',
            unlocked: []
        };
    },
    
    // Reset all data
    reset: function() {
        if (!confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            return false;
        }
        
        localStorage.removeItem('snakeGameSave');
        localStorage.removeItem('snakeGameSaveBackups');
        this.saveData = this.createDefaultSave();
        this.backups = [];
        this.save();
        
        return true;
    },
    
    // Get save data
    getData: function() {
        return this.saveData ? JSON.parse(JSON.stringify(this.saveData)) : null;
    },
    
    // Get backup list
    getBackups: function() {
        return this.backups.map((b, i) => ({
            index: i,
            timestamp: b.timestamp,
            date: new Date(b.timestamp).toLocaleString()
        }));
    }
};

// Export
window.RobustSaveSystem = RobustSaveSystem;

