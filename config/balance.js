// ==================== BALANCE CONFIGURATION ====================
// Central configuration file for all game balance values
// Ensures upgrades cannot break core mechanics

const BalanceConfig = {
    // Skill Tree Balance
    skillTree: {
        // Speed multipliers (capped to prevent game-breaking)
        speedMultiplier: {
            min: 1.0,
            max: 1.15, // 15% max increase
            step1: 1.05, // First upgrade: 5%
            step2: 1.10  // Second upgrade: 10% (replaces step1)
        },
        
        // Food magnet
        foodMagnet: {
            radius: 3, // Cells
            strength: 0.3, // 30% pull strength per tick
            maxStrength: 0.5 // Cap on strength
        },
        
        // Food value multiplier
        foodMultiplier: {
            min: 1.0,
            max: 1.5, // 50% max increase (not 2x to prevent inflation)
            default: 1.5
        },
        
        // Dash ability
        dash: {
            cooldown: 480, // Ticks (8 seconds at 60 ticks/sec)
            distance: 2, // Cells
            maxCooldown: 240, // Minimum cooldown (4 seconds)
            maxDistance: 3 // Maximum dash distance
        },
        
        // Extra lives
        extraLives: {
            max: 1, // Only one extra life allowed
            default: 1
        },
        
        // Skill point costs
        costs: {
            speed_boost_1: 2,
            speed_boost_2: 5,
            food_magnet: 3,
            retry_heart: 4,
            dash_ability: 6,
            food_value_boost: 5
        },
        
        // Skill point rewards
        rewards: {
            sRank: 1.0, // Full point for S-rank
            aRank: 0.5  // Half point for A-rank
        }
    },
    
    // Game Speed Balance
    gameSpeed: {
        baseTickRate: 60, // Ticks per second
        minInterval: 30, // Minimum ms between ticks (max speed)
        maxInterval: 200, // Maximum ms between ticks (min speed)
        speedStep: 5 // Speed increase per level in endless mode
    },
    
    // Progression Balance
    progression: {
        levelsPerWorld: 10,
        totalLevels: 20,
        unlockSequential: true, // Must unlock levels sequentially
        worldUnlockRequirement: 'complete' // 'complete' or 'unlock'
    },
    
    // S-Rank Timing
    sRank: {
        rankThresholds: {
            'S': 1.0,      // At or below target
            'A': 1.25,     // Within 1.25x
            'B': 1.75,     // Within 1.75x
            'C': Infinity  // Anything slower
        }
    },
    
    // Animation Balance
    animation: {
        interpolationEnabled: true,
        easingModes: ['linear', 'ease-in', 'ease-out', 'smoothstep', 'cubic-ease-in-out'],
        defaultEasing: 'smoothstep',
        headAnticipation: 0.15, // 15% head-leading
        segmentDelay: 0.05, // 5% delay per segment
        tailWiggleSpeed: 200, // ms per wiggle cycle
        stretchFactor: 0.1 // 10% max stretch when moving
    },
    
    // Camera Shake Balance
    cameraShake: {
        maxIntensity: 10,
        maxDuration: 1000, // ms
        falloffModes: ['linear', 'exponential'],
        defaultFalloff: 'exponential'
    },
    
    // Ghost Replay Balance
    ghostReplay: {
        maxReplays: 10,
        compressionEnabled: true,
        playbackAlpha: 0.4, // Faded appearance
        maxFrameCount: 10000 // Safety limit
    },
    
    // Validation functions
    validate: {
        speedMultiplier: (value) => {
            return Math.max(BalanceConfig.skillTree.speedMultiplier.min, 
                          Math.min(BalanceConfig.skillTree.speedMultiplier.max, value));
        },
        
        foodMultiplier: (value) => {
            return Math.max(BalanceConfig.skillTree.foodMultiplier.min,
                          Math.min(BalanceConfig.skillTree.foodMultiplier.max, value));
        },
        
        dashCooldown: (value) => {
            return Math.max(BalanceConfig.skillTree.dash.maxCooldown,
                          Math.min(BalanceConfig.skillTree.dash.cooldown, value));
        },
        
        dashDistance: (value) => {
            return Math.max(1,
                          Math.min(BalanceConfig.skillTree.dash.maxDistance, value));
        },
        
        cameraShakeIntensity: (value) => {
            return Math.max(0,
                          Math.min(BalanceConfig.cameraShake.maxIntensity, value));
        },
        
        cameraShakeDuration: (value) => {
            return Math.max(0,
                          Math.min(BalanceConfig.cameraShake.maxDuration, value));
        }
    }
};

// Export
window.BalanceConfig = BalanceConfig;

