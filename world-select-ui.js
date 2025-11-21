// ==================== WORLD SELECT UI ====================
// Renders world selection screen

// Render world select
function renderWorldSelect() {
    const container = document.getElementById('worldSelectContent');
    if (!container) return;
    
    const worlds = window.getAllWorlds ? window.getAllWorlds() : [];
    
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
        const worldElement = createWorldElement(world);
        grid.appendChild(worldElement);
    });
}

// Create world element
function createWorldElement(world) {
    const div = document.createElement('div');
    div.className = 'world-card';
    
    if (!world.unlocked) {
        div.classList.add('locked');
    }
    
    if (world.completed) {
        div.classList.add('completed');
    }
    
    const levelCount = world.levels.length;
    const unlockedLevels = world.levels.filter(levelId => 
        window.isLevelUnlocked ? window.isLevelUnlocked(levelId) : false
    ).length;
    
    div.innerHTML = `
        <div class="world-card-content">
            ${!world.unlocked ? '<div class="world-lock-icon">🔒</div>' : ''}
            ${world.completed ? '<div class="world-complete-badge">✓</div>' : ''}
            <div class="world-number">${world.name}</div>
            <div class="world-info">
                <div>Levels ${world.startLevel}-${world.endLevel}</div>
                <div style="margin-top: 5px; font-size: 0.9em; color: var(--text-secondary);">
                    ${unlockedLevels} / ${levelCount} unlocked
                </div>
            </div>
        </div>
    `;
    
    // Add click handler
    if (world.unlocked) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            selectWorld(world.id);
        });
        
        // Keyboard support
        div.setAttribute('tabindex', '0');
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectWorld(world.id);
            }
        });
    } else {
        div.style.cursor = 'not-allowed';
        div.title = 'Complete previous world to unlock';
    }
    
    return div;
}

// Select a world and show its levels
function selectWorld(worldId) {
    if (!window.isWorldUnlocked || !window.isWorldUnlocked(worldId)) {
        return;
    }
    
    // Store selected world
    window.selectedWorld = worldId;
    
    // Hide world select
    hideWorldSelect();
    
    // Show level select filtered to this world
    if (window.showLevelSelect) {
        window.showLevelSelect();
    }
}

// Show world select modal
function showWorldSelect() {
    const modal = document.getElementById('worldSelectModal');
    if (!modal) {
        createWorldSelectModal();
    }
    
    const worldSelectModal = document.getElementById('worldSelectModal');
    if (worldSelectModal) {
        // Update world unlocks
        if (window.checkWorldUnlocks) {
            window.checkWorldUnlocks();
        }
        renderWorldSelect();
        worldSelectModal.classList.add('show');
    }
}

// Hide world select modal
function hideWorldSelect() {
    const modal = document.getElementById('worldSelectModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Create world select modal
function createWorldSelectModal() {
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
    
    // Close button
    const closeBtn = document.getElementById('worldSelectClose');
    if (closeBtn) {
        closeBtn.onclick = hideWorldSelect;
    }
}

// Export
window.renderWorldSelect = renderWorldSelect;
window.showWorldSelect = showWorldSelect;
window.hideWorldSelect = hideWorldSelect;
window.selectWorld = selectWorld;

