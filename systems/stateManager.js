// ==================== STATE MANAGER ====================
// Centralized game state management with clean getters/setters
// Prevents cross-module mutation and provides single source of truth

// Save file version for migration
const SAVE_VERSION = 1;

// Game state (private - accessed only through getters/setters)
let gameState = {
    // Snake state
    snake: [{ x: 10, y: 10 }],
    dx: 0,
    dy: 0,
    food: { x: 15, y: 15 },
    
    // Game flow
    gameRunning: false,
    isPaused: false,
    score: 0,
    currentLevel: 1,
    targetScore: 5,
    
    // Game modes
    classicMode: true,
    endlessMode: false,
    proceduralMode: false,
    bossMode: false,
    
    // Visual effects
    cameraShakeX: 0,
    cameraShakeY: 0,
    cameraZoom: 1.0,
    frameCount: 0,
    
    // Power-ups and effects
    activePowerUp: null,
    powerUpEndTime: 0,
    comboCount: 0,
    comboMultiplier: 1,
    
    // Hazards and terrain
    zoomHazard: null,
    hazardTiles: [],
    terrainTiles: [],
    
    // Boss state
    currentBoss: null,
    bossProjectiles: [],
    
    // Particles
    particles: [],
    
    // Timing
    foodSpawnTime: 0,
    directionChangedThisTick: false,
    
    // Previous state for interpolation (read-only)
    previousSnake: [],
    previousFood: { x: 0, y: 0 },
    previousCameraShakeX: 0,
    previousCameraShakeY: 0
};

