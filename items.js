// ==================== ITEMS SYSTEM ====================
// Item definitions, inventory management, and effects

const ITEM_RARITIES = {
    COMMON: { name: 'Common', color: '#9e9e9e', multiplier: 1 },
    RARE: { name: 'Rare', color: '#2196f3', multiplier: 1.5 },
    EPIC: { name: 'Epic', color: '#9c27b0', multiplier: 2 },
    LEGENDARY: { name: 'Legendary', color: '#ff9800', multiplier: 3 }
};

// Item definitions
const ITEMS = {
    // Speed boosters
    speed_boost_1: {
        id: 'speed_boost_1',
        name: 'Swift Step',
        description: 'Increases movement speed by 10%',
        rarity: 'COMMON',
        cost: 50,
        unlockLevel: 1,
        effects: { speedMultiplier: 1.1 },
        type: 'active',
        duration: 0 // Permanent when equipped
    },
    speed_boost_2: {
        id: 'speed_boost_2',
        name: 'Rapid Rush',
        description: 'Increases movement speed by 20%',
        rarity: 'RARE',
        cost: 150,
        unlockLevel: 5,
        effects: { speedMultiplier: 1.2 },
        type: 'active',
        duration: 0
    },
    speed_boost_3: {
        id: 'speed_boost_3',
        name: 'Lightning Speed',
        description: 'Increases movement speed by 35%',
        rarity: 'EPIC',
        cost: 400,
        unlockLevel: 10,
        effects: { speedMultiplier: 1.35 },
        type: 'active',
        duration: 0
    },
    
    // Fruit multipliers
    fruit_multiplier_2x: {
        id: 'fruit_multiplier_2x',
        name: 'Double Fruit',
        description: 'Doubles points from fruits',
        rarity: 'RARE',
        cost: 200,
        unlockLevel: 3,
        effects: { fruitMultiplier: 2 },
        type: 'active',
        duration: 0
    },
    fruit_multiplier_3x: {
        id: 'fruit_multiplier_3x',
        name: 'Triple Fruit',
        description: 'Triples points from fruits',
        rarity: 'EPIC',
        cost: 500,
        unlockLevel: 8,
        effects: { fruitMultiplier: 3 },
        type: 'active',
        duration: 0
    },
    
    // Auto-bite
    auto_bite: {
        id: 'auto_bite',
        name: 'Auto-Bite',
        description: 'Automatically collects fruit within 2 cells',
        rarity: 'EPIC',
        cost: 350,
        unlockLevel: 6,
        effects: { autoBiteRadius: 2 },
        type: 'active',
        duration: 0
    },
    
    // Shield
    shield: {
        id: 'shield',
        name: 'Protective Shield',
        description: 'Prevents first death (consumed on use)',
        rarity: 'RARE',
        cost: 250,
        unlockLevel: 4,
        effects: { shield: 1 },
        type: 'consumable',
        duration: 0
    },
    
    // Magnet (enhanced)
    magnet_enhanced: {
        id: 'magnet_enhanced',
        name: 'Super Magnet',
        description: 'Pulls fruit from 5 cells away',
        rarity: 'EPIC',
        cost: 300,
        unlockLevel: 7,
        effects: { magnetRadius: 5, magnetStrength: 0.5 },
        type: 'active',
        duration: 0
    },
    
    // Dash charge
    dash_charge: {
        id: 'dash_charge',
        name: 'Dash Ability',
        description: 'Burst movement on 10s cooldown',
        rarity: 'RARE',
        cost: 180,
        unlockLevel: 5,
        effects: { dashCooldown: 10000, dashDistance: 3 },
        type: 'active',
        duration: 0
    },
    
    // Path clearer
    path_clearer: {
        id: 'path_clearer',
        name: 'Path Clearer',
        description: 'Removes obstacles in 1-cell radius',
        rarity: 'EPIC',
        cost: 400,
        unlockLevel: 9,
        effects: { clearRadius: 1 },
        type: 'active',
        duration: 0
    },
    
    // Snake extender
    snake_extender: {
        id: 'snake_extender',
        name: 'Length Booster',
        description: 'Starts with +3 length',
        rarity: 'COMMON',
        cost: 75,
        unlockLevel: 2,
        effects: { startLength: 3 },
        type: 'active',
        duration: 0
    },
    
    // Snake shortener (for challenge)
    snake_shortener: {
        id: 'snake_shortener',
        name: 'Compact Form',
        description: 'Starts with -2 length (challenge item)',
        rarity: 'RARE',
        cost: 100,
        unlockLevel: 3,
        effects: { startLength: -2 },
        type: 'active',
        duration: 0
    },
    
    // Cosmetic skins
    skin_golden: {
        id: 'skin_golden',
        name: 'Golden Snake',
        description: 'Prestigious golden appearance',
        rarity: 'LEGENDARY',
        cost: 1000,
        unlockLevel: 15,
        effects: { skin: 'golden' },
        type: 'cosmetic',
        duration: 0
    },
    skin_neon: {
        id: 'skin_neon',
        name: 'Neon Snake',
        description: 'Glowing neon appearance',
        rarity: 'EPIC',
        cost: 600,
        unlockLevel: 12,
        effects: { skin: 'neon' },
        type: 'cosmetic',
        duration: 0
    }
};

