// ==================== NETWORK CLIENT ====================
// WebSocket client abstraction with message queue and lag compensation

const NetworkClient = {
    // Connection state
    connected: false,
    connecting: false,
    socket: null,
    
    // Message queue
    messageQueue: [],
    pendingMessages: new Map(),
    
    // Latency tracking
    latency: 0,
    latencyHistory: [],
    
    // Client-side prediction
    predictionEnabled: true,
    predictedState: null,
    
    // Rollback state
    rollbackHistory: [],
    maxRollbackFrames: 60,
    
    // Configuration
    config: {
        serverUrl: 'ws://localhost:8080', // Mock server for testing
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        messageTimeout: 5000
    },
    
    // Initialize
    init: function() {
        // Check if mock server should be used
        if (this.shouldUseMockServer()) {
            this.setupMockServer();
        }
    },
    
    // Check if should use mock server
    shouldUseMockServer: function() {
        // Use mock server if no real server URL is configured
        return !localStorage.getItem('realServerUrl');
    },
    
    // Setup mock WebSocket server
    setupMockServer: function() {
        // Create mock WebSocket implementation
        this.mockServer = {
            clients: [],
            gameState: null,
            messageHandlers: new Map(),
            
            // Simulate WebSocket
            createConnection: (url) => {
                const mockSocket = {
                    readyState: 0, // CONNECTING
                    url: url,
                    send: (data) => {
                        // Handle message
                        mockServer.handleMessage(mockSocket, data);
                    },
                    close: () => {
                        mockSocket.readyState = 3; // CLOSED
                    }
                };
                
                // Simulate connection
                setTimeout(() => {
                    mockSocket.readyState = 1; // OPEN
                    mockServer.clients.push(mockSocket);
                    if (mockSocket.onopen) {
                        mockSocket.onopen();
                    }
                }, 100);
                
                return mockSocket;
            },
            
            handleMessage: (socket, data) => {
                try {
                    const message = JSON.parse(data);
                    this.processMessage(message, socket);
                } catch (e) {
                    console.warn('Invalid message format:', e);
                }
            },
            
            processMessage: (message, socket) => {
                // Echo back for testing
                if (message.type === 'ping') {
                    setTimeout(() => {
                        if (socket.onmessage) {
                            socket.onmessage({ data: JSON.stringify({ type: 'pong', timestamp: message.timestamp || Date.now() }) });
                        }
                    }, 10); // Simulate small delay
                } else if (message.type === 'gameState') {
                    // Broadcast to all clients
                    this.clients.forEach(client => {
                        if (client.onmessage) {
                            client.onmessage({ data: JSON.stringify(message) });
                        }
                    });
                } else if (message.type === 'createLobby') {
                    // Create lobby
                    const lobby = { ...message.lobby, clients: [socket] };
                    this.lobbies = this.lobbies || new Map();
                    this.lobbies.set(lobby.id, lobby);
                    if (socket.onmessage) {
                        socket.onmessage({ data: JSON.stringify({ type: 'lobbyCreated', lobby: lobby }) });
                    }
                } else if (message.type === 'joinLobby') {
                    // Join lobby
                    const lobby = this.lobbies ? this.lobbies.get(message.lobbyId) : null;
                    if (lobby) {
                        lobby.clients.push(socket);
                        // Notify all clients
                        lobby.clients.forEach(client => {
                            if (client.onmessage) {
                                client.onmessage({ data: JSON.stringify({ type: 'playerJoined', playerId: 'player_' + Date.now() }) });
                            }
                        });
                    }
                } else if (message.type === 'playerReady') {
                    // Broadcast ready status
                    if (socket.lobby) {
                        socket.lobby.clients.forEach(client => {
                            if (client.onmessage) {
                                client.onmessage({ data: JSON.stringify({ type: 'playerReady', ready: message.ready }) });
                            }
                        });
                    }
                }
            }
        };
    },
    
    // Connect to server
    connect: async function(serverUrl = null) {
        if (this.connecting || this.connected) {
            return false;
        }
        
        this.connecting = true;
        const url = serverUrl || this.config.serverUrl;
        
        try {
            if (this.shouldUseMockServer()) {
                // Use mock server
                if (!this.mockServer) {
                    this.setupMockServer();
                }
                this.socket = this.mockServer.createConnection(url);
            } else {
                // Use real WebSocket
                this.socket = new WebSocket(url);
            }
            
            this.setupSocketHandlers();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);
                
                this.socket.onopen = () => {
                    clearTimeout(timeout);
                    this.connected = true;
                    this.connecting = false;
                    this.onConnected();
                    resolve(true);
                };
                
                this.socket.onerror = (error) => {
                    clearTimeout(timeout);
                    this.connecting = false;
                    reject(error);
                };
            });
        } catch (e) {
            this.connecting = false;
            console.error('Connection failed:', e);
            return false;
        }
    },
    
    // Setup socket handlers
    setupSocketHandlers: function() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };
        
        this.socket.onclose = () => {
            this.connected = false;
            this.onDisconnected();
            this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    },
    
    // Handle incoming message
    handleMessage: function(message) {
        switch (message.type) {
            case 'pong':
                this.handlePong(message);
                break;
            case 'gameState':
                this.handleGameState(message);
                break;
            case 'playerInput':
                this.handlePlayerInput(message);
                break;
            case 'matchStart':
                this.handleMatchStart(message);
                break;
            case 'matchEnd':
                this.handleMatchEnd(message);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    },
    
    // Handle pong (latency measurement)
    handlePong: function(message) {
        if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            this.updateLatency(latency);
        }
    },
    
    // Update latency
    updateLatency: function(latency) {
        this.latency = latency;
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > 100) {
            this.latencyHistory.shift();
        }
    },
    
    // Handle game state
    handleGameState: function(message) {
        if (this.predictionEnabled && this.predictedState) {
            // Compare with predicted state
            if (!this.statesMatch(this.predictedState, message.state)) {
                // Divergence detected - rollback needed
                this.rollback(message.state, message.frame);
            }
        }
        
        // Update game state
        if (window.MultiplayerController) {
            window.MultiplayerController.updateGameState(message.state, message.frame);
        }
    },
    
    // Handle player input
    handlePlayerInput: function(message) {
        // Apply other player's input
        if (window.MultiplayerController) {
            window.MultiplayerController.applyRemoteInput(message.playerId, message.input);
        }
    },
    
    // Handle match start
    handleMatchStart: function(message) {
        if (window.MultiplayerController) {
            window.MultiplayerController.startMatch(message.matchData);
        }
    },
    
    // Handle match end
    handleMatchEnd: function(message) {
        if (window.MultiplayerController) {
            window.MultiplayerController.endMatch(message.results);
        }
    },
    
    // Send message
    send: function(message) {
        if (!this.connected || !this.socket) {
            this.messageQueue.push(message);
            return false;
        }
        
        try {
            const data = JSON.stringify(message);
            this.socket.send(data);
            return true;
        } catch (e) {
            console.error('Failed to send message:', e);
            this.messageQueue.push(message);
            return false;
        }
    },
    
    // Send queued messages
    sendQueuedMessages: function() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (!this.send(message)) {
                this.messageQueue.unshift(message);
                break;
            }
        }
    },
    
    // Predict game state
    predictState: function(currentState, input, frame) {
        if (!this.predictionEnabled) return currentState;
        
        // Save state for rollback
        this.saveStateForRollback(currentState, frame);
        
        // Apply input locally
        const predictedState = this.applyInput(currentState, input);
        this.predictedState = predictedState;
        
        return predictedState;
    },
    
    // Apply input to state
    applyInput: function(state, input) {
        // Create deep copy
        const newState = JSON.parse(JSON.stringify(state));
        
        // Apply input
        if (input.dx !== undefined && input.dy !== undefined) {
            // Update player direction
            const player = newState.players.find(p => p.id === input.playerId);
            if (player) {
                player.dx = input.dx;
                player.dy = input.dy;
            }
        }
        
        return newState;
    },
    
    // Save state for rollback
    saveStateForRollback: function(state, frame) {
        this.rollbackHistory.push({ state: JSON.parse(JSON.stringify(state)), frame });
        if (this.rollbackHistory.length > this.maxRollbackFrames) {
            this.rollbackHistory.shift();
        }
    },
    
    // Rollback to server state
    rollback: function(serverState, serverFrame) {
        // Find closest saved state
        const savedState = this.rollbackHistory.find(s => s.frame <= serverFrame);
        if (!savedState) {
            // No saved state - use server state
            if (window.MultiplayerController) {
                window.MultiplayerController.rollbackToState(serverState);
            }
            return;
        }
        
        // Rollback to saved state
        if (window.MultiplayerController) {
            window.MultiplayerController.rollbackToState(savedState.state);
        }
        
        // Replay inputs from saved frame to current
        // (Simplified - full implementation would replay all inputs)
    },
    
    // Check if states match (with tolerance for floating point differences)
    statesMatch: function(state1, state2) {
        if (!state1 || !state2) return false;
        
        // Compare critical fields
        if (state1.frame !== state2.frame) return false;
        if (state1.seed !== state2.seed) return false;
        
        // Compare players (with position tolerance)
        if (!state1.players || !state2.players) return false;
        if (state1.players.length !== state2.players.length) return false;
        
        for (let i = 0; i < state1.players.length; i++) {
            const p1 = state1.players[i];
            const p2 = state2.players[i];
            
            if (p1.id !== p2.id) return false;
            if (p1.alive !== p2.alive) return false;
            if (p1.score !== p2.score) return false;
            
            // Compare snake positions (with small tolerance for floating point)
            if (!p1.snake || !p2.snake) return false;
            if (p1.snake.length !== p2.snake.length) return false;
            
            for (let j = 0; j < p1.snake.length; j++) {
                const s1 = p1.snake[j];
                const s2 = p2.snake[j];
                
                if (Math.abs(s1.x - s2.x) > 0.01 || Math.abs(s1.y - s2.y) > 0.01) {
                    return false;
                }
            }
        }
        
        // Compare food position
        if (state1.food && state2.food) {
            if (Math.abs(state1.food.x - state2.food.x) > 0.01 ||
                Math.abs(state1.food.y - state2.food.y) > 0.01) {
                return false;
            }
        }
        
        return true;
    },
    
    // Attempt reconnect
    attemptReconnect: function() {
        let attempts = 0;
        const reconnect = () => {
            if (attempts >= this.config.maxReconnectAttempts) {
                console.error('Max reconnect attempts reached');
                return;
            }
            
            attempts++;
            setTimeout(() => {
                this.connect().catch(() => {
                    reconnect();
                });
            }, this.config.reconnectInterval);
        };
        
        reconnect();
    },
    
    // Ping server (latency measurement)
    ping: function() {
        if (!this.connected) return;
        
        this.send({
            type: 'ping',
            timestamp: Date.now()
        });
    },
    
    // Start ping loop
    startPingLoop: function() {
        setInterval(() => {
            if (this.connected) {
                this.ping();
            }
        }, 1000);
    },
    
    // Disconnect
    disconnect: function() {
        // Stop ping loop
        this.stopPingLoop();
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.connecting = false;
        
        // Clear queues
        this.messageQueue = [];
        this.rollbackHistory = [];
        this.predictedState = null;
    },
    
    // Get latency
    getLatency: function() {
        return this.latency;
    },
    
    // Get average latency
    getAverageLatency: function() {
        if (this.latencyHistory.length === 0) return 0;
        const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
        return sum / this.latencyHistory.length;
    },
    
    // On connected callback
    onConnected: function() {
        this.sendQueuedMessages();
        this.startPingLoop();
        console.log('Connected to server');
    },
    
    // On disconnected callback
    onDisconnected: function() {
        console.log('Disconnected from server');
    }
};

// Export
window.NetworkClient = NetworkClient;

