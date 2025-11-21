// Canvas and DOM elements (with null safety)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const particleCanvas = document.getElementById('particleCanvas');
const particleCtx = particleCanvas ? particleCanvas.getContext('2d') : null;

// Validate critical elements
if (!canvas || !ctx) {
    console.error('Critical error: gameCanvas or context not found. Game cannot initialize.');
    // Create fallback error message
    if (document.body) {
        document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">Error: Game canvas not found. Please refresh the page.</div>';
    }
}
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const targetScoreElement = document.getElementById('targetScore');
const coinsElement = document.getElementById('coins');
const playerLevelElement = document.getElementById('playerLevel');
const restartBtn = document.getElementById('restartBtn');
const themeToggle = document.getElementById('themeToggle');
const soundToggle = document.getElementById('soundToggle');
const pauseBtn = document.getElementById('pauseBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const bossWarningOverlay = document.getElementById('bossWarningOverlay');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const completeLevelElement = document.getElementById('completeLevel');
const controlPad = document.getElementById('controlPad');
const powerUpHud = document.getElementById('powerUpHud');
const powerUpIcon = document.getElementById('powerUpIcon');
const powerUpName = document.getElementById('powerUpName');
const powerUpTimer = document.getElementById('powerUpTimer');
const comboText = document.getElementById('comboText');
const modeSelectScreen = document.getElementById('modeSelectScreen');
const gameScreen = document.getElementById('gameScreen');
// Main menu buttons - support both old and new IDs for backward compatibility
const classicModeBtn = document.getElementById('btn-classic') || document.getElementById('classicModeBtn');
const endlessModeBtn = document.getElementById('btn-endless') || document.getElementById('endlessModeBtn');
const proceduralModeBtn = document.getElementById('btn-procedural') || document.getElementById('proceduralModeBtn');
const bossModeBtn = document.getElementById('btn-boss') || document.getElementById('bossModeBtn');
const modeSelectBtn = document.getElementById('modeSelectBtn');
const settingsBtnMain = document.getElementById('btn-settings') || document.getElementById('settingsBtnMain');
const themesBtnMain = document.getElementById('btn-themes') || document.getElementById('themesBtnMain');
const shopBtnMain = document.getElementById('btn-shop') || document.getElementById('shopBtnMain');
const inventoryBtnMain = document.getElementById('btn-inventory') || document.getElementById('inventoryBtnMain');
const missionsBtnMain = document.getElementById('btn-missions') || document.getElementById('missionsBtnMain');
const levelEditorBtnMain = document.getElementById('levelEditorBtnMain');

// Modal elements
const levelSelectModal = document.getElementById('levelSelectModal');
const skinModal = document.getElementById('skinsModal');
const themesModal = document.getElementById('themesModal');
const settingsModal = document.getElementById('settingsModal');
const achievementsModal = document.getElementById('achievementsModal');
const leaderboardModal = document.getElementById('leaderboardModal');
const dailyChallengeModal = document.getElementById('dailyChallengeModal');
const achievementPopup = document.getElementById('achievementPopup');
const boardRotationToggle = document.getElementById('boardRotationToggle');
const highContrastToggle = document.getElementById('highContrastToggle');
const dailyChallengeTitle = document.getElementById('dailyChallengeTitle');
const dailyChallengeDesc = document.getElementById('dailyChallengeDesc');
const dailyChallengeProgressBar = document.getElementById('dailyChallengeProgressBar');
const dailyChallengeProgressText = document.getElementById('dailyChallengeProgressText');
const startDailyChallengeBtn = document.getElementById('startDailyChallengeBtn');

// Game constants
const GRID_COLS = 20;
const GRID_ROWS = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 130;
const TOTAL_LEVELS = 20;

// Set canvas resolution
// Set canvas resolution (optimized for mobile: handle devicePixelRatio)
const baseCanvasWidth = GRID_COLS * CELL_SIZE;
const baseCanvasHeight = GRID_ROWS * CELL_SIZE;

// Handle high-DPI displays (optimize for mobile)
const dpr = window.devicePixelRatio || 1;
const isMobile = /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// On mobile, cap DPR to 2 to reduce memory usage and improve performance
const effectiveDPR = isMobile ? Math.min(dpr, 2) : dpr;

canvas.width = baseCanvasWidth * effectiveDPR;
canvas.height = baseCanvasHeight * effectiveDPR;

// Scale context to match DPR
ctx.scale(effectiveDPR, effectiveDPR);

// Set CSS size to logical size (prevents blurry rendering)
canvas.style.width = baseCanvasWidth + 'px';
canvas.style.height = baseCanvasHeight + 'px';

// Game state
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let zoomHazard = null;
let hazardTiles = [];
window.hazardTiles = hazardTiles; // Expose for item effects
let terrainTiles = []; // Procedural terrain
window.terrainTiles = terrainTiles; // Expose for item effects
let dx = 0;
let dy = 0;
let score = 0;
let currentLevel = 1;
let targetScore = 5;
let gameRunning = false;
let isPaused = false;
let gameLoop = null;
let directionChangedThisTick = false;
let frameCount = 0;
let foodSpawnTime = 0;
let isMuted = false;
let classicMode = true;
let endlessMode = false;
let proceduralMode = false;
let bossMode = false;
let gamesPlayed = 0;
let gamesWithoutDying = 0;
let totalFoodEaten = 0;
let cameraShakeX = 0;
let cameraShakeY = 0;
let cameraZoom = 1.0;
let zoomHazardEndTime = 0;
let zoomHazardSpawnTime = 0;
let comboCount = 0;
let comboTimeout = 0;
let endlessSpeedLevel = 0;
let endlessFoodCount = 0;
let bestEndlessScore = 0;
let highContrastMode = false;
let snakeCoins = 0;
let playerLevel = 1;
let playerXP = 0;
let currentBoss = null;
let bossAttackCooldown = 0;
let bossPhase = 1;

// Phase 7: New state variables
let currentDifficulty = 'normal';
let weatherType = 'clear';
let weatherIntensity = 0.5;
let weatherChangeTime = 0;
let rainDrops = [];
let fogLayers = [];
let lightningFlash = 0;
let bossFruit = null;
let bossFruitHitCount = 0;
let bossFruitSpawnTime = 0;
let bossFruitsDefeated = 0;
let snakeEvolutionTier = 0;
let currentSnakeSkin = 'default';
let snakeSkins = [];
let ghostReplay = null;
let showGhost = false;
let heatmap = [];
let showHeatmap = false;
let dailyChallenge = null;
let dailyChallengeActive = false;
let dailyChallengeSeed = null;
let dailyChallengeProgress = 0;
let dailyChallengeCompleted = false;
let totalEvolutionTiers = 0;
let noDeathStreak = 0;
let weatherWins = { rain: 0, fog: 0, lightning: 0, clear: 0 };
let uniqueThemesUsed = new Set();
let gameStartTime = 0;
let zoomHazardActiveTime = 0;

// Initialize weather and heatmap canvases
if (weatherCanvas) {
    // Optimize canvas sizes (use logical size, not DPR-scaled)
    weatherCanvas.width = baseCanvasWidth;
    weatherCanvas.height = baseCanvasHeight;
}
if (heatmapCanvas) {
    heatmapCanvas.width = baseCanvasWidth;
    heatmapCanvas.height = baseCanvasHeight;
}

// Touch/swipe handling
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const MIN_SWIPE_DISTANCE = 30;

// Audio context
let audioContext = null;
let isAudioContextInitialized = false;

// ==================== POWER-UP SYSTEM ====================

const POWER_UPS = {
    SLOW_TIME: { id: 'slow_time', name: 'Slow Time', icon: '⏱️', duration: 5000, color: '#00bcd4' },
    SCORE_MULTIPLIER: { id: 'score_multiplier', name: 'Score x2', icon: '⭐', duration: 10000, color: '#ffd700' },
    GHOST_MODE: { id: 'ghost_mode', name: 'Ghost Mode', icon: '👻', duration: 4000, color: '#9c27b0' },
    SHRINK: { id: 'shrink', name: 'Shrink', icon: '📉', duration: 0, color: '#ff9800' },
    MAGNET: { id: 'magnet', name: 'Magnet', icon: '🧲', duration: 6000, color: '#f44336' },
    FREEZE_ROTATION: { id: 'freeze_rotation', name: 'Freeze Rotation', icon: '❄️', duration: 8000, color: '#2196f3' }
};

let activePowerUp = null;
let powerUpEndTime = 0;
let powerUpSpawnTime = 0;
let powerUpsFound = 0;
const POWER_UP_SPAWN_INTERVAL = { min: 7000, max: 14000 };

function getRandomPowerUp() {
    const keys = Object.keys(POWER_UPS);
    return POWER_UPS[keys[Math.floor(Math.random() * keys.length)]];
}

function spawnPowerUp() {
    if (activePowerUp) return;
    
    const powerUp = getRandomPowerUp();
    activePowerUp = powerUp;
    powerUpEndTime = Date.now() + powerUp.duration;
    powerUpSpawnTime = Date.now();
    powerUpsFound++;
    
    // Update mission progress
    updateMissionProgress('collect_powerups', 1);
    
    savePowerUpsFound();
    updatePowerUpUI();
    
    // Apply immediate effects
    if (powerUp.id === 'shrink') {
        applyShrink();
    }
}

function applyPowerUp(powerUp) {
    switch (powerUp.id) {
        case 'slow_time':
            // Speed is handled in game loop
            break;
        case 'score_multiplier':
            // Handled in score calculation
            break;
        case 'ghost_mode':
            // Handled in collision detection
            break;
        case 'magnet':
            // Handled in food update
            break;
        case 'freeze_rotation':
            // Handled in rotation system
            break;
    }
}

function applyShrink() {
    if (snake.length > 4) {
        const shrinkAmount = Math.min(4, snake.length - 1);
        for (let i = 0; i < shrinkAmount; i++) {
            snake.pop();
        }
    }
    // Shrink is instant, remove power-up immediately
    activePowerUp = null;
    powerUpEndTime = 0;
    updatePowerUpUI();
}

function updatePowerUps() {
    if (!gameRunning) return;
    
    // Check if power-up expired
    if (activePowerUp && powerUpEndTime > 0 && Date.now() >= powerUpEndTime) {
        activePowerUp = null;
        powerUpEndTime = 0;
        updatePowerUpUI();
    }
    
    // Spawn new power-up
    if (!activePowerUp) {
        const timeSinceLastSpawn = Date.now() - powerUpSpawnTime;
        // Endless mode: 6-10 seconds, Classic: 7-14 seconds
        let baseInterval = endlessMode ? 
            (6000 + Math.random() * 4000) :
            (POWER_UP_SPAWN_INTERVAL.min + 
             Math.random() * (POWER_UP_SPAWN_INTERVAL.max - POWER_UP_SPAWN_INTERVAL.min));
        
        // Apply difficulty multiplier
        const diff = DIFFICULTIES[currentDifficulty];
        if (diff && diff.powerUpFrequency) {
            baseInterval = baseInterval / diff.powerUpFrequency;
        }
        
        if (powerUpSpawnTime === 0 || timeSinceLastSpawn >= baseInterval) {
            spawnPowerUp();
        }
    }
}

function updatePowerUpUI() {
    if (activePowerUp && powerUpEndTime > 0) {
        powerUpIndicator.classList.add('active');
        powerUpIcon.textContent = activePowerUp.icon;
        const remaining = Math.ceil((powerUpEndTime - Date.now()) / 1000);
        powerUpTimer.textContent = `${remaining}s`;
    } else {
        powerUpIndicator.classList.remove('active');
    }
}

function savePowerUpsFound() {
    localStorage.setItem('powerUpsFound', powerUpsFound.toString());
}

function loadPowerUpsFound() {
    const saved = localStorage.getItem('powerUpsFound');
    if (saved) powerUpsFound = parseInt(saved) || 0;
}

// ==================== ROTATING BOARD SYSTEM ====================

let boardRotationEnabled = false;
let boardRotation = 0;
let rotationDirection = 1;
let rotationSpeed = 0.2;
let lastRotationChange = Date.now();
const ROTATION_CHANGE_INTERVAL = 12000;
const MAX_ROTATION = 30;

function updateBoardRotation() {
    if (!boardRotationEnabled || !gameRunning) return;
    
    // Check if rotation should freeze
    if (activePowerUp && activePowerUp.id === 'freeze_rotation') {
        return;
    }
    
    // Change direction every 12 seconds
    if (Date.now() - lastRotationChange >= ROTATION_CHANGE_INTERVAL) {
        rotationDirection *= -1;
        lastRotationChange = Date.now();
    }
    
    // Update rotation
    boardRotation += rotationSpeed * rotationDirection;
    
    // Clamp rotation
    if (boardRotation > MAX_ROTATION) {
        boardRotation = MAX_ROTATION;
        rotationDirection = -1;
    } else if (boardRotation < -MAX_ROTATION) {
        boardRotation = -MAX_ROTATION;
        rotationDirection = 1;
    }
}

function saveBoardRotationSetting() {
    localStorage.setItem('boardRotationEnabled', boardRotationEnabled.toString());
}

function loadBoardRotationSetting() {
    const saved = localStorage.getItem('boardRotationEnabled');
    boardRotationEnabled = saved === 'true';
    if (boardRotationToggle) {
        boardRotationToggle.checked = boardRotationEnabled;
    }
}

// ==================== PORTAL SYSTEM ====================

let portals = null;
let portalsActive = false;

function generatePortals() {
    let portalA, portalB;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        portalA = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        portalB = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        attempts++;
        
        if (attempts > maxAttempts) break;
    } while (
        isPositionOnSnake(portalA.x, portalA.y) ||
        isPositionOnSnake(portalB.x, portalB.y) ||
        isPositionNearWall(portalA.x, portalA.y) ||
        isPositionNearWall(portalB.x, portalB.y) ||
        (portalA.x === portalB.x && portalA.y === portalB.y)
    );
    
    portals = { a: portalA, b: portalB };
    portalsActive = true;
    portalIndicator.classList.add('active');
}

function isPositionNearWall(x, y) {
    return x <= 1 || x >= GRID_COLS - 2 || y <= 1 || y >= GRID_ROWS - 2;
}

function checkPortalCollision(head) {
    if (!portals || !portalsActive) return null;
    
    if (head.x === portals.a.x && head.y === portals.a.y) {
        // Enter portal A, exit portal B
        createParticleBurst(
            portals.a.x * CELL_SIZE + CELL_SIZE / 2,
            portals.a.y * CELL_SIZE + CELL_SIZE / 2,
            '#8a2be2',
            20
        );
        return { x: portals.b.x, y: portals.b.y };
    } else if (head.x === portals.b.x && head.y === portals.b.y) {
        // Enter portal B, exit portal A
        createParticleBurst(
            portals.b.x * CELL_SIZE + CELL_SIZE / 2,
            portals.b.y * CELL_SIZE + CELL_SIZE / 2,
            '#8a2be2',
            20
        );
        return { x: portals.a.x, y: portals.a.y };
    }
    
    return null;
}

// ==================== THEME SYSTEM ====================

const THEMES = [
    {
        id: 'classic',
        name: 'Classic',
        desc: 'Default green snake',
        unlocked: true,
        unlockType: null,
        unlockValue: null
    },
    {
        id: 'neon',
        name: 'Neon Grid',
        desc: 'Unlock: Beat Level 5',
        unlocked: false,
        unlockType: 'level',
        unlockValue: 5
    },
    {
        id: 'vaporwave',
        name: 'Vaporwave Sunset',
        desc: 'Unlock: Score 50',
        unlocked: false,
        unlockType: 'score',
        unlockValue: 50
    },
    {
        id: 'blueprint',
        name: 'Blueprint Blueprint',
        desc: 'Unlock: Eat 100 Food',
        unlocked: false,
        unlockType: 'food',
        unlockValue: 100
    },
    {
        id: 'matrix',
        name: 'Matrix Green',
        desc: 'Unlock: Beat Level 10',
        unlocked: false,
        unlockType: 'level',
        unlockValue: 10
    },
    {
        id: 'candy',
        name: 'Candy Pastel',
        desc: 'Unlock: Score 100',
        unlocked: false,
        unlockType: 'score',
        unlockValue: 100
    }
];

let currentTheme = 'classic';

function checkThemeUnlocks() {
    THEMES.forEach(theme => {
        if (theme.unlocked || !theme.unlockType) return;
        
        let shouldUnlock = false;
        switch (theme.unlockType) {
            case 'level':
                shouldUnlock = currentLevel >= theme.unlockValue;
                break;
            case 'score':
                shouldUnlock = score >= theme.unlockValue;
                break;
            case 'food':
                shouldUnlock = totalFoodEaten >= theme.unlockValue;
                break;
        }
        
        if (shouldUnlock && !theme.unlocked) {
            theme.unlocked = true;
            saveThemes();
        }
    });
}

function applyTheme(themeId) {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme || !theme.unlocked) return;
    
    currentTheme = themeId;
    document.body.setAttribute('data-game-theme', themeId);
    uniqueThemesUsed.add(themeId);
    checkAchievement('theme_collector');
    saveThemes();
}

function saveThemes() {
    localStorage.setItem('themes', JSON.stringify(THEMES));
    localStorage.setItem('currentTheme', currentTheme);
}

function loadThemes() {
    const saved = localStorage.getItem('themes');
    if (saved) {
        const parsed = JSON.parse(saved);
        THEMES.forEach((theme, i) => {
            if (parsed[i]) theme.unlocked = parsed[i].unlocked;
        });
    }
    const savedCurrent = localStorage.getItem('currentTheme');
    if (savedCurrent) {
        currentTheme = savedCurrent;
        applyTheme(currentTheme);
    }
}

// ==================== COMBO SYSTEM ====================

let comboMultiplier = 1;
let comboTimeLeft = 0;
const COMBO_DECAY_TIME = 2000;
const MAX_COMBO = 4;

function updateCombo() {
    if (comboTimeLeft > 0) {
        comboTimeLeft -= 16; // ~60fps
        if (comboTimeLeft <= 0) {
            comboMultiplier = 1;
            comboTimeLeft = 0;
            updateComboDisplay();
        }
    }
}

function addCombo() {
    comboTimeLeft = COMBO_DECAY_TIME;
    if (comboMultiplier < MAX_COMBO) {
        comboMultiplier++;
        showComboText();
        playComboSound();
    }
    updateComboDisplay();
}

function updateComboDisplay() {
    if (comboMultiplier > 1) {
        if (comboDisplay) {
            comboDisplay.textContent = `x${comboMultiplier} Combo!`;
            comboDisplay.classList.add('active');
        }
        const comboHud = document.getElementById('comboHud');
        const comboCountElement = document.getElementById('comboCount');
        if (comboHud && comboCountElement) {
            comboHud.style.display = 'flex';
            comboCountElement.textContent = `x${comboMultiplier}`;
        }
    } else {
        if (comboDisplay) comboDisplay.classList.remove('active');
        const comboHud = document.getElementById('comboHud');
        if (comboHud) comboHud.style.display = 'none';
    }
}

function showComboText() {
    comboText.textContent = `x${comboMultiplier} Combo!`;
    comboText.classList.add('show');
    setTimeout(() => {
        comboText.classList.remove('show');
    }, 1000);
}

function playComboSound() {
    if (isMuted) return;
    playSound(600 + comboMultiplier * 100, 0.15, 'sine');
}

// ==================== ENHANCED PARTICLE SYSTEM ====================

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = (options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 4);
        this.vy = (options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 4);
        this.life = options.life !== undefined ? options.life : 1.0;
        this.maxLife = this.life;
        this.decay = options.decay !== undefined ? options.decay : (0.02 + Math.random() * 0.03);
        this.size = options.size !== undefined ? options.size : (3 + Math.random() * 3);
        this.color = options.color || '#ffffff';
        this.gravity = options.gravity || 0;
        this.friction = options.friction !== undefined ? options.friction : 0.98;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        if (this.life <= 0 || !particleCtx) return;
        particleCtx.save();
        particleCtx.globalAlpha = this.life;
        particleCtx.fillStyle = this.color;
        particleCtx.translate(this.x, this.y);
        particleCtx.rotate(this.rotation);
        particleCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        particleCtx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleEmitter {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.active = true;
        this.emissionRate = config.emissionRate || 10;
        this.lastEmission = Date.now();
        this.duration = config.duration || 1000;
        this.startTime = Date.now();
    }

    update() {
        if (!this.active) return;
        const now = Date.now();
        if (now - this.startTime > this.duration) {
            this.active = false;
            return;
        }
        
        const timeSinceLastEmission = now - this.lastEmission;
        const emissionInterval = 1000 / this.emissionRate;
        
        if (timeSinceLastEmission >= emissionInterval) {
            this.emit();
            this.lastEmission = now;
        }
    }

    emit() {
        const count = this.config.count || 1;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = this.config.speed || 4;
            particles.push(new Particle(this.x, this.y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: this.config.color || '#ffffff',
                size: this.config.size || 3,
                life: this.config.life || 1.0,
                decay: this.config.decay || 0.02,
                gravity: this.config.gravity || 0,
                rotationSpeed: this.config.rotationSpeed || 0.1
            }));
        }
    }
}

let particles = [];
let particleEmitters = [];

if (particleCanvas) {
    particleCanvas.width = canvas.width;
    particleCanvas.height = canvas.height;
}

function createParticleBurst(x, y, color, count = 10, options = {}) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = options.speed || (2 + Math.random() * 3);
        particles.push(new Particle(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: options.size || (3 + Math.random() * 3),
            life: options.life || 1.0,
            decay: options.decay || (0.02 + Math.random() * 0.03),
            gravity: options.gravity || 0,
            rotationSpeed: options.rotationSpeed || 0.1
        }));
    }
}

function createParticleTrail(x, y, color) {
    if (Math.random() > 0.7) { // Only emit occasionally for performance
        particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            color: color,
            size: 2,
            life: 0.5,
            decay: 0.05,
            friction: 0.95
        }));
    }
}

function createExplosion(x, y, color, intensity = 1) {
    const count = Math.floor(30 * intensity);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push(new Particle(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 4 + Math.random() * 4,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02,
            gravity: 0.1,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        }));
    }
}

function updateParticles() {
    // Update emitters
    particleEmitters = particleEmitters.filter(emitter => {
        emitter.update();
        return emitter.active;
    });
    
    // Update particles
    particles = particles.filter(p => {
        p.update();
        return !p.isDead();
    });
}

function drawParticles() {
    if (!particleCtx) return;
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach(p => p.draw());
}

// ==================== LEVEL SYSTEM ====================

const levelConfigs = [];
for (let i = 1; i <= TOTAL_LEVELS; i++) {
    levelConfigs.push({
        level: i,
        targetScore: Math.floor(5 + (i - 1) * 3),
        speed: Math.max(60, INITIAL_SPEED - (i - 1) * 3),
        inputBuffer: Math.max(50, 150 - (i - 1) * 5)
    });
}

// Expose level configs for level select UI
window.levelConfigs = levelConfigs;

function getCurrentLevelConfig() {
    return levelConfigs[currentLevel - 1] || levelConfigs[0];
}

function checkLevelComplete() {
    // Never complete level in endless mode or classic mode
    if (classicMode || endlessMode) return false;
    if (score >= targetScore) {
        completeLevel();
        return true;
    }
    return false;
}

