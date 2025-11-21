// ==================== AUDIO MANAGER ====================
// Production-grade audio system with mixing and fallbacks

const AudioManager = {
    // Volume levels (0.0 to 1.0)
    volumes: {
        master: 1.0,
        music: 0.7,
        sfx: 0.8,
        ui: 0.45  // Reduced by 25% from 0.6 (0.6 * 0.75 = 0.45)
    },
    
    // Audio contexts
    audioContext: null,
    gainNodes: {
        master: null,
        music: null,
        sfx: null,
        ui: null
    },
    
    // Audio pools (optimized: reuse audio objects)
    audioPools: {},
    maxPoolSize: 5, // Maximum audio objects per sound type
    
    // Ducking state
    ducking: {
        active: false,
        target: null,
        originalVolume: 1.0
    },
    
    // Initialize
    init: function() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupGainNodes();
            this.loadSettings();
        } catch (e) {
            console.warn('Audio context creation failed:', e);
        }
    },
    
    // Setup gain nodes for mixing
    setupGainNodes: function() {
        if (!this.audioContext) return;
        
        // Master gain
        this.gainNodes.master = this.audioContext.createGain();
        this.gainNodes.master.connect(this.audioContext.destination);
        this.gainNodes.master.gain.value = this.volumes.master;
        
        // Music gain
        this.gainNodes.music = this.audioContext.createGain();
        this.gainNodes.music.connect(this.gainNodes.master);
        this.gainNodes.music.gain.value = this.volumes.music;
        
        // SFX gain
        this.gainNodes.sfx = this.audioContext.createGain();
        this.gainNodes.sfx.connect(this.gainNodes.master);
        this.gainNodes.sfx.gain.value = this.volumes.sfx;
        
        // UI gain
        this.gainNodes.ui = this.audioContext.createGain();
        this.gainNodes.ui.connect(this.gainNodes.master);
        this.gainNodes.ui.gain.value = this.volumes.ui;
    },
    
    // Load settings
    loadSettings: function() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.setMasterVolume(settings.master || 1.0);
                this.setMusicVolume(settings.music || 0.7);
                this.setSFXVolume(settings.sfx || 0.8);
                this.setUIVolume(settings.ui || 0.45);  // Default reduced by 25%
            } catch (e) {
                console.warn('Failed to load audio settings:', e);
            }
        }
    },
    
    // Save settings
    saveSettings: function() {
        localStorage.setItem('audioSettings', JSON.stringify({
            master: this.volumes.master,
            music: this.volumes.music,
            sfx: this.volumes.sfx,
            ui: this.volumes.ui
        }));
    },
    
    // Set master volume
    setMasterVolume: function(volume) {
        this.volumes.master = DefensiveUtils.validateNumber(volume, 0, 1, 1.0);
        if (this.gainNodes.master) {
            this.gainNodes.master.gain.value = this.volumes.master;
        }
        this.saveSettings();
    },
    
    // Set music volume
    setMusicVolume: function(volume) {
        this.volumes.music = DefensiveUtils.validateNumber(volume, 0, 1, 0.7);
        if (this.gainNodes.music) {
            this.gainNodes.music.gain.value = this.volumes.music;
        }
        this.saveSettings();
    },
    
    // Set SFX volume
    setSFXVolume: function(volume) {
        this.volumes.sfx = DefensiveUtils.validateNumber(volume, 0, 1, 0.8);
        if (this.gainNodes.sfx) {
            this.gainNodes.sfx.gain.value = this.volumes.sfx;
        }
        this.saveSettings();
    },
    
    // Set UI volume
    setUIVolume: function(volume) {
        this.volumes.ui = DefensiveUtils.validateNumber(volume, 0, 1, 0.45);
        if (this.gainNodes.ui) {
            this.gainNodes.ui.gain.value = this.volumes.ui;
        }
        this.saveSettings();
    },
    
    // Last play time tracking (prevent sound spam)
    lastPlayTimes: {},
    minPlayInterval: 50, // Minimum ms between same sound plays
    
    // Play sound (optimized: prevent overlapping/spam)
    playSound: function(soundName, volume = 1.0, type = 'sfx') {
        // Prevent sound spam (same sound playing too frequently)
        const now = performance.now();
        const lastPlay = this.lastPlayTimes[soundName] || 0;
        if (now - lastPlay < this.minPlayInterval) {
            return; // Skip if played too recently
        }
        this.lastPlayTimes[soundName] = now;
        
        try {
            // Get audio from pool or create new
            let audio = this.getAudioFromPool(soundName);
            
            if (!audio) {
                // Try to load audio
                audio = this.loadAudio(soundName);
                if (!audio) {
                    // Fallback: generate tone
                    this.playFallbackTone(type, volume);
                    return;
                }
            }
            
            // Set volume with cap to prevent distortion
            const finalVolume = Math.min(1.0, volume);
            audio.volume = finalVolume;
            
            // Connect to appropriate gain node
            if (this.audioContext && this.gainNodes[type]) {
                // Use Web Audio API if available
                const source = this.audioContext.createMediaElementSource(audio);
                source.connect(this.gainNodes[type]);
            }
            
            // Play
            audio.currentTime = 0;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn(`Failed to play sound ${soundName}:`, e);
                    this.playFallbackTone(type, volume);
                });
            }
        } catch (e) {
            console.warn(`Error playing sound ${soundName}:`, e);
            this.playFallbackTone(type, volume);
        }
    },
    
    // Get audio from pool (optimized: limit pool size, prevent spam)
    getAudioFromPool: function(soundName) {
        if (!this.audioPools[soundName]) {
            this.audioPools[soundName] = [];
        }
        
        // Find available audio (prefer paused over ended for faster reuse)
        const pool = this.audioPools[soundName];
        let audio = pool.find(a => a.paused);
        if (!audio) {
            audio = pool.find(a => a.ended);
        }
        
        // Limit pool size to prevent memory issues
        if (!audio && pool.length < this.maxPoolSize) {
            try {
                audio = new Audio();
                audio.preload = 'auto';
                pool.push(audio);
            } catch (e) {
                console.warn('Failed to create audio object:', e);
                return null;
            }
        }
        
        return audio;
    },
    
    // Load audio file
    loadAudio: function(soundName) {
        // Try to get from asset loader
        if (window.AssetLoader) {
            const audio = window.AssetLoader.get('audio', `sounds/${soundName}.mp3`);
            if (audio) return audio;
        }
        
        // Fallback: try direct path
        try {
            const audio = new Audio(`sounds/${soundName}.mp3`);
            audio.preload = 'auto';
            return audio;
        } catch (e) {
            return null;
        }
    },
    
    // Play fallback tone
    playFallbackTone: function(type, volume) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.gainNodes[type] || this.gainNodes.master);
            
            // Different frequencies for different types
            const frequencies = {
                sfx: 440,
                ui: 330,
                music: 220
            };
            
            oscillator.frequency.value = frequencies[type] || 440;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            // Silent fail
        }
    },
    
    // Duck audio (lower volume temporarily)
    duck: function(targetType, amount = 0.3, duration = 500) {
        if (!this.gainNodes[targetType]) return;
        
        this.ducking.active = true;
        this.ducking.target = this.gainNodes[targetType];
        this.ducking.originalVolume = this.gainNodes[targetType].gain.value;
        
        this.gainNodes[targetType].gain.linearRampToValueAtTime(
            this.ducking.originalVolume * amount,
            this.audioContext.currentTime + 0.1
        );
        
        setTimeout(() => {
            this.unduck();
        }, duration);
    },
    
    // Unduck audio
    unduck: function() {
        if (!this.ducking.active || !this.ducking.target) return;
        
        this.ducking.target.gain.linearRampToValueAtTime(
            this.ducking.originalVolume,
            this.audioContext.currentTime + 0.3
        );
        
        this.ducking.active = false;
        this.ducking.target = null;
    },
    
    // Mute all
    mute: function() {
        if (this.gainNodes.master) {
            this.gainNodes.master.gain.value = 0;
        }
    },
    
    // Unmute all
    unmute: function() {
        if (this.gainNodes.master) {
            this.gainNodes.master.gain.value = this.volumes.master;
        }
    }
};

// Export
window.AudioManager = AudioManager;