// Player inventory
let playerInventory = {
    owned: [], // Array of item IDs
    equipped: [], // Array of equipped item IDs
    consumables: {} // { itemId: count }
};

// Active item effects during gameplay
let activeItemEffects = {};

// Load inventory
function loadInventory() {
    const saved = localStorage.getItem('playerInventory');
    if (saved) {
        playerInventory = JSON.parse(saved);
    }
}

// Save inventory
function saveInventory() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
}

// Purchase item
function purchaseItem(itemId) {
    const item = ITEMS[itemId];
    if (!item) return false;
    
    // Check if already owned (for non-consumables)
    if (item.type !== 'consumable' && playerInventory.owned.includes(itemId)) {
        return false; // Already owned
    }
    
    // Check if can afford
    if (!canAfford(item)) {
        return false;
    }
    
    // Check unlock requirements
    if (!unlockCheck(item)) {
        return false;
    }
    
    // Purchase
    if (spendGold(item.cost)) {
        if (item.type === 'consumable') {
            playerInventory.consumables[itemId] = (playerInventory.consumables[itemId] || 0) + 1;
        } else {
            playerInventory.owned.push(itemId);
        }
        saveInventory();
        return true;
    }
    
    return false;
}

// Check if player can afford item
function canAfford(item) {
    return window.playerStats && window.playerStats.gold >= item.cost;
}

// Check if item is unlocked
function unlockCheck(item) {
    // Level requirement
    if (window.playerStats && window.playerStats.level < item.unlockLevel) {
        return false;
    }
    
    // Additional unlock requirements from unlock config
    const unlockConfig = getUnlockConfig(item.id);
    if (unlockConfig) {
        // Check boss requirement
        if (unlockConfig.boss && !window.playerStats.defeatedBosses.includes(unlockConfig.boss)) {
            return false;
        }
        
        // Check challenge requirement
        if (unlockConfig.challenge && !window.playerStats.completedChallenges.includes(unlockConfig.challenge)) {
            return false;
        }
        
        // Check season requirement
        if (unlockConfig.season && window.currentSeason && window.currentSeason() !== unlockConfig.season) {
            return false;
        }
        
        // Check world node requirement
        if (unlockConfig.worldNode && !window.playerStats.worldNodesVisited.includes(unlockConfig.worldNode)) {
            return false;
        }
    }
    
    return true;
}

// Get unlock configuration for item
function getUnlockConfig(itemId) {
    return ITEM_UNLOCKS[itemId] || null;
}

