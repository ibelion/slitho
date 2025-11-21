// ==================== FOOD TYPES SYSTEM ====================
// Expanded food/fruit types with different effects

const FoodTypes = {
    types: {
        NORMAL: 'normal',
        GOLDEN: 'golden',
        SPEED: 'speed',
        SLOW: 'slow',
        POISON: 'poison',
        BONUS: 'bonus',
        COMBO: 'combo',
        MYSTERY: 'mystery'
    },
    activeFood: null
};

// Food definitions
const FOOD_DEFINITIONS = {
    normal: {
        name: 'Apple',
        icon: '🍎',
        score: 1,
        color: '#ff0000',
        spawnWeight: 70
    },
    golden: {
        name: 'Golden Apple',
        icon: '🍏',
        score: 5,
        color: '#ffd700',
        spawnWeight: 5,
        effect: 'bonus_points'
    },
    speed: {
        name: 'Speed Fruit',
        icon: '⚡',
        score: 2,
        color: '#ffff00',
        spawnWeight: 8,
        effect: 'speed_boost',
        duration: 300
    },
    slow: {
        name: 'Slow Berry',
        icon: '🫐',
        score: 2,
        color: '#00aaff',
        spawnWeight: 5,
        effect: 'slow_motion',
        duration: 300
    },
    poison: {
        name: 'Poison Apple',
        icon: '🍎',
        score: -2,
        color: '#00ff00',
        spawnWeight: 2,
        effect: 'damage',
        damage: 1
    },
    bonus: {
        name: 'Bonus Fruit',
        icon: '⭐',
        score: 3,
        color: '#ff00ff',
        spawnWeight: 5,
        effect: 'bonus_points'
    },
    combo: {
        name: 'Combo Fruit',
        icon: '🔥',
        score: 1,
        color: '#ff6600',
        spawnWeight: 3,
        effect: 'combo_multiplier',
        multiplier: 2
    },
    mystery: {
        name: 'Mystery Box',
        icon: '❓',
        score: 0,
        color: '#ffffff',
        spawnWeight: 2,
        effect: 'random'
    }
};

// Get food type by weighted random
function getRandomFoodType() {
    const totalWeight = Object.values(FOOD_DEFINITIONS).reduce(
        (sum, food) => sum + food.spawnWeight, 0
    );
    
    let random = Math.random() * totalWeight;
    
    for (const [type, food] of Object.entries(FOOD_DEFINITIONS)) {
        random -= food.spawnWeight;
        if (random <= 0) {
            return type;
        }
    }
    
    return 'normal';
}

// Create food
function createFood(x, y, type = null) {
    const foodType = type || getRandomFoodType();
    const definition = FOOD_DEFINITIONS[foodType];
    
    if (!definition) {
        return createFood(x, y, 'normal');
    }
    
    return {
        x: x,
        y: y,
        type: foodType,
        name: definition.name,
        icon: definition.icon,
        score: definition.score,
        color: definition.color,
        effect: definition.effect,
        duration: definition.duration,
        damage: definition.damage,
        multiplier: definition.multiplier
    };
}

// Apply food effect
function applyFoodEffect(food, gameState) {
    if (!food.effect) return;
    
    switch (food.effect) {
        case 'bonus_points':
            // Already handled by score
            break;
            
        case 'speed_boost':
            if (window.StateManager) {
                // Increase game speed temporarily
                if (window.activeSpeedModifier) {
                    window.activeSpeedModifier = Math.min(
                        window.activeSpeedModifier * 1.2,
                        2.0
                    );
                } else {
                    window.activeSpeedModifier = 1.2;
                }
                setTimeout(() => {
                    if (window.activeSpeedModifier) {
                        window.activeSpeedModifier = Math.max(
                            window.activeSpeedModifier / 1.2,
                            1.0
                        );
                    }
                }, food.duration || 300);
            }
            break;
            
        case 'slow_motion':
            if (window.StateManager) {
                window.activeSpeedModifier = Math.max(
                    (window.activeSpeedModifier || 1.0) * 0.7,
                    0.5
                );
                setTimeout(() => {
                    if (window.activeSpeedModifier) {
                        window.activeSpeedModifier = Math.min(
                            window.activeSpeedModifier / 0.7,
                            1.0
                        );
                    }
                }, food.duration || 300);
            }
            break;
            
        case 'damage':
            if (window.HitFeedback) {
                window.HitFeedback.trigger('damage', 1.0);
            }
            if (window.StateManager) {
                // Apply damage (if health system exists)
                if (window.takeDamage) {
                    window.takeDamage(food.damage || 1);
                }
            }
            break;
            
        case 'combo_multiplier':
            if (window.StateManager) {
                const state = window.StateManager;
                const currentMultiplier = state.getComboMultiplier() || 1;
                state.setComboMultiplier(currentMultiplier * (food.multiplier || 2));
            }
            break;
            
        case 'random':
            // Random effect
            const effects = ['bonus_points', 'speed_boost', 'slow_motion', 'combo_multiplier'];
            const randomEffect = effects[Math.floor(Math.random() * effects.length)];
            food.effect = randomEffect;
            applyFoodEffect(food, gameState);
            break;
    }
}

// Draw food
function drawFood(ctx, food, CELL_SIZE) {
    if (!food) return;
    
    const x = food.x * CELL_SIZE;
    const y = food.y * CELL_SIZE;
    
    ctx.save();
    
    // Draw glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = food.color;
    
    // Draw food
    ctx.fillStyle = food.color;
    ctx.font = `${CELL_SIZE * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.icon, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    
    // Draw special indicator
    if (food.effect && food.effect !== 'bonus_points') {
        ctx.strokeStyle = food.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
    
    ctx.restore();
}

// Export
window.FoodTypes = {
    ...FoodTypes,
    create: createFood,
    applyEffect: applyFoodEffect,
    draw: drawFood,
    getRandomType: getRandomFoodType,
    definitions: FOOD_DEFINITIONS
};

