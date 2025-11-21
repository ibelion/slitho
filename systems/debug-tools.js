// ==================== DEBUG TOOLS ====================
// In-game diagnostics and debugging utilities

let debugToolsEnabled = false;
let debugOverlay = null;

// Initialize debug tools
function initDebugTools() {
    createDebugOverlay();
    setupDebugHotkeys();
}

// Create debug overlay
function createDebugOverlay() {
    debugOverlay = document.createElement('div');
    debugOverlay.id = 'debugToolsOverlay';
    debugOverlay.className = 'debug-tools-overlay';
    debugOverlay.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
        color: #fff;
        z-index: 10001;
        display: none;
        min-width: 250px;
        max-width: 400px;
    `;
    document.body.appendChild(debugOverlay);
}

// Setup debug hotkeys
function setupDebugHotkeys() {
    document.addEventListener('keydown', (e) => {
        // F5: Toggle debug tools
        if (e.key === 'F5') {
            e.preventDefault();
            toggleDebugTools();
        }
    });
}

// Toggle debug tools
function toggleDebugTools() {
    debugToolsEnabled = !debugToolsEnabled;
    
    if (debugToolsEnabled) {
        debugOverlay.style.display = 'block';
        updateDebugDisplay();
        startDebugUpdate();
    } else {
        debugOverlay.style.display = 'none';
        stopDebugUpdate();
    }
}

let debugUpdateInterval = null;

// Start debug update loop
function startDebugUpdate() {
    if (debugUpdateInterval) return;
    
    debugUpdateInterval = setInterval(() => {
        if (debugToolsEnabled) {
            updateDebugDisplay();
        }
    }, 100); // Update 10 times per second
}

// Stop debug update loop
function stopDebugUpdate() {
    if (debugUpdateInterval) {
        clearInterval(debugUpdateInterval);
        debugUpdateInterval = null;
    }
}

// Update debug display
function updateDebugDisplay() {
    if (!debugOverlay) return;
    
    const metrics = collectDebugMetrics();
    
    debugOverlay.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50; border-bottom: 1px solid #4CAF50; padding-bottom: 5px;">
            Debug Tools (F5)
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">Tick Rate:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.tickRate.toFixed(1)}/s</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">FPS:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.fps}</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">Interpolation:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.interpolation.toFixed(3)}</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">Tick Duration:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.tickDuration.toFixed(2)}ms</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">Frame Time:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.frameTime.toFixed(2)}ms</span>
        </div>
        
        <div style="margin-bottom: 8px; border-top: 1px solid #333; padding-top: 8px;">
            <span style="color: #aaa;">Save System:</span>
            <span style="color: ${metrics.saveSystemValid ? '#4CAF50' : '#ff6b6b'}; margin-left: 10px;">
                ${metrics.saveSystemValid ? '✓ Valid' : '✗ Invalid'}
            </span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #aaa;">Save Version:</span>
            <span style="color: #4CAF50; margin-left: 10px;">${metrics.saveVersion}</span>
        </div>
        
        <div style="margin-bottom: 8px; border-top: 1px solid #333; padding-top: 8px;">
            <span style="color: #aaa;">Module Status:</span>
        </div>
        <div style="font-size: 0.8em; color: #888;">
            ${metrics.modules.map(m => 
                `<div style="margin-left: 10px;">${m.name}: <span style="color: ${m.loaded ? '#4CAF50' : '#ff6b6b'}">${m.loaded ? '✓' : '✗'}</span></div>`
            ).join('')}
        </div>
        
        ${metrics.dependencyGraph ? `
            <div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 8px;">
                <span style="color: #aaa;">Dependencies:</span>
                <div style="font-size: 0.75em; color: #888; margin-top: 5px;">
                    ${metrics.dependencyGraph}
                </div>
            </div>
        ` : ''}
    `;
}

// Collect debug metrics
function collectDebugMetrics() {
    const metrics = {
        tickRate: 60,
        fps: 60,
        interpolation: 0,
        tickDuration: 0,
        frameTime: 16.67,
        saveSystemValid: false,
        saveVersion: 0,
        modules: [],
        dependencyGraph: null
    };
    
    // Get tick engine metrics
    if (window.TickEngine) {
        metrics.tickRate = window.TickEngine.getTickRate();
        metrics.fps = window.TickEngine.getFPS();
        metrics.interpolation = window.TickEngine.getInterpolation();
    } else if (window.currentInterpolation !== undefined) {
        metrics.interpolation = window.currentInterpolation;
    }
    
    // Get profiler metrics if available
    if (window.Profiler) {
        const profilerMetrics = window.Profiler.getMetrics();
        metrics.tickDuration = profilerMetrics.avgTickDuration || 0;
        metrics.frameTime = profilerMetrics.avgFrameTime || 16.67;
    }
    
    // Get save system status
    if (window.SaveSystem) {
        const saveData = window.SaveSystem.getData();
        metrics.saveSystemValid = saveData && saveData.version !== undefined;
        metrics.saveVersion = saveData ? saveData.version : 0;
    }
    
    // Check module loading status
    metrics.modules = [
        { name: 'StateManager', loaded: !!window.StateManager },
        { name: 'Progression', loaded: !!window.Progression },
        { name: 'SkillTree', loaded: !!window.SkillTree },
        { name: 'Renderer', loaded: !!window.Renderer },
        { name: 'TickEngine', loaded: !!window.TickEngine },
        { name: 'SaveSystem', loaded: !!window.SaveSystem },
        { name: 'CameraShake', loaded: !!window.CameraShake },
        { name: 'Gamepad', loaded: !!window.Gamepad },
        { name: 'GhostReplay', loaded: !!window.GhostReplay },
        { name: 'SnakeAnimator', loaded: !!window.SnakeAnimator }
    ];
    
    // Generate dependency graph
    metrics.dependencyGraph = generateDependencyGraph();
    
    return metrics;
}

// Generate module dependency graph
function generateDependencyGraph() {
    const graph = [];
    
    // Define dependencies
    const dependencies = {
        'game.js': ['StateManager', 'Progression', 'Renderer', 'TickEngine'],
        'Renderer': [],
        'StateManager': [],
        'Progression': [],
        'SkillTree': ['Progression'],
        'UI': ['Progression', 'SkillTree'],
        'TickEngine': [],
        'SaveSystem': ['Progression', 'SkillTree']
    };
    
    for (const [module, deps] of Object.entries(dependencies)) {
        if (deps.length > 0) {
            graph.push(`${module} → [${deps.join(', ')}]`);
        } else {
            graph.push(`${module} → (none)`);
        }
    }
    
    return graph.join('<br>');
}

// Export
window.DebugTools = {
    init: initDebugTools,
    toggle: toggleDebugTools,
    isEnabled: () => debugToolsEnabled
};

