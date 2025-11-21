// ==================== ACCESSIBILITY SYSTEM ====================
// Color-safe themes, scalable text, focus indicators

const Accessibility = {
    // Color-safe theme presets
    colorSafeThemes: {
        highContrast: {
            bg: '#000000',
            text: '#FFFFFF',
            snake: '#00FF00',
            food: '#FF0000',
            border: '#FFFFFF'
        },
        protanopia: {
            bg: '#1a1a1a',
            text: '#ffffff',
            snake: '#00d4ff', // Cyan (distinct from red/green)
            food: '#ff6b6b', // Light red (distinct from green)
            border: '#00d4ff',
            hazard: '#ffaa00', // Orange (distinct)
            powerup: '#9b59b6' // Purple (distinct)
        },
        deuteranopia: {
            bg: '#1a1a1a',
            text: '#ffffff',
            snake: '#4a90e2', // Blue (distinct from red/green)
            food: '#e24a4a', // Red (distinct from green)
            border: '#4a90e2',
            hazard: '#ffaa00', // Orange (distinct)
            powerup: '#9b59b6' // Purple (distinct)
        },
        tritanopia: {
            bg: '#1a1a1a',
            text: '#ffffff',
            snake: '#ffd700', // Gold/Yellow (distinct from blue)
            food: '#ff6b6b', // Red (distinct from blue)
            border: '#ffd700',
            hazard: '#ff4444', // Bright red (distinct)
            powerup: '#00ff88' // Green (distinct)
        }
    },
    
    // Settings
    settings: {
        uiScale: 'medium', // 'small', 'medium', 'large'
        textSize: 'normal', // 'small', 'normal', 'large'
        textScale: 1.0, // Legacy support (0.5 to 2.0)
        highContrast: false,
        colorBlindMode: null,
        lowMotion: false,
        showFocusIndicators: true
    },
    
    // UI Scale presets
    uiScalePresets: {
        small: 0.85,
        medium: 1.0,
        large: 1.25
    },
    
    // Text size presets
    textSizePresets: {
        small: 0.875,
        normal: 1.0,
        large: 1.25
    },
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
    },
    
    // Load settings
    loadSettings: function() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load accessibility settings:', e);
            }
        }
    },
    
    // Save settings
    saveSettings: function() {
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    },
    
    // Apply settings
    applySettings: function() {
        const root = document.documentElement;
        
        // UI Scale (affects buttons, icons, menus, HUD)
        const uiScaleValue = this.uiScalePresets[this.settings.uiScale] || 1.0;
        root.style.setProperty('--ui-scale', uiScaleValue);
        root.setAttribute('data-ui-scale', this.settings.uiScale);
        
        // Text Size (separate from UI scale)
        const textSizeValue = this.textSizePresets[this.settings.textSize] || 1.0;
        root.style.setProperty('--text-size', textSizeValue);
        root.setAttribute('data-text-size', this.settings.textSize);
        
        // Legacy text scale support (for backward compatibility)
        if (this.settings.textScale !== 1.0) {
            root.style.setProperty('--text-scale', this.settings.textScale);
        } else {
            // Use text size if text scale is default
            root.style.setProperty('--text-scale', textSizeValue);
        }
        
        // High contrast
        if (this.settings.highContrast) {
            root.setAttribute('data-high-contrast', 'true');
            this.applyColorSafeTheme('highContrast');
        } else {
            root.removeAttribute('data-high-contrast');
        }
        
        // Color blind mode
        if (this.settings.colorBlindMode) {
            root.setAttribute('data-color-blind', this.settings.colorBlindMode);
            this.applyColorSafeTheme(this.settings.colorBlindMode);
        } else {
            root.removeAttribute('data-color-blind');
        }
        
        // Low motion
        if (this.settings.lowMotion) {
            root.setAttribute('data-low-motion', 'true');
            if (window.AnimationManager) {
                window.AnimationManager.setTimeScale(0.5);
            }
        } else {
            root.removeAttribute('data-low-motion');
            if (window.AnimationManager) {
                window.AnimationManager.setTimeScale(1.0);
            }
        }
        
        // Focus indicators
        if (this.settings.showFocusIndicators) {
            root.setAttribute('data-show-focus', 'true');
        } else {
            root.removeAttribute('data-show-focus');
        }
    },
    
    // Apply color-safe theme
    applyColorSafeTheme: function(themeName) {
        const theme = this.colorSafeThemes[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        root.style.setProperty('--bg-primary', theme.bg);
        root.style.setProperty('--text-primary', theme.text);
        root.style.setProperty('--snake-color', theme.snake);
        root.style.setProperty('--food-color', theme.food);
        root.style.setProperty('--border-color', theme.border);
        
        // Apply additional colors if available
        if (theme.hazard) {
            root.style.setProperty('--hazard-color', theme.hazard);
        }
        if (theme.powerup) {
            root.style.setProperty('--powerup-color', theme.powerup);
        }
    },
    
    // Set UI scale
    setUIScale: function(scale) {
        if (['small', 'medium', 'large'].includes(scale)) {
            this.settings.uiScale = scale;
            this.applySettings();
            this.saveSettings();
            return true;
        }
        return false;
    },
    
    // Set text size
    setTextSize: function(size) {
        if (['small', 'normal', 'large'].includes(size)) {
            this.settings.textSize = size;
            this.applySettings();
            this.saveSettings();
            return true;
        }
        return false;
    },
    
    // Set text scale (legacy support)
    setTextScale: function(scale) {
        this.settings.textScale = DefensiveUtils.validateNumber(scale, 0.5, 2.0, 1.0);
        this.applySettings();
        this.saveSettings();
    },
    
    // Set high contrast
    setHighContrast: function(enabled) {
        this.settings.highContrast = enabled;
        this.applySettings();
        this.saveSettings();
    },
    
    // Set color blind mode
    setColorBlindMode: function(mode) {
        this.settings.colorBlindMode = mode;
        this.applySettings();
        this.saveSettings();
    },
    
    // Set low motion
    setLowMotion: function(enabled) {
        this.settings.lowMotion = enabled;
        this.applySettings();
        this.saveSettings();
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Show focus indicators when using keyboard
                document.documentElement.setAttribute('data-keyboard-nav', 'true');
            }
        });
        
        document.addEventListener('mousedown', () => {
            // Hide focus indicators when using mouse
            document.documentElement.removeAttribute('data-keyboard-nav');
        });
    }
};

// Export
window.Accessibility = Accessibility;

