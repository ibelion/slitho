// ==================== GAMEPAD SUPPORT ====================
// Full controller support with deadzones and direction buffering

const DEADZONE = 0.3;
const DIRECTION_BUFFER_TIME = 100; // ms

let gamepads = [];
let isGamepadConnected = false;
let gamepadIcon = null;
let lastDirectionChange = 0;
let lastDirection = { x: 0, y: 0 };
let pendingDirection = null;

// Initialize gamepad support
function initGamepad() {
    // Create gamepad connected icon
    createGamepadIcon();
    
    // Listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => {
        console.log('Gamepad connected:', e.gamepad.id);
        isGamepadConnected = true;
        updateGamepadIcon();
        gamepads = navigator.getGamepads();
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
        console.log('Gamepad disconnected:', e.gamepad.id);
        gamepads = navigator.getGamepads();
        isGamepadConnected = gamepads.some(gp => gp !== null);
        updateGamepadIcon();
    });
    
    // Poll gamepads (required for some browsers)
    startGamepadPolling();
    
    // Initial check
    checkGamepadConnection();
}

// Create gamepad icon
function createGamepadIcon() {
    gamepadIcon = document.createElement('div');
    gamepadIcon.id = 'gamepadIcon';
    gamepadIcon.className = 'gamepad-icon';
    gamepadIcon.innerHTML = '🎮';
    gamepadIcon.title = 'Gamepad Connected';
    gamepadIcon.style.display = 'none';
    document.body.appendChild(gamepadIcon);
}

// Update gamepad icon visibility
function updateGamepadIcon() {
    if (gamepadIcon) {
        gamepadIcon.style.display = isGamepadConnected ? 'block' : 'none';
    }
}

// Check for connected gamepads
function checkGamepadConnection() {
    gamepads = navigator.getGamepads();
    isGamepadConnected = Array.from(gamepads).some(gp => gp !== null);
    updateGamepadIcon();
}

// Start gamepad polling
function startGamepadPolling() {
    function pollGamepads() {
        gamepads = navigator.getGamepads();
        isGamepadConnected = Array.from(gamepads).some(gp => gp !== null);
        updateGamepadIcon();
        
        if (isGamepadConnected) {
            processGamepadInput();
        }
        
        requestAnimationFrame(pollGamepads);
    }
    
    requestAnimationFrame(pollGamepads);
}

// Process gamepad input
function processGamepadInput() {
    const gamepad = Array.from(gamepads).find(gp => gp !== null);
    if (!gamepad) return;
    
    const now = Date.now();
    
    // Left stick or D-pad for movement
    let dx = 0;
    let dy = 0;
    
    // Check D-pad (buttons 12-15 or axes 6-7)
    if (gamepad.buttons[12] && gamepad.buttons[12].pressed) dy = -1; // Up
    if (gamepad.buttons[13] && gamepad.buttons[13].pressed) dy = 1;  // Down
    if (gamepad.buttons[14] && gamepad.buttons[14].pressed) dx = -1; // Left
    if (gamepad.buttons[15] && gamepad.buttons[15].pressed) dx = 1; // Right
    
    // Check left stick (axes 0, 1)
    if (gamepad.axes.length >= 2) {
        const stickX = gamepad.axes[0];
        const stickY = gamepad.axes[1];
        
        if (Math.abs(stickX) > DEADZONE) {
            dx = stickX > 0 ? 1 : -1;
        }
        if (Math.abs(stickY) > DEADZONE) {
            dy = stickY > 0 ? 1 : -1;
        }
    }
    
    // Prevent 180° turn bug with direction buffer
    if (dx !== 0 || dy !== 0) {
        const timeSinceLastChange = now - lastDirectionChange;
        
        // Check if trying to reverse direction
        if (lastDirection.x !== 0 && dx === -lastDirection.x && dy === 0) {
            // Trying to reverse X direction
            if (timeSinceLastChange < DIRECTION_BUFFER_TIME) {
                return; // Ignore reverse input
            }
        }
        if (lastDirection.y !== 0 && dy === -lastDirection.y && dx === 0) {
            // Trying to reverse Y direction
            if (timeSinceLastChange < DIRECTION_BUFFER_TIME) {
                return; // Ignore reverse input
            }
        }
        
        // Valid direction change
        if (dx !== lastDirection.x || dy !== lastDirection.y) {
            lastDirection = { x: dx, y: dy };
            lastDirectionChange = now;
            
            // Trigger direction change in game
            if (window.Game && window.Game.changeDirection) {
                window.Game.changeDirection(dx, dy);
            } else if (window.changeDirection) {
                window.changeDirection(dx, dy);
            }
        }
    }
    
    // Button mappings
    // A button (0) = confirm
    if (gamepad.buttons[0] && gamepad.buttons[0].pressed && !gamepad.buttons[0].previousPressed) {
        handleGamepadButton('confirm');
    }
    
    // B button (1) = back/cancel
    if (gamepad.buttons[1] && gamepad.buttons[1].pressed && !gamepad.buttons[1].previousPressed) {
        handleGamepadButton('cancel');
    }
    
    // Start button (9) = pause
    if (gamepad.buttons[9] && gamepad.buttons[9].pressed && !gamepad.buttons[9].previousPressed) {
        handleGamepadButton('pause');
    }
    
    // Right shoulder (5) = toggle debug panel
    if (gamepad.buttons[5] && gamepad.buttons[5].pressed && !gamepad.buttons[5].previousPressed) {
        if (window.DebugOverlay) {
            window.DebugOverlay.toggle();
        }
    }
    
    // Left shoulder (4) = toggle profiler
    if (gamepad.buttons[4] && gamepad.buttons[4].pressed && !gamepad.buttons[4].previousPressed) {
        if (window.Profiler) {
            window.Profiler.toggle();
        }
    }
    
    // Store previous button states
    for (let i = 0; i < gamepad.buttons.length; i++) {
        if (gamepad.buttons[i]) {
            gamepad.buttons[i].previousPressed = gamepad.buttons[i].pressed;
        }
    }
}

// Handle gamepad button press
function handleGamepadButton(action) {
    switch (action) {
        case 'confirm':
            // Trigger click on focused element or default action
            const focusedElement = document.activeElement;
            if (focusedElement && (focusedElement.tagName === 'BUTTON' || focusedElement.onclick)) {
                focusedElement.click();
            }
            break;
            
        case 'cancel':
            // Close modals or go back
            const modals = document.querySelectorAll('.modal.show');
            if (modals.length > 0) {
                const lastModal = modals[modals.length - 1];
                const closeBtn = lastModal.querySelector('.modal-close, [id$="Close"]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    lastModal.classList.remove('show');
                }
            }
            break;
            
        case 'pause':
            // Toggle pause
            if (window.togglePause) {
                window.togglePause();
            }
            break;
    }
}

// Export
window.Gamepad = {
    init: initGamepad,
    isConnected: () => isGamepadConnected,
    getGamepads: () => Array.from(gamepads).filter(gp => gp !== null)
};

