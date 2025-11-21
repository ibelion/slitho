// ==================== LEVEL SELECT UI ====================
// Handles the level select screen rendering and interactions

// Render level select grid
function renderLevelSelect() {
    const grid = document.getElementById('levelSelectGrid');
    if (!grid) return;
    
    // Get all levels from level manager
    let allLevels = window.getAllLevels ? window.getAllLevels() : [];
    
    // Filter by selected world if one is selected
    if (window.selectedWorld && window.getLevelsForWorld) {
        const worldLevels = window.getLevelsForWorld(window.selectedWorld);
        allLevels = allLevels.filter(level => worldLevels.includes(level.id));
    }
    
    if (allLevels.length === 0) {
        // Reuse or create "no levels" message
        let noLevelsMsg = grid.querySelector('.no-levels-message');
        if (!noLevelsMsg) {
            noLevelsMsg = document.createElement('p');
            noLevelsMsg.className = 'no-levels-message';
            noLevelsMsg.style.cssText = 'text-align: center; color: var(--text-secondary); padding: 20px;';
        }
        noLevelsMsg.textContent = 'No levels available';
        grid.appendChild(noLevelsMsg);
        return;
    }
    
    // Optimize: remove children instead of innerHTML
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    
    // Add world filter header if world is selected
    if (window.selectedWorld && window.getAllWorlds) {
        const world = window.getAllWorlds().find(w => w.id === window.selectedWorld);
        if (world) {
            const header = document.createElement('div');
            header.style.cssText = 'grid-column: 1 / -1; padding: 15px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 15px; text-align: center;';
            header.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">${world.name}</h3>
                <button class="btn" onclick="window.selectedWorld = null; window.renderLevelSelect();" style="font-size: 0.9em;">
                    Show All Worlds
                </button>
            `;
            grid.appendChild(header);
        }
    }
    
    allLevels.forEach(level => {
        const levelItem = createLevelItem(level);
        grid.appendChild(levelItem);
    });
}

// Create a level item element
function createLevelItem(level) {
    const div = document.createElement('div');
    div.className = 'level-item';
    
    if (!level.unlocked) {
        div.classList.add('locked');
    }
    
    if (level.newlyUnlocked) {
        div.classList.add('newly-unlocked');
    }
    
    // Get level config for display
    let targetScore = '?';
    try {
        // Access level configs directly if available
        if (window.levelConfigs && Array.isArray(window.levelConfigs)) {
            const config = window.levelConfigs.find(c => c.level === level.id);
            if (config) {
                targetScore = config.targetScore || '?';
            }
        } else if (window.getCurrentLevelConfig && typeof window.currentLevel !== 'undefined') {
            // Fallback: temporarily change current level to get config
            const oldLevel = window.currentLevel;
            window.currentLevel = level.id;
            const config = window.getCurrentLevelConfig();
            window.currentLevel = oldLevel;
            targetScore = config ? config.targetScore : '?';
        }
    } catch (e) {
        // Fallback if config not available
        targetScore = '?';
    }
    
    // Get rank for this level
    const rank = window.getRank ? window.getRank(level.id) : null;
    const rankColor = rank ? (window.getRankColor ? window.getRankColor(rank) : '#95a5a6') : null;
    
    div.innerHTML = `
        <div class="level-item-content">
            ${!level.unlocked ? '<div class="level-lock-icon">🔒</div>' : ''}
            ${level.newlyUnlocked ? '<div class="level-new-badge">NEW!</div>' : ''}
            ${rank ? `<div class="level-rank-badge" style="background: ${rankColor};">${rank}</div>` : ''}
            <div class="level-number">${level.id}</div>
            <div class="level-info">
                <div class="level-target">Target: ${targetScore}</div>
                ${rank ? `<div class="level-rank" style="color: ${rankColor};">Best: ${rank}-Rank</div>` : ''}
            </div>
        </div>
    `;
    
    // Add click handler
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', `Level ${level.id}${!level.unlocked ? ' - Locked' : rank ? ` - Best Rank: ${rank}` : ''} - Target Score: ${targetScore}`);
    
    if (level.unlocked) {
        div.style.cursor = 'pointer';
        div.id = `levelItem_${level.id}`;
        div.setAttribute('tabindex', '0');
        
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(div, () => {
                console.log(`[Button] Level Select clicked: ${level.id}`);
                selectLevel(level.id);
            });
        } else {
            // Fallback
            div.addEventListener('click', () => {
                selectLevel(level.id);
            });
            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectLevel(level.id);
                }
            });
        }
    } else {
        div.style.cursor = 'not-allowed';
        div.title = 'Complete previous levels to unlock';
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    }
    
    return div;
}

// Select and start a level
function selectLevel(levelId) {
    if (!window.canPlayLevel || !window.canPlayLevel(levelId)) {
        return;
    }
    
    // Close level select modal
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    // Hide mode select screen
    if (window.hideModeSelect) {
        window.hideModeSelect();
    }
    
    // Set level and start game
    if (window.setLevel) {
        window.setLevel(levelId);
    }
    
    // Start classic mode
    if (window.startClassicMode) {
        window.startClassicMode();
    }
}

// Show level select modal
function showLevelSelect() {
    // Refresh level list
    if (window.loadLevelProgression) {
        window.loadLevelProgression();
    }
    
    renderLevelSelect();
    
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Hide level select modal
function hideLevelSelect() {
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Update level select after unlocking
function updateLevelSelect() {
    renderLevelSelect();
}

// Export
window.renderLevelSelect = renderLevelSelect;
window.showLevelSelect = showLevelSelect;
window.hideLevelSelect = hideLevelSelect;
window.selectLevel = selectLevel;
window.updateLevelSelect = updateLevelSelect;

