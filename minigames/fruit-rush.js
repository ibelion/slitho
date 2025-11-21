// ==================== FRUIT RUSH MINIGAME ====================
// Endless survival mode - How long can you survive? Eat fruits to grow and avoid hitting yourself!
// Game only ends on self-collision, no time limits.

let fruitRushCanvas = null;
let fruitRushCtx = null;
let fruitRushSnake = [{ x: 10, y: 10 }];
let fruitRushFood = { x: 15, y: 15 };
let fruitRushDx = 0;
let fruitRushDy = 0;
let fruitRushScore = 0;
let fruitRushElapsedTime = 0;
let fruitRushRunning = false;
let fruitRushLoop = null;
let fruitRushStartTime = 0;

const FRUIT_RUSH_GRID_COLS = 20;
const FRUIT_RUSH_GRID_ROWS = 20;
const FRUIT_RUSH_CELL_SIZE = 20;

function initFruitRush() {
    // Create canvas
    if (!fruitRushCanvas) {
        fruitRushCanvas = document.createElement('canvas');
        fruitRushCanvas.id = 'fruitRushCanvas';
        fruitRushCanvas.width = FRUIT_RUSH_GRID_COLS * FRUIT_RUSH_CELL_SIZE;
        fruitRushCanvas.height = FRUIT_RUSH_GRID_ROWS * FRUIT_RUSH_CELL_SIZE;
        fruitRushCanvas.style.cssText = 'border: 2px solid var(--border-color); border-radius: 10px;';
        fruitRushCtx = fruitRushCanvas.getContext('2d');
    }
    
    // Reset game state
    fruitRushSnake = [{ x: 10, y: 10 }];
    fruitRushFood = generateFruitRushFood();
    fruitRushDx = 0;
    fruitRushDy = 0;
    fruitRushScore = 0;
    fruitRushElapsedTime = 0;
    fruitRushRunning = false;
    
    // Create UI
    const container = document.createElement('div');
    container.id = 'fruitRushContainer';
    container.className = 'minigame-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
    `;
    
    container.innerHTML = `
        <h1 style="color: white; font-size: 2em;">🍎 Fruit Rush</h1>
        <div style="color: white; font-size: 1.5em;">
            Score: <span id="fruitRushScore">0</span> | 
            Survival Time: <span id="fruitRushTimer">0</span>s
        </div>
        <div id="fruitRushCanvasContainer"></div>
        <div style="color: white; text-align: center;">
            <p>How long can you survive? Eat fruits to grow and avoid hitting yourself!</p>
            <p>Use Arrow Keys or WASD to move</p>
        </div>
        <button class="btn" id="fruitRushStartBtn">Start</button>
        <button class="btn" id="fruitRushBackBtn">Back to Menu</button>
    `;
    
    document.body.appendChild(container);
    document.getElementById('fruitRushCanvasContainer').appendChild(fruitRushCanvas);
    
    // Event listeners
    document.getElementById('fruitRushStartBtn').onclick = startFruitRush;
    document.getElementById('fruitRushBackBtn').onclick = exitFruitRush;
    
    // Keyboard controls
    document.addEventListener('keydown', handleFruitRushInput);
    
    drawFruitRush();
}

function generateFruitRushFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * FRUIT_RUSH_GRID_COLS),
            y: Math.floor(Math.random() * FRUIT_RUSH_GRID_ROWS)
        };
    } while (fruitRushSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

function handleFruitRushInput(e) {
    if (!fruitRushRunning) return;
    
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const wasdKeys = ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
    
    if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (fruitRushDy !== 1) { fruitRushDx = 0; fruitRushDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (fruitRushDy !== -1) { fruitRushDx = 0; fruitRushDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (fruitRushDx !== 1) { fruitRushDx = -1; fruitRushDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (fruitRushDx !== -1) { fruitRushDx = 1; fruitRushDy = 0; }
            break;
    }
}

function startFruitRush() {
    if (fruitRushDx === 0 && fruitRushDy === 0) {
        fruitRushDx = 1; // Start moving right
    }
    
    fruitRushRunning = true;
    fruitRushStartTime = Date.now();
    document.getElementById('fruitRushStartBtn').style.display = 'none';
    
    fruitRushLoop = setInterval(() => {
        updateFruitRush();
        drawFruitRush();
        
        // Update survival time (elapsed time since start)
        const elapsed = Math.floor((Date.now() - fruitRushStartTime) / 1000);
        fruitRushElapsedTime = elapsed;
        const timerElement = document.getElementById('fruitRushTimer');
        if (timerElement) {
            timerElement.textContent = fruitRushElapsedTime;
        }
    }, 100);
}

function updateFruitRush() {
    if (!fruitRushRunning) return;
    
    const head = {
        x: fruitRushSnake[0].x + fruitRushDx,
        y: fruitRushSnake[0].y + fruitRushDy
    };
    
    // Wall wrap-around
    if (head.x < 0) head.x = FRUIT_RUSH_GRID_COLS - 1;
    if (head.x >= FRUIT_RUSH_GRID_COLS) head.x = 0;
    if (head.y < 0) head.y = FRUIT_RUSH_GRID_ROWS - 1;
    if (head.y >= FRUIT_RUSH_GRID_ROWS) head.y = 0;
    
    // Self collision - only way to end the game (endless survival mode, no time limits)
    if (fruitRushSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        endFruitRush();
        return;
    }
    
    fruitRushSnake.unshift(head);
    
    // Food collision
    if (head.x === fruitRushFood.x && head.y === fruitRushFood.y) {
        fruitRushScore++;
        document.getElementById('fruitRushScore').textContent = fruitRushScore;
        fruitRushFood = generateFruitRushFood();
    } else {
        fruitRushSnake.pop();
    }
}

function drawFruitRush() {
    if (!fruitRushCtx) return;
    
    // Clear
    fruitRushCtx.fillStyle = '#111';
    fruitRushCtx.fillRect(0, 0, fruitRushCanvas.width, fruitRushCanvas.height);
    
    // Draw snake
    fruitRushCtx.fillStyle = '#4CAF50';
    fruitRushSnake.forEach((segment, index) => {
        const x = segment.x * FRUIT_RUSH_CELL_SIZE + 1;
        const y = segment.y * FRUIT_RUSH_CELL_SIZE + 1;
        fruitRushCtx.fillRect(x, y, FRUIT_RUSH_CELL_SIZE - 2, FRUIT_RUSH_CELL_SIZE - 2);
    });
    
    // Draw food
    fruitRushCtx.fillStyle = '#FF0000';
    const foodX = fruitRushFood.x * FRUIT_RUSH_CELL_SIZE + 1;
    const foodY = fruitRushFood.y * FRUIT_RUSH_CELL_SIZE + 1;
    fruitRushCtx.fillRect(foodX, foodY, FRUIT_RUSH_CELL_SIZE - 2, FRUIT_RUSH_CELL_SIZE - 2);
}

function endFruitRush() {
    fruitRushRunning = false;
    if (fruitRushLoop) {
        clearInterval(fruitRushLoop);
        fruitRushLoop = null;
    }
    
    // Calculate final stats
    const finalTime = Math.floor((Date.now() - fruitRushStartTime) / 1000);
    const fruitsPerSecond = finalTime > 0 ? (fruitRushScore / finalTime).toFixed(2) : fruitRushScore;
    
    // Format survival time
    const minutes = Math.floor(finalTime / 60);
    const seconds = finalTime % 60;
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    // Show results
    const container = document.getElementById('fruitRushContainer');
    const results = document.createElement('div');
    results.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        color: white;
    `;
    results.innerHTML = `
        <h2>Game Over!</h2>
        <p style="font-size: 1.2em; margin: 15px 0; color: #4CAF50;">Great survival run!</p>
        <p style="font-size: 1.5em; margin: 20px 0;">Fruits Collected: <strong>${fruitRushScore}</strong></p>
        <p style="margin: 10px 0; font-size: 1.2em;">You Survived: <strong>${timeDisplay}</strong></p>
        <p style="margin: 10px 0; font-size: 0.9em; color: #aaa;">Average: ${fruitsPerSecond} fruits/second</p>
        <button class="btn" onclick="restartFruitRush()">Play Again</button>
        <button class="btn" onclick="exitFruitRush()" style="margin-left: 10px;">Back to Menu</button>
    `;
    container.appendChild(results);
}

function restartFruitRush() {
    exitFruitRush();
    setTimeout(() => initFruitRush(), 100);
}

function exitFruitRush() {
    fruitRushRunning = false;
    if (fruitRushLoop) {
        clearInterval(fruitRushLoop);
        fruitRushLoop = null;
    }
    
    const container = document.getElementById('fruitRushContainer');
    if (container) {
        container.remove();
    }
    
    document.removeEventListener('keydown', handleFruitRushInput);
}

// Export
window.initFruitRush = initFruitRush;
window.restartFruitRush = restartFruitRush;
window.exitFruitRush = exitFruitRush;

