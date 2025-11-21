// ==================== ITEM EFFECTS SYSTEM ====================
// Applies item effects to gameplay mechanics

let dashCooldown = 0;
let dashLastUsed = 0;
let shieldUsed = false;

// Apply item effects to game initialization
function applyItemEffectsToInit() {
    shieldUsed = false;
    dashCooldown = 0;
    dashLastUsed = 0;
    
    // Apply start length modifier
    if (window.activeItemEffects && window.activeItemEffects.startLength && window.snake) {
        const lengthMod = window.activeItemEffects.startLength;
        if (lengthMod > 0) {
            // Extend snake
            for (let i = 0; i < lengthMod; i++) {
                if (window.snake.length > 0) {
                    const last = window.snake[window.snake.length - 1];
                    window.snake.push({ x: last.x, y: last.y });
                }
            }
        } else if (lengthMod < 0) {
            // Shorten snake (challenge)
            const shortenBy = Math.abs(lengthMod);
            for (let i = 0; i < shortenBy && window.snake.length > 1; i++) {
                window.snake.pop();
            }
        }
    }
}

// Apply speed multiplier
function getSpeedMultiplier() {
    if (window.activeItemEffects && window.activeItemEffects.speedMultiplier) {
        return window.activeItemEffects.speedMultiplier;
    }
    return 1.0;
}

// Apply fruit multiplier
function getFruitMultiplier() {
    if (window.activeItemEffects && window.activeItemEffects.fruitMultiplier) {
        return window.activeItemEffects.fruitMultiplier;
    }
    return 1.0;
}

// Check auto-bite (expanded collision radius)
function checkAutoBite(head, food) {
    if (!window.activeItemEffects || !window.activeItemEffects.autoBiteRadius) {
        return false;
    }
    
    const radius = window.activeItemEffects.autoBiteRadius;
    // Use Manhattan distance for grid-based collision
    const dist = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
    return dist <= radius;
}

// Apply magnet effect (pull food toward snake)
function applyMagnetEffect(food, snakeHead) {
    if (!window.activeItemEffects || !window.activeItemEffects.magnetRadius) {
        return food;
    }
    
    const radius = window.activeItemEffects.magnetRadius;
    const strength = window.activeItemEffects.magnetStrength || 0.3;
    
    const dx = snakeHead.x - food.x;
    const dy = snakeHead.y - food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0 && dist <= radius) {
        // Pull food toward snake
        const pullX = (dx / dist) * strength;
        const pullY = (dy / dist) * strength;
        
        return {
            x: food.x + pullX,
            y: food.y + pullY
        };
    }
    
    return food;
}

// Check shield (prevent first death)
function checkShield() {
    if (shieldUsed) return false;
    
    if (window.activeItemEffects && window.activeItemEffects.shield > 0) {
        shieldUsed = true;
        window.activeItemEffects.shield--;
        
        // Show shield effect
        showShieldEffect();
        return true;
    }
    
    return false;
}

function showShieldEffect() {
    // Visual feedback for shield activation
    if (!window.snake || !window.snake[0]) return;
    
    const head = window.snake[0];
    if (head && window.createParticleBurst && window.CELL_SIZE) {
        window.createParticleBurst(
            head.x * window.CELL_SIZE + window.CELL_SIZE / 2,
            head.y * window.CELL_SIZE + window.CELL_SIZE / 2,
            '#2196f3',
            20,
            { speed: 3, size: 4 }
        );
    }
}

// Check dash ability
function canDash() {
    if (!window.activeItemEffects || !window.activeItemEffects.dashCooldown) {
        return false;
    }
    
    const now = Date.now();
    return (now - dashLastUsed) >= window.activeItemEffects.dashCooldown;
}

function useDash() {
    if (!canDash()) return false;
    
    dashLastUsed = Date.now();
    
    // Get snake and direction from global scope
    if (!window.snake || !window.snake[0] || typeof window.dx === 'undefined' || typeof window.dy === 'undefined') {
        return false;
    }
    
    const dx = window.dx;
    const dy = window.dy;
    
    // Apply dash movement
    if (dx !== 0 || dy !== 0) {
        const dashDistance = window.activeItemEffects.dashDistance || 3;
        let currentHead = window.snake[0];
        const GRID_COLS = window.GRID_COLS || 20;
        const GRID_ROWS = window.GRID_ROWS || 20;
        
        for (let i = 0; i < dashDistance; i++) {
            const newHead = {
                x: currentHead.x + dx,
                y: currentHead.y + dy
            };
            
            // Wrap around walls
            if (newHead.x < 0) newHead.x = GRID_COLS - 1;
            if (newHead.x >= GRID_COLS) newHead.x = 0;
            if (newHead.y < 0) newHead.y = GRID_ROWS - 1;
            if (newHead.y >= GRID_ROWS) newHead.y = 0;
            
            window.snake.unshift(newHead);
            currentHead = newHead;
        }
        
        // Visual effect
        if (window.createParticleBurst && window.CELL_SIZE) {
            window.createParticleBurst(
                currentHead.x * window.CELL_SIZE + window.CELL_SIZE / 2,
                currentHead.y * window.CELL_SIZE + window.CELL_SIZE / 2,
                '#00bcd4',
                15,
                { speed: 5, size: 3 }
            );
        }
        
        return true;
    }
    
    return false;
}

// Apply path clearer (remove obstacles)
function applyPathClearer(x, y) {
    if (!window.activeItemEffects || !window.activeItemEffects.clearRadius) {
        return;
    }
    
    const radius = window.activeItemEffects.clearRadius;
    
    // Clear terrain tiles in radius (access from global scope)
    if (window.terrainTiles && window.terrainTiles.length > 0) {
        const TERRAIN_TYPES = window.TERRAIN_TYPES || { WALL: 1 };
        window.terrainTiles = window.terrainTiles.filter(tile => {
            const dist = Math.sqrt((tile.x - x) ** 2 + (tile.y - y) ** 2);
            if (dist <= radius && tile.type === TERRAIN_TYPES.WALL) {
                // Remove wall
                return false;
            }
            return true;
        });
    }
    
    // Clear hazard tiles in radius
    if (window.hazardTiles && window.hazardTiles.length > 0) {
        window.hazardTiles = window.hazardTiles.filter(tile => {
            const dist = Math.sqrt((tile.x - x) ** 2 + (tile.y - y) ** 2);
            return dist > radius;
        });
    }
}

// Update dash cooldown display
function updateDashCooldownDisplay() {
    if (!window.activeItemEffects || !window.activeItemEffects.dashCooldown) {
        return;
    }
    
    const now = Date.now();
    const remaining = Math.max(0, window.activeItemEffects.dashCooldown - (now - dashLastUsed));
    const percent = (remaining / window.activeItemEffects.dashCooldown) * 100;
    
    // Could update a UI element here if needed
}

// Export
window.applyItemEffectsToInit = applyItemEffectsToInit;
window.getSpeedMultiplier = getSpeedMultiplier;
window.getFruitMultiplier = getFruitMultiplier;
window.checkAutoBite = checkAutoBite;
window.applyMagnetEffect = applyMagnetEffect;
window.checkShield = checkShield;
window.canDash = canDash;
window.useDash = useDash;
window.applyPathClearer = applyPathClearer;
window.updateDashCooldownDisplay = updateDashCooldownDisplay;

