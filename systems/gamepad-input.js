// ==================== GAMEPAD INPUT SYSTEM ====================
// Full controller support for Xbox, PlayStation, and generic gamepads

const GamepadInput = {
    // Configuration
    config: {
        enabled: true,
        deadZone: 0.15, // Analog stick dead zone
        vibrationEnabled: true,
        vibrationIntensity: 0.5, // 0.0 to 1.0
        pollInterval: 16, // Polling interval in ms
        buttonMapping: {
            // Xbox controller mapping
            xbox: {
                confirm: 0, // A button
                back: 1, // B button
                menu: 9, // Menu button
                dpadUp: 12,
                dpadDown: 13,
                dpadLeft: 14,
                dpadRight: 15,
                leftStick: 10,
                rightStick: 11
            },
            // PlayStation controller mapping
            playstation: {
                confirm: 0, // X button
                back: 1, // Circle button
                menu: 9, // Options button
                dpadUp: 12,
                dpadDown: 13,
                dpadLeft: 14,
                dpadRight: 15,
                leftStick: 10,
                rightStick: 11
            },
            // Generic mapping (fallback)
            generic: {
                confirm: 0,
                back: 1,
                menu: 9,
                dpadUp: 12,
                dpadDown: 13,
                dpadLeft: 14,
                dpadRight: 15,
                leftStick: 10,
                rightStick: 11
            }
        }
    },
    
    // State
    gamepads: [],
    connectedGamepads: new Map(),
    lastButtonStates: new Map(),
    lastStickStates: new Map(),
    pollIntervalId: null,
    currentMapping: null,
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.setupEventListeners();
        this.startPolling();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('GamepadInput', this);
        }
        
        window.GamepadInput = this;
    },
    
    // Load settings from localStorage
    loadSettings: function() {
        const saved = localStorage.getItem('gamepadInputSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            } catch (e) {
                console.warn('Failed to load gamepad settings:', e);
            }
        }
    },
    
    // Save settings to localStorage
    saveSettings: function() {
        try {
            localStorage.setItem('gamepadInputSettings', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save gamepad settings:', e);
        }
    },
    
    // Event handler references (for cleanup)
    gamepadConnectedHandler: null,
    gamepadDisconnectedHandler: null,
    
    // Setup event listeners
    setupEventListeners: function() {
        // Store handler references for cleanup
        this.gamepadConnectedHandler = (e) => {
            this.handleGamepadConnected(e.gamepad);
        };
        
        this.gamepadDisconnectedHandler = (e) => {
            this.handleGamepadDisconnected(e.gamepad);
        };
        
        // Gamepad connected
        window.addEventListener('gamepadconnected', this.gamepadConnectedHandler);
        
        // Gamepad disconnected
        window.addEventListener('gamepaddisconnected', this.gamepadDisconnectedHandler);
    },
    
    // Handle gamepad connected
    handleGamepadConnected: function(gamepad) {
        console.log('Gamepad connected:', gamepad.id);
        
        this.connectedGamepads.set(gamepad.index, {
            gamepad: gamepad,
            id: gamepad.id,
            mapping: this.detectControllerType(gamepad),
            connected: true
        });
        
        // Trigger haptic feedback
        this.triggerVibration(gamepad.index, 'light');
        
        // Show notification
        this.showGamepadNotification('Controller connected');
    },
    
    // Handle gamepad disconnected
    handleGamepadDisconnected: function(gamepad) {
        console.log('Gamepad disconnected:', gamepad.id);
        
        this.connectedGamepads.delete(gamepad.index);
        this.lastButtonStates.delete(gamepad.index);
        this.lastStickStates.delete(gamepad.index);
        
        // Show notification
        this.showGamepadNotification('Controller disconnected');
    },
    
    // Detect controller type
    detectControllerType: function(gamepad) {
        const id = gamepad.id.toLowerCase();
        
        if (id.includes('xbox') || id.includes('microsoft')) {
            return 'xbox';
        } else if (id.includes('playstation') || id.includes('sony') || id.includes('dualshock') || id.includes('dualsense')) {
            return 'playstation';
        } else {
            return 'generic';
        }
    },
    
    // Get button mapping for controller
    getButtonMapping: function(gamepadIndex) {
        const gamepadData = this.connectedGamepads.get(gamepadIndex);
        if (!gamepadData) return this.config.buttonMapping.generic;
        
        return this.config.buttonMapping[gamepadData.mapping] || this.config.buttonMapping.generic;
    },
    
    // Start polling gamepads
    startPolling: function() {
        if (this.pollIntervalId) return;
        
        this.pollIntervalId = setInterval(() => {
            if (this.config.enabled) {
                this.pollGamepads();
            }
        }, this.config.pollInterval);
    },
    
    // Stop polling gamepads
    stopPolling: function() {
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
        }
    },
    
    // Poll all gamepads
    pollGamepads: function() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            this.processGamepadInput(gamepad);
        }
    },
    
    // Process gamepad input
    processGamepadInput: function(gamepad) {
        const mapping = this.getButtonMapping(gamepad.index);
        const lastButtons = this.lastButtonStates.get(gamepad.index) || [];
        const lastStick = this.lastStickStates.get(gamepad.index) || { x: 0, y: 0 };
        
        // Process D-pad
        let dpadX = 0, dpadY = 0;
        if (gamepad.buttons[mapping.dpadUp]?.pressed) dpadY = -1;
        if (gamepad.buttons[mapping.dpadDown]?.pressed) dpadY = 1;
        if (gamepad.buttons[mapping.dpadLeft]?.pressed) dpadX = -1;
        if (gamepad.buttons[mapping.dpadRight]?.pressed) dpadX = 1;
        
        // Process left stick (axes 0 and 1)
        let stickX = 0, stickY = 0;
        if (gamepad.axes.length >= 2) {
            stickX = Math.abs(gamepad.axes[0]) > this.config.deadZone ? gamepad.axes[0] : 0;
            stickY = Math.abs(gamepad.axes[1]) > this.config.deadZone ? gamepad.axes[1] : 0;
            
            // Normalize to -1, 0, 1
            stickX = stickX > 0 ? 1 : (stickX < 0 ? -1 : 0);
            stickY = stickY > 0 ? 1 : (stickY < 0 ? -1 : 0);
        }
        
        // Combine D-pad and stick (D-pad takes priority)
        const dirX = dpadX !== 0 ? dpadX : stickX;
        const dirY = dpadY !== 0 ? dpadY : stickY;
        
        // Send movement input if direction changed
        if (dirX !== lastStick.x || dirY !== lastStick.y) {
            if (dirX !== 0 || dirY !== 0) {
                this.sendMovementInput(dirX, dirY);
            }
            this.lastStickStates.set(gamepad.index, { x: dirX, y: dirY });
        }
        
        // Process buttons
        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const wasPressed = lastButtons[i] || false;
            const isPressed = button.pressed;
            
            if (isPressed && !wasPressed) {
                this.handleButtonPress(gamepad.index, i, mapping);
            }
            
            lastButtons[i] = isPressed;
        }
        
        // Update state
        this.lastButtonStates.set(gamepad.index, lastButtons);
        this.lastStickStates.set(gamepad.index, lastStick);
    },
    
    // Handle button press
    handleButtonPress: function(gamepadIndex, buttonIndex, mapping) {
        // Confirm button
        if (buttonIndex === mapping.confirm) {
            this.handleConfirm();
        }
        // Back button
        else if (buttonIndex === mapping.back) {
            this.handleBack();
        }
        // Menu button
        else if (buttonIndex === mapping.menu) {
            this.handleMenu();
        }
    },
    
    // Handle confirm
    handleConfirm: function() {
        // Check if focused element is a button - click it
        const focusedElement = document.activeElement;
        if (focusedElement && (focusedElement.tagName === 'BUTTON' || focusedElement.tagName === 'A')) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.handleButtonClick(focusedElement);
            } else {
                focusedElement.click();
            }
            return;
        }
        
        // Check if in menu
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            // Find and click first focusable button
            const button = activeModal.querySelector('button:not(.modal-close):not([disabled])') || activeModal.querySelector('.modal-close');
            if (button) {
                if (window.UnifiedButtonHandler) {
                    window.UnifiedButtonHandler.handleButtonClick(button);
                } else {
                    button.click();
                }
            }
            return;
        }
        
        // Check if game over screen
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay && gameOverOverlay.classList.contains('show')) {
            if (typeof init === 'function') {
                init();
            }
            return;
        }
        
        // Start game if not running
        if (window.StateManager && window.StateManager.getGameRunning && !window.StateManager.getGameRunning()) {
            // Start with default direction
            if (typeof changeDirection === 'function') {
                changeDirection(1, 0);
            }
        }
    },
    
    // Handle back
    handleBack: function() {
        // Close active modal
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            const closeBtn = activeModal.querySelector('.modal-close, [data-close], [id$="Close"]');
            if (closeBtn) {
                if (window.UnifiedButtonHandler) {
                    window.UnifiedButtonHandler.handleButtonClick(closeBtn);
                } else {
                    closeBtn.click();
                }
            }
            return;
        }
        
        // Toggle pause
        if (window.StateManager && window.StateManager.getGameRunning && window.StateManager.getGameRunning()) {
            if (typeof togglePause === 'function') {
                togglePause();
            }
        }
    },
    
    // Handle menu
    handleMenu: function() {
        // Toggle pause
        if (window.StateManager && window.StateManager.getGameRunning()) {
            if (typeof togglePause === 'function') {
                togglePause();
            }
        } else {
            // Open settings
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.click();
            }
        }
    },
    
    // Cleanup function
    cleanup: function() {
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
        }
        
        // Remove event listeners
        if (this.gamepadConnectedHandler) {
            window.removeEventListener('gamepadconnected', this.gamepadConnectedHandler);
            this.gamepadConnectedHandler = null;
        }
        
        if (this.gamepadDisconnectedHandler) {
            window.removeEventListener('gamepaddisconnected', this.gamepadDisconnectedHandler);
            this.gamepadDisconnectedHandler = null;
        }
        
        this.gamepads = [];
        this.connectedGamepads.clear();
        this.lastButtonStates.clear();
        this.lastStickStates.clear();
    },
    
    // Send movement input
    sendMovementInput: function(dx, dy) {
        // Route to appropriate input handler
        if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
            // In local multiplayer, controller controls Player 1
            window.LocalMultiplayer.handlePlayerInput('player1', dx, dy);
        } else if (window.MultiplayerController && window.MultiplayerController.matchState === 'playing') {
            // In online multiplayer
            window.MultiplayerController.handleInput(dx, dy);
        } else {
            // Single-player
            if (typeof changeDirection === 'function') {
                changeDirection(dx, dy);
            } else if (window.changeDirection) {
                window.changeDirection(dx, dy);
            }
        }
    },
    
    // Trigger vibration
    triggerVibration: function(gamepadIndex, intensity = 'medium') {
        if (!this.config.vibrationEnabled) return;
        
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (!gamepad || !gamepad.vibrationActuator) return;
        
        let pattern;
        switch (intensity) {
            case 'light':
                pattern = { duration: 50, startDelay: 0, strongMagnitude: 0.3, weakMagnitude: 0.3 };
                break;
            case 'medium':
                pattern = { duration: 100, startDelay: 0, strongMagnitude: 0.5, weakMagnitude: 0.5 };
                break;
            case 'strong':
                pattern = { duration: 200, startDelay: 0, strongMagnitude: 0.8, weakMagnitude: 0.8 };
                break;
            default:
                pattern = { duration: 100, startDelay: 0, strongMagnitude: 0.5, weakMagnitude: 0.5 };
        }
        
        try {
            if (gamepad.vibrationActuator.playEffect) {
                gamepad.vibrationActuator.playEffect('dual-rumble', pattern);
            }
        } catch (e) {
            // Silently fail if vibration not supported
        }
    },
    
    // Show gamepad notification
    showGamepadNotification: function(message) {
        // Create or update notification
        let notification = document.getElementById('gamepadNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'gamepadNotification';
            notification.className = 'gamepad-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    },
    
    // Get connected gamepads
    getConnectedGamepads: function() {
        return Array.from(this.connectedGamepads.values()).map(data => ({
            index: data.gamepad.index,
            id: data.id,
            mapping: data.mapping
        }));
    },
    
    // Check if any gamepad is connected
    hasGamepad: function() {
        return this.connectedGamepads.size > 0;
    },
    
    // Set dead zone
    setDeadZone: function(value) {
        this.config.deadZone = Math.max(0, Math.min(1, value));
        this.saveSettings();
    },
    
    // Toggle vibration
    toggleVibration: function() {
        this.config.vibrationEnabled = !this.config.vibrationEnabled;
        this.saveSettings();
    },
    
    // Toggle enabled
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.saveSettings();
    },
    
    // Enable
    enable: function() {
        this.config.enabled = true;
        this.saveSettings();
    },
    
    // Disable
    disable: function() {
        this.config.enabled = false;
        this.saveSettings();
    },
    
    // Get configuration
    getConfig: function() {
        return { ...this.config };
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GamepadInput.init());
} else {
    GamepadInput.init();
}

