// ==================== BUTTON REGISTRY ====================
// Centralized registration of all buttons in the game
// Ensures all buttons work consistently with unified handler

const ButtonRegistry = {
    // Registered buttons
    registeredButtons: new Map(),
    
    // Initialize - register all buttons
    init: function() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.registerAllButtons();
            });
        } else {
            // DOM already loaded, register immediately
            setTimeout(() => this.registerAllButtons(), 100);
        }
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('ButtonRegistry', this);
        }
        
        window.ButtonRegistry = this;
    },
    
    // Register all buttons in the game
    registerAllButtons: function() {
        console.log('[ButtonRegistry] Registering all buttons...');
        
        // Mode Select Buttons
        this.registerModeSelectButtons();
        
        // Main Game Screen Buttons
        this.registerGameScreenButtons();
        
        // Modal Buttons
        this.registerModalButtons();
        
        // Shop & Inventory Buttons
        this.registerShopInventoryButtons();
        
        // Skill Tree Buttons
        this.registerSkillTreeButtons();
        
        // Level Select Buttons
        this.registerLevelSelectButtons();
        
        // World Map & Minigames
        this.registerWorldMapButtons();
        
        // Settings & Options
        this.registerSettingsButtons();
        
        // Level Editor
        this.registerLevelEditorButtons();
        
        // Control Pad
        this.registerControlPadButtons();
        
        console.log(`[ButtonRegistry] Registered ${this.registeredButtons.size} buttons`);
    },
    
    // Register mode select buttons (main menu buttons)
    registerModeSelectButtons: function() {
        if (!window.UnifiedButtonHandler) {
            console.warn('[ButtonRegistry] UnifiedButtonHandler not available');
            return;
        }
        
        const handler = window.UnifiedButtonHandler;

        // Helper function to safely register a button
        const registerButtonSafe = (buttonId, callback, fallbackCallback = null) => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                handler.registerButton(buttonId, () => {
                    try {
                        callback();
                    } catch (error) {
                        console.warn(`[ButtonRegistry] Error handling ${buttonId}:`, error);
                        if (fallbackCallback) {
                            try {
                                fallbackCallback();
                            } catch (fallbackError) {
                                console.error(`[ButtonRegistry] Fallback also failed for ${buttonId}:`, fallbackError);
                            }
                        }
                    }
                });
                this.registeredButtons.set(buttonId, true);
            } else {
                console.warn(`[ButtonRegistry] ${buttonId} not found in DOM`);
            }
        };

        // Game Mode Buttons
        registerButtonSafe('btn-classic', () => {
            console.log('[Button] Classic Mode clicked');
            if (typeof initClassicMode === 'function') {
                initClassicMode();
                if (typeof hideModeSelect === 'function') {
                    hideModeSelect();
                }
            } else {
                console.warn('[ButtonRegistry] initClassicMode is not available');
            }
        });

        registerButtonSafe('btn-endless', () => {
            console.log('[Button] Endless Mode clicked');
            if (typeof initEndlessMode === 'function') {
                initEndlessMode();
                if (typeof hideModeSelect === 'function') {
                    hideModeSelect();
                }
            } else {
                console.warn('[ButtonRegistry] initEndlessMode is not available');
            }
        });

        registerButtonSafe('btn-procedural', () => {
            console.log('[Button] Procedural Mode clicked');
            const modal = document.getElementById('proceduralSettingsModal');
            if (modal && typeof openModal === 'function') {
                openModal(modal);
            } else if (modal && window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                window.UnifiedButtonHandler.openModal(modal);
            } else {
                console.warn('[ButtonRegistry] Procedural settings modal or openModal not available');
            }
        });

        registerButtonSafe('btn-boss', () => {
            console.log('[Button] Boss Mode clicked');
            if (typeof initBossMode === 'function') {
                initBossMode();
                if (typeof hideModeSelect === 'function') {
                    hideModeSelect();
                }
            } else {
                console.warn('[ButtonRegistry] initBossMode is not available');
            }
        });

        // Minigames button (grouped)
        registerButtonSafe('btn-minigames', () => {
            console.log('[Button] Minigames clicked');
            // Scroll to minigame buttons or show minigames menu
            const minigameButtons = document.querySelectorAll('.main-menu-btn-minigame');
            if (minigameButtons.length > 0) {
                minigameButtons[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus first minigame button
                setTimeout(() => minigameButtons[0].focus(), 100);
            } else if (window.showMinigamesMenu && typeof window.showMinigamesMenu === 'function') {
                window.showMinigamesMenu();
            } else {
                console.warn('[ButtonRegistry] Minigame buttons or showMinigamesMenu not available');
            }
        });

        // Individual Minigame Buttons
        registerButtonSafe('minigameBtn_fruit_rush', () => {
            console.log('[Button] Fruit Rush clicked');
            if (window.loadMinigame) {
                window.loadMinigame('fruit_rush');
            } else {
                console.warn('[ButtonRegistry] window.loadMinigame is not available');
            }
        });

        registerButtonSafe('minigameBtn_avoider', () => {
            console.log('[Button] Avoider clicked');
            if (window.loadMinigame) {
                window.loadMinigame('avoider');
            } else {
                console.warn('[ButtonRegistry] window.loadMinigame is not available');
            }
        });

        registerButtonSafe('minigameBtn_precision_bite', () => {
            console.log('[Button] Precision Bite clicked');
            if (window.loadMinigame) {
                window.loadMinigame('precision_bite');
            } else {
                console.warn('[ButtonRegistry] window.loadMinigame is not available');
            }
        });

        // Progression & Content Buttons
        registerButtonSafe('btn-level-select', () => {
            console.log('[Button] Level Select clicked');
            const modal = document.getElementById('levelSelectModal');
            if (window.showLevelSelect && typeof window.showLevelSelect === 'function') {
                window.showLevelSelect();
            } else if (modal && typeof openModal === 'function') {
                openModal(modal);
            } else if (modal && window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                window.UnifiedButtonHandler.openModal(modal);
            } else {
                console.warn('[ButtonRegistry] Level select modal or showLevelSelect not available');
            }
        });

        registerButtonSafe('btn-shop', () => {
            console.log('[Button] Shop clicked');
            const modal = document.getElementById('shopModal');
            if (modal) {
                if (window.renderShop && typeof window.renderShop === 'function') {
                    window.renderShop();
                }
                if (typeof openModal === 'function') {
                    openModal(modal);
                } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                    window.UnifiedButtonHandler.openModal(modal);
                }
            } else {
                console.warn('[ButtonRegistry] Shop modal not found');
            }
        });

        registerButtonSafe('btn-inventory', () => {
            console.log('[Button] Inventory clicked');
            const modal = document.getElementById('inventoryModal');
            if (modal) {
                if (window.renderInventory && typeof window.renderInventory === 'function') {
                    window.renderInventory();
                }
                if (typeof openModal === 'function') {
                    openModal(modal);
                } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                    window.UnifiedButtonHandler.openModal(modal);
                }
            } else {
                console.warn('[ButtonRegistry] Inventory modal not found');
            }
        });

        registerButtonSafe('btn-missions', () => {
            console.log('[Button] Missions clicked');
            const modal = document.getElementById('missionsModal');
            if (modal) {
                if (typeof renderMissions === 'function') {
                    renderMissions();
                } else if (window.renderMissions && typeof window.renderMissions === 'function') {
                    window.renderMissions();
                }
                if (typeof openModal === 'function') {
                    openModal(modal);
                } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                    window.UnifiedButtonHandler.openModal(modal);
                }
            } else {
                console.warn('[ButtonRegistry] Missions modal not found');
            }
        });

        // Settings Buttons
        registerButtonSafe('btn-settings', () => {
            console.log('[Button] Settings clicked');
            const modal = document.getElementById('settingsModal');
            if (modal) {
                if (typeof openModal === 'function') {
                    openModal(modal);
                } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                    window.UnifiedButtonHandler.openModal(modal);
                }
            } else {
                console.warn('[ButtonRegistry] Settings modal not found');
            }
        });

        registerButtonSafe('btn-themes', () => {
            console.log('[Button] Themes clicked');
            const modal = document.getElementById('themesModal');
            if (modal) {
                if (typeof renderThemes === 'function') {
                    renderThemes();
                } else if (window.renderThemes && typeof window.renderThemes === 'function') {
                    window.renderThemes();
                }
                if (typeof openModal === 'function') {
                    openModal(modal);
                } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                    window.UnifiedButtonHandler.openModal(modal);
                }
            } else {
                console.warn('[ButtonRegistry] Themes modal not found');
            }
        });
    },
    
    // Register game screen buttons
    registerGameScreenButtons: function() {
        if (!window.UnifiedButtonHandler) return;
        
        const handler = window.UnifiedButtonHandler;
        
        // Mode Select (Home)
        handler.registerButton('modeSelectBtn', () => {
            console.log('[Button] Mode Select (Home) clicked');
            if (typeof showModeSelect === 'function') {
                showModeSelect();
            }
        });
        
        // Theme Toggle
        handler.registerButton('themeToggle', () => {
            console.log('[Button] Theme Toggle clicked');
            if (typeof toggleTheme === 'function') {
                toggleTheme();
            }
        });
        
        // Sound Toggle
        handler.registerButton('soundToggle', () => {
            console.log('[Button] Sound Toggle clicked');
            if (typeof toggleSound === 'function') {
                toggleSound();
            }
            if (!isMuted && !isAudioContextInitialized && typeof initAudioContext === 'function') {
                initAudioContext();
            }
        });
        
        // Pause
        handler.registerButton('pauseBtn', () => {
            console.log('[Button] Pause clicked');
            if (typeof togglePause === 'function') {
                togglePause();
            }
        });
        
        // Restart
        handler.registerButton('restartBtn', () => {
            console.log('[Button] Restart clicked');
            if (gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            if (window.stopGameLoop) {
                window.stopGameLoop();
            }
            if (typeof init === 'function') {
                init();
            }
        });
    },
    
    // Register modal buttons
    registerModalButtons: function() {
        if (!window.UnifiedButtonHandler) return;
        
        const handler = window.UnifiedButtonHandler;
        
        // Register all modal close buttons
        const modalCloses = [
            'settingsClose', 'themesClose', 'shopClose', 'inventoryClose',
            'missionsClose', 'levelSelectClose', 'levelEditorClose',
            'proceduralSettingsClose', 'skillTreeClose', 'worldSelectClose'
        ];
        
        modalCloses.forEach(closeId => {
            handler.registerButton(closeId, () => {
                console.log(`[Button] Modal close clicked: ${closeId}`);
                const modal = document.getElementById(closeId)?.closest('.modal');
                if (modal) {
                    if (typeof closeModal === 'function') {
                        closeModal(modal);
                    } else if (handler.closeModal) {
                        handler.closeModal(modal);
                    } else {
                        modal.classList.remove('show');
                    }
                }
            });
        });
        
        // Procedural Generate Button
        handler.registerButton('generateProceduralBtn', () => {
            console.log('[Button] Generate Procedural clicked');
            if (typeof initProceduralMode === 'function') {
                initProceduralMode();
            }
            const modal = document.getElementById('proceduralSettingsModal');
            if (modal) {
                if (typeof closeModal === 'function') {
                    closeModal(modal);
                } else if (handler.closeModal) {
                    handler.closeModal(modal);
                }
            }
            if (typeof hideModeSelect === 'function') {
                hideModeSelect();
            }
        });
        
        // Reset Progress Button
        handler.registerButton('resetProgressBtn', () => {
            console.log('[Button] Reset Progress clicked');
            if (confirm('Are you sure you want to reset all level progress? This cannot be undone.')) {
                if (window.resetLevelProgression) {
                    window.resetLevelProgression();
                    alert('Level progress has been reset. All levels are now locked except Level 1.');
                    if (window.updateLevelSelect) {
                        window.updateLevelSelect();
                    }
                }
            }
        });
        
        // Progression Summary Close
        handler.registerButton('progressionSummaryClose', () => {
            console.log('[Button] Progression Summary Close clicked');
            const summary = document.getElementById('progressionSummary');
            if (summary) {
                summary.style.display = 'none';
            }
        });
    },
    
    // Register shop and inventory buttons
    registerShopInventoryButtons: function() {
        // These are dynamically created, so we'll register them when rendered
        // The shop-ui.js and inventory-ui.js files will need to use UnifiedButtonHandler
    },
    
    // Register skill tree buttons
    registerSkillTreeButtons: function() {
        // Skill purchase buttons are dynamically created
        // skill-tree-ui.js will need to use UnifiedButtonHandler
    },
    
    // Register level select buttons
    registerLevelSelectButtons: function() {
        // Level buttons are dynamically created
        // level-select-ui.js will need to use UnifiedButtonHandler
    },
    
    // Register world map buttons
    registerWorldMapButtons: function() {
        // World map node clicks are handled in worldmap.js
    },
    
    // Register settings buttons
    registerSettingsButtons: function() {
        // Settings toggles use 'change' events, not clicks
    },
    
    // Register level editor buttons
    registerLevelEditorButtons: function() {
        if (!window.UnifiedButtonHandler) return;
        
        const handler = window.UnifiedButtonHandler;
        
        handler.registerButton('saveLevelBtn', () => {
            console.log('[Button] Save Level clicked');
            if (typeof saveLevel === 'function') {
                saveLevel();
            }
        });
        
        handler.registerButton('loadLevelBtn', () => {
            console.log('[Button] Load Level clicked');
            const select = document.getElementById('loadLevelSelect');
            if (select && select.value && typeof loadLevel === 'function') {
                loadLevel(select.value);
            }
        });
        
        handler.registerButton('clearLevelBtn', () => {
            console.log('[Button] Clear Level clicked');
            if (typeof clearLevel === 'function') {
                clearLevel();
            }
        });
        
        handler.registerButton('playtestLevelBtn', () => {
            console.log('[Button] Playtest Level clicked');
            if (typeof playtestLevel === 'function') {
                playtestLevel();
            }
        });
    },
    
    // Register control pad buttons
    registerControlPadButtons: function() {
        const controlPad = document.getElementById('controlPad');
        if (!controlPad || !window.UnifiedButtonHandler) return;
        
        const handler = window.UnifiedButtonHandler;
        const buttons = controlPad.querySelectorAll('.control-btn');
        
        buttons.forEach(btn => {
            const direction = btn.getAttribute('data-direction');
            if (direction) {
                // Create unique ID if doesn't exist
                if (!btn.id) {
                    btn.id = `controlBtn_${direction}`;
                }
                
                handler.registerButton(btn, (e) => {
                    console.log(`[Button] Control Pad ${direction} clicked`);
                    e.preventDefault();
                    
                    let dx = 0, dy = 0;
                    switch (direction) {
                        case 'up': dy = -1; break;
                        case 'down': dy = 1; break;
                        case 'left': dx = -1; break;
                        case 'right': dx = 1; break;
                    }
                    
                    if (typeof changeDirection === 'function') {
                        changeDirection(dx, dy);
                    }
                    
                    // Restart game if game over
                    const gameOverOverlay = document.getElementById('gameOverOverlay');
                    if (gameOverOverlay && gameOverOverlay.classList.contains('show')) {
                        if (typeof init === 'function') {
                            init();
                        }
                    }
                });
            }
        });
    },
    
    // Register dynamically created button
    registerDynamicButton: function(buttonId, handlerFunc) {
        if (!window.UnifiedButtonHandler) return false;
        return window.UnifiedButtonHandler.registerButton(buttonId, handlerFunc);
    },
    
    // Get registered button count
    getRegisteredCount: function() {
        return this.registeredButtons.size;
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ButtonRegistry.init();
        });
    } else {
        setTimeout(() => ButtonRegistry.init(), 100);
    }
}