// Equip item
function equipItem(itemId) {
    const item = ITEMS[itemId];
    if (!item) return false;
    
    // Check if owned
    if (!playerInventory.owned.includes(itemId)) {
        return false;
    }
    
    // Check if already equipped
    if (playerInventory.equipped.includes(itemId)) {
        return false;
    }
    
    // Check type restrictions (only one of each type)
    if (item.type === 'active') {
        // Remove other items of same category
        const category = getItemCategory(item);
        playerInventory.equipped = playerInventory.equipped.filter(id => {
            const otherItem = ITEMS[id];
            return !otherItem || getItemCategory(otherItem) !== category;
        });
    }
    
    playerInventory.equipped.push(itemId);
    saveInventory();
    applyItemEffects();
    return true;
}

// Unequip item
function unequipItem(itemId) {
    const index = playerInventory.equipped.indexOf(itemId);
    if (index !== -1) {
        playerInventory.equipped.splice(index, 1);
        saveInventory();
        applyItemEffects();
        return true;
    }
    return false;
}

// Get item category for conflict checking
function getItemCategory(item) {
    if (item.effects.speedMultiplier) return 'speed';
    if (item.effects.fruitMultiplier) return 'multiplier';
    if (item.effects.autoBiteRadius) return 'autoBite';
    if (item.effects.magnetRadius) return 'magnet';
    if (item.effects.dashCooldown) return 'dash';
    if (item.effects.clearRadius) return 'clearer';
    if (item.effects.startLength) return 'length';
    if (item.effects.skin) return 'cosmetic';
    return 'other';
}

// Apply equipped item effects
function applyItemEffects() {
    activeItemEffects = {};
    
    playerInventory.equipped.forEach(itemId => {
        const item = ITEMS[itemId];
        if (!item) return;
        
        // Merge effects
        Object.keys(item.effects).forEach(key => {
            if (activeItemEffects[key]) {
                // Stack or override based on effect type
                if (key === 'speedMultiplier' || key === 'fruitMultiplier') {
                    activeItemEffects[key] = Math.max(activeItemEffects[key], item.effects[key]);
                } else {
                    activeItemEffects[key] = item.effects[key];
                }
            } else {
                activeItemEffects[key] = item.effects[key];
            }
        });
    });
}

// Use consumable item
function useConsumable(itemId) {
    if (!playerInventory.consumables[itemId] || playerInventory.consumables[itemId] <= 0) {
        return false;
    }
    
    const item = ITEMS[itemId];
    if (!item) return false;
    
    // Apply consumable effect
    if (item.effects.shield) {
        activeItemEffects.shield = (activeItemEffects.shield || 0) + item.effects.shield;
    }
    
    // Consume
    playerInventory.consumables[itemId]--;
    if (playerInventory.consumables[itemId] <= 0) {
        delete playerInventory.consumables[itemId];
    }
    saveInventory();
    
    return true;
}

// Check if item is owned
function isItemOwned(itemId) {
    return playerInventory.owned.includes(itemId);
}

// Check if item is equipped
function isItemEquipped(itemId) {
    return playerInventory.equipped.includes(itemId);
}

// Get consumable count
function getConsumableCount(itemId) {
    return playerInventory.consumables[itemId] || 0;
}

// Export
window.ITEMS = ITEMS;
window.ITEM_RARITIES = ITEM_RARITIES;
window.playerInventory = playerInventory;
window.activeItemEffects = activeItemEffects;
window.loadInventory = loadInventory;
window.saveInventory = saveInventory;
window.purchaseItem = purchaseItem;
window.canAfford = canAfford;
window.unlockCheck = unlockCheck;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.useConsumable = useConsumable;
window.isItemOwned = isItemOwned;
window.isItemEquipped = isItemEquipped;
window.getConsumableCount = getConsumableCount;
window.applyItemEffects = applyItemEffects;