function completeLevel() {
    if (!window.StateManager || !window.Progression) return;
    
    const state = window.StateManager;
    state.setGameRunning(false);
    
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    if (window.stopGameLoop) {
        window.stopGameLoop();
    }

    // Stop ghost replay recording
    if (window.GhostReplay) {
        window.GhostReplay.stopRecording();
    }

    // Stop level timer and get S-Rank results
    const currentLevel = state.getCurrentLevel();
    let sRankResults = null;
    if (window.Progression.stopLevelTimer) {
        sRankResults = window.Progression.stopLevelTimer(currentLevel);
    }
    
    // Log game event
    if (window.DebugOverlay) {
        window.DebugOverlay.logGameEvent('level_complete', { 
            level: currentLevel,
            rank: sRankResults?.rank,
            time: sRankResults?.time
        });
    }

    const snake = state.getSnake();
    // Safe array access
    if (snake && snake.length > 0) {
        const head = snake[0];
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        createParticleBurst(headX, headY, '#4CAF50', 20);
    }

    if (completeLevelElement) {
        completeLevelElement.textContent = currentLevel;
    }
    if (levelCompleteOverlay) {
        levelCompleteOverlay.classList.add('show');
    }
    
    // Check world completion (uses Progression module)
    if (window.Progression) {
        const world = window.Progression.getWorldForLevel(currentLevel);
        if (world) {
            // Check if all levels in world are completed
            const allLevelsCompleted = world.levels.every(levelId => {
                if (levelId === world.endLevel) {
                    // Last level of world is completed if next level is unlocked
                    return window.Progression.isLevelUnlocked(levelId + 1) || levelId === TOTAL_LEVELS;
                }
                return true; // Other levels are completed if we got here
            });
            
            if (allLevelsCompleted) {
                window.Progression.completeWorld(world.id);
            }
        }
    }

    checkAchievement('speed_demon', currentLevel >= 10);
    checkThemeUnlocks();
    
    // Phase 7: Track weather wins
    if (weatherType === 'RAIN' || weatherType === 'rain') weatherWins.rain++;
    else if (weatherType === 'FOG' || weatherType === 'fog') weatherWins.fog++;
    else if (weatherType === 'LIGHTNING' || weatherType === 'lightning') weatherWins.lightning++;
    else weatherWins.clear++;
    
    // Phase 7: Check Apex unlock (3 boss fruits in one run)
    if (bossFruitsDefeated >= 3 && !localStorage.getItem('apexUnlocked')) {
        localStorage.setItem('apexUnlocked', 'true');
        if (difficultySelect) {
            const apexOption = difficultySelect.querySelector('option[value="apex"]');
            if (apexOption) apexOption.disabled = false;
        }
        checkAchievement('apex_unlocker');
    }
    
    noDeathStreak++;

    // Unlock next level (uses Progression module)
    let nextLevelUnlocked = false;
    if (window.Progression) {
        nextLevelUnlocked = window.Progression.unlockNextLevel(currentLevel);
    }
    
    setTimeout(() => {
        if (levelCompleteOverlay) {
            levelCompleteOverlay.classList.remove('show');
        }
        
        // Show S-Rank results screen (uses UI module)
        if (sRankResults && window.UI) {
            window.UI.showSRankResults(currentLevel, sRankResults);
        } else {
            // Fallback: show level select
            if (window.UI) {
                window.UI.showLevelSelect();
            }
        }
    }, 2000);
}

function setLevel(level) {
    if (!window.StateManager || !window.Progression) return;
    if (level < 1 || level > TOTAL_LEVELS) return;
    
    // Check if level is unlocked (uses Progression module)
    if (!window.Progression.isLevelUnlocked(level)) {
        alert(`Level ${level} is locked! Complete previous levels to unlock it.`);
        return;
    }
    
    const state = window.StateManager;
    state.setCurrentLevel(level);
    
    // Get target score from level config
    if (window.levelConfigs) {
        const config = window.levelConfigs.find(c => c.level === level);
        if (config) {
            state.setTargetScore(config.targetScore);
        }
    }
    
    // Start ghost replay if enabled
    if (window.GhostReplay) {
        const showGhost = localStorage.getItem('showGhostReplay') === 'true';
        if (showGhost) {
            window.GhostReplay.startPlayback(level);
        } else {
            window.GhostReplay.stopPlayback();
        }
    }
    
    init();
}

// Start classic mode (for level select integration)
function startClassicMode() {
    classicMode = true;
    endlessMode = false;
    proceduralMode = false;
    bossMode = false;
    
    hideModeSelect();
    // Re-query gameScreen in case const was null
    const gameScreenEl = gameScreen || document.getElementById('gameScreen');
    if (gameScreenEl) {
        gameScreenEl.style.setProperty('display', 'flex', 'important');
    }
    updateUI();
}

// ==================== SKIN SYSTEM ====================

const snakeSkins = [
    { id: 'default', name: 'Classic Green', color: '#4CAF50', unlocked: true },
    { id: 'blue', name: 'Ocean Blue', color: '#2196F3', unlockType: 'level', unlockValue: 3 },
    { id: 'purple', name: 'Royal Purple', color: '#9C27B0', unlockType: 'level', unlockValue: 5 },
    { id: 'orange', name: 'Fire Orange', color: '#FF9800', unlockType: 'score', unlockValue: 50 },
    { id: 'cyan', name: 'Neon Cyan', color: '#00BCD4', unlockType: 'games', unlockValue: 10 },
    { id: 'rainbow', name: 'Rainbow', color: 'rainbow', unlockType: 'level', unlockValue: 15 }
];

const foodSkins = [
    { id: 'default', name: 'Classic Red', color: '#FF0000', unlocked: true },
    { id: 'gold', name: 'Golden', color: '#FFD700', unlockType: 'level', unlockValue: 7 },
    { id: 'pink', name: 'Pink', color: '#E91E63', unlockType: 'score', unlockValue: 30 }
];

let currentSnakeSkin = 'default';
let currentFoodSkin = 'default';

function checkSkinUnlocks() {
    snakeSkins.forEach(skin => {
        if (skin.unlocked) return;
        if (skin.unlockType === 'level' && currentLevel >= skin.unlockValue) {
            skin.unlocked = true;
        } else if (skin.unlockType === 'score' && score >= skin.unlockValue) {
            skin.unlocked = true;
        } else if (skin.unlockType === 'games' && gamesPlayed >= skin.unlockValue) {
            skin.unlocked = true;
        }
    });

    foodSkins.forEach(skin => {
        if (skin.unlocked) return;
        if (skin.unlockType === 'level' && currentLevel >= skin.unlockValue) {
            skin.unlocked = true;
        } else if (skin.unlockType === 'score' && score >= skin.unlockValue) {
            skin.unlocked = true;
        }
    });

    saveSkins();
}

function saveSkins() {
    localStorage.setItem('snakeSkins', JSON.stringify(snakeSkins));
    localStorage.setItem('foodSkins', JSON.stringify(foodSkins));
    localStorage.setItem('currentSnakeSkin', currentSnakeSkin);
    localStorage.setItem('currentFoodSkin', currentFoodSkin);
}

function loadSkins() {
    const savedSnakeSkins = localStorage.getItem('snakeSkins');
    const savedFoodSkins = localStorage.getItem('foodSkins');
    if (savedSnakeSkins) {
        const parsed = JSON.parse(savedSnakeSkins);
        snakeSkins.forEach((skin, i) => {
            if (parsed[i]) skin.unlocked = parsed[i].unlocked;
        });
    }
    if (savedFoodSkins) {
        const parsed = JSON.parse(savedFoodSkins);
        foodSkins.forEach((skin, i) => {
            if (parsed[i]) skin.unlocked = parsed[i].unlocked;
        });
    }
    currentSnakeSkin = localStorage.getItem('currentSnakeSkin') || 'default';
    currentFoodSkin = localStorage.getItem('currentFoodSkin') || 'default';
}

function getSnakeColor() {
    const skin = snakeSkins.find(s => s.id === currentSnakeSkin);
    if (!skin) return '#4CAF50';
    if (skin.color === 'rainbow') {
        const hue = (frameCount * 2) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }
    return skin.color;
}

function getFoodColor() {
    const skin = foodSkins.find(s => s.id === currentFoodSkin);
    return skin ? skin.color : '#FF0000';
}

// ==================== ACHIEVEMENT SYSTEM ====================

const achievements = [
    { id: 'first_bite', name: 'First Bite', desc: 'Eat 1 food', icon: '🍎', unlocked: false, check: () => totalFoodEaten >= 1 },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Beat level 10', icon: '⚡', unlocked: false, check: () => currentLevel >= 10 },
    { id: 'collector', name: 'Collector', desc: 'Unlock 3 skins', icon: '🎨', unlocked: false, check: () => SNAKE_SKINS.filter(s => s.unlocked).length >= 3 },
    { id: 'unstoppable', name: 'Unstoppable', desc: 'Play 5 games without dying', icon: '🔥', unlocked: false, check: () => noDeathStreak >= 5 },
    { id: 'century', name: 'Century', desc: 'Reach score of 100', icon: '💯', unlocked: false, check: () => score >= 100 },
    { id: 'master', name: 'Master', desc: 'Complete all 20 levels', icon: '👑', unlocked: false, check: () => currentLevel >= TOTAL_LEVELS },
    { id: 'veteran', name: 'Veteran', desc: 'Play 10 games', icon: '🎮', unlocked: false, check: () => gamesPlayed >= 10 },
    { id: 'glutton', name: 'Glutton', desc: 'Eat 50 foods', icon: '🐍', unlocked: false, check: () => totalFoodEaten >= 50 },
    { id: 'perfectionist', name: 'Perfectionist', desc: 'Reach level 15', icon: '⭐', unlocked: false, check: () => currentLevel >= 15 },
    { id: 'legend', name: 'Legend', desc: 'Reach score of 200', icon: '🏆', unlocked: false, check: () => score >= 200 },
    { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss fruit', icon: '👹', unlocked: false, check: () => bossFruitsDefeated >= 1 },
    { id: 'combo_king', name: 'Combo King', desc: 'Reach 4× combo', icon: '👑', unlocked: false, check: () => comboMultiplier >= 4 },
    { id: 'rain_warrior', name: 'Rain Warrior', desc: 'Win during rain weather', icon: '🌧️', unlocked: false, check: () => weatherWins.rain > 0 },
    { id: 'fog_master', name: 'Fog Master', desc: 'Win during fog weather', icon: '🌫️', unlocked: false, check: () => weatherWins.fog > 0 },
    { id: 'lightning_strike', name: 'Lightning Strike', desc: 'Win during lightning weather', icon: '⚡', unlocked: false, check: () => weatherWins.lightning > 0 },
    { id: 'daily_champion', name: 'Daily Champion', desc: 'Complete a daily challenge', icon: '📅', unlocked: false, check: () => dailyChallengeCompleted },
    { id: 'evolution_master', name: 'Evolution Master', desc: 'Reach evolution tier 5', icon: '🐉', unlocked: false, check: () => totalEvolutionTiers >= 5 },
    { id: 'theme_collector', name: 'Theme Collector', desc: 'Use 3 unique themes', icon: '🎭', unlocked: false, check: () => uniqueThemesUsed.size >= 3 },
    { id: 'heatmap_explorer', name: 'Heatmap Explorer', desc: 'Visit every tile on the grid', icon: '🗺️', unlocked: false, check: () => {
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (heatmap[y][x] === 0) return false;
            }
        }
        return true;
    }},
    { id: 'ghost_racer', name: 'Ghost Racer', desc: 'Beat your ghost replay', icon: '👻', unlocked: false, check: () => false }, // Special achievement
    { id: 'apex_unlocker', name: 'Apex Unlocker', desc: 'Defeat 3 boss fruits in one run', icon: '🔥', unlocked: false, check: () => localStorage.getItem('apexUnlocked') === 'true' }
];

function checkAchievement(id, condition = null) {
    const achievement = achievements.find(a => a.id === id);
    if (!achievement || achievement.unlocked) return;

    const shouldUnlock = condition !== null ? condition : (achievement.check ? achievement.check() : false);
    if (shouldUnlock) {
        achievement.unlocked = true;
        // Play achievement unlock sound
        if (window.UISoundSystem && window.UISoundSystem.playAchievement) {
            window.UISoundSystem.playAchievement();
        }
        showAchievementPopup(achievement);
        saveAchievements();
        checkAchievement('collector');
    }
}

function checkAllAchievements() {
    achievements.forEach(ach => {
        if (!ach.unlocked) {
            checkAchievement(ach.id);
        }
    });
}

function showAchievementPopup(achievement) {
    document.getElementById('achievementPopupTitle').textContent = achievement.name;
    document.getElementById('achievementPopupDesc').textContent = achievement.desc;
    achievementPopup.classList.add('show');
    setTimeout(() => {
        achievementPopup.classList.remove('show');
    }, 3000);
}

function saveAchievements() {
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

function loadAchievements() {
    const saved = localStorage.getItem('achievements');
    if (saved) {
        const parsed = JSON.parse(saved);
        achievements.forEach((ach, i) => {
            if (parsed[i]) ach.unlocked = parsed[i].unlocked;
        });
    }
}

// ==================== LEADERBOARD SYSTEM ====================

function getLeaderboard() {
    const saved = localStorage.getItem('snakeLeaderboard');
    if (saved) {
        return JSON.parse(saved);
    }
    return [
        { name: 'Snake Master', score: 250, level: 20 },
        { name: 'Pro Gamer', score: 180, level: 15 },
        { name: 'Speed Runner', score: 150, level: 12 },
        { name: 'Casual Player', score: 80, level: 8 },
        { name: 'Newbie', score: 30, level: 3 }
    ];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
}

function addToLeaderboard(score, level) {
    const leaderboard = getLeaderboard();
    leaderboard.push({ name: 'You', score, level });
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    saveLeaderboard(top10);
}

function renderLeaderboard() {
    const leaderboard = getLeaderboard();
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${entry.name}</div>
                <div>Level ${entry.level}</div>
            </div>
            <div class="leaderboard-score">${entry.score}</div>
        `;
        list.appendChild(item);
    });
}

// ==================== THEME MANAGEMENT ====================

function initTheme() {
    const savedTheme = localStorage.getItem('snakeTheme') || 'dark';
    const html = document.documentElement;
    
    // Set data-theme attribute for compatibility
    html.setAttribute('data-theme', savedTheme);
    
    // Set dark/light class
    if (savedTheme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.add('light');
        html.classList.remove('dark');
    }
    
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Add transition class for smooth animation
    html.classList.add('theme-transition');
    
    // Toggle theme
    html.setAttribute('data-theme', newTheme);
    
    // Toggle dark/light classes
    if (newTheme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.add('light');
        html.classList.remove('dark');
    }
    
    // Persist to localStorage
    localStorage.setItem('snakeTheme', newTheme);
    
    // Update UI
    updateThemeIcon(newTheme);
    updateCanvasColors();
    
    // Remove transition class after animation completes
    setTimeout(() => {
        html.classList.remove('theme-transition');
    }, 300);
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

function updateCanvasColors() {
    draw();
}

// ==================== SOUND MANAGEMENT ====================

function initAudioContext() {
    if (!isAudioContextInitialized && !isMuted) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            isAudioContextInitialized = true;
        } catch (e) {
            console.warn('Audio context not supported');
        }
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (isMuted || !audioContext || !isAudioContextInitialized) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // Reduce volume by 25% (0.3 * 0.75 = 0.225)
        gainNode.gain.setValueAtTime(0.225, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Silently fail
    }
}

function playPickupSound() {
    playSound(800, 0.1, 'sine');
    setTimeout(() => playSound(1000, 0.1, 'sine'), 50);
}

function playGameOverSound() {
    playSound(200, 0.3, 'sawtooth');
    setTimeout(() => playSound(150, 0.3, 'sawtooth'), 100);
}

function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem('snakeMuted', isMuted);
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
    
    if (!isMuted && !isAudioContextInitialized) {
        initAudioContext();
    }
}

function initSound() {
    const savedMuteState = localStorage.getItem('snakeMuted');
    isMuted = savedMuteState === 'true';
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
}

// ==================== PAUSE SYSTEM ====================

function togglePause() {
    if (!gameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.classList.add('show');
        pauseBtn.textContent = '▶';
    } else {
        pauseOverlay.classList.remove('show');
        pauseBtn.textContent = '⏸';
    }
}

// ==================== ZOOM HAZARD SYSTEM ====================

function spawnZoomHazard() {
    if (zoomHazard) return;
    
    let attempts = 0;
    let newHazard;
    do {
        newHazard = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        attempts++;
    } while ((isPositionOnSnake(newHazard.x, newHazard.y) || 
              (newHazard.x === food.x && newHazard.y === food.y)) && 
             attempts < 100);
    
    if (attempts < 100) {
        zoomHazard = newHazard;
        zoomHazardSpawnTime = Date.now();
    }
}

function collectZoomHazard() {
    if (!zoomHazard) return false;
    
    const head = snake[0];
    if (head.x === zoomHazard.x && head.y === zoomHazard.y) {
        // Activate zoom
        cameraZoom = 1.5;
        zoomHazardEndTime = Date.now() + 6000; // 6 seconds
        zoomHazard = null;
        updateZoomHazardHUD();
        
        // Particle burst
        const hazardX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const hazardY = head.y * CELL_SIZE + CELL_SIZE / 2;
        createParticleBurst(hazardX, hazardY, '#ff6b35', 20);
        
        // Update canvas transform
        const canvasWrapper = document.getElementById('canvasWrapper');
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${cameraZoom})`;
        }
        
        return true;
    }
    return false;
}

