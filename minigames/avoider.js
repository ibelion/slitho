// ==================== AVOIDER MINIGAME ====================
// Dodge falling obstacles

let avoiderCanvas = null;
let avoiderCtx = null;
let avoiderPlayer = { x: 200, y: 500, size: 20 };
let avoiderObstacles = [];
let avoiderScore = 0;
let avoiderTime = 0;
let avoiderRunning = false;
let avoiderLoop = null;
let avoiderDx = 0;

const AVOIDER_CANVAS_WIDTH = 400;
const AVOIDER_CANVAS_HEIGHT = 600;

function initAvoider() {
    // Create canvas
    if (!avoiderCanvas) {
        avoiderCanvas = document.createElement('canvas');
        avoiderCanvas.id = 'avoiderCanvas';
        avoiderCanvas.width = AVOIDER_CANVAS_WIDTH;
        avoiderCanvas.height = AVOIDER_CANVAS_HEIGHT;
        avoiderCanvas.style.cssText = 'border: 2px solid var(--border-color); border-radius: 10px;';
        avoiderCtx = avoiderCanvas.getContext('2d');
    }
    
    // Reset game state
    avoiderPlayer = { x: 200, y: 500, size: 20 };
    avoiderObstacles = [];
    avoiderScore = 0;
    avoiderTime = 0;
    avoiderRunning = false;
    avoiderDx = 0;
    
    // Create UI
    const container = document.createElement('div');
    container.id = 'avoiderContainer';
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
        <h1 style="color: white; font-size: 2em;">⚠️ Avoider</h1>
        <div style="color: white; font-size: 1.5em;">
            Score: <span id="avoiderScore">0</span> | 
            Time: <span id="avoiderTimer">0</span>s
        </div>
        <div id="avoiderCanvasContainer"></div>
        <div style="color: white; text-align: center;">
            <p>Dodge the falling obstacles!</p>
            <p>Use A/D or Arrow Keys to move</p>
        </div>
        <button class="btn" id="avoiderStartBtn">Start</button>
        <button class="btn" id="avoiderBackBtn">Back to Menu</button>
    `;
    
    document.body.appendChild(container);
    document.getElementById('avoiderCanvasContainer').appendChild(avoiderCanvas);
    
    // Event listeners
    document.getElementById('avoiderStartBtn').onclick = startAvoider;
    document.getElementById('avoiderBackBtn').onclick = exitAvoider;
    
    // Keyboard controls
    document.addEventListener('keydown', handleAvoiderInput);
    document.addEventListener('keyup', handleAvoiderInputUp);
    
    drawAvoider();
}

function handleAvoiderInput(e) {
    if (!avoiderRunning) return;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            avoiderDx = -5;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            avoiderDx = 5;
            break;
    }
}

function handleAvoiderInputUp(e) {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        avoiderDx = 0;
    }
}

function startAvoider() {
    avoiderRunning = true;
    document.getElementById('avoiderStartBtn').style.display = 'none';
    
    const startTime = Date.now();
    
    avoiderLoop = setInterval(() => {
        updateAvoider();
        drawAvoider();
        
        // Update timer
        avoiderTime = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('avoiderTimer').textContent = avoiderTime;
        document.getElementById('avoiderScore').textContent = avoiderScore;
        
        // Spawn obstacles
        if (Math.random() < 0.05) {
            avoiderObstacles.push({
                x: Math.random() * (AVOIDER_CANVAS_WIDTH - 30),
                y: -30,
                size: 20 + Math.random() * 20,
                speed: 2 + Math.random() * 3
            });
        }
    }, 16); // ~60 FPS
}

function updateAvoider() {
    if (!avoiderRunning) return;
    
    // Move player
    avoiderPlayer.x += avoiderDx;
    avoiderPlayer.x = Math.max(avoiderPlayer.size, Math.min(AVOIDER_CANVAS_WIDTH - avoiderPlayer.size, avoiderPlayer.x));
    
    // Update obstacles
    avoiderObstacles = avoiderObstacles.filter(obs => {
        obs.y += obs.speed;
        
        // Check collision
        const dist = Math.sqrt(
            (obs.x - avoiderPlayer.x) ** 2 + 
            (obs.y - avoiderPlayer.y) ** 2
        );
        
        if (dist < (obs.size / 2 + avoiderPlayer.size / 2)) {
            endAvoider();
            return false;
        }
        
        // Remove if off screen
        if (obs.y > AVOIDER_CANVAS_HEIGHT) {
            avoiderScore++;
            return false;
        }
        
        return true;
    });
}

function drawAvoider() {
    if (!avoiderCtx) return;
    
    // Clear
    avoiderCtx.fillStyle = '#111';
    avoiderCtx.fillRect(0, 0, avoiderCanvas.width, avoiderCanvas.height);
    
    // Draw obstacles
    avoiderCtx.fillStyle = '#f44336';
    avoiderObstacles.forEach(obs => {
        avoiderCtx.beginPath();
        avoiderCtx.arc(obs.x, obs.y, obs.size / 2, 0, Math.PI * 2);
        avoiderCtx.fill();
    });
    
    // Draw player
    avoiderCtx.fillStyle = '#4CAF50';
    avoiderCtx.beginPath();
    avoiderCtx.arc(avoiderPlayer.x, avoiderPlayer.y, avoiderPlayer.size / 2, 0, Math.PI * 2);
    avoiderCtx.fill();
}

function endAvoider() {
    avoiderRunning = false;
    if (avoiderLoop) {
        clearInterval(avoiderLoop);
        avoiderLoop = null;
    }
    
    // Show results
    const container = document.getElementById('avoiderContainer');
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
        <p style="font-size: 1.5em; margin: 20px 0;">Final Score: <strong>${avoiderScore}</strong></p>
        <p>Time Survived: <strong>${avoiderTime}</strong>s</p>
        <button class="btn" onclick="restartAvoider()">Play Again</button>
        <button class="btn" onclick="exitAvoider()" style="margin-left: 10px;">Back to Menu</button>
    `;
    container.appendChild(results);
}

function restartAvoider() {
    exitAvoider();
    setTimeout(() => initAvoider(), 100);
}

function exitAvoider() {
    avoiderRunning = false;
    if (avoiderLoop) {
        clearInterval(avoiderLoop);
        avoiderLoop = null;
    }
    
    const container = document.getElementById('avoiderContainer');
    if (container) {
        container.remove();
    }
    
    document.removeEventListener('keydown', handleAvoiderInput);
    document.removeEventListener('keyup', handleAvoiderInputUp);
}

// Export
window.initAvoider = initAvoider;
window.restartAvoider = restartAvoider;
window.exitAvoider = exitAvoider;

