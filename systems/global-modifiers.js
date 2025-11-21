// ==================== GLOBAL MODIFIERS ====================
// World/level modifiers that affect gameplay

const GlobalModifiers = {
    active: {},
    modifiers: {
        SPEEDUP: 'speedup',
        SLOWDOWN: 'slowdown',
        FOG: 'fog',
        NIGHT_MODE: 'night_mode',
        GRAVITY: 'gravity',
        REVERSE_CONTROLS: 'reverse_controls',
        MIRROR_MODE: 'mirror_mode'
    }
};

// Apply speedup modifier
function applySpeedupModifier(factor = 1.5) {
    GlobalModifiers.active[GlobalModifiers.modifiers.SPEEDUP] = {
        factor: factor,
        startTime: Date.now()
    };
    
    if (window.TickEngine) {
        // Modify tick rate
        window.activeSpeedModifier = factor;
    }
}

// Apply slowdown modifier
function applySlowdownModifier(factor = 0.7) {
    GlobalModifiers.active[GlobalModifiers.modifiers.SLOWDOWN] = {
        factor: factor,
        startTime: Date.now()
    };
    
    if (window.TickEngine) {
        window.activeSpeedModifier = factor;
    }
}

// Apply fog modifier
function applyFogModifier(intensity = 0.5) {
    GlobalModifiers.active[GlobalModifiers.modifiers.FOG] = {
        intensity: intensity,
        startTime: Date.now()
    };
}

// Apply night mode modifier
function applyNightModeModifier() {
    GlobalModifiers.active[GlobalModifiers.modifiers.NIGHT_MODE] = {
        startTime: Date.now()
    };
    
    document.documentElement.setAttribute('data-night-mode', 'true');
}

// Apply gravity modifier
function applyGravityModifier(strength = 0.1) {
    GlobalModifiers.active[GlobalModifiers.modifiers.GRAVITY] = {
        strength: strength,
        startTime: Date.now()
    };
}

// Apply reverse controls modifier
function applyReverseControlsModifier() {
    GlobalModifiers.active[GlobalModifiers.modifiers.REVERSE_CONTROLS] = {
        startTime: Date.now()
    };
}

// Apply mirror mode modifier
function applyMirrorModeModifier() {
    GlobalModifiers.active[GlobalModifiers.modifiers.MIRROR_MODE] = {
        startTime: Date.now()
    };
}

// Remove modifier
function removeModifier(modifierType) {
    delete GlobalModifiers.active[modifierType];
    
    if (modifierType === GlobalModifiers.modifiers.NIGHT_MODE) {
        document.documentElement.removeAttribute('data-night-mode');
    }
    
    if (modifierType === GlobalModifiers.modifiers.SPEEDUP || 
        modifierType === GlobalModifiers.modifiers.SLOWDOWN) {
        window.activeSpeedModifier = 1.0;
    }
}

// Clear all modifiers
function clearAllModifiers() {
    for (const key of Object.keys(GlobalModifiers.active)) {
        removeModifier(key);
    }
}

// Check if modifier is active
function isModifierActive(modifierType) {
    return !!GlobalModifiers.active[modifierType];
}

// Get modifier value
function getModifierValue(modifierType) {
    const modifier = GlobalModifiers.active[modifierType];
    return modifier ? modifier.factor || modifier.intensity || modifier.strength || 1 : null;
}

// Apply fog rendering
function renderFog(ctx, canvas) {
    const fog = GlobalModifiers.active[GlobalModifiers.modifiers.FOG];
    if (!fog) return;
    
    ctx.save();
    ctx.globalAlpha = fog.intensity;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Apply night mode rendering
function renderNightMode(ctx, canvas) {
    if (!isModifierActive(GlobalModifiers.modifiers.NIGHT_MODE)) return;
    
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Export
window.GlobalModifiers = {
    ...GlobalModifiers,
    applySpeedup: applySpeedupModifier,
    applySlowdown: applySlowdownModifier,
    applyFog: applyFogModifier,
    applyNightMode: applyNightModeModifier,
    applyGravity: applyGravityModifier,
    applyReverseControls: applyReverseControlsModifier,
    applyMirrorMode: applyMirrorModeModifier,
    remove: removeModifier,
    clear: clearAllModifiers,
    isActive: isModifierActive,
    getValue: getModifierValue,
    renderFog,
    renderNightMode
};

