// ==================== PRECISION BITE MINIGAME ====================
// Hit shrinking target zones

let precisionCanvas = null;
let precisionCtx = null;
let precisionSnake = [{ x: 10, y: 10 }];
let precisionTarget = null;
let precisionDx = 0;
let precisionDy = 0;
let precisionScore = 0;
let precisionTargetsHit = 0;
let precisionRunning = false;
let precisionLoop = null;
let precisionLevel = 1;

const PRECISION_GRID_COLS = 20;
const PRECISION_GRID_ROWS = 20;
const PRECISION_CELL_SIZE = 20;
const PRECISION_TICK_MS = 140; // game tick interval in milliseconds (higher = slower)

function initPrecisionBite() {
    // Create canvas
    if (!precisionCanvas) {
        precisionCanvas = document.createElement('canvas');
        precisionCanvas.id = 'precisionCanvas';
        precisionCanvas.width = PRECISION_GRID_COLS * PRECISION_CELL_SIZE;
        precisionCanvas.height = PRECISION_GRID_ROWS * PRECISION_CELL_SIZE;
        precisionCanvas.style.cssText = 'border: 2px solid var(--border-color); border-radius: 10px;';
        precisionCtx = precisionCanvas.getContext('2d');
    }
    
    // Reset game state
    precisionSnake = [{ x: 10, y: 10 }];
    precisionTarget = null;
    precisionDx = 0;
    precisionDy = 0;
    precisionScore = 0;
    precisionTargetsHit = 0;
    precisionRunning = false;
    precisionLevel = 1;
    
    // Create UI
    const container = document.createElement('div');
    container.id = 'precisionContainer';
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
        <h1 style="color: white; font-size: 2em;">🎯 Precision Bite</h1>
        <div style="color: white; font-size: 1.5em;">
            Score: <span id="precisionScore">0</span> | 
            Targets Hit: <span id="precisionTargetsHit">0</span> | 
            Level: <span id="precisionLevel">1</span>
        </div>
        <div id="precisionCanvasContainer"></div>
        <div style="color: white; text-align: center;">
            <p>Hit the shrinking target zones!</p>
            <p>Use Arrow Keys or WASD to move</p>
        </div>
        <button class="btn" id="precisionStartBtn">Start</button>
        <button class="btn" id="precisionBackBtn">Back to Menu</button>
    `;
    
    document.body.appendChild(container);
    document.getElementById('precisionCanvasContainer').appendChild(precisionCanvas);
    
    // Event listeners
    document.getElementById('precisionStartBtn').onclick = startPrecisionBite;
    document.getElementById('precisionBackBtn').onclick = exitPrecisionBite;
    
    // Keyboard controls
    document.addEventListener('keydown', handlePrecisionInput);
    
    spawnPrecisionTarget();
    drawPrecisionBite();
}

function spawnPrecisionTarget() {
    let newTarget;
    do {
        newTarget = {
            x: Math.floor(Math.random() * PRECISION_GRID_COLS),
            y: Math.floor(Math.random() * PRECISION_GRID_ROWS),
            size: 5 - (precisionLevel - 1) * 0.5, // Shrinks with level
            maxSize: 5 - (precisionLevel - 1) * 0.5,
            shrinkSpeed: 0.015 + (precisionLevel - 1) * 0.008, // Slower shrinking for smoother gameplay
            timeLeft: 5000 - (precisionLevel - 1) * 200 // Less time at higher levels
        };
    } while (precisionSnake.some(segment => segment.x === newTarget.x && segment.y === newTarget.y));
    
    precisionTarget = newTarget;
}

function handlePrecisionInput(e) {
    if (!precisionRunning) return;
    
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const wasdKeys = ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
    
    if (arrowKeys.includes(e.key) || wasdKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (precisionDy !== 1) { precisionDx = 0; precisionDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (precisionDy !== -1) { precisionDx = 0; precisionDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (precisionDx !== 1) { precisionDx = -1; precisionDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (precisionDx !== -1) { precisionDx = 1; precisionDy = 0; }
            break;
    }
}

function startPrecisionBite() {
    if (precisionDx === 0 && precisionDy === 0) {
        precisionDx = 1;
    }
    
    precisionRunning = true;
    document.getElementById('precisionStartBtn').style.display = 'none';
    
    // Get difficulty settings
    const difficulty = window.getCurrentDifficulty ? window.getCurrentDifficulty() : { minigameSpeedMultiplier: 1.0 };
    const tickInterval = Math.max(60, Math.floor(PRECISION_TICK_MS / difficulty.minigameSpeedMultiplier));
    
    const targetStartTime = Date.now();
    
    precisionLoop = setInterval(() => {
        updatePrecisionBite();
        drawPrecisionBite();
        
        // Update target
            if (precisionTarget) {
                precisionTarget.size = Math.max(0.5, precisionTarget.size - precisionTarget.shrinkSpeed);
                precisionTarget.timeLeft = Math.max(0, precisionTarget.timeLeft - tickInterval);
            
            // Target expired
            if (precisionTarget.timeLeft <= 0 || precisionTarget.size <= 0.5) {
                endPrecisionBite();
            }
        }
    }, tickInterval);
}

function updatePrecisionBite() {
    if (!precisionRunning || !precisionTarget) return;
    
    const head = {
        x: precisionSnake[0].x + precisionDx,
        y: precisionSnake[0].y + precisionDy
    };
    
    // Wall wrap-around
    if (head.x < 0) head.x = PRECISION_GRID_COLS - 1;
    if (head.x >= PRECISION_GRID_COLS) head.x = 0;
    if (head.y < 0) head.y = PRECISION_GRID_ROWS - 1;
    if (head.y >= PRECISION_GRID_ROWS) head.y = 0;
    
    // Self collision
    if (precisionSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        endPrecisionBite();
        return;
    }
    
    precisionSnake.unshift(head);
    
    // Target collision
    if (precisionTarget && 
        Math.abs(head.x - precisionTarget.x) < precisionTarget.size &&
        Math.abs(head.y - precisionTarget.y) < precisionTarget.size) {
        
        // Hit target!
        const points = Math.floor(precisionTarget.size * 10);
        precisionScore += points;
        precisionTargetsHit++;
        
        if (precisionTargetsHit % 5 === 0) {
            precisionLevel++;
            document.getElementById('precisionLevel').textContent = precisionLevel;
        }
        
        document.getElementById('precisionScore').textContent = precisionScore;
        document.getElementById('precisionTargetsHit').textContent = precisionTargetsHit;
        
        spawnPrecisionTarget();
    } else {
        precisionSnake.pop();
    }
}

function drawPrecisionBite() {
    if (!precisionCtx) return;
    
    // Clear
    precisionCtx.fillStyle = '#111';
    precisionCtx.fillRect(0, 0, precisionCanvas.width, precisionCanvas.height);
    
    // Draw grid background
    precisionCtx.strokeStyle = '#1a1a1a';
    precisionCtx.lineWidth = 1;
    for (let i = 0; i <= PRECISION_GRID_COLS; i++) {
        precisionCtx.beginPath();
        precisionCtx.moveTo(i * PRECISION_CELL_SIZE, 0);
        precisionCtx.lineTo(i * PRECISION_CELL_SIZE, precisionCanvas.height);
        precisionCtx.stroke();
    }
    for (let i = 0; i <= PRECISION_GRID_ROWS; i++) {
        precisionCtx.beginPath();
        precisionCtx.moveTo(0, i * PRECISION_CELL_SIZE);
        precisionCtx.lineTo(precisionCanvas.width, i * PRECISION_CELL_SIZE);
        precisionCtx.stroke();
    }
    
    // Draw target zone (square)
    if (precisionTarget) {
        const targetX = precisionTarget.x * PRECISION_CELL_SIZE + PRECISION_CELL_SIZE / 2;
        const targetY = precisionTarget.y * PRECISION_CELL_SIZE + PRECISION_CELL_SIZE / 2;
        const halfSize = precisionTarget.size * PRECISION_CELL_SIZE / 2;
        
        // Draw filled square
        precisionCtx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        precisionCtx.fillRect(
            targetX - halfSize,
            targetY - halfSize,
            halfSize * 2,
            halfSize * 2
        );
        
        // Draw square border
        precisionCtx.strokeStyle = '#ffd700';
        precisionCtx.lineWidth = 2;
        precisionCtx.strokeRect(
            targetX - halfSize,
            targetY - halfSize,
            halfSize * 2,
            halfSize * 2
        );
    }
    
    // Draw snake
    precisionCtx.fillStyle = '#4CAF50';
    precisionSnake.forEach((segment, index) => {
        const x = segment.x * PRECISION_CELL_SIZE + 1;
        const y = segment.y * PRECISION_CELL_SIZE + 1;
        precisionCtx.fillRect(x, y, PRECISION_CELL_SIZE - 2, PRECISION_CELL_SIZE - 2);
    });
}

function endPrecisionBite() {
    precisionRunning = false;
    if (precisionLoop) {
        clearInterval(precisionLoop);
        precisionLoop = null;
    }
    
    // Show results
    const container = document.getElementById('precisionContainer');
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
        <p style="font-size: 1.5em; margin: 20px 0;">Final Score: <strong>${precisionScore}</strong></p>
        <p>Targets Hit: <strong>${precisionTargetsHit}</strong></p>
        <p>Level Reached: <strong>${precisionLevel}</strong></p>
        <button class="btn" onclick="restartPrecisionBite()">Play Again</button>
        <button class="btn" onclick="exitPrecisionBite()" style="margin-left: 10px;">Back to Menu</button>
    `;
    container.appendChild(results);
}

function restartPrecisionBite() {
    exitPrecisionBite();
    setTimeout(() => initPrecisionBite(), 100);
}

function exitPrecisionBite() {
    precisionRunning = false;
    if (precisionLoop) {
        clearInterval(precisionLoop);
        precisionLoop = null;
    }
    
    const container = document.getElementById('precisionContainer');
    if (container) {
        container.remove();
    }
    
    document.removeEventListener('keydown', handlePrecisionInput);
}

// Export
window.initPrecisionBite = initPrecisionBite;
window.restartPrecisionBite = restartPrecisionBite;
window.exitPrecisionBite = exitPrecisionBite;

