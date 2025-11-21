// ==================== ITEM UNLOCK CONFIGURATION ====================
// JSON config for level-gated and condition-based item unlocks

const ITEM_UNLOCKS = {
    // Speed boosters - level gated only
    speed_boost_1: {
        level: 1
    },
    speed_boost_2: {
        level: 5
    },
    speed_boost_3: {
        level: 10
    },
    
    // Fruit multipliers
    fruit_multiplier_2x: {
        level: 3
    },
    fruit_multiplier_3x: {
        level: 8,
        boss: 'forest_guardian' // Must defeat forest guardian
    },
    
    // Auto-bite
    auto_bite: {
        level: 6,
        challenge: 'fruit_rush_gold' // Complete fruit rush with gold medal
    },
    
    // Shield
    shield: {
        level: 4
    },
    
    // Enhanced magnet
    magnet_enhanced: {
        level: 7,
        worldNode: 'desert' // Must visit desert node
    },
    
    // Dash charge
    dash_charge: {
        level: 5,
        mission: 'speed_demon' // Complete speed demon mission
    },
    
    // Path clearer
    path_clearer: {
        level: 9,
        boss: 'ice_queen' // Defeat ice queen
    },
    
    // Snake extender
    snake_extender: {
        level: 2
    },
    
    // Snake shortener
    snake_shortener: {
        level: 3
    },
    
    // Cosmetic skins
    skin_golden: {
        level: 15,
        boss: 'lava_titan' // Defeat final boss
    },
    skin_neon: {
        level: 12,
        season: 'halloween' // Available during Halloween
    }
};

// Check if item meets all unlock requirements
function checkItemUnlock(itemId) {
    const item = window.ITEMS[itemId];
    if (!item) return false;
    
    // Basic level check
    if (window.playerStats && window.playerStats.level < item.unlockLevel) {
        return false;
    }
    
    const unlockConfig = ITEM_UNLOCKS[itemId];
    if (!unlockConfig) return true; // No additional requirements
    
    // Check boss requirement
    if (unlockConfig.boss) {
        if (!window.playerStats.defeatedBosses.includes(unlockConfig.boss)) {
            return false;
        }
    }
    
    // Check challenge requirement
    if (unlockConfig.challenge) {
        if (!window.playerStats.completedChallenges.includes(unlockConfig.challenge)) {
            return false;
        }
    }
    
    // Check mission requirement
    if (unlockConfig.mission) {
        if (!window.playerStats.completedMissions.includes(unlockConfig.mission)) {
            return false;
        }
    }
    
    // Check season requirement
    if (unlockConfig.season) {
        if (window.currentSeason && window.currentSeason() !== unlockConfig.season) {
            return false;
        }
    }
    
    // Check world node requirement
    if (unlockConfig.worldNode) {
        if (!window.playerStats.worldNodesVisited.includes(unlockConfig.worldNode)) {
            return false;
        }
    }
    
    return true;
}

// Get unlock requirements text for display
function getUnlockRequirementsText(itemId) {
    const item = window.ITEMS[itemId];
    if (!item) return '';
    
    const requirements = [];
    
    // Level requirement
    if (item.unlockLevel > 1) {
        requirements.push(`Level ${item.unlockLevel}`);
    }
    
    const unlockConfig = ITEM_UNLOCKS[itemId];
    if (unlockConfig) {
        if (unlockConfig.boss) {
            requirements.push(`Defeat ${unlockConfig.boss.replace('_', ' ')}`);
        }
        if (unlockConfig.challenge) {
            requirements.push(`Complete ${unlockConfig.challenge.replace('_', ' ')}`);
        }
        if (unlockConfig.mission) {
            requirements.push(`Mission: ${unlockConfig.mission.replace('_', ' ')}`);
        }
        if (unlockConfig.season) {
            requirements.push(`${unlockConfig.season} season`);
        }
        if (unlockConfig.worldNode) {
            requirements.push(`Visit ${unlockConfig.worldNode.replace('_', ' ')}`);
        }
    }
    
    return requirements.join(', ');
}

// Check all item unlocks (called after level up, boss defeat, etc.)
function checkItemUnlocks() {
    Object.keys(window.ITEMS).forEach(itemId => {
        if (checkItemUnlock(itemId)) {
            // Item is now unlocked (can be shown in shop)
            // This is handled by unlockCheck in items.js
        }
    });
}

// Export
window.ITEM_UNLOCKS = ITEM_UNLOCKS;
window.checkItemUnlock = checkItemUnlock;
window.getUnlockRequirementsText = getUnlockRequirementsText;
window.checkItemUnlocks = checkItemUnlocks;

