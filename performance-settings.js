// ==================== PERFORMANCE SETTINGS ====================
// Global performance settings with persistence

let performanceSettings = {
    highFPSMode: true, // Variable FPS rendering, fixed tick
    lowPowerMode: false, // 30FPS render cap
    reducedAnimations: false,
    simplifiedParticles: false,
    disableShadows: false,
    disableGlows: false,
    targetResolution: 'auto', // 'auto', '720p', '1080p', 'native'
    maxParticles: 100 // Maximum particle count
};

// Load settings from localStorage
function loadPerformanceSettings() {
    const saved = localStorage.getItem('performanceSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            performanceSettings = { ...performanceSettings, ...parsed };
        } catch (e) {
            console.warn('Failed to load performance settings:', e);
        }
    }
    applyPerformanceSettings();
}

// Save settings to localStorage
function savePerformanceSettings() {
    localStorage.setItem('performanceSettings', JSON.stringify(performanceSettings));
    applyPerformanceSettings();
}

// Apply performance settings
function applyPerformanceSettings() {
    // Apply FPS cap if low power mode
    if (performanceSettings.lowPowerMode) {
        // This will be handled in the game loop
        window.targetFPS = 30;
    } else {
        window.targetFPS = null; // No cap
    }
    
    // Update particle system
    if (window.setMaxParticles) {
        window.setMaxParticles(performanceSettings.simplifiedParticles ? 
            Math.floor(performanceSettings.maxParticles * 0.5) : 
            performanceSettings.maxParticles);
    }
    
    // Expose settings globally
    window.performanceSettings = performanceSettings;
}

// Get setting value
function getPerformanceSetting(key) {
    return performanceSettings[key];
}

// Set setting value
function setPerformanceSetting(key, value) {
    performanceSettings[key] = value;
    savePerformanceSettings();
}

// Toggle setting
function togglePerformanceSetting(key) {
    performanceSettings[key] = !performanceSettings[key];
    savePerformanceSettings();
}

// Initialize performance settings UI
function initPerformanceSettingsUI() {
    const modal = document.getElementById('performanceSettingsModal');
    if (modal) {
        renderPerformanceSettings();
        return;
    }
    
    // Create modal
    const newModal = document.createElement('div');
    newModal.id = 'performanceSettingsModal';
    newModal.className = 'modal';
    newModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Performance Settings</h2>
                <button class="modal-close" id="performanceSettingsClose">&times;</button>
            </div>
            <div class="modal-body">
                <div id="performanceSettingsContent"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(newModal);
    
    // Close button
    const closeBtn = document.getElementById('performanceSettingsClose');
    if (closeBtn) {
        closeBtn.onclick = () => {
            newModal.classList.remove('show');
        };
    }
    
    renderPerformanceSettings();
}

