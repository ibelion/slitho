// ==================== TICK ENGINE ====================
// Fixed timestep game loop with interpolation
// Ensures consistent gameplay regardless of FPS

const FIXED_TIMESTEP = 16.666; // 60 ticks per second (1000ms / 60)
const MAX_FRAME_TIME = 250; // Cap delta to prevent spiral of death (ms)

let accumulator = 0;
let lastFrameTime = 0;
let animationFrameId = null;
let isLoopRunning = false;

// Interpolation factor for smooth rendering
let interpolation = 0;

// Performance tracking (optimized: use circular buffer instead of array push/shift)
const FRAME_HISTORY_SIZE = 60;
let frameTimeHistory = new Array(FRAME_HISTORY_SIZE);
let frameHistoryIndex = 0;
let frameHistoryCount = 0;
let tickCount = 0;
let lastTickTime = performance.now();

// Delta-time smoothing
let smoothedDeltaTime = 16.666;
const SMOOTHING_FACTOR = 0.1;

// Expose for debug tools
window.frameTimeHistory = frameTimeHistory;

// Start the game loop
function startGameLoop() {
    if (isLoopRunning) return;
    
    isLoopRunning = true;
    lastFrameTime = performance.now();
    accumulator = 0;
    
    // Save initial state for interpolation
    if (window.StateManager) {
        window.StateManager.saveInterpolationState();
    }
    
    gameLoop();
}

// Stop the game loop
function stopGameLoop() {
    isLoopRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Main game loop using fixed timestep
function gameLoop() {
    if (!isLoopRunning) return;
    
    const currentTime = performance.now();
    let deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Cap delta time to prevent spiral of death
    if (deltaTime > MAX_FRAME_TIME) {
        deltaTime = MAX_FRAME_TIME;
    }
    
    // Track frame time for FPS calculation (optimized: circular buffer)
    frameTimeHistory[frameHistoryIndex] = deltaTime;
    frameHistoryIndex = (frameHistoryIndex + 1) % FRAME_HISTORY_SIZE;
    if (frameHistoryCount < FRAME_HISTORY_SIZE) {
        frameHistoryCount++;
    }
    
    // Smooth delta time for frame pacing
    smoothedDeltaTime = smoothedDeltaTime * (1 - SMOOTHING_FACTOR) + deltaTime * SMOOTHING_FACTOR;
    
    // Update exposed history (for compatibility)
    window.frameTimeHistory = Array.from(frameTimeHistory).slice(0, frameHistoryCount);
    
    // Record frame time for profiler
    if (window.Profiler) {
        window.Profiler.recordFrameTime(deltaTime);
    }
    
    // Accumulate time
    accumulator += deltaTime;
    
    // Update game logic at fixed timestep (never skip ticks, but prevent infinite loop)
    let maxTicks = 10; // Prevent infinite loop on extreme lag
    while (accumulator >= FIXED_TIMESTEP && maxTicks > 0) {
        // Save state before update for interpolation
        if (window.StateManager) {
            try {
                window.StateManager.saveInterpolationState();
            } catch (e) {
                console.warn('Error saving interpolation state:', e);
            }
        }
        
        // Run game update (fixed timestep)
        const tickStart = performance.now();
        if (window.updateGameLogic) {
            try {
                window.updateGameLogic();
            } catch (e) {
                console.error('Error in game logic update:', e);
                // Continue loop even if update fails
            }
        }
        const tickDuration = performance.now() - tickStart;
        
        // Record tick metrics for profiler
        if (window.Profiler) {
            window.Profiler.recordTickDuration(tickDuration);
            window.Profiler.recordTickCount();
        }
        
        accumulator -= FIXED_TIMESTEP;
        tickCount++;
        maxTicks--;
    }
    
    // If too many ticks accumulated, cap accumulator (load shedding)
    if (maxTicks === 0 && accumulator > FIXED_TIMESTEP * 5) {
        accumulator = FIXED_TIMESTEP * 5; // Cap accumulator
        if (window.DebugTools && window.DebugTools.isEnabled()) {
            console.warn('Extreme lag detected, capping accumulator');
        }
    }
    
    // Calculate interpolation factor (0 to 1)
    interpolation = accumulator / FIXED_TIMESTEP;
    
    // Expose interpolation for debug tools
    window.currentInterpolation = interpolation;
    
    // Render with interpolation (can be skipped under extreme load)
    if (window.renderGame) {
        try {
            window.renderGame(interpolation);
        } catch (e) {
            console.error('Error in render:', e);
            // Continue loop even if render fails
        }
    }
    
    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Get current interpolation factor
function getInterpolation() {
    return interpolation;
}

// Get tick rate (ticks per second)
function getTickRate() {
    const now = performance.now();
    const elapsed = now - lastTickTime;
    if (elapsed >= 1000) {
        const rate = (tickCount / elapsed) * 1000;
        tickCount = 0;
        lastTickTime = now;
        return rate;
    }
    return 60; // Default estimate
}

// Get FPS (smoothed, optimized)
function getFPS() {
    if (frameHistoryCount === 0) return 60;
    let sum = 0;
    for (let i = 0; i < frameHistoryCount; i++) {
        sum += frameTimeHistory[i] || 0;
    }
    const avgFrameTime = sum / frameHistoryCount;
    return Math.round(1000 / avgFrameTime);
}

// Public API
const TickEngine = {
    start: startGameLoop,
    stop: stopGameLoop,
    getInterpolation,
    getTickRate,
    getFPS,
    isRunning: () => isLoopRunning,
    FIXED_TIMESTEP
};

// Export
window.TickEngine = TickEngine;
window.startGameLoop = startGameLoop;
window.stopGameLoop = stopGameLoop;

