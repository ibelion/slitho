// ==================== RENDERER ====================
// Pure rendering code - no gameplay logic
// Handles all drawing operations with interpolation support

// Canvas references (set by init)
let canvas = null;
let ctx = null;
let particleCanvas = null;
let particleCtx = null;

// Grid constants (set by init)
let GRID_COLS = 20;
let GRID_ROWS = 20;
let CELL_SIZE = 20;

// Interpolation state (reused objects to avoid allocations)
let interpolationState = {
    snake: [],
    food: { x: 0, y: 0 },
    cameraShakeX: 0,
    cameraShakeY: 0
};

// Reusable objects for interpolation (pool to avoid allocations)
const interpolationPool = {
    snakeSegments: [], // Pool of {x, y} objects
    maxSnakeLength: 0
};

// Initialize renderer
function initRenderer(gameCanvas, gameCtx, particleCanvasEl, particleCtxEl, cols, rows, cellSize) {
    canvas = gameCanvas;
    ctx = gameCtx;
    particleCanvas = particleCanvasEl;
    particleCtx = particleCtxEl;
    GRID_COLS = cols;
    GRID_ROWS = rows;
    CELL_SIZE = cellSize;
    
    // Set canvas resolution (optimized for mobile: handle devicePixelRatio)
    if (canvas) {
        const baseWidth = GRID_COLS * CELL_SIZE;
        const baseHeight = GRID_ROWS * CELL_SIZE;
        
        // Handle high-DPI displays (optimize for mobile)
        const dpr = window.devicePixelRatio || 1;
        const isMobile = /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // On mobile, cap DPR to 2 to reduce memory usage
        const effectiveDPR = isMobile ? Math.min(dpr, 2) : dpr;
        
        canvas.width = baseWidth * effectiveDPR;
        canvas.height = baseHeight * effectiveDPR;
        
        // Scale context to match DPR
        if (ctx) {
            ctx.scale(effectiveDPR, effectiveDPR);
        }
        
        // Set CSS size to logical size
        canvas.style.width = baseWidth + 'px';
        canvas.style.height = baseHeight + 'px';
    }
}

// Update interpolation state (called before render)
function updateInterpolationState(interpolation, currentState, previousState) {
    if (interpolation <= 0 || !previousState || !currentState) {
        // No interpolation - use current state
        interpolationState.snake = currentState.snake || [];
        interpolationState.food = currentState.food || { x: 0, y: 0 };
        interpolationState.cameraShakeX = currentState.cameraShakeX || 0;
        interpolationState.cameraShakeY = currentState.cameraShakeY || 0;
        return;
    }
    
    // Linear interpolation between previous and current
    // Reuse objects to avoid allocations
    const prevSnake = previousState.snake || [];
    const currSnake = currentState.snake || [];
    const snakeLength = currSnake.length;
    
    // Ensure pool has enough segments
    if (interpolationPool.maxSnakeLength < snakeLength) {
        for (let i = interpolationPool.maxSnakeLength; i < snakeLength; i++) {
            interpolationPool.snakeSegments.push({ x: 0, y: 0 });
        }
        interpolationPool.maxSnakeLength = snakeLength;
    }
    
    // Reuse array (clear and reuse)
    interpolationState.snake.length = 0;
    
    // Reuse objects from pool
    for (let i = 0; i < snakeLength; i++) {
        const prev = prevSnake[i] || currSnake[i];
        const curr = currSnake[i];
        const segment = interpolationPool.snakeSegments[i];
        segment.x = prev.x + (curr.x - prev.x) * interpolation;
        segment.y = prev.y + (curr.y - prev.y) * interpolation;
        interpolationState.snake.push(segment);
    }
    
    // Interpolate food (reuse object)
    const prevFood = previousState.food || currentState.food;
    const currFood = currentState.food || { x: 0, y: 0 };
    interpolationState.food.x = prevFood.x + (currFood.x - prevFood.x) * interpolation;
    interpolationState.food.y = prevFood.y + (currFood.y - prevFood.y) * interpolation;
    
    // Interpolate camera shake
    interpolationState.cameraShakeX = (previousState.cameraShakeX || 0) + 
        ((currentState.cameraShakeX || 0) - (previousState.cameraShakeX || 0)) * interpolation;
    interpolationState.cameraShakeY = (previousState.cameraShakeY || 0) + 
        ((currentState.cameraShakeY || 0) - (previousState.cameraShakeY || 0)) * interpolation;
}

