// ==================== SLITHO GAME - REBUILT WITH WORKING FEATURES ====================

// ==================== DIFFICULTY SYSTEM ====================
const DIFFICULTIES = {
    easy: {
        name: 'Easy',
        speedMultiplier: 1.4,      // Slower (easier)
        scoreMultiplier: 1.0,
        minigameSpeedMultiplier: 1.3
    },
    normal: {
        name: 'Normal',
        speedMultiplier: 1.0,      // Standard speed
        scoreMultiplier: 1.0,
        minigameSpeedMultiplier: 1.0
    },
    hard: {
        name: 'Hard',
        speedMultiplier: 0.7,      // Faster (harder)
        scoreMultiplier: 1.2,
        minigameSpeedMultiplier: 0.75
    },
    insane: {
        name: 'Insane',
        speedMultiplier: 0.5,      // Much faster
        scoreMultiplier: 1.5,
        minigameSpeedMultiplier: 0.55
    }
};

// Current difficulty (default to normal)
let currentDifficulty = 'normal';

// Load difficulty from localStorage
function loadDifficulty() {
    try {
        const saved = localStorage.getItem('currentDifficulty');
        if (saved && DIFFICULTIES[saved]) {
            currentDifficulty = saved;
        }
    } catch (e) {
        console.warn('Could not load difficulty:', e);
    }
}

// Save difficulty to localStorage
function saveDifficulty(difficulty) {
    try {
        if (DIFFICULTIES[difficulty]) {
            currentDifficulty = difficulty;
            localStorage.setItem('currentDifficulty', difficulty);
        }
    } catch (e) {
        console.warn('Could not save difficulty:', e);
    }
}

// Get current difficulty settings
function getCurrentDifficulty() {
    return DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;
}

// Initialize difficulty system
loadDifficulty();

// Expose difficulty system globally
window.DIFFICULTIES = DIFFICULTIES;
window.getCurrentDifficulty = getCurrentDifficulty;
window.currentDifficulty = currentDifficulty;
window.saveDifficulty = saveDifficulty;

// Game state
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let level = 1;
let gameRunning = false;
let gameLoop = null;
let gameMode = 'classic'; // classic, endless, procedural, boss
let speed = 150;
let targetScore = 50;
let bestEndlessScore = 0;
let endlessSpeedLevel = 0;

// Constants
const GRID_COLS = 20;
const GRID_ROWS = 20;
const TOTAL_LEVELS = 20;
const INITIAL_SPEED = 130;
let CELL_SIZE = 20;

// Canvas setup (will be initialized properly)
let canvas = null;
let ctx = null;

// DOM elements (will be queried when needed)
let scoreElement = null;
let levelElement = null;
let gameScreen = null;
let modeSelectScreen = null;
let pauseBtn = null;
let menuBtn = null;

// Level configurations (base speeds, will be modified by difficulty)
const levelConfigs = [];
for (let i = 1; i <= TOTAL_LEVELS; i++) {
    levelConfigs.push({
        level: i,
        targetScore: Math.floor(5 + (i - 1) * 3),
        baseSpeed: Math.max(60, INITIAL_SPEED - (i - 1) * 3),
        inputBuffer: Math.max(50, 150 - (i - 1) * 5)
    });
}

// Expose level configs globally
window.levelConfigs = levelConfigs;

// Get current level configuration (with difficulty applied)
function getCurrentLevelConfig() {
    const config = levelConfigs[level - 1] || levelConfigs[0];
    const difficulty = getCurrentDifficulty();
    return {
        ...config,
        speed: Math.max(40, Math.floor(config.baseSpeed / difficulty.speedMultiplier))
    };
}

// Load best endless score from localStorage
function loadBestEndlessScore() {
    try {
        const saved = localStorage.getItem('bestEndlessScore');
        if (saved) {
            bestEndlessScore = parseInt(saved) || 0;
        }
    } catch (e) {
        console.warn('Could not load best endless score:', e);
    }
}