// Render performance settings UI
function renderPerformanceSettings() {
    const content = document.getElementById('performanceSettingsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>High FPS Mode</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="highFPSMode" ${performanceSettings.highFPSMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Variable FPS rendering with fixed tick rate. Recommended for smooth gameplay.
                </div>
            </div>
            
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>Low Power Mode</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="lowPowerMode" ${performanceSettings.lowPowerMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Caps rendering at 30FPS to reduce power consumption.
                </div>
            </div>
            
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>Reduced Animations</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="reducedAnimations" ${performanceSettings.reducedAnimations ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Disables non-essential animations for better performance.
                </div>
            </div>
            
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>Simplified Particles</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="simplifiedParticles" ${performanceSettings.simplifiedParticles ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Reduces particle count and complexity.
                </div>
            </div>
            
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>Disable Shadows</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="disableShadows" ${performanceSettings.disableShadows ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Removes shadow effects for better performance.
                </div>
            </div>
            
            <div class="setting-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label><strong>Disable Glows</strong></label>
                    <label class="switch">
                        <input type="checkbox" id="disableGlows" ${performanceSettings.disableGlows ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9em;">
                    Removes glow effects for better performance.
                </div>
            </div>
            
            <div class="setting-item">
                <label><strong>Max Particles</strong></label>
                <input type="range" id="maxParticles" min="25" max="200" value="${performanceSettings.maxParticles}" 
                       style="width: 100%; margin-top: 5px;">
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                    <span>25</span>
                    <span id="maxParticlesValue">${performanceSettings.maxParticles}</span>
                    <span>200</span>
                </div>
            </div>
            
            <div class="setting-item">
                <label><strong>Target Resolution</strong></label>
                <select id="targetResolution" style="width: 100%; padding: 8px; margin-top: 5px;">
                    <option value="auto" ${performanceSettings.targetResolution === 'auto' ? 'selected' : ''}>Auto (Recommended)</option>
                    <option value="720p" ${performanceSettings.targetResolution === '720p' ? 'selected' : ''}>720p</option>
                    <option value="1080p" ${performanceSettings.targetResolution === '1080p' ? 'selected' : ''}>1080p</option>
                    <option value="native" ${performanceSettings.targetResolution === 'native' ? 'selected' : ''}>Native</option>
                </select>
            </div>
            
            <button class="btn" onclick="resetPerformanceSettings()" style="margin-top: 10px;">
                Reset to Defaults
            </button>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('highFPSMode')?.addEventListener('change', (e) => {
        setPerformanceSetting('highFPSMode', e.target.checked);
    });
    
    document.getElementById('lowPowerMode')?.addEventListener('change', (e) => {
        setPerformanceSetting('lowPowerMode', e.target.checked);
    });
    
    document.getElementById('reducedAnimations')?.addEventListener('change', (e) => {
        setPerformanceSetting('reducedAnimations', e.target.checked);
    });
    
    document.getElementById('simplifiedParticles')?.addEventListener('change', (e) => {
        setPerformanceSetting('simplifiedParticles', e.target.checked);
    });
    
    document.getElementById('disableShadows')?.addEventListener('change', (e) => {
        setPerformanceSetting('disableShadows', e.target.checked);
    });
    
    document.getElementById('disableGlows')?.addEventListener('change', (e) => {
        setPerformanceSetting('disableGlows', e.target.checked);
    });
    
    const maxParticlesSlider = document.getElementById('maxParticles');
    const maxParticlesValue = document.getElementById('maxParticlesValue');
    if (maxParticlesSlider && maxParticlesValue) {
        maxParticlesSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            maxParticlesValue.textContent = value;
            setPerformanceSetting('maxParticles', value);
        });
    }
    
    document.getElementById('targetResolution')?.addEventListener('change', (e) => {
        setPerformanceSetting('targetResolution', e.target.value);
    });
}

// Reset to defaults
function resetPerformanceSettings() {
    performanceSettings = {
        highFPSMode: true,
        lowPowerMode: false,
        reducedAnimations: false,
        simplifiedParticles: false,
        disableShadows: false,
        disableGlows: false,
        targetResolution: 'auto',
        maxParticles: 100
    };
    savePerformanceSettings();
    renderPerformanceSettings();
}

// Show performance settings modal
function showPerformanceSettings() {
    const modal = document.getElementById('performanceSettingsModal');
    if (modal) {
        renderPerformanceSettings();
        modal.classList.add('show');
    } else {
        initPerformanceSettingsUI();
        const newModal = document.getElementById('performanceSettingsModal');
        if (newModal) {
            newModal.classList.add('show');
        }
    }
}

// Export
window.loadPerformanceSettings = loadPerformanceSettings;
window.savePerformanceSettings = savePerformanceSettings;
window.getPerformanceSetting = getPerformanceSetting;
window.setPerformanceSetting = setPerformanceSetting;
window.togglePerformanceSetting = togglePerformanceSetting;
window.initPerformanceSettingsUI = initPerformanceSettingsUI;
window.showPerformanceSettings = showPerformanceSettings;
window.resetPerformanceSettings = resetPerformanceSettings;
window.performanceSettings = performanceSettings;

