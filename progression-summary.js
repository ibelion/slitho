// ==================== PROGRESSION SUMMARY SCREEN ====================
// Displays run results, XP gained, level ups, and new unlocks

function showProgressionSummary(runData) {
    const summaryModal = document.getElementById('progressionSummary');
    const summaryContent = document.getElementById('progressionSummaryContent');
    if (!summaryModal || !summaryContent) return;
    
    // Calculate rewards
    const rewards = window.calculateRunRewards(
        runData.finalScore || 0,
        runData.levelReached || 1,
        runData.fruitsEaten || 0,
        runData.distanceTraveled || 0,
        runData.bossDefeated || false,
        runData.missionCompleted || false
    );
    
    // Get previous level
    const previousLevel = window.playerStats.level;
    
    // Apply rewards
    window.applyRunRewards(rewards);
    
    // Check for level up
    const leveledUp = window.playerStats.level > previousLevel;
    
    // Build summary HTML
    let html = `
        <div style="text-align: center;">
            <h2 style="margin-bottom: 20px;">Run Complete!</h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin-bottom: 15px;">Score</h3>
                <div style="font-size: 2em; color: var(--snake-color); font-weight: bold;">${runData.finalScore || 0}</div>
                <p style="color: var(--text-secondary); margin-top: 5px;">Level Reached: ${runData.levelReached || 1}</p>
            </div>
            
            ${leveledUp ? `
                <div style="background: linear-gradient(135deg, #ffd700, #ffed4e); padding: 20px; border-radius: 8px; margin-bottom: 15px; animation: pulse 1s infinite;">
                    <h2 style="margin: 0; color: #000;">🎉 LEVEL UP! 🎉</h2>
                    <p style="margin: 5px 0 0 0; color: #000; font-size: 1.2em;">You are now Level ${window.playerStats.level}!</p>
                </div>
            ` : ''}
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin-bottom: 15px;">Rewards Earned</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="font-size: 1.5em; color: #2196f3; font-weight: bold;">+${rewards.xp} XP</div>
                        <div style="color: var(--text-secondary); font-size: 0.9em;">Experience</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="font-size: 1.5em; color: #ffd700; font-weight: bold;">+${rewards.gold} Gold</div>
                        <div style="color: var(--text-secondary); font-size: 0.9em;">Currency</div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin-bottom: 15px;">Statistics</h3>
                <div style="text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>Fruits Eaten: <strong>${runData.fruitsEaten || 0}</strong></div>
                    <div>Distance: <strong>${runData.distanceTraveled || 0}</strong> cells</div>
                    ${runData.bossDefeated ? '<div style="grid-column: 1 / -1; color: var(--snake-color);">✓ Boss Defeated!</div>' : ''}
                    ${runData.missionCompleted ? '<div style="grid-column: 1 / -1; color: var(--snake-color);">✓ Mission Completed!</div>' : ''}
                </div>
            </div>
            
            ${checkNewUnlocks() ? `
                <div style="background: linear-gradient(135deg, #9c27b0, #e91e63); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 10px 0;">🔓 New Unlocks Available!</h3>
                    <div id="newUnlocksList" style="text-align: left;"></div>
                </div>
            ` : ''}
            
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                <h3 style="margin-bottom: 10px;">Progress to Next Level</h3>
                <div style="background: rgba(0,0,0,0.3); border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 5px;">
                    <div id="summaryProgressBar" style="background: linear-gradient(90deg, var(--snake-color), var(--btn-bg)); height: 100%; transition: width 0.5s ease; width: 0%;"></div>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    <span id="summaryProgressText">0 / 0 XP</span>
                </div>
            </div>
        </div>
    `;
    
    summaryContent.innerHTML = html;
    
    // Update progress bar
    setTimeout(() => {
        const progressBar = document.getElementById('summaryProgressBar');
        const progressText = document.getElementById('summaryProgressText');
        if (progressBar && progressText) {
            const xpNeeded = window.getXPForLevel(window.playerStats.level);
            const progressPercent = (window.playerStats.xp / xpNeeded) * 100;
            progressBar.style.width = `${progressPercent}%`;
            progressText.textContent = `${Math.floor(window.playerStats.xp)} / ${xpNeeded} XP`;
        }
    }, 100);
    
    // Show new unlocks
    if (checkNewUnlocks()) {
        showNewUnlocks();
    }
    
    // Show modal
    summaryModal.style.display = 'flex';
    summaryModal.classList.add('show');
    
    // Close button handler (prevent duplicate listeners)
    const closeBtn = document.getElementById('progressionSummaryClose');
    if (closeBtn && !closeBtn._listenerRegistered) {
        const handler = () => {
            console.log('[Button] Progression Summary Close clicked');
            summaryModal.style.display = 'none';
            summaryModal.classList.remove('show');
            if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.closeModal) {
                window.UnifiedButtonHandler.closeModal(summaryModal);
            }
        };
        
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(closeBtn, handler);
        } else {
            closeBtn.onclick = handler;
        }
        closeBtn._listenerRegistered = true;
    }
}

function checkNewUnlocks() {
    // Check if any new items are now unlocked
    const items = Object.values(window.ITEMS || {});
    return items.some(item => {
        if (window.isItemOwned(item.id)) return false;
        return window.unlockCheck(item);
    });
}

function showNewUnlocks() {
    const unlocksList = document.getElementById('newUnlocksList');
    if (!unlocksList) return;
    
    const items = Object.values(window.ITEMS || {})
        .filter(item => {
            if (window.isItemOwned(item.id)) return false;
            return window.unlockCheck(item);
        });
    
    if (items.length === 0) return;
    
    unlocksList.innerHTML = items.slice(0, 5).map(item => {
        const rarity = window.ITEM_RARITIES[item.rarity];
        return `<div style="margin: 5px 0;">• <strong style="color: ${rarity.color};">${item.name}</strong> - ${item.description}</div>`;
    }).join('');
    
    if (items.length > 5) {
        unlocksList.innerHTML += `<div style="margin-top: 10px; color: var(--text-secondary);">+${items.length - 5} more items unlocked!</div>`;
    }
}

// Export
window.showProgressionSummary = showProgressionSummary;