// Save best endless score to localStorage
function saveBestEndlessScore() {
    try {
        if (score > bestEndlessScore) {
            bestEndlessScore = score;
            localStorage.setItem('bestEndlessScore', bestEndlessScore.toString());
        }
    } catch (e) {
        console.warn('Could not save best endless score:', e);
    }
}

// Hide mode select screen and show game screen
window.hideModeSelect = function() {
    
    const modeSelectScreenEl = document.getElementById('modeSelectScreen');
    const gameScreenEl = document.getElementById('gameScreen');
    
    if (!modeSelectScreenEl || !gameScreenEl) {
        console.warn('[hideModeSelect] Elements not found');
        return;
    }
    
    modeSelectScreenEl.setAttribute('data-game-active', 'true');
    modeSelectScreenEl.style.setProperty('display', 'none', 'important');
    gameScreenEl.style.setProperty('display', 'flex', 'important');
};

// Show mode select screen and hide game screen
window.showModeSelect = function() {
    
    const modeSelectScreenEl = document.getElementById('modeSelectScreen');
    const gameScreenEl = document.getElementById('gameScreen');
    
    if (!modeSelectScreenEl || !gameScreenEl) {
        console.warn('[showModeSelect] Elements not found');
        return;
    }
    
    modeSelectScreenEl.removeAttribute('data-game-active');
    modeSelectScreenEl.style.setProperty('display', 'flex', 'important');
    gameScreenEl.style.setProperty('display', 'none', 'important');
};

// Initialize game - set up canvas and event listeners
let eventListenersAdded = false;

function initGame() {
    // Query DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas?.getContext('2d');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    gameScreen = document.getElementById('gameScreen');
    modeSelectScreen = document.getElementById('modeSelectScreen');
    pauseBtn = document.getElementById('pauseBtn');
    menuBtn = document.getElementById('menuBtn');
    
    if (!canvas || !ctx) {
        console.error('Canvas not found');
        return false;
    }
    
    // Calculate cell size based on canvas dimensions (ensure it matches actual display size)
    // Use canvas width attribute, not CSS width
    const actualWidth = canvas.width || 400;
    const actualHeight = canvas.height || 400;
    CELL_SIZE = actualWidth / GRID_COLS;
    
    // Canvas initialized successfully
    
    // Reset game state
    resetGame();
    updateUI();
    
    // Draw initial state
    draw();
    
    // Event listeners (only add once)
    if (!eventListenersAdded) {
        document.addEventListener('keydown', handleKeyPress);
        if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
        if (menuBtn) menuBtn.addEventListener('click', showMenu);
        
        // Prevent arrow keys from scrolling
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
                e.preventDefault();
            }
        }, { passive: false });
        
        eventListenersAdded = true;
    }
    
    return true;
}

// Reset game state
function resetGame() {
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);
    snake = [{ x: startX, y: startY }];
    dx = 0; // Start with no movement - wait for first input
    dy = 0;
    score = 0;
    level = 1;
    endlessSpeedLevel = 0;
    gameRunning = false;
    
    const difficulty = getCurrentDifficulty();
    
    // Set target score based on mode and level
    if (gameMode === 'classic') {
        const config = getCurrentLevelConfig(); // Already has difficulty applied
        targetScore = config.targetScore;
        speed = config.speed;
    } else if (gameMode === 'endless') {
        targetScore = Infinity;
        // Apply difficulty to initial endless speed
        speed = Math.floor(INITIAL_SPEED / difficulty.speedMultiplier);
    } else {
        targetScore = 50;
        speed = Math.floor(150 / difficulty.speedMultiplier);
    }
    
    generateFood();
}

