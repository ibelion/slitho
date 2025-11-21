// ==================== MINIGAMES LOADER ====================
// Central loader for all minigames

const MINIGAMES = {
    'fruit_rush': {
        name: 'Fruit Rush',
        icon: '🍎',
        init: () => {
            if (window.initFruitRush) {
                window.initFruitRush();
            } else {
                loadScript('minigames/fruit-rush.js').then(() => window.initFruitRush());
            }
        }
    },
    'avoider': {
        name: 'Avoider',
        icon: '⚠️',
        init: () => {
            if (window.initAvoider) {
                window.initAvoider();
            } else {
                loadScript('minigames/avoider.js').then(() => window.initAvoider());
            }
        }
    },
    'precision_bite': {
        name: 'Precision Bite',
        icon: '🎯',
        init: () => {
            if (window.initPrecisionBite) {
                window.initPrecisionBite();
            } else {
                loadScript('minigames/precision-bite.js').then(() => window.initPrecisionBite());
            }
        }
    }
};

// Load script dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load minigame by ID
function loadMinigame(minigameId) {
    const minigame = MINIGAMES[minigameId];
    if (minigame) {
        minigame.init();
    } else {
        console.error(`Minigame ${minigameId} not found`);
    }
}

// Show minigames menu
function showMinigamesMenu() {
    const container = document.createElement('div');
    container.id = 'minigamesMenu';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
    `;
    
    container.innerHTML = `
        <h1 style="color: white; font-size: 2em;">Minigames</h1>
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
            ${Object.entries(MINIGAMES).map(([id, game]) => `
                <button class="btn" id="minigameBtn_${id}" 
                        style="padding: 20px; font-size: 1.2em; min-width: 200px;">
                    ${game.icon} ${game.name}
                </button>
            `).join('')}
        </div>
        <button class="btn" id="minigamesBackBtn">Back to Menu</button>
    `;
    
    // Register buttons
    Object.keys(MINIGAMES).forEach(id => {
        const btn = container.querySelector(`#minigameBtn_${id}`);
        if (btn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(btn, () => {
                    console.log(`[Button] Minigame clicked: ${id}`);
                    loadMinigame(id);
                    hideMinigamesMenu();
                });
            } else {
                btn.onclick = () => {
                    loadMinigame(id);
                    hideMinigamesMenu();
                };
            }
        }
    });
    
    const backBtn = container.querySelector('#minigamesBackBtn');
    if (backBtn) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(backBtn, () => {
                console.log('[Button] Minigames Back clicked');
                hideMinigamesMenu();
            });
        } else {
            backBtn.onclick = hideMinigamesMenu;
        }
    }
    
    document.body.appendChild(container);
    
    // Add ESC key handler for closing menu
    const escHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('minigamesMenu')) {
            e.preventDefault();
            hideMinigamesMenu();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function hideMinigamesMenu() {
    const menu = document.getElementById('minigamesMenu');
    if (menu) {
        // Clean up button handlers before removing
        const buttons = menu.querySelectorAll('button');
        buttons.forEach(btn => {
            if (window.UnifiedButtonHandler && btn.id) {
                // UnifiedButtonHandler will clean up automatically when element is removed
            }
        });
        menu.remove();
    }
}

// Export
window.loadMinigame = loadMinigame;
window.showMinigamesMenu = showMinigamesMenu;
window.hideMinigamesMenu = hideMinigamesMenu;
window.MINIGAMES = MINIGAMES;