// Track last frame time for camera shake
let lastRenderTime = null;

// Render cache for optimization
let renderCache = {
    grid: null,
    background: null,
    lastTheme: null
};

// Main render function (optimized with error handling)
function render(interpolation, gameState, previousState, themeColors, getSnakeColor, getFoodColor) {
    if (!ctx || !canvas) return;
    
    // Validate inputs
    if (!gameState) {
        if (window.DebugTools && window.DebugTools.isEnabled()) {
            console.warn('Render called with invalid gameState');
        }
        return;
    }
    
    const renderStart = performance.now();
    
    // Update camera shake (use actual delta time)
    if (window.CameraShake) {
        const now = performance.now();
        const deltaTime = lastRenderTime ? (now - lastRenderTime) : 16.666;
        lastRenderTime = now;
        window.CameraShake.update(deltaTime);
        const shakeOffset = window.CameraShake.getOffset();
        interpolationState.cameraShakeX = shakeOffset.x;
        interpolationState.cameraShakeY = shakeOffset.y;
    }
    
    // Update interpolation state
    updateInterpolationState(interpolation, gameState, previousState);
    
    const colors = themeColors || { bg: '#111', glow: 'rgba(76, 175, 80, 0.5)' };
    
    // Cache background if theme hasn't changed
    if (renderCache.lastTheme !== colors.bg) {
        renderCache.background = null;
        renderCache.lastTheme = colors.bg;
    }
    
    // Clear canvas (optimized: use fillRect instead of clearRect)
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    // Apply camera shake
    ctx.translate(interpolationState.cameraShakeX, interpolationState.cameraShakeY);
    
    // Render global modifiers (fog, night mode)
    if (window.GlobalModifiers) {
        window.GlobalModifiers.renderFog(ctx, canvas);
        window.GlobalModifiers.renderNightMode(ctx, canvas);
    }
    
    // Draw grid (if needed - can be cached)
    // drawGrid();
    
    // Draw portals (if any)
    if (gameState.portals && gameState.portalsActive) {
        drawPortals(gameState.portals);
    }
    
    // Draw terrain tiles
    if (gameState.terrainTiles && gameState.terrainTiles.length > 0) {
        drawTerrainTiles(gameState.terrainTiles);
    }
    
    // Draw hazard tiles
    if (gameState.hazardTiles && gameState.hazardTiles.length > 0) {
        drawHazardTiles(gameState.hazardTiles);
    }
    
    // Draw zoom hazard
    if (gameState.zoomHazard) {
        drawZoomHazard(gameState.zoomHazard);
    }
    
    // Draw snake (use animator if available)
    if (window.SnakeAnimator && window.SnakeAnimator.draw) {
        window.SnakeAnimator.draw(ctx, interpolationState.snake, gameState.dx, gameState.dy, interpolation, CELL_SIZE, getSnakeColor);
    } else {
        drawSnake(interpolationState.snake, gameState.dx, gameState.dy, getSnakeColor, gameState.isGhostMode);
    }
    
    // Draw multiplayer snakes (local or online) - optimized with for loops
    if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
        const mpState = window.LocalMultiplayer.getGameState();
        if (mpState && mpState.players) {
            const players = mpState.players;
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                if (player.alive) {
                    drawSnake(player.snake, 0, 0, () => player.color, false);
                }
            }
        }
    }
    
    if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
        const matchState = window.MultiplayerController.getMatchState();
        if (matchState && matchState.gameState && matchState.gameState.players) {
            const players = matchState.gameState.players;
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                if (player.alive) {
                    drawSnake(player.snake, player.dx, player.dy, () => player.color, false);
                }
            }
        }
    }
    
    // Draw ghost replay if enabled
    const showGhost = localStorage.getItem('showGhostReplay') === 'true';
    if (showGhost && window.GhostReplay && window.GhostReplay.getState().playing) {
        const currentLevel = gameState.currentLevel || 1;
        const currentTime = window.Progression ? window.Progression.getCurrentLevelTime() : 0;
        const ghostData = window.GhostReplay.updatePlayback(currentTime);
        if (ghostData) {
            drawGhostSnake(ghostData, getSnakeColor);
        }
    }
    
    // Draw food
    drawFood(interpolationState.food, getFoodColor);
    
    // Draw multiplayer food
    if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
        const mpState = window.LocalMultiplayer.getGameState();
        if (mpState) {
            if (mpState.sharedFood) {
                drawFood(mpState.sharedFood, getFoodColor);
            } else {
                const players = mpState.players;
                if (players) {
                    for (let i = 0; i < players.length; i++) {
                        const player = players[i];
                        if (player.food) {
                            drawFood(player.food, getFoodColor);
                        }
                    }
                }
            }
        }
    }
    
    if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
        const matchState = window.MultiplayerController.getMatchState();
        if (matchState && matchState.gameState && matchState.gameState.food) {
            drawFood(matchState.gameState.food, getFoodColor);
        }
    }
    
        // Draw boss (legacy boss fruit)
        if (gameState.currentBoss) {
            drawBoss(gameState.currentBoss, gameState.bossProjectiles);
        }
        
        // Draw boss AI bosses (Phase 9) - optimized with for loop
        if (window.BossAI) {
            const bosses = window.BossAI.getAllBosses();
            if (bosses && bosses.length > 0) {
                for (let i = 0; i < bosses.length; i++) {
                    drawBossAI(bosses[i]);
                }
            }
        }
    
    // Draw particles (optimized: use particle system if available)
    if (window.ParticleSystem) {
        window.ParticleSystem.draw(ctx);
    } else if (gameState.particles && gameState.particles.length > 0) {
        drawParticles(gameState.particles);
    }
    
    // Draw hazards
    if (window.Hazards) {
        window.Hazards.draw(ctx, CELL_SIZE);
    }
    
    ctx.restore();
    
    // Performance tracking
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16.67 && window.DebugTools && window.DebugTools.isEnabled()) {
        // Frame took longer than 60fps target (only log in debug mode)
        console.warn(`Slow frame: ${renderTime.toFixed(2)}ms`);
    }
}

