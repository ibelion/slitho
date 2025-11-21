// ==================== PROGRESSION SYSTEM ====================
// Handles all progression: level unlocks, world unlocks, S-rank times, save/load
// This is the ONLY module that should read/write progression data

const SAVE_VERSION = 1;
const TOTAL_LEVELS = 20;
const LEVELS_PER_WORLD = 10;
const TOTAL_WORLDS = Math.ceil(TOTAL_LEVELS / LEVELS_PER_WORLD);

// Target times for S-rank (in seconds)
const LEVEL_TARGET_TIMES = {
    1: 30, 2: 35, 3: 40, 4: 45, 5: 50,
    6: 55, 7: 60, 8: 65, 9: 70, 10: 75,
    11: 80, 12: 85, 13: 90, 14: 95, 15: 100,
    16: 105, 17: 110, 18: 115, 19: 120, 20: 125
};

// Rank thresholds
const RANK_THRESHOLDS = {
    'S': 1.0,
    'A': 1.25,
    'B': 1.75,
    'C': Infinity
};

// Internal state (private)
let progressionState = {
    // Level unlocks
    unlockedLevels: [1], // Level 1 always unlocked
    highestLevel: 1,
    
    // World unlocks
    unlockedWorlds: [1], // World 1 always unlocked
    completedWorlds: [],
    
    // S-rank data
    levelBestTimes: {}, // { levelId: timeInSeconds }
    levelRanks: {},     // { levelId: 'S'|'A'|'B'|'C' }
    
    // Current level timer
    levelStartTime: 0,
    levelCompletionTime: 0
};

// Expose levelRanks for skill tree checks
Object.defineProperty(Progression, 'levelRanks', {
    get: () => progressionState.levelRanks,
    enumerable: true,
    configurable: false
});

// Level data
let levels = [];
let worlds = [];

// Initialize progression system
function initializeProgression() {
    // Initialize levels
    levels = [];
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        levels.push({
            id: i,
            unlocked: i === 1,
            newlyUnlocked: false
        });
    }
    
    // Initialize worlds
    worlds = [];
    for (let i = 1; i <= TOTAL_WORLDS; i++) {
        const startLevel = (i - 1) * LEVELS_PER_WORLD + 1;
        const endLevel = Math.min(i * LEVELS_PER_WORLD, TOTAL_LEVELS);
        worlds.push({
            id: i,
            name: `World ${i}`,
            startLevel,
            endLevel,
            unlocked: i === 1,
            completed: false,
            levels: []
        });
        for (let level = startLevel; level <= endLevel; level++) {
            worlds[i - 1].levels.push(level);
        }
    }
    
    // Load from storage
    loadProgression();
    
    // Validate and repair state
    validateAndRepairState();
}

// Validate and repair progression state
function validateAndRepairState() {
    let repaired = false;
    
    // Ensure Level 1 is always unlocked
    if (!progressionState.unlockedLevels.includes(1)) {
        progressionState.unlockedLevels.push(1);
        repaired = true;
    }
    
    // Ensure World 1 is always unlocked
    if (!progressionState.unlockedWorlds.includes(1)) {
        progressionState.unlockedWorlds.push(1);
        repaired = true;
    }
    
    // Validate level unlocks (can only unlock sequentially)
    const sortedUnlocked = [...progressionState.unlockedLevels].sort((a, b) => a - b);
    const validUnlocked = [1];
    for (let i = 1; i < sortedUnlocked.length; i++) {
        const level = sortedUnlocked[i];
        // Can only unlock if previous level is unlocked
        if (level === validUnlocked[validUnlocked.length - 1] + 1) {
            validUnlocked.push(level);
        }
    }
    if (validUnlocked.length !== progressionState.unlockedLevels.length) {
        progressionState.unlockedLevels = validUnlocked;
        progressionState.highestLevel = Math.max(...validUnlocked);
        repaired = true;
    }
    
    // Validate world unlocks
    const validWorlds = [1];
    for (let i = 2; i <= TOTAL_WORLDS; i++) {
        const prevWorld = worlds.find(w => w.id === i - 1);
        if (prevWorld && isWorldCompleted(prevWorld.id)) {
            validWorlds.push(i);
        }
    }
    if (validWorlds.length !== progressionState.unlockedWorlds.length ||
        !validWorlds.every(w => progressionState.unlockedWorlds.includes(w))) {
        progressionState.unlockedWorlds = validWorlds;
        repaired = true;
    }
    
    // Update level/world arrays
    levels.forEach(level => {
        level.unlocked = progressionState.unlockedLevels.includes(level.id);
    });
    worlds.forEach(world => {
        world.unlocked = progressionState.unlockedWorlds.includes(world.id);
        world.completed = progressionState.completedWorlds.includes(world.id);
    });
    
    if (repaired) {
        saveProgression();
    }
}

