// ==================== PERFORMANCE SCALER ====================
// Dynamic quality scaling and performance optimization for various devices

const PerformanceScaler = {
    // Configuration
    config: {
        enabled: true,
        targetFPS: 60,
        minFPS: 30,
        qualityLevel: 'auto', // 'auto', 'high', 'medium', 'low'
        particleReduction: true,
        simplifiedVisuals: false,
        adaptiveTickRate: true,
        memorySafeTextures: true,
        maxParticles: 100,
        maxEntities: 200
    },
    
    // State
    currentQuality: 'high',
    fpsHistory: [],
    frameTimeHistory: [],
    performanceMetrics: {
        averageFPS: 60,
        averageFrameTime: 16.67,
        droppedFrames: 0,
        memoryUsage: 0
    },
    qualityLevels: {
        high: {
            maxParticles: 200,
            maxEntities: 500,
            particleLifetime: 1.0,
            visualEffects: true,
            shadows: true,
            glow: true
        },
        medium: {
            maxParticles: 100,
            maxEntities: 300,
            particleLifetime: 0.8,
            visualEffects: true,
            shadows: false,
            glow: true
        },
        low: {
            maxParticles: 50,
            maxEntities: 150,
            particleLifetime: 0.6,
            visualEffects: false,
            shadows: false,
            glow: false
        }
    },
    
    // Initialize
    init: function() {
        this.loadSettings();
        this.detectDeviceCapabilities();
        this.setupPerformanceMonitoring();
        this.applyQualitySettings();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('PerformanceScaler', this);
        }
        
        window.PerformanceScaler = this;
    },
    
    // Load settings from localStorage
    loadSettings: function() {
        const saved = localStorage.getItem('performanceScalerSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            } catch (e) {
                console.warn('Failed to load performance scaler settings:', e);
            }
        }
    },
    
    // Save settings to localStorage
    saveSettings: function() {
        try {
            localStorage.setItem('performanceScalerSettings', JSON.stringify(this.config));
        } catch (e) {
            console.warn('Failed to save performance scaler settings:', e);
        }
    },
    
    // Detect device capabilities
    detectDeviceCapabilities: function() {
        // Check hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 2;
        
        // Check memory (if available)
        const memory = navigator.deviceMemory || 4; // GB
        
        // Check if mobile device
        const isMobile = /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Determine initial quality
        if (this.config.qualityLevel === 'auto') {
            if (isMobile && (cores < 4 || memory < 4)) {
                this.currentQuality = 'low';
            } else if (isMobile || cores < 6 || memory < 6) {
                this.currentQuality = 'medium';
            } else {
                this.currentQuality = 'high';
            }
        } else {
            this.currentQuality = this.config.qualityLevel;
        }
        
        // Apply initial settings
        this.applyQualitySettings();
    },
    
    // Setup performance monitoring
    setupPerformanceMonitoring: function() {
        if (!this.config.enabled) return;
        
        let lastFrameTime = performance.now();
        let frameCount = 0;
        let lastFPSUpdate = performance.now();
        
        const monitor = () => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            lastFrameTime = now;
            
            // Record frame time (optimized: use circular buffer)
            if (!this._frameHistoryIndex) this._frameHistoryIndex = 0;
            if (!this._frameHistoryCount) this._frameHistoryCount = 0;
            
            this.frameTimeHistory[this._frameHistoryIndex] = frameTime;
            this._frameHistoryIndex = (this._frameHistoryIndex + 1) % 60;
            if (this._frameHistoryCount < 60) {
                this._frameHistoryCount++;
            }
            
            // Calculate FPS
            frameCount++;
            if (now - lastFPSUpdate >= 1000) {
                const fps = frameCount;
                frameCount = 0;
                lastFPSUpdate = now;
                
                // Optimized: use circular buffer for FPS history
                if (!this._fpsHistoryIndex) this._fpsHistoryIndex = 0;
                if (!this._fpsHistoryCount) this._fpsHistoryCount = 0;
                
                this.fpsHistory[this._fpsHistoryIndex] = fps;
                this._fpsHistoryIndex = (this._fpsHistoryIndex + 1) % 30;
                if (this._fpsHistoryCount < 30) {
                    this._fpsHistoryCount++;
                }
                
                // Update average FPS (optimized: use actual count)
                const count = this._fpsHistoryCount || this.fpsHistory.length;
                const sum = this.fpsHistory.slice(0, count).reduce((a, b) => a + b, 0);
                this.performanceMetrics.averageFPS = count > 0 ? sum / count : 0;
                
                // Check for performance issues
                if (this.performanceMetrics.averageFPS < this.config.minFPS) {
                    this.degradeQuality();
                } else if (this.performanceMetrics.averageFPS >= this.config.targetFPS && this.currentQuality !== 'high') {
                    this.improveQuality();
                }
            }
            
            // Update average frame time (optimized: use actual count)
            const count = this._frameHistoryCount || this.frameTimeHistory.length;
            const frameTimeSum = this.frameTimeHistory.slice(0, count).reduce((a, b) => a + b, 0);
            this.performanceMetrics.averageFrameTime = count > 0 ? frameTimeSum / count : 0;
            
            // Check for dropped frames (frame time > 33ms = < 30fps)
            if (frameTime > 33.33) {
                this.performanceMetrics.droppedFrames++;
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    },
    
    // Degrade quality
    degradeQuality: function() {
        if (this.currentQuality === 'high') {
            this.setQuality('medium');
        } else if (this.currentQuality === 'medium') {
            this.setQuality('low');
        }
    },
    
    // Improve quality
    improveQuality: function() {
        if (this.currentQuality === 'low' && this.performanceMetrics.averageFPS > 45) {
            this.setQuality('medium');
        } else if (this.currentQuality === 'medium' && this.performanceMetrics.averageFPS >= this.config.targetFPS) {
            this.setQuality('high');
        }
    },
    
    // Set quality level
    setQuality: function(quality) {
        if (!this.qualityLevels[quality]) return;
        if (this.currentQuality === quality) return;
        
        this.currentQuality = quality;
        this.applyQualitySettings();
        
        // Notify systems
        this.notifyQualityChange(quality);
    },
    
    // Apply quality settings
    applyQualitySettings: function() {
        const quality = this.qualityLevels[this.currentQuality];
        if (!quality) return;
        
        // Update particle system
        if (window.ParticleSystem) {
            window.ParticleSystem.setMaxParticles(quality.maxParticles);
        }
        
        // Update config
        this.config.maxParticles = quality.maxParticles;
        this.config.maxEntities = quality.maxEntities;
        
        // Apply visual settings
        const root = document.documentElement;
        root.style.setProperty('--particle-lifetime', quality.particleLifetime);
        root.style.setProperty('--visual-effects', quality.visualEffects ? '1' : '0');
        root.style.setProperty('--shadows', quality.shadows ? '1' : '0');
        root.style.setProperty('--glow', quality.glow ? '1' : '0');
        
        // Update renderer if available
        if (window.Renderer && window.Renderer.setQuality) {
            window.Renderer.setQuality(this.currentQuality);
        }
    },
    
    // Notify systems of quality change
    notifyQualityChange: function(quality) {
        // Update particle system
        if (window.ParticleSystem && window.ParticleSystem.onQualityChange) {
            window.ParticleSystem.onQualityChange(quality);
        }
        
        // Update renderer
        if (window.Renderer && window.Renderer.onQualityChange) {
            window.Renderer.onQualityChange(quality);
        }
    },
    
    // Reduce particles under load
    reduceParticles: function() {
        if (!this.config.particleReduction) return;
        
        const currentMax = this.config.maxParticles;
        const reducedMax = Math.max(20, Math.floor(currentMax * 0.7));
        
        if (window.ParticleSystem) {
            window.ParticleSystem.setMaxParticles(reducedMax);
        }
        
        this.config.maxParticles = reducedMax;
    },
    
    // Restore particles
    restoreParticles: function() {
        const quality = this.qualityLevels[this.currentQuality];
        if (!quality) return;
        
        if (window.ParticleSystem) {
            window.ParticleSystem.setMaxParticles(quality.maxParticles);
        }
        
        this.config.maxParticles = quality.maxParticles;
    },
    
    // Get current quality
    getQuality: function() {
        return this.currentQuality;
    },
    
    // Get performance metrics
    getMetrics: function() {
        return {
            ...this.performanceMetrics,
            quality: this.currentQuality,
            maxParticles: this.config.maxParticles,
            maxEntities: this.config.maxEntities
        };
    },
    
    // Set quality level manually
    setQualityLevel: function(level) {
        if (level === 'auto') {
            this.config.qualityLevel = 'auto';
            this.detectDeviceCapabilities();
        } else if (this.qualityLevels[level]) {
            this.config.qualityLevel = level;
            this.setQuality(level);
        }
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
        this.setupPerformanceMonitoring();
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
    document.addEventListener('DOMContentLoaded', () => PerformanceScaler.init());
} else {
    PerformanceScaler.init();
}