// Draw snake with smooth interpolation (optimized: use for loop, batch operations)
function drawSnake(snake, dx, dy, getSnakeColor, isGhostMode) {
    if (!snake || snake.length === 0) return;
    
    const snakeColor = getSnakeColor ? getSnakeColor() : '#4CAF50';
    const size = CELL_SIZE - 2;
    const offset = 1;
    
    // Draw body segments first (if ghost mode, they have different alpha)
    if (isGhostMode) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = snakeColor;
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            const x = segment.x * CELL_SIZE + offset;
            const y = segment.y * CELL_SIZE + offset;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1.0;
    } else {
        ctx.fillStyle = snakeColor;
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            const x = segment.x * CELL_SIZE + offset;
            const y = segment.y * CELL_SIZE + offset;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    // Draw head
    if (snake.length > 0) {
        const head = snake[0];
        const x = head.x * CELL_SIZE + offset;
        const y = head.y * CELL_SIZE + offset;
        
        ctx.fillStyle = snakeColor;
        ctx.fillRect(x, y, size, size);
        
        // Draw eyes
        ctx.fillStyle = 'black';
        const eyeSize = size / 5;
        const eyeOffset = size / 4;
        
        let eye1X, eye1Y, eye2X, eye2Y;
        if (dx > 0) {
            eye1X = x + size - eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else if (dx < 0) {
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else if (dy > 0) {
            eye1X = x + eyeOffset;
            eye1Y = y + size - eyeOffset - eyeSize;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else {
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset;
        }
        
        ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
    }
}

// Draw food
function drawFood(food, getFoodColor) {
    if (!food) return;
    
    const foodColor = getFoodColor ? getFoodColor() : '#ff6b6b';
    const foodX = food.x * CELL_SIZE + 1;
    const foodY = food.y * CELL_SIZE + 1;
    const foodSize = CELL_SIZE - 2;
    
    ctx.fillStyle = foodColor;
    ctx.fillRect(foodX, foodY, foodSize, foodSize);
}

// Draw portals (optimized: set styles once)
function drawPortals(portals) {
    if (!portals || !portals.a || !portals.b) return;
    
    ctx.fillStyle = '#8a2be2';
    ctx.globalAlpha = 0.7;
    const center = CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;
    
    const portalA = portals.a;
    const xA = portalA.x * CELL_SIZE + center;
    const yA = portalA.y * CELL_SIZE + center;
    ctx.beginPath();
    ctx.arc(xA, yA, radius, 0, Math.PI * 2);
    ctx.fill();
    
    const portalB = portals.b;
    const xB = portalB.x * CELL_SIZE + center;
    const yB = portalB.y * CELL_SIZE + center;
    ctx.beginPath();
    ctx.arc(xB, yB, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
}

// Draw terrain tiles (optimized: use for loop, batch by color)
function drawTerrainTiles(tiles) {
    if (!tiles || tiles.length === 0) return;
    
    // Batch by color to reduce state changes
    const tileSize = CELL_SIZE - 2;
    const offset = 1;
    
    // Draw all tiles of same type together
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (!tile || tile.type === 'EMPTY') continue;
        
        const tileX = tile.x * CELL_SIZE + offset;
        const tileY = tile.y * CELL_SIZE + offset;
        let color = '#333';
        
        if (tile.type === 'WALL') color = '#666';
        else if (tile.type === 'SLOW_ZONE') color = '#0066ff';
        else if (tile.type === 'BOUNCE_TILE') color = '#ffaa00';
        else if (tile.type === 'HAZARD_TILE') color = '#ff0000';
        
        ctx.fillStyle = color;
        if (tile.type === 'SLOW_ZONE') {
            ctx.globalAlpha = 0.5;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
        }
    }
}

// Draw hazard tiles (optimized: batch operations)
function drawHazardTiles(tiles) {
    if (!tiles || tiles.length === 0) return;
    
    // Set styles once
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    
    // Draw all tiles
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const tileX = tile.x * CELL_SIZE;
        const tileY = tile.y * CELL_SIZE;
        ctx.fillRect(tileX, tileY, CELL_SIZE, CELL_SIZE);
        ctx.strokeRect(tileX - 1, tileY - 1, CELL_SIZE, CELL_SIZE);
    }
    
    ctx.globalAlpha = 1.0;
}

// Draw zoom hazard
function drawZoomHazard(hazard) {
    if (!hazard) return;
    const hazardX = hazard.x * CELL_SIZE;
    const hazardY = hazard.y * CELL_SIZE;
    ctx.fillStyle = '#ffaa00';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(hazardX, hazardY, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hazardX - 1, hazardY - 1, CELL_SIZE, CELL_SIZE);
    ctx.globalAlpha = 1.0;
}

// Draw boss (legacy boss fruit)
function drawBoss(boss, projectiles) {
    if (!boss) return;
    const bossX = boss.x * CELL_SIZE + 1;
    const bossY = boss.y * CELL_SIZE + 1;
    ctx.fillStyle = boss.color || '#ff0000';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(bossX, bossY, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bossX, bossY, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.globalAlpha = 1.0;
    
        // Draw projectiles (optimized: set color once)
        if (projectiles && projectiles.length > 0) {
            ctx.fillStyle = boss.color || '#ff0000';
            const projSize = CELL_SIZE / 2;
            for (let i = 0; i < projectiles.length; i++) {
                const proj = projectiles[i];
                ctx.fillRect(proj.x * CELL_SIZE, proj.y * CELL_SIZE, projSize, projSize);
            }
        }
}

// Draw particles (optimized: use for loop)
function drawParticles(particles) {
    if (!particles || particles.length === 0) return;
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (particle && particle.draw) {
            particle.draw(ctx);
        }
    }
}

// Draw ghost snake (faded)
function drawGhostSnake(ghostData, getSnakeColor) {
    if (!ghostData) return;
    
    const ghostColor = getSnakeColor ? getSnakeColor() : '#4CAF50';
    const x = ghostData.x * CELL_SIZE + 1;
    const y = ghostData.y * CELL_SIZE + 1;
    const size = CELL_SIZE - 2;
    
    ctx.save();
    ctx.globalAlpha = 0.4; // Faded appearance
    ctx.fillStyle = ghostColor;
    ctx.fillRect(x, y, size, size);
    
    // Draw direction indicator
    if (ghostData.dx !== 0 || ghostData.dy !== 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;
        const eyeSize = size / 5;
        const eyeOffset = size / 4;
        
        let eye1X, eye1Y, eye2X, eye2Y;
        if (ghostData.dx > 0) {
            eye1X = x + size - eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else if (ghostData.dx < 0) {
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else if (ghostData.dy > 0) {
            eye1X = x + eyeOffset;
            eye1Y = y + size - eyeOffset - eyeSize;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
        } else {
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset;
        }
        
        ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
    }
    
    ctx.restore();
}

// Draw boss AI boss (Phase 9)
function drawBossAI(boss) {
    if (!boss || !ctx) return;
    
    const x = boss.x * CELL_SIZE + CELL_SIZE / 2;
    const y = boss.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = boss.size * CELL_SIZE / 2;
    
    ctx.save();
    
    // Draw boss body
    ctx.fillStyle = boss.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = boss.borderColor || '#880000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw health bar
    const healthPercent = boss.health / boss.maxHealth;
    const barWidth = radius * 2;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - radius - 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#ffaa00' : '#ff0000');
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Draw telegraph indicator
    if (boss.telegraphIndicator) {
        ctx.strokeStyle = boss.telegraphIndicator.color || '#ff0000';
        ctx.globalAlpha = boss.telegraphIndicator.opacity || 0.5;
        ctx.lineWidth = boss.telegraphIndicator.width || 2;
        
        switch (boss.telegraphIndicator.type) {
            case 'arrow':
                // Draw arrow from boss to target
                const from = boss.telegraphIndicator.from;
                const to = boss.telegraphIndicator.to;
                ctx.beginPath();
                ctx.moveTo(from.x * CELL_SIZE + CELL_SIZE / 2, from.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.lineTo(to.x * CELL_SIZE + CELL_SIZE / 2, to.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.stroke();
                break;
                
            case 'line':
                // Draw line
                const lineFrom = boss.telegraphIndicator.from;
                const lineTo = boss.telegraphIndicator.to;
                ctx.beginPath();
                ctx.moveTo(lineFrom.x * CELL_SIZE + CELL_SIZE / 2, lineFrom.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.lineTo(lineTo.x * CELL_SIZE + CELL_SIZE / 2, lineTo.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.stroke();
                break;
                
            case 'circle':
                // Draw circle
                const center = boss.telegraphIndicator.center;
                const circleRadius = boss.telegraphIndicator.radius * CELL_SIZE;
                ctx.beginPath();
                ctx.arc(center.x * CELL_SIZE + CELL_SIZE / 2, center.y * CELL_SIZE + CELL_SIZE / 2, circleRadius, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'marker':
                // Draw marker
                const pos = boss.telegraphIndicator.position;
                ctx.fillStyle = boss.telegraphIndicator.color || '#ff00ff';
                ctx.beginPath();
                ctx.arc(pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE + CELL_SIZE / 2, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
}

// Public API
const Renderer = {
    init: initRenderer,
    render,
    updateInterpolationState
};

// Export
window.Renderer = Renderer;

