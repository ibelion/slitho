// ==================== CONTENT REGISTRY ====================
// Central registry for all game content (worlds, levels, biomes, power-ups, etc.)
// Allows adding new content without modifying core engine files

const ContentRegistry = {
    // Registries
    worlds: new Map(),
    levels: new Map(),
    biomes: new Map(),
    powerUps: new Map(),
    enemies: new Map(),
    hazards: new Map(),
    themes: new Map(),
    
    // Metadata
    version: '1.0.0',
    contentVersion: '1.0.0',
    
    // Initialize
    init: function() {
        this.loadDefaultContent();
        this.loadExternalContent();
    },
    
    // Load default content (built-in)
    loadDefaultContent: function() {
        // Default worlds
        this.registerWorld({
            id: 'world_1',
            name: 'Forest',
            description: 'The starting world',
            unlocked: true,
            levels: [1, 2, 3, 4, 5],
            biome: 'forest',
            theme: 'default'
        });
        
        // Default biomes
        this.registerBiome({
            id: 'forest',
            name: 'Forest',
            colorScheme: { bg: '#1a3a1a', snake: '#4CAF50', food: '#ff0000' },
            modifiers: {}
        });
        
        // Default power-ups (if not already registered)
        if (!this.powerUps.has('speed_boost')) {
            this.registerPowerUp({
                id: 'speed_boost',
                name: 'Speed Boost',
                duration: 5000,
                effect: { speedMultiplier: 1.5 }
            });
        }
    },
    
    // Load external content from JSON files
    loadExternalContent: async function() {
        try {
            // Load worlds
            await this.loadContentFiles('/content/worlds/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(world => this.registerWorld(world));
                } else {
                    this.registerWorld(data);
                }
            });
            
            // Load levels
            await this.loadContentFiles('/content/levels/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(level => this.registerLevel(level));
                } else {
                    this.registerLevel(data);
                }
            });
            
            // Load biomes
            await this.loadContentFiles('/content/biomes/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(biome => this.registerBiome(biome));
                } else {
                    this.registerBiome(data);
                }
            });
            
            // Load power-ups
            await this.loadContentFiles('/content/powerups/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(powerUp => this.registerPowerUp(powerUp));
                } else {
                    this.registerPowerUp(data);
                }
            });
            
            // Load enemies
            await this.loadContentFiles('/content/enemies/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(enemy => this.registerEnemy(enemy));
                } else {
                    this.registerEnemy(data);
                }
            });
            
            // Load hazards
            await this.loadContentFiles('/content/hazards/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(hazard => this.registerHazard(hazard));
                } else {
                    this.registerHazard(data);
                }
            });
            
            // Load themes
            await this.loadContentFiles('/content/themes/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(theme => this.registerTheme(theme));
                } else {
                    this.registerTheme(data);
                }
            });
            
        } catch (e) {
            console.warn('Failed to load external content:', e);
        }
    },
    
    // Load content files (simplified - in real implementation would use fetch)
    loadContentFiles: async function(pattern, callback) {
        // This is a placeholder - in production, you'd use a build tool or server
        // to resolve the glob pattern and fetch files
        // For now, we'll use a manifest approach
        const manifest = this.getContentManifest();
        const files = manifest[pattern] || [];
        
        for (const file of files) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    callback(data);
                }
            } catch (e) {
                console.warn(`Failed to load ${file}:`, e);
            }
        }
    },
    
    // Get content manifest (can be loaded from a manifest.json file)
    getContentManifest: function() {
        // In production, this would be loaded from /content/manifest.json
        return {
            '/content/worlds/*.json': [],
            '/content/levels/*.json': [],
            '/content/biomes/*.json': [],
            '/content/powerups/*.json': [],
            '/content/enemies/*.json': [],
            '/content/hazards/*.json': [],
            '/content/themes/*.json': []
        };
    },
    
    // Register world
    registerWorld: function(world) {
        if (!world.id) {
            console.error('World missing id:', world);
            return;
        }
        this.worlds.set(world.id, world);
    },
    
    // Register level
    registerLevel: function(level) {
        if (!level.id) {
            console.error('Level missing id:', level);
            return;
        }
        this.levels.set(level.id, level);
    },
    
    // Register biome
    registerBiome: function(biome) {
        if (!biome.id) {
            console.error('Biome missing id:', biome);
            return;
        }
        this.biomes.set(biome.id, biome);
    },
    
    // Register power-up
    registerPowerUp: function(powerUp) {
        if (!powerUp.id) {
            console.error('Power-up missing id:', powerUp);
            return;
        }
        this.powerUps.set(powerUp.id, powerUp);
    },
    
    // Register enemy
    registerEnemy: function(enemy) {
        if (!enemy.id) {
            console.error('Enemy missing id:', enemy);
            return;
        }
        this.enemies.set(enemy.id, enemy);
    },
    
    // Register hazard
    registerHazard: function(hazard) {
        if (!hazard.id) {
            console.error('Hazard missing id:', hazard);
            return;
        }
        this.hazards.set(hazard.id, hazard);
    },
    
    // Register theme
    registerTheme: function(theme) {
        if (!theme.id) {
            console.error('Theme missing id:', theme);
            return;
        }
        this.themes.set(theme.id, theme);
    },
    
    // Get world
    getWorld: function(id) {
        return this.worlds.get(id);
    },
    
    // Get level
    getLevel: function(id) {
        return this.levels.get(id);
    },
    
    // Get biome
    getBiome: function(id) {
        return this.biomes.get(id) || this.biomes.get('forest');
    },
    
    // Get power-up
    getPowerUp: function(id) {
        return this.powerUps.get(id);
    },
    
    // Get enemy
    getEnemy: function(id) {
        return this.enemies.get(id);
    },
    
    // Get hazard
    getHazard: function(id) {
        return this.hazards.get(id);
    },
    
    // Get theme
    getTheme: function(id) {
        return this.themes.get(id);
    },
    
    // Get all worlds
    getAllWorlds: function() {
        return Array.from(this.worlds.values());
    },
    
    // Get all levels
    getAllLevels: function() {
        return Array.from(this.levels.values());
    },
    
    // Get all biomes
    getAllBiomes: function() {
        return Array.from(this.biomes.values());
    },
    
    // Get all power-ups
    getAllPowerUps: function() {
        return Array.from(this.powerUps.values());
    },
    
    // Get all enemies
    getAllEnemies: function() {
        return Array.from(this.enemies.values());
    },
    
    // Get all hazards
    getAllHazards: function() {
        return Array.from(this.hazards.values());
    },
    
    // Get all themes
    getAllThemes: function() {
        return Array.from(this.themes.values());
    },
    
    // Factory: Create world instance
    createWorld: function(id, config = {}) {
        const template = this.getWorld(id);
        if (!template) {
            console.error(`World template not found: ${id}`);
            return null;
        }
        
        return {
            ...template,
            ...config,
            id: template.id
        };
    },
    
    // Factory: Create level instance
    createLevel: function(id, config = {}) {
        const template = this.getLevel(id);
        if (!template) {
            console.error(`Level template not found: ${id}`);
            return null;
        }
        
        return {
            ...template,
            ...config,
            id: template.id
        };
    },
    
    // Factory: Create power-up instance
    createPowerUp: function(id, config = {}) {
        const template = this.getPowerUp(id);
        if (!template) {
            console.error(`Power-up template not found: ${id}`);
            return null;
        }
        
        return {
            ...template,
            ...config,
            id: template.id,
            startTime: Date.now()
        };
    },
    
    // Auto-discover content (for future use)
    autoDiscover: function() {
        // This could scan for JSON files and register them automatically
        // For now, we rely on explicit loading
    }
};

// Export
window.ContentRegistry = ContentRegistry;

