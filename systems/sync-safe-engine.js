// ==================== SYNC-SAFE ENGINE ====================
// Deterministic game updates for stable multiplayer

const SyncSafeEngine = {
    // Deterministic RNG
    rng: null,
    rngSeed: null,
    
    // State history for rollback
    stateHistory: [],
    maxHistoryFrames: 120,
    
    // Fixed tick rate
    fixedTickRate: 60,
    tickInterval: 1000 / 60,
    
    // Initialize
    init: function() {
        // Use existing tick engine if available
        if (window.TickEngine) {
            this.fixedTickRate = 60;
            this.tickInterval = window.TickEngine.getFixedTimestep();
        }
    },
    
    // Set seed for deterministic RNG
    setSeed: function(seed) {
        this.rngSeed = seed;
        this.rng = this.createSeededRNG(seed);
    },
    
    // Create seeded RNG
    createSeededRNG: function(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    },
    
    // Get random number (deterministic)
    random: function() {
        if (!this.rng) {
            // Fallback to Math.random if no seed set
            return Math.random();
        }
        return this.rng();
    },
    
    // Get seeded random (alias for random, for compatibility)
    getSeededRandom: function() {
        return this.random();
    },
    
    // Generate deterministic food position
    generateFood: function(frame, occupiedPositions = []) {
        const GRID_COLS = 20;
        const GRID_ROWS = 20;
        
        // Use frame as additional seed component
        const foodSeed = this.rngSeed + frame;
        const foodRNG = this.createSeededRNG(foodSeed);
        
        let attempts = 0;
        let food;
        
        do {
            food = {
                x: Math.floor(foodRNG() * GRID_COLS),
                y: Math.floor(foodRNG() * GRID_ROWS)
            };
            attempts++;
        } while (
            occupiedPositions.some(pos => pos.x === food.x && pos.y === food.y) &&
            attempts < 100
        );
        
        return food;
    },
    
    // Save state for rollback
    saveState: function(state, frame) {
        this.stateHistory.push({
            frame: frame,
            state: JSON.parse(JSON.stringify(state)) // Deep copy
        });
        
        // Limit history size
        if (this.stateHistory.length > this.maxHistoryFrames) {
            this.stateHistory.shift();
        }
    },
    
    // Get state at frame
    getStateAtFrame: function(frame) {
        // Find closest saved state
        for (let i = this.stateHistory.length - 1; i >= 0; i--) {
            if (this.stateHistory[i].frame <= frame) {
                return this.stateHistory[i].state;
            }
        }
        return null;
    },
    
    // Rollback to frame
    rollbackToFrame: function(targetFrame) {
        const savedState = this.getStateAtFrame(targetFrame);
        if (!savedState) {
            console.warn(`No saved state for frame ${targetFrame}`);
            return false;
        }
        
        // Restore state
        if (window.MultiplayerController) {
            window.MultiplayerController.rollbackToState(savedState);
        }
        
        return true;
    },
    
    // Rewind and replay
    rewindAndReplay: function(targetFrame, inputs) {
        // Rollback to target frame
        if (!this.rollbackToFrame(targetFrame)) {
            return false;
        }
        
        // Replay inputs from target frame to current
        // (Simplified - full implementation would replay all game logic)
        for (const input of inputs) {
            if (input.frame >= targetFrame) {
                // Apply input
                if (window.MultiplayerController) {
                    window.MultiplayerController.applyRemoteInput(input.playerId, input.input);
                }
            }
        }
        
        return true;
    },
    
    // Deterministic update
    deterministicUpdate: function(state, frame) {
        // Create new state
        const newState = JSON.parse(JSON.stringify(state));
        newState.frame = frame;
        
        // Update with deterministic logic
        // All random operations use seeded RNG
        // All calculations are deterministic
        
        return newState;
    },
    
    // Verify state consistency
    verifyStateConsistency: function(state1, state2) {
        // Compare critical state fields
        if (state1.frame !== state2.frame) return false;
        if (state1.seed !== state2.seed) return false;
        
        // Compare player states
        if (state1.players.length !== state2.players.length) return false;
        
        for (let i = 0; i < state1.players.length; i++) {
            const p1 = state1.players[i];
            const p2 = state2.players[i];
            
            if (p1.id !== p2.id) return false;
            if (p1.snake.length !== p2.snake.length) return false;
            
            // Compare snake positions
            for (let j = 0; j < p1.snake.length; j++) {
                if (p1.snake[j].x !== p2.snake[j].x || 
                    p1.snake[j].y !== p2.snake[j].y) {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    // Get fixed tick rate
    getFixedTickRate: function() {
        return this.fixedTickRate;
    },
    
    // Get tick interval
    getTickInterval: function() {
        return this.tickInterval;
    },
    
    // Clear state history
    clearHistory: function() {
        this.stateHistory = [];
    }
};

// Export
window.SyncSafeEngine = SyncSafeEngine;

