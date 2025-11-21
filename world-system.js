// ==================== WORLD / CHAPTER SYSTEM ====================
// Multi-world progression with unlock logic

const LEVELS_PER_WORLD = 10;
const TOTAL_WORLDS = Math.ceil((window.TOTAL_LEVELS || 20) / LEVELS_PER_WORLD);

// World data structure
let worlds = [];

// Initialize worlds
function initializeWorlds() {
    worlds = [];
    for (let i = 1; i <= TOTAL_WORLDS; i++) {
        const startLevel = (i - 1) * LEVELS_PER_WORLD + 1;
        const endLevel = Math.min(i * LEVELS_PER_WORLD, window.TOTAL_LEVELS || 20);
        
        worlds.push({
            id: i,
            name: `World ${i}`,
            startLevel: startLevel,
            endLevel: endLevel,
            unlocked: i === 1, // Only World 1 starts unlocked
            completed: false,
            levels: []
        });
        
        // Populate levels for this world
        for (let level = startLevel; level <= endLevel; level++) {
            worlds[i - 1].levels.push(level);
        }
    }
}

// Load world progression from localStorage
function loadWorldProgression() {
    const saved = localStorage.getItem('worldProgression');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            const unlockedWorlds = data.unlockedWorlds || [1];
            const completedWorlds = data.completedWorlds || [];
            
            // Update worlds array
            worlds.forEach(world => {
                world.unlocked = unlockedWorlds.includes(world.id);
                world.completed = completedWorlds.includes(world.id);
            });
        } catch (e) {
            console.warn('Failed to load world progression:', e);
            initializeWorlds();
        }
    } else {
        initializeWorlds();
    }
}

// Save world progression to localStorage
function saveWorldProgression() {
    const unlockedWorlds = worlds.filter(w => w.unlocked).map(w => w.id);
    const completedWorlds = worlds.filter(w => w.completed).map(w => w.id);
    
    const data = {
        unlockedWorlds,
        completedWorlds
    };
    
    localStorage.setItem('worldProgression', JSON.stringify(data));
}

// Check if world is unlocked
function isWorldUnlocked(worldId) {
    const world = worlds.find(w => w.id === worldId);
    return world ? world.unlocked : false;
}

// Unlock a world
function unlockWorld(worldId) {
    const world = worlds.find(w => w.id === worldId);
    if (world && !world.unlocked) {
        world.unlocked = true;
        saveWorldProgression();
        return true;
    }
    return false;
}

// Check if world is completed (all levels in world completed)
function isWorldCompleted(worldId) {
    const world = worlds.find(w => w.id === worldId);
    if (!world) return false;
    
    // Check if all levels in world are completed
    // This would require checking level completion status
    // For now, we'll use a simpler check
    return world.completed;
}

// Mark world as completed
function completeWorld(worldId) {
    const world = worlds.find(w => w.id === worldId);
    if (world && !world.completed) {
        world.completed = true;
        
        // Unlock next world
        if (worldId < TOTAL_WORLDS) {
            unlockWorld(worldId + 1);
        }
        
        saveWorldProgression();
        return true;
    }
    return false;
}

// Check if world should be unlocked (based on level completion)
function checkWorldUnlocks() {
    // World N unlocks when all levels in World N-1 are completed
    // For simplicity, we'll check if the last level of previous world is completed
    for (let i = 2; i <= TOTAL_WORLDS; i++) {
        if (isWorldUnlocked(i)) continue; // Already unlocked
        
        const previousWorld = worlds.find(w => w.id === i - 1);
        if (!previousWorld) continue;
        
        // Check if last level of previous world is unlocked (meaning it's been beaten)
        const lastLevel = previousWorld.endLevel;
        if (window.isLevelUnlocked && window.isLevelUnlocked(lastLevel + 1)) {
            // Next level unlocked means previous world is complete
            unlockWorld(i);
        }
    }
}

// Get world for a specific level
function getWorldForLevel(levelId) {
    return worlds.find(w => levelId >= w.startLevel && levelId <= w.endLevel);
}

// Get all worlds
function getAllWorlds() {
    return worlds;
}

// Get levels for a world
function getLevelsForWorld(worldId) {
    const world = worlds.find(w => w.id === worldId);
    return world ? world.levels : [];
}

// Get current world (based on current level)
function getCurrentWorld() {
    if (typeof window.currentLevel !== 'undefined') {
        return getWorldForLevel(window.currentLevel);
    }
    return worlds[0];
}

// Reset world progression
function resetWorldProgression() {
    initializeWorlds();
    saveWorldProgression();
}

// Initialize on load
initializeWorlds();
loadWorldProgression();

// Export
window.TOTAL_WORLDS = TOTAL_WORLDS;
window.LEVELS_PER_WORLD = LEVELS_PER_WORLD;
window.worlds = worlds;
window.initializeWorlds = initializeWorlds;
window.loadWorldProgression = loadWorldProgression;
window.saveWorldProgression = saveWorldProgression;
window.isWorldUnlocked = isWorldUnlocked;
window.unlockWorld = unlockWorld;
window.isWorldCompleted = isWorldCompleted;
window.completeWorld = completeWorld;
window.checkWorldUnlocks = checkWorldUnlocks;
window.getWorldForLevel = getWorldForLevel;
window.getAllWorlds = getAllWorlds;
window.getLevelsForWorld = getLevelsForWorld;
window.getCurrentWorld = getCurrentWorld;
window.resetWorldProgression = resetWorldProgression;

