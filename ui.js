// ==================== UI MODULE ====================
// All UI menus, event handlers, and display logic
// NO gameplay logic - only UI presentation and user interaction

// Selected world for filtering (temporary UI state)
let selectedWorld = null;

// Initialize UI system
function initializeUI() {
    setupEventListeners();
    createModals();
    
    // Add Phase-2 UI elements
    setTimeout(() => {
        addEasingModeSelector();
        addGhostReplayToggle();
    }, 100);
}

// Setup all event listeners - Use UnifiedButtonHandler if available
function setupEventListeners() {
    // Buttons are registered by ButtonRegistry, but we provide fallback support here
    // Only register if UnifiedButtonHandler is not available
    if (!window.UnifiedButtonHandler) {
        // Level Select Button
        const levelSelectBtn = document.getElementById('levelSelectBtn');
        if (levelSelectBtn && !levelSelectBtn.onclick) {
            levelSelectBtn.addEventListener('click', () => {
                showLevelSelect();
            });
        }
        
        // World Select Button
        const worldSelectBtn = document.getElementById('worldSelectBtn');
        if (worldSelectBtn && !worldSelectBtn.onclick) {
            worldSelectBtn.addEventListener('click', () => {
                showWorldSelect();
            });
        }
        
        // Skill Tree Button
        const skillTreeBtn = document.getElementById('skillTreeBtn');
        if (skillTreeBtn && !skillTreeBtn.onclick) {
            skillTreeBtn.addEventListener('click', () => {
                showSkillTree();
            });
        }
        
        // Level Select Modal Close
        const levelSelectClose = document.getElementById('levelSelectClose');
        if (levelSelectClose && !levelSelectClose.onclick) {
            levelSelectClose.addEventListener('click', () => {
                hideLevelSelect();
            });
        }
        
        // World Select Modal Close
        const worldSelectClose = document.getElementById('worldSelectClose');
        if (worldSelectClose && !worldSelectClose.onclick) {
            worldSelectClose.addEventListener('click', () => {
                hideWorldSelect();
            });
        }
        
        // Skill Tree Modal Close
        const skillTreeClose = document.getElementById('skillTreeClose');
        if (skillTreeClose && !skillTreeClose.onclick) {
            skillTreeClose.addEventListener('click', () => {
                hideSkillTree();
            });
        }
    }
}

