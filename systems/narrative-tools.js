// ==================== NARRATIVE TOOLS SYSTEM ====================
// Simple narrative scripting system for cutscenes, text, camera events, and custom scenes

const NarrativeTools = {
    // Configuration
    config: {
        enabled: true,
        defaultTextSpeed: 50, // Characters per second
        defaultFadeDuration: 500
    },
    
    // State
    activeNarrative: null,
    narrativeQueue: [],
    sceneTemplates: new Map(),
    
    // Initialize
    init: function() {
        this.loadSceneTemplates();
        this.setupUI();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('NarrativeTools', this);
        }
        
        window.NarrativeTools = this;
    },
    
    // Load scene templates
    loadSceneTemplates: function() {
        // Text scene
        this.sceneTemplates.set('text', {
            type: 'text',
            execute: (scene, callback) => {
                this.executeTextScene(scene, callback);
            }
        });
        
        // Camera event
        this.sceneTemplates.set('camera', {
            type: 'camera',
            execute: (scene, callback) => {
                this.executeCameraScene(scene, callback);
            }
        });
        
        // Character reaction
        this.sceneTemplates.set('character', {
            type: 'character',
            execute: (scene, callback) => {
                this.executeCharacterScene(scene, callback);
            }
        });
        
        // Sound cue
        this.sceneTemplates.set('sound', {
            type: 'sound',
            execute: (scene, callback) => {
                this.executeSoundScene(scene, callback);
            }
        });
        
        // Particle trigger
        this.sceneTemplates.set('particles', {
            type: 'particles',
            execute: (scene, callback) => {
                this.executeParticleScene(scene, callback);
            }
        });
        
        // Custom event
        this.sceneTemplates.set('custom', {
            type: 'custom',
            execute: (scene, callback) => {
                this.executeCustomScene(scene, callback);
            }
        });
    },
    
    // Setup UI
    setupUI: function() {
        // Create narrative overlay (if not exists)
        if (!document.getElementById('narrativeOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'narrativeOverlay';
            overlay.className = 'narrative-overlay';
            overlay.style.display = 'none';
            overlay.innerHTML = `
                <div class="narrative-content">
                    <div class="narrative-text" id="narrativeText"></div>
                    <div class="narrative-choices" id="narrativeChoices"></div>
                    <button class="narrative-skip" id="narrativeSkip">Skip</button>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Setup skip button
            document.getElementById('narrativeSkip').addEventListener('click', () => {
                this.skipNarrative();
            });
        }
    },
    
    // Show narrative
    showNarrative: function(narrative) {
        if (!narrative || !narrative.scenes) {
            console.warn('Invalid narrative:', narrative);
            return;
        }
        
        this.activeNarrative = {
            id: `narrative_${Date.now()}`,
            narrative: narrative,
            currentScene: 0,
            startTime: Date.now(),
            paused: false
        };
        
        // Show overlay
        const overlay = document.getElementById('narrativeOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        // Start first scene
        this.executeNextScene();
    },
    
    // Execute next scene
    executeNextScene: function() {
        if (!this.activeNarrative) return;
        
        const narrative = this.activeNarrative.narrative;
        const sceneIndex = this.activeNarrative.currentScene;
        
        if (sceneIndex >= narrative.scenes.length) {
            // Narrative complete
            this.completeNarrative();
            return;
        }
        
        const scene = narrative.scenes[sceneIndex];
        const template = this.sceneTemplates.get(scene.type);
        
        if (!template) {
            console.warn('Scene template not found:', scene.type);
            this.activeNarrative.currentScene++;
            this.executeNextScene();
            return;
        }
        
        // Execute scene
        template.execute(scene, () => {
            // Scene complete, move to next
            this.activeNarrative.currentScene++;
            this.executeNextScene();
        });
    },
    
    // Execute text scene
    executeTextScene: function(scene, callback) {
        const textElement = document.getElementById('narrativeText');
        if (!textElement) {
            callback();
            return;
        }
        
        const text = scene.text || '';
        const duration = scene.duration || (text.length / this.config.defaultTextSpeed * 1000);
        const speed = scene.speed || this.config.defaultTextSpeed;
        
        // Clear previous text
        textElement.textContent = '';
        textElement.style.display = 'block';
        
        // Type text
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                textElement.textContent += text[charIndex];
                charIndex++;
            } else {
                clearInterval(typeInterval);
                
                // Wait for duration or user input
                if (scene.autoAdvance !== false) {
                    setTimeout(callback, duration);
                } else {
                    // Wait for click
                    const clickHandler = () => {
                        textElement.removeEventListener('click', clickHandler);
                        callback();
                    };
                    textElement.addEventListener('click', clickHandler);
                }
            }
        }, 1000 / speed);
    },
    
    // Execute camera scene
    executeCameraScene: function(scene, callback) {
        const action = scene.action;
        const duration = scene.duration || this.config.defaultFadeDuration;
        
        switch (action) {
            case 'shake':
                if (window.CameraShake) {
                    window.CameraShake.trigger(
                        scene.intensity || 5,
                        duration,
                        scene.curve || 'linear'
                    );
                }
                setTimeout(callback, duration);
                break;
                
            case 'zoom':
                // Zoom camera (if camera system exists)
                setTimeout(callback, duration);
                break;
                
            case 'pan':
                // Pan camera
                setTimeout(callback, duration);
                break;
                
            case 'fade_in':
                this.fadeIn(duration, callback);
                break;
                
            case 'fade_out':
                this.fadeOut(duration, callback);
                break;
                
            default:
                callback();
        }
    },
    
    // Execute character scene
    executeCharacterScene: function(scene, callback) {
        const character = scene.character;
        const reaction = scene.reaction;
        const duration = scene.duration || 1000;
        
        // Show character reaction (visual indicator)
        if (window.ParticleSystem) {
            const x = scene.x || 10;
            const y = scene.y || 10;
            window.ParticleSystem.createBurst(x, y, scene.color || '#ffffff', 10);
        }
        
        // Trigger character animation if available
        if (window.AnimationManager) {
            // Trigger character animation
        }
        
        setTimeout(callback, duration);
    },
    
    // Execute sound scene
    executeSoundScene: function(scene, callback) {
        const soundId = scene.sound;
        const volume = scene.volume || 1.0;
        const duration = scene.duration || 0;
        
        if (window.AudioManager && soundId) {
            window.AudioManager.playSound(soundId, volume);
        }
        
        if (duration > 0) {
            setTimeout(callback, duration);
        } else {
            callback();
        }
    },
    
    // Execute particle scene
    executeParticleScene: function(scene, callback) {
        const type = scene.particleType;
        const x = scene.x || 10;
        const y = scene.y || 10;
        const count = scene.count || 20;
        const color = scene.color || '#ffffff';
        
        if (window.ParticleSystem) {
            switch (type) {
                case 'burst':
                    window.ParticleSystem.createBurst(x, y, color, count);
                    break;
                case 'trail':
                    window.ParticleSystem.createTrail(x, y, color, count);
                    break;
                case 'explosion':
                    window.ParticleSystem.createBurst(x, y, color, count * 2);
                    break;
            }
        }
        
        const duration = scene.duration || 500;
        setTimeout(callback, duration);
    },
    
    // Execute custom scene
    executeCustomScene: function(scene, callback) {
        const eventName = scene.event;
        const data = scene.data || {};
        
        // Trigger custom event
        if (window.EventController) {
            window.EventController.trigger(eventName, data);
        }
        
        const duration = scene.duration || 0;
        if (duration > 0) {
            setTimeout(callback, duration);
        } else {
            callback();
        }
    },
    
    // Fade in
    fadeIn: function(duration, callback) {
        const overlay = document.getElementById('narrativeOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = `opacity ${duration}ms`;
            overlay.style.opacity = '1';
        }
        setTimeout(callback, duration);
    },
    
    // Fade out
    fadeOut: function(duration, callback) {
        const overlay = document.getElementById('narrativeOverlay');
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.transition = `opacity ${duration}ms`;
            overlay.style.opacity = '0';
        }
        setTimeout(callback, duration);
    },
    
    // Skip narrative
    skipNarrative: function() {
        if (this.activeNarrative) {
            this.completeNarrative();
        }
    },
    
    // Complete narrative
    completeNarrative: function() {
        if (!this.activeNarrative) return;
        
        // Hide overlay
        const overlay = document.getElementById('narrativeOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Trigger complete event
        if (window.EventController) {
            window.EventController.trigger('narrative_complete', {
                narrativeId: this.activeNarrative.id
            });
        }
        
        this.activeNarrative = null;
    },
    
    // Queue narrative
    queueNarrative: function(narrative) {
        this.narrativeQueue.push(narrative);
        
        // Start if no active narrative
        if (!this.activeNarrative) {
            this.processQueue();
        }
    },
    
    // Process queue
    processQueue: function() {
        if (this.narrativeQueue.length === 0) return;
        
        const narrative = this.narrativeQueue.shift();
        this.showNarrative(narrative);
    },
    
    // Create narrative from script
    createNarrative: function(script) {
        return {
            id: script.id || `narrative_${Date.now()}`,
            name: script.name || 'Narrative',
            scenes: script.scenes || []
        };
    },
    
    // Register custom scene type
    registerSceneType: function(typeId, template) {
        this.sceneTemplates.set(typeId, template);
    },
    
    // Get active narrative
    getActiveNarrative: function() {
        return this.activeNarrative;
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NarrativeTools.init());
} else {
    NarrativeTools.init();
}

