// ==================== S-RANK UI ====================
// Results screen and rank display

// Show S-Rank results screen
function showSRankResults(levelId, results) {
    const modal = document.getElementById('sRankResultsModal');
    if (!modal) {
        createSRankResultsModal();
    }
    
    const resultsModal = document.getElementById('sRankResultsModal');
    const content = document.getElementById('sRankResultsContent');
    if (!content) return;
    
    const rankColor = window.getRankColor ? window.getRankColor(results.rank) : '#95a5a6';
    const bestTime = results.bestTime || results.time;
    const isNewBest = results.bestTime === results.time && results.bestTime !== null;
    
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
                        Best Time
                        ${isNewBest ? '<span style="color: #ffd700; margin-left: 10px;">⭐ NEW BEST!</span>' : ''}
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
                ` : ''}
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn" id="sRankContinueBtn" style="flex: 1;">
                    Continue
                </button>
                <button class="btn" id="sRankRetryBtn" style="flex: 1; background: #666;">
                    Retry Level
                </button>
            </div>
        </div>
    `;
    
    // Event handlers
    document.getElementById('sRankContinueBtn').onclick = () => {
        resultsModal.classList.remove('show');
        if (window.showLevelSelect) {
            window.showLevelSelect();
        }
    };
    
    document.getElementById('sRankRetryBtn').onclick = () => {
        resultsModal.classList.remove('show');
        if (window.setLevel && window.startClassicMode) {
            window.setLevel(levelId);
            window.startClassicMode();
        }
    };
    
    resultsModal.classList.add('show');
}

// Create S-Rank results modal
function createSRankResultsModal() {
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

// Update level timer display during gameplay
function updateLevelTimerDisplay() {
    const timerElement = document.getElementById('levelTimerDisplay');
    if (!timerElement) return;
    
    const currentTime = window.getCurrentLevelTime ? window.getCurrentLevelTime() : 0;
    const targetTime = window.getTargetTime && window.currentLevel ? 
        window.getTargetTime(window.currentLevel) : 60;
    
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    
    // Color code based on target time
    const ratio = currentTime / targetTime;
    if (ratio <= 1.0) {
        timerElement.style.color = '#ffd700'; // Gold for S-Rank pace
    } else if (ratio <= 1.25) {
        timerElement.style.color = '#ff6b6b'; // Red for A-Rank pace
    } else if (ratio <= 1.75) {
        timerElement.style.color = '#4ecdc4'; // Cyan for B-Rank pace
    } else {
        timerElement.style.color = '#95a5a6'; // Gray for C-Rank pace
    }
}

// Export
window.showSRankResults = showSRankResults;
window.updateLevelTimerDisplay = updateLevelTimerDisplay;
window.createSRankResultsModal = createSRankResultsModal;