function updateZoomHazard() {
    if (!gameRunning) return;
    
    // Track active time
    if (zoomHazardEndTime > 0) {
        zoomHazardActiveTime += 16; // ~60fps
    }
    
    // Check if zoom should expire
    if (zoomHazardEndTime > 0 && Date.now() >= zoomHazardEndTime) {
        cameraZoom = 1.0;
        zoomHazardEndTime = 0;
        const canvasWrapper = document.getElementById('canvasWrapper');
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${cameraZoom})`;
        }
        updateZoomHazardHUD();
    }
    
    // Spawn new zoom hazard
    if (!zoomHazard && zoomHazardEndTime === 0) {
        const timeSinceLastSpawn = Date.now() - zoomHazardSpawnTime;
        const spawnInterval = 12000 + Math.random() * 6000; // 12-18 seconds
        
        if (zoomHazardSpawnTime === 0 || timeSinceLastSpawn >= spawnInterval) {
            spawnZoomHazard();
        }
    }
}

function updateZoomHazardHUD() {
    const hud = document.getElementById('zoomHazardHud');
    const timer = document.getElementById('zoomHazardTimer');
    
    if (zoomHazardEndTime > 0) {
        hud.style.display = 'flex';
        const remaining = ((zoomHazardEndTime - Date.now()) / 1000).toFixed(1);
        timer.textContent = `${remaining}s`;
    } else {
        hud.style.display = 'none';
    }
}

// ==================== ENDLESS MODE ====================

function initEndlessMode() {
    endlessMode = true;
    classicMode = false;
    currentLevel = 1;
    targetScore = 999;
    endlessSpeedLevel = 0;
    endlessFoodCount = 0;
    
    // Sync with StateManager
    if (window.StateManager) {
        window.StateManager.setEndlessMode(true);
        window.StateManager.setClassicMode(false);
        window.StateManager.setCurrentLevel(1);
        window.StateManager.setTargetScore(999);
    }
    
    loadBestEndlessScore();
    updateUI();
    init();
}

function initClassicMode() {
    endlessMode = false;
    classicMode = true;
    currentLevel = 1;
    targetScore = getCurrentLevelConfig().targetScore;
    endlessSpeedLevel = 0;
    endlessFoodCount = 0;
    
    // Sync with StateManager
    if (window.StateManager) {
        window.StateManager.setEndlessMode(false);
        window.StateManager.setClassicMode(true);
        window.StateManager.setCurrentLevel(1);
        window.StateManager.setTargetScore(targetScore);
    }
    
    // Set global flag to indicate Classic Mode has loaded
    // This is used by the fallback loader in classic.html
    window.classicLoaded = true;
    
    updateUI();
    init();
}

function updateEndlessMode() {
    if (!endlessMode || !gameRunning) return;
    
    // Increase speed every 6 food eaten
    const newSpeedLevel = Math.floor(endlessFoodCount / 6);
    if (newSpeedLevel > endlessSpeedLevel) {
        endlessSpeedLevel = newSpeedLevel;
        // Restart game loop with new speed
        if (gameLoop) {
            clearInterval(gameLoop);
        }
        const newSpeed = Math.max(50, INITIAL_SPEED - endlessSpeedLevel * 5);
        gameLoop = setInterval(update, newSpeed);
    }
    
    // Spawn hazard tiles occasionally
    if (Math.random() < 0.01 && hazardTiles.length < 3) {
        spawnHazardTile();
    }
}

function spawnHazardTile() {
    let attempts = 0;
    let newTile;
    do {
        newTile = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        attempts++;
    } while ((isPositionOnSnake(newTile.x, newTile.y) || 
              (newTile.x === food.x && newTile.y === food.y) ||
              (zoomHazard && newTile.x === zoomHazard.x && newTile.y === zoomHazard.y) ||
              hazardTiles.some(t => t.x === newTile.x && t.y === newTile.y)) && 
             attempts < 100);
    
    if (attempts < 100) {
        hazardTiles.push(newTile);
        setTimeout(() => {
            const index = hazardTiles.findIndex(t => t.x === newTile.x && t.y === newTile.y);
            if (index !== -1) hazardTiles.splice(index, 1);
        }, 10000); // Remove after 10 seconds
    }
}

function checkHazardTileCollision() {
    if (hazardTiles.length === 0) return false;
    
    const head = snake[0];
    const hitTile = hazardTiles.find(t => t.x === head.x && t.y === head.y);
    if (hitTile) {
        // Slow down snake temporarily
        if (gameLoop) {
            clearInterval(gameLoop);
        }
        const slowSpeed = Math.max(200, INITIAL_SPEED + 100);
        gameLoop = setInterval(update, slowSpeed);
        setTimeout(() => {
            if (gameRunning) {
                if (gameLoop) clearInterval(gameLoop);
                const currentSpeed = endlessMode ? 
                    Math.max(50, INITIAL_SPEED - endlessSpeedLevel * 5) : 
                    getCurrentLevelConfig().speed;
                gameLoop = setInterval(update, currentSpeed);
            }
        }, 2000);
        return true;
    }
    return false;
}

function saveBestEndlessScore() {
    if (endlessMode && score > bestEndlessScore) {
        bestEndlessScore = score;
        localStorage.setItem('bestEndlessScore', bestEndlessScore.toString());
    }
}

function loadBestEndlessScore() {
    const saved = localStorage.getItem('bestEndlessScore');
    if (saved) bestEndlessScore = parseInt(saved) || 0;
    const bestScoreElement = document.getElementById('endlessBestScore');
    if (bestScoreElement) {
        bestScoreElement.textContent = `Best: ${bestEndlessScore}`;
    }
}

// ==================== COMBO SYSTEM ====================

function updateCombo() {
    comboTimeout = Date.now() + 3000; // 3 second window
    comboCount++;
    const comboHud = document.getElementById('comboHud');
    const comboCountElement = document.getElementById('comboCount');
    if (comboHud && comboCountElement) {
        comboHud.style.display = 'flex';
        comboCountElement.textContent = `x${comboCount}`;
    }
}

// ==================== WEATHER SYSTEM ====================

const WEATHER_TYPES = {
    CLEAR: { name: 'Clear', icon: '☀️', intensity: 0 },
    RAIN: { name: 'Rain', icon: '🌧️', intensity: 0.3 },
    FOG: { name: 'Fog', icon: '🌫️', intensity: 0.4 },
    LIGHTNING: { name: 'Lightning', icon: '⚡', intensity: 0.5 }
};

function initWeather() {
    weatherType = 'clear';
    weatherIntensity = 0.5;
    weatherChangeTime = Date.now() + (45000 + Math.random() * 30000);
    rainDrops = [];
    fogLayers = [];
    lightningFlash = 0;
    changeWeather();
}

function changeWeather() {
    const types = Object.keys(WEATHER_TYPES);
    const newType = types[Math.floor(Math.random() * types.length)];
    weatherType = newType;
    weatherIntensity = 0.3 + Math.random() * 0.4;
    weatherChangeTime = Date.now() + (45000 + Math.random() * 30000);
    
    if (weatherIcon && WEATHER_TYPES[weatherType]) weatherIcon.textContent = WEATHER_TYPES[weatherType].icon;
    if (weatherName && WEATHER_TYPES[weatherType]) weatherName.textContent = WEATHER_TYPES[weatherType].name;
    
    // Initialize weather particles
    if (weatherType === 'RAIN' || weatherType === 'rain') {
        rainDrops = [];
        for (let i = 0; i < 50 * weatherIntensity; i++) {
            rainDrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 3 + Math.random() * 5,
                length: 10 + Math.random() * 20
            });
        }
    } else if (weatherType === 'FOG') {
        fogLayers = [];
        for (let i = 0; i < 3; i++) {
            fogLayers.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                opacity: 0.1 + weatherIntensity * 0.2,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
}

function updateWeather() {
    if (!gameRunning) return;
    
    // Check for weather change
    if (Date.now() >= weatherChangeTime) {
        changeWeather();
    }
    
    // Update lightning
    if (weatherType === 'LIGHTNING' || weatherType === 'lightning') {
        if (Math.random() < 0.01) {
            lightningFlash = 120;
            playSound(100, 0.1, 'sawtooth');
            if (canvas) canvas.classList.add('lightning-flash');
            setTimeout(() => {
                if (canvas) canvas.classList.remove('lightning-flash');
            }, 120);
        }
        if (lightningFlash > 0) lightningFlash--;
    }
    
    // Update rain
    if (weatherType === 'RAIN' || weatherType === 'rain') {
        rainDrops.forEach(drop => {
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                drop.y = -drop.length;
                drop.x = Math.random() * canvas.width;
            }
        });
    }
    
    // Update fog
    if (weatherType === 'FOG' || weatherType === 'fog') {
        fogLayers.forEach(layer => {
            layer.x += layer.speed;
            if (layer.x > canvas.width) layer.x = -canvas.width;
        });
    }
}

function drawWeather() {
    if (!weatherCtx) return;
    
    weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
    
    if (weatherType === 'RAIN' || weatherType === 'rain') {
        weatherCtx.strokeStyle = 'rgba(135, 206, 250, 0.6)';
        weatherCtx.lineWidth = 1;
        rainDrops.forEach(drop => {
            weatherCtx.beginPath();
            weatherCtx.moveTo(drop.x, drop.y);
            weatherCtx.lineTo(drop.x, drop.y + drop.length);
            weatherCtx.stroke();
        });
    } else if (weatherType === 'FOG' || weatherType === 'fog') {
        if (!highContrastMode) {
            fogLayers.forEach(layer => {
                weatherCtx.fillStyle = `rgba(200, 200, 200, ${layer.opacity})`;
                weatherCtx.fillRect(0, 0, canvas.width, canvas.height);
            });
        }
    } else if ((weatherType === 'LIGHTNING' || weatherType === 'lightning') && lightningFlash > 0) {
        weatherCtx.fillStyle = `rgba(255, 255, 255, ${lightningFlash / 120 * 0.3})`;
        weatherCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ==================== BOSS FRUIT SYSTEM ====================

function spawnBossFruit() {
    if (bossFruit || !gameRunning) return;
    if (portals && portalsActive) return; // Don't spawn during portals
    if (zoomHazard) return; // Don't spawn during zoom hazard
    
    const spawnInterval = 60000 + Math.random() * 60000;
    if (bossFruitSpawnTime === 0 || Date.now() - bossFruitSpawnTime < spawnInterval) {
        return;
    }
    
    let attempts = 0;
    let newBoss;
    do {
        newBoss = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS),
            hits: 0,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1
        };
        attempts++;
    } while ((isPositionOnSnake(newBoss.x, newBoss.y) || 
              (newBoss.x === food.x && newBoss.y === food.y)) && 
             attempts < 100);
    
    if (attempts < 100) {
        bossFruit = newBoss;
        bossFruitHitCount = 0;
        bossFruitSpawnTime = Date.now();
        if (bossFruitHud) bossFruitHud.style.display = 'flex';
    }
}

function updateBossFruit() {
    if (!bossFruit || !gameRunning) return;
    
    // Move boss fruit slowly
    bossFruit.x += bossFruit.vx;
    bossFruit.y += bossFruit.vy;
    
    // Bounce off walls
    if (bossFruit.x < 0 || bossFruit.x >= GRID_COLS) bossFruit.vx *= -1;
    if (bossFruit.y < 0 || bossFruit.y >= GRID_ROWS) bossFruit.vy *= -1;
    bossFruit.x = Math.max(0, Math.min(GRID_COLS - 1, bossFruit.x));
    bossFruit.y = Math.max(0, Math.min(GRID_ROWS - 1, bossFruit.y));
    
    // Check collision with snake head
    const head = snake[0];
    const bossX = Math.floor(bossFruit.x);
    const bossY = Math.floor(bossFruit.y);
    
    if (head.x === bossX && head.y === bossY) {
        bossFruitHitCount++;
        if (bossFruitHits) {
            bossFruitHits.textContent = `${bossFruitHitCount}/3`;
        }
        
        // Create hit particles
        createParticleBurst(
            bossX * CELL_SIZE + CELL_SIZE / 2,
            bossY * CELL_SIZE + CELL_SIZE / 2,
            '#ff6b35',
            10
        );
        
        if (bossFruitHitCount >= 3) {
            // Defeat boss fruit
            defeatBossFruit();
        }
    }
}

function defeatBossFruit() {
    const bossX = Math.floor(bossFruit.x);
    const bossY = Math.floor(bossFruit.y);
    
    // Massive score bonus
    let bonus = 50;
    if (activePowerUp && activePowerUp.id === 'score_multiplier') bonus *= 2;
    bonus *= comboMultiplier;
    score += bonus;
    
    // Combo boost
    comboMultiplier = Math.min(MAX_COMBO, comboMultiplier + 2);
    comboTimeLeft = COMBO_DECAY_TIME;
    
    // Drop random power-up
    spawnPowerUp();
    
    // Particle burst
    createParticleBurst(
        bossX * CELL_SIZE + CELL_SIZE / 2,
        bossY * CELL_SIZE + CELL_SIZE / 2,
        '#ffd700',
        50
    );
    
    bossFruitsDefeated++;
    bossFruit = null;
    bossFruitHitCount = 0;
    bossFruitSpawnTime = Date.now();
    if (bossFruitHud) bossFruitHud.style.display = 'none';
    
    checkAchievement('boss_slayer');
    updateScore();
}

function drawBossFruit() {
    if (!bossFruit) return;
    
    const bossX = bossFruit.x * CELL_SIZE;
    const bossY = bossFruit.y * CELL_SIZE;
    const size = CELL_SIZE * 1.5;
    const offset = (CELL_SIZE * 1.5 - CELL_SIZE) / 2;
    
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(bossX - offset, bossY - offset, size, size);
    
    // Draw hit indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${bossFruitHitCount}/3`, bossX + CELL_SIZE / 2, bossY + CELL_SIZE / 2 + 4);
}

// ==================== SNAKE SKINS & EVOLUTION ====================

const SNAKE_SKINS = [
    { id: 'default', name: 'Classic', color: '#4CAF50', unlocked: true, headStyle: 'square' },
    { id: 'blue', name: 'Ocean', color: '#2196F3', unlocked: false, unlockType: 'score', unlockValue: 30, headStyle: 'rounded' },
    { id: 'purple', name: 'Royal', color: '#9C27B0', unlocked: false, unlockType: 'level', unlockValue: 5, headStyle: 'arrow' },
    { id: 'gold', name: 'Golden', color: '#FFD700', unlocked: false, unlockType: 'achievement', unlockValue: 'century', headStyle: 'square' },
    { id: 'rainbow', name: 'Rainbow', color: 'rainbow', unlocked: false, unlockType: 'evolution', unlockValue: 5, headStyle: 'rounded' }
];

function checkSkinUnlocks() {
    SNAKE_SKINS.forEach(skin => {
        if (skin.unlocked) return;
        
        if (skin.unlockType === 'score' && score >= skin.unlockValue) {
            skin.unlocked = true;
        } else if (skin.unlockType === 'level' && currentLevel >= skin.unlockValue) {
            skin.unlocked = true;
        } else if (skin.unlockType === 'achievement') {
            const ach = achievements.find(a => a.id === skin.unlockValue);
            if (ach && ach.unlocked) skin.unlocked = true;
        } else if (skin.unlockType === 'evolution' && totalEvolutionTiers >= skin.unlockValue) {
            skin.unlocked = true;
        }
    });
    saveSkins();
}

function getSnakeColor() {
    const skin = SNAKE_SKINS.find(s => s.id === currentSnakeSkin) || SNAKE_SKINS[0];
    if (skin.color === 'rainbow') {
        const hue = (frameCount * 2) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }
    return skin.color;
}

function updateEvolution() {
    const foodInRun = snake.length - 1;
    const newTier = Math.floor(foodInRun / 50);
    if (newTier > snakeEvolutionTier) {
        snakeEvolutionTier = newTier;
        totalEvolutionTiers = Math.max(totalEvolutionTiers, newTier);
        checkSkinUnlocks();
    }
}

function saveSkins() {
    localStorage.setItem('snakeSkins', JSON.stringify(SNAKE_SKINS));
    localStorage.setItem('currentSnakeSkin', currentSnakeSkin);
    localStorage.setItem('totalEvolutionTiers', totalEvolutionTiers.toString());
}

function loadSkins() {
    const saved = localStorage.getItem('snakeSkins');
    if (saved) {
        const parsed = JSON.parse(saved);
        SNAKE_SKINS.forEach((skin, i) => {
            if (parsed[i]) skin.unlocked = parsed[i].unlocked;
        });
    }
    currentSnakeSkin = localStorage.getItem('currentSnakeSkin') || 'default';
    const savedTiers = localStorage.getItem('totalEvolutionTiers');
    if (savedTiers) totalEvolutionTiers = parseInt(savedTiers) || 0;
}

// ==================== DAILY CHALLENGES ====================

const DAILY_CHALLENGES = [
    {
        id: 'no_powerups',
        name: 'Pure Skill',
        desc: 'Reach score of 20 with no power-ups',
        check: () => score >= 20 && powerUpsFound === 0
    },
    {
        id: 'fog_survival',
        name: 'Fog Warrior',
        desc: 'Survive 30 seconds under heavy fog',
        check: () => {
            if (weatherType !== 'FOG' && weatherType !== 'fog') return false;
            return Date.now() - weatherChangeTime > 30000;
        }
    },
    {
        id: 'boss_hunter',
        name: 'Boss Hunter',
        desc: 'Eat 3 boss fruits in one run',
        check: () => bossFruitsDefeated >= 3
    },
    {
        id: 'combo_master',
        name: 'Combo Master',
        desc: 'Perform a 6× combo',
        check: () => comboMultiplier >= 6
    },
    {
        id: 'zoom_survivor',
        name: 'Zoom Survivor',
        desc: 'Win with zoom hazard active for majority of time',
        check: () => {
            const totalTime = Date.now() - (gameStartTime || Date.now());
            const zoomTime = zoomHazardActiveTime || 0;
            return zoomTime > totalTime * 0.5;
        }
    }
];

function getDailyChallenge() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('dailyChallengeSeed');
    const savedDate = localStorage.getItem('dailyChallengeDate');
    
    if (savedDate === today && saved) {
        dailyChallengeSeed = parseInt(saved);
    } else {
        dailyChallengeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        localStorage.setItem('dailyChallengeSeed', dailyChallengeSeed.toString());
        localStorage.setItem('dailyChallengeDate', today);
    }
    
    // Use seed to pick challenge
    const challengeIndex = dailyChallengeSeed % DAILY_CHALLENGES.length;
    return DAILY_CHALLENGES[challengeIndex];
}

function updateDailyChallenge() {
    if (!dailyChallengeActive || !dailyChallenge) return;
    
    updateDailyChallengeProgress();
    
    if (dailyChallenge.check()) {
        dailyChallengeCompleted = true;
        dailyChallengeActive = false;
        checkAchievement('daily_champion');
        saveDailyChallenge();
    }
}

function saveDailyChallenge() {
    localStorage.setItem('dailyChallengeCompleted', dailyChallengeCompleted.toString());
    localStorage.setItem('dailyChallengeProgress', dailyChallengeProgress.toString());
}

function loadDailyChallenge() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('dailyChallengeDate');
    if (savedDate === today) {
        dailyChallengeCompleted = localStorage.getItem('dailyChallengeCompleted') === 'true';
        dailyChallengeProgress = parseInt(localStorage.getItem('dailyChallengeProgress')) || 0;
    } else {
        dailyChallengeCompleted = false;
        dailyChallengeProgress = 0;
    }
}

// ==================== GHOST REPLAY SYSTEM ====================

function recordGhostReplay() {
    if (!gameRunning) return;
    if (window.ghostSystemEnabled === false) return;
    
    if (!ghostReplay) {
        ghostReplay = {
            path: [],
            startTime: Date.now()
        };
    }
    
    // Safe array access
    if (!snake || snake.length === 0) return;
    const head = snake[0];
    if (!head || typeof head.x !== 'number' || typeof head.y !== 'number') return;
    ghostReplay.path.push({
        x: head.x,
        y: head.y,
        dx: dx,
        dy: dy,
        time: Date.now() - ghostReplay.startTime
    });
    
    // Limit to last 2 runs (keep only recent)
    if (ghostReplay.path.length > 2000) {
        ghostReplay.path = ghostReplay.path.slice(-1000);
    }
}

function saveGhostReplay() {
    if (window.ghostSystemEnabled === false) return;
    if (ghostReplay && ghostReplay.path.length > 0) {
        const saved = localStorage.getItem('ghostReplays');
        let replays = saved ? JSON.parse(saved) : [];
        replays.push(ghostReplay);
        if (replays.length > 2) replays.shift(); // Keep only last 2
        localStorage.setItem('ghostReplays', JSON.stringify(replays));
    }
}

function loadGhostReplay() {
    if (window.ghostSystemEnabled === false) return null;
    const saved = localStorage.getItem('ghostReplays');
    if (saved) {
        const replays = JSON.parse(saved);
        if (replays.length > 0) {
            return replays[replays.length - 1]; // Get most recent
        }
    }
    return null;
}

