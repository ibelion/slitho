// ==================== UNIFIED BUTTON HANDLER ====================
// Centralized system for all button interactions across the game
// Ensures consistency, prevents double-triggers, and supports all input methods

const UnifiedButtonHandler = {
    // Configuration
    config: {
        enabled: true,
        debugLogging: true, // Set to false in production
        preventDoubleClick: true,
        doubleClickDelay: 300, // ms
        keyboardConfirmKeys: ['Enter', ' '], // Enter and Space
        touchEnabled: true
    },
    
    // State
    buttonHandlers: new Map(), // Map of buttonId -> handler function
    lastClickTime: new Map(), // Map of buttonId -> timestamp
    disabledButtons: new Set(), // Set of disabled button IDs
    activeModals: [], // Stack of active modals
    
    // Initialize
    init: function() {
        this.setupGlobalListeners();
        this.scanAndRegisterButtons();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('UnifiedButtonHandler', this);
        }
        
        window.UnifiedButtonHandler = this;
    },
    
    // Setup global listeners for keyboard and controller
    setupGlobalListeners: function() {
        // Keyboard confirm (Enter/Space)
        document.addEventListener('keydown', (e) => {
            if (this.config.keyboardConfirmKeys.includes(e.key)) {
                const focusedButton = document.activeElement;
                if (focusedButton && focusedButton.tagName === 'BUTTON' && !focusedButton.disabled) {
                    e.preventDefault();
                    this.handleButtonClick(focusedButton);
                }
            }
        });
        
        // Escape key for closing modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    },
    
    // Register a button with handler
    registerButton: function(buttonId, handler, options = {}) {
        const button = typeof buttonId === 'string' 
            ? document.getElementById(buttonId) 
            : buttonId;
        
        if (!button) {
            if (this.config.debugLogging) {
                console.warn(`Button not found: ${buttonId}`);
            }
            return false;
        }
        
        // Store handler
        const buttonIdStr = button.id || buttonId;
        this.buttonHandlers.set(buttonIdStr, {
            handler: handler,
            options: options
        });
        
        // PRESERVE inline styles before cloning to maintain visual state
        // This is critical for HomeAnimations which sets opacity/transform
        const inlineStyles = {
            opacity: button.style.opacity,
            transform: button.style.transform,
            transition: button.style.transition,
            pointerEvents: button.style.pointerEvents,
            display: button.style.display,
            visibility: button.style.visibility
        };
        
        // Preserve data attributes (especially data-animated)
        const dataAttributes = {};
        Array.from(button.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                dataAttributes[attr.name] = attr.value;
            }
        });
        
        // Remove existing listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        
        // RE-APPLY inline styles to the clone to maintain visual consistency
        Object.entries(inlineStyles).forEach(([prop, value]) => {
            if (value && value !== '') {
                newButton.style[prop] = value;
            }
        });
        
        // RE-APPLY data attributes to maintain state
        Object.entries(dataAttributes).forEach(([name, value]) => {
            newButton.setAttribute(name, value);
        });
        
        // Ensure button has an ID for HomeAnimations to re-query after cloning
        if (!newButton.id && buttonIdStr) {
            newButton.id = buttonIdStr;
        }
        
        button.parentNode.replaceChild(newButton, button);
        
        // Add unified click handler
        newButton.addEventListener('click', (e) => {
            this.handleButtonClick(newButton, e);
        });
        
        // Add touch support
        if (this.config.touchEnabled) {
            newButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonClick(newButton, e);
            });
        }
        
        // Make button focusable for keyboard navigation
        if (!newButton.hasAttribute('tabindex')) {
            newButton.setAttribute('tabindex', '0');
        }
        
        // Add keyboard handler
        newButton.addEventListener('keydown', (e) => {
            if (this.config.keyboardConfirmKeys.includes(e.key)) {
                e.preventDefault();
                this.handleButtonClick(newButton, e);
            }
        });
        
        // Add hover sound (throttled)
        newButton.addEventListener('mouseenter', () => {
            if (!newButton.disabled && !newButton.classList.contains('disabled')) {
                if (window.UISoundSystem && window.UISoundSystem.playHover) {
                    window.UISoundSystem.playHover();
                }
            }
        });
        
        return true;
    },
    
    // Handle button click
    handleButtonClick: function(button, event = null) {
        if (!button || !this.config.enabled) return false;
        
        const buttonId = button.id;
        
        // Check if disabled
        if (button.disabled || button.classList.contains('disabled') || this.disabledButtons.has(buttonId)) {
            if (this.config.debugLogging) {
                console.log(`Button ${buttonId} is disabled, ignoring click`);
            }
            return false;
        }
        
        // Prevent double-click
        if (this.config.preventDoubleClick) {
            const lastClick = this.lastClickTime.get(buttonId);
            const now = Date.now();
            if (lastClick && (now - lastClick) < this.config.doubleClickDelay) {
                if (this.config.debugLogging) {
                    console.log(`Button ${buttonId} clicked too soon, ignoring`);
                }
                return false;
            }
            this.lastClickTime.set(buttonId, now);
        }
        
        // Get handler
        const handlerData = this.buttonHandlers.get(buttonId);
        if (!handlerData) {
            if (this.config.debugLogging) {
                console.warn(`No handler registered for button: ${buttonId}`);
            }
            return false;
        }
        
        // Log button press
        if (this.config.debugLogging) {
            console.log(`[Button] ${buttonId} clicked`, {
                inputMethod: event?.type || 'programmatic',
                timestamp: Date.now()
            });
        }
        
        // Execute handler
        try {
            const result = handlerData.handler.call(button, event);
            
            // Trigger haptic feedback if available
            if (window.TouchInput && window.TouchInput.triggerHaptic) {
                window.TouchInput.triggerHaptic('light');
            }
            
            // Trigger button press sound if available
            if (window.UISoundSystem && window.UISoundSystem.playClick) {
                window.UISoundSystem.playClick();
            } else if (window.AudioManager && window.AudioManager.playSound) {
                // Fallback to original system
                try {
                    window.AudioManager.playSound('ui_click', 1.0, 'ui');
                } catch (e) {
                    // Fallback: generate a simple click tone
                    if (window.AudioManager && window.AudioManager.audioContext) {
                        const ctx = window.AudioManager.audioContext;
                        const oscillator = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(window.AudioManager.gainNodes.ui || ctx.destination);
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                        oscillator.start(ctx.currentTime);
                        oscillator.stop(ctx.currentTime + 0.1);
                    }
                }
            }
            
            return result !== false; // Return true unless handler explicitly returns false
        } catch (e) {
            console.error(`Error in button handler for ${buttonId}:`, e);
            return false;
        }
    },
    
    // Scan HTML for buttons and register them
    // This runs after DOM is ready. We delegate actual button wiring to the
    // central ButtonRegistry so that all main-menu and UI buttons get a
    // single, consistent handler. This is UI-only and does not touch gameplay.
    scanAndRegisterButtons: function() {
        if (window.ButtonRegistry && typeof window.ButtonRegistry.registerAllButtons === 'function') {
            try {
                window.ButtonRegistry.registerAllButtons();
            } catch (e) {
                console.warn('[UnifiedButtonHandler] scanAndRegisterButtons failed:', e);
            }
        }
    },
    
    // Disable a button
    disableButton: function(buttonId) {
        const button = typeof buttonId === 'string' 
            ? document.getElementById(buttonId) 
            : buttonId;
        
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
            button.setAttribute('aria-disabled', 'true');
            if (button.id) {
                this.disabledButtons.add(button.id);
            }
        }
    },
    
    // Enable a button
    enableButton: function(buttonId) {
        const button = typeof buttonId === 'string' 
            ? document.getElementById(buttonId) 
            : buttonId;
        
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
            button.removeAttribute('aria-disabled');
            if (button.id) {
                this.disabledButtons.delete(button.id);
            }
        }
    },
    
    // Check if button is disabled
    isButtonDisabled: function(buttonId) {
        const button = typeof buttonId === 'string' 
            ? document.getElementById(buttonId) 
            : buttonId;
        
        if (!button) return false;
        
        return button.disabled || 
               button.classList.contains('disabled') || 
               this.disabledButtons.has(button.id || '');
    },
    
    // Handle escape key
    handleEscapeKey: function() {
        // Close world map node menu
        const nodeMenu = document.querySelector('.world-map-node-menu');
        if (nodeMenu) {
            if (window.closeNodeMenu) {
                window.closeNodeMenu();
            }
            return true;
        }
        
        // Close minigames menu
        const minigamesMenu = document.getElementById('minigamesMenu');
        if (minigamesMenu) {
            if (window.hideMinigamesMenu) {
                window.hideMinigamesMenu();
            }
            return true;
        }
        
        // Close world map
        const worldMapContainer = document.getElementById('worldMapContainer');
        if (worldMapContainer && worldMapContainer.style.display !== 'none') {
            if (window.hideWorldMap) {
                window.hideWorldMap();
            }
            return true;
        }
        
        // Close topmost modal
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            const closeBtn = activeModal.querySelector('.modal-close, [data-close]');
            if (closeBtn) {
                this.handleButtonClick(closeBtn);
                return true;
            }
        }
        
        // Close pause overlay
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay && pauseOverlay.classList.contains('show')) {
            if (typeof togglePause === 'function') {
                togglePause();
                return true;
            }
        }
        
        // Return to mode select from game screen
        const gameScreen = document.getElementById('gameScreen');
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (gameScreen && modeSelectScreen) {
            // Check both inline and computed style to handle 'important' flag
            const gameScreenDisplay = gameScreen.style.display || window.getComputedStyle(gameScreen).display;
            const isGameScreenVisible = gameScreenDisplay !== 'none';
            
            if (isGameScreenVisible) {
                const modeSelectBtn = document.getElementById('modeSelectBtn');
                if (modeSelectBtn) {
                    this.handleButtonClick(modeSelectBtn);
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Register modal close handler
    registerModalClose: function(modalId, closeButtonId = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;
        
        const closeBtn = closeButtonId 
            ? document.getElementById(closeButtonId)
            : modal.querySelector('.modal-close, [data-close]');
        
        if (closeBtn) {
            this.registerButton(closeBtn, () => {
                this.closeModal(modal);
            });
        }
        
        // Also close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        return true;
    },
    
    // Open modal
    openModal: function(modal) {
        const modalEl = typeof modal === 'string' ? document.getElementById(modal) : modal;
        if (!modalEl) return false;
        
        modalEl.classList.add('show');
        this.activeModals.push(modalEl);
        
        // Play menu open sound
        if (window.UISoundSystem && window.UISoundSystem.playMenuOpen) {
            window.UISoundSystem.playMenuOpen();
        }
        
        // Focus first focusable element
        const firstFocusable = modalEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        if (this.config.debugLogging) {
            console.log(`[Modal] Opened: ${modalEl.id}`);
        }
        
        return true;
    },
    
    // Close modal
    closeModal: function(modal) {
        const modalEl = typeof modal === 'string' ? document.getElementById(modal) : modal;
        if (!modalEl) return false;
        
        modalEl.classList.remove('show');
        const index = this.activeModals.indexOf(modalEl);
        if (index > -1) {
            this.activeModals.splice(index, 1);
        }
        
        // Restore body scroll if no modals open
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
        
        if (this.config.debugLogging) {
            console.log(`[Modal] Closed: ${modalEl.id}`);
        }
        
        return true;
    },
    
    // Get all registered buttons
    getRegisteredButtons: function() {
        return Array.from(this.buttonHandlers.keys());
    },
    
    // Clear all handlers (for cleanup)
    clearAllHandlers: function() {
        this.buttonHandlers.clear();
        this.lastClickTime.clear();
        this.disabledButtons.clear();
        this.activeModals = [];
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UnifiedButtonHandler.init();
        });
    } else {
        UnifiedButtonHandler.init();
    }
}

