// ==================== CONTENT LOADER ====================
// Lightweight API layer for loading content from JSON files
// No server needed - works with static file hosting

const ContentLoader = {
    // Cache
    cache: new Map(),
    
    // Base path
    basePath: '/content',
    
    // Initialize
    init: function() {
        this.loadManifest();
    },
    
    // Load content manifest
    loadManifest: async function() {
        try {
            const response = await fetch(`${this.basePath}/manifest.json`);
            if (response.ok) {
                const manifest = await response.json();
                this.manifest = manifest;
            } else {
                // Fallback: create default manifest
                this.manifest = this.createDefaultManifest();
            }
        } catch (e) {
            console.warn('Failed to load content manifest:', e);
            this.manifest = this.createDefaultManifest();
        }
    },
    
    // Create default manifest
    createDefaultManifest: function() {
        return {
            version: '1.0.0',
            levels: [],
            worlds: [],
            events: [],
            skins: [],
            powerups: [],
            biomes: [],
            enemies: [],
            hazards: [],
            themes: []
        };
    },
    
    // Load content file
    async loadContent(type, id) {
        const cacheKey = `${type}/${id}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const path = `${this.basePath}/${type}/${id}.json`;
            const response = await fetch(path);
            
            if (!response.ok) {
                console.warn(`Content file not found: ${path}`);
                return null;
            }
            
            const data = await response.json();
            
            // Validate data
            if (!this.validateContent(type, data)) {
                console.error(`Invalid content data: ${path}`, data);
                return null;
            }
            
            // Cache
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (e) {
            console.error(`Failed to load content: ${type}/${id}`, e);
            return null;
        }
    },
    
    // Load multiple content files
    async loadContentBatch(type, ids) {
        const results = [];
        for (const id of ids) {
            const content = await this.loadContent(type, id);
            if (content) {
                results.push(content);
            }
        }
        return results;
    },
    
    // Load all content of a type
    async loadAllContent(type) {
        if (!this.manifest || !this.manifest[type]) {
            return [];
        }
        
        const ids = this.manifest[type];
        return await this.loadContentBatch(type, ids);
    },
    
    // Validate content
    validateContent: function(type, data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Type-specific validation
        switch (type) {
            case 'levels':
                return data.id !== undefined && data.name !== undefined;
            case 'worlds':
                return data.id !== undefined && data.name !== undefined;
            case 'events':
                return data.id !== undefined && data.type !== undefined;
            case 'skins':
                return data.id !== undefined && data.name !== undefined;
            case 'powerups':
                return data.id !== undefined && data.name !== undefined;
            case 'biomes':
                return data.id !== undefined && data.name !== undefined;
            case 'enemies':
                return data.id !== undefined && data.name !== undefined;
            case 'hazards':
                return data.id !== undefined && data.type !== undefined;
            case 'themes':
                return data.id !== undefined && data.name !== undefined;
            default:
                return true; // Unknown type, allow it
        }
    },
    
    // Clear cache
    clearCache: function() {
        this.cache.clear();
    },
    
    // Clear specific cache entry
    clearCacheEntry: function(type, id) {
        const cacheKey = `${type}/${id}`;
        this.cache.delete(cacheKey);
    },
    
    // Get manifest
    getManifest: function() {
        return this.manifest;
    },
    
    // Check if content exists
    hasContent: function(type, id) {
        if (!this.manifest || !this.manifest[type]) {
            return false;
        }
        return this.manifest[type].includes(id);
    },
    
    // Preload content
    async preloadContent(type, ids) {
        return await this.loadContentBatch(type, ids);
    },
    
    // Preload all content
    async preloadAll: async function() {
        if (!this.manifest) {
            await this.loadManifest();
        }
        
        const types = ['levels', 'worlds', 'events', 'skins', 'powerups', 'biomes', 'enemies', 'hazards', 'themes'];
        const promises = types.map(type => this.loadAllContent(type));
        await Promise.all(promises);
    }
};

// Export
window.ContentLoader = ContentLoader;

