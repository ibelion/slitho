// ==================== UNIFIED MODE SELECT SCREEN ====================
// Auto-detects available game modes and displays them dynamically
// Scans for init functions, ModeCompatibilityChecker, and file existence

const ModeSelect = {
    // Cache for detection results
    detectedModes: null,
    detectionPromise: null,
    _showModeSelectWrapped: false,
    
    // Mode definitions with metadata
    modeDefinitions: [
        {
            id: 'classic',
            name: 'Classic Mode',
            description: 'Progress through levels with increasing difficulty',
            icon: '🎮',
            difficulty: 'Normal',
            initFunctions: ['startClassicMode', 'initClassicMode'],
            filePath: 'game.js',
            category: 'main'
        },
        {
            id: 'endless',
            name: 'Endless Mode',
            description: 'Survive as long as possible with increasing speed',
            icon: '∞',
            difficulty: 'Hard',
            initFunctions: ['initEndlessMode'],
            filePath: 'game.js',
            category: 'main'
        },
        {
            id: 'procedural',
            name: 'Procedural Mode',
            description: 'Generate random terrain with customizable settings',
            icon: '🌍',
            difficulty: 'Variable',
            initFunctions: ['initProceduralMode'],
            filePath: 'game.js',
            category: 'main'
        },
        {
            id: 'boss',
            name: 'Boss Mode',
            description: 'Face off against powerful boss enemies',
            icon: '👹',
            difficulty: 'Very Hard',
            initFunctions: ['initBossMode'],
            filePath: 'game.js',
            category: 'main'
        },
        {
            id: 'story',
            name: 'Story Campaign',
            description: 'Embark on a narrative-driven adventure',
            icon: '📖',
            difficulty: 'Normal',
            initFunctions: ['window.StoryMode.startStory'],
            filePath: 'systems/story-mode.js',
            category: 'main',
            checkObject: 'window.StoryMode'
        },
        {
            id: 'multiplayer',
            name: 'Local Multiplayer',
            description: 'Play with a friend on the same device',
            icon: '👥',
            difficulty: 'Normal',
            initFunctions: ['window.LocalMultiplayer.start'],
            filePath: 'systems/local-multiplayer.js',
            category: 'main',
            checkObject: 'window.LocalMultiplayer'
        }
    ],
    
    // Initialize
    init: function() {
        console.log('[ModeSelect] Initializing mode select system');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },
    
    // Setup mode select
    setup: function() {
        // Hook into showModeSelect to refresh mode detection
        this.hookIntoShowModeSelect();
        
        // Also watch for mode select screen visibility changes
        this.watchModeSelectVisibility();
        
        // Initial render after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.refreshModeCards();
        }, 100);
    },
    
    // Hook into showModeSelect function
    hookIntoShowModeSelect: function() {
        // Try to hook immediately if available
        if (typeof window.showModeSelect === 'function') {
            this._wrapShowModeSelect();
        } else {
            // Wait for showModeSelect to be defined
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.showModeSelect === 'function') {
                    clearInterval(checkInterval);
                    this._wrapShowModeSelect();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.warn('[ModeSelect] showModeSelect not found after max attempts');
                }
            }, 100);
        }
    },
    
    // Wrap showModeSelect to refresh mode cards
    _wrapShowModeSelect: function() {
        const originalShowModeSelect = window.showModeSelect;
        if (!originalShowModeSelect || this._showModeSelectWrapped) return;
        
        window.showModeSelect = () => {
            originalShowModeSelect();
            // Refresh mode cards after a short delay to ensure screen is visible
            setTimeout(() => {
                this.refreshModeCards();
            }, 50);
        };
        
        this._showModeSelectWrapped = true;
        console.log('[ModeSelect] Hooked into showModeSelect');
    },
    
    // Watch for mode select screen visibility
    watchModeSelectVisibility: function() {
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) {
            // Retry after DOM is ready
            setTimeout(() => this.watchModeSelectVisibility(), 100);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(modeSelectScreen).display;
                    if (display !== 'none' && display !== '') {
                        // Mode select screen is visible, refresh cards
                        this.refreshModeCards();
                    }
                }
            });
        });
        
        observer.observe(modeSelectScreen, {
            attributes: true,
            attributeFilter: ['style', 'data-game-active']
        });
        
        // Also check on initial load
        const initialDisplay = window.getComputedStyle(modeSelectScreen).display;
        if (initialDisplay !== 'none' && initialDisplay !== '') {
            this.refreshModeCards();
        }
    },
    
    // Detect available modes
    detectAvailableModes: async function() {
        // Return cached result if available
        if (this.detectedModes !== null) {
            return this.detectedModes;
        }
        
        // Return existing promise if detection is in progress
        if (this.detectionPromise) {
            return this.detectionPromise;
        }
        
        // Start detection
        this.detectionPromise = this._performDetection();
        const result = await this.detectionPromise;
        this.detectionPromise = null;
        return result;
    },
    
    // Perform actual detection
    _performDetection: async function() {
        const availableModes = [];
        
        console.log('[ModeSelect] Starting mode detection');
        
        for (const modeDef of this.modeDefinitions) {
            let isAvailable = false;
            
            // Check 1: ModeCompatibilityChecker if available
            if (window.ModeCompatibilityChecker && window.ModeCompatibilityChecker.getModeInitFunction) {
                const initFunc = window.ModeCompatibilityChecker.getModeInitFunction(modeDef.id);
                if (initFunc && typeof initFunc === 'function') {
                    isAvailable = true;
                    console.log(`[ModeSelect] ${modeDef.name} detected via ModeCompatibilityChecker`);
                }
            }
            
            // Check 2: Global init functions
            if (!isAvailable) {
                for (const funcName of modeDef.initFunctions) {
                    let func = null;
                    
                    // Handle window.XXX.YYY pattern
                    if (funcName.includes('.')) {
                        const parts = funcName.split('.');
                        let obj = window;
                        for (let i = 0; i < parts.length; i++) {
                            if (obj && typeof obj === 'object') {
                                obj = obj[parts[i]];
                            } else {
                                obj = null;
                                break;
                            }
                        }
                        func = obj;
                    } else {
                        func = window[funcName];
                    }
                    
                    if (func && typeof func === 'function') {
                        isAvailable = true;
                        console.log(`[ModeSelect] ${modeDef.name} detected via init function: ${funcName}`);
                        break;
                    }
                }
            }
            
            // Check 3: Object existence for modes that use objects
            if (!isAvailable && modeDef.checkObject) {
                try {
                    const objPath = modeDef.checkObject.split('.');
                    let obj = window;
                    for (const part of objPath) {
                        if (obj && typeof obj === 'object') {
                            obj = obj[part];
                        } else {
                            obj = null;
                            break;
                        }
                    }
                    if (obj && typeof obj === 'object') {
                        // Check if it has a start/init method
                        if (typeof obj.start === 'function' || typeof obj.startStory === 'function' || typeof obj.init === 'function') {
                            isAvailable = true;
                            console.log(`[ModeSelect] ${modeDef.name} detected via object: ${modeDef.checkObject}`);
                        }
                    }
                } catch (e) {
                    console.warn(`[ModeSelect] Error checking object ${modeDef.checkObject}:`, e);
                }
            }
            
            // Check 4: Optional file existence (non-blocking, with timeout)
            if (!isAvailable && modeDef.filePath) {
                try {
                    const fileExists = await this._checkFileExists(modeDef.filePath);
                    if (fileExists) {
                        isAvailable = true;
                        console.log(`[ModeSelect] ${modeDef.name} detected via file existence: ${modeDef.filePath}`);
                    }
                } catch (e) {
                    // File check failed, but don't block on it
                    console.debug(`[ModeSelect] File check for ${modeDef.filePath} failed:`, e.message);
                }
            }
            
            if (isAvailable) {
                availableModes.push(modeDef);
            }
        }
        
        // Add minigames from registry
        if (window.MINIGAMES && typeof window.MINIGAMES === 'object') {
            for (const [minigameId, minigame] of Object.entries(window.MINIGAMES)) {
                availableModes.push({
                    id: `minigame_${minigameId}`,
                    name: minigame.name || minigameId,
                    description: `Quick minigame: ${minigame.name || minigameId}`,
                    icon: minigame.icon || '🎯',
                    difficulty: 'Easy',
                    initFunctions: [],
                    filePath: `minigames/${minigameId}.js`,
                    category: 'minigame',
                    minigameId: minigameId,
                    minigameInit: minigame.init
                });
            }
            console.log(`[ModeSelect] Detected ${Object.keys(window.MINIGAMES).length} minigames`);
        }
        
        this.detectedModes = availableModes;
        console.log(`[ModeSelect] Detection complete: ${availableModes.length} modes available`);
        
        return availableModes;
    },
    
    // Check if file exists (with timeout)
    _checkFileExists: async function(filePath) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 2000); // 2 second timeout
            
            fetch(filePath, { method: 'HEAD', cache: 'no-cache' })
                .then(response => {
                    clearTimeout(timeout);
                    resolve(response.ok);
                })
                .catch(() => {
                    clearTimeout(timeout);
                    resolve(false);
                });
        });
    },
    
    // Refresh mode cards in UI
    refreshModeCards: async function() {
        const container = document.getElementById('modeCardsContainer');
        const loadingEl = document.getElementById('modeDetectionLoading');
        const noModesEl = document.getElementById('noModesMessage');
        
        if (!container) {
            console.warn('[ModeSelect] modeCardsContainer not found');
            return;
        }
        
        // Show loading
        if (loadingEl) loadingEl.style.display = 'block';
        if (noModesEl) noModesEl.style.display = 'none';
        container.innerHTML = '';
        
        try {
            const modes = await this.detectAvailableModes();
            
            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (modes.length === 0) {
                // Show no modes message
                if (noModesEl) {
                    noModesEl.style.display = 'block';
                } else {
                    container.innerHTML = '<div class="no-modes-message" style="text-align: center; padding: 40px; color: var(--text-secondary);">No modes available</div>';
                }
                return;
            }
            
            // Render mode cards
            this.renderModeCards(modes, container);
            
        } catch (error) {
            console.error('[ModeSelect] Error detecting modes:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            container.innerHTML = '<div class="mode-error" style="text-align: center; padding: 40px; color: var(--color-error);">Error detecting modes</div>';
        }
    },
    
    // Render mode cards
    renderModeCards: function(modes, container) {
        // Group modes by category
        const mainModes = modes.filter(m => !m.category || m.category === 'main');
        const minigameModes = modes.filter(m => m.category === 'minigame');
        
        container.innerHTML = '';
        
        // Render main modes
        if (mainModes.length > 0) {
            mainModes.forEach(mode => {
                const card = this.createModeCard(mode);
                container.appendChild(card);
            });
        }
        
        // Render minigames
        if (minigameModes.length > 0) {
            minigameModes.forEach(mode => {
                const card = this.createModeCard(mode);
                container.appendChild(card);
            });
        }
        
        // Register button handlers
        this.registerModeCardHandlers();
        
        // Re-register all mode select buttons with ButtonRegistry after dynamic content is created
        // This ensures buttons created dynamically are properly registered
        if (window.ButtonRegistry && typeof window.ButtonRegistry.reregisterModeSelectButtons === 'function') {
            setTimeout(() => {
                console.log('[ModeSelect] Triggering ButtonRegistry re-registration after mode cards rendered');
                window.ButtonRegistry.reregisterModeSelectButtons();
            }, 100);
        }
    },
    
    // Create a mode card element
    createModeCard: function(mode) {
        const card = document.createElement('div');
        card.className = 'mode-card';
        card.setAttribute('data-mode-id', mode.id);
        
        // Difficulty badge color
        const difficultyColors = {
            'Easy': 'var(--color-success)',
            'Normal': 'var(--color-info)',
            'Hard': 'var(--color-warning)',
            'Very Hard': 'var(--color-error)',
            'Variable': 'var(--color-accent)'
        };
        const badgeColor = difficultyColors[mode.difficulty] || 'var(--text-secondary)';
        
        card.innerHTML = `
            <div class="mode-card-header">
                <span class="mode-card-icon">${mode.icon}</span>
                <div class="mode-card-info">
                    <h3 class="mode-card-name">${mode.name}</h3>
                    <span class="mode-card-badge" style="background: ${badgeColor};">${mode.difficulty}</span>
                </div>
            </div>
            <p class="mode-card-description">${mode.description}</p>
            <button class="mode-card-play-btn btn" data-mode-id="${mode.id}" aria-label="Play ${mode.name}">
                Play
            </button>
        `;
        
        return card;
    },
    
    // Register handlers for mode card buttons
    registerModeCardHandlers: function() {
        const playButtons = document.querySelectorAll('.mode-card-play-btn');
        
        console.log(`[ModeSelect] Registering handlers for ${playButtons.length} mode card buttons`);
        
        playButtons.forEach((button, index) => {
            const modeId = button.getAttribute('data-mode-id');
            if (!modeId) {
                console.warn(`[ModeSelect] Button ${index} has no data-mode-id`);
                return;
            }
            
            console.log(`[ModeSelect] Registering handler for mode: ${modeId}`);
            
            // Create a unique ID for the button if it doesn't have one
            if (!button.id) {
                button.id = `mode-card-btn-${modeId}`;
            }
            
            // Register with UnifiedButtonHandler if available (it will handle cloning)
            if (window.UnifiedButtonHandler) {
                const registered = window.UnifiedButtonHandler.registerButton(button, () => {
                    console.log(`[ModeSelect] Button clicked for mode: ${modeId}`);
                    this.handleModePlay(modeId);
                });
                
                if (!registered) {
                    console.warn(`[ModeSelect] Failed to register button for ${modeId}, using fallback`);
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`[ModeSelect] Button clicked for mode: ${modeId} (fallback)`);
                        this.handleModePlay(modeId);
                    });
                }
            } else {
                // Fallback: direct event listener
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[ModeSelect] Button clicked for mode: ${modeId}`);
                    this.handleModePlay(modeId);
                });
            }
        });
        
        console.log(`[ModeSelect] Registered ${playButtons.length} mode card button handlers`);
    },
    
    // Handle mode play button click
    handleModePlay: function(modeId) {
        console.log(`[ModeSelect] Playing mode: ${modeId}`);
        
        try {
            // Find mode definition
            let modeDef = null;
            
            // Check if it's a minigame
            if (modeId.startsWith('minigame_')) {
                const minigameId = modeId.replace('minigame_', '');
                if (window.MINIGAMES && window.MINIGAMES[minigameId]) {
                    // Load minigame
                    try {
                        if (window.loadMinigame && typeof window.loadMinigame === 'function') {
                            window.loadMinigame(minigameId);
                        } else if (window.MINIGAMES[minigameId].init) {
                            window.MINIGAMES[minigameId].init();
                        }
                        // Hide mode select after minigame loads
                        if (typeof window.hideModeSelect === 'function') {
                            setTimeout(() => window.hideModeSelect(), 100);
                        }
                    } catch (e) {
                        console.error(`[ModeSelect] Error loading minigame ${minigameId}:`, e);
                    }
                    return;
                }
            }
            
            // Find in definitions
            modeDef = this.modeDefinitions.find(m => m.id === modeId);
            if (!modeDef) {
                console.error(`[ModeSelect] Mode not found: ${modeId}`);
                console.error(`[ModeSelect] Available modes:`, this.modeDefinitions.map(m => m.id));
                return;
            }
            
            console.log(`[ModeSelect] Found mode definition for ${modeId}:`, modeDef);
            console.log(`[ModeSelect] Init functions to try:`, modeDef.initFunctions);
            
            // Get init function via ModeCompatibilityChecker if available
            let initFunc = null;
            if (window.ModeCompatibilityChecker && window.ModeCompatibilityChecker.getModeInitFunction) {
                initFunc = window.ModeCompatibilityChecker.getModeInitFunction(modeId);
                if (initFunc) {
                    console.log(`[ModeSelect] Got init function from ModeCompatibilityChecker`);
                }
            }
            
            // Fallback: try to get init function directly
            if (!initFunc) {
                for (const funcName of modeDef.initFunctions) {
                    let func = null;
                    
                    console.log(`[ModeSelect] Trying to find function: ${funcName}`);
                    
                    // Handle window.XXX.YYY pattern
                    if (funcName.includes('.')) {
                        const parts = funcName.split('.');
                        let obj = window;
                        for (let i = 0; i < parts.length; i++) {
                            if (obj && typeof obj === 'object') {
                                obj = obj[parts[i]];
                            } else {
                                obj = null;
                                break;
                            }
                        }
                        func = obj;
                    } else {
                        func = window[funcName];
                    }
                    
                    if (func && typeof func === 'function') {
                        console.log(`[ModeSelect] Found init function: ${funcName}`);
                        initFunc = func;
                        break;
                    } else {
                        console.warn(`[ModeSelect] Init function not found or not a function: ${funcName}`);
                    }
                }
            }
            
            if (!initFunc || typeof initFunc !== 'function') {
                console.error(`[ModeSelect] Init function not found for mode: ${modeId}`);
                console.error(`[ModeSelect] Tried functions:`, modeDef.initFunctions);
                return;
            }
            
            // Special handling for procedural mode (opens settings modal first)
            if (modeId === 'procedural') {
                const modal = document.getElementById('proceduralSettingsModal');
                if (modal) {
                    // Try multiple ways to open modal
                    if (typeof window.openModal === 'function') {
                        window.openModal(modal);
                    } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                        window.UnifiedButtonHandler.openModal(modal);
                    } else {
                        // Fallback: just show the modal
                        modal.style.display = 'flex';
                        modal.classList.add('show');
                    }
                    // The generate button will call initProceduralMode and hideModeSelect
                    return;
                }
            }
            
            // Call init function
            console.log(`[ModeSelect] Calling init function for ${modeId}`);
            try {
                initFunc();
                console.log(`[ModeSelect] Init function called successfully for ${modeId}`);
                
                // Hide mode select after init (safe to call even if init function already called it)
                // Procedural mode opens settings modal first, hideModeSelect is called by generate button
                if (modeId !== 'procedural' && typeof window.hideModeSelect === 'function') {
                    // Use setTimeout to ensure init function completes first
                    setTimeout(() => {
                        console.log(`[ModeSelect] Hiding mode select screen`);
                        if (typeof window.hideModeSelect === 'function') {
                            window.hideModeSelect();
                        } else {
                            console.warn(`[ModeSelect] hideModeSelect is not a function`);
                        }
                    }, 100);
                } else if (modeId === 'procedural') {
                    console.log(`[ModeSelect] Procedural mode - skipping hideModeSelect (will be called by generate button)`);
                } else {
                    console.warn(`[ModeSelect] hideModeSelect is not available`);
                }
            } catch (e) {
                console.error(`[ModeSelect] Error starting mode ${modeId}:`, e);
                console.error(e.stack);
                return;
            }
            
        } catch (error) {
            console.error('[ModeSelect] Error handling mode play:', error);
            console.error(error.stack);
        }
    },
    
    // Clear cache (for testing)
    clearCache: function() {
        this.detectedModes = null;
        this.detectionPromise = null;
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ModeSelect.init();
        });
    } else {
        // DOM already loaded, init immediately
        setTimeout(() => ModeSelect.init(), 0);
    }
    
    // Export to window
    window.ModeSelect = ModeSelect;
}