// State Manager API
const StateManager = {
    // Snake state (optimized: return reference for performance, but mark as read-only)
    getSnake: () => gameState.snake, // Return reference for performance (caller should not mutate)
    setSnake: (snake) => { 
        // Reuse array if same length, otherwise create new
        if (gameState.snake.length === snake.length) {
            for (let i = 0; i < snake.length; i++) {
                gameState.snake[i] = snake[i];
            }
        } else {
            gameState.snake = snake.slice(); // Create copy
        }
    },
    getDx: () => gameState.dx,
    setDx: (dx) => { gameState.dx = dx; },
    getDy: () => gameState.dy,
    setDy: (dy) => { gameState.dy = dy; },
    getFood: () => gameState.food, // Return reference for performance (caller should not mutate)
    setFood: (food) => { 
        // Reuse object
        gameState.food.x = food.x;
        gameState.food.y = food.y;
    },
    
    // Game flow
    getGameRunning: () => gameState.gameRunning,
    setGameRunning: (running) => { gameState.gameRunning = running; },
    getIsPaused: () => gameState.isPaused,
    setIsPaused: (paused) => { gameState.isPaused = paused; },
    getScore: () => gameState.score,
    setScore: (score) => { gameState.score = score; },
    addScore: (points) => { gameState.score += points; },
    getCurrentLevel: () => gameState.currentLevel,
    setCurrentLevel: (level) => { gameState.currentLevel = level; },
    getTargetScore: () => gameState.targetScore,
    setTargetScore: (score) => { gameState.targetScore = score; },
    
    // Game modes
    getClassicMode: () => gameState.classicMode,
    setClassicMode: (mode) => { gameState.classicMode = mode; },
    getEndlessMode: () => gameState.endlessMode,
    setEndlessMode: (mode) => { gameState.endlessMode = mode; },
    getProceduralMode: () => gameState.proceduralMode,
    setProceduralMode: (mode) => { gameState.proceduralMode = mode; },
    getBossMode: () => gameState.bossMode,
    setBossMode: (mode) => { gameState.bossMode = mode; },
    
    // Additional state (for compatibility)
    getZoomHazardEndTime: () => 0, // Placeholder
    getZoomHazardSpawnTime: () => 0, // Placeholder
    getComboTimeout: () => 0, // Placeholder
    getComboTimeLeft: () => 0, // Placeholder
    getPortals: () => null, // Placeholder
    getPortalsActive: () => false, // Placeholder
    
    // Visual effects
    getCameraShakeX: () => gameState.cameraShakeX,
    setCameraShakeX: (x) => { gameState.cameraShakeX = x; },
    getCameraShakeY: () => gameState.cameraShakeY,
    setCameraShakeY: (y) => { gameState.cameraShakeY = y; },
    getCameraZoom: () => gameState.cameraZoom,
    setCameraZoom: (zoom) => { gameState.cameraZoom = zoom; },
    getFrameCount: () => gameState.frameCount,
    incrementFrameCount: () => { gameState.frameCount++; },
    
    // Power-ups
    getActivePowerUp: () => gameState.activePowerUp ? { ...gameState.activePowerUp } : null,
    setActivePowerUp: (powerUp) => { gameState.activePowerUp = powerUp ? { ...powerUp } : null; },
    getPowerUpEndTime: () => gameState.powerUpEndTime,
    setPowerUpEndTime: (time) => { gameState.powerUpEndTime = time; },
    getComboCount: () => gameState.comboCount,
    setComboCount: (count) => { gameState.comboCount = count; },
    getComboMultiplier: () => gameState.comboMultiplier,
    setComboMultiplier: (mult) => { gameState.comboMultiplier = mult; },
    
    // Hazards
    getZoomHazard: () => gameState.zoomHazard ? { ...gameState.zoomHazard } : null,
    setZoomHazard: (hazard) => { gameState.zoomHazard = hazard ? { ...hazard } : null; },
    getHazardTiles: () => [...gameState.hazardTiles],
    setHazardTiles: (tiles) => { gameState.hazardTiles = [...tiles]; },
    getTerrainTiles: () => [...gameState.terrainTiles],
    setTerrainTiles: (tiles) => { gameState.terrainTiles = [...tiles]; },
    
    // Boss
    getCurrentBoss: () => gameState.currentBoss ? { ...gameState.currentBoss } : null,
    setCurrentBoss: (boss) => { gameState.currentBoss = boss ? { ...boss } : null; },
    getBossProjectiles: () => [...gameState.bossProjectiles],
    setBossProjectiles: (projectiles) => { gameState.bossProjectiles = [...projectiles]; },
    
    // Particles
    getParticles: () => [...gameState.particles],
    setParticles: (particles) => { gameState.particles = [...particles]; },
    addParticle: (particle) => { gameState.particles.push({ ...particle }); },
    removeParticle: (index) => { gameState.particles.splice(index, 1); },
    
    // Timing
    getFoodSpawnTime: () => gameState.foodSpawnTime,
    setFoodSpawnTime: (time) => { gameState.foodSpawnTime = time; },
    getDirectionChangedThisTick: () => gameState.directionChangedThisTick,
    setDirectionChangedThisTick: (changed) => { gameState.directionChangedThisTick = changed; },
    
    // Interpolation state (read-only snapshots)
    saveInterpolationState: () => {
        gameState.previousSnake = [...gameState.snake];
        gameState.previousFood = { ...gameState.food };
        gameState.previousCameraShakeX = gameState.cameraShakeX;
        gameState.previousCameraShakeY = gameState.cameraShakeY;
    },
    getPreviousSnake: () => [...gameState.previousSnake],
    getPreviousFood: () => ({ ...gameState.previousFood }),
    getPreviousCameraShakeX: () => gameState.previousCameraShakeX,
    getPreviousCameraShakeY: () => gameState.previousCameraShakeY,
    
    // Reset state
    reset: () => {
        gameState = {
            snake: [{ x: 10, y: 10 }],
            dx: 0,
            dy: 0,
            food: { x: 15, y: 15 },
            gameRunning: false,
            isPaused: false,
            score: 0,
            currentLevel: gameState.currentLevel, // Preserve level
            targetScore: gameState.targetScore, // Preserve target
            classicMode: gameState.classicMode,
            endlessMode: gameState.endlessMode,
            proceduralMode: gameState.proceduralMode,
            bossMode: gameState.bossMode,
            cameraShakeX: 0,
            cameraShakeY: 0,
            cameraZoom: 1.0,
            frameCount: 0,
            activePowerUp: null,
            powerUpEndTime: 0,
            comboCount: 0,
            comboMultiplier: 1,
            zoomHazard: null,
            hazardTiles: [],
            terrainTiles: [],
            currentBoss: null,
            bossProjectiles: [],
            particles: [],
            foodSpawnTime: 0,
            directionChangedThisTick: false,
            previousSnake: [],
            previousFood: { x: 0, y: 0 },
            previousCameraShakeX: 0,
            previousCameraShakeY: 0
        };
    },
    
    // Get full state snapshot (for debugging only)
    getStateSnapshot: () => JSON.parse(JSON.stringify(gameState))
};

// Export
window.StateManager = StateManager;

