// ==================== SKILL TREE SYSTEM ====================
// Passive upgrades unlocked via level progression and skill points
// BALANCE PHILOSOPHY:
// - Speed increases are capped at small fractional multipliers (max 15% total)
// - Skills unlock based on level milestones and S-rank achievements
// - Skill points scale with difficulty (1 SP per S-rank, 0.5 per A-rank)
// - Dash/burst abilities have cooldowns based on ticks (not time) for consistency
// - Food multipliers are modest (max 1.5x) to prevent score inflation
// - All skills are optional - game is beatable without any upgrades

const SAVE_VERSION = 1;

// Get balance config (loads from config/balance.js)
const getBalanceConfig = () => {
    return window.BalanceConfig || {
        skillTree: {
            speedMultiplier: { min: 1.0, max: 1.15, step1: 1.05, step2: 1.10 },
            foodMultiplier: { min: 1.0, max: 1.5, default: 1.5 },
            dash: { cooldown: 480, distance: 2, maxCooldown: 240, maxDistance: 3 },
            costs: { speed_boost_1: 2, speed_boost_2: 5, food_magnet: 3, retry_heart: 4, dash_ability: 6, food_value_boost: 5 },
            rewards: { sRank: 1.0, aRank: 0.5 }
        }
    };
};

// Skill definitions with balanced values (uses balance config)
const SKILLS = {
    speed_boost_1: {
        id: 'speed_boost_1',
        name: 'Swift Movement',
        description: 'Increases movement speed by 5%',
        icon: '⚡',
        cost: () => getBalanceConfig().skillTree.costs.speed_boost_1,
        unlockLevel: 3,
        unlockSRank: null,
        unlockWorld: null,
        effect: () => ({ 
            speedMultiplier: getBalanceConfig().skillTree.speedMultiplier.step1 
        }),
        prerequisites: [],
        maxStack: 1
    },
    speed_boost_2: {
        id: 'speed_boost_2',
        name: 'Rapid Movement',
        description: 'Increases movement speed by 10% (replaces Swift Movement)',
        icon: '⚡⚡',
        cost: () => getBalanceConfig().skillTree.costs.speed_boost_2,
        unlockLevel: 7,
        unlockSRank: 3,
        unlockWorld: null,
        effect: () => ({ 
            speedMultiplier: getBalanceConfig().skillTree.speedMultiplier.step2 
        }),
        prerequisites: ['speed_boost_1'],
        maxStack: 1
    },
    food_magnet: {
        id: 'food_magnet',
        name: 'Food Magnet',
        description: 'Pulls food within 3 cells toward snake',
        icon: '🧲',
        cost: () => getBalanceConfig().skillTree.costs.food_magnet,
        unlockLevel: 5,
        unlockSRank: null,
        unlockWorld: null,
        effect: () => {
            const config = getBalanceConfig().skillTree.foodMagnet;
            return { 
                magnetRadius: config.radius,
                magnetStrength: config.strength
            };
        },
        prerequisites: [],
        maxStack: 1
    },
    retry_heart: {
        id: 'retry_heart',
        name: 'Extra Life',
        description: 'Grants +1 retry heart (prevents first death per level)',
        icon: '❤️',
        cost: () => getBalanceConfig().skillTree.costs.retry_heart,
        unlockLevel: 4,
        unlockSRank: null,
        unlockWorld: null,
        effect: () => {
            const config = getBalanceConfig().skillTree.extraLives;
            return { extraLives: config.default };
        },
        prerequisites: [],
        maxStack: 1
    },
    dash_ability: {
        id: 'dash_ability',
        name: 'Dash',
        description: 'Quick burst of speed (Space key, cooldown based on ticks)',
        icon: '💨',
        cost: () => getBalanceConfig().skillTree.costs.dash_ability,
        unlockLevel: 8,
        unlockSRank: 5,
        unlockWorld: null,
        effect: () => {
            const config = getBalanceConfig().skillTree.dash;
            return { 
                dashCooldown: config.cooldown,
                dashDistance: config.distance,
                dashActive: false,
                dashCooldownRemaining: 0
            };
        },
        prerequisites: ['speed_boost_1'],
        maxStack: 1
    },
    food_value_boost: {
        id: 'food_value_boost',
        name: 'Nutritious Food',
        description: 'Food gives 1.5x points (modest boost)',
        icon: '⭐',
        cost: () => getBalanceConfig().skillTree.costs.food_value_boost,
        unlockLevel: 6,
        unlockSRank: 2,
        unlockWorld: null,
        effect: () => {
            const config = getBalanceConfig().skillTree.foodMultiplier;
            return { foodMultiplier: config.default };
        },
        prerequisites: [],
        maxStack: 1
    }
};