// Check if level is unlocked (with validation)
function isLevelUnlocked(levelId) {
    if (levelId < 1 || levelId > TOTAL_LEVELS) return false;
    return progressionState.unlockedLevels.includes(levelId);
}

// Unlock next level after completing current (with validation)
function unlockNextLevel(currentLevelId) {
    if (currentLevelId < 1 || currentLevelId >= TOTAL_LEVELS) return false;
    
    const nextLevelId = currentLevelId + 1;
    
    // Validate: can only unlock if current level is unlocked and we're unlocking sequentially
    if (!isLevelUnlocked(currentLevelId)) {
        console.warn(`Cannot unlock level ${nextLevelId}: level ${currentLevelId} not unlocked`);
        return false;
    }
    
    // Validate: can only unlock next sequential level
    if (nextLevelId !== currentLevelId + 1) {
        console.warn(`Cannot unlock level ${nextLevelId}: must unlock sequentially`);
        return false;
    }
    
    if (!progressionState.unlockedLevels.includes(nextLevelId)) {
        progressionState.unlockedLevels.push(nextLevelId);
        progressionState.highestLevel = Math.max(progressionState.highestLevel, nextLevelId);
        
        const level = levels.find(l => l.id === nextLevelId);
        if (level) {
            level.unlocked = true;
            level.newlyUnlocked = true;
            setTimeout(() => { level.newlyUnlocked = false; }, 3000);
        }
        
        // Check if world should unlock
        checkWorldUnlocks();
        
        saveProgression();
        return true;
    }
    return false;
}

// Check if world is completed
function isWorldCompleted(worldId) {
    const world = worlds.find(w => w.id === worldId);
    if (!world) return false;
    
    // World is completed if all its levels are unlocked (meaning beaten)
    return world.levels.every(levelId => {
        // Last level of world is completed if next level is unlocked
        if (levelId === world.endLevel) {
            return isLevelUnlocked(levelId + 1) || levelId === TOTAL_LEVELS;
        }
        return isLevelUnlocked(levelId + 1);
    });
}

// Check and unlock worlds
function checkWorldUnlocks() {
    for (let i = 2; i <= TOTAL_WORLDS; i++) {
        if (progressionState.unlockedWorlds.includes(i)) continue;
        
        const prevWorld = worlds.find(w => w.id === i - 1);
        if (prevWorld && isWorldCompleted(prevWorld.id)) {
            progressionState.unlockedWorlds.push(i);
            const world = worlds.find(w => w.id === i);
            if (world) world.unlocked = true;
        }
    }
}

// Mark world as completed
function completeWorld(worldId) {
    const world = worlds.find(w => w.id === worldId);
    if (!world) return false;
    
    if (!isWorldCompleted(worldId)) return false;
    
    if (!progressionState.completedWorlds.includes(worldId)) {
        progressionState.completedWorlds.push(worldId);
        world.completed = true;
        saveProgression();
        return true;
    }
    return false;
}

// Check if world is unlocked
function isWorldUnlocked(worldId) {
    return progressionState.unlockedWorlds.includes(worldId);
}

// Start level timer
function startLevelTimer() {
    progressionState.levelStartTime = performance.now();
    progressionState.levelCompletionTime = 0;
}

// Stop level timer and calculate rank
function stopLevelTimer(levelId) {
    if (progressionState.levelStartTime === 0) return null;
    
    progressionState.levelCompletionTime = (performance.now() - progressionState.levelStartTime) / 1000;
    const targetTime = LEVEL_TARGET_TIMES[levelId] || 60;
    const rank = calculateRank(progressionState.levelCompletionTime, targetTime);
    
    // Update best time
    if (!progressionState.levelBestTimes[levelId] || 
        progressionState.levelCompletionTime < progressionState.levelBestTimes[levelId]) {
        progressionState.levelBestTimes[levelId] = progressionState.levelCompletionTime;
    }
    
    // Update rank if better
    const currentRank = progressionState.levelRanks[levelId];
    if (!currentRank || isRankBetter(rank, currentRank)) {
        progressionState.levelRanks[levelId] = rank;
    }
    
    saveProgression();
    
    return {
        time: progressionState.levelCompletionTime,
        bestTime: progressionState.levelBestTimes[levelId],
        rank,
        targetTime
    };
}

// Calculate rank
function calculateRank(completionTime, targetTime) {
    const ratio = completionTime / targetTime;
    if (ratio <= RANK_THRESHOLDS['S']) return 'S';
    if (ratio <= RANK_THRESHOLDS['A']) return 'A';
    if (ratio <= RANK_THRESHOLDS['B']) return 'B';
    return 'C';
}

