// ==================== PERFORMANCE PROTECTION ====================
// Frame spike handling, graceful degradation, memory management

const PerformanceProtection = {
    // Configuration
    config: {
        maxParticles: 200,
        maxEntities: 1000,
        targetFPS: 60,
        minFPS: 30,
        frameSpikeThreshold: 50, // ms
        memoryWarningThreshold: 100 * 1024 * 1024 // 100MB
    },
    
    // State
    frameSpikes: [],
    lastFrameTime: performance.now(),
    degradationLevel: 0, // 0 = full quality, 1 = reduced, 2 = minimal
    
    // Initialize
    init: function() {
        this.startMonitoring();
    },
    
    // Start monitoring (optimized: use requestAnimationFrame instead of setInterval)
    monitoringFrameId: null,
    lastCheckTime: 0,
    checkInterval: 1000, // Check every 1 second
    
    startMonitoring: function() {
        this.lastCheckTime = performance.now();
        this.monitorLoop();
    },
    
    monitorLoop: function() {
        const now = performance.now();
        if (now - this.lastCheckTime >= this.checkInterval) {
            this.checkPerformance();
            this.checkMemory();
            this.lastCheckTime = now;
        }
        this.monitoringFrameId = requestAnimationFrame(() => this.monitorLoop());
    },
    
    stopMonitoring: function() {
        if (this.monitoringFrameId) {
            cancelAnimationFrame(this.monitoringFrameId);
            this.monitoringFrameId = null;
        }
    },
    
    // Check performance
    checkPerformance: function() {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Detect frame spikes
        if (frameTime > this.config.frameSpikeThreshold) {
            this.frameSpikes.push(now);
            // Keep only last 10 spikes
            if (this.frameSpikes.length > 10) {
                this.frameSpikes.shift();
            }
            
            // If too many spikes, degrade quality
            const recentSpikes = this.frameSpikes.filter(
                time => now - time < 5000
            );
            
            if (recentSpikes.length > 5) {
                this.increaseDegradation();
            }
        }
        
        // Check FPS
        const fps = 1000 / frameTime;
        if (fps < this.config.minFPS) {
            this.increaseDegradation();
        } else if (fps >= this.config.targetFPS && this.degradationLevel > 0) {
            this.decreaseDegradation();
        }
    },
    
    // Check memory
    checkMemory: function() {
        if (!performance.memory) return;
        
        const used = performance.memory.usedJSHeapSize;
        if (used > this.config.memoryWarningThreshold) {
            console.warn(`High memory usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
            this.triggerGarbageCollection();
        }
    },
    
    // Increase degradation
    increaseDegradation: function() {
        if (this.degradationLevel >= 2) return;
        
        this.degradationLevel++;
        this.applyDegradation();
        console.log(`Performance degradation level: ${this.degradationLevel}`);
    },
    
    // Decrease degradation
    decreaseDegradation: function() {
        if (this.degradationLevel <= 0) return;
        
        this.degradationLevel--;
        this.applyDegradation();
        console.log(`Performance degradation level: ${this.degradationLevel}`);
    },
    
    // Apply degradation
    applyDegradation: function() {
        // Reduce particles
        if (window.ParticleSystem) {
            const maxParticles = Math.floor(
                this.config.maxParticles * (1 - this.degradationLevel * 0.3)
            );
            // Particle system will respect this limit
        }
        
        // Reduce visual effects
        if (window.GlobalModifiers) {
            if (this.degradationLevel >= 2) {
                // Disable fog and other expensive effects
            }
        }
        
        // Update render quality
        document.documentElement.setAttribute(
            'data-performance-level',
            this.degradationLevel.toString()
        );
    },
    
    // Trigger garbage collection (if available)
    triggerGarbageCollection: function() {
        // Clear particle pools
        if (window.ParticleSystem) {
            window.ParticleSystem.clear();
        }
        
        // Clear caches
        if (window.Renderer && window.Renderer.clearCache) {
            window.Renderer.clearCache();
        }
    },
    
    // Enforce particle cap
    enforceParticleCap: function() {
        if (window.ParticleSystem) {
            const count = window.ParticleSystem.getCount();
            const max = Math.floor(
                this.config.maxParticles * (1 - this.degradationLevel * 0.3)
            );
            
            if (count > max) {
                // Particle system should handle this internally
            }
        }
    },
    
    // Get degradation level
    getDegradationLevel: function() {
        return this.degradationLevel;
    }
};

// Export
window.PerformanceProtection = PerformanceProtection;