// Internal state
let skillState = {
    skillPoints: 0,
    purchasedSkills: {},
    activeEffects: {}
};

// Initialize skill tree
function initializeSkillTree() {
    loadSkillTreeData();
    updateSkillUnlocks();
    applyActiveEffects();
}

// Load skill tree data
function loadSkillTreeData() {
    const saved = localStorage.getItem('skillTreeData');
    if (!saved) {
        skillState = {
            skillPoints: 0,
            purchasedSkills: {},
            activeEffects: {}
        };
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        
        // Version migration
        if (data.version !== SAVE_VERSION) {
            console.warn('Skill tree save version mismatch, resetting');
            resetSkillTree();
            return;
        }
        
        skillState = {
            skillPoints: typeof data.skillPoints === 'number' ? Math.max(0, data.skillPoints) : 0,
            purchasedSkills: typeof data.purchasedSkills === 'object' ? data.purchasedSkills : {},
            activeEffects: {}
        };
        
        // Validate purchased skills exist
        Object.keys(skillState.purchasedSkills).forEach(skillId => {
            if (!SKILLS[skillId]) {
                delete skillState.purchasedSkills[skillId];
            }
        });
        
        applyActiveEffects();
    } catch (e) {
        console.error('Failed to load skill tree:', e);
        resetSkillTree();
    }
}

// Save skill tree data
function saveSkillTreeData() {
    const data = {
        version: SAVE_VERSION,
        skillPoints: skillState.skillPoints,
        purchasedSkills: skillState.purchasedSkills
    };
    
    try {
        localStorage.setItem('skillTreeData', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save skill tree:', e);
    }
}

// Check if skill is unlocked (level, S-rank, world requirements)
function isSkillUnlocked(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return false;
    
    // Check level requirement
    if (window.Progression) {
        const highestLevel = window.Progression.getHighestUnlockedLevel();
        if (highestLevel < skill.unlockLevel) {
            return false;
        }
        
        // Check S-rank requirement
        if (skill.unlockSRank) {
            const levelRanks = window.Progression.levelRanks || {};
            const sRankCount = Object.values(levelRanks)
                .filter(rank => rank === 'S').length;
            if (sRankCount < skill.unlockSRank) {
                return false;
            }
        }
        
        // Check world requirement
        if (skill.unlockWorld) {
            if (!window.Progression.isWorldUnlocked(skill.unlockWorld)) {
                return false;
            }
        }
    }
    
    // Check prerequisites
    for (const prereq of skill.prerequisites) {
        if (!isSkillPurchased(prereq)) {
            return false;
        }
    }
    
    return true;
}

// Check if skill is purchased
function isSkillPurchased(skillId) {
    return skillState.purchasedSkills[skillId] === true;
}

// Purchase a skill (with validation)
function purchaseSkill(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) {
        console.warn(`Skill ${skillId} not found`);
        return false;
    }
    
    // Validation checks
    if (isSkillPurchased(skillId)) {
        console.warn(`Skill ${skillId} already purchased`);
        return false;
    }
    
    if (!isSkillUnlocked(skillId)) {
        console.warn(`Skill ${skillId} not unlocked`);
        return false;
    }
    
    // Get cost (handle function or value)
    const cost = typeof skill.cost === 'function' ? skill.cost() : skill.cost;
    
    if (skillState.skillPoints < cost) {
        console.warn(`Not enough skill points for ${skillId}`);
        return false;
    }
    
    // Check max stack (e.g., can't have both speed boosts)
    if (skill.maxStack === 1) {
        // Check if any prerequisite skill should be replaced
        for (const prereq of skill.prerequisites) {
            if (isSkillPurchased(prereq)) {
                const prereqSkill = SKILLS[prereq];
                if (prereqSkill && prereqSkill.maxStack === 1) {
                    const prereqEffect = typeof prereqSkill.effect === 'function' 
                        ? prereqSkill.effect() 
                        : prereqSkill.effect;
                    const skillEffect = typeof skill.effect === 'function' 
                        ? skill.effect() 
                        : skill.effect;
                    if (prereqEffect.speedMultiplier && skillEffect.speedMultiplier) {
                        // Replace prerequisite (e.g., speed_boost_1 -> speed_boost_2)
                        delete skillState.purchasedSkills[prereq];
                    }
                }
            }
        }
    }
    
    // Purchase
    skillState.skillPoints -= cost;
    skillState.purchasedSkills[skillId] = true;
    
    applyActiveEffects();
    saveSkillTreeData();
    
    return true;
}

