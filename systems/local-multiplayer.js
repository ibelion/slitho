// ==================== LOCAL MULTIPLAYER SYSTEM ====================
// Two-player local multiplayer with configurable collision rules

const LocalMultiplayer = {
    // Game state
    isActive: false,
    mode: null, // 'competitive', 'coop', 'shared'
    players: [],
    
    // Configuration
    config: {
        snakeVsSnake: true, // Can snakes collide with each other?
        snakeVsTail: true, // Can snakes collide with own/other tails?
        sharedFruit: false, // Shared fruit or separate?
        separateScoring: true, // Separate scores per player
        sharedBoard: true // Same board or split screen
    },
    
    // Initialize
    init: function() {
        this.setupInputHandlers();
    },
    
    // Setup input handlers
    setupInputHandlers: function() {
        // Player 1: Arrow keys (handled by existing system)
        // Player 2: WASD
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            const player2 = this.players.find(p => p.id === 'player2');
            if (!player2) return;
            
            let dx = 0, dy = 0;
            switch (e.key.toLowerCase()) {
                case 'w': dy = -1; break;
                case 's': dy = 1; break;
                case 'a': dx = -1; break;
                case 'd': dx = 1; break;
            }
            
            if (dx !== 0 || dy !== 0) {
                this.handlePlayerInput('player2', dx, dy);
                e.preventDefault();
            }
        });
    },
    
    // Start local multiplayer
    start: function(mode, config = {}) {
        this.isActive = true;
        this.mode = mode;
        this.config = { ...this.config, ...config };
        
        // Initialize players
        this.players = [
            {
                id: 'player1',
                name: 'Player 1',
                color: '#4CAF50',
                snake: [{ x: 5, y: 10 }],
                dx: 0,
                dy: 0,
                score: 0,
                alive: true,
                inputMethod: 'arrows'
            },
            {
                id: 'player2',
                name: 'Player 2',
                color: '#2196F3',
                snake: [{ x: 15, y: 10 }],
                dx: 0,
                dy: 0,
                score: 0,
                alive: true,
                inputMethod: 'wasd'
            }
        ];
        
        // Initialize game state
        this.initializeGameState();
        
        // Start game loop
        if (window.TickEngine) {
            window.TickEngine.start();
        }
    },
    
    // Stop local multiplayer
    stop: function() {
        this.isActive = false;
        this.players = [];
        this.mode = null;
    },
    
    // Initialize game state
    initializeGameState: function() {
        // Generate food based on mode
        if (this.config.sharedFruit) {
            // Single food for both players
            this.sharedFood = this.generateFood();
        } else {
            // Separate food for each player
            this.players.forEach(player => {
                player.food = this.generateFood();
            });
        }
    },
    
    // Generate food
    generateFood: function() {
        const GRID_COLS = 20;
        const GRID_ROWS = 20;
        
        let attempts = 0;
        let food;
        
        do {
            food = {
                x: Math.floor(Math.random() * GRID_COLS),
                y: Math.floor(Math.random() * GRID_ROWS)
            };
            attempts++;
        } while (this.isFoodPositionInvalid(food) && attempts < 100);
        
        return food;
    },
    
    // Check if food position is invalid
    isFoodPositionInvalid: function(food) {
        // Check all player snakes
        for (const player of this.players) {
            if (player.snake.some(segment => segment.x === food.x && segment.y === food.y)) {
                return true;
            }
        }
        return false;
    },
    
    // Handle player input
    handlePlayerInput: function(playerId, dx, dy) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.alive) return;
        
        // Prevent 180-degree turns
        if (player.dx === -dx && player.dy === -dy) {
            return;
        }
        
        // Prevent same direction
        if (player.dx === dx && player.dy === dy) {
            return;
        }
        
        player.dx = dx;
        player.dy = dy;
    },
    
    // Update multiplayer game logic
    update: function() {
        if (!this.isActive) return;
        
        // Update each player
        for (const player of this.players) {
            if (!player.alive) continue;
            
            this.updatePlayer(player);
        }
        
        // Check win conditions
        this.checkWinConditions();
    },
    
    // Update single player
    updatePlayer: function(player) {
        if (player.dx === 0 && player.dy === 0) return;
        
        const head = player.snake[0];
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
        
        // Snake vs snake collision
        if (this.config.snakeVsSnake) {
            for (const otherPlayer of this.players) {
                if (otherPlayer.id === player.id || !otherPlayer.alive) continue;
                
                // Check head collision
                if (otherPlayer.snake[0].x === newHead.x && 
                    otherPlayer.snake[0].y === newHead.y) {
                    // Both die on head collision
                    player.alive = false;
                    otherPlayer.alive = false;
                    return;
                }
                
                // Check tail collision
                if (this.config.snakeVsTail) {
                    if (otherPlayer.snake.slice(1).some(segment =>
                        segment.x === newHead.x && segment.y === newHead.y)) {
                        player.alive = false;
                        return;
                    }
                }
            }
        }
        
        // Move snake
        player.snake.unshift(newHead);
        
        // Check food collision
        let foodEaten = false;
        if (this.config.sharedFruit) {
            if (newHead.x === this.sharedFood.x && newHead.y === this.sharedFood.y) {
                foodEaten = true;
                player.score++;
                this.sharedFood = this.generateFood();
            }
        } else {
            if (newHead.x === player.food.x && newHead.y === player.food.y) {
                foodEaten = true;
                player.score++;
                player.food = this.generateFood();
            }
        }
        
        // Remove tail if no food eaten
        if (!foodEaten) {
            player.snake.pop();
        }
    },
    
    // Check win conditions
    checkWinConditions: function() {
        const alivePlayers = this.players.filter(p => p.alive);
        
        if (alivePlayers.length === 0) {
            // All dead - draw
            this.endGame({ result: 'draw' });
        } else if (alivePlayers.length === 1) {
            // One winner
            this.endGame({ 
                result: 'win', 
                winner: alivePlayers[0].id,
                winnerName: alivePlayers[0].name
            });
        }
        
        // Mode-specific win conditions
        if (this.mode === 'competitive') {
            // First to score wins
            const winner = this.players.find(p => p.score >= 10);
            if (winner) {
                this.endGame({ 
                    result: 'win', 
                    winner: winner.id,
                    winnerName: winner.name
                });
            }
        } else if (this.mode === 'coop') {
            // Survive together
            if (alivePlayers.length === this.players.length) {
                // All alive - continue
            } else {
                // Someone died - game over
                this.endGame({ result: 'lose' });
            }
        }
    },
    
    // End game
    endGame: function(result) {
        this.isActive = false;
        
        if (window.UI && window.UI.showMultiplayerResults) {
            window.UI.showMultiplayerResults(result, this.players);
        }
    },
    
    // Get player state
    getPlayerState: function(playerId) {
        return this.players.find(p => p.id === playerId);
    },
    
    // Get all players
    getAllPlayers: function() {
        return [...this.players];
    },
    
    // Get game state for rendering
    getGameState: function() {
        return {
            isActive: this.isActive,
            mode: this.mode,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                snake: p.snake,
                score: p.score,
                alive: p.alive
            })),
            sharedFood: this.config.sharedFruit ? this.sharedFood : null
        };
    }
};

// Export
window.LocalMultiplayer = LocalMultiplayer;

