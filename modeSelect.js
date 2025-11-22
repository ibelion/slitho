// ==================== MODE SELECT SYSTEM - REBUILT ====================

const ModeSelect = {
    modes: [
        {
            id: 'classic',
            name: 'Classic Mode',
            icon: '🎮',
            difficulty: 'Normal',
            description: 'Progress through levels with increasing difficulty',
            initFunction: 'initClassicMode'
        },
        {
            id: 'endless',
            name: 'Endless Mode',
            icon: '∞',
            difficulty: 'Hard',
            description: 'Survive as long as possible with increasing speed',
            initFunction: 'initEndlessMode'
        },
        {
            id: 'procedural',
            name: 'Procedural Mode',
            icon: '🌍',
            difficulty: 'Variable',
            description: 'Generate random terrain with customizable settings',
            initFunction: 'initProceduralMode'
        },
        {
            id: 'boss',
            name: 'Boss Mode',
            icon: '👹',
            difficulty: 'Very Hard',
            description: 'Face off against powerful boss enemies',
            initFunction: 'initBossMode'
        },
        {
            id: 'minigame_fruit_rush',
            name: 'Fruit Rush',
            icon: '🍎',
            difficulty: 'Easy',
            description: 'Quick minigame: Fruit Rush',
            isMinigame: true
        },
        {
            id: 'minigame_avoider',
            name: 'Avoider',
            icon: '⚠️',
            difficulty: 'Easy',
            description: 'Quick minigame: Avoider',
            isMinigame: true
        },
        {
            id: 'minigame_precision_bite',
            name: 'Precision Bite',
            icon: '🎯',
            difficulty: 'Easy',
            description: 'Quick minigame: Precision Bite',
            isMinigame: true
        }
    ],
    
    init() {
        this.renderModes();
    },
    
    renderModes() {
        const container = document.getElementById('modeCardsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.modes.forEach(mode => {
            const card = document.createElement('div');
            card.className = 'mode-card';
            
            const difficultyClass = mode.difficulty.toLowerCase().replace(/\s+/g, '-');
            
            card.innerHTML = `
                <div class="mode-card-header">
                    <span class="mode-card-icon">${mode.icon}</span>
                    <div class="mode-card-title-group">
                        <h3 class="mode-card-title">${mode.name}</h3>
                        <span class="mode-card-difficulty ${difficultyClass}">${mode.difficulty}</span>
                    </div>
                </div>
                <p class="mode-card-description">${mode.description}</p>
                <button class="mode-card-play-btn" data-mode-id="${mode.id}">Play</button>
            `;
            
            container.appendChild(card);
        });
        
        // Add event listeners
        container.querySelectorAll('.mode-card-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modeId = e.target.getAttribute('data-mode-id');
                this.handleModeClick(modeId);
            });
        });
    },
    
    handleModeClick(modeId) {
        const mode = this.modes.find(m => m.id === modeId);
        if (!mode) return;
        
        if (mode.isMinigame) {
            const minigameId = modeId.replace('minigame_', '');
            if (window.loadMinigame) {
                window.loadMinigame(minigameId);
            }
        } else {
            const initFunc = window[mode.initFunction];
            if (typeof initFunc === 'function') {
                initFunc();
            } else {
                console.error('Init function not found:', mode.initFunction);
            }
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModeSelect.init());
} else {
    ModeSelect.init();
}
