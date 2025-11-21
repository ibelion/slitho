// ==================== UNIFIED INPUT ROUTER ====================
// Central input routing system that unifies all input sources
// Prevents conflicts, ensures consistent buffering, and routes to correct handlers

const UnifiedInputRouter = {
    // Configuration
    config: {
        enabled: true,
        inputBufferSize: 3, // Max queued inputs per tick
        prevent180Turn: true,
        deadZone: 0.1,
        priority: {
            keyboard: 1,
            gamepad: 2,
            touch: 3
        }
    },
    
    // State
    inputQueue: [],
    lastInputTime: 0,
    inputSources: new Map(), // Track active input sources
    currentDirection: { dx: 0, dy: 0 },
    pendingDirection: null,
    inputLocked: false,
    
    // Initialize
    init: function() {
        this.setupInputSources();
        this.reset();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('UnifiedInputRouter', this);
        }
        
        window.UnifiedInputRouter = this;
    },
    
    // Setup input sources
    setupInputSources: function() {
        this.inputSources.set('keyboard', {
            active: false,
            lastInput: 0,
            priority: this.config.priority.keyboard
        });
        
        this.inputSources.set('gamepad', {
            active: false,
            lastInput: 0,
            priority: this.config.priority.gamepad
        });
        
        this.inputSources.set('touch', {
            active: false,
            lastInput: 0,
            priority: this.config.priority.touch
        });
    },
    
    // Reset input state
    reset: function() {
        this.inputQueue = [];
        this.lastInputTime = 0;
        this.currentDirection = { dx: 0, dy: 0 };
        this.pendingDirection = null;
        this.inputLocked = false;
        
        // Reset all input sources
        this.inputSources.forEach(source => {
            source.active = false;
            source.lastInput = 0;
        });
    },
    
    // Register input from any source
    registerInput: function(source, dx, dy, timestamp = null) {
        if (!this.config.enabled || this.inputLocked) return false;
        
        // Validate input
        if (typeof dx !== 'number' || typeof dy !== 'number') return false;
        if (isNaN(dx) || isNaN(dy)) return false;
        
        // Normalize direction (only allow cardinal directions)
        const normalized = this.normalizeDirection(dx, dy);
        if (!normalized) return false;
        
        // Check for 180-degree turn prevention
        if (this.config.prevent180Turn) {
            if (this.is180Turn(this.currentDirection, normalized)) {
                return false; // Reject 180-degree turn
            }
        }
        
        // Update input source tracking
        const sourceData = this.inputSources.get(source);
        if (sourceData) {
            sourceData.active = true;
            sourceData.lastInput = timestamp || Date.now();
        }
        
        // Add to queue if not full
        if (this.inputQueue.length < this.config.inputBufferSize) {
            this.inputQueue.push({
                source: source,
                dx: normalized.dx,
                dy: normalized.dy,
                timestamp: timestamp || Date.now()
            });
        }
        
        return true;
    },
    
    // Normalize direction to cardinal (only -1, 0, 1)
    normalizeDirection: function(dx, dy) {
        // Check if input is significant
        if (Math.abs(dx) < this.config.deadZone && Math.abs(dy) < this.config.deadZone) {
            return null;
        }
        
        // Determine primary direction
        if (Math.abs(dx) > Math.abs(dy)) {
            return { dx: dx > 0 ? 1 : -1, dy: 0 };
        } else if (Math.abs(dy) > Math.abs(dx)) {
            return { dx: 0, dy: dy > 0 ? 1 : -1 };
        }
        
        // If equal, prefer horizontal
        if (Math.abs(dx) > 0) {
            return { dx: dx > 0 ? 1 : -1, dy: 0 };
        }
        
        return null;
    },
    
    // Check if direction change is a 180-degree turn
    is180Turn: function(current, newDir) {
        if (!current || current.dx === 0 && current.dy === 0) return false;
        
        return (current.dx !== 0 && newDir.dx === -current.dx && newDir.dy === 0) ||
               (current.dy !== 0 && newDir.dy === -current.dy && newDir.dx === 0);
    },
    
    // Process input queue (called each tick)
    processInputQueue: function() {
        if (this.inputQueue.length === 0) return null;
        
        // Get highest priority input
        let bestInput = null;
        let bestPriority = Infinity;
        
        for (const input of this.inputQueue) {
            const sourceData = this.inputSources.get(input.source);
            if (sourceData && sourceData.priority < bestPriority) {
                bestInput = input;
                bestPriority = sourceData.priority;
            }
        }
        
        // Clear queue after processing
        this.inputQueue = [];
        
        if (bestInput) {
            this.currentDirection = { dx: bestInput.dx, dy: bestInput.dy };
            return bestInput;
        }
        
        return null;
    },
    
    // Route input to appropriate handler
    routeInput: function(dx, dy) {
        // Check multiplayer first
        if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
            // Determine which player based on input source
            const lastInput = this.inputQueue[this.inputQueue.length - 1];
            if (lastInput && lastInput.source === 'keyboard') {
                // Arrow keys = Player 1, WASD = Player 2
                // This is handled by the keyboard handler, but we route here for consistency
                return; // Keyboard handler routes directly
            }
            // Touch/Gamepad = Player 1 in local multiplayer
            window.LocalMultiplayer.handlePlayerInput('player1', dx, dy);
            return;
        }
        
        if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
            window.MultiplayerController.handleInput(dx, dy);
            return;
        }
        
        // Single-player routing
        if (typeof changeDirection === 'function') {
            changeDirection(dx, dy);
        } else if (window.changeDirection) {
            window.changeDirection(dx, dy);
        }
    },
    
    // Lock input (e.g., during menu transitions)
    lockInput: function() {
        this.inputLocked = true;
        this.inputQueue = [];
    },
    
    // Unlock input
    unlockInput: function() {
        this.inputLocked = false;
    },
    
    // Get current direction
    getCurrentDirection: function() {
        return { ...this.currentDirection };
    },
    
    // Check if input source is active
    isInputSourceActive: function(source) {
        const sourceData = this.inputSources.get(source);
        if (!sourceData) return false;
        
        // Consider active if input within last 100ms
        return sourceData.active && (Date.now() - sourceData.lastInput) < 100;
    },
    
    // Get active input sources
    getActiveInputSources: function() {
        const active = [];
        this.inputSources.forEach((data, source) => {
            if (this.isInputSourceActive(source)) {
                active.push(source);
            }
        });
        return active;
    }
};

// Auto-initialize if window is available
if (typeof window !== 'undefined') {
    // Initialize after other input systems
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            UnifiedInputRouter.init();
        });
    } else {
        UnifiedInputRouter.init();
    }
}

