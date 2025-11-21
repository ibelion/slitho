// ==================== VERSION MANAGER ====================
// Handles versioning, compatibility, and save file upgrades

const VersionManager = {
    // Current versions
    gameVersion: '1.0.0',
    contentVersion: '1.0.0',
    saveVersion: 3,
    
    // Version file
    versionFile: 'version.txt',
    
    // Initialize
    init: async function() {
        await this.loadVersionInfo();
        this.checkCompatibility();
    },
    
    // Load version info
    loadVersionInfo: async function() {
        try {
            const response = await fetch(this.versionFile);
            if (response.ok) {
                const text = await response.text();
                const lines = text.trim().split('\n');
                if (lines.length > 0) {
                    this.gameVersion = lines[0].trim();
                }
                if (lines.length > 1) {
                    this.contentVersion = lines[1].trim();
                }
            }
        } catch (e) {
            console.warn('Failed to load version file:', e);
        }
        
        // Also check content version from manifest
        if (window.ContentLoader && window.ContentLoader.manifest) {
            const manifest = window.ContentLoader.getManifest();
            if (manifest && manifest.version) {
                this.contentVersion = manifest.version;
            }
        }
    },
    
    // Check compatibility
    checkCompatibility: function() {
        // Check save file compatibility
        if (window.RobustSaveSystem) {
            const saveData = window.RobustSaveSystem.getData();
            if (saveData) {
                const compatibility = this.checkSaveCompatibility(saveData);
                if (!compatibility.compatible) {
                    console.warn('Save file compatibility issue:', compatibility.reason);
                    // Handle incompatibility
                    this.handleIncompatibility(compatibility);
                } else if (compatibility.needsUpgrade) {
                    this.upgradeSaveFile(saveData);
                }
            }
        }
    },
    
    // Check save compatibility
    checkSaveCompatibility: function(saveData) {
        if (!saveData || !saveData.version) {
            return { compatible: false, reason: 'Invalid save data' };
        }
        
        const saveVersion = saveData.version;
        const currentVersion = this.saveVersion;
        
        // Major version mismatch (incompatible)
        const saveMajor = Math.floor(saveVersion / 100);
        const currentMajor = Math.floor(currentVersion / 100);
        
        if (saveMajor > currentMajor) {
            return {
                compatible: false,
                reason: `Save file version (${saveVersion}) is newer than game version (${currentVersion})`
            };
        }
        
        if (saveMajor < currentMajor - 1) {
            return {
                compatible: false,
                reason: `Save file version (${saveVersion}) is too old (major version mismatch)`
            };
        }
        
        // Minor/patch version differences (upgradeable)
        if (saveVersion < currentVersion) {
            return {
                compatible: true,
                needsUpgrade: true,
                fromVersion: saveVersion,
                toVersion: currentVersion
            };
        }
        
        return { compatible: true, needsUpgrade: false };
    },
    
    // Handle incompatibility
    handleIncompatibility: function(compatibility) {
        // Show warning to user
        if (window.UI) {
            window.UI.showIncompatibilityWarning(compatibility.reason);
        }
        
        // Option to backup and reset
        if (window.RobustSaveSystem) {
            window.RobustSaveSystem.createBackup();
        }
    },
    
    // Upgrade save file
    upgradeSaveFile: function(saveData) {
        const fromVersion = saveData.version;
        const toVersion = this.saveVersion;
        
        console.log(`Upgrading save file from version ${fromVersion} to ${toVersion}`);
        
        // Apply migration steps
        for (let v = fromVersion + 1; v <= toVersion; v++) {
            this.migrateSaveVersion(saveData, v);
        }
        
        saveData.version = toVersion;
        
        // Save upgraded data
        if (window.RobustSaveSystem) {
            window.RobustSaveSystem.save();
        }
    },
    
    // Migrate save to specific version
    migrateSaveVersion: function(saveData, targetVersion) {
        switch (targetVersion) {
            case 2:
                // Migration to v2
                if (!saveData.progression) {
                    saveData.progression = {};
                }
                if (!saveData.progression.unlockedDifficulties) {
                    saveData.progression.unlockedDifficulties = ['normal'];
                }
                break;
                
            case 3:
                // Migration to v3
                if (saveData.skillTree && Array.isArray(saveData.skillTree.purchasedSkills)) {
                    const skillsObj = {};
                    saveData.skillTree.purchasedSkills.forEach(skillId => {
                        skillsObj[skillId] = true;
                    });
                    saveData.skillTree.purchasedSkills = skillsObj;
                }
                break;
                
            case 4:
                // Future migration example
                if (!saveData.metaProgression) {
                    saveData.metaProgression = {
                        mastery: {},
                        evolutions: [],
                        difficultyTiers: []
                    };
                }
                break;
                
            default:
                console.warn(`Unknown migration version: ${targetVersion}`);
        }
    },
    
    // Get version info
    getVersionInfo: function() {
        return {
            gameVersion: this.gameVersion,
            contentVersion: this.contentVersion,
            saveVersion: this.saveVersion
        };
    },
    
    // Compare versions
    compareVersions: function(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 < part2) return -1;
            if (part1 > part2) return 1;
        }
        
        return 0;
    },
    
    // Check if version is newer
    isNewerVersion: function(v1, v2) {
        return this.compareVersions(v1, v2) > 0;
    },
    
    // Get version string
    getVersionString: function() {
        return `${this.gameVersion} (Content: ${this.contentVersion})`;
    }
};

// Export
window.VersionManager = VersionManager;

