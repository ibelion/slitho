// ==================== TOUCH INPUT SYSTEM ====================
// Complete mobile input layer with virtual D-pad, swipe gestures, and haptic feedback

const TouchInput = {
    // Configuration
    config: {
        enabled: true,
        inputMethod: 'swipe', // 'swipe' or 'dpad'
        swipeSensitivity: 30, // Minimum swipe distance in pixels
        swipeDeadZone: 10, // Dead zone to prevent accidental swipes
        dpadSize: 120, // Virtual D-pad size
        dpadOpacity: 0.7,
        hapticEnabled: true,
        hapticIntensity: 'medium' // 'light', 'medium', 'strong'
    },
    
    // State
    touchStartPos: null,
    touchStartTime: null,
    activeTouches: new Map(),
    dpadElement: null,
    dpadButtons: {},
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.detectDevice();
        this.setupEventListeners();
        this.createVirtualDpad();
        this.updateVisibility();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('TouchInput', this);
        }
        
        window.TouchInput = this;
    },
    
    // Detect device type
    detectDevice: function() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        this.isMobileDevice = isMobile || isTouch;
        this.isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
        
        // Auto-enable on mobile devices
        if (this.isMobileDevice && !localStorage.getItem('touchInputEnabled')) {
            this.config.enabled = true;
        }
    },
    
    // Load settings from localStorage
    loadSettings: function() {
        const saved = localStorage.getItem('touchInputSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            } catch (e) {
                console.warn('Failed to load touch input settings:', e);
            }
        }
    },
    
    // Save settings to localStorage
    saveSettings: function() {
        try {
            localStorage.setItem('touchInputSettings', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save touch input settings:', e);
        }
    },
    
    // Event handler references (for cleanup)
    touchStartHandler: null,
    touchEndHandler: null,
    touchMoveHandler: null,
    touchCancelHandler: null,
    canvas: null,
    
    // Setup event listeners
    setupEventListeners: function() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;
        
        // Store handler references for cleanup
        this.touchStartHandler = ((e) => {
            if (!this.config.enabled) return;
            e.preventDefault();
            this.handleTouchStart(e);
        }).bind(this);
        
        this.touchMoveHandler = ((e) => {
            if (!this.config.enabled) return;
            e.preventDefault();
            this.handleTouchMove(e);
        }).bind(this);
        
        this.touchEndHandler = ((e) => {
            if (!this.config.enabled) return;
            e.preventDefault();
            this.handleTouchEnd(e);
        }).bind(this);
        
        this.touchCancelHandler = ((e) => {
            if (!this.config.enabled) return;
            e.preventDefault();
            this.handleTouchEnd(e);
        }).bind(this);
        
        // Touch start
        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        
        // Touch move
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        
        // Touch end
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        
        // Touch cancel
        this.canvas.addEventListener('touchcancel', this.touchCancelHandler, { passive: false });
    },
    
    // Handle touch start
    handleTouchStart: function(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchId = touch.identifier;
            
            // Check if touch is on virtual D-pad
            if (this.config.inputMethod === 'dpad' && this.isTouchOnDpad(touch.clientX, touch.clientY)) {
                this.handleDpadTouch(touch.clientX, touch.clientY);
                continue;
            }
            
            // Store touch info for swipe detection
            this.activeTouches.set(touchId, {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now(),
                currentX: touch.clientX,
                currentY: touch.clientY
            });
        }
    },
    
    // Handle touch move
    handleTouchMove: function(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchId = touch.identifier;
            
            const touchData = this.activeTouches.get(touchId);
            if (!touchData) continue;
            
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;
            
            // Update D-pad if active
            if (this.config.inputMethod === 'dpad' && this.isTouchOnDpad(touch.clientX, touch.clientY)) {
                this.handleDpadTouch(touch.clientX, touch.clientY);
            }
        }
    },
    
    // Handle touch end
    handleTouchEnd: function(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchId = touch.identifier;
            
            const touchData = this.activeTouches.get(touchId);
            if (!touchData) continue;
            
            // Process swipe gesture
            if (this.config.inputMethod === 'swipe') {
                this.processSwipe(touchData);
            }
            
            // Clear D-pad state
            if (this.config.inputMethod === 'dpad') {
                this.clearDpadState();
            }
            
            // Remove touch
            this.activeTouches.delete(touchId);
        }
    },
    
    // Process swipe gesture
    processSwipe: function(touchData) {
        const dx = touchData.currentX - touchData.startX;
        const dy = touchData.currentY - touchData.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - touchData.startTime;
        
        // Check if swipe meets minimum distance
        if (distance < this.config.swipeSensitivity) {
            return; // Too short, ignore
        }
        
        // Check dead zone (prevent diagonal swipes from being too sensitive)
        if (Math.abs(dx) < this.config.swipeDeadZone && Math.abs(dy) < this.config.swipeDeadZone) {
            return;
        }
        
        // Determine direction (prioritize larger axis)
        let dirX = 0, dirY = 0;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            dirX = dx > 0 ? 1 : -1;
        } else {
            // Vertical swipe
            dirY = dy > 0 ? 1 : -1;
        }
        
        // Trigger haptic feedback
        this.triggerHaptic('light');
        
        // Send input to game
        this.sendInput(dirX, dirY);
    },
    
    // Check if touch is on virtual D-pad
    isTouchOnDpad: function(x, y) {
        if (!this.dpadElement) return false;
        
        const rect = this.dpadElement.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    },
    
    // Handle D-pad touch
    handleDpadTouch: function(x, y) {
        if (!this.dpadElement) return;
        
        const rect = this.dpadElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = rect.width / 2;
        
        // Check if touch is within D-pad circle
        if (distance > radius) return;
        
        // Normalize direction
        const dirX = Math.abs(dx) > this.config.swipeDeadZone ? Math.sign(dx) : 0;
        const dirY = Math.abs(dy) > this.config.swipeDeadZone ? Math.sign(dy) : 0;
        
        // Update visual feedback
        this.updateDpadVisual(dirX, dirY);
        
        // Send input
        if (dirX !== 0 || dirY !== 0) {
            this.sendInput(dirX, dirY);
        }
    },
    
    // Clear D-pad state
    clearDpadState: function() {
        this.updateDpadVisual(0, 0);
    },
    
    // Update D-pad visual feedback
    updateDpadVisual: function(dirX, dirY) {
        if (!this.dpadElement) return;
        
        // Remove active classes
        Object.values(this.dpadButtons).forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Add active class to pressed direction
        if (dirY < 0 && this.dpadButtons.up) {
            this.dpadButtons.up.classList.add('active');
        } else if (dirY > 0 && this.dpadButtons.down) {
            this.dpadButtons.down.classList.add('active');
        } else if (dirX < 0 && this.dpadButtons.left) {
            this.dpadButtons.left.classList.add('active');
        } else if (dirX > 0 && this.dpadButtons.right) {
            this.dpadButtons.right.classList.add('active');
        }
    },
    
    // Send input to game
    sendInput: function(dx, dy) {
        // Route to appropriate input handler
        if (window.LocalMultiplayer && window.LocalMultiplayer.isActive) {
            // In local multiplayer, touch controls Player 1
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
    
    // Create virtual D-pad
    createVirtualDpad: function() {
        // Remove existing D-pad if present
        const existing = document.getElementById('virtualDpad');
        if (existing) {
            existing.remove();
        }
        
        // Create D-pad container
        const dpad = document.createElement('div');
        dpad.id = 'virtualDpad';
        dpad.className = 'virtual-dpad';
        dpad.style.display = 'none'; // Hidden by default
        
        // Create D-pad buttons
        const directions = [
            { id: 'up', key: 'up', icon: '↑' },
            { id: 'down', key: 'down', icon: '↓' },
            { id: 'left', key: 'left', icon: '←' },
            { id: 'right', key: 'right', icon: '→' }
        ];
        
        directions.forEach(dir => {
            const btn = document.createElement('button');
            btn.className = `dpad-btn dpad-${dir.id}`;
            btn.setAttribute('data-direction', dir.key);
            btn.textContent = dir.icon;
            btn.setAttribute('aria-label', `Move ${dir.key}`);
            dpad.appendChild(btn);
            this.dpadButtons[dir.id] = btn;
        });
        
        // Add to page
        document.body.appendChild(dpad);
        this.dpadElement = dpad;
        
        // Update visibility
        this.updateVisibility();
    },
    
    // Update D-pad visibility
    updateVisibility: function() {
        if (!this.dpadElement) return;
        
        if (this.config.enabled && this.config.inputMethod === 'dpad') {
            this.dpadElement.style.display = 'flex';
        } else {
            this.dpadElement.style.display = 'none';
        }
    },
    
    // Trigger haptic feedback
    triggerHaptic: function(intensity = null) {
        if (!this.config.hapticEnabled) return;
        
        const level = intensity || this.config.hapticIntensity;
        
        // Check for Vibration API support
        if ('vibrate' in navigator) {
            let pattern;
            switch (level) {
                case 'light':
                    pattern = 10;
                    break;
                case 'medium':
                    pattern = 20;
                    break;
                case 'strong':
                    pattern = [20, 10, 20];
                    break;
                default:
                    pattern = 20;
            }
            
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Silently fail if vibration not supported
            }
        }
    },
    
    // Set input method
    setInputMethod: function(method) {
        if (method !== 'swipe' && method !== 'dpad') {
            console.warn('Invalid input method:', method);
            return;
        }
        
        this.config.inputMethod = method;
        this.saveSettings();
        this.updateVisibility();
    },
    
    // Set sensitivity
    setSensitivity: function(value) {
        this.config.swipeSensitivity = Math.max(10, Math.min(100, value));
        this.saveSettings();
    },
    
    // Set dead zone
    setDeadZone: function(value) {
        this.config.swipeDeadZone = Math.max(0, Math.min(50, value));
        this.saveSettings();
    },
    
    // Toggle enabled
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.saveSettings();
        this.updateVisibility();
    },
    
    // Enable
    enable: function() {
        this.config.enabled = true;
        this.saveSettings();
        this.updateVisibility();
    },
    
    // Disable
    disable: function() {
        this.config.enabled = false;
        this.saveSettings();
        this.updateVisibility();
    },
    
    // Get configuration
    getConfig: function() {
        return { ...this.config };
    },
    
    // Check if mobile device
    isMobile: function() {
        return this.isMobileDevice || false;
    },
    
    // Check if tablet
    isTabletDevice: function() {
        return this.isTablet || false;
    },
    
    // Cleanup function
    cleanup: function() {
        // Remove event listeners
        if (this.canvas) {
            if (this.touchStartHandler) {
                this.canvas.removeEventListener('touchstart', this.touchStartHandler);
            }
            if (this.touchEndHandler) {
                this.canvas.removeEventListener('touchend', this.touchEndHandler);
            }
            if (this.touchMoveHandler) {
                this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
            }
            if (this.touchCancelHandler) {
                this.canvas.removeEventListener('touchcancel', this.touchCancelHandler);
            }
        }
        
        // Remove D-pad
        if (this.dpadElement && this.dpadElement.parentNode) {
            this.dpadElement.parentNode.removeChild(this.dpadElement);
            this.dpadElement = null;
        }
        
        this.activeTouches.clear();
        this.touchStartPos = null;
        this.touchStartTime = null;
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TouchInput.init());
} else {
    TouchInput.init();
}

