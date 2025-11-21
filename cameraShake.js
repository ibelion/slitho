// ==================== CAMERA SHAKE SYSTEM ====================
// General-purpose camera shake engine
// Shake only affects rendered view, not logic

let cameraShakeState = {
    intensity: 0,
    duration: 0,
    elapsed: 0,
    falloff: 'exponential', // 'linear' or 'exponential'
    active: false
};

let shakeOffset = { x: 0, y: 0 };
let perlinSeed = Math.random() * 1000;

// Simple noise function for smooth shake
function noise(x) {
    const i = Math.floor(x);
    const f = x - i;
    const a = Math.sin(i * 12.9898 + perlinSeed) * 43758.5453;
    const b = Math.sin((i + 1) * 12.9898 + perlinSeed) * 43758.5453;
    return (a * (1 - f) + b * f) % 1;
}

// Initialize camera shake
function initCameraShake() {
    // Reset state
    cameraShakeState = {
        intensity: 0,
        duration: 0,
        elapsed: 0,
        falloff: 'exponential',
        active: false
    };
    shakeOffset = { x: 0, y: 0 };
}

// Trigger camera shake
function triggerCameraShake(intensity, duration, falloff = 'exponential') {
    if (intensity <= 0 || duration <= 0) return;
    
    cameraShakeState.intensity = intensity;
    cameraShakeState.duration = duration;
    cameraShakeState.elapsed = 0;
    cameraShakeState.falloff = falloff;
    cameraShakeState.active = true;
}

// Update camera shake (call every frame)
function updateCameraShake(deltaTime) {
    if (!cameraShakeState.active) {
        shakeOffset.x = 0;
        shakeOffset.y = 0;
        return;
    }
    
    cameraShakeState.elapsed += deltaTime;
    
    if (cameraShakeState.elapsed >= cameraShakeState.duration) {
        // Shake complete
        cameraShakeState.active = false;
        cameraShakeState.intensity = 0;
        shakeOffset.x = 0;
        shakeOffset.y = 0;
        return;
    }
    
    // Calculate falloff factor
    const progress = cameraShakeState.elapsed / cameraShakeState.duration;
    let falloffFactor = 1;
    
    if (cameraShakeState.falloff === 'exponential') {
        falloffFactor = 1 - (progress * progress);
    } else if (cameraShakeState.falloff === 'linear') {
        falloffFactor = 1 - progress;
    }
    
    // Calculate current intensity
    const currentIntensity = cameraShakeState.intensity * falloffFactor;
    
    // Generate shake offset using noise for smooth movement
    const time = cameraShakeState.elapsed * 0.01;
    shakeOffset.x = (noise(time) - 0.5) * currentIntensity;
    shakeOffset.y = (noise(time + 1000) - 0.5) * currentIntensity;
}

// Get current shake offset
function getShakeOffset() {
    return { ...shakeOffset };
}

// Export
window.CameraShake = {
    init: initCameraShake,
    trigger: triggerCameraShake,
    update: updateCameraShake,
    getOffset: getShakeOffset,
    isActive: () => cameraShakeState.active
};

