// ==================== LEVEL MANAGER ====================
// Handles level unlocking, progression, and persistence

const TOTAL_LEVELS = 20; // Match game.js

// Level data structure
let levels = [];

// Initialize levels array (Level 1 unlocked by default)
function initializeLevels() {
    levels = [];
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        levels.push({
            id: i,
            unlocked: i === 1, // Only level 1 starts unlocked
            newlyUnlocked: false // Track if just unlocked for animation
        });
    }
}

// Load level progression from localStorage
function loadLevelProgression() {
    const saved = localStorage.getItem('levelProgression');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            const unlockedLevels = data.unlockedLevels || [1];
            const highestLevel = data.highestLevel || 1;
            
            // Update levels array
            levels.forEach(level => {
                level.unlocked = unlockedLevels.includes(level.id);
            });
            
            return {
                unlockedLevels,
                highestLevel
            };
        } catch (e) {
            console.warn('Failed to load level progression:', e);
            initializeLevels();
            return { unlockedLevels: [1], highestLevel: 1 };
        }
    } else {
        initializeLevels();
        return { unlockedLevels: [1], highestLevel: 1 };
    }
}

// Save level progression to localStorage
function saveLevelProgression() {
    const unlockedLevels = levels.filter(l => l.unlocked).map(l => l.id);
    const highestLevel = Math.max(...unlockedLevels, 1);
    
    const data = {
        unlockedLevels,
        highestLevel
    };
    
    localStorage.setItem('levelProgression', JSON.stringify(data));
}

// Check if a level is unlocked
function isLevelUnlocked(levelId) {
    const level = levels.find(l => l.id === levelId);
    return level ? level.unlocked : false;
}

// Unlock a specific level
function unlockLevel(levelId) {
    const level = levels.find(l => l.id === levelId);
    if (level && !level.unlocked) {
        level.unlocked = true;
        level.newlyUnlocked = true; // Mark as newly unlocked for animation
        
        // Remove "newly unlocked" flag after animation
        setTimeout(() => {
            level.newlyUnlocked = false;
        }, 3000);
        
        saveLevelProgression();
        return true;
    }
    return false;
}

// Unlock next level after completing current level
function unlockNextLevel(currentLevelId) {
    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= TOTAL_LEVELS) {
        return unlockLevel(nextLevelId);
    }
    return false;
}

// Get all levels
function getAllLevels() {
    return levels;
}

// Get unlocked levels
function getUnlockedLevels() {
    return levels.filter(l => l.unlocked);
}

// Get highest unlocked level
function getHighestUnlockedLevel() {
    const unlocked = getUnlockedLevels();
    if (unlocked.length === 0) return 1;
    return Math.max(...unlocked.map(l => l.id));
}

// Reset all progression (for "Reset Progress" button)
function resetLevelProgression() {
    initializeLevels();
    saveLevelProgression();
    return true;
}

// Check if level can be played (unlocked and valid)
function canPlayLevel(levelId) {
    if (levelId < 1 || levelId > TOTAL_LEVELS) return false;
    return isLevelUnlocked(levelId);
}

// Get level data
function getLevelData(levelId) {
    return levels.find(l => l.id === levelId);
}

// Initialize on load
initializeLevels();
loadLevelProgression();

// Export
window.TOTAL_LEVELS = TOTAL_LEVELS;
window.levels = levels;
window.initializeLevels = initializeLevels;
window.loadLevelProgression = loadLevelProgression;
window.saveLevelProgression = saveLevelProgression;
window.isLevelUnlocked = isLevelUnlocked;
window.unlockLevel = unlockLevel;
window.unlockNextLevel = unlockNextLevel;
window.getAllLevels = getAllLevels;
window.getUnlockedLevels = getUnlockedLevels;
window.getHighestUnlockedLevel = getHighestUnlockedLevel;
window.resetLevelProgression = resetLevelProgression;
window.canPlayLevel = canPlayLevel;
window.getLevelData = getLevelData;