// Check if rank1 is better than rank2
function isRankBetter(rank1, rank2) {
    const order = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
    return order[rank1] > order[rank2];
}

// Get current level time
function getCurrentLevelTime() {
    if (progressionState.levelStartTime === 0) return 0;
    return (performance.now() - progressionState.levelStartTime) / 1000;
}

// Save progression to localStorage
function saveProgression() {
    const data = {
        version: SAVE_VERSION,
        unlockedLevels: progressionState.unlockedLevels,
        highestLevel: progressionState.highestLevel,
        unlockedWorlds: progressionState.unlockedWorlds,
        completedWorlds: progressionState.completedWorlds,
        levelBestTimes: progressionState.levelBestTimes,
        levelRanks: progressionState.levelRanks
    };
    
    try {
        localStorage.setItem('progressionData', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save progression:', e);
    }
}

// Load progression from localStorage
function loadProgression() {
    const saved = localStorage.getItem('progressionData');
    if (!saved) {
        // Initialize default state
        progressionState = {
            unlockedLevels: [1],
            highestLevel: 1,
            unlockedWorlds: [1],
            completedWorlds: [],
            levelBestTimes: {},
            levelRanks: {},
            levelStartTime: 0,
            levelCompletionTime: 0
        };
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        
        // Version migration
        if (data.version !== SAVE_VERSION) {
            console.warn('Save version mismatch, resetting progression');
            resetProgression();
            return;
        }
        
        // Load with defaults
        progressionState = {
            unlockedLevels: Array.isArray(data.unlockedLevels) ? data.unlockedLevels : [1],
            highestLevel: typeof data.highestLevel === 'number' ? data.highestLevel : 1,
            unlockedWorlds: Array.isArray(data.unlockedWorlds) ? data.unlockedWorlds : [1],
            completedWorlds: Array.isArray(data.completedWorlds) ? data.completedWorlds : [],
            levelBestTimes: typeof data.levelBestTimes === 'object' ? data.levelBestTimes : {},
            levelRanks: typeof data.levelRanks === 'object' ? data.levelRanks : {},
            levelStartTime: 0,
            levelCompletionTime: 0
        };
        
        // Ensure Level 1 and World 1 are always unlocked
        if (!progressionState.unlockedLevels.includes(1)) {
            progressionState.unlockedLevels.push(1);
        }
        if (!progressionState.unlockedWorlds.includes(1)) {
            progressionState.unlockedWorlds.push(1);
        }
    } catch (e) {
        console.error('Failed to load progression:', e);
        resetProgression();
    }
}

// Reset all progression
function resetProgression() {
    progressionState = {
        unlockedLevels: [1],
        highestLevel: 1,
        unlockedWorlds: [1],
        completedWorlds: [],
        levelBestTimes: {},
        levelRanks: {},
        levelStartTime: 0,
        levelCompletionTime: 0
    };
    
    levels.forEach(level => {
        level.unlocked = level.id === 1;
        level.newlyUnlocked = false;
    });
    
    worlds.forEach(world => {
        world.unlocked = world.id === 1;
        world.completed = false;
    });
    
    saveProgression();
}

// Public API
const Progression = {
    // Initialization
    initialize: initializeProgression,
    
    // Level management
    isLevelUnlocked,
    unlockNextLevel,
    getAllLevels: () => [...levels],
    getHighestUnlockedLevel: () => progressionState.highestLevel,
    
    // World management
    isWorldUnlocked,
    completeWorld,
    getAllWorlds: () => [...worlds],
    getWorldForLevel: (levelId) => worlds.find(w => levelId >= w.startLevel && levelId <= w.endLevel),
    getLevelsForWorld: (worldId) => {
        const world = worlds.find(w => w.id === worldId);
        return world ? [...world.levels] : [];
    },
    
    // S-rank system
    startLevelTimer,
    stopLevelTimer,
    getCurrentLevelTime,
    getBestTime: (levelId) => progressionState.levelBestTimes[levelId] || null,
    getRank: (levelId) => progressionState.levelRanks[levelId] || null,
    getTargetTime: (levelId) => LEVEL_TARGET_TIMES[levelId] || 60,
    getRankColor: (rank) => {
        const colors = { 'S': '#ffd700', 'A': '#ff6b6b', 'B': '#4ecdc4', 'C': '#95a5a6' };
        return colors[rank] || '#95a5a6';
    },
    
    // Save/load
    save: saveProgression,
    load: loadProgression,
    reset: resetProgression,
    validate: validateAndRepairState,
    
    // Constants
    TOTAL_LEVELS,
    TOTAL_WORLDS,
    LEVELS_PER_WORLD
};

// Export
window.Progression = Progression;
