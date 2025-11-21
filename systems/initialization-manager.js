// ==================== INITIALIZATION MANAGER ====================
// Ensures deterministic initialization order

const InitManager = {
    initialized: new Set(),
    initQueue: [],
    isInitializing: false,
    
    // Define initialization order
    initOrder: [
        'ErrorHandler',
        'DefensiveUtils',
        'ModuleLoader',
        'StateManager',
        'SaveSystem',
        'Progression',
        'SkillTree',
        'AssetLoader',
        'ParticleSystem',
        'HitFeedback',
        'CameraShake',
        'TickEngine',
        'Renderer',
        'SnakeAnimator',
        'Gamepad',
        'GhostReplay',
        'GlobalModifiers',
        'DebugTools',
        'UI',
        'Game'
    ],
    
    // Register initialization function
    register: function(moduleName, initFunction) {
        if (this.initialized.has(moduleName)) {
            console.warn(`Module ${moduleName} already initialized`);
            return;
        }
        
        this.initQueue.push({ name: moduleName, fn: initFunction });
    },
    
    // Initialize all modules in order
    async initializeAll() {
        if (this.isInitializing) {
            console.warn('Initialization already in progress');
            return;
        }
        
        this.isInitializing = true;
        
        try {
            // Initialize in defined order
            for (const moduleName of this.initOrder) {
                const module = this.initQueue.find(m => m.name === moduleName);
                if (module) {
                    try {
                        console.log(`[Init] Initializing ${moduleName}...`);
                        await this.safeInit(module.name, module.fn);
                        this.initialized.add(moduleName);
                        console.log(`[Init] ✓ ${moduleName} initialized`);
                    } catch (e) {
                        console.error(`[Init] ✗ Failed to initialize ${moduleName}:`, e);
                        // Continue with other modules
                    }
                } else {
                    // Module not registered, skip
                    console.warn(`[Init] Module ${moduleName} not registered, skipping`);
                }
            }
            
            // Initialize any remaining modules
            for (const module of this.initQueue) {
                if (!this.initialized.has(module.name)) {
                    try {
                        console.log(`[Init] Initializing ${module.name}...`);
                        await this.safeInit(module.name, module.fn);
                        this.initialized.add(module.name);
                        console.log(`[Init] ✓ ${module.name} initialized`);
                    } catch (e) {
                        console.error(`[Init] ✗ Failed to initialize ${module.name}:`, e);
                    }
                }
            }
            
            console.log('[Init] All modules initialized');
        } finally {
            this.isInitializing = false;
        }
    },
    
    // Safe initialization with error handling
    async safeInit(moduleName, initFunction) {
        if (typeof initFunction !== 'function') {
            throw new Error(`Init function for ${moduleName} is not a function`);
        }
        
        const result = initFunction();
        if (result instanceof Promise) {
            await result;
        }
    },
    
    // Check if module is initialized
    isInitialized: function(moduleName) {
        return this.initialized.has(moduleName);
    },
    
    // Get initialization status
    getStatus: function() {
        return {
            initialized: Array.from(this.initialized),
            pending: this.initQueue.filter(m => !this.initialized.has(m.name)).map(m => m.name),
            isInitializing: this.isInitializing
        };
    }
};

// Export
window.InitManager = InitManager;