// Apply active skill effects
function applyActiveEffects() {
    skillState.activeEffects = {};
    
    Object.keys(skillState.purchasedSkills).forEach(skillId => {
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        // Get effect (handle function or value)
        const effect = typeof skill.effect === 'function' ? skill.effect() : skill.effect;
        
        Object.keys(effect).forEach(key => {
            // Apply balance validation
            let value = effect[key];
            if (key === 'speedMultiplier' && window.BalanceConfig) {
                value = window.BalanceConfig.validate.speedMultiplier(value);
            } else if (key === 'foodMultiplier' && window.BalanceConfig) {
                value = window.BalanceConfig.validate.foodMultiplier(value);
            } else if (key === 'dashCooldown' && window.BalanceConfig) {
                value = window.BalanceConfig.validate.dashCooldown(value);
            } else if (key === 'dashDistance' && window.BalanceConfig) {
                value = window.BalanceConfig.validate.dashDistance(value);
            }
            
            // For speed multiplier, take the maximum (don't stack)
            if (key === 'speedMultiplier') {
                skillState.activeEffects[key] = Math.max(
                    skillState.activeEffects[key] || 1.0,
                    value
                );
            } else {
                // For other effects, merge or replace
                skillState.activeEffects[key] = value;
            }
        });
    });
    
    // Cap speed multiplier using balance config
    if (skillState.activeEffects.speedMultiplier && window.BalanceConfig) {
        skillState.activeEffects.speedMultiplier = window.BalanceConfig.validate.speedMultiplier(
            skillState.activeEffects.speedMultiplier
        );
    }
}

// Award skill points (from S-rank: 1 point, A-rank: 0.5 points)
function awardSkillPoints(rank) {
    const config = getBalanceConfig();
    const rewards = config.skillTree.rewards;
    
    let points = 0;
    if (rank === 'S') {
        points = rewards.sRank;
    } else if (rank === 'A') {
        points = rewards.aRank;
    }
    
    if (points > 0) {
        skillState.skillPoints += points;
        saveSkillTreeData();
    }
}

// Update skill unlocks based on current progression
function updateSkillUnlocks() {
    // This is called when progression changes
    // Skills are checked dynamically in isSkillUnlocked()
}

// Get active effects (read-only)
function getActiveEffects() {
    return { ...skillState.activeEffects };
}

// Get skill points
function getSkillPoints() {
    return skillState.skillPoints;
}

// Get all skills (for UI)
function getAllSkills() {
    return Object.values(SKILLS).map(skill => {
        const cost = typeof skill.cost === 'function' ? skill.cost() : skill.cost;
        const effect = typeof skill.effect === 'function' ? skill.effect() : skill.effect;
        return {
            ...skill,
            cost: cost, // Expose cost as value for UI
            effect: effect, // Expose effect for UI
            isUnlocked: isSkillUnlocked(skill.id),
            isPurchased: isSkillPurchased(skill.id),
            canAfford: skillState.skillPoints >= cost
        };
    });
}

// Reset skill tree
function resetSkillTree() {
    skillState = {
        skillPoints: 0,
        purchasedSkills: {},
        activeEffects: {}
    };
    saveSkillTreeData();
}

// Public API
const SkillTree = {
    initialize: initializeSkillTree,
    isSkillUnlocked,
    isSkillPurchased,
    purchaseSkill,
    getActiveEffects,
    getSkillPoints,
    getAllSkills,
    awardSkillPoints,
    updateSkillUnlocks,
    reset: resetSkillTree,
    SKILLS // Expose for UI
};

// Export
window.SkillTree = SkillTree;