function drawGhostReplay() {
    if (window.ghostSystemEnabled === false) return;
    if (!showGhost || !ghostReplay) return;
    
    const currentTime = Date.now() - (gameStartTime || Date.now());
    const ghostPath = ghostReplay.path.filter(p => p.time <= currentTime * 1.1); // Slightly faster
    
    if (ghostPath.length === 0) return;
    
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ghostPath.forEach((point, i) => {
        const x = point.x * CELL_SIZE + CELL_SIZE / 2;
        const y = point.y * CELL_SIZE + CELL_SIZE / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    ctx.restore();
}

// ==================== HEATMAP SYSTEM ====================

function initHeatmap() {
    heatmap = [];
    for (let y = 0; y < GRID_ROWS; y++) {
        heatmap[y] = [];
        for (let x = 0; x < GRID_COLS; x++) {
            heatmap[y][x] = 0;
        }
    }
}

function updateHeatmap() {
    if (!gameRunning) return;
    
    const head = snake[0];
    if (head.x >= 0 && head.x < GRID_COLS && head.y >= 0 && head.y < GRID_ROWS) {
        heatmap[head.y][head.x]++;
    }
}

function drawHeatmap() {
    if (!showHeatmap || !heatmapCtx) return;
    
    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    
    let maxVisits = 0;
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            maxVisits = Math.max(maxVisits, heatmap[y][x]);
        }
    }
    
    if (maxVisits === 0) return;
    
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            const visits = heatmap[y][x];
            if (visits > 0) {
                const intensity = visits / maxVisits;
                let color;
                if (intensity < 0.33) {
                    color = `rgba(0, 255, 255, ${intensity * 0.5})`; // Teal
                } else if (intensity < 0.66) {
                    color = `rgba(255, 255, 0, ${intensity * 0.5})`; // Yellow
                } else {
                    color = `rgba(255, 0, 0, ${intensity * 0.5})`; // Red
                }
                heatmapCtx.fillStyle = color;
                heatmapCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function exportHeatmap() {
    const data = {
        grid: heatmap,
        timestamp: Date.now(),
        score: score,
        level: currentLevel
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmap-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== DIFFICULTY TIERS ====================

const DIFFICULTIES = {
    easy: {
        speedMultiplier: 1.5,
        powerUpFrequency: 1.5,
        foodFrequency: 1.2,
        hazards: false
    },
    normal: {
        speedMultiplier: 1.0,
        powerUpFrequency: 1.0,
        foodFrequency: 1.0,
        hazards: false
    },
    hard: {
        speedMultiplier: 0.7,
        powerUpFrequency: 0.7,
        foodFrequency: 0.8,
        hazards: true
    },
    insane: {
        speedMultiplier: 0.5,
        powerUpFrequency: 0.5,
        foodFrequency: 0.6,
        hazards: true,
        constantRotation: true,
        frequentZoom: true,
        alwaysWeather: true
    },
    apex: {
        speedMultiplier: 0.3,
        powerUpFrequency: 0.3,
        foodFrequency: 0.5,
        hazards: true,
        constantRotation: true,
        frequentZoom: true,
        alwaysWeather: true,
        minMoveDelay: 50
    }
};

function applyDifficulty() {
    const diff = DIFFICULTIES[currentDifficulty];
    if (!diff) return;
    
    // Apply difficulty modifiers in game loop
    if (diff.constantRotation && !boardRotationEnabled) {
        boardRotationEnabled = true;
    }
    if (diff.alwaysWeather && weatherType === 'clear') {
        changeWeather();
    }
}

function checkComboTimeout() {
    if (comboTimeout > 0 && Date.now() > comboTimeout) {
        comboCount = 0;
        comboTimeout = 0;
        const comboHud = document.getElementById('comboHud');
        if (comboHud) {
            comboHud.style.display = 'none';
        }
    }
}

// ==================== PROCEDURAL TERRAIN GENERATION ====================

const TERRAIN_TYPES = {
    EMPTY: 0,
    WALL: 1,
    SLOW_ZONE: 2,
    BOUNCE_TILE: 3,
    HAZARD_TILE: 4
};
window.TERRAIN_TYPES = TERRAIN_TYPES; // Expose for item effects

let proceduralSeed = null;
let currentBiome = 'default';

// Simple seeded random number generator
class SeededRandom {
    constructor(seed) {
        this.seed = seed || Date.now();
    }
    
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

let seededRandom = new SeededRandom();

function generateProceduralTerrain(cols, rows, density, biome, seed = null) {
    terrainTiles = [];
    if (seed !== null) {
        proceduralSeed = seed;
        seededRandom = new SeededRandom(seed);
    } else {
        proceduralSeed = Date.now();
        seededRandom = new SeededRandom(proceduralSeed);
    }
    currentBiome = biome;
    
    // Generate safe spawn zone (center area)
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const safeRadius = 3;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            // Keep spawn zone clear
            if (distFromCenter < safeRadius) {
                terrainTiles.push({ x, y, type: TERRAIN_TYPES.EMPTY });
                continue;
            }
            
            // Use noise-based generation
            const noise = seededRandom.next();
            if (noise < density / 100) {
                const tileType = seededRandom.next();
                let type = TERRAIN_TYPES.EMPTY;
                
                if (tileType < 0.5) {
                    type = TERRAIN_TYPES.WALL;
                } else if (tileType < 0.7) {
                    type = TERRAIN_TYPES.SLOW_ZONE;
                } else if (tileType < 0.85) {
                    type = TERRAIN_TYPES.BOUNCE_TILE;
                } else {
                    type = TERRAIN_TYPES.HAZARD_TILE;
                }
                
                terrainTiles.push({ x, y, type });
            } else {
                terrainTiles.push({ x, y, type: TERRAIN_TYPES.EMPTY });
            }
        }
    }
    
    localStorage.setItem('proceduralSeed', proceduralSeed.toString());
    return terrainTiles;
}

function getTerrainAt(x, y) {
    return terrainTiles.find(t => t.x === x && t.y === y);
}

function isTerrainBlocked(x, y) {
    const terrain = getTerrainAt(x, y);
    return terrain && terrain.type === TERRAIN_TYPES.WALL;
}

function initProceduralMode() {
    proceduralMode = true;
    classicMode = false;
    endlessMode = false;
    bossMode = false;
    
    const boardSize = parseInt(document.getElementById('boardSizeSlider')?.value || 20);
    const density = parseInt(document.getElementById('obstacleDensitySlider')?.value || 30);
    const biome = document.getElementById('biomeSelect')?.value || 'default';
    const useSeed = document.getElementById('useSeedCheck')?.checked || false;
    const seed = useSeed ? (document.getElementById('seedInput')?.value || null) : null;
    
    // Temporarily adjust grid size
    const oldCols = GRID_COLS;
    const oldRows = GRID_ROWS;
    
    generateProceduralTerrain(boardSize, boardSize, density, biome, seed ? parseInt(seed) : null);
    
    init();
}

// ==================== LEVEL EDITOR ====================

const editorCanvas = document.getElementById('editorCanvas');
const editorCtx = editorCanvas ? editorCanvas.getContext('2d') : null;
let editorTiles = [];
let selectedTileType = TERRAIN_TYPES.EMPTY;
let editorMode = false;
let editorCols = 20;
let editorRows = 20;

const TILE_ICONS = {
    [TERRAIN_TYPES.EMPTY]: '⬜',
    [TERRAIN_TYPES.WALL]: '⬛',
    [TERRAIN_TYPES.SLOW_ZONE]: '🟦',
    [TERRAIN_TYPES.BOUNCE_TILE]: '🟨',
    [TERRAIN_TYPES.HAZARD_TILE]: '🟥'
};

function initLevelEditor() {
    if (!editorCanvas || !editorCtx) return;
    
    editorCols = 20;
    editorRows = 20;
    editorCanvas.width = editorCols * CELL_SIZE;
    editorCanvas.height = editorRows * CELL_SIZE;
    
    // Initialize empty tiles
    editorTiles = [];
    for (let y = 0; y < editorRows; y++) {
        for (let x = 0; x < editorCols; x++) {
            editorTiles.push({ x, y, type: TERRAIN_TYPES.EMPTY });
        }
    }
    
    renderEditor();
    renderTilePalette();
}

function renderTilePalette() {
    const palette = document.getElementById('tilePalette');
    if (!palette) return;
    
    palette.innerHTML = '';
    Object.entries(TILE_ICONS).forEach(([type, icon]) => {
        const item = document.createElement('div');
        item.className = 'tile-palette-item';
        if (parseInt(type) === selectedTileType) item.classList.add('selected');
        item.textContent = icon;
        item.onclick = () => {
            selectedTileType = parseInt(type);
            document.querySelectorAll('.tile-palette-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        };
        palette.appendChild(item);
    });
}

function renderEditor() {
    if (!editorCtx) return;
    
    editorCtx.fillStyle = '#111';
    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Draw grid
    editorCtx.strokeStyle = '#333';
    editorCtx.lineWidth = 1;
    for (let x = 0; x <= editorCols; x++) {
        editorCtx.beginPath();
        editorCtx.moveTo(x * CELL_SIZE, 0);
        editorCtx.lineTo(x * CELL_SIZE, editorCanvas.height);
        editorCtx.stroke();
    }
    for (let y = 0; y <= editorRows; y++) {
        editorCtx.beginPath();
        editorCtx.moveTo(0, y * CELL_SIZE);
        editorCtx.lineTo(editorCanvas.width, y * CELL_SIZE);
        editorCtx.stroke();
    }
    
    // Draw tiles
    editorTiles.forEach(tile => {
        if (tile.type === TERRAIN_TYPES.EMPTY) return;
        
        const x = tile.x * CELL_SIZE;
        const y = tile.y * CELL_SIZE;
        
        let color = '#333';
        if (tile.type === TERRAIN_TYPES.WALL) color = '#666';
        else if (tile.type === TERRAIN_TYPES.SLOW_ZONE) color = '#0066ff';
        else if (tile.type === TERRAIN_TYPES.BOUNCE_TILE) color = '#ffaa00';
        else if (tile.type === TERRAIN_TYPES.HAZARD_TILE) color = '#ff0000';
        
        editorCtx.fillStyle = color;
        editorCtx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
}

function saveLevel() {
    const levelName = prompt('Enter level name:');
    if (!levelName) return;
    
    const levelData = {
        name: levelName,
        cols: editorCols,
        rows: editorRows,
        tiles: editorTiles,
        createdAt: Date.now()
    };
    
    const savedLevels = JSON.parse(localStorage.getItem('customLevels') || '[]');
    savedLevels.push(levelData);
    localStorage.setItem('customLevels', JSON.stringify(savedLevels));
    
    updateLevelSelect();
    alert('Level saved!');
}

function loadLevel(name) {
    const savedLevels = JSON.parse(localStorage.getItem('customLevels') || '[]');
    const level = savedLevels.find(l => l.name === name);
    if (!level) return;
    
    editorCols = level.cols;
    editorRows = level.rows;
    editorTiles = level.tiles;
    editorCanvas.width = editorCols * CELL_SIZE;
    editorCanvas.height = editorRows * CELL_SIZE;
    
    renderEditor();
}

function clearLevel() {
    editorTiles = [];
    for (let y = 0; y < editorRows; y++) {
        for (let x = 0; x < editorCols; x++) {
            editorTiles.push({ x, y, type: TERRAIN_TYPES.EMPTY });
        }
    }
    renderEditor();
}

function playtestLevel() {
    terrainTiles = editorTiles.filter(t => t.type !== TERRAIN_TYPES.EMPTY);
    closeModal(document.getElementById('levelEditorModal'));
    hideModeSelect();
    init();
}

function updateLevelSelect() {
    const select = document.getElementById('loadLevelSelect');
    if (!select) return;
    
    const savedLevels = JSON.parse(localStorage.getItem('customLevels') || '[]');
    select.innerHTML = '<option value="">Select Level...</option>';
    savedLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.name;
        option.textContent = level.name;
        select.appendChild(option);
    });
}

// Editor canvas click handler
if (editorCanvas) {
    editorCanvas.addEventListener('click', (e) => {
        const rect = editorCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        
        if (x >= 0 && x < editorCols && y >= 0 && y < editorRows) {
            const index = editorTiles.findIndex(t => t.x === x && t.y === y);
            if (index !== -1) {
                editorTiles[index].type = selectedTileType;
                renderEditor();
            }
        }
    });
}

// ==================== INVENTORY & SHOP SYSTEM ====================

const SHOP_ITEMS = {
    skins: [
        { id: 'golden_skin', name: 'Golden Skin', price: 100, icon: '🟨', type: 'skin' },
        { id: 'neon_skin', name: 'Neon Skin', price: 150, icon: '💡', type: 'skin' },
        { id: 'fire_skin', name: 'Fire Skin', price: 200, icon: '🔥', type: 'skin' }
    ],
    powerups: [
        { id: 'speed_boost_token', name: 'Speed Boost Token', price: 50, icon: '⚡', type: 'token' },
        { id: 'shield_token', name: 'Shield Token', price: 75, icon: '🛡️', type: 'token' },
        { id: 'double_score_token', name: 'Double Score Token', price: 100, icon: '⭐', type: 'token' }
    ],
    cosmetics: [
        { id: 'rainbow_trail', name: 'Rainbow Trail', price: 80, icon: '🌈', type: 'cosmetic' },
        { id: 'sparkle_effect', name: 'Sparkle Effect', price: 120, icon: '✨', type: 'cosmetic' }
    ]
};

let inventory = {
    skins: [],
    tokens: {},
    cosmetics: []
};

function loadInventory() {
    const saved = localStorage.getItem('snakeInventory');
    if (saved) {
        inventory = JSON.parse(saved);
    }
    loadSnakeCoins();
}

function saveInventory() {
    localStorage.setItem('snakeInventory', JSON.stringify(inventory));
}

function loadSnakeCoins() {
    // Use progression system gold if available
    if (window.playerStats) {
        snakeCoins = window.playerStats.gold || 0;
    } else {
        const saved = localStorage.getItem('snakeCoins');
        snakeCoins = saved ? parseInt(saved) : 0;
    }
    if (coinsElement) coinsElement.textContent = snakeCoins;
}

function saveSnakeCoins() {
    // Save to progression system if available
    if (window.playerStats) {
        window.playerStats.gold = snakeCoins;
        if (window.saveProgression) window.saveProgression();
    } else {
        localStorage.setItem('snakeCoins', snakeCoins.toString());
    }
    if (coinsElement) coinsElement.textContent = snakeCoins;
}

function addCoins(amount) {
    snakeCoins += amount;
    // Also add to progression system
    if (window.addGold) {
        window.addGold(amount);
        if (window.playerStats) snakeCoins = window.playerStats.gold; // Sync
    }
    saveSnakeCoins();
}

function buyItem(item) {
    if (snakeCoins < item.price) {
        alert('Not enough coins!');
        return;
    }
    
    snakeCoins -= item.price;
    saveSnakeCoins();
    
    if (item.type === 'skin') {
        if (!inventory.skins.includes(item.id)) {
            inventory.skins.push(item.id);
        }
    } else if (item.type === 'token') {
        inventory.tokens[item.id] = (inventory.tokens[item.id] || 0) + 1;
    } else if (item.type === 'cosmetic') {
        if (!inventory.cosmetics.includes(item.id)) {
            inventory.cosmetics.push(item.id);
        }
    }
    
    saveInventory();
    renderShop();
    renderInventory();
}

// Legacy renderShop - now handled by shop-ui.js
// This function is kept for backward compatibility but shop-ui.js takes precedence
function renderShop() {
    // Use new shop UI if available
    if (window.renderShop) {
        window.renderShop();
        return;
    }
    
    // Fallback to old implementation
    const content = document.getElementById('shopContent');
    const shopCoinsDisplay = document.getElementById('shopCoinsDisplay');
    if (!content) return;
    
    if (shopCoinsDisplay) shopCoinsDisplay.textContent = snakeCoins;
    
    const activeTab = document.querySelector('.shop-tab.active')?.getAttribute('data-tab') || 'skins';
    const items = SHOP_ITEMS[activeTab] || [];
    
    content.innerHTML = '';
    items.forEach(item => {
        const owned = (item.type === 'skin' && inventory.skins.includes(item.id)) ||
                     (item.type === 'token' && inventory.tokens[item.id] > 0) ||
                     (item.type === 'cosmetic' && inventory.cosmetics.includes(item.id));
        
        const div = document.createElement('div');
        div.className = 'shop-item';
        if (owned) div.classList.add('owned');
        div.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-price">🪙 ${item.price}</div>
            ${owned ? '<div style="color: var(--snake-color); margin-top: 5px;">Owned</div>' : 
              '<button class="btn" style="margin-top: 10px; width: 100%;">Buy</button>'}
        `;
        
        if (!owned) {
            div.querySelector('button').onclick = () => buyItem(item);
        }
        
        content.appendChild(div);
    });
}

// Legacy renderInventory - now handled by inventory-ui.js
// This function is kept for backward compatibility but inventory-ui.js takes precedence
function renderInventory() {
    // Use new inventory UI if available
    if (window.renderInventory) {
        window.renderInventory();
        return;
    }
    
    // Fallback to old implementation
    const content = document.getElementById('inventoryContent');
    if (!content) return;
    
    const activeTab = document.querySelector('.inventory-tab.active')?.getAttribute('data-tab') || 'items';
    
    content.innerHTML = '';
    
    if (activeTab === 'items') {
        [...inventory.skins, ...inventory.cosmetics].forEach(itemId => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `<div style="font-size: 2em;">🎁</div><div>${itemId}</div>`;
            content.appendChild(div);
        });
    } else {
        Object.entries(inventory.tokens).forEach(([tokenId, count]) => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `<div style="font-size: 2em;">⚡</div><div>${tokenId}</div><div>x${count}</div>`;
            content.appendChild(div);
        });
    }
}

// ==================== MISSIONS & PROGRESSION ====================

const MAX_PLAYER_LEVEL = 50;
let activeMissions = [];
let completedMissions = [];

const MISSION_TEMPLATES = [
    { id: 'eat_food', name: 'Food Collector', desc: 'Eat X food', target: 10, reward: 50, type: 'food' },
    { id: 'survive_time', name: 'Survivor', desc: 'Survive Y seconds', target: 30, reward: 75, type: 'time' },
    { id: 'defeat_boss', name: 'Boss Hunter', desc: 'Defeat a boss', target: 1, reward: 200, type: 'boss' },
    { id: 'collect_powerups', name: 'Power Seeker', desc: 'Collect Z power-ups', target: 5, reward: 100, type: 'powerups' },
    { id: 'procedural_map', name: 'Explorer', desc: 'Complete a procedural map', target: 1, reward: 150, type: 'procedural' },
    { id: 'combo_chain', name: 'Combo Master', desc: 'Achieve a combo of X', target: 5, reward: 80, type: 'combo' }
];

function generateMissions() {
    activeMissions = [];
    const available = MISSION_TEMPLATES.filter(m => 
        !completedMissions.includes(m.id) || Math.random() > 0.5
    );
    
    for (let i = 0; i < 3 && available.length > 0; i++) {
        const index = Math.floor(Math.random() * available.length);
        const template = available.splice(index, 1)[0];
        activeMissions.push({
            ...template,
            progress: 0,
            completed: false
        });
    }
    
    saveMissions();
}

function updateMissionProgress(missionId, amount = 1) {
    const mission = activeMissions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;
    
    mission.progress += amount;
    if (mission.progress >= mission.target) {
        mission.completed = true;
        completeMission(mission);
    }
    
    saveMissions();
    renderMissions();
}

function completeMission(mission) {
    addCoins(mission.reward);
    addPlayerXP(mission.reward / 2);
    completedMissions.push(mission.id);
    activeMissions = activeMissions.filter(m => m.id !== mission.id);
    
    if (activeMissions.length < 3) {
        generateMissions();
    }
    
    saveMissions();
}

function addPlayerXP(amount) {
    playerXP += amount;
    const xpNeeded = playerLevel * 100;
    
    if (playerXP >= xpNeeded && playerLevel < MAX_PLAYER_LEVEL) {
        playerXP -= xpNeeded;
        playerLevel++;
        if (playerLevelElement) playerLevelElement.textContent = playerLevel;
    }
    
    savePlayerProgress();
    renderMissions();
}

function savePlayerProgress() {
    localStorage.setItem('playerLevel', playerLevel.toString());
    localStorage.setItem('playerXP', playerXP.toString());
}

function loadPlayerProgress() {
    const savedLevel = localStorage.getItem('playerLevel');
    const savedXP = localStorage.getItem('playerXP');
    if (savedLevel) playerLevel = parseInt(savedLevel) || 1;
    if (savedXP) playerXP = parseFloat(savedXP) || 0;
    if (playerLevelElement) playerLevelElement.textContent = playerLevel;
}

function saveMissions() {
    localStorage.setItem('activeMissions', JSON.stringify(activeMissions));
    localStorage.setItem('completedMissions', JSON.stringify(completedMissions));
}

function loadMissions() {
    const savedActive = localStorage.getItem('activeMissions');
    const savedCompleted = localStorage.getItem('completedMissions');
    if (savedActive) activeMissions = JSON.parse(savedActive);
    if (savedCompleted) completedMissions = JSON.parse(savedCompleted);
    
    if (activeMissions.length === 0) {
        generateMissions();
    }
}

function renderMissions() {
    const list = document.getElementById('missionsList');
    const levelProgressFill = document.getElementById('levelProgressFill');
    const levelProgressText = document.getElementById('levelProgressText');
    const missionsPlayerLevel = document.getElementById('missionsPlayerLevel');
    
    if (!list) return;
    
    if (missionsPlayerLevel) missionsPlayerLevel.textContent = playerLevel;
    
    const xpNeeded = playerLevel * 100;
    const progressPercent = (playerXP / xpNeeded) * 100;
    if (levelProgressFill) levelProgressFill.style.width = `${progressPercent}%`;
    if (levelProgressText) levelProgressText.textContent = `${Math.floor(playerXP)} / ${xpNeeded} XP`;
    
    list.innerHTML = '';
    activeMissions.forEach(mission => {
        const item = document.createElement('div');
        item.className = 'mission-item';
        if (mission.completed) item.classList.add('completed');
        
        const progressPercent = Math.min(100, (mission.progress / mission.target) * 100);
        
        item.innerHTML = `
            <div class="mission-header">
                <div class="mission-name">${mission.name}</div>
                <div class="mission-reward">🪙 ${mission.reward}</div>
            </div>
            <div class="mission-desc">${mission.desc}</div>
            <div class="mission-progress">
                <div>${mission.progress} / ${mission.target}</div>
                <div class="mission-progress-bar">
                    <div class="mission-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// ==================== BOSS BATTLE SYSTEM ====================

const BOSS_TYPES = {
    BURROWER: {
        id: 'burrower',
        name: 'The Burrower',
        maxHP: 100,
        color: '#8b4513',
        icon: '🕳️'
    },
    DIVIDER: {
        id: 'divider',
        name: 'The Divider',
        maxHP: 150,
        color: '#9c27b0',
        icon: '🔀'
    },
    SENTINEL: {
        id: 'sentinel',
        name: 'The Sentinel',
        maxHP: 200,
        color: '#f44336',
        icon: '🛡️'
    }
};

let bossProjectiles = [];
let bossMinions = [];

function spawnBoss(type) {
    const boss = BOSS_TYPES[type];
    if (!boss) return;
    
    currentBoss = {
        ...boss,
        hp: boss.maxHP,
        x: Math.floor(GRID_COLS / 2),
        y: Math.floor(GRID_ROWS / 2),
        phase: 1,
        lastAttack: Date.now(),
        attackCooldown: 3000,
        underground: false,
        splitForms: [],
        rotation: 0
    };
    
    bossPhase = 1;
    updateBossHUD();
}

function updateBoss() {
    if (!currentBoss || !gameRunning) return;
    
    const now = Date.now();
    const timeSinceLastAttack = now - currentBoss.lastAttack;
    
    if (timeSinceLastAttack >= currentBoss.attackCooldown) {
        performBossAttack();
        currentBoss.lastAttack = now;
    }
    
    // Update boss-specific behavior
    if (currentBoss.id === 'burrower') {
        updateBurrower();
    } else if (currentBoss.id === 'divider') {
        updateDivider();
    } else if (currentBoss.id === 'sentinel') {
        updateSentinel();
    }
    
    // Check boss hit
    const head = snake[0];
    if (head.x === currentBoss.x && head.y === currentBoss.y) {
        hitBoss(10);
    }
    
    // Update projectiles
    updateBossProjectiles();
    
    // Phase transitions
    const hpPercent = currentBoss.hp / currentBoss.maxHP;
    if (hpPercent < 0.3 && bossPhase === 1) {
        bossPhase = 2;
        currentBoss.attackCooldown = 1500; // Faster attacks
    }
}

function performBossAttack() {
    if (!currentBoss) return;
    
    // Flash warning
    if (bossWarningOverlay) {
        bossWarningOverlay.style.display = 'flex';
        const warningText = document.getElementById('bossWarningText');
        if (warningText) warningText.textContent = `⚠️ ${currentBoss.name} Attack! ⚠️`;
        setTimeout(() => {
            if (bossWarningOverlay) bossWarningOverlay.style.display = 'none';
        }, 500);
    }
    
    if (currentBoss.id === 'burrower') {
        // Shockwave rings
        createShockwaveRings(currentBoss.x, currentBoss.y);
    } else if (currentBoss.id === 'divider') {
        // Split into mini-forms
        if (currentBoss.splitForms.length === 0) {
            splitBoss();
        }
    } else if (currentBoss.id === 'sentinel') {
        // Shoot projectiles
        shootBossProjectiles();
    }
}

function updateBurrower() {
    if (!currentBoss) return;
    
    // Burrower goes underground periodically
    if (Math.random() < 0.02) {
        currentBoss.underground = !currentBoss.underground;
        if (currentBoss.underground) {
            // Move to random position
            currentBoss.x = Math.floor(Math.random() * GRID_COLS);
            currentBoss.y = Math.floor(Math.random() * GRID_ROWS);
        }
    }
}

function updateDivider() {
    if (!currentBoss) return;
    
    // Move split forms toward snake
    if (currentBoss.splitForms.length > 0) {
        const head = snake[0];
        currentBoss.splitForms.forEach(form => {
            const dx = head.x - form.x;
            const dy = head.y - form.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                form.x += Math.sign(dx);
                form.y += Math.sign(dy);
            }
        });
        
        // Reform after time
        if (Date.now() - currentBoss.splitTime > 5000) {
            currentBoss.splitForms = [];
        }
    }
}

function updateSentinel() {
    if (!currentBoss) return;
    
    // Rotate around center
    currentBoss.rotation += 0.05;
    const centerX = GRID_COLS / 2;
    const centerY = GRID_ROWS / 2;
    const radius = 5;
    currentBoss.x = Math.floor(centerX + Math.cos(currentBoss.rotation) * radius);
    currentBoss.y = Math.floor(centerY + Math.sin(currentBoss.rotation) * radius);
    
    // Occasional charge
    if (Math.random() < 0.01) {
        chargeAttack();
    }
}

function splitBoss() {
    if (!currentBoss) return;
    currentBoss.splitTime = Date.now();
    currentBoss.splitForms = [
        { x: currentBoss.x - 2, y: currentBoss.y },
        { x: currentBoss.x + 2, y: currentBoss.y },
        { x: currentBoss.x, y: currentBoss.y - 2 },
        { x: currentBoss.x, y: currentBoss.y + 2 }
    ];
}

function createShockwaveRings(x, y) {
    for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
            bossProjectiles.push({
                x, y,
                radius: 0,
                maxRadius: GRID_COLS,
                speed: 0.5,
                damage: 1
            });
        }, i * 300);
    }
}

function shootBossProjectiles() {
    if (!currentBoss) return;
    
    const head = snake[0];
    const angle = Math.atan2(head.y - currentBoss.y, head.x - currentBoss.x);
    
    for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.3;
        bossProjectiles.push({
            x: currentBoss.x,
            y: currentBoss.y,
            vx: Math.cos(angle + spread) * 0.3,
            vy: Math.sin(angle + spread) * 0.3,
            damage: 5
        });
    }
}

function chargeAttack() {
    if (!currentBoss) return;
    const head = snake[0];
    currentBoss.chargeTarget = { x: head.x, y: head.y };
    currentBoss.charging = true;
}

function updateBossProjectiles() {
    bossProjectiles = bossProjectiles.filter(proj => {
        if (proj.radius !== undefined) {
            // Shockwave ring
            proj.radius += proj.speed;
            if (proj.radius > proj.maxRadius) return false;
            
            // Check collision with snake
            const head = snake[0];
            const dist = Math.sqrt((head.x - proj.x) ** 2 + (head.y - proj.y) ** 2);
            if (Math.abs(dist - proj.radius) < 1) {
                gameOver();
                return false;
            }
        } else {
            // Regular projectile
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            if (proj.x < 0 || proj.x >= GRID_COLS || proj.y < 0 || proj.y >= GRID_ROWS) {
                return false;
            }
            
            // Check collision
            const head = snake[0];
            if (Math.floor(proj.x) === head.x && Math.floor(proj.y) === head.y) {
                gameOver();
                return false;
            }
        }
        return true;
    });
}

function hitBoss(damage) {
    if (!currentBoss) return;
    
    currentBoss.hp -= damage;
    createParticleBurst(
        currentBoss.x * CELL_SIZE + CELL_SIZE / 2,
        currentBoss.y * CELL_SIZE + CELL_SIZE / 2,
        currentBoss.color,
        15,
        { speed: 5, size: 4 }
    );
    
    if (currentBoss.hp <= 0) {
        defeatBoss();
    }
    
    updateBossHUD();
}

function defeatBoss() {
    if (!currentBoss) return;
    
    createExplosion(
        currentBoss.x * CELL_SIZE + CELL_SIZE / 2,
        currentBoss.y * CELL_SIZE + CELL_SIZE / 2,
        currentBoss.color,
        2
    );
    
    // Rewards
    addCoins(500);
    addPlayerXP(200);
    updateMissionProgress('defeat_boss', 1);
    
    currentBoss = null;
    bossProjectiles = [];
    bossMinions = [];
    updateBossHUD();
    
    setTimeout(() => {
        if (gameRunning) {
            // Spawn new boss or end battle
            if (Math.random() < 0.5) {
                const types = Object.keys(BOSS_TYPES);
                spawnBoss(types[Math.floor(Math.random() * types.length)]);
            }
        }
    }, 2000);
}

function updateBossHUD() {
    const bossHud = document.getElementById('bossHud');
    const bossName = document.getElementById('bossName');
    const bossHealthFill = document.getElementById('bossHealthFill');
    
    if (!currentBoss) {
        if (bossHud) bossHud.style.display = 'none';
        return;
    }
    
    if (bossHud) bossHud.style.display = 'flex';
    if (bossName) bossName.textContent = currentBoss.name;
    if (bossHealthFill) {
        const percent = (currentBoss.hp / currentBoss.maxHP) * 100;
        bossHealthFill.style.width = `${percent}%`;
    }
}

function initBossMode() {
    bossMode = true;
    classicMode = false;
    endlessMode = false;
    proceduralMode = false;
    
    const types = Object.keys(BOSS_TYPES);
    spawnBoss(types[Math.floor(Math.random() * types.length)]);
    
    init();
}

// ==================== INITIALIZATION ====================

function init() {
    snake = [{ x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) }];
    food = generateFood();
    foodSpawnTime = Date.now();
    dx = 0;
    dy = 0;
    score = 0;
    gameRunning = false;
    isPaused = false;
    directionChangedThisTick = false;
    frameCount = 0;
    cameraShakeX = 0;
    cameraShakeY = 0;
    cameraZoom = 1.0;
    particles = [];
    activePowerUp = null;
    powerUpEndTime = 0;
    powerUpSpawnTime = 0;
    zoomHazard = null;
    zoomHazardEndTime = 0;
    zoomHazardSpawnTime = 0;
    hazardTiles = [];
    comboCount = 0;
    comboTimeout = 0;
    endlessFoodCount = 0;
    comboMultiplier = 1;
    comboTimeLeft = 0;
    portals = null;
    portalsActive = false;
    if (portalIndicator) portalIndicator.classList.remove('active');
    boardRotation = 0;
    lastRotationChange = Date.now();
    
    // Expose game state for item effects
    window.snake = snake;
    window.dx = dx;
    window.dy = dy;
    window.GRID_COLS = GRID_COLS;
    window.GRID_ROWS = GRID_ROWS;
    window.CELL_SIZE = CELL_SIZE;
    window.createParticleBurst = createParticleBurst;
    
    // Apply item effects to initialization
    if (window.applyItemEffectsToInit) {
        window.applyItemEffectsToInit();
        // Sync snake back from item effects if modified
        if (window.snake && window.snake !== snake) {
            snake = window.snake;
        }
    }
    
    // Phase 7: Reset new systems
    bossFruit = null;
    bossFruitHitCount = 0;
    bossFruitSpawnTime = 0;
    bossFruitsDefeated = 0; // Reset per run
    snakeEvolutionTier = 0;
    ghostReplay = null;
    gameStartTime = 0;
    zoomHazardActiveTime = 0;
    initHeatmap();
    initWeather();
    if (bossFruitHud) bossFruitHud.style.display = 'none';
    
    // Phase 8: Reset terrain and boss
    if (!proceduralMode && !bossMode) {
        terrainTiles = [];
    }
    if (!bossMode) {
        currentBoss = null;
        bossProjectiles = [];
        bossMinions = [];
        updateBossHUD();
    }
    
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Safe DOM access with null checks
    if (gameOverOverlay) gameOverOverlay.classList.remove('show');
    if (pauseOverlay) pauseOverlay.classList.remove('show');
    if (pauseBtn) pauseBtn.textContent = '⏸';
    
    // Reset canvas zoom
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (canvasWrapper) {
        canvasWrapper.style.transform = 'scale(1.0)';
    }
    
    // Hide HUD elements
    const zoomHud = document.getElementById('zoomHazardHud');
    const comboHud = document.getElementById('comboHud');
    if (zoomHud) zoomHud.style.display = 'none';
    if (comboHud) comboHud.style.display = 'none';
    
    if (endlessMode) {
        targetScore = 999;
        endlessSpeedLevel = 0;
        // Ensure StateManager is in sync
        if (window.StateManager) {
            window.StateManager.setEndlessMode(true);
            window.StateManager.setTargetScore(999);
        }
    } else {
        targetScore = getCurrentLevelConfig().targetScore;
        // Ensure StateManager is in sync
        if (window.StateManager) {
            window.StateManager.setEndlessMode(false);
            window.StateManager.setTargetScore(targetScore);
        }
    }
    
    generatePortals();
    applyDifficulty();
    updateUI();
    draw();
}

function updateUI() {
    // Safe DOM access with null checks
    if (scoreElement) scoreElement.textContent = score;
    if (levelElement) levelElement.textContent = currentLevel;
    if (targetScoreElement) {
        targetScoreElement.textContent = endlessMode ? '∞' : ` / ${targetScore}`;
    }
    const levelHud = document.getElementById('levelHud');
    if (levelHud) {
        levelHud.style.display = endlessMode ? 'none' : 'flex';
    }
    if (typeof updateComboDisplay === 'function') {
        updateComboDisplay();
    }
}

// ==================== FOOD GENERATION ====================

// Generate food with fairness checks and validation
function generateFood() {
    if (!window.StateManager) {
        // Fallback if StateManager not available
        return { x: 15, y: 15 };
    }
    
    const state = window.StateManager;
    const snake = state.getSnake();
    const currentFood = state.getFood();
    const GRID_COLS = 20; // Get from config
    const GRID_ROWS = 20; // Get from config
    
    // Validate inputs
    if (!Array.isArray(snake) || snake.length === 0) {
        if (window.Logger) window.Logger.warn('Invalid snake state, using default food position');
        return { x: 15, y: 15 };
    }
    
    let newFood;
    let attempts = 0;
    const maxAttempts = GRID_COLS * GRID_ROWS; // Try all positions if needed
    
    // Get all occupied positions (optimized: use for loop instead of forEach)
    const occupied = new Set();
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (segment && typeof segment.x === 'number' && typeof segment.y === 'number') {
            occupied.add(`${segment.x},${segment.y}`);
        }
    }
    
    // Check portals
    const portals = state.getPortals ? state.getPortals() : null;
    if (portals && portals.a && portals.b) {
        occupied.add(`${portals.a.x},${portals.a.y}`);
        occupied.add(`${portals.b.x},${portals.b.y}`);
    }
    
    // Check terrain (optimized: use for loop)
    const terrainTiles = state.getTerrainTiles ? state.getTerrainTiles() : [];
    for (let i = 0; i < terrainTiles.length; i++) {
        const tile = terrainTiles[i];
        if (tile && typeof tile.x === 'number' && typeof tile.y === 'number') {
            occupied.add(`${tile.x},${tile.y}`);
        }
    }
    
    // Check boss
    const currentBoss = state.getCurrentBoss ? state.getCurrentBoss() : null;
    if (currentBoss && typeof currentBoss.x === 'number' && typeof currentBoss.y === 'number') {
        occupied.add(`${Math.floor(currentBoss.x)},${Math.floor(currentBoss.y)}`);
    }
    
    // Try to find valid position
    do {
        const x = Math.floor(Math.random() * GRID_COLS);
        const y = Math.floor(Math.random() * GRID_ROWS);
        const key = `${x},${y}`;
        
        // Check if position is valid
        if (!occupied.has(key)) {
            // Additional check: not too close to snake head (optional fairness)
            const head = snake[0];
            if (head) {
                const distToHead = Math.abs(x - head.x) + Math.abs(y - head.y);
                if (distToHead >= 2 || attempts > 50) { // Allow close spawns after many attempts
                    newFood = { x, y };
                    break;
                }
            } else {
                newFood = { x, y };
                break;
            }
        }
        
        attempts++;
    } while (attempts < maxAttempts);
    
    // Fallback: find any free position systematically
    if (!newFood) {
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const key = `${x},${y}`;
                if (!occupied.has(key)) {
                    newFood = { x, y };
                    break;
                }
            }
            if (newFood) break;
        }
    }
    
    // Final fallback
    if (!newFood) {
        if (window.Logger) window.Logger.warn('Could not find valid food position, using default');
        newFood = { x: 15, y: 15 };
    }
    
    // Validate result
    if (typeof newFood.x !== 'number' || typeof newFood.y !== 'number') {
        if (window.Logger) window.Logger.error('Invalid food position generated');
        return { x: 15, y: 15 };
    }
    
    // Ensure within bounds
    if (window.DefensiveUtils) {
        newFood.x = window.DefensiveUtils.validateNumber(newFood.x, 0, GRID_COLS - 1, 15);
        newFood.y = window.DefensiveUtils.validateNumber(newFood.y, 0, GRID_ROWS - 1, 15);
    } else {
        newFood.x = Math.max(0, Math.min(GRID_COLS - 1, newFood.x));
        newFood.y = Math.max(0, Math.min(GRID_ROWS - 1, newFood.y));
    }
    
    foodSpawnTime = Date.now();
    return newFood;
}

