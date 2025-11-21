// ==================== S-RANK TIMING SYSTEM ====================
// Tracks level completion times and assigns ranks

// Target times for each level (in seconds)
const LEVEL_TARGET_TIMES = {
    1: 30,   // 30 seconds
    2: 35,
    3: 40,
    4: 45,
    5: 50,
    6: 55,
    7: 60,
    8: 65,
    9: 70,
    10: 75,
    11: 80,
    12: 85,
    13: 90,
    14: 95,
    15: 100,
    16: 105,
    17: 110,
    18: 115,
    19: 120,
    20: 125
};

// Rank thresholds (multipliers of target time)
const RANK_THRESHOLDS = {
    'S': 1.0,      // At or below target time
    'A': 1.25,     // Within 1.25x target
    'B': 1.75,     // Within 1.75x target
    'C': Infinity  // Anything slower
};

let levelStartTime = 0;
let levelCompletionTime = 0;
let levelBestTimes = {}; // { levelId: bestTime }
let levelRanks = {};     // { levelId: 'S' | 'A' | 'B' | 'C' }

// Initialize S-Rank system
function initSRankSystem() {
    loadSRankData();
}

// Start level timer
function startLevelTimer() {
    levelStartTime = performance.now();
    levelCompletionTime = 0;
}

// Stop level timer and calculate rank
function stopLevelTimer(levelId) {
    if (levelStartTime === 0) return null;
    
    levelCompletionTime = (performance.now() - levelStartTime) / 1000; // Convert to seconds
    const targetTime = LEVEL_TARGET_TIMES[levelId] || 60;
    const rank = calculateRank(levelCompletionTime, targetTime);
    
    // Update best time if this is better
    if (!levelBestTimes[levelId] || levelCompletionTime < levelBestTimes[levelId]) {
        levelBestTimes[levelId] = levelCompletionTime;
    }
    
    // Update rank if this is better
    const currentRank = levelRanks[levelId];
    if (!currentRank || isRankBetter(rank, currentRank)) {
        levelRanks[levelId] = rank;
    }
    
    // Award skill points for S-Rank
    if (rank === 'S' && window.awardSkillPoints) {
        window.awardSkillPoints(1); // 1 skill point per S-Rank
    }
    
    saveSRankData();
    
    return {
        time: levelCompletionTime,
        bestTime: levelBestTimes[levelId],
        rank: rank,
        targetTime: targetTime
    };
}

// Calculate rank based on completion time
function calculateRank(completionTime, targetTime) {
    const ratio = completionTime / targetTime;
    
    if (ratio <= RANK_THRESHOLDS['S']) {
        return 'S';
    } else if (ratio <= RANK_THRESHOLDS['A']) {
        return 'A';
    } else if (ratio <= RANK_THRESHOLDS['B']) {
        return 'B';
    } else {
        return 'C';
    }
}

// Check if rank1 is better than rank2
function isRankBetter(rank1, rank2) {
    const rankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
    return rankOrder[rank1] > rankOrder[rank2];
}

// Get rank color
function getRankColor(rank) {
    const colors = {
        'S': '#ffd700', // Gold
        'A': '#ff6b6b', // Red
        'B': '#4ecdc4', // Cyan
        'C': '#95a5a6'  // Gray
    };
    return colors[rank] || '#95a5a6';
}

// Get current level time (for display during gameplay)
function getCurrentLevelTime() {
    if (levelStartTime === 0) return 0;
    return (performance.now() - levelStartTime) / 1000;
}

// Get best time for a level
function getBestTime(levelId) {
    return levelBestTimes[levelId] || null;
}

// Get rank for a level
function getRank(levelId) {
    return levelRanks[levelId] || null;
}

// Get target time for a level
function getTargetTime(levelId) {
    return LEVEL_TARGET_TIMES[levelId] || 60;
}

// Save S-Rank data to localStorage
function saveSRankData() {
    const data = {
        bestTimes: levelBestTimes,
        ranks: levelRanks
    };
    localStorage.setItem('sRankData', JSON.stringify(data));
}

// Load S-Rank data from localStorage
function loadSRankData() {
    const saved = localStorage.getItem('sRankData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            levelBestTimes = data.bestTimes || {};
            levelRanks = data.ranks || {};
        } catch (e) {
            console.warn('Failed to load S-Rank data:', e);
            levelBestTimes = {};
            levelRanks = {};
        }
    }
}

// Reset all S-Rank data
function resetSRankData() {
    levelBestTimes = {};
    levelRanks = {};
    saveSRankData();
}

// Export
window.LEVEL_TARGET_TIMES = LEVEL_TARGET_TIMES;
window.initSRankSystem = initSRankSystem;
window.startLevelTimer = startLevelTimer;
window.stopLevelTimer = stopLevelTimer;
window.getCurrentLevelTime = getCurrentLevelTime;
window.getBestTime = getBestTime;
window.getRank = getRank;
window.getTargetTime = getTargetTime;
window.getRankColor = getRankColor;
window.calculateRank = calculateRank;
window.resetSRankData = resetSRankData;

