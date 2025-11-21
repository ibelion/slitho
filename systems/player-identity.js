// ==================== PLAYER IDENTITY SYSTEM ====================
// Account-free identity stored locally

const PlayerIdentity = {
    // Player data
    playerId: null,
    displayName: 'Player',
    cosmeticLoadout: {
        skin: 'default',
        trail: 'default',
        particleTheme: 'default'
    },
    settings: {
        theme: 'dark',
        muted: false
    },
    
    // Initialize
    init: function() {
        this.loadIdentity();
    },
    
    // Load identity
    loadIdentity: function() {
        // Load or generate player ID
        let savedId = localStorage.getItem('playerId');
        if (!savedId) {
            savedId = this.generatePlayerId();
            localStorage.setItem('playerId', savedId);
        }
        this.playerId = savedId;
        
        // Load display name
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            this.displayName = savedName;
        }
        
        // Load cosmetic loadout
        const savedLoadout = localStorage.getItem('cosmeticLoadout');
        if (savedLoadout) {
            try {
                this.cosmeticLoadout = { ...this.cosmeticLoadout, ...JSON.parse(savedLoadout) };
            } catch (e) {
                console.warn('Failed to load cosmetic loadout:', e);
            }
        }
        
        // Load settings
        const savedSettings = localStorage.getItem('playerSettings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (e) {
                console.warn('Failed to load player settings:', e);
            }
        }
    },
    
    // Generate player ID
    generatePlayerId: function() {
        // Generate unique ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `player_${timestamp}_${random}`;
    },
    
    // Get player ID
    getId: function() {
        return this.playerId;
    },
    
    // Set display name
    setName: function(name) {
        if (!name || name.trim().length === 0) {
            return false;
        }
        
        // Validate name (max 20 chars, alphanumeric + spaces)
        if (name.length > 20) {
            name = name.substring(0, 20);
        }
        
        this.displayName = name.trim();
        localStorage.setItem('playerName', this.displayName);
        return true;
    },
    
    // Get display name
    getName: function() {
        return this.displayName;
    },
    
    // Set cosmetic loadout
    setCosmeticLoadout: function(loadout) {
        this.cosmeticLoadout = { ...this.cosmeticLoadout, ...loadout };
        localStorage.setItem('cosmeticLoadout', JSON.stringify(this.cosmeticLoadout));
    },
    
    // Get cosmetic loadout
    getCosmeticLoadout: function() {
        return { ...this.cosmeticLoadout };
    },
    
    // Set settings
    setSettings: function(settings) {
        this.settings = { ...this.settings, ...settings };
        localStorage.setItem('playerSettings', JSON.stringify(this.settings));
    },
    
    // Get settings
    getSettings: function() {
        return { ...this.settings };
    },
    
    // Get player data (for network)
    getPlayerData: function() {
        return {
            id: this.playerId,
            name: this.displayName,
            loadout: this.cosmeticLoadout,
            settings: this.settings
        };
    },
    
    // Reset identity (for testing)
    reset: function() {
        localStorage.removeItem('playerId');
        localStorage.removeItem('playerName');
        localStorage.removeItem('cosmeticLoadout');
        localStorage.removeItem('playerSettings');
        this.init();
    }
};

// Export
window.PlayerIdentity = PlayerIdentity;