function isPositionOnSnake(x, y) {
    // Use StateManager for consistency
    if (window.StateManager) {
        const snake = window.StateManager.getSnake();
        return snake.some(segment => segment.x === x && segment.y === y);
    }
    // Fallback to global (for backward compatibility)
    return snake.some(segment => segment.x === x && segment.y === y);
}

// ==================== RENDERING ====================

function getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
        bg: isLight ? '#ffffff' : '#111',
        glow: isLight ? 'rgba(46, 125, 50, 0.3)' : 'rgba(76, 175, 80, 0.5)'
    };
}

function draw(interpolation = 0) {
    frameCount++;
    const colors = getThemeColors();
    
    // Optimize canvas context
    if (window.optimizeCanvasContext) {
        window.optimizeCanvasContext(ctx);
    }
    
    // Clear canvas efficiently (single clear operation)
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    // Apply camera shake
    ctx.translate(cameraShakeX, cameraShakeY);
    
    // Apply board rotation
    if (boardRotationEnabled) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((boardRotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
    }
    
    // Draw portals
    if (portals && portalsActive) {
        ctx.fillStyle = '#8a2be2';
        ctx.globalAlpha = 0.7;
        [portals.a, portals.b].forEach(portal => {
            const x = portal.x * CELL_SIZE;
            const y = portal.y * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
    
    // Get interpolated snake for smooth rendering
    let renderSnake = snake;
    if (interpolation > 0 && window.getInterpolatedSnake) {
        renderSnake = window.getInterpolatedSnake();
    }
    
    // Get interpolated camera shake
    let renderCameraShakeX = cameraShakeX;
    let renderCameraShakeY = cameraShakeY;
    if (interpolation > 0 && window.getInterpolatedCameraShake) {
        const shake = window.getInterpolatedCameraShake();
        renderCameraShakeX = shake.x;
        renderCameraShakeY = shake.y;
    }
    
    // Apply interpolated camera shake
    ctx.restore();
    ctx.save();
    ctx.translate(renderCameraShakeX, renderCameraShakeY);
    
    // Draw snake with smooth animations
    const snakeColor = getSnakeColor();
    const isGhostMode = activePowerUp && activePowerUp.id === 'ghost_mode';
    
    // Use animated snake renderer if available
    if (window.drawAnimatedSnake && interpolation > 0 && gameRunning) {
        window.drawAnimatedSnake(ctx, snake, dx, dy, interpolation, CELL_SIZE, getSnakeColor);
    } else {
        // Fallback to standard rendering
        renderSnake.forEach((segment, index) => {
        const isHead = index === 0;
        const x = segment.x * CELL_SIZE + 1;
        const y = segment.y * CELL_SIZE + 1;
        const size = CELL_SIZE - 2;
        
        // Phase 7: Evolution glow effect
        const evolutionGlow = snakeEvolutionTier * 2;
        if (isHead && frameCount % 10 < 5) {
            ctx.shadowBlur = 8 + evolutionGlow;
            ctx.shadowColor = colors.glow;
        } else if (snakeEvolutionTier > 0 && index < snakeEvolutionTier + 1) {
            ctx.shadowBlur = evolutionGlow;
            ctx.shadowColor = colors.glow;
        } else {
            ctx.shadowBlur = 0;
        }
        
        if (isGhostMode && index > 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = snakeColor;
        
        // Phase 7: Apply head style based on skin
        const skin = SNAKE_SKINS.find(s => s.id === currentSnakeSkin) || SNAKE_SKINS[0];
        if (isHead && skin.headStyle === 'rounded') {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isHead && skin.headStyle === 'arrow') {
            // Draw arrow pointing in direction of movement
            ctx.beginPath();
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            if (dx > 0) {
                ctx.moveTo(centerX - size / 3, centerY - size / 2);
                ctx.lineTo(centerX + size / 2, centerY);
                ctx.lineTo(centerX - size / 3, centerY + size / 2);
            } else if (dx < 0) {
                ctx.moveTo(centerX + size / 3, centerY - size / 2);
                ctx.lineTo(centerX - size / 2, centerY);
                ctx.lineTo(centerX + size / 3, centerY + size / 2);
            } else if (dy > 0) {
                ctx.moveTo(centerX - size / 2, centerY - size / 3);
                ctx.lineTo(centerX, centerY + size / 2);
                ctx.lineTo(centerX + size / 2, centerY - size / 3);
            } else if (dy < 0) {
                ctx.moveTo(centerX - size / 2, centerY + size / 3);
                ctx.lineTo(centerX, centerY - size / 2);
                ctx.lineTo(centerX + size / 2, centerY + size / 3);
            } else {
                ctx.fillRect(x, y, size, size);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;
    });
    }
    
    ctx.shadowBlur = 0;
    
    // Draw food with magnet effect
    // Safe food access
    if (!food || typeof food.x !== 'number' || typeof food.y !== 'number') return;
    let foodX = food.x * CELL_SIZE + 1;
    let foodY = food.y * CELL_SIZE + 1;
    
    if (activePowerUp && activePowerUp.id === 'magnet' && snake && snake.length > 0) {
        const head = snake[0];
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
        const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;
        
        const dx = headX - foodCenterX;
        const dy = headY - foodCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && dist < CELL_SIZE * 5) {
            const pull = 0.3;
            food.x += (dx / dist) * pull;
            food.y += (dy / dist) * pull;
            foodX = food.x * CELL_SIZE + 1;
            foodY = food.y * CELL_SIZE + 1;
        }
    }
    
    const foodAge = Date.now() - foodSpawnTime;
    const scale = Math.min(1, foodAge / 200);
    const foodSize = (CELL_SIZE - 2) * scale;
    const foodOffset = (CELL_SIZE - 2 - foodSize) / 2;
    
    ctx.fillStyle = getFoodColor();
    ctx.fillRect(foodX + foodOffset, foodY + foodOffset, foodSize, foodSize);
    
    // Draw zoom hazard
    if (zoomHazard) {
        const hazardX = zoomHazard.x * CELL_SIZE + 1;
        const hazardY = zoomHazard.y * CELL_SIZE + 1;
        const pulse = Math.sin(frameCount * 0.2) * 0.2 + 1;
        ctx.fillStyle = '#ff6b35';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(hazardX, hazardY, (CELL_SIZE - 2) * pulse, (CELL_SIZE - 2) * pulse);
        ctx.globalAlpha = 1.0;
        // Draw warning border
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 2;
        ctx.strokeRect(hazardX - 1, hazardY - 1, CELL_SIZE, CELL_SIZE);
    }
    
    // Draw terrain tiles (procedural/editor mode)
    terrainTiles.forEach(tile => {
        if (tile.type === TERRAIN_TYPES.EMPTY) return;
        
        const tileX = tile.x * CELL_SIZE + 1;
        const tileY = tile.y * CELL_SIZE + 1;
        let color = '#333';
        
        if (tile.type === TERRAIN_TYPES.WALL) {
            color = '#666';
        } else if (tile.type === TERRAIN_TYPES.SLOW_ZONE) {
            color = '#0066ff';
            ctx.globalAlpha = 0.5;
        } else if (tile.type === TERRAIN_TYPES.BOUNCE_TILE) {
            color = '#ffaa00';
        } else if (tile.type === TERRAIN_TYPES.HAZARD_TILE) {
            color = '#ff0000';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(tileX, tileY, CELL_SIZE - 2, CELL_SIZE - 2);
        ctx.globalAlpha = 1.0;
        
        if (tile.type === TERRAIN_TYPES.WALL || tile.type === TERRAIN_TYPES.HAZARD_TILE) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(tileX, tileY, CELL_SIZE - 2, CELL_SIZE - 2);
        }
    });
    
    // Draw hazard tiles (endless mode)
    hazardTiles.forEach(tile => {
        const tileX = tile.x * CELL_SIZE + 1;
        const tileY = tile.y * CELL_SIZE + 1;
        ctx.fillStyle = '#8b4513';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(tileX, tileY, CELL_SIZE - 2, CELL_SIZE - 2);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(tileX, tileY, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    
    // Draw boss
    if (currentBoss && bossMode) {
        if (!currentBoss.underground) {
            const bossX = currentBoss.x * CELL_SIZE + 1;
            const bossY = currentBoss.y * CELL_SIZE + 1;
            ctx.fillStyle = currentBoss.color;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(bossX, bossY, CELL_SIZE - 2, CELL_SIZE - 2);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(bossX, bossY, CELL_SIZE - 2, CELL_SIZE - 2);
        }
        
        // Draw split forms
        if (currentBoss.splitForms) {
            currentBoss.splitForms.forEach(form => {
                const formX = form.x * CELL_SIZE + 1;
                const formY = form.y * CELL_SIZE + 1;
                ctx.fillStyle = currentBoss.color;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(formX, formY, CELL_SIZE - 2, CELL_SIZE - 2);
                ctx.globalAlpha = 1.0;
            });
        }
        
        // Draw boss projectiles
        bossProjectiles.forEach(proj => {
            if (proj.radius !== undefined) {
                // Shockwave ring
                ctx.strokeStyle = currentBoss.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1 - (proj.radius / proj.maxRadius);
                ctx.beginPath();
                ctx.arc(proj.x * CELL_SIZE + CELL_SIZE / 2, proj.y * CELL_SIZE + CELL_SIZE / 2, proj.radius * CELL_SIZE, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else {
                // Regular projectile
                const projX = proj.x * CELL_SIZE + 1;
                const projY = proj.y * CELL_SIZE + 1;
                ctx.fillStyle = currentBoss.color;
                ctx.fillRect(projX, projY, CELL_SIZE - 2, CELL_SIZE - 2);
            }
        });
    }
    
    // Draw power-up indicator on food if magnet is active
    if (activePowerUp && activePowerUp.id === 'magnet') {
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, CELL_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw boss fruit
    drawBossFruit();
    
    // Draw ghost replay
    drawGhostReplay();
    
    // Draw particles
    drawParticles();
    
    ctx.restore();
    
    // Draw weather (on separate canvas layer)
    drawWeather();
    
    // Draw heatmap (on separate canvas layer)
    drawHeatmap();
    
    // Decay camera shake
    cameraShakeX *= 0.9;
    cameraShakeY *= 0.9;
    if (Math.abs(cameraShakeX) < 0.1) cameraShakeX = 0;
    if (Math.abs(cameraShakeY) < 0.1) cameraShakeY = 0;
}

// ==================== GAME LOGIC ====================

// Game logic update (fixed timestep) - optimized with early exits
function updateGameLogic() {
    // Update multiplayer first (if active)
    if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
        try {
            window.LocalMultiplayer.update();
        } catch (e) {
            console.error('Error in local multiplayer update:', e);
        }
        return; // Multiplayer handles its own game loop
    }
    
    if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
        try {
            window.MultiplayerController.update();
        } catch (e) {
            console.error('Error in multiplayer controller update:', e);
        }
        return; // Online multiplayer handles its own game loop
    }
    
    if (!window.StateManager) return;
    const state = window.StateManager;
    
    if (!state.getGameRunning() || state.getIsPaused()) return;
    
    // Reset direction changed flag via StateManager
    state.setDirectionChangedThisTick(false);
    
    // Update exposed game state for item effects (for backward compatibility)
    // Optimized: use references instead of copies where safe (StateManager returns refs)
    window.snake = state.getSnake(); // Returns reference (optimized in StateManager)
    window.dx = state.getDx();
    window.dy = state.getDy();
    window.food = state.getFood(); // Returns reference (optimized in StateManager)
    window.terrainTiles = state.getTerrainTiles();
    window.hazardTiles = state.getHazardTiles();
    window.cameraShakeX = state.getCameraShakeX();
    window.cameraShakeY = state.getCameraShakeY();
    
    // Update systems
    checkComboTimeout();
    updateZoomHazard();
    updateZoomHazardHUD();
    updatePowerUps();
    updatePowerUpUI();
    updateBoardRotation();
    updateWeather();
    spawnBossFruit();
    updateBossFruit();
    updateEvolution();
    updateDailyChallenge();
    recordGhostReplay();
    updateHeatmap();
    applyDifficulty();
    if (state.getEndlessMode()) {
        updateEndlessMode();
    }
    
    // Get current state
    const snake = state.getSnake();
    const dx = state.getDx();
    const dy = state.getDy();
    const food = state.getFood();
    
    // Safe array access with bounds checking
    if (!snake || snake.length === 0) {
        console.warn('Snake array is empty, skipping update');
        return;
    }
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Record ghost replay frame
    if (window.GhostReplay && window.GhostReplay.getState().recording) {
        const currentLevel = state.getCurrentLevel();
        const timeElapsed = window.Progression ? window.Progression.getCurrentLevelTime() : 0;
        window.GhostReplay.recordFrame(snake, dx, dy, timeElapsed);
    }
    
    // Check portal collision
    const portalExit = checkPortalCollision(head);
    if (portalExit) {
        head.x = portalExit.x;
        head.y = portalExit.y;
    }
    
    // Check zoom hazard collection
    collectZoomHazard();
    
    // Check hazard tile collision (endless mode)
    checkHazardTileCollision();
    
    // Check terrain collision (procedural/editor mode)
    const proceduralMode = state.getProceduralMode();
    const terrainTiles = state.getTerrainTiles();
    if (proceduralMode || terrainTiles.length > 0) {
        const terrain = getTerrainAt(head.x, head.y);
        if (terrain) {
            if (terrain.type === TERRAIN_TYPES.WALL) {
                gameOver();
                return;
            } else if (terrain.type === TERRAIN_TYPES.HAZARD_TILE) {
                gameOver();
                return;
            } else if (terrain.type === TERRAIN_TYPES.BOUNCE_TILE) {
                // Bounce back
                state.setDx(-dx);
                state.setDy(-dy);
                // Safe access: snake[0] already validated above in updateGameLogic
                if (snake && snake.length > 0) {
                    head.x = snake[0].x;
                    head.y = snake[0].y;
                }
            }
        }
    }
    
        // Update boss (legacy boss fruit system)
        const bossMode = state.getBossMode();
        const currentBoss = state.getCurrentBoss();
        if (bossMode && currentBoss) {
            updateBoss();
        }
        
        // Update boss AI system (Phase 9)
        if (window.BossAI && window.BossAI.getAllBosses().length > 0) {
            const snake = state.getSnake();
            if (snake && snake.length > 0) {
                const playerPos = { x: snake[0].x, y: snake[0].y };
                window.BossAI.getAllBosses().forEach(boss => {
                    const deltaTime = 16.67; // Approximate frame time
                    window.BossAI.updateBoss(boss.id, playerPos, deltaTime);
                });
            }
        }
        
        // Update boss encounters (Phase 9)
        if (window.BossEncounters) {
            const deltaTime = 16.67;
            window.BossEncounters.updateEncounter(deltaTime);
        }
        
        // Update story mode (Phase 9)
        if (window.StoryMode && window.StoryMode.getCurrentStory()) {
            const deltaTime = 16.67;
            // Story mode updates are event-driven, but we can check for active events
        }
    
    // Wall collision
    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
        // Check shield before game over
        if (window.checkShield && window.checkShield()) {
            // Shield activated, wrap around or bounce
            if (head.x < 0) head.x = GRID_COLS - 1;
            if (head.x >= GRID_COLS) head.x = 0;
            if (head.y < 0) head.y = GRID_ROWS - 1;
            if (head.y >= GRID_ROWS) head.y = 0;
            
            // Trigger camera shake on wall hit
            if (window.CameraShake) {
                window.CameraShake.trigger(3, 200, 'exponential');
            }
        } else {
            gameOver();
            return;
        }
    }
    
    // Apply path clearer if equipped
    if (window.applyPathClearer) {
        window.applyPathClearer(head.x, head.y);
    }
    
    // Check boss AI collision (Phase 9) - boss hits player
    if (window.BossAI) {
        const bosses = window.BossAI.getAllBosses();
        for (const boss of bosses) {
            const bossDx = head.x - boss.x;
            const bossDy = head.y - boss.y;
            const distance = Math.sqrt(bossDx * bossDx + bossDy * bossDy);
            const collisionDistance = (boss.hitbox?.radius || 0.5) + 0.5;
            
            if (distance < collisionDistance) {
                // Player hit by boss
                if (window.checkShield && window.checkShield()) {
                    // Shield activated
                    if (window.CameraShake) {
                        window.CameraShake.trigger(5, 300, 'exponential');
                    }
                    return;
                } else {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Self collision (skip if ghost mode)
    const activePowerUp = state.getActivePowerUp();
    const isGhostMode = activePowerUp && activePowerUp.id === 'ghost_mode';
    if (!isGhostMode && snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        // Check shield before game over
        if (window.checkShield && window.checkShield()) {
            // Shield activated, continue
            // Trigger camera shake on damage
            if (window.CameraShake) {
                window.CameraShake.trigger(5, 300, 'exponential');
            }
            return;
        }
        gameOver();
        return;
    }
    
    // Update snake
    const newSnake = [...snake];
    newSnake.unshift(head);
    state.setSnake(newSnake);
    
    // Apply magnet effect to food (from items or skill tree)
    let updatedFood = { ...food };
    if (window.applyMagnetEffect) {
        updatedFood = window.applyMagnetEffect(updatedFood, head);
    } else if (window.activeSkillEffects && window.activeSkillEffects.magnetRadius) {
        // Apply skill tree food magnet
        const magnetRadius = window.activeSkillEffects.magnetRadius;
        const magnetStrength = window.activeSkillEffects.magnetStrength || 0.3;
        const foodCellX = Math.floor(updatedFood.x);
        const foodCellY = Math.floor(updatedFood.y);
        const dist = Math.sqrt((head.x - foodCellX) ** 2 + (head.y - foodCellY) ** 2);
        
        if (dist <= magnetRadius && dist > 0) {
            const dx = (head.x - foodCellX) / dist;
            const dy = (head.y - foodCellY) / dist;
            updatedFood.x += dx * magnetStrength;
            updatedFood.y += dy * magnetStrength;
        }
    }
    state.setFood(updatedFood);
    
    // Food collision (check auto-bite radius if enabled)
    const currentFood = state.getFood();
    // Safe food access
    if (!currentFood || typeof currentFood.x !== 'number' || typeof currentFood.y !== 'number') {
        console.warn('Invalid food state in collision check');
        return;
    }
    const foodCellX = Math.floor(currentFood.x);
    const foodCellY = Math.floor(currentFood.y);
    let foodCollected = false;
    
    if (head.x === foodCellX && head.y === foodCellY) {
        foodCollected = true;
    } else if (window.checkAutoBite && window.checkAutoBite(head, { x: foodCellX, y: foodCellY })) {
        foodCollected = true;
    }
    
    if (foodCollected) {
        // Calculate score with multipliers
        let points = 1;
        const activePowerUp = state.getActivePowerUp();
        if (activePowerUp && activePowerUp.id === 'score_multiplier') {
            points *= 2;
        }
        const comboMultiplier = state.getComboMultiplier();
        points *= comboMultiplier;
        
        // Apply item fruit multiplier
        if (window.getFruitMultiplier) {
            points *= window.getFruitMultiplier();
        }
        
        // Apply skill tree food multiplier
        if (window.activeSkillEffects && window.activeSkillEffects.foodMultiplier) {
            points *= window.activeSkillEffects.foodMultiplier;
        }
        
        points = Math.floor(points);
        
        state.addScore(points);
        totalFoodEaten++;
        if (state.getEndlessMode()) {
            endlessFoodCount++;
        }
        addCombo(); // Phase 7: Add to combo
        updateComboDisplay();
        
        // Update combo mission progress
        if (comboMultiplier >= 5) {
            updateMissionProgress('combo_chain', 1);
        }
        updateScore();
        playPickupSound();
        
        // Update missions
        updateMissionProgress('eat_food', 1);
        
        // Track lifetime fruit
        if (window.addLifetimeFruit) {
            window.addLifetimeFruit();
        }
        
        state.setCameraShakeX((Math.random() - 0.5) * 4);
        state.setCameraShakeY((Math.random() - 0.5) * 4);
        
        const foodX = foodCellX * CELL_SIZE + CELL_SIZE / 2;
        const foodY = foodCellY * CELL_SIZE + CELL_SIZE / 2;
        createParticleBurst(foodX, foodY, getFoodColor(), 15);
        
        // Create trail particles when moving fast
        const currentSnakeForTrail = state.getSnake();
        if (currentSnakeForTrail.length > 5) {
            createParticleTrail(foodX, foodY, getSnakeColor());
        }
        
        state.setFood(generateFood());
        generatePortals(); // Reposition portals when food is eaten
        
        checkAchievement('first_bite');
        checkAchievement('glutton');
        checkAchievement('century');
        checkAchievement('legend');
        checkThemeUnlocks();
        
        const endlessMode = state.getEndlessMode();
        if (!endlessMode && !checkLevelComplete()) {
            checkSkinUnlocks();
            checkAllAchievements();
        }
        
        // Update story mode food eaten (Phase 9)
        if (window.BossEncounters && window.BossEncounters.getActiveEncounter()) {
            const encounter = window.BossEncounters.getActiveEncounter();
            if (encounter.fruitEaten !== undefined) {
                encounter.fruitEaten++;
            }
        }
    } else {
        const currentSnake = state.getSnake();
        currentSnake.pop();
        state.setSnake([...currentSnake]);
    }
    
    // Check if snake head hits boss (for damage dealing) - Phase 9
    if (window.BossAI) {
        const bosses = window.BossAI.getAllBosses();
        for (const boss of bosses) {
            const bossDx = head.x - boss.x;
            const bossDy = head.y - boss.y;
            const distance = Math.sqrt(bossDx * bossDx + bossDy * bossDy);
            const damageDistance = (boss.hurtbox?.radius || 0.3) + 0.3;
            
            if (distance < damageDistance) {
                // Snake head hits boss hurtbox - deal damage
                const damage = 10; // Base damage
                const defeated = window.BossAI.damageBoss(boss.id, damage);
                
                if (defeated) {
                    // Boss defeated
                    if (window.ParticleSystem) {
                        window.ParticleSystem.createBurst(
                            boss.x * CELL_SIZE + CELL_SIZE / 2,
                            boss.y * CELL_SIZE + CELL_SIZE / 2,
                            boss.color || '#ff0000',
                            50
                        );
                    }
                    
                    // Trigger event
                    if (window.EventController && window.EventController.trigger) {
                        window.EventController.trigger('boss_defeated', { bossId: boss.id, bossType: boss.type });
                    }
                } else {
                    // Boss hit but not defeated
                    if (window.CameraShake) {
                        window.CameraShake.trigger(3, 200, 'linear');
                    }
                }
            }
        }
    }
    
    // Track distance traveled
    if (window.addDistance) {
        window.addDistance(1);
    }
    
    updateParticles();
}

// Legacy update function (for backward compatibility)
function update() {
    updateGameLogic();
    draw();
}

// Render function with interpolation support (uses Renderer module)
function renderGame(interpolation) {
    if (!window.StateManager) return;
    
    const state = window.StateManager;
    const gameRunning = state.getGameRunning();
    const particles = state.getParticles();
    const foodSpawnTime = state.getFoodSpawnTime();
    
    if (!gameRunning && particles.length === 0 && foodSpawnTime === 0) {
        return; // Don't render if nothing to show
    }

    // Get current and previous state for interpolation
    // Reuse objects to avoid allocations (performance optimization)
    if (!window._renderStateCache) {
        window._renderStateCache = {
            currentState: {
                snake: [],
                food: { x: 0, y: 0 },
                dx: 0,
                dy: 0,
                cameraShakeX: 0,
                cameraShakeY: 0,
                terrainTiles: [],
                hazardTiles: [],
                zoomHazard: null,
                currentBoss: null,
                bossProjectiles: [],
                particles: [],
                portals: null,
                portalsActive: false,
                isGhostMode: false
            },
            previousState: {
                snake: [],
                food: { x: 0, y: 0 },
                cameraShakeX: 0,
                cameraShakeY: 0
            }
        };
    }
    
    const cache = window._renderStateCache;
    const currentState = cache.currentState;
    const previousState = cache.previousState;
    
    // Update current state (reuse objects)
    const stateSnake = state.getSnake();
    currentState.snake.length = 0;
    for (let i = 0; i < stateSnake.length; i++) {
        currentState.snake.push(stateSnake[i]);
    }
    
    const stateFood = state.getFood();
    // Safe food access
    if (stateFood && typeof stateFood.x === 'number' && typeof stateFood.y === 'number') {
        currentState.food.x = stateFood.x;
        currentState.food.y = stateFood.y;
    } else {
        // Fallback to default position
        currentState.food.x = 15;
        currentState.food.y = 15;
    }
    currentState.dx = state.getDx();
    currentState.dy = state.getDy();
    currentState.cameraShakeX = state.getCameraShakeX();
    currentState.cameraShakeY = state.getCameraShakeY();
    currentState.terrainTiles = state.getTerrainTiles();
    currentState.hazardTiles = state.getHazardTiles();
    currentState.zoomHazard = state.getZoomHazard();
    currentState.currentBoss = state.getCurrentBoss();
    currentState.bossProjectiles = state.getBossProjectiles();
    currentState.particles = particles;
    currentState.portals = null; // TODO: Add to state manager
    currentState.portalsActive = false;
    currentState.isGhostMode = state.getActivePowerUp()?.id === 'ghost_mode';
    
    // Update previous state (reuse objects)
    const prevSnake = state.getPreviousSnake();
    previousState.snake.length = 0;
    for (let i = 0; i < prevSnake.length; i++) {
        previousState.snake.push(prevSnake[i]);
    }
    
    const prevFood = state.getPreviousFood();
    // Safe food access
    if (prevFood && typeof prevFood.x === 'number' && typeof prevFood.y === 'number') {
        previousState.food.x = prevFood.x;
        previousState.food.y = prevFood.y;
    } else {
        // Fallback to default position
        previousState.food.x = 15;
        previousState.food.y = 15;
    }
    previousState.cameraShakeX = state.getPreviousCameraShakeX();
    previousState.cameraShakeY = state.getPreviousCameraShakeY();
    
    // Use Renderer module
    if (window.Renderer) {
        const themeColors = getThemeColors();
        window.Renderer.render(interpolation, currentState, previousState, themeColors, getSnakeColor, getFoodColor);
    } else {
        // Fallback to old draw function
        draw(interpolation);
    }
    
    // Update level timer display
    if (window.UI && gameRunning && state.getClassicMode()) {
        window.UI.updateLevelTimerDisplay();
        
        // Show timer HUD
        const timerHud = document.getElementById('timerHud');
        if (timerHud) {
            timerHud.style.display = 'flex';
        }
    } else {
        const timerHud = document.getElementById('timerHud');
        if (timerHud) {
            timerHud.style.display = 'none';
        }
    }
}

// Export functions for game loop
window.updateGameLogic = updateGameLogic;
window.renderGame = renderGame;

function startGame() {
    if (!window.StateManager || !window.Progression) return;
    
    const state = window.StateManager;
    if (state.getGameRunning()) return;
    if (state.getDx() === 0 && state.getDy() === 0) return;
    
    if (!isAudioContextInitialized && !isMuted) {
        initAudioContext();
    }
    
    state.setGameRunning(true);
    gameStartTime = Date.now();
    
    // Start level timer for S-Rank system (uses Progression module)
    if (window.Progression.startLevelTimer) {
        window.Progression.startLevelTimer();
    }
    
    // Start ghost replay recording
    if (window.GhostReplay && state.getClassicMode()) {
        const currentLevel = state.getCurrentLevel();
        window.GhostReplay.startRecording(currentLevel);
    }
    
    // Log game event
    if (window.DebugOverlay) {
        window.DebugOverlay.logGameEvent('game_start', { level: state.getCurrentLevel() });
    }
    
    // Determine speed based on mode and difficulty
    const endlessMode = state.getEndlessMode();
    let speed;
    if (endlessMode) {
        speed = Math.max(50, INITIAL_SPEED - endlessSpeedLevel * 5);
    } else {
        // Apply skill tree speed multiplier
        const config = getCurrentLevelConfig();
        if (window.activeSkillEffects && window.activeSkillEffects.speedMultiplier) {
            speed = Math.floor(config.speed / window.activeSkillEffects.speedMultiplier);
        } else {
            speed = config.speed;
        }
    }
    
    // Apply difficulty multiplier
    const diff = DIFFICULTIES[currentDifficulty];
    if (diff) {
        speed = speed / diff.speedMultiplier;
    }
    
    // Apply slow time power-up
    if (activePowerUp && activePowerUp.id === 'slow_time') {
        speed *= 1.5; // Slower = higher interval
    }
    
    // Apply item speed multiplier
    if (window.getSpeedMultiplier) {
        const speedMultiplier = window.getSpeedMultiplier();
        speed = speed / speedMultiplier; // Higher multiplier = faster = lower interval
    }
    
    // Use fixed-timestep game loop instead of setInterval
    if (window.startGameLoop) {
        window.startGameLoop();
    } else {
        // Fallback to old system
        gameLoop = setInterval(update, speed);
    }
}

function gameOver() {
    if (!window.StateManager) return;
    
    const state = window.StateManager;
    state.setGameRunning(false);
    if (window.stopGameLoop) {
        window.stopGameLoop();
    }
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Stop ghost replay recording
    if (window.GhostReplay) {
        window.GhostReplay.stopRecording();
    }
    
    // Trigger camera shake on death
    if (window.CameraShake) {
        window.CameraShake.trigger(8, 500, 'exponential');
    }
    
    // Log game event
    if (window.DebugOverlay) {
        window.DebugOverlay.logGameEvent('game_over', { 
            level: state.getCurrentLevel(),
            score: state.getScore()
        });
    }
    
    // Phase 7: Save ghost replay
    saveGhostReplay();
    
    // Phase 7: Track weather wins (if game was won, not lost)
    // This would be called on level complete, not game over
    
    const head = snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    createParticleBurst(headX, headY, '#FF0000', 30);
    
    playGameOverSound();
    
    gamesPlayed++;
    noDeathStreak = 0; // Reset streak on death
    comboMultiplier = 1;
    comboTimeLeft = 0;
    
    if (endlessMode) {
        const wasNewRecord = score > bestEndlessScore;
        saveBestEndlessScore();
        const newRecordText = document.getElementById('newRecordText');
        const finalLevelText = document.getElementById('finalLevelText');
        if (newRecordText) {
            newRecordText.style.display = wasNewRecord ? 'block' : 'none';
        }
        if (finalLevelText) {
            finalLevelText.style.display = 'none';
        }
    } else {
        addToLeaderboard(score, currentLevel);
        const newRecordText = document.getElementById('newRecordText');
        const finalLevelText = document.getElementById('finalLevelText');
        if (newRecordText) {
            newRecordText.style.display = 'none';
        }
        if (finalLevelText) {
            finalLevelText.style.display = 'block';
        }
    }
    
    checkAchievement('veteran');
    
    // Record death
    if (window.recordDeath) {
        window.recordDeath();
    }
    
    // Calculate run data for progression summary
    const runData = {
        finalScore: score,
        levelReached: currentLevel,
        fruitsEaten: totalFoodEaten,
        distanceTraveled: snake.length, // Approximate distance
        bossDefeated: currentBoss === null && bossMode, // If boss was defeated
        missionCompleted: false // Would be set based on active missions
    };
    
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = currentLevel;
    gameOverOverlay.classList.add('show');
    
    // Show progression summary after a delay
    setTimeout(() => {
        if (window.showProgressionSummary) {
            window.showProgressionSummary(runData);
        }
    }, 1500);
}

function updateScore() {
    if (!window.StateManager) return;
    const score = window.StateManager.getScore();
    if (scoreElement) {
        scoreElement.textContent = score;
        scoreElement.classList.add('score-pop');
        setTimeout(() => {
            scoreElement.classList.remove('score-pop');
        }, 300);
    }
    updateUI();
}

// ==================== INPUT HANDLING ====================

// Change direction (with multiplayer support)
function changeDirection(newDx, newDy) {
    // Handle multiplayer input
    if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
        window.LocalMultiplayer.handlePlayerInput('player1', newDx, newDy);
        return;
    }
    
    if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
        window.MultiplayerController.handleInput(newDx, newDy);
        return;
    }
    
    // Single-player direction change
    if (!window.StateManager) return;
    
    const state = window.StateManager;
    if (state.getDirectionChangedThisTick() || state.getIsPaused()) return;
    
    const dx = state.getDx();
    const dy = state.getDy();
    if ((dx !== 0 && newDx === -dx) || (dy !== 0 && newDy === -dy)) {
        return;
    }
    
    state.setDx(newDx);
    state.setDy(newDy);
    state.setDirectionChangedThisTick(true);
    
    if (!state.getGameRunning()) {
        startGame();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }
    
    // Support both Arrow keys and WASD
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const wasdKeys = ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
    
    // Check if in menu - prevent gameplay input (optimized: cache DOM queries)
    let isInMenu = false;
    let hasActiveModal = false;
    let isPaused = false;
    let isModeSelect = false;
    
    // Cache menu state checks (only check once per 100ms to reduce DOM queries)
    if (window._menuStateCache === undefined || (performance.now() - (window._menuStateCacheTime || 0)) > 100) {
        isInMenu = window.MenuKeyboardNavigation && window.MenuKeyboardNavigation.isInMenuMode();
        hasActiveModal = document.querySelector('.modal.show') !== null;
        isPaused = window.StateManager && window.StateManager.getIsPaused && window.StateManager.getIsPaused();
        const modeSelectEl = document.getElementById('modeSelectScreen');
        isModeSelect = modeSelectEl && modeSelectEl.style.display !== 'none';
        
        // Cache for 100ms
        window._menuStateCache = { isInMenu, hasActiveModal, isPaused, isModeSelect };
        window._menuStateCacheTime = performance.now();
    } else {
        const cache = window._menuStateCache;
        isInMenu = cache.isInMenu;
        hasActiveModal = cache.hasActiveModal;
        isPaused = cache.isPaused;
        isModeSelect = cache.isModeSelect;
    }
    
    if (isInMenu || hasActiveModal || isPaused || isModeSelect) {
        // In menu - let menu navigation handle it
        if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key)) {
            // Menu navigation will handle this
            return;
        }
    }
    
    if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    // Only handle gameplay input if game is running and not in menu
    if (window.StateManager && window.StateManager.getGameRunning && window.StateManager.getGameRunning() && !isInMenu && !hasActiveModal && !isPaused && !isModeSelect) {
        // Handle Arrow keys (Player 1 or single-player)
        switch (e.key) {
            case 'ArrowUp':
                changeDirection(0, -1);
                break;
            case 'ArrowDown':
                changeDirection(0, 1);
                break;
            case 'ArrowLeft':
                changeDirection(-1, 0);
                break;
            case 'ArrowRight':
                changeDirection(1, 0);
                break;
            // Handle WASD keys (Player 2 in local multiplayer, otherwise single-player fallback)
            case 'w':
            case 'W':
                if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
                    window.LocalMultiplayer.handlePlayerInput('player2', 0, -1);
                } else {
                    changeDirection(0, -1);
                }
                break;
            case 's':
            case 'S':
                if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
                    window.LocalMultiplayer.handlePlayerInput('player2', 0, 1);
                } else {
                    changeDirection(0, 1);
                }
                break;
            case 'a':
            case 'A':
                if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
                    window.LocalMultiplayer.handlePlayerInput('player2', -1, 0);
                } else {
                    changeDirection(-1, 0);
                }
                break;
            case 'd':
            case 'D':
                if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
                    window.LocalMultiplayer.handlePlayerInput('player2', 1, 0);
                } else {
                    changeDirection(1, 0);
                }
                break;
        }
    }
    
    // Dash ability (Space key) - only in gameplay
    if (e.key === ' ' && window.StateManager && window.StateManager.getGameRunning && window.StateManager.getGameRunning() && !isInMenu && !hasActiveModal && !isPaused && window.useDash && window.canDash && window.canDash()) {
        e.preventDefault();
        window.useDash();
    }
    
    // Restart on game over
    if (gameOverOverlay && gameOverOverlay.classList.contains('show')) {
        if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key)) {
            init();
        }
    }
});

// ==================== MOBILE TOUCH HANDLING ====================

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    if (!touchStartX || !touchStartY || e.changedTouches.length === 0) {
        return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    
    if (distance < MIN_SWIPE_DISTANCE) {
        touchStartX = 0;
        touchStartY = 0;
        return;
    }
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            changeDirection(1, 0);
        } else {
            changeDirection(-1, 0);
        }
    } else {
        if (diffY > 0) {
            changeDirection(0, 1);
        } else {
            changeDirection(0, -1);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// ==================== CONTROL PAD HANDLING ====================
// Control pad buttons are registered by ButtonRegistry
// Only add fallback support here if ButtonRegistry is not available
if (controlPad && (!window.UnifiedButtonHandler || !window.ButtonRegistry)) {
    const controlButtons = controlPad.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        // Only register if not already registered
        if (!btn._controlListenerRegistered) {
            const handler = (e) => {
                e.preventDefault();
                const direction = btn.getAttribute('data-direction');
                
                switch (direction) {
                    case 'up':
                        changeDirection(0, -1);
                        break;
                    case 'down':
                        changeDirection(0, 1);
                        break;
                    case 'left':
                        changeDirection(-1, 0);
                        break;
                    case 'right':
                        changeDirection(1, 0);
                        break;
                }
                
                if (gameOverOverlay && gameOverOverlay.classList.contains('show')) {
                    init();
                }
            };
            
            btn.addEventListener('click', handler);
            btn.addEventListener('touchend', (e) => {
                e.stopPropagation();
            });
            btn._controlListenerRegistered = true;
        }
    });
}

// ==================== MODAL HANDLING ====================

function openModal(modal) {
    if (!modal) return;
    
    // Use UnifiedButtonHandler if available for consistent behavior
    if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
        window.UnifiedButtonHandler.openModal(modal);
    } else {
        modal.classList.add('show');
    }
    
    // Render content based on modal type
    if (modal === levelSelectModal) {
        renderLevelSelect();
    } else if (modal === skinModal) {
        renderSkins();
    } else if (modal === themesModal) {
        renderThemes();
    } else if (modal === achievementsModal) {
        renderAchievements();
    } else if (modal === leaderboardModal) {
        renderLeaderboard();
    } else if (modal === dailyChallengeModal) {
        updateDailyChallengeProgress();
    }
}

