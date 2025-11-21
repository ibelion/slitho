// ==================== MOBILE UI SYSTEM ====================
// Responsive UI adaptation for mobile devices, tablets, and various screen sizes

const MobileUI = {
    // Configuration
    config: {
        enabled: true,
        safeAreaPadding: true,
        scalableFonts: true,
        largeTapTargets: true,
        minTapTargetSize: 44, // Minimum tap target size in pixels
        fontScaleFactor: 1.0, // Font scaling factor
        hudReorganization: true
    },
    
    // State
    isMobile: false,
    isTablet: false,
    currentViewport: { width: 0, height: 0 },
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.detectDevice();
        this.setupViewportObserver();
        this.applyMobileStyles();
        this.reorganizeHUD();
        this.updateSafeAreas();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('MobileUI', this);
        }
        
        window.MobileUI = this;
    },
    
    // Load settings from localStorage
    loadSettings: function() {
        const saved = localStorage.getItem('mobileUISettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            } catch (e) {
                console.warn('Failed to load mobile UI settings:', e);
            }
        }
    },
    
    // Save settings to localStorage
    saveSettings: function() {
        try {
            localStorage.setItem('mobileUISettings', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save mobile UI settings:', e);
        }
    },
    
    // Detect device type
    detectDevice: function() {
        const ua = navigator.userAgent;
        this.isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        this.isTablet = /iPad|Android/i.test(ua) && !/Mobile/i.test(ua);
        
        // Check screen size
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.currentViewport = { width, height };
        
        // Auto-enable on mobile devices
        if (this.isMobile && !localStorage.getItem('mobileUIEnabled')) {
            this.config.enabled = true;
        }
    },
    
    // Setup viewport observer
    setupViewportObserver: function() {
        // Update on resize
        window.addEventListener('resize', () => {
            this.currentViewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.applyMobileStyles();
            this.reorganizeHUD();
            this.updateSafeAreas();
        });
        
        // Update on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.currentViewport = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                this.applyMobileStyles();
                this.reorganizeHUD();
                this.updateSafeAreas();
            }, 100);
        });
    },
    
    // Apply mobile styles
    applyMobileStyles: function() {
        if (!this.config.enabled) return;
        
        const root = document.documentElement;
        
        // Add mobile class
        if (this.isMobile) {
            root.classList.add('mobile-device');
        }
        if (this.isTablet) {
            root.classList.add('tablet-device');
        }
        
        // Apply font scaling
        if (this.config.scalableFonts) {
            const baseFontSize = this.calculateBaseFontSize();
            root.style.setProperty('--base-font-size', `${baseFontSize}px`);
            root.style.setProperty('--font-scale', this.config.fontScaleFactor);
        }
        
        // Apply tap target sizing
        if (this.config.largeTapTargets) {
            root.style.setProperty('--min-tap-size', `${this.config.minTapTargetSize}px`);
        }
    },
    
    // Calculate base font size based on viewport
    calculateBaseFontSize: function() {
        const width = this.currentViewport.width;
        const height = this.currentViewport.height;
        const minDimension = Math.min(width, height);
        
        // Base font size scales with screen size
        if (minDimension < 400) {
            return 12; // Very small screens
        } else if (minDimension < 600) {
            return 14; // Small phones
        } else if (minDimension < 900) {
            return 16; // Large phones / small tablets
        } else {
            return 18; // Tablets and larger
        }
    },
    
    // Update safe areas (for notches, etc.)
    updateSafeAreas: function() {
        if (!this.config.safeAreaPadding) return;
        
        const root = document.documentElement;
        
        // Get safe area insets (CSS env() variables)
        const safeAreaTop = this.getSafeAreaInset('top');
        const safeAreaRight = this.getSafeAreaInset('right');
        const safeAreaBottom = this.getSafeAreaInset('bottom');
        const safeAreaLeft = this.getSafeAreaInset('left');
        
        root.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
        root.style.setProperty('--safe-area-right', `${safeAreaRight}px`);
        root.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
        root.style.setProperty('--safe-area-left', `${safeAreaLeft}px`);
        
        this.safeAreaInsets = {
            top: safeAreaTop,
            right: safeAreaRight,
            bottom: safeAreaBottom,
            left: safeAreaLeft
        };
    },
    
    // Get safe area inset (fallback if CSS env() not available)
    getSafeAreaInset: function(side) {
        // Try to get from CSS custom property first
        const root = getComputedStyle(document.documentElement);
        const envValue = root.getPropertyValue(`--safe-area-inset-${side}`);
        
        if (envValue) {
            return parseFloat(envValue) || 0;
        }
        
        // Fallback: estimate based on device
        if (this.isMobile) {
            // Common notch/status bar heights
            if (side === 'top') return 20; // Status bar
            if (side === 'bottom') return 20; // Home indicator area
        }
        
        return 0;
    },
    
    // Reorganize HUD for mobile
    reorganizeHUD: function() {
        if (!this.config.hudReorganization || !this.config.enabled) return;
        
        // Move HUD elements to mobile-friendly positions
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const pauseBtn = document.getElementById('pauseBtn');
        
        // Add mobile-specific classes
        if (this.isMobile) {
            document.body.classList.add('mobile-layout');
            
            // Ensure pause button is accessible
            if (pauseBtn) {
                pauseBtn.classList.add('mobile-pause-btn');
            }
        }
    },
    
    // Set font scale factor
    setFontScale: function(factor) {
        this.config.fontScaleFactor = Math.max(0.8, Math.min(1.5, factor));
        this.saveSettings();
        this.applyMobileStyles();
    },
    
    // Set minimum tap target size
    setMinTapTargetSize: function(size) {
        this.config.minTapTargetSize = Math.max(32, Math.min(64, size));
        this.saveSettings();
        this.applyMobileStyles();
    },
    
    // Toggle safe area padding
    toggleSafeAreaPadding: function() {
        this.config.safeAreaPadding = !this.config.safeAreaPadding;
        this.saveSettings();
        this.updateSafeAreas();
    },
    
    // Toggle enabled
    toggle: function() {
        this.config.enabled = !this.config.enabled;
        this.saveSettings();
        this.applyMobileStyles();
    },
    
    // Enable
    enable: function() {
        this.config.enabled = true;
        this.saveSettings();
        this.applyMobileStyles();
    },
    
    // Disable
    disable: function() {
        this.config.enabled = false;
        this.saveSettings();
        document.documentElement.classList.remove('mobile-device', 'tablet-device');
    },
    
    // Get configuration
    getConfig: function() {
        return { ...this.config };
    },
    
    // Check if mobile
    isMobileDevice: function() {
        return this.isMobile;
    },
    
    // Check if tablet
    isTabletDevice: function() {
        return this.isTablet;
    },
    
    // Get viewport size
    getViewport: function() {
        return { ...this.currentViewport };
    },
    
    // Get safe area insets
    getSafeAreas: function() {
        return { ...this.safeAreaInsets };
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileUI.init());
} else {
    MobileUI.init();
}