// Generate food at random position
function generateFood() {
    let newFood;
    let attempts = 0;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        attempts++;
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) && attempts < 100);
    
    food = newFood;
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameRunning && e.key !== ' ') return;
    
    const key = e.key;
    
    if (key === ' ' || key === 'p' || key === 'P') {
        togglePause();
        return;
    }
    
    // Prevent reverse direction
    if (key === 'ArrowUp' && dy !== 1) {
        dx = 0;
        dy = -1;
    } else if (key === 'ArrowDown' && dy !== -1) {
        dx = 0;
        dy = 1;
    } else if (key === 'ArrowLeft' && dx !== 1) {
        dx = -1;
        dy = 0;
    } else if (key === 'ArrowRight' && dx !== -1) {
        dx = 1;
        dy = 0;
    }
    
    // WASD support
    if (key === 'w' || key === 'W') {
        if (dy !== 1) { dx = 0; dy = -1; }
    } else if (key === 's' || key === 'S') {
        if (dy !== -1) { dx = 0; dy = 1; }
    } else if (key === 'a' || key === 'A') {
        if (dx !== 1) { dx = -1; dy = 0; }
    } else if (key === 'd' || key === 'D') {
        if (dx !== -1) { dx = 1; dy = 0; }
    }
}

// Main game loop
function gameStep() {
    if (!gameRunning) {
        console.log('[gameStep] Game not running, skipping');
        return;
    }
    
    if (!canvas || !ctx) {
        console.warn('[gameStep] Canvas or context not available');
        return;
    }
    
    // Don't move if direction hasn't been set (wait for first input)
    if (dx === 0 && dy === 0) {
        draw();
        updateUI();
        return;
    }
    
    // Move snake
    if (!snake || snake.length === 0) {
        console.error('[gameStep] Snake is empty!');
        gameOver();
        return;
    }
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Debug: Log only on errors (removed verbose logging for performance)
    
    // Check wall collision (GRID_COLS is 20, so valid x is 0-19)
    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
        gameOver();
        return;
    }
    
    // Check self collision (skip first segment which is the current head)
    // Only check if snake has more than 1 segment
    if (snake.length > 1) {
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        const difficulty = getCurrentDifficulty();
        score += Math.floor(10 * difficulty.scoreMultiplier);
        generateFood();
        
        // Check level completion
        if (gameMode === 'classic' && score >= targetScore) {
            levelUp();
        } else if (gameMode === 'endless') {
            endlessSpeedLevel++;
            // Increase speed every 5 points
            if (endlessSpeedLevel % 5 === 0) {
                const baseSpeed = Math.max(50, speed - 5);
                speed = Math.floor(baseSpeed / difficulty.speedMultiplier);
                // Restart loop with new speed
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = setInterval(gameStep, speed);
                }
            }
        }
    } else {
        snake.pop();
    }
    
    draw();
    updateUI();
}

// Draw game
function draw() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background (more visible)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i <= GRID_COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0; // Reset alpha for other elements
    
    // Draw food
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    
    // Draw snake
    ctx.fillStyle = '#4CAF50';
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head with glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4CAF50';
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(segment.x * CELL_SIZE + 2, segment.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Update UI
function updateUI() {
    if (scoreElement) scoreElement.textContent = `Score: ${score}`;
    if (levelElement) levelElement.textContent = `Level: ${level}`;
}

// Level up
function levelUp() {
    level++;
    const config = getCurrentLevelConfig();
    targetScore = config.targetScore;
    speed = config.speed;
    
    // Restart loop with new speed
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
    }
    
    // Show level up message (optional - can be removed for smoother gameplay)
    // alert(`Level ${level}! Target: ${targetScore}`);
}

// Game over
function gameOver() {
    // Game over triggered
    gameRunning = false;
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Save best score for endless mode
    if (gameMode === 'endless') {
        saveBestEndlessScore();
    }
    
    // Show game over - delay to ensure game state is updated
    setTimeout(() => {
        // Don't show alert if score is 0 (might be initialization issue)
        if (score > 0 || snake.length > 1) {
            alert(`Game Over! Final Score: ${score}`);
        }
        showMenu();
    }, 100);
}

// Start game
function startGame() {
    resetGame();
    
    // Small delay to ensure canvas is ready and snake is initialized
    setTimeout(() => {
        if (!canvas || !ctx) {
            console.error('[startGame] Canvas not ready!', { canvas: !!canvas, ctx: !!ctx });
            window.showModeSelect();
            return;
        }
        
        if (!snake || snake.length === 0) {
            console.error('[startGame] Snake not initialized!');
            window.showModeSelect();
            return;
        }
        
        gameRunning = true;
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
        // Game started successfully
        
        // Draw initial state
        draw();
        updateUI();
    }, 150);
}