function closeModal(modal) {
    if (!modal) return;
    
    // Use UnifiedButtonHandler if available for consistent behavior
    if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.closeModal) {
        window.UnifiedButtonHandler.closeModal(modal);
    } else {
        modal.classList.remove('show');
    }
}

function renderLevelSelect() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    levelConfigs.forEach((config, index) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        if (index + 1 === currentLevel) btn.classList.add('current');
        btn.textContent = config.level;
        btn.onclick = () => {
            setLevel(config.level);
            closeModal(levelSelectModal);
        };
        grid.appendChild(btn);
    });
}

function renderSkinSelect() {
    const snakeGrid = document.getElementById('snakeSkinGrid');
    const foodGrid = document.getElementById('foodSkinGrid');
    
    snakeGrid.innerHTML = '';
    snakeSkins.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        if (skin.id === currentSnakeSkin) item.classList.add('selected');
        if (!skin.unlocked) {
            item.classList.add('disabled');
            item.disabled = true;
        }
        item.innerHTML = `
            <div class="skin-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' : skin.color}"></div>
            <div class="skin-name">${skin.name}</div>
            ${!skin.unlocked ? '<span class="skin-lock">🔒</span>' : ''}
        `;
        if (skin.unlocked) {
            item.onclick = () => {
                currentSnakeSkin = skin.id;
                saveSkins();
                renderSkinSelect();
            };
        }
        snakeGrid.appendChild(item);
    });
    
    foodGrid.innerHTML = '';
    foodSkins.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        if (skin.id === currentFoodSkin) item.classList.add('selected');
        if (!skin.unlocked) {
            item.classList.add('disabled');
            item.disabled = true;
        }
        item.innerHTML = `
            <div class="skin-preview" style="background: ${skin.color}"></div>
            <div class="skin-name">${skin.name}</div>
            ${!skin.unlocked ? '<span class="skin-lock">🔒</span>' : ''}
        `;
        if (skin.unlocked) {
            item.onclick = () => {
                currentFoodSkin = skin.id;
                saveSkins();
                renderSkinSelect();
            };
        }
        foodGrid.appendChild(item);
    });
}

