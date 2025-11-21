// ==================== HIT FEEDBACK SYSTEM ====================
// Visual and haptic feedback for game events

const HitFeedback = {
    active: true,
    intensity: 1.0,
    screenShakeEnabled: true,
    flashEnabled: true,
    soundEnabled: true
};

// Flash overlay for hit feedback
let flashOverlay = null;

// Initialize hit feedback
function initHitFeedback() {
    createFlashOverlay();
    loadSettings();
}

// Create flash overlay
function createFlashOverlay() {
    flashOverlay = document.createElement('div');
    flashOverlay.id = 'hitFlashOverlay';
    flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.1s;
    `;
    document.body.appendChild(flashOverlay);
}

// Load settings
function loadSettings() {
    const saved = localStorage.getItem('hitFeedbackSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.assign(HitFeedback, settings);
        } catch (e) {
            console.warn('Failed to load hit feedback settings');
        }
    }
}

// Save settings
function saveSettings() {
    localStorage.setItem('hitFeedbackSettings', JSON.stringify({
        active: HitFeedback.active,
        intensity: HitFeedback.intensity,
        screenShakeEnabled: HitFeedback.screenShakeEnabled,
        flashEnabled: HitFeedback.flashEnabled,
        soundEnabled: HitFeedback.soundEnabled
    }));
}

// Trigger hit feedback
function triggerHitFeedback(type, intensity = 1.0) {
    if (!HitFeedback.active) return;
    
    const finalIntensity = intensity * HitFeedback.intensity;
    
    switch (type) {
        case 'damage':
            triggerDamageFeedback(finalIntensity);
            break;
        case 'food':
            triggerFoodFeedback(finalIntensity);
            break;
        case 'death':
            triggerDeathFeedback(finalIntensity);
            break;
        case 'level_complete':
            triggerLevelCompleteFeedback(finalIntensity);
            break;
        case 'powerup':
            triggerPowerUpFeedback(finalIntensity);
            break;
    }
}

// Damage feedback
function triggerDamageFeedback(intensity) {
    if (HitFeedback.screenShakeEnabled && window.CameraShake) {
        window.CameraShake.trigger(5 * intensity, 300, 'exponential');
    }
    
    if (HitFeedback.flashEnabled) {
        flashScreen('#ff0000', 0.3 * intensity, 100);
    }
    
    if (HitFeedback.soundEnabled && window.playSound) {
        window.playSound('hit', 0.5 * intensity);
    }
}

// Food feedback
function triggerFoodFeedback(intensity) {
    if (HitFeedback.screenShakeEnabled && window.CameraShake) {
        window.CameraShake.trigger(2 * intensity, 150, 'exponential');
    }
    
    if (HitFeedback.flashEnabled) {
        flashScreen('#4CAF50', 0.2 * intensity, 50);
    }
}

// Death feedback
function triggerDeathFeedback(intensity) {
    if (HitFeedback.screenShakeEnabled && window.CameraShake) {
        window.CameraShake.trigger(8 * intensity, 500, 'exponential');
    }
    
    if (HitFeedback.flashEnabled) {
        flashScreen('#ff0000', 0.5 * intensity, 200);
    }
    
    if (HitFeedback.soundEnabled && window.playSound) {
        window.playSound('death', 0.7 * intensity);
    }
}

// Level complete feedback
function triggerLevelCompleteFeedback(intensity) {
    if (HitFeedback.screenShakeEnabled && window.CameraShake) {
        window.CameraShake.trigger(3 * intensity, 400, 'exponential');
    }
    
    if (HitFeedback.flashEnabled) {
        flashScreen('#ffd700', 0.4 * intensity, 300);
    }
}

// Power-up feedback
function triggerPowerUpFeedback(intensity) {
    if (HitFeedback.screenShakeEnabled && window.CameraShake) {
        window.CameraShake.trigger(2 * intensity, 200, 'exponential');
    }
    
    if (HitFeedback.flashEnabled) {
        flashScreen('#00aaff', 0.3 * intensity, 150);
    }
}

// Flash screen
function flashScreen(color, opacity, duration) {
    if (!flashOverlay) return;
    
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = opacity;
    
    setTimeout(() => {
        if (flashOverlay) {
            flashOverlay.style.opacity = '0';
        }
    }, duration);
}

// Haptic feedback (if supported)
function triggerHaptic(intensity = 0.5) {
    if (navigator.vibrate) {
        const duration = Math.min(200, intensity * 200);
        navigator.vibrate(duration);
    }
}

// Export
window.HitFeedback = {
    ...HitFeedback,
    init: initHitFeedback,
    trigger: triggerHitFeedback,
    haptic: triggerHaptic,
    saveSettings,
    loadSettings
};