// Create modal elements if they don't exist
function createModals() {
    // S-Rank Results Modal
    if (!document.getElementById('sRankResultsModal')) {
        const modal = document.createElement('div');
        modal.id = 'sRankResultsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-body">
                    <div id="sRankResultsContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // World Select Modal
    if (!document.getElementById('worldSelectModal')) {
        const modal = document.createElement('div');
        modal.id = 'worldSelectModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Select World</h2>
                    <button class="modal-close" id="worldSelectClose">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="worldSelectContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Skill Tree Modal
    if (!document.getElementById('skillTreeModal')) {
        const modal = document.createElement('div');
        modal.id = 'skillTreeModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>Skill Tree</h2>
                    <button class="modal-close" id="skillTreeClose">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="skillTreeContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// ==================== LEVEL SELECT UI ====================

function renderLevelSelect() {
    const grid = document.getElementById('levelSelectGrid');
    if (!grid || !window.Progression) return;
    
    let allLevels = window.Progression.getAllLevels();
    
    // Filter by selected world
    if (selectedWorld && window.Progression.getLevelsForWorld) {
        const worldLevels = window.Progression.getLevelsForWorld(selectedWorld);
        allLevels = allLevels.filter(level => worldLevels.includes(level.id));
    }
    
    if (allLevels.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No levels available</p>';
        return;
    }
    
    grid.innerHTML = '';
    
    // World filter header
    if (selectedWorld && window.Progression.getAllWorlds) {
        const world = window.Progression.getAllWorlds().find(w => w.id === selectedWorld);
        if (world) {
            const header = document.createElement('div');
            header.style.cssText = 'grid-column: 1 / -1; padding: 15px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 15px; text-align: center;';
            header.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">${world.name}</h3>
                <button class="btn" onclick="window.UI.clearWorldFilter(); window.UI.renderLevelSelect();" style="font-size: 0.9em;">
                    Show All Worlds
                </button>
            `;
            grid.appendChild(header);
        }
    }
    
    allLevels.forEach(level => {
        const item = createLevelItem(level);
        grid.appendChild(item);
    });
}

function createLevelItem(level) {
    const div = document.createElement('div');
    div.className = 'level-item';
    
    if (!level.unlocked) {
        div.classList.add('locked');
    }
    if (level.newlyUnlocked) {
        div.classList.add('newly-unlocked');
    }
    
    // Get level config
    let targetScore = '?';
    if (window.levelConfigs) {
        const config = window.levelConfigs.find(c => c.level === level.id);
        if (config) targetScore = config.targetScore;
    }
    
    // Get rank
    const rank = window.Progression ? window.Progression.getRank(level.id) : null;
    const rankColor = rank ? window.Progression.getRankColor(rank) : null;
    
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
    
    if (level.unlocked) {
        div.style.cursor = 'pointer';
        div.id = `levelItem_${level.id}`;
        div.setAttribute('tabindex', '0');
        
        // Use UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(div, () => {
                console.log(`[Button] Level Item clicked: ${level.id}`);
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

function selectLevel(levelId) {
    if (!window.Progression || !window.Progression.isLevelUnlocked(levelId)) {
        return;
    }
    
    hideLevelSelect();
    
    if (window.Game && window.Game.setLevel) {
        window.Game.setLevel(levelId);
    }
}

function showLevelSelect() {
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
        renderLevelSelect();
        modal.classList.add('show');
    }
}

function hideLevelSelect() {
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== WORLD SELECT UI ====================

function renderWorldSelect() {
    const container = document.getElementById('worldSelectContent');
    if (!container || !window.Progression) return;
    
    const worlds = window.Progression.getAllWorlds();
    
    container.innerHTML = `
        <div class="world-select-info" style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
            <p style="margin: 0; color: var(--text-secondary); text-align: center;">
                Select a world to view its levels. Complete worlds to unlock new ones!
            </p>
        </div>
        <div class="world-grid" id="worldSelectGrid"></div>
    `;
    
    const grid = document.getElementById('worldSelectGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    worlds.forEach(world => {
        const element = createWorldElement(world);
        grid.appendChild(element);
    });
}

function createWorldElement(world) {
    const div = document.createElement('div');
    div.className = 'world-card';
    
    if (!world.unlocked) div.classList.add('locked');
    if (world.completed) div.classList.add('completed');
    
    const unlockedLevels = world.levels.filter(levelId => 
        window.Progression.isLevelUnlocked(levelId)
    ).length;
    
    div.innerHTML = `
        <div class="world-card-content">
            ${!world.unlocked ? '<div class="world-lock-icon">🔒</div>' : ''}
            ${world.completed ? '<div class="world-complete-badge">✓</div>' : ''}
            <div class="world-number">${world.name}</div>
            <div class="world-info">
                <div>Levels ${world.startLevel}-${world.endLevel}</div>
                <div style="margin-top: 5px; font-size: 0.9em; color: var(--text-secondary);">
                    ${unlockedLevels} / ${world.levels.length} unlocked
                </div>
            </div>
        </div>
    `;
    
    if (world.unlocked) {
        div.style.cursor = 'pointer';
        div.id = `worldItem_${world.id}`;
        div.setAttribute('tabindex', '0');
        
        // Use UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(div, () => {
                console.log(`[Button] World Item clicked: ${world.id}`);
                selectWorld(world.id);
            });
        } else {
            // Fallback
            div.addEventListener('click', () => {
                selectWorld(world.id);
            });
            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectWorld(world.id);
                }
            });
        }
    } else {
        div.style.cursor = 'not-allowed';
        div.title = 'Complete previous world to unlock';
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    }
    
    return div;
}

function selectWorld(worldId) {
    if (!window.Progression || !window.Progression.isWorldUnlocked(worldId)) {
        return;
    }
    
    selectedWorld = worldId;
    hideWorldSelect();
    showLevelSelect();
}

function showWorldSelect() {
    const modal = document.getElementById('worldSelectModal');
    if (modal) {
        if (window.Progression) {
            window.Progression.validate();
        }
        renderWorldSelect();
        modal.classList.add('show');
    }
}

function hideWorldSelect() {
    const modal = document.getElementById('worldSelectModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== SKILL TREE UI ====================

function renderSkillTree() {
    const container = document.getElementById('skillTreeContent');
    if (!container || !window.SkillTree) return;
    
    const skills = window.SkillTree.getAllSkills();
    const skillPoints = window.SkillTree.getSkillPoints();
    
    const pointsDisplay = document.getElementById('skillPointsDisplay');
    if (pointsDisplay) {
        pointsDisplay.textContent = skillPoints.toFixed(1);
    }
    
    container.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
            <div style="font-size: 1.5em; color: var(--snake-color); font-weight: bold;">
                Skill Points: <span id="skillPointsDisplay">${skillPoints.toFixed(1)}</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                Earn skill points by achieving S-Rank (1 SP) or A-Rank (0.5 SP) on levels
            </div>
        </div>
        <div class="skill-tree-grid" id="skillTreeGrid"></div>
    `;
    
    const grid = document.getElementById('skillTreeGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    skills.forEach(skill => {
        const element = createSkillElement(skill, skillPoints);
        grid.appendChild(element);
    });
}

function createSkillElement(skill, availablePoints) {
    const div = document.createElement('div');
    div.className = 'skill-node';
    
    const isUnlocked = window.SkillTree.isSkillUnlocked(skill.id);
    const isPurchased = window.SkillTree.isSkillPurchased(skill.id);
    const canAfford = availablePoints >= skill.cost;
    
    if (!isUnlocked) div.classList.add('locked');
    if (isPurchased) div.classList.add('purchased');
    if (isUnlocked && !isPurchased && canAfford) div.classList.add('affordable');
    
    div.innerHTML = `
        <div class="skill-icon">${skill.icon}</div>
        <div class="skill-name">${skill.name}</div>
        <div class="skill-description">${skill.description}</div>
        ${!isUnlocked ? `
            <div class="skill-requirement">
                Unlocks at Level ${skill.unlockLevel}
                ${skill.unlockSRank ? `, ${skill.unlockSRank} S-Ranks` : ''}
            </div>
        ` : `
            <div class="skill-cost">
                ${isPurchased ? 
                    '<span style="color: var(--snake-color);">✓ Purchased</span>' : 
                    `Cost: ${skill.cost} SP`
                }
            </div>
        `}
    `;
    
    div.id = `skillNode_${skill.id}`;
    div.setAttribute('role', 'button');
    
    if (isUnlocked && !isPurchased && canAfford) {
        div.style.cursor = 'pointer';
        div.setAttribute('tabindex', '0');
        
        // Use UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(div, () => {
                console.log(`[Button] Skill Purchase clicked: ${skill.id}`);
                if (window.SkillTree && window.SkillTree.purchaseSkill) {
                    if (window.SkillTree.purchaseSkill(skill.id)) {
                        renderSkillTree();
                    }
                }
            });
        } else {
            // Fallback
            div.addEventListener('click', () => {
                if (window.SkillTree && window.SkillTree.purchaseSkill) {
                    if (window.SkillTree.purchaseSkill(skill.id)) {
                        renderSkillTree();
                    }
                }
            });
        }
    } else if (isUnlocked && !isPurchased && !canAfford) {
        div.style.cursor = 'not-allowed';
        div.title = `Need ${(skill.cost - availablePoints).toFixed(1)} more skill points`;
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    } else if (!isUnlocked) {
        div.style.cursor = 'not-allowed';
        div.title = `Unlocks at Level ${skill.unlockLevel}`;
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    }
    
    return div;
}

function showSkillTree() {
    const modal = document.getElementById('skillTreeModal');
    if (modal) {
        if (window.SkillTree) {
            window.SkillTree.updateSkillUnlocks();
        }
        renderSkillTree();
        modal.classList.add('show');
    }
}

function hideSkillTree() {
    const modal = document.getElementById('skillTreeModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== S-RANK RESULTS UI ====================

function showSRankResults(levelId, results) {
    const modal = document.getElementById('sRankResultsModal');
    if (!modal) return;
    
    const content = document.getElementById('sRankResultsContent');
    if (!content) return;
    
    const rankColor = window.Progression ? window.Progression.getRankColor(results.rank) : '#95a5a6';
    const bestTime = results.bestTime || results.time;
    const isNewBest = results.bestTime === results.time && results.bestTime !== null;
    
    // Award skill points
    if (window.SkillTree) {
        window.SkillTree.awardSkillPoints(results.rank);
    }
    
    content.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 4em; margin-bottom: 20px; color: ${rankColor}; font-weight: bold;">
                ${results.rank}-RANK
            </div>
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin-bottom: 15px;">Level ${levelId} Complete!</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="font-size: 1.2em; color: var(--text-secondary); margin-bottom: 5px;">Time</div>
                        <div style="font-size: 1.8em; color: var(--snake-color); font-weight: bold;">
                            ${results.time.toFixed(2)}s
                        </div>
                    </div>
                    <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="font-size: 1.2em; color: var(--text-secondary); margin-bottom: 5px;">Target</div>
                        <div style="font-size: 1.8em; color: var(--text-primary); font-weight: bold;">
                            ${results.targetTime}s
                        </div>
                    </div>
                </div>
                <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                    <div style="font-size: 1.2em; color: var(--text-secondary); margin-bottom: 5px;">
                        Best Time ${isNewBest ? '<span style="color: #ffd700; margin-left: 10px;">⭐ NEW BEST!</span>' : ''}
                    </div>
                    <div style="font-size: 1.5em; color: #ffd700; font-weight: bold;">
                        ${bestTime.toFixed(2)}s
                    </div>
                </div>
                ${results.rank === 'S' ? `
                    <div style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1)); border-radius: 8px; border: 2px solid #ffd700;">
                        <div style="color: #ffd700; font-weight: bold;">🎉 S-RANK BONUS!</div>
                        <div style="color: var(--text-secondary); margin-top: 5px;">+1 Skill Point earned!</div>
                    </div>
                ` : results.rank === 'A' ? `
                    <div style="margin-top: 15px; padding: 15px; background: rgba(255, 107, 107, 0.2); border-radius: 8px; border: 2px solid #ff6b6b;">
                        <div style="color: #ff6b6b; font-weight: bold;">A-RANK BONUS!</div>
                        <div style="color: var(--text-secondary); margin-top: 5px;">+0.5 Skill Points earned!</div>
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn" id="sRankContinueBtn" style="flex: 1;">Continue</button>
                <button class="btn" id="sRankRetryBtn" style="flex: 1; background: #666;">Retry Level</button>
            </div>
        </div>
    `;
    
    // Register S-Rank result buttons
    const continueBtn = document.getElementById('sRankContinueBtn');
    const retryBtn = document.getElementById('sRankRetryBtn');
    
    if (continueBtn) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(continueBtn, () => {
                console.log('[Button] S-Rank Continue clicked');
                modal.classList.remove('show');
                showLevelSelect();
            });
        } else {
            continueBtn.onclick = () => {
                modal.classList.remove('show');
                showLevelSelect();
            };
        }
    }
    
    if (retryBtn) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(retryBtn, () => {
                console.log('[Button] S-Rank Retry clicked');
                modal.classList.remove('show');
                if (window.Game && window.Game.setLevel) {
                    window.Game.setLevel(levelId);
                }
            });
        } else {
            retryBtn.onclick = () => {
                modal.classList.remove('show');
                if (window.Game && window.Game.setLevel) {
                    window.Game.setLevel(levelId);
                }
            };
        }
    }
    
    modal.classList.add('show');
}

// Update level timer display
function updateLevelTimerDisplay() {
    const timerElement = document.getElementById('levelTimerDisplay');
    if (!timerElement || !window.Progression) return;
    
    const currentTime = window.Progression.getCurrentLevelTime();
    const currentLevel = window.StateManager ? window.StateManager.getCurrentLevel() : 1;
    const targetTime = window.Progression.getTargetTime(currentLevel);
    
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    
    // Color code based on target time
    const ratio = currentTime / targetTime;
    if (ratio <= 1.0) {
        timerElement.style.color = '#ffd700';
    } else if (ratio <= 1.25) {
        timerElement.style.color = '#ff6b6b';
    } else if (ratio <= 1.75) {
        timerElement.style.color = '#4ecdc4';
    } else {
        timerElement.style.color = '#95a5a6';
    }
}

// Add easing mode selector to settings
function addEasingModeSelector() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal || !window.SnakeAnimator) return;
    
    // Check if already added
    if (document.getElementById('easingModeSelector')) return;
    
    const settingItem = document.createElement('div');
    settingItem.className = 'setting-item';
    settingItem.innerHTML = `
        <label>Animation Easing:</label>
        <select id="easingModeSelector">
            ${window.SnakeAnimator.getAvailableEasingModes().map(mode => 
                `<option value="${mode}">${mode}</option>`
            ).join('')}
        </select>
    `;
    
    // Find settings container or append to modal body
    const modalBody = settingsModal.querySelector('.modal-body') || settingsModal;
    modalBody.appendChild(settingItem);
    
    // Set current value
    const selector = document.getElementById('easingModeSelector');
    if (selector) {
        selector.value = window.SnakeAnimator.getEasingMode();
        selector.addEventListener('change', (e) => {
            window.SnakeAnimator.setEasingMode(e.target.value);
        });
    }
}