function renderThemes() {
    const grid = document.getElementById('themeGrid');
    grid.innerHTML = '';
    THEMES.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        if (theme.id === currentTheme) item.classList.add('selected');
        if (!theme.unlocked) {
            item.classList.add('disabled');
            item.disabled = true;
        }
        
        let previewStyle = '';
        switch (theme.id) {
            case 'classic':
                previewStyle = 'background: linear-gradient(135deg, #000 0%, #111 100%);';
                break;
            case 'neon':
                previewStyle = 'background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);';
                break;
            case 'vaporwave':
                previewStyle = 'background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);';
                break;
            case 'blueprint':
                previewStyle = 'background: linear-gradient(135deg, #001f3f 0%, #003d7a 100%);';
                break;
            case 'matrix':
                previewStyle = 'background: linear-gradient(135deg, #000 0%, #001100 100%);';
                break;
            case 'candy':
                previewStyle = 'background: linear-gradient(135deg, #ffeef7 0%, #fff5f8 100%);';
                break;
        }
        
        item.innerHTML = `
            <div class="theme-preview" style="${previewStyle}"></div>
            <div class="theme-name">${theme.name}</div>
            <div class="theme-desc">${theme.desc}</div>
            ${!theme.unlocked ? '<span class="theme-lock">🔒</span>' : ''}
        `;
        if (theme.unlocked) {
            item.onclick = () => {
                applyTheme(theme.id);
                renderThemes();
            };
        }
        grid.appendChild(item);
    });
}

function renderAchievements() {
    const list = document.getElementById('achievementsList');
    list.innerHTML = '';
    achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        if (ach.unlocked) item.classList.add('unlocked');
        item.innerHTML = `
            <div class="achievement-icon-large">${ach.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
            </div>
            ${!ach.unlocked ? '<div class="achievement-lock">🔒</div>' : ''}
        `;
        list.appendChild(item);
    });
}

// Modal event listeners - Buttons are registered by ButtonRegistry
// Only register buttons here if they're not handled by ButtonRegistry
// Note: ButtonRegistry handles most buttons, so we only add fallback support here
if (!window.UnifiedButtonHandler && !window.ButtonRegistry) {
    // Fallback for when UnifiedButtonHandler is not available
    const levelSelectBtn = document.getElementById('levelSelectBtn');
    if (levelSelectBtn && !levelSelectBtn.onclick) {
        levelSelectBtn.onclick = () => openModal(levelSelectModal);
    }
    const skinBtn = document.getElementById('skinBtn');
    if (skinBtn && !skinBtn.onclick) {
        skinBtn.onclick = () => openModal(skinModal);
    }
    const themesBtn = document.getElementById('themesBtn');
    if (themesBtn && !themesBtn.onclick) {
        themesBtn.onclick = () => openModal(themesModal);
    }
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn && !settingsBtn.onclick) {
        settingsBtn.onclick = () => openModal(settingsModal);
    }
    const achievementsBtn = document.getElementById('achievementsBtn');
    if (achievementsBtn && !achievementsBtn.onclick) {
        achievementsBtn.onclick = () => openModal(achievementsModal);
    }
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    if (leaderboardBtn && !leaderboardBtn.onclick) {
        leaderboardBtn.onclick = () => openModal(leaderboardModal);
    }
    if (pauseBtn && !pauseBtn.onclick) {
        pauseBtn.onclick = togglePause;
    }
    
    // Modal close buttons fallback
    const skinClose = document.getElementById('skinClose');
    if (skinClose && !skinClose.onclick) {
        skinClose.onclick = () => closeModal(skinModal);
    }
    const themesClose = document.getElementById('themesClose');
    if (themesClose && !themesClose.onclick) {
        themesClose.onclick = () => closeModal(themesModal);
    }
    const settingsClose = document.getElementById('settingsClose');
    if (settingsClose && !settingsClose.onclick) {
        settingsClose.onclick = () => closeModal(settingsModal);
    }
    const achievementsClose = document.getElementById('achievementsClose');
    if (achievementsClose && !achievementsClose.onclick) {
        achievementsClose.onclick = () => closeModal(achievementsModal);
    }
    const leaderboardClose = document.getElementById('leaderboardClose');
    if (leaderboardClose && !leaderboardClose.onclick) {
        leaderboardClose.onclick = () => closeModal(leaderboardModal);
    }
}

// Reset Progress Button
const resetProgressBtn = document.getElementById('resetProgressBtn');
if (resetProgressBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(resetProgressBtn, () => {
            console.log('[Button] Reset Progress clicked');
            if (confirm('Are you sure you want to reset all level progress? This cannot be undone.')) {
                if (window.resetLevelProgression) {
                    window.resetLevelProgression();
                    alert('Level progress has been reset. All levels are now locked except Level 1.');
                    
                    // Update level select if it's open
                    if (window.updateLevelSelect) {
                        window.updateLevelSelect();
                    }
                }
            }
        });
    } else {
        resetProgressBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all level progress? This cannot be undone.')) {
                if (window.resetLevelProgression) {
                    window.resetLevelProgression();
                    alert('Level progress has been reset. All levels are now locked except Level 1.');
                    
                    // Update level select if it's open
                    if (window.updateLevelSelect) {
                        window.updateLevelSelect();
                    }
                }
            }
        });
    }
}

// Settings
if (boardRotationToggle) {
    boardRotationToggle.addEventListener('change', (e) => {
        boardRotationEnabled = e.target.checked;
        // Play toggle sound
        if (window.UISoundSystem) {
            if (e.target.checked && window.UISoundSystem.playToggleOn) {
                window.UISoundSystem.playToggleOn();
            } else if (!e.target.checked && window.UISoundSystem.playToggleOff) {
                window.UISoundSystem.playToggleOff();
            }
        }
        saveBoardRotationSetting();
    });
}

// Close modals on background click (only register once, prevent duplicates)
[levelSelectModal, skinModal, themesModal, settingsModal, achievementsModal, leaderboardModal, dailyChallengeModal, shopModal, inventoryModal].forEach(modal => {
    if (modal && !modal._backdropClickRegistered) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
        modal._backdropClickRegistered = true; // Mark as registered to prevent duplicates
    }
});

// ==================== UI EVENT HANDLERS ====================

if (window.UnifiedButtonHandler) {
    window.UnifiedButtonHandler.registerButton(themeToggle, () => {
        console.log('[Button] Theme Toggle clicked');
        toggleTheme();
    });
    window.UnifiedButtonHandler.registerButton(soundToggle, () => {
        console.log('[Button] Sound Toggle clicked');
        toggleSound();
        if (!isMuted && !isAudioContextInitialized) {
            initAudioContext();
        }
    });
    window.UnifiedButtonHandler.registerButton(restartBtn, () => {
        console.log('[Button] Restart clicked');
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (window.stopGameLoop) {
            window.stopGameLoop();
        }
        init();
    });
} else {
    // Fallback
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (soundToggle) soundToggle.addEventListener('click', () => {
        toggleSound();
        if (!isMuted && !isAudioContextInitialized) {
            initAudioContext();
        }
    });
    if (restartBtn) restartBtn.addEventListener('click', () => {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (window.stopGameLoop) {
            window.stopGameLoop();
        }
        init();
    });
}

// ==================== MODE SELECT SCREEN ====================
// Note: modeSelectScreen and gameScreen are declared at top of file (lines 37-38)
// These may be null if DOM is not ready when script loads
// Functions should re-query elements using getElementById as fallback

// Re-query these elements to ensure they're available (fallback if top-level consts are null)
const modeSelectBtn = document.getElementById('modeSelectBtn');
const settingsBtnMain = document.getElementById('btn-settings') || document.getElementById('settingsBtnMain');
const themesBtnMain = document.getElementById('btn-themes') || document.getElementById('themesBtnMain');
const highContrastToggle = document.getElementById('highContrastToggle');

function showModeSelect() {
    // Debug logging with stack trace
    console.log('[showModeSelect] Called', new Error().stack);
    
    // Re-query elements if const variables are null (DOM might not be ready when const was declared)
    let modeSelectScreenEl = modeSelectScreen || document.getElementById('modeSelectScreen');
    let gameScreenEl = gameScreen || document.getElementById('gameScreen');
    
    // If still null, log warning and return
    if (!modeSelectScreenEl || !gameScreenEl) {
        console.warn('[showModeSelect] modeSelectScreen or gameScreen not found in DOM', { 
            modeSelectScreenEl, 
            gameScreenEl,
            modeSelectScreen,
            gameScreen 
        });
        return;
    }
    
    // Remove data attribute to indicate menu is showing
    modeSelectScreenEl.removeAttribute('data-game-active');
    
    console.log('[showModeSelect] Setting modeSelectScreen.display to flex');
    modeSelectScreenEl.style.setProperty('display', 'flex', 'important');
    
    console.log('[showModeSelect] Setting gameScreen.display to none');
    gameScreenEl.style.setProperty('display', 'none', 'important');
    
    // Safely remove overlay classes
    if (gameOverOverlay) gameOverOverlay.classList.remove('show');
    if (levelCompleteOverlay) levelCompleteOverlay.classList.remove('show');
    if (pauseOverlay) pauseOverlay.classList.remove('show');
    
    // Hide level select modal if open
    if (window.hideLevelSelect) {
        window.hideLevelSelect();
    }
    
    // Stop any running game loops
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    if (window.stopGameLoop) {
        window.stopGameLoop();
    }
    
    // Load best score for display
    loadBestEndlessScore();
    
    // Don't call init() here - it should only be called when actually starting a game
    // init() resets game state and should happen when a mode is selected, not when showing menu
}

function hideModeSelect() {
    // Debug logging with stack trace
    console.log('[hideModeSelect] Called', new Error().stack);
    
    // Re-query elements if const variables are null (DOM might not be ready when const was declared)
    let modeSelectScreenEl = modeSelectScreen || document.getElementById('modeSelectScreen');
    let gameScreenEl = gameScreen || document.getElementById('gameScreen');
    
    // If still null, log warning and return
    if (!modeSelectScreenEl || !gameScreenEl) {
        console.warn('[hideModeSelect] modeSelectScreen or gameScreen not found in DOM', { 
            modeSelectScreenEl, 
            gameScreenEl,
            modeSelectScreen,
            gameScreen 
        });
        return;
    }
    
    // Set data attribute to indicate game is active
    modeSelectScreenEl.setAttribute('data-game-active', 'true');
    
    console.log('[hideModeSelect] Setting modeSelectScreen.display to none');
    modeSelectScreenEl.style.setProperty('display', 'none', 'important');
    
    console.log('[hideModeSelect] Setting gameScreen.display to flex');
    gameScreenEl.style.setProperty('display', 'flex', 'important');
    
    // Hide level select modal if open
    if (window.hideLevelSelect) {
        window.hideLevelSelect();
    }
    
    // Phase 7: Clear heatmap when switching modes
    if (showHeatmap) {
        initHeatmap();
    }
}

// Mode buttons are registered by ButtonRegistry
// Only add fallback support if ButtonRegistry is not available
if (!window.ButtonRegistry) {
    if (classicModeBtn && !classicModeBtn._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(classicModeBtn, () => {
                console.log('[Button] Classic Mode clicked');
                if (typeof initClassicMode === 'function') {
                    initClassicMode();
                    if (typeof hideModeSelect === 'function') {
                        hideModeSelect();
                    }
                } else {
                    console.warn('[Button] initClassicMode is not available');
                }
            });
        } else {
            classicModeBtn.addEventListener('click', () => {
                console.log('[Button] Classic Mode clicked');
                if (typeof initClassicMode === 'function') {
                    initClassicMode();
                    if (typeof hideModeSelect === 'function') {
                        hideModeSelect();
                    }
                } else {
                    console.warn('[Button] initClassicMode is not available');
                }
            });
        }
        classicModeBtn._listenerRegistered = true;
    }
    
    if (proceduralModeBtn && !proceduralModeBtn._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(proceduralModeBtn, () => {
                console.log('[Button] Procedural Mode clicked');
                openModal(document.getElementById('proceduralSettingsModal'));
            });
        } else {
            proceduralModeBtn.addEventListener('click', () => {
                openModal(document.getElementById('proceduralSettingsModal'));
            });
        }
        proceduralModeBtn._listenerRegistered = true;
    }
    
    if (bossModeBtn && !bossModeBtn._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(bossModeBtn, () => {
                console.log('[Button] Boss Mode clicked');
                initBossMode();
                hideModeSelect();
            });
        } else {
            bossModeBtn.addEventListener('click', () => {
                initBossMode();
                hideModeSelect();
            });
        }
        bossModeBtn._listenerRegistered = true;
    }
}

// Procedural settings
const proceduralSettingsClose = document.getElementById('proceduralSettingsClose');
const generateProceduralBtn = document.getElementById('generateProceduralBtn');
const boardSizeSlider = document.getElementById('boardSizeSlider');
const obstacleDensitySlider = document.getElementById('obstacleDensitySlider');

if (proceduralSettingsClose) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(proceduralSettingsClose, () => {
            console.log('[Button] Procedural Settings Close clicked');
            closeModal(document.getElementById('proceduralSettingsModal'));
        });
    } else {
        proceduralSettingsClose.onclick = () => closeModal(document.getElementById('proceduralSettingsModal'));
    }
}

if (generateProceduralBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(generateProceduralBtn, () => {
            console.log('[Button] Generate Procedural clicked');
            initProceduralMode();
            closeModal(document.getElementById('proceduralSettingsModal'));
            hideModeSelect();
        });
    } else {
        generateProceduralBtn.onclick = () => {
            initProceduralMode();
            closeModal(document.getElementById('proceduralSettingsModal'));
            hideModeSelect();
        };
    }
}

if (boardSizeSlider) {
    boardSizeSlider.addEventListener('input', (e) => {
        const value = document.getElementById('boardSizeValue');
        if (value) value.textContent = e.target.value;
    });
}

if (obstacleDensitySlider) {
    obstacleDensitySlider.addEventListener('input', (e) => {
        const value = document.getElementById('obstacleDensityValue');
        if (value) value.textContent = e.target.value + '%';
    });
}

// Shop
const shopModal = document.getElementById('shopModal');
const shopClose = document.getElementById('shopClose');
const shopTabs = document.querySelectorAll('.shop-tab');

if (shopBtnMain) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(shopBtnMain, () => {
            console.log('[Button] Shop (Main) clicked');
            if (window.renderShop) {
                window.renderShop();
            }
            openModal(shopModal);
        });
    } else {
        shopBtnMain.addEventListener('click', () => {
            if (window.renderShop) {
                window.renderShop();
            }
            openModal(shopModal);
        });
    }
}

if (shopClose) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(shopClose, () => {
            console.log('[Button] Shop Close clicked');
            closeModal(shopModal);
        });
    } else {
        shopClose.onclick = () => closeModal(shopModal);
    }
}

// Shop tab switching (prevent duplicate listeners)
const shopTabs = document.querySelectorAll('.shop-tab');
if (shopTabs.length > 0) {
    shopTabs.forEach(tab => {
        // Only register if not already registered
        if (!tab._tabListenerRegistered) {
            const handler = () => {
                shopTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                shopTabs.forEach(t => {
                    if (t !== tab) t.setAttribute('aria-selected', 'false');
                });
                // Play tab switch sound
                if (window.UISoundSystem && window.UISoundSystem.playTabSwitch) {
                    window.UISoundSystem.playTabSwitch();
                }
                if (window.renderShop) {
                    window.renderShop();
                }
            };
            
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(tab, handler);
            } else {
                tab.addEventListener('click', handler);
            }
            tab._tabListenerRegistered = true;
        }
    });
}

// Shop search and filter
const shopSearch = document.getElementById('shopSearch');
const shopRarityFilter = document.getElementById('shopRarityFilter');
if (shopSearch) {
    shopSearch.addEventListener('input', () => {
        if (window.renderShop) window.renderShop();
    });
}
if (shopRarityFilter) {
    shopRarityFilter.addEventListener('change', () => {
        if (window.renderShop) window.renderShop();
    });
}

// Inventory
const inventoryModal = document.getElementById('inventoryModal');
const inventoryClose = document.getElementById('inventoryClose');
const inventoryTabs = document.querySelectorAll('.inventory-tab');

if (inventoryBtnMain) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(inventoryBtnMain, () => {
            console.log('[Button] Inventory (Main) clicked');
            if (window.renderInventory) {
                window.renderInventory();
            }
            openModal(inventoryModal);
        });
    } else {
        inventoryBtnMain.addEventListener('click', () => {
            if (window.renderInventory) {
                window.renderInventory();
            }
            openModal(inventoryModal);
        });
    }
}

if (inventoryClose) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(inventoryClose, () => {
            console.log('[Button] Inventory Close clicked');
            closeModal(inventoryModal);
        });
    } else {
        inventoryClose.onclick = () => closeModal(inventoryModal);
    }
}

// Inventory tab switching (prevent duplicate listeners)
const inventoryTabs = document.querySelectorAll('.inventory-tab');
if (inventoryTabs.length > 0) {
    inventoryTabs.forEach(tab => {
        // Only register if not already registered
        if (!tab._tabListenerRegistered) {
            const handler = () => {
                inventoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                inventoryTabs.forEach(t => {
                    if (t !== tab) t.setAttribute('aria-selected', 'false');
                });
                // Play tab switch sound
                if (window.UISoundSystem && window.UISoundSystem.playTabSwitch) {
                    window.UISoundSystem.playTabSwitch();
                }
                if (window.renderInventory) {
                    window.renderInventory();
                }
            };
            
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(tab, handler);
            } else {
                tab.addEventListener('click', handler);
            }
            tab._tabListenerRegistered = true;
        }
    });
}

// Inventory search and filter
const inventorySearch = document.getElementById('inventorySearch');
const inventoryRarityFilter = document.getElementById('inventoryRarityFilter');
if (inventorySearch) {
    inventorySearch.addEventListener('input', () => {
        if (window.renderInventory) window.renderInventory();
    });
}
if (inventoryRarityFilter) {
    inventoryRarityFilter.addEventListener('change', () => {
        if (window.renderInventory) window.renderInventory();
    });
}

// Missions
const missionsModal = document.getElementById('missionsModal');
const missionsClose = document.getElementById('missionsClose');

if (missionsBtnMain) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(missionsBtnMain, () => {
            console.log('[Button] Missions (Main) clicked');
            renderMissions();
            openModal(missionsModal);
        });
    } else {
        missionsBtnMain.addEventListener('click', () => {
            renderMissions();
            openModal(missionsModal);
        });
    }
}

if (missionsClose) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(missionsClose, () => {
            console.log('[Button] Missions Close clicked');
            closeModal(missionsModal);
        });
    } else {
        missionsClose.onclick = () => closeModal(missionsModal);
    }
}

// Level Editor
const levelEditorModal = document.getElementById('levelEditorModal');
const levelEditorClose = document.getElementById('levelEditorClose');
const saveLevelBtn = document.getElementById('saveLevelBtn');
const loadLevelBtn = document.getElementById('loadLevelBtn');
const clearLevelBtn = document.getElementById('clearLevelBtn');
const playtestLevelBtn = document.getElementById('playtestLevelBtn');
const loadLevelSelect = document.getElementById('loadLevelSelect');

if (levelEditorBtnMain) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(levelEditorBtnMain, () => {
            console.log('[Button] Level Editor (Main) clicked');
            initLevelEditor();
            updateLevelSelect();
            openModal(levelEditorModal);
        });
    } else {
        levelEditorBtnMain.addEventListener('click', () => {
            initLevelEditor();
            updateLevelSelect();
            openModal(levelEditorModal);
        });
    }
}

if (levelEditorClose) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(levelEditorClose, () => {
            console.log('[Button] Level Editor Close clicked');
            closeModal(levelEditorModal);
        });
    } else {
        levelEditorClose.onclick = () => closeModal(levelEditorModal);
    }
}

if (saveLevelBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(saveLevelBtn, () => {
            console.log('[Button] Save Level clicked');
            saveLevel();
        });
    } else {
        saveLevelBtn.onclick = saveLevel;
    }
}

if (loadLevelBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(loadLevelBtn, () => {
            console.log('[Button] Load Level clicked');
            const selected = loadLevelSelect?.value;
            if (selected) loadLevel(selected);
        });
    } else {
        loadLevelBtn.onclick = () => {
            const selected = loadLevelSelect?.value;
            if (selected) loadLevel(selected);
        };
    }
}

if (clearLevelBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(clearLevelBtn, () => {
            console.log('[Button] Clear Level clicked');
            clearLevel();
        });
    } else {
        clearLevelBtn.onclick = clearLevel;
    }
}

if (playtestLevelBtn) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(playtestLevelBtn, () => {
            console.log('[Button] Playtest Level clicked');
            playtestLevel();
        });
    } else {
        playtestLevelBtn.onclick = playtestLevel;
    }
}

// These buttons are registered by ButtonRegistry
// Only add fallback support if ButtonRegistry is not available
if (!window.ButtonRegistry) {
    if (endlessModeBtn && !endlessModeBtn._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(endlessModeBtn, () => {
                console.log('[Button] Endless Mode clicked');
                initEndlessMode();
                hideModeSelect();
            });
        } else {
            endlessModeBtn.addEventListener('click', () => {
                initEndlessMode();
                hideModeSelect();
            });
        }
        endlessModeBtn._listenerRegistered = true;
    }
    
    if (modeSelectBtn && !modeSelectBtn._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(modeSelectBtn, () => {
                console.log('[Button] Mode Select (Home) clicked');
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                showModeSelect();
            });
        } else {
            modeSelectBtn.addEventListener('click', () => {
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                showModeSelect();
            });
        }
        modeSelectBtn._listenerRegistered = true;
    }
    
    if (settingsBtnMain && !settingsBtnMain._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(settingsBtnMain, () => {
                console.log('[Button] Settings (Main) clicked');
                if (window.showPerformanceSettings) {
                    window.showPerformanceSettings();
                } else {
                    openModal(settingsModal);
                }
            });
        } else {
            settingsBtnMain.addEventListener('click', () => {
                if (window.showPerformanceSettings) {
                    window.showPerformanceSettings();
                } else {
                    openModal(settingsModal);
                }
            });
        }
        settingsBtnMain._listenerRegistered = true;
    }
    
    if (themesBtnMain && !themesBtnMain._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(themesBtnMain, () => {
                console.log('[Button] Themes (Main) clicked');
                openModal(themesModal);
            });
        } else {
            themesBtnMain.addEventListener('click', () => {
                openModal(themesModal);
            });
        }
        themesBtnMain._listenerRegistered = true;
    }
}