// Toggle pause
function togglePause() {
    if (!gameRunning) {
        startGame();
        if (pauseBtn) pauseBtn.textContent = 'Pause';
    } else {
        gameRunning = false;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    }
}

// Show menu
function showMenu() {
    gameRunning = false;
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    if (typeof window.showModeSelect === 'function') {
        window.showModeSelect();
    } else {
        // Fallback
        const gameScreenEl = document.getElementById('gameScreen');
        const modeSelectScreenEl = document.getElementById('modeSelectScreen');
        if (gameScreenEl) gameScreenEl.style.display = 'none';
        if (modeSelectScreenEl) modeSelectScreenEl.style.display = 'flex';
    }
}

// Show game screen and start game
function showGameScreen() {
    if (typeof window.hideModeSelect === 'function') {
        window.hideModeSelect();
    } else {
        // Fallback
        const gameScreenEl = document.getElementById('gameScreen');
        const modeSelectScreenEl = document.getElementById('modeSelectScreen');
        if (modeSelectScreenEl) modeSelectScreenEl.style.display = 'none';
        if (gameScreenEl) gameScreenEl.style.display = 'flex';
    }
    
    // Initialize game and start after a brief delay to ensure DOM is ready
    setTimeout(() => {
        if (initGame()) {
            startGame();
        } else {
            console.error('Failed to initialize game');
            window.showModeSelect();
        }
    }, 100);
}

// Game mode initializers
window.initClassicMode = function() {
    gameMode = 'classic';
    level = 1;
    targetScore = 50;
    showGameScreen();
};

window.initEndlessMode = function() {
    gameMode = 'endless';
    level = 1;
    targetScore = Infinity;
    speed = INITIAL_SPEED;
    endlessSpeedLevel = 0;
    loadBestEndlessScore();
    showGameScreen();
};

window.initProceduralMode = function() {
    gameMode = 'procedural';
    level = 1;
    targetScore = 50;
    // Procedural terrain generation can be added here later
    showGameScreen();
};

window.initBossMode = function() {
    gameMode = 'boss';
    level = 1;
    targetScore = 50;
    // Boss mode logic can be added here later
    showGameScreen();
};

// Note: loadMinigame is defined in minigames/index.js
// This function ensures hideModeSelect is called when minigames load
// Wrap the existing loadMinigame after it's defined
function wrapLoadMinigame() {
    if (window.loadMinigame && !window.loadMinigame._wrapped) {
        const originalLoadMinigame = window.loadMinigame;
        window.loadMinigame = function(minigameId) {
            if (typeof window.hideModeSelect === 'function') {
                window.hideModeSelect();
            }
            const gameScreenEl = document.getElementById('gameScreen');
            if (gameScreenEl) gameScreenEl.style.display = 'none';
            originalLoadMinigame(minigameId);
        };
        window.loadMinigame._wrapped = true;
    }
}

// Wrap loadMinigame after DOM is ready (to ensure minigames/index.js has loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wrapLoadMinigame);
} else {
    // Try immediately, and also on next tick in case minigames/index.js loads later
    wrapLoadMinigame();
    setTimeout(wrapLoadMinigame, 100);
}

// Initialize difficulty selector
function initDifficultySelector() {
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        // Set initial value from loaded difficulty
        difficultySelect.value = currentDifficulty;
        
        // Add change listener
        difficultySelect.addEventListener('change', (e) => {
            const newDifficulty = e.target.value;
            saveDifficulty(newDifficulty);
            // Update global reference
            window.currentDifficulty = newDifficulty;
            console.log('Difficulty changed to:', newDifficulty);
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Don't auto-start game, just prepare
        loadBestEndlessScore();
        initDifficultySelector();
    });
} else {
    loadBestEndlessScore();
    initDifficultySelector();
}