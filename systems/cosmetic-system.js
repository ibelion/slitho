// ==================== COSMETIC SYSTEM ====================
// Pipeline for visual content (skins, evolutions, trails, particles, themes)

const CosmeticSystem = {
    // Registries
    skins: new Map(),
    evolutions: new Map(),
    trailEffects: new Map(),
    particleThemes: new Map(),
    uiThemes: new Map(),
    
    // Current selections
    currentSkin: 'default',
    currentTrail: 'default',
    currentParticleTheme: 'default',
    currentUITheme: 'default',
    
    // Initialize
    init: function() {
        this.loadDefaultCosmetics();
        this.loadExternalCosmetics();
        this.loadUserSelections();
    },
    
    // Load default cosmetics
    loadDefaultCosmetics: function() {
        // Default skins
        this.registerSkin({
            id: 'default',
            name: 'Classic',
            type: 'snake',
            color: '#4CAF50',
            unlocked: true
        });
        
        // Default trail effects
        this.registerTrailEffect({
            id: 'default',
            name: 'None',
            type: 'none',
            unlocked: true
        });
        
        // Default particle themes
        this.registerParticleTheme({
            id: 'default',
            name: 'Classic',
            colors: ['#4CAF50', '#ff0000'],
            unlocked: true
        });
    },
    
    // Load external cosmetics from JSON
    loadExternalCosmetics: async function() {
        try {
            // Load skins
            await this.loadCosmeticFiles('/content/skins/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(skin => this.registerSkin(skin));
                } else {
                    this.registerSkin(data);
                }
            });
            
            // Load trail effects
            await this.loadCosmeticFiles('/content/trails/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(trail => this.registerTrailEffect(trail));
                } else {
                    this.registerTrailEffect(data);
                }
            });
            
            // Load particle themes
            await this.loadCosmeticFiles('/content/particles/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(theme => this.registerParticleTheme(theme));
                } else {
                    this.registerParticleTheme(data);
                }
            });
            
            // Load UI themes
            await this.loadCosmeticFiles('/content/ui-themes/*.json', (data) => {
                if (Array.isArray(data)) {
                    data.forEach(theme => this.registerUITheme(theme));
                } else {
                    this.registerUITheme(data);
                }
            });
        } catch (e) {
            console.warn('Failed to load external cosmetics:', e);
        }
    },
    
    // Load cosmetic files (placeholder)
    loadCosmeticFiles: async function(pattern, callback) {
        // Similar to ContentLoader pattern
        const manifest = window.ContentLoader ? window.ContentLoader.getManifest() : null;
        if (!manifest) return;
        
        const type = pattern.split('/')[2].split('*')[0]; // Extract type from pattern
        const files = manifest[type] || [];
        
        for (const file of files) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    callback(data);
                }
            } catch (e) {
                console.warn(`Failed to load cosmetic file ${file}:`, e);
            }
        }
    },
    
    // Register skin
    registerSkin: function(skin) {
        if (!skin.id) {
            console.error('Skin missing id:', skin);
            return;
        }
        this.skins.set(skin.id, skin);
    },
    
    // Register trail effect
    registerTrailEffect: function(trail) {
        if (!trail.id) {
            console.error('Trail effect missing id:', trail);
            return;
        }
        this.trailEffects.set(trail.id, trail);
    },
    
    // Register particle theme
    registerParticleTheme: function(theme) {
        if (!theme.id) {
            console.error('Particle theme missing id:', theme);
            return;
        }
        this.particleThemes.set(theme.id, theme);
    },
    
    // Register UI theme
    registerUITheme: function(theme) {
        if (!theme.id) {
            console.error('UI theme missing id:', theme);
            return;
        }
        this.uiThemes.set(theme.id, theme);
    },
    
    // Load user selections
    loadUserSelections: function() {
        const saved = localStorage.getItem('cosmeticSelections');
        if (saved) {
            try {
                const selections = JSON.parse(saved);
                this.currentSkin = selections.skin || 'default';
                this.currentTrail = selections.trail || 'default';
                this.currentParticleTheme = selections.particleTheme || 'default';
                this.currentUITheme = selections.uiTheme || 'default';
            } catch (e) {
                console.warn('Failed to load cosmetic selections:', e);
            }
        }
        
        this.applySelections();
    },
    
    // Save user selections
    saveUserSelections: function() {
        const selections = {
            skin: this.currentSkin,
            trail: this.currentTrail,
            particleTheme: this.currentParticleTheme,
            uiTheme: this.currentUITheme
        };
        localStorage.setItem('cosmeticSelections', JSON.stringify(selections));
    },
    
    // Apply selections
    applySelections: function() {
        // Apply skin
        const skin = this.skins.get(this.currentSkin);
        if (skin && window.StateManager) {
            // Apply skin to snake
        }
        
        // Apply trail
        const trail = this.trailEffects.get(this.currentTrail);
        if (trail) {
            // Apply trail effect
        }
        
        // Apply particle theme
        const particleTheme = this.particleThemes.get(this.currentParticleTheme);
        if (particleTheme && window.ParticleSystem) {
            // Apply particle colors
        }
        
        // Apply UI theme
        const uiTheme = this.uiThemes.get(this.currentUITheme);
        if (uiTheme) {
            this.applyUITheme(uiTheme);
        }
    },
    
    // Apply UI theme
    applyUITheme: function(theme) {
        const root = document.documentElement;
        
        if (theme.colors) {
            Object.keys(theme.colors).forEach(key => {
                root.style.setProperty(`--${key}`, theme.colors[key]);
            });
        }
    },
    
    // Set skin
    setSkin: function(skinId) {
        if (!this.skins.has(skinId)) {
            console.warn(`Skin not found: ${skinId}`);
            return false;
        }
        
        const skin = this.skins.get(skinId);
        if (!skin.unlocked) {
            console.warn(`Skin not unlocked: ${skinId}`);
            return false;
        }
        
        this.currentSkin = skinId;
        this.saveUserSelections();
        this.applySelections();
        return true;
    },
    
    // Set trail
    setTrail: function(trailId) {
        if (!this.trailEffects.has(trailId)) {
            console.warn(`Trail effect not found: ${trailId}`);
            return false;
        }
        
        const trail = this.trailEffects.get(trailId);
        if (!trail.unlocked) {
            console.warn(`Trail effect not unlocked: ${trailId}`);
            return false;
        }
        
        this.currentTrail = trailId;
        this.saveUserSelections();
        this.applySelections();
        return true;
    },
    
    // Unlock skin
    unlockSkin: function(skinId) {
        const skin = this.skins.get(skinId);
        if (skin) {
            skin.unlocked = true;
            this.saveSkins();
        }
    },
    
    // Save skins
    saveSkins: function() {
        const skinsData = Array.from(this.skins.values()).map(skin => ({
            id: skin.id,
            unlocked: skin.unlocked
        }));
        localStorage.setItem('cosmeticSkins', JSON.stringify(skinsData));
    },
    
    // Get all skins
    getAllSkins: function() {
        return Array.from(this.skins.values());
    },
    
    // Get unlocked skins
    getUnlockedSkins: function() {
        return Array.from(this.skins.values()).filter(skin => skin.unlocked);
    },
    
    // Get current skin
    getCurrentSkin: function() {
        return this.skins.get(this.currentSkin);
    }
};

// Export
window.CosmeticSystem = CosmeticSystem;