// Accessibility Settings
function initAccessibilitySettings() {
    // UI Scale
    const uiScaleSelect = document.getElementById('uiScaleSelect');
    if (uiScaleSelect && window.Accessibility) {
        const currentScale = window.Accessibility.settings.uiScale || 'medium';
        uiScaleSelect.value = currentScale;
        uiScaleSelect.addEventListener('change', (e) => {
            if (window.Accessibility) {
                window.Accessibility.setUIScale(e.target.value);
            }
        });
    }
    
    // Text Size
    const textSizeSelect = document.getElementById('textSizeSelect');
    if (textSizeSelect && window.Accessibility) {
        const currentSize = window.Accessibility.settings.textSize || 'normal';
        textSizeSelect.value = currentSize;
        textSizeSelect.addEventListener('change', (e) => {
            if (window.Accessibility) {
                window.Accessibility.setTextSize(e.target.value);
            }
        });
    }
    
    // High Contrast
    const highContrastToggle = document.getElementById('highContrastToggle');
    if (highContrastToggle) {
        if (window.Accessibility) {
            highContrastToggle.checked = window.Accessibility.settings.highContrast || false;
            highContrastToggle.addEventListener('change', (e) => {
                if (window.Accessibility) {
                    window.Accessibility.setHighContrast(e.target.checked);
                }
            });
        } else {
            // Legacy support
            const saved = localStorage.getItem('highContrastMode');
            highContrastMode = saved === 'true';
            highContrastToggle.checked = highContrastMode;
            highContrastToggle.addEventListener('change', (e) => {
                highContrastMode = e.target.checked;
                document.documentElement.setAttribute('data-high-contrast', highContrastMode.toString());
                localStorage.setItem('highContrastMode', highContrastMode.toString());
            });
        }
    }
    
    // Colorblind Mode
    const colorBlindModeSelect = document.getElementById('colorBlindModeSelect');
    if (colorBlindModeSelect && window.Accessibility) {
        const currentMode = window.Accessibility.settings.colorBlindMode || '';
        colorBlindModeSelect.value = currentMode;
        colorBlindModeSelect.addEventListener('change', (e) => {
            if (window.Accessibility) {
                window.Accessibility.setColorBlindMode(e.target.value || null);
            }
        });
    }
    
    // Reduced Motion
    const reducedMotionToggle = document.getElementById('reducedMotionToggle');
    if (reducedMotionToggle && window.Accessibility) {
        reducedMotionToggle.checked = window.Accessibility.settings.lowMotion || false;
        reducedMotionToggle.addEventListener('change', (e) => {
            // Play toggle sound
            if (window.UISoundSystem) {
                if (e.target.checked && window.UISoundSystem.playToggleOn) {
                    window.UISoundSystem.playToggleOn();
                } else if (!e.target.checked && window.UISoundSystem.playToggleOff) {
                    window.UISoundSystem.playToggleOff();
                }
            }
            if (window.Accessibility) {
                window.Accessibility.setLowMotion(e.target.checked);
            }
        });
    }
    
    // Focus Indicators
    const showFocusIndicatorsToggle = document.getElementById('showFocusIndicatorsToggle');
    if (showFocusIndicatorsToggle && window.Accessibility) {
        showFocusIndicatorsToggle.checked = window.Accessibility.settings.showFocusIndicators !== false;
        showFocusIndicatorsToggle.addEventListener('change', (e) => {
            // Play toggle sound
            if (window.UISoundSystem) {
                if (e.target.checked && window.UISoundSystem.playToggleOn) {
                    window.UISoundSystem.playToggleOn();
                } else if (!e.target.checked && window.UISoundSystem.playToggleOff) {
                    window.UISoundSystem.playToggleOff();
                }
            }
            if (window.Accessibility) {
                window.Accessibility.settings.showFocusIndicators = e.target.checked;
                window.Accessibility.applySettings();
                window.Accessibility.saveSettings();
            }
        });
    }
    
    // Initialize audio volume sliders
    initAudioVolumeSliders();
}

// Initialize audio volume sliders
function initAudioVolumeSliders() {
    if (!window.AudioManager) return;
    
    // Master Volume
    const masterVolumeSlider = document.getElementById('masterVolumeSlider');
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    if (masterVolumeSlider && masterVolumeValue) {
        const currentVolume = Math.round(window.AudioManager.volumes.master * 100);
        masterVolumeSlider.value = currentVolume;
        masterVolumeValue.textContent = currentVolume + '%';
        
        masterVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            masterVolumeValue.textContent = value + '%';
            window.AudioManager.setMasterVolume(value / 100);
        });
    }
    
    // Music Volume
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    if (musicVolumeSlider && musicVolumeValue) {
        const currentVolume = Math.round(window.AudioManager.volumes.music * 100);
        musicVolumeSlider.value = currentVolume;
        musicVolumeValue.textContent = currentVolume + '%';
        
        musicVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            musicVolumeValue.textContent = value + '%';
            window.AudioManager.setMusicVolume(value / 100);
            // Play slider move sound
            if (window.UISoundSystem && window.UISoundSystem.playSliderMove) {
                window.UISoundSystem.playSliderMove();
            }
        });
    }
    
    // SFX Volume
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');
    if (sfxVolumeSlider && sfxVolumeValue) {
        const currentVolume = Math.round(window.AudioManager.volumes.sfx * 100);
        sfxVolumeSlider.value = currentVolume;
        sfxVolumeValue.textContent = currentVolume + '%';
        
        sfxVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            sfxVolumeValue.textContent = value + '%';
            window.AudioManager.setSFXVolume(value / 100);
            // Play slider move sound
            if (window.UISoundSystem && window.UISoundSystem.playSliderMove) {
                window.UISoundSystem.playSliderMove();
            }
        });
    }
    
    // UI Volume
    const uiVolumeSlider = document.getElementById('uiVolumeSlider');
    const uiVolumeValue = document.getElementById('uiVolumeValue');
    if (uiVolumeSlider && uiVolumeValue) {
        const currentVolume = Math.round(window.AudioManager.volumes.ui * 100);
        uiVolumeSlider.value = currentVolume;
        uiVolumeValue.textContent = currentVolume + '%';
        
        uiVolumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            uiVolumeValue.textContent = value + '%';
            window.AudioManager.setUIVolume(value / 100);
            // Play slider move sound
            if (window.UISoundSystem && window.UISoundSystem.playSliderMove) {
                window.UISoundSystem.playSliderMove();
            }
        });
    }
}

// High Contrast Mode (Legacy support)
function toggleHighContrast() {
    highContrastMode = !highContrastMode;
    document.documentElement.setAttribute('data-high-contrast', highContrastMode);
    localStorage.setItem('highContrastMode', highContrastMode.toString());
}

function loadHighContrast() {
    const saved = localStorage.getItem('highContrastMode');
    highContrastMode = saved === 'true';
    document.documentElement.setAttribute('data-high-contrast', highContrastMode);
    if (highContrastToggle) {
        highContrastToggle.checked = highContrastMode;
    }
}

// Phase 7: Additional event handlers
if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        localStorage.setItem('currentDifficulty', currentDifficulty);
        // Check if Apex should be unlocked
        if (currentDifficulty === 'apex') {
            const saved = localStorage.getItem('apexUnlocked');
            if (saved !== 'true') {
                e.target.value = 'insane';
                currentDifficulty = 'insane';
            }
        }
    });
    const saved = localStorage.getItem('currentDifficulty');
    if (saved) {
        currentDifficulty = saved;
        difficultySelect.value = saved;
    }
}

// These buttons are registered by ButtonRegistry
// Only add fallback support if ButtonRegistry is not available
if (!window.ButtonRegistry) {
    if (skinsBtnMain && !skinsBtnMain._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(skinsBtnMain, () => {
                console.log('[Button] Skins (Main) clicked');
                openModal(skinModal);
            });
        } else {
            skinsBtnMain.addEventListener('click', () => {
                openModal(skinModal);
            });
        }
        skinsBtnMain._listenerRegistered = true;
    }
    
    if (achievementsBtnMain && !achievementsBtnMain._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(achievementsBtnMain, () => {
                console.log('[Button] Achievements (Main) clicked');
                openModal(achievementsModal);
            });
        } else {
            achievementsBtnMain.addEventListener('click', () => {
                openModal(achievementsModal);
            });
        }
        achievementsBtnMain._listenerRegistered = true;
    }
    
    const dailyChallengeBtnMain = document.getElementById('dailyChallengeBtnMain');
    if (dailyChallengeBtnMain && !dailyChallengeBtnMain._listenerRegistered) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(dailyChallengeBtnMain, () => {
                console.log('[Button] Daily Challenge (Main) clicked');
                dailyChallenge = getDailyChallenge();
                if (dailyChallengeTitle) dailyChallengeTitle.textContent = dailyChallenge.name;
                if (dailyChallengeDesc) dailyChallengeDesc.textContent = dailyChallenge.desc;
                updateDailyChallengeProgress();
                openModal(dailyChallengeModal);
            });
        } else {
            dailyChallengeBtnMain.addEventListener('click', () => {
                dailyChallenge = getDailyChallenge();
                if (dailyChallengeTitle) dailyChallengeTitle.textContent = dailyChallenge.name;
                if (dailyChallengeDesc) dailyChallengeDesc.textContent = dailyChallenge.desc;
                updateDailyChallengeProgress();
                openModal(dailyChallengeModal);
            });
        }
        dailyChallengeBtnMain._listenerRegistered = true;
    }
}

if (showGhostToggle) {
    showGhostToggle.addEventListener('change', (e) => {
        showGhost = e.target.checked;
        localStorage.setItem('showGhost', showGhost.toString());
        if (window.ghostSystemEnabled === false) {
            return;
        }
        if (showGhost && !ghostReplay) {
            ghostReplay = loadGhostReplay();
        }
    });
    const saved = localStorage.getItem('showGhost');
    if (saved) showGhost = saved === 'true';
    // If the global ghost system is disabled, ensure toggle appears off
    if (window.ghostSystemEnabled === false) {
        showGhost = false;
        showGhostToggle.checked = false;
    } else {
        showGhostToggle.checked = showGhost;
    }
}

if (showHeatmapToggle) {
    showHeatmapToggle.addEventListener('change', (e) => {
        showHeatmap = e.target.checked;
        localStorage.setItem('showHeatmap', showHeatmap.toString());
        if (!showHeatmap) {
            initHeatmap();
        }
    });
    const saved = localStorage.getItem('showHeatmap');
    if (saved) showHeatmap = saved === 'true';
    showHeatmapToggle.checked = showHeatmap;
}

if (exportHeatmapBtn) {
    exportHeatmapBtn.addEventListener('click', exportHeatmap);
}

// Daily Challenge buttons (prevent duplicate listeners)
if (startDailyChallengeBtn && !startDailyChallengeBtn._listenerRegistered) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(startDailyChallengeBtn, () => {
            console.log('[Button] Start Daily Challenge clicked');
            dailyChallengeActive = true;
            closeModal(dailyChallengeModal);
            init();
        });
    } else {
        startDailyChallengeBtn.addEventListener('click', () => {
            dailyChallengeActive = true;
            closeModal(dailyChallengeModal);
            init();
        });
    }
    startDailyChallengeBtn._listenerRegistered = true;
}

const dailyChallengeClose = document.getElementById('dailyChallengeClose');
if (dailyChallengeClose && !dailyChallengeClose._listenerRegistered) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(dailyChallengeClose, () => {
            console.log('[Button] Daily Challenge Close clicked');
            closeModal(dailyChallengeModal);
        });
    } else {
        dailyChallengeClose.onclick = () => closeModal(dailyChallengeModal);
    }
    dailyChallengeClose._listenerRegistered = true;
}

// Skins close button (prevent duplicate)
const skinsClose = document.getElementById('skinsClose');
if (skinsClose && !skinsClose._listenerRegistered) {
    if (window.UnifiedButtonHandler) {
        window.UnifiedButtonHandler.registerButton(skinsClose, () => {
            console.log('[Button] Skins Close clicked');
            closeModal(skinModal);
        });
    } else {
        skinsClose.onclick = () => closeModal(skinModal);
    }
    skinsClose._listenerRegistered = true;
}

// Update daily challenge progress
function updateDailyChallengeProgress() {
    if (!dailyChallenge) return;
    let progress = 0;
    if (dailyChallenge.id === 'no_powerups') {
        progress = Math.min(100, (score / 20) * 100);
    } else if (dailyChallenge.id === 'fog_survival') {
        const time = Date.now() - weatherChangeTime;
        progress = Math.min(100, (time / 30000) * 100);
    } else if (dailyChallenge.id === 'boss_hunter') {
        progress = Math.min(100, (bossFruitsDefeated / 3) * 100);
    } else if (dailyChallenge.id === 'combo_master') {
        progress = Math.min(100, (comboMultiplier / 6) * 100);
    } else if (dailyChallenge.id === 'zoom_survivor') {
        const totalTime = Date.now() - (gameStartTime || Date.now());
        const zoomTime = zoomHazardActiveTime || 0;
        progress = Math.min(100, (zoomTime / (totalTime * 0.5)) * 100);
    }
    dailyChallengeProgress = progress;
    if (dailyChallengeProgressBar) {
        dailyChallengeProgressBar.style.width = `${progress}%`;
    }
    if (dailyChallengeProgressText) {
        dailyChallengeProgressText.textContent = `${Math.round(progress)}% Complete`;
    }
}

// Render skins modal
function renderSkins() {
    const grid = document.getElementById('skinGrid');
    if (!grid) return;
    grid.innerHTML = '';
    SNAKE_SKINS.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'skin-item';
        if (skin.id === currentSnakeSkin) item.classList.add('selected');
        if (!skin.unlocked) {
            item.classList.add('disabled');
            item.disabled = true;
        }
        item.innerHTML = `
            <div class="skin-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)' : skin.color}"></div>
            <div class="skin-name">${skin.name}</div>
            ${!skin.unlocked ? '<span class="skin-lock">🔒</span>' : ''}
        `;
        if (skin.unlocked) {
            item.onclick = () => {
                currentSnakeSkin = skin.id;
                saveSkins();
                renderSkins();
            };
        }
        grid.appendChild(item);
    });
}

// ==================== INITIALIZE GAME ====================

initTheme();
initSound();
loadSkins();
loadAchievements();
loadThemes();
loadPowerUpsFound();
loadBoardRotationSetting();
loadHighContrast();
initAccessibilitySettings();
loadBestEndlessScore();
loadDailyChallenge();
loadSkins(); // Load snake skins
loadInventory();
loadPlayerProgress();
loadMissions();
checkSkinUnlocks();
checkAllAchievements();
checkThemeUnlocks();

// Initialize particle canvas size
if (particleCanvas) {
    particleCanvas.width = canvas.width;
    particleCanvas.height = canvas.height;
}

// Initialize progression system
if (window.loadProgression) {
    window.loadProgression();
}

// Initialize inventory system
if (window.loadInventory) {
    window.loadInventory();
}

// Apply item effects
if (window.applyItemEffects) {
    window.applyItemEffects();
}

// Initialize seasonal system
if (window.initSeasonalSystem) {
    window.initSeasonalSystem();
}

// Initialize cutscene system
if (window.initCutsceneSystem) {
    window.initCutsceneSystem();
} else if (typeof initCutsceneSystem === 'function') {
    initCutsceneSystem();
}

// Main menu direct minigame buttons (fallback if ButtonRegistry is not available)
// Query elements after DOM is ready instead of at script load time
function attachMinigameButtonListeners() {
    // Re-query elements each time to ensure they exist
    const minigameBtnFruitRush = document.getElementById('minigameBtn_fruit_rush');
    const minigameBtnAvoider = document.getElementById('minigameBtn_avoider');
    const minigameBtnPrecisionBite = document.getElementById('minigameBtn_precision_bite');

    if (!window.ButtonRegistry) {
        if (minigameBtnFruitRush && !minigameBtnFruitRush._listenerRegistered) {
            minigameBtnFruitRush.addEventListener('click', () => {
                console.log('[Minigame Button] Fruit Rush clicked');
                if (window.loadMinigame) {
                    window.loadMinigame('fruit_rush');
                } else {
                    console.error('[Minigame Button] window.loadMinigame is not available');
                }
            });
            minigameBtnFruitRush._listenerRegistered = true;
        }
        if (minigameBtnAvoider && !minigameBtnAvoider._listenerRegistered) {
            minigameBtnAvoider.addEventListener('click', () => {
                console.log('[Minigame Button] Avoider clicked');
                if (window.loadMinigame) {
                    window.loadMinigame('avoider');
                } else {
                    console.error('[Minigame Button] window.loadMinigame is not available');
                }
            });
            minigameBtnAvoider._listenerRegistered = true;
        }
        if (minigameBtnPrecisionBite && !minigameBtnPrecisionBite._listenerRegistered) {
            minigameBtnPrecisionBite.addEventListener('click', () => {
                console.log('[Minigame Button] Precision Bite clicked');
                if (window.loadMinigame) {
                    window.loadMinigame('precision_bite');
                } else {
                    console.error('[Minigame Button] window.loadMinigame is not available');
                }
            });
            minigameBtnPrecisionBite._listenerRegistered = true;
        }
    }
}

// Attach listeners when DOM is ready
let minigameListenerRetryCount = 0;
const MAX_MINIGAME_RETRIES = 20; // Max 2 seconds of retries

function ensureMinigameListenersAttached() {
    // Check if window.loadMinigame is available
    if (!window.loadMinigame) {
        minigameListenerRetryCount++;
        if (minigameListenerRetryCount < MAX_MINIGAME_RETRIES) {
            console.warn(`[Minigame Buttons] window.loadMinigame not available yet, will retry (${minigameListenerRetryCount}/${MAX_MINIGAME_RETRIES})`);
            setTimeout(ensureMinigameListenersAttached, 100);
            return;
        } else {
            console.error('[Minigame Buttons] window.loadMinigame not available after max retries, attaching listeners anyway');
        }
    }
    attachMinigameButtonListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMinigameListenersAttached);
} else {
    // DOM already loaded
    ensureMinigameListenersAttached();
}

// Also try on window load as backup
window.addEventListener('load', () => {
    setTimeout(ensureMinigameListenersAttached, 100);
});

// Check Apex unlock
const apexUnlocked = localStorage.getItem('apexUnlocked') === 'true';
if (difficultySelect && !apexUnlocked) {
    const apexOption = difficultySelect.querySelector('option[value="apex"]');
    if (apexOption) apexOption.disabled = true;
}

// Level/World/Skill buttons (fallback if ButtonRegistry is not available)
const levelSelectBtn = document.getElementById('levelSelectBtn');
const worldSelectBtn = document.getElementById('worldSelectBtn');
const skillTreeBtn = document.getElementById('skillTreeBtn');

if (!window.ButtonRegistry) {
    if (levelSelectBtn && !levelSelectBtn._listenerRegistered) {
        levelSelectBtn.addEventListener('click', () => {
            if (window.showLevelSelect) {
                window.showLevelSelect();
            }
        });
        levelSelectBtn._listenerRegistered = true;
    }

    if (worldSelectBtn && !worldSelectBtn._listenerRegistered) {
        worldSelectBtn.addEventListener('click', () => {
            if (window.showWorldSelect) {
                window.showWorldSelect();
            }
        });
        worldSelectBtn._listenerRegistered = true;
    }

    if (skillTreeBtn && !skillTreeBtn._listenerRegistered) {
        skillTreeBtn.addEventListener('click', () => {
            if (window.showSkillTree) {
                window.showSkillTree();
            }
        });
        skillTreeBtn._listenerRegistered = true;
    }
}

let gameInitialized = false;

// Single entrypoint for booting the game UI/engine from the outside world.
// This is called by the Initialization Manager or the fallback in index.html.
function initGame() {
    if (gameInitialized) return;
    gameInitialized = true;

    console.log('INIT: Engine Start → OK');
    window.__GAME_READY__ = true;

    // Core systems that are safe to initialize here if not already done by InitManager.
    if (window.Progression && !window.Progression._initialized) {
        try {
            window.Progression.initialize();
            window.Progression._initialized = true;
        } catch (e) {
            console.error('INIT: Progression init failed:', e);
        }
    }

    if (window.SkillTree && !window.SkillTree._initialized) {
        try {
            window.SkillTree.initialize();
            window.SkillTree._initialized = true;
        } catch (e) {
            console.error('INIT: SkillTree init failed:', e);
        }
    }

    if (window.Renderer && !window.Renderer._initialized) {
        try {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas ? canvas.getContext('2d') : null;
            const particleCanvas = document.getElementById('particleCanvas');
            const particleCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
            if (canvas && ctx) {
                window.Renderer.init(canvas, ctx, particleCanvas, particleCtx, GRID_COLS, GRID_ROWS, CELL_SIZE);
                window.Renderer._initialized = true;
            }
        } catch (e) {
            console.error('INIT: Renderer init failed:', e);
        }
    }

    if (window.UI && !window.UI._initialized) {
        try {
            window.UI.initialize();
            window.UI._initialized = true;
        } catch (e) {
            console.error('INIT: UI init failed:', e);
        }
    }

    // Ensure all buttons, including main menu buttons, are wired up once
    // UnifiedButtonHandler is available. This is a safe, UI-only registration
    // pass and does not affect gameplay or the game loop.
    try {
        if (window.UnifiedButtonHandler && window.ButtonRegistry && typeof window.ButtonRegistry.registerAllButtons === 'function') {
            window.ButtonRegistry.registerAllButtons();
        }
    } catch (e) {
        console.warn('INIT: ButtonRegistry registration pass failed:', e);
    }

    // Phase-2 polishing systems (defensive: ignore individual failures)
    try { if (window.DebugOverlay && !window.DebugOverlay._initialized) { window.DebugOverlay.init(); window.DebugOverlay._initialized = true; } } catch (e) { console.warn('INIT: DebugOverlay init failed:', e); }
    try { if (window.Profiler && !window.Profiler._initialized) { window.Profiler.init(); window.Profiler._initialized = true; } } catch (e) { console.warn('INIT: Profiler init failed:', e); }
    try { if (window.CameraShake && !window.CameraShake._initialized) { window.CameraShake.init(); window.CameraShake._initialized = true; } } catch (e) { console.warn('INIT: CameraShake init failed:', e); }
    try { if (window.Gamepad && !window.Gamepad._initialized) { window.Gamepad.init(); window.Gamepad._initialized = true; } } catch (e) { console.warn('INIT: Gamepad init failed:', e); }
    try { if (window.GhostReplay && !window.GhostReplay._initialized) { window.GhostReplay.init(); window.GhostReplay._initialized = true; } } catch (e) { console.warn('INIT: GhostReplay init failed:', e); }
    try { if (window.SnakeAnimator && !window.SnakeAnimator._initialized) { window.SnakeAnimator.init(); window.SnakeAnimator._initialized = true; } } catch (e) { console.warn('INIT: SnakeAnimator init failed:', e); }

    // Show mode select screen once everything is ready
    try {
        if (typeof showModeSelect === 'function') {
            showModeSelect();
        } else {
            console.warn('INIT: showModeSelect function not available');
        }
    } catch (e) {
        console.error('INIT: showModeSelect failed:', e);
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(e, 'showModeSelect', 0);
        }
    }

    // Legacy animation loop (replaced by fixed-timestep loop)
    // This is kept for particles and non-game rendering
    function animationLoop() {
        // Only render particles and static elements when game is not running
        if (!gameRunning && (foodSpawnTime > 0 || particles.length > 0)) {
            draw(0);
        }
        requestAnimationFrame(animationLoop);
    }

    // Start legacy animation loop for particles
    requestAnimationFrame(animationLoop);
}

// Expose for InitManager / boot scripts
window.initGame = initGame;

// Expose Classic Mode functions for classic.html loader
window.initClassicMode = initClassicMode;
window.startClassicMode = startClassicMode;
