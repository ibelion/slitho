// ==================== CREATOR TOOLS FOUNDATION ====================
// Foundations for future community level editor and mod support

const CreatorTools = {
    // Level editor state
    editorMode: false,
    currentLevel: null,
    
    // Mod support
    mods: new Map(),
    modEnabled: new Map(),
    
    // Initialize
    init: function() {
        this.loadMods();
        this.setupEditorHooks();
    },
    
    // Load mods
    loadMods: function() {
        // Load mod manifest
        this.loadModManifest().then(manifest => {
            if (manifest && manifest.mods) {
                manifest.mods.forEach(mod => this.registerMod(mod));
            }
        });
    },
    
    // Load mod manifest
    loadModManifest: async function() {
        try {
            const response = await fetch('/mods/manifest.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            // No mods directory or manifest
        }
        return null;
    },
    
    // Register mod
    registerMod: function(mod) {
        if (!mod.id) {
            console.error('Mod missing id:', mod);
            return;
        }
        this.mods.set(mod.id, mod);
    },
    
    // Enable mod
    enableMod: function(modId) {
        const mod = this.mods.get(modId);
        if (!mod) {
            console.warn(`Mod not found: ${modId}`);
            return false;
        }
        
        // Load mod content
        this.loadModContent(mod).then(() => {
            this.modEnabled.set(modId, true);
            this.applyMod(mod);
        });
        
        return true;
    },
    
    // Load mod content
    loadModContent: async function(mod) {
        try {
            if (mod.levels) {
                for (const levelFile of mod.levels) {
                    const response = await fetch(`/mods/${mod.id}/${levelFile}`);
                    if (response.ok) {
                        const level = await response.json();
                        if (window.ContentRegistry) {
                            window.ContentRegistry.registerLevel(level);
                        }
                    }
                }
            }
            
            if (mod.skins) {
                for (const skinFile of mod.skins) {
                    const response = await fetch(`/mods/${mod.id}/${skinFile}`);
                    if (response.ok) {
                        const skin = await response.json();
                        if (window.CosmeticSystem) {
                            window.CosmeticSystem.registerSkin(skin);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to load mod content: ${mod.id}`, e);
        }
    },
    
    // Apply mod
    applyMod: function(mod) {
        // Mod-specific application logic
        console.log(`Mod enabled: ${mod.id}`);
    },
    
    // Setup editor hooks
    setupEditorHooks: function() {
        // Expose editor API
        window.LevelEditor = {
            start: () => this.startEditor(),
            stop: () => this.stopEditor(),
            save: (levelData) => this.saveLevel(levelData),
            load: (levelId) => this.loadLevel(levelId)
        };
    },
    
    // Start editor
    startEditor: function() {
        this.editorMode = true;
        console.log('Level editor started');
    },
    
    // Stop editor
    stopEditor: function() {
        this.editorMode = false;
        console.log('Level editor stopped');
    },
    
    // Save level
    saveLevel: function(levelData) {
        // Export level as JSON
        const json = JSON.stringify(levelData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `level_${levelData.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Load level
    loadLevel: function(levelId) {
        // Load level from registry
        if (window.ContentRegistry) {
            return window.ContentRegistry.getLevel(levelId);
        }
        return null;
    },
    
    // Create custom challenge
    createCustomChallenge: function(config) {
        return {
            id: `custom_${Date.now()}`,
            name: config.name || 'Custom Challenge',
            description: config.description || '',
            modifiers: config.modifiers || {},
            rewards: config.rewards || {},
            seed: config.seed || Math.floor(Math.random() * 1000000)
        };
    },
    
    // Validate level data
    validateLevelData: function(levelData) {
        const required = ['id', 'name'];
        for (const field of required) {
            if (!levelData[field]) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        return { valid: true };
    },
    
    // Get enabled mods
    getEnabledMods: function() {
        return Array.from(this.modEnabled.keys());
    },
    
    // Check if mod is enabled
    isModEnabled: function(modId) {
        return this.modEnabled.has(modId);
    }
};

// Export
window.CreatorTools = CreatorTools;

