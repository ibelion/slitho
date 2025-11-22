// ==================== UNIFIED MODE SELECT SCREEN WITH SAFE LOADER ====================
// Dynamic mode loader that ensures buttons only activate when modes are ready
// Gracefully handles missing files and prevents premature button clicks

const ModeSelect = {
    // Cache for detection results
    detectedModes: null,
    detectionPromise: null,
    _showModeSelectWrapped: false,
    _loadedScripts: new Set(),
    _loadingScripts: new Map(),
    
    // Mode definitions with metadata
    modeDefinitions: [
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
    
    // Initialize
    init: function() {
        console.log('[ModeSelect] Initializing mode select system with safe loader');
        
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
            const maxAttempts = 50;
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
    
    // Wrap showModeSelect to ensure modes are ready before showing
    _wrapShowModeSelect: function() {
        const originalShowModeSelect = window.showModeSelect;
        if (!originalShowModeSelect || this._showModeSelectWrapped) return;
        
        window.showModeSelect = async () => {
            console.log('[ModeLoader] showModeSelect called - checking mode availability');
            
            // Ensure at least one mode is available before showing
            const modes = await this.detectAvailableModes();
            
            if (modes.length === 0) {
                console.warn('[ModeLoader] No modes available, showing fallback message');
                this.showNoModesFallback();
                return;
            }
            
            console.log(`[ModeLoader] ${modes.length} modes available, showing mode select`);
            originalShowModeSelect();
            
            // Refresh mode cards after a short delay to ensure screen is visible
            setTimeout(() => {
                this.refreshModeCards();
            }, 50);
        };
        
        this._showModeSelectWrapped = true;
        console.log('[ModeSelect] Hooked into showModeSelect with mode availability check');
    },
    
    // Watch for mode select screen visibility
    watchModeSelectVisibility: function() {
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) {
            setTimeout(() => this.watchModeSelectVisibility(), 100);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(modeSelectScreen).display;
                    if (display !== 'none' && display !== '') {
                        this.refreshModeCards();
                    }
                }
            });
        });
        
        observer.observe(modeSelectScreen, {
            attributes: true,
            attributeFilter: ['style', 'data-game-active']
        });
        
        const initialDisplay = window.getComputedStyle(modeSelectScreen).display;
        if (initialDisplay !== 'none' && initialDisplay !== '') {
            this.refreshModeCards();
        }
    },
    
    // ==================== CORE LOADER FUNCTIONS ====================
    
    /**
     * Load mode script dynamically
     * @param {string} modeName - Mode identifier (e.g., 'classic', 'endless')
     * @returns {Promise<void>} Resolves when init function exists, rejects on timeout or error
     */
    loadModeScript: async function(modeName) {
        const modeDef = this.modeDefinitions.find(m => m.id === modeName);
        if (!modeDef) {
            throw new Error(`[ModeLoader] Mode definition not found: ${modeName}`);
        }
        
        // Check if already loaded
        if (this._loadedScripts.has(modeName)) {
            console.log(`[ModeLoader] File already loaded: ${modeName}`);
            return;
        }
        
        // Check if currently loading
        if (this._loadingScripts.has(modeName)) {
            console.log(`[ModeLoader] File already loading: ${modeName}, waiting...`);
            return this._loadingScripts.get(modeName);
        }
        
        const scriptPath = `modes/${modeName}.js`;
        console.log(`[ModeLoader] Attempting to load: ${scriptPath}`);
        
        const loadPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error(`[ModeLoader] File missing or timeout: ${scriptPath}`);
                this._loadingScripts.delete(modeName);
                reject(new Error(`Timeout loading ${scriptPath} after 2500ms`));
            }, 2500);
            
            // Check if script already exists in DOM
            const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
            if (existingScript) {
                clearTimeout(timeout);
                console.log(`[ModeLoader] File loaded (already in DOM): ${scriptPath}`);
                this._loadedScripts.add(modeName);
                this._loadingScripts.delete(modeName);
                resolve();
                return;
            }
            
            // Try to fetch file first to check if it exists
            fetch(scriptPath, { method: 'HEAD', cache: 'no-cache' })
                .then(response => {
                    if (!response.ok) {
                        clearTimeout(timeout);
                        console.warn(`[ModeLoader] File missing: ${scriptPath} (${response.status})`);
                        this._loadingScripts.delete(modeName);
                        reject(new Error(`File not found: ${scriptPath}`));
                        return;
                    }
                    
                    // File exists, load it
                    const script = document.createElement('script');
                    script.src = scriptPath;
                    script.async = true;
                    
                    script.onload = () => {
                        clearTimeout(timeout);
                        console.log(`[ModeLoader] File loaded: ${scriptPath}`);
                        
                        // Wait for init function to be available
                        const checkInit = () => {
                            const initFuncName = `init${this._capitalizeFirst(modeName)}Mode`;
                            const initFunc = window[initFuncName];
                            
                            if (initFunc && typeof initFunc === 'function') {
                                console.log(`[ModeLoader] init function ready: ${initFuncName}`);
                                this._loadedScripts.add(modeName);
                                this._loadingScripts.delete(modeName);
                                resolve();
                            } else {
                                // Also check the initFunctions from modeDef
                                const foundFunc = this._findInitFunction(modeDef);
                                if (foundFunc && typeof foundFunc === 'function') {
                                    console.log(`[ModeLoader] init function ready: ${modeName}`);
                                    this._loadedScripts.add(modeName);
                                    this._loadingScripts.delete(modeName);
                                    resolve();
                                } else {
                                    console.warn(`[ModeLoader] init function NOT found: ${modeName}, retrying...`);
                                    setTimeout(checkInit, 100);
                                }
                            }
                        };
                        
                        // Start checking after a short delay
                        setTimeout(checkInit, 100);
                        
                        // Fallback: if init function doesn't appear after 2 seconds, still resolve
                        setTimeout(() => {
                            if (!this._loadedScripts.has(modeName)) {
                                console.warn(`[ModeLoader] Init function not found after load, but script loaded: ${modeName}`);
                                this._loadedScripts.add(modeName);
                                this._loadingScripts.delete(modeName);
                                resolve();
                            }
                        }, 2000);
                    };
                    
                    script.onerror = () => {
                        clearTimeout(timeout);
                        console.error(`[ModeLoader] File missing: ${scriptPath}`);
                        this._loadingScripts.delete(modeName);
                        reject(new Error(`Failed to load script: ${scriptPath}`));
                    };
                    
                    document.head.appendChild(script);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    console.error(`[ModeLoader] File missing: ${scriptPath}`, error);
                    this._loadingScripts.delete(modeName);
                    reject(new Error(`File not found: ${scriptPath}`));
                });
        });
        
        this._loadingScripts.set(modeName, loadPromise);
        return loadPromise;
    },
    
    /**
     * Ensure mode is ready before allowing play
     * @param {string} modeName - Mode identifier
     * @returns {Promise<{ok: boolean, reason?: string}>} Status object
     */
    ensureModeReady: async function(modeName) {
        console.log(`[ModeLoader] Button clicked → checking mode availability: ${modeName}`);
        
        const modeDef = this.modeDefinitions.find(m => m.id === modeName);
        if (!modeDef) {
            return { ok: false, reason: 'missing-definition' };
        }
        
        // Check if init function exists
        const initFunc = this._findInitFunction(modeDef);
        if (initFunc && typeof initFunc === 'function') {
            console.log(`[ModeLoader] init function ready: ${modeName}`);
            return { ok: true };
        }
        
        console.log(`[ModeLoader] init function NOT found: ${modeName}, attempting to load script`);
        
        // Try to load the script
        try {
            await this.loadModeScript(modeName);
            
            // Check again after load
            const initFuncAfterLoad = this._findInitFunction(modeDef);
            if (initFuncAfterLoad && typeof initFuncAfterLoad === 'function') {
                console.log(`[ModeLoader] init function ready after load: ${modeName}`);
                return { ok: true };
            } else {
                console.error(`[ModeLoader] init function still NOT found after load: ${modeName}`);
                return { ok: false, reason: 'missing-init' };
            }
        } catch (error) {
            console.error(`[ModeLoader] Failed to load script for ${modeName}:`, error.message);
            return { ok: false, reason: 'missing-file' };
        }
    },
    
    /**
     * Find init function for a mode
     * @private
     */
    _findInitFunction: function(modeDef) {
        // Check ModeCompatibilityChecker first
        if (window.ModeCompatibilityChecker && window.ModeCompatibilityChecker.getModeInitFunction) {
            const func = window.ModeCompatibilityChecker.getModeInitFunction(modeDef.id);
            if (func && typeof func === 'function') {
                return func;
            }
        }
        
        // Check each init function
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
                // Try window first
                func = window[funcName];
                
                // Try global scope
                if (!func || typeof func !== 'function') {
                    try {
                        func = eval(funcName);
                    } catch (e) {
                        // continue
                    }
                }
                
                // Try globalThis
                if ((!func || typeof func !== 'function') && typeof globalThis !== 'undefined') {
                    func = globalThis[funcName];
                }
            }
            
            if (func && typeof func === 'function') {
                return func;
            }
        }
        
        return null;
    },
    
    /**
     * Capitalize first letter
     * @private
     */
    _capitalizeFirst: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Attach safe button handler that prevents premature clicks
     * @param {string} modeName - Mode identifier
     * @param {HTMLElement} button - Button element
     */
    attachModeButton: function(modeName, button) {
        if (!button) return;
        
        const modeId = button.getAttribute('data-mode-id') || modeName;
        const modeDef = this.modeDefinitions.find(m => m.id === modeId);
        if (!modeDef) {
            console.warn(`[ModeLoader] No mode definition for: ${modeId}`);
            return;
        }
        
        // Create unique ID if needed
        if (!button.id) {
            button.id = `mode-card-btn-${modeId}`;
        }
        
        // Remove existing listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Attach click handler
        const clickHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`[ModeLoader] Button clicked → checking mode availability: ${modeId}`);
            
            // Disable button immediately to prevent double-clicks
            const wasDisabled = newButton.disabled;
            newButton.disabled = true;
            newButton.style.opacity = '0.6';
            newButton.style.cursor = 'wait';
            
            try {
                // Check if mode is ready
                const status = await this.ensureModeReady(modeId);
                
                if (!status.ok) {
                    console.error(`[ModeLoader] Mode not ready: ${modeId}, reason: ${status.reason}`);
                    this.showModeUnavailableModal(modeDef, status.reason);
                    return;
                }
                
                // Find and call init function
                const initFunc = this._findInitFunction(modeDef);
                if (!initFunc || typeof initFunc !== 'function') {
                    console.error(`[ModeLoader] Init function not found for: ${modeId}`);
                    this.showModeUnavailableModal(modeDef, 'missing-init');
                    return;
                }
                
                console.log(`[ModeLoader] Calling init function for: ${modeId}`);
                
                // Call init function
                try {
                    initFunc();
                    console.log(`[ModeLoader] Init function called successfully for: ${modeId}`);
                    
                    // Hide mode select after init
                    if (modeId !== 'procedural' && typeof window.hideModeSelect === 'function') {
                        setTimeout(() => {
                            if (typeof window.hideModeSelect === 'function') {
                                window.hideModeSelect();
                            }
                        }, 100);
                    }
                } catch (error) {
                    console.error(`[ModeLoader] Error calling init function for ${modeId}:`, error);
                    this.showModeUnavailableModal(modeDef, 'init-error');
                }
                
            } catch (error) {
                console.error(`[ModeLoader] Error ensuring mode ready for ${modeId}:`, error);
                this.showModeUnavailableModal(modeDef, 'load-error');
            } finally {
                // Re-enable button
                if (!wasDisabled) {
                    setTimeout(() => {
                        newButton.disabled = false;
                        newButton.style.opacity = '1';
                        newButton.style.cursor = 'pointer';
                    }, 500);
                }
            }
        };
        
        // Register with UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(newButton, clickHandler);
        } else {
            newButton.addEventListener('click', clickHandler);
        }
        
        // Also handle touch events
        newButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            clickHandler(e);
        });
    },
    
    /**
     * Show modal when mode is unavailable
     */
    showModeUnavailableModal: function(modeDef, reason) {
        let message = `Unable to load ${modeDef.name}.`;
        let details = '';
        
        switch (reason) {
            case 'missing-file':
                message = `${modeDef.name} is currently unavailable.`;
                details = 'The mode script file could not be found or failed to load.';
                break;
            case 'missing-init':
                message = `${modeDef.name} failed to initialize.`;
                details = 'The mode script loaded but the initialization function was not found.';
                break;
            case 'init-error':
                message = `${modeDef.name} encountered an error.`;
                details = 'The mode failed to start due to an initialization error.';
                break;
            case 'load-error':
                message = `${modeDef.name} could not be loaded.`;
                details = 'An error occurred while loading the mode script.';
                break;
            default:
                details = 'Please try again or select a different mode.';
        }
        
        // Create or get modal
        let modal = document.getElementById('modeUnavailableModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modeUnavailableModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Mode Unavailable</h2>
                        <button class="modal-close" onclick="this.closest('.modal').classList.remove('show')">×</button>
                    </div>
                    <div class="modal-body">
                        <p id="modeUnavailableMessage" style="margin-bottom: 10px;"></p>
                        <p id="modeUnavailableDetails" style="color: var(--text-secondary); font-size: 0.9em;"></p>
                        <button class="btn" onclick="this.closest('.modal').classList.remove('show')" style="margin-top: 20px; width: 100%;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('modeUnavailableMessage').textContent = message;
        document.getElementById('modeUnavailableDetails').textContent = details;
        modal.classList.add('show');
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    },
    
    /**
     * Show fallback when no modes are available
     */
    showNoModesFallback: function() {
        const container = document.getElementById('modeCardsContainer');
        const loadingEl = document.getElementById('modeDetectionLoading');
        const noModesEl = document.getElementById('noModesMessage');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (noModesEl) {
            noModesEl.innerHTML = `
                <p style="font-size: 1.2em; margin-bottom: 10px;">No playable modes found</p>
                <p style="font-size: 0.9em; margin-top: 10px;">Please check that game scripts are loaded correctly.</p>
                <button class="btn" onclick="location.reload()" style="margin-top: 20px;">Reload Page</button>
            `;
            noModesEl.style.display = 'block';
        }
        if (container) container.innerHTML = '';
    },
    
    // ==================== EXISTING FUNCTIONS (UPDATED) ====================
    
    // Detect available modes
    detectAvailableModes: async function() {
        if (this.detectedModes !== null) {
            return this.detectedModes;
        }
        
        if (this.detectionPromise) {
            return this.detectionPromise;
        }
        
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
                const initFunc = this._findInitFunction(modeDef);
                if (initFunc && typeof initFunc === 'function') {
                    isAvailable = true;
                    console.log(`[ModeSelect] ${modeDef.name} detected via init function`);
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
                        if (typeof obj.start === 'function' || typeof obj.startStory === 'function' || typeof obj.init === 'function') {
                            isAvailable = true;
                            console.log(`[ModeSelect] ${modeDef.name} detected via object: ${modeDef.checkObject}`);
                        }
                    }
                } catch (e) {
                    console.warn(`[ModeSelect] Error checking object ${modeDef.checkObject}:`, e);
                }
            }
            
            // Check 4: File path fallback - show modes if filePath is 'game.js' (already loaded)
            // This ensures Classic, Endless, Procedural, Boss are shown even if init functions
            // aren't found yet due to timing issues
            if (!isAvailable && modeDef.filePath) {
                // If filePath is 'game.js', it's already loaded in index.html, so show the mode
                if (modeDef.filePath === 'game.js') {
                    isAvailable = true;
                    console.log(`[ModeSelect] ${modeDef.name} detected via filePath (game.js already loaded)`);
                } else {
                    // For other files, check if they exist (non-blocking)
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
            }
            
            if (isAvailable) {
                availableModes.push(modeDef);
            }
        }
        
        // Add minigames
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
        }
        
        this.detectedModes = availableModes;
        console.log(`[ModeSelect] Detection complete: ${availableModes.length} modes available`);
        
        return availableModes;
    },
    
    // Refresh mode cards in UI
    refreshModeCards: async function() {
        const container = document.getElementById('modeCardsContainer');
        if (!container) return;
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (noModesEl) noModesEl.style.display = 'none';
        container.innerHTML = '';
        
        try {
            const modes = await this.detectAvailableModes();
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (modes.length === 0) {
                this.showNoModesFallback();
                return;
            }
            
            this.renderModeCards(modes, container);
            
        } catch (error) {
            console.error('[ModeSelect] Error detecting modes:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            container.innerHTML = '<div class="mode-error" style="text-align: center; padding: 40px; color: var(--color-error);">Error detecting modes</div>';
        }
    },
    
    // Render mode cards
    renderModeCards: function(modes, container) {
        const mainModes = modes.filter(m => !m.category || m.category === 'main');
        const minigameModes = modes.filter(m => m.category === 'minigame');
        
        container.innerHTML = '';
        
        if (mainModes.length > 0) {
            mainModes.forEach(mode => {
                const card = this.createModeCard(mode);
                container.appendChild(card);
            });
        }
        
        if (minigameModes.length > 0) {
            minigameModes.forEach(mode => {
                const card = this.createModeCard(mode);
                container.appendChild(card);
            });
        }
        
        // Register button handlers with safe loader
        this.registerModeCardHandlers();
        
        if (window.ButtonRegistry && typeof window.ButtonRegistry.reregisterModeSelectButtons === 'function') {
            setTimeout(() => {
                window.ButtonRegistry.reregisterModeSelectButtons();
            }, 100);
        }
    },
    
    // Create a mode card element
    createModeCard: function(mode) {
        const card = document.createElement('div');
        card.className = 'mode-card';
        card.setAttribute('data-mode-id', mode.id);
        
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
    
    // Register handlers for mode card buttons using safe loader
    registerModeCardHandlers: function() {
        const playButtons = document.querySelectorAll('.mode-card-play-btn');
        
        console.log(`[ModeSelect] Registering handlers for ${playButtons.length} mode card buttons`);
        
        playButtons.forEach((button, index) => {
            const modeId = button.getAttribute('data-mode-id');
            if (!modeId) {
                console.warn(`[ModeSelect] Button ${index} has no data-mode-id`);
                return;
            }
            
            // Handle minigames - preserve button, don't clone
            if (modeId.startsWith('minigame_')) {
                const minigameId = modeId.replace('minigame_', '');
                
                // Ensure button has ID
                if (!button.id) {
                    button.id = `mode-card-btn-${modeId}`;
                }
                
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[ModeSelect] Minigame clicked: ${minigameId}`);
                    if (window.loadMinigame && typeof window.loadMinigame === 'function') {
                        window.loadMinigame(minigameId);
                    } else if (window.MINIGAMES && window.MINIGAMES[minigameId] && window.MINIGAMES[minigameId].init) {
                        window.MINIGAMES[minigameId].init();
                    }
                    if (typeof window.hideModeSelect === 'function') {
                        setTimeout(() => window.hideModeSelect(), 100);
                    }
                };
                
                // Register handler - UnifiedButtonHandler will clone, but that's OK
                if (window.UnifiedButtonHandler) {
                    window.UnifiedButtonHandler.registerButton(button, clickHandler);
                } else {
                    button.addEventListener('click', clickHandler);
                }
                
                // Also handle touch events
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    clickHandler(e);
                });
                
                return;
            }
            
            // Special handling for procedural mode
            if (modeId === 'procedural') {
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const modal = document.getElementById('proceduralSettingsModal');
                    if (modal) {
                        if (typeof window.openModal === 'function') {
                            window.openModal(modal);
                        } else if (window.UnifiedButtonHandler && window.UnifiedButtonHandler.openModal) {
                            window.UnifiedButtonHandler.openModal(modal);
                        } else {
                            modal.style.display = 'flex';
                            modal.classList.add('show');
                        }
                    }
                };
                
                if (window.UnifiedButtonHandler) {
                    window.UnifiedButtonHandler.registerButton(button, clickHandler);
                } else {
                    button.addEventListener('click', clickHandler);
                }
                return;
            }
            
            // Use safe loader for regular modes
            this.attachModeButton(modeId, button);
        });
        
        console.log(`[ModeSelect] Registered ${playButtons.length} mode card button handlers`);
    },
    
    // Handle mode play button click (legacy compatibility)
    handleModePlay: function(modeId) {
        console.log(`[ModeSelect] handleModePlay called for: ${modeId} (legacy, redirecting to safe loader)`);
        const button = document.querySelector(`[data-mode-id="${modeId}"]`);
        if (button) {
            button.click();
        }
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
    
    // Clear cache
    clearCache: function() {
        this.detectedModes = null;
        this.detectionPromise = null;
        this._loadedScripts.clear();
        this._loadingScripts.clear();
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ModeSelect.init();
        });
    } else {
        setTimeout(() => ModeSelect.init(), 0);
    }
    
    window.ModeSelect = ModeSelect;
}