// Add ghost replay toggle to settings
function addGhostReplayToggle() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal || !window.GhostReplay) return;
    
    // Check if already added
    if (document.getElementById('ghostReplayToggle')) return;
    
    const settingItem = document.createElement('div');
    settingItem.className = 'setting-item';
    settingItem.innerHTML = `
        <label>
            <input type="checkbox" id="ghostReplayToggle">
            <span>Enable Ghost System (recording + playback)</span>
        </label>
        <p style="margin-top: 5px; font-size: 0.85em; color: var(--text-secondary);">
            When disabled, ghost runs are neither recorded nor played back. This does not affect core gameplay.
        </p>
    `;
    
    // Find settings container or append to modal body
    const modalBody = settingsModal.querySelector('.modal-body') || settingsModal;
    modalBody.appendChild(settingItem);
    
    // Set current value
    const toggle = document.getElementById('ghostReplayToggle');
    if (toggle) {
        // Prefer centralized system flag if available; fallback to prior setting
        let enabled = true;
        if (window.GhostReplay && typeof window.GhostReplay.isSystemEnabled === 'function') {
            enabled = window.GhostReplay.isSystemEnabled();
        } else {
            const saved = localStorage.getItem('showGhostReplay');
            enabled = saved === 'true';
        }
        toggle.checked = enabled;

        toggle.addEventListener('change', (e) => {
            const on = e.target.checked;
            // Update centralized system toggle
            if (window.GhostReplay && typeof window.GhostReplay.setSystemEnabled === 'function') {
                window.GhostReplay.setSystemEnabled(on);
            }
            // Preserve legacy key for compatibility with any existing logic
            localStorage.setItem('showGhostReplay', on.toString());
            if (!on && window.GhostReplay) {
                window.GhostReplay.stopPlayback();
            } else if (on && window.StateManager && window.GhostReplay) {
                const currentLevel = window.StateManager.getCurrentLevel();
                window.GhostReplay.startPlayback(currentLevel);
            }
        });
    }
}

// Public API
const UI = {
    initialize: initializeUI,
    renderLevelSelect,
    showLevelSelect,
    hideLevelSelect,
    renderWorldSelect,
    showWorldSelect,
    hideWorldSelect,
    renderSkillTree,
    showSkillTree,
    hideSkillTree,
    showSRankResults,
    updateLevelTimerDisplay,
    clearWorldFilter: () => { selectedWorld = null; }
};

// Export
window.UI = UI;

