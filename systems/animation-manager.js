// ==================== ANIMATION MANAGER ====================
// Unified animation timing and motion curves

const AnimationManager = {
    // Timing scale (1.0 = normal speed)
    timeScale: 1.0,
    
    // Motion curves
    curves: {
        linear: (t) => t,
        easeIn: (t) => t * t,
        easeOut: (t) => t * (2 - t),
        easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        smoothstep: (t) => t * t * (3 - 2 * t),
        cubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    },
    
    // Active animations
    animations: [],
    
    // Initialize
    init: function() {
        this.animations = [];
    },
    
    // Create animation
    create: function(config) {
        const anim = {
            id: config.id || `anim_${Date.now()}_${Math.random()}`,
            from: config.from,
            to: config.to,
            duration: config.duration || 1000,
            curve: this.curves[config.curve] || this.curves.linear,
            onUpdate: config.onUpdate,
            onComplete: config.onComplete,
            startTime: performance.now(),
            elapsed: 0,
            active: true
        };
        
        this.animations.push(anim);
        return anim.id;
    },
    
    // Update all animations
    update: function(deltaTime) {
        const scaledDelta = deltaTime * this.timeScale;
        
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            if (!anim.active) {
                this.animations.splice(i, 1);
                continue;
            }
            
            anim.elapsed += scaledDelta;
            const progress = Math.min(1, anim.elapsed / anim.duration);
            const eased = anim.curve(progress);
            
            // Interpolate value
            let value;
            if (typeof anim.from === 'number' && typeof anim.to === 'number') {
                value = anim.from + (anim.to - anim.from) * eased;
            } else if (typeof anim.from === 'object' && typeof anim.to === 'object') {
                value = {};
                for (const key in anim.to) {
                    const fromVal = anim.from[key] || 0;
                    const toVal = anim.to[key] || 0;
                    value[key] = fromVal + (toVal - fromVal) * eased;
                }
            } else {
                value = progress < 1 ? anim.from : anim.to;
            }
            
            // Call update callback
            if (anim.onUpdate) {
                try {
                    anim.onUpdate(value, progress);
                } catch (e) {
                    console.error('Animation update error:', e);
                }
            }
            
            // Check if complete
            if (progress >= 1) {
                anim.active = false;
                if (anim.onComplete) {
                    try {
                        anim.onComplete();
                    } catch (e) {
                        console.error('Animation complete error:', e);
                    }
                }
            }
        }
    },
    
    // Cancel animation
    cancel: function(id) {
        const index = this.animations.findIndex(a => a.id === id);
        if (index > -1) {
            this.animations[index].active = false;
            this.animations.splice(index, 1);
        }
    },
    
    // Cancel all animations
    cancelAll: function() {
        this.animations = [];
    },
    
    // Set time scale
    setTimeScale: function(scale) {
        this.timeScale = DefensiveUtils.validateNumber(scale, 0, 2, 1.0);
    },
    
    // Get time scale
    getTimeScale: function() {
        return this.timeScale;
    }
};

// Export
window.AnimationManager = AnimationManager;

