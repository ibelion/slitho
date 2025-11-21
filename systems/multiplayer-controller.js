// ==================== MULTIPLAYER CONTROLLER ====================
// Manages online matches, lobbies, and match flow

const MultiplayerController = {
    // Match state
    currentMatch: null,
    matchType: null, // 'race_1v1', 'survival_1v1', 'ffa_4', 'spectator'
    players: [],
    localPlayerId: null,
    
    // Lobby state
    lobby: null,
    readyPlayers: new Set(),
    
    // Match flow
    matchState: 'idle', // 'idle', 'lobby', 'ready', 'countdown', 'playing', 'finished'
    countdown: 0,
    
    // Game state
    gameState: null,
    currentFrame: 0,
    
    // Initialize
    init: function() {
        this.localPlayerId = window.PlayerIdentity ? window.PlayerIdentity.getId() : 'player_' + Date.now();
    },
    
    // Create lobby
    createLobby: function(matchType) {
        this.matchType = matchType;
        this.matchState = 'lobby';
        
        this.lobby = {
            id: 'lobby_' + Date.now(),
            matchType: matchType,
            players: [],
            maxPlayers: this.getMaxPlayers(matchType),
            settings: this.getDefaultSettings(matchType)
        };
        
        // Add local player
        this.addPlayerToLobby(this.localPlayerId);
        
        // Send lobby creation to server
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'createLobby',
                lobby: this.lobby
            });
        }
        
        return this.lobby;
    },
    
    // Join lobby
    joinLobby: function(lobbyId) {
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'joinLobby',
                lobbyId: lobbyId
            });
        }
    },
    
    // Add player to lobby
    addPlayerToLobby: function(playerId) {
        if (!this.lobby) return;
        
        const player = {
            id: playerId,
            name: window.PlayerIdentity ? window.PlayerIdentity.getName() : 'Player',
            ready: false
        };
        
        this.lobby.players.push(player);
        this.players.push(player);
    },
    
    // Set ready
    setReady: function(ready) {
        if (!this.lobby) return;
        
        const player = this.lobby.players.find(p => p.id === this.localPlayerId);
        if (player) {
            player.ready = ready;
        }
        
        if (ready) {
            this.readyPlayers.add(this.localPlayerId);
        } else {
            this.readyPlayers.delete(this.localPlayerId);
        }
        
        // Send ready status
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'playerReady',
                ready: ready
            });
        }
        
        // Check if all ready
        this.checkAllReady();
    },
    
    // Check if all players ready
    checkAllReady: function() {
        if (!this.lobby) return;
        
        if (this.lobby.players.length === this.lobby.maxPlayers &&
            this.lobby.players.every(p => p.ready)) {
            this.startCountdown();
        }
    },
    
    // Start countdown
    startCountdown: function() {
        this.matchState = 'countdown';
        this.countdown = 3;
        
        const countdownInterval = setInterval(() => {
            this.countdown--;
            
            if (this.countdown <= 0) {
                clearInterval(countdownInterval);
                this.startMatch();
            }
        }, 1000);
    },
    
    // Start match
    startMatch: function() {
        this.matchState = 'playing';
        this.currentFrame = 0;
        
        // Initialize game state
        this.initializeGameState();
        
        // Start game loop
        if (window.TickEngine) {
            window.TickEngine.start();
        }
        
        // Notify match start
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'matchStart',
                matchData: {
                    type: this.matchType,
                    players: this.players,
                    seed: this.gameState.seed
                }
            });
        }
    },
    
    // Initialize game state
    initializeGameState: function() {
        const seed = this.generateSeed();
        const rng = this.seededRandom(seed);
        
        this.gameState = {
            frame: 0,
            seed: seed,
            players: this.players.map((player, index) => ({
                id: player.id,
                name: player.name,
                snake: [{ x: 5 + index * 5, y: 10 }],
                dx: 0,
                dy: 0,
                score: 0,
                alive: true,
                color: this.getPlayerColor(index)
            })),
            food: this.generateFood(rng)
        };
    },
    
    // Generate seed
    generateSeed: function() {
        return Math.floor(Math.random() * 1000000);
    },
    
    // Seeded random
    seededRandom: function(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    },
    
    // Generate food
    generateFood: function(rng) {
        const GRID_COLS = 20;
        const GRID_ROWS = 20;
        
        return {
            x: Math.floor(rng() * GRID_COLS),
            y: Math.floor(rng() * GRID_ROWS)
        };
    },
    
    // Get player color
    getPlayerColor: function(index) {
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
        return colors[index % colors.length];
    },
    
    // Update match
    update: function() {
        if (this.matchState !== 'playing') return;
        
        this.currentFrame++;
        this.gameState.frame = this.currentFrame;
        
        // Update game logic
        this.updateGameLogic();
        
        // Send state to server
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'gameState',
                state: this.gameState,
                frame: this.currentFrame
            });
        }
        
        // Check win conditions
        this.checkWinConditions();
    },
    
    // Update game logic
    updateGameLogic: function() {
        // Update each player
        for (const player of this.gameState.players) {
            if (!player.alive) continue;
            
            this.updatePlayer(player);
        }
    },
    
    // Update player
    updatePlayer: function(player) {
        if (!player || !player.snake || player.snake.length === 0) return;
        if (player.dx === 0 && player.dy === 0) return;
        
        const head = player.snake[0];
        if (!head || typeof head.x !== 'number' || typeof head.y !== 'number') return;
        const newHead = {
            x: head.x + player.dx,
            y: head.y + player.dy
        };
        
        // Wall collision
        const GRID_COLS = 20;
        const GRID_ROWS = 20;
        if (newHead.x < 0 || newHead.x >= GRID_COLS || 
            newHead.y < 0 || newHead.y >= GRID_ROWS) {
            player.alive = false;
            return;
        }
        
        // Self collision
        if (player.snake.slice(1).some(segment => 
            segment.x === newHead.x && segment.y === newHead.y)) {
            player.alive = false;
            return;
        }
        
        // Other player collision
        for (const otherPlayer of this.gameState.players) {
            if (otherPlayer.id === player.id || !otherPlayer.alive) continue;
            
            // Head collision (safe array access)
            if (otherPlayer.snake && otherPlayer.snake.length > 0 &&
                otherPlayer.snake[0].x === newHead.x && 
                otherPlayer.snake[0].y === newHead.y) {
                player.alive = false;
                otherPlayer.alive = false;
                return;
            }
            
            // Tail collision
            if (otherPlayer.snake.slice(1).some(segment =>
                segment.x === newHead.x && segment.y === newHead.y)) {
                player.alive = false;
                return;
            }
        }
        
        // Move snake
        player.snake.unshift(newHead);
        
        // Check food
        if (newHead.x === this.gameState.food.x && 
            newHead.y === this.gameState.food.y) {
            player.score++;
            const rng = this.seededRandom(this.gameState.seed + this.currentFrame);
            this.gameState.food = this.generateFood(rng);
        } else {
            player.snake.pop();
        }
    },
    
    // Handle local input
    handleInput: function(dx, dy) {
        if (this.matchState !== 'playing') return;
        
        // Send input to server
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'playerInput',
                playerId: this.localPlayerId,
                input: { dx, dy },
                frame: this.currentFrame
            });
        }
        
        // Apply locally with prediction
        const player = this.gameState.players.find(p => p.id === this.localPlayerId);
        if (player) {
            player.dx = dx;
            player.dy = dy;
            
            // Predict state
            if (window.NetworkClient && window.NetworkClient.predictionEnabled) {
                const predictedState = window.NetworkClient.predictState(
                    this.gameState,
                    { playerId: this.localPlayerId, dx, dy },
                    this.currentFrame
                );
                this.gameState = predictedState;
            }
        }
    },
    
    // Apply remote input
    applyRemoteInput: function(playerId, input) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (player) {
            player.dx = input.dx;
            player.dy = input.dy;
        }
    },
    
    // Update game state from server
    updateGameState: function(serverState, serverFrame) {
        // Use server state as authoritative
        this.gameState = serverState;
        this.currentFrame = serverFrame;
    },
    
    // Rollback to state (with validation)
    rollbackToState: function(state) {
        if (!state || !state.players) {
            console.warn('Invalid state for rollback');
            return false;
        }
        
        // Validate state structure
        if (!Array.isArray(state.players)) {
            console.warn('Invalid players array in rollback state');
            return false;
        }
        
        // Deep copy state to prevent mutation
        this.gameState = JSON.parse(JSON.stringify(state));
        
        // Verify state consistency if SyncSafeEngine available
        if (window.SyncSafeEngine && window.SyncSafeEngine.verifyStateConsistency) {
            const currentState = {
                frame: this.currentFrame,
                seed: this.gameState.seed,
                players: this.gameState.players
            };
            if (!window.SyncSafeEngine.verifyStateConsistency(currentState, state)) {
                console.warn('State consistency check failed during rollback');
                // Continue anyway - rollback is better than desync
            }
        }
        
        return true;
    },
    
    // Check win conditions
    checkWinConditions: function() {
        const alivePlayers = this.gameState.players.filter(p => p.alive);
        
        if (this.matchType === 'race_1v1' || this.matchType === 'survival_1v1') {
            if (alivePlayers.length <= 1) {
                this.endMatch({
                    winner: alivePlayers[0] ? alivePlayers[0].id : null,
                    players: this.gameState.players
                });
            }
        } else if (this.matchType === 'ffa_4') {
            if (alivePlayers.length <= 1) {
                this.endMatch({
                    winner: alivePlayers[0] ? alivePlayers[0].id : null,
                    players: this.gameState.players
                });
            }
        }
    },
    
    // End match
    endMatch: function(results) {
        this.matchState = 'finished';
        
        if (window.NetworkClient && window.NetworkClient.connected) {
            window.NetworkClient.send({
                type: 'matchEnd',
                results: results
            });
        }
        
        // Show results
        if (window.UI && window.UI.showMultiplayerResults) {
            window.UI.showMultiplayerResults(results, this.gameState.players);
        }
    },
    
    // Get max players for match type
    getMaxPlayers: function(matchType) {
        switch (matchType) {
            case 'race_1v1':
            case 'survival_1v1':
                return 2;
            case 'ffa_4':
                return 4;
            case 'spectator':
                return 1;
            default:
                return 2;
        }
    },
    
    // Get default settings
    getDefaultSettings: function(matchType) {
        return {
            targetScore: matchType === 'race_1v1' ? 10 : null,
            timeLimit: null
        };
    },
    
    // Get current match state
    getMatchState: function() {
        return {
            matchState: this.matchState,
            matchType: this.matchType,
            players: this.players,
            countdown: this.countdown,
            gameState: this.gameState
        };
    }
};

// Export
window.MultiplayerController = MultiplayerController;

