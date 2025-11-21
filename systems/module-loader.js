// ==================== MODULE LOADER ====================
// Ensures modules load in correct dependency order
// Prevents circular dependencies and initialization issues

const ModuleLoader = {
    loadedModules: new Set(),
    loadingOrder: [],
    
    // Define module dependencies
    dependencies: {
        'StateManager': [],
        'Progression': ['StateManager'],
        'SkillTree': ['Progression'],
        'Renderer': [],
        'TickEngine': [],
        'SaveSystem': ['Progression', 'SkillTree'],
        'CameraShake': [],
        'Gamepad': [],
        'GhostReplay': [],
        'SnakeAnimator': [],
        'DebugTools': ['TickEngine', 'SaveSystem'],
        'UI': ['Progression', 'SkillTree']
    },
    
    // Check if module is loaded
    isLoaded: function(moduleName) {
        return this.loadedModules.has(moduleName);
    },
    
    // Register a module as loaded
    register: function(moduleName) {
        if (!this.loadedModules.has(moduleName)) {
            this.loadedModules.add(moduleName);
            this.loadingOrder.push(moduleName);
            console.log(`[ModuleLoader] Loaded: ${moduleName}`);
        }
    },
    
    // Validate module dependencies
    validateDependencies: function(moduleName) {
        const deps = this.dependencies[moduleName] || [];
        const missing = deps.filter(dep => !this.isLoaded(dep));
        
        if (missing.length > 0) {
            console.warn(`[ModuleLoader] ${moduleName} missing dependencies: ${missing.join(', ')}`);
            return false;
        }
        
        return true;
    },
    
    // Get loading order
    getLoadingOrder: function() {
        return [...this.loadingOrder];
    },
    
    // Check for circular dependencies (basic check)
    checkCircular: function() {
        // This is a simplified check - full cycle detection would require graph traversal
        const issues = [];
        
        for (const [module, deps] of Object.entries(this.dependencies)) {
            for (const dep of deps) {
                if (this.dependencies[dep] && this.dependencies[dep].includes(module)) {
                    issues.push(`${module} <-> ${dep}`);
                }
            }
        }
        
        if (issues.length > 0) {
            console.error('[ModuleLoader] Circular dependencies detected:', issues);
            return false;
        }
        
        return true;
    }
};

// Run circular dependency check on load
if (typeof window !== 'undefined') {
    window.ModuleLoader = ModuleLoader;
    
    // Check on page load
    window.addEventListener('load', () => {
        ModuleLoader.checkCircular();
    });
}

