// ==================== HAZARDS SYSTEM ====================
// New hazard types and mechanics

const Hazards = {
    types: {
        SPIKE: 'spike',
        FIRE: 'fire',
        ICE: 'ice',
        ELECTRIC: 'electric',
        POISON: 'poison',
        MOVING_BLOCK: 'moving_block',
        TELEPORT: 'teleport'
    },
    activeHazards: []
};

// Create spike hazard
function createSpikeHazard(x, y) {
    return {
        type: Hazards.types.SPIKE,
        x: x,
        y: y,
        damage: 1,
        active: true
    };
}

// Create fire hazard
function createFireHazard(x, y, radius = 1) {
    return {
        type: Hazards.types.FIRE,
        x: x,
        y: y,
        radius: radius,
        damage: 1,
        active: true,
        animationFrame: 0
    };
}

// Create ice hazard
function createIceHazard(x, y) {
    return {
        type: Hazards.types.ICE,
        x: x,
        y: y,
        slowFactor: 0.5, // 50% speed reduction
        active: true
    };
}

// Create electric hazard
function createElectricHazard(x, y, chainRadius = 2) {
    return {
        type: Hazards.types.ELECTRIC,
        x: x,
        y: y,
        chainRadius: chainRadius,
        damage: 1,
        active: true,
        cooldown: 0
    };
}

// Create poison hazard
function createPoisonHazard(x, y, duration = 300) {
    return {
        type: Hazards.types.POISON,
        x: x,
        y: y,
        damage: 0.5, // Damage per tick
        duration: duration,
        active: true
    };
}

// Create moving block hazard
function createMovingBlockHazard(x, y, path, speed = 1) {
    return {
        type: Hazards.types.MOVING_BLOCK,
        x: x,
        y: y,
        path: path, // Array of {x, y} positions
        pathIndex: 0,
        speed: speed,
        damage: 1,
        active: true
    };
}

// Create teleport hazard
function createTeleportHazard(x, y, targetX, targetY) {
    return {
        type: Hazards.types.TELEPORT,
        x: x,
        y: y,
        targetX: targetX,
        targetY: targetY,
        active: true
    };
}

// Update hazards
function updateHazards(deltaTime = 1) {
    for (const hazard of Hazards.activeHazards) {
        if (!hazard.active) continue;
        
        switch (hazard.type) {
            case Hazards.types.FIRE:
                hazard.animationFrame = (hazard.animationFrame + 1) % 60;
                break;
                
            case Hazards.types.MOVING_BLOCK:
                if (hazard.path && hazard.path.length > 0) {
                    const target = hazard.path[hazard.pathIndex];
                    const dx = target.x - hazard.x;
                    const dy = target.y - hazard.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 0.1) {
                        hazard.pathIndex = (hazard.pathIndex + 1) % hazard.path.length;
                    } else {
                        hazard.x += (dx / dist) * hazard.speed * deltaTime;
                        hazard.y += (dy / dist) * hazard.speed * deltaTime;
                    }
                }
                break;
                
            case Hazards.types.ELECTRIC:
                if (hazard.cooldown > 0) {
                    hazard.cooldown -= deltaTime;
                }
                break;
        }
    }
}

// Check collision with hazard
function checkHazardCollision(x, y) {
    for (const hazard of Hazards.activeHazards) {
        if (!hazard.active) continue;
        
        switch (hazard.type) {
            case Hazards.types.SPIKE:
                if (hazard.x === Math.floor(x) && hazard.y === Math.floor(y)) {
                    return { type: hazard.type, damage: hazard.damage, hazard };
                }
                break;
                
            case Hazards.types.FIRE:
                const dist = Math.sqrt(
                    Math.pow(x - hazard.x, 2) + Math.pow(y - hazard.y, 2)
                );
                if (dist <= hazard.radius) {
                    return { type: hazard.type, damage: hazard.damage, hazard };
                }
                break;
                
            case Hazards.types.ICE:
                if (hazard.x === Math.floor(x) && hazard.y === Math.floor(y)) {
                    return { type: hazard.type, slowFactor: hazard.slowFactor, hazard };
                }
                break;
                
            case Hazards.types.ELECTRIC:
                if (hazard.cooldown <= 0 && 
                    hazard.x === Math.floor(x) && hazard.y === Math.floor(y)) {
                    hazard.cooldown = 120; // 2 second cooldown
                    return { type: hazard.type, damage: hazard.damage, hazard };
                }
                break;
                
            case Hazards.types.POISON:
                if (hazard.x === Math.floor(x) && hazard.y === Math.floor(y)) {
                    return { type: hazard.type, damage: hazard.damage, duration: hazard.duration, hazard };
                }
                break;
                
            case Hazards.types.MOVING_BLOCK:
                if (Math.floor(hazard.x) === Math.floor(x) && 
                    Math.floor(hazard.y) === Math.floor(y)) {
                    return { type: hazard.type, damage: hazard.damage, hazard };
                }
                break;
                
            case Hazards.types.TELEPORT:
                if (hazard.x === Math.floor(x) && hazard.y === Math.floor(y)) {
                    return { 
                        type: hazard.type, 
                        targetX: hazard.targetX, 
                        targetY: hazard.targetY, 
                        hazard 
                    };
                }
                break;
        }
    }
    
    return null;
}

// Draw hazards
function drawHazards(ctx, CELL_SIZE) {
    for (const hazard of Hazards.activeHazards) {
        if (!hazard.active) continue;
        
        const x = hazard.x * CELL_SIZE;
        const y = hazard.y * CELL_SIZE;
        
        ctx.save();
        
        switch (hazard.type) {
            case Hazards.types.SPIKE:
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(x + CELL_SIZE / 2, y);
                ctx.lineTo(x, y + CELL_SIZE);
                ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
                ctx.closePath();
                ctx.fill();
                break;
                
            case Hazards.types.FIRE:
                const alpha = 0.5 + Math.sin(hazard.animationFrame * 0.1) * 0.3;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = `hsl(${20 + hazard.animationFrame}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 
                       hazard.radius * CELL_SIZE, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case Hazards.types.ICE:
                ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#00aaff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                break;
                
            case Hazards.types.ELECTRIC:
                if (hazard.cooldown <= 0) {
                    ctx.fillStyle = '#ffff00';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                    // Draw lightning effect
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + CELL_SIZE / 2, y);
                    ctx.lineTo(x + CELL_SIZE / 4, y + CELL_SIZE / 2);
                    ctx.lineTo(x + CELL_SIZE * 3 / 4, y + CELL_SIZE / 2);
                    ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE);
                    ctx.stroke();
                }
                break;
                
            case Hazards.types.POISON:
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                break;
                
            case Hazards.types.MOVING_BLOCK:
                ctx.fillStyle = '#666';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                break;
                
            case Hazards.types.TELEPORT:
                ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                break;
        }
        
        ctx.restore();
    }
}

// Clear all hazards
function clearHazards() {
    Hazards.activeHazards = [];
}

// Add hazard
function addHazard(hazard) {
    Hazards.activeHazards.push(hazard);
}

// Export
window.Hazards = {
    ...Hazards,
    createSpike: createSpikeHazard,
    createFire: createFireHazard,
    createIce: createIceHazard,
    createElectric: createElectricHazard,
    createPoison: createPoisonHazard,
    createMovingBlock: createMovingBlockHazard,
    createTeleport: createTeleportHazard,
    update: updateHazards,
    checkCollision: checkHazardCollision,
    draw: drawHazards,
    clear: clearHazards,
    add: addHazard
};

