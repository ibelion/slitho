// ==================== ASSET LOADER ====================
// Async asset loading with progress tracking and fallbacks

const AssetLoader = {
    assets: {
        images: {},
        audio: {},
        fonts: {}
    },
    loadingProgress: 0,
    totalAssets: 0,
    loadedAssets: 0,
    loadingScreen: null,
    onComplete: null,
    onProgress: null
};

// Asset manifest
const ASSET_MANIFEST = {
    images: [
        // Add image paths here
    ],
    audio: [
        // Add audio paths here
    ],
    fonts: [
        // Add font paths here
    ]
};

// Initialize asset loader
function initAssetLoader() {
    createLoadingScreen();
    calculateTotalAssets();
}

// Create loading screen
function createLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'assetLoadingScreen';
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;
    
    const tips = [
        "💡 Tip: Use arrow keys or WASD to control your snake",
        "🎯 Tip: Collect food to grow and increase your score",
        "⚡ Tip: Higher combos give bonus points",
        "🛡️ Tip: Watch out for hazards and obstacles",
        "🏆 Tip: Complete levels to unlock new challenges",
        "🔥 Tip: Daily challenges offer special rewards"
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    loadingScreen.innerHTML = `
        <div class="loading-brand">
            <div class="loading-logo">🐍</div>
            <h1 class="loading-title">Slitho</h1>
        </div>
        <div class="loading-progress-container">
            <div class="loading-progress-bar">
                <div id="loadingProgressBar" class="loading-progress-fill"></div>
            </div>
            <div id="loadingStatus" class="loading-status">Initializing...</div>
        </div>
        <div class="loading-tip">${randomTip}</div>
        <div class="loading-spinner"></div>
    `;
    
    document.body.appendChild(loadingScreen);
    AssetLoader.loadingScreen = loadingScreen;
    
    // Add CSS for loading screen
    if (!document.getElementById('loadingScreenStyles')) {
        const style = document.createElement('style');
        style.id = 'loadingScreenStyles';
        style.textContent = `
            .loading-brand {
                text-align: center;
                margin-bottom: 40px;
                animation: fadeInDown 0.6s ease;
            }
            .loading-logo {
                font-size: 4em;
                animation: pulse 2s ease-in-out infinite;
                margin-bottom: 10px;
                line-height: 1;
            }
            .loading-title {
                font-size: 2.5em;
                font-weight: 800;
                background: linear-gradient(135deg, #4CAF50, #66bb6a);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0;
                letter-spacing: -0.02em;
            }
            .loading-progress-container {
                width: 400px;
                max-width: 90%;
                margin-bottom: 30px;
            }
            .loading-progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            .loading-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #66bb6a);
                width: 0%;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            .loading-status {
                text-align: center;
                color: #aaa;
                font-size: 0.9em;
            }
            .loading-tip {
                text-align: center;
                color: #888;
                font-size: 0.85em;
                margin-top: 20px;
                max-width: 400px;
                animation: fadeIn 1s ease 0.5s both;
                padding: 0 20px;
            }
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(76, 175, 80, 0.3);
                border-top-color: #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-top: 30px;
            }
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @media (prefers-reduced-motion: reduce) {
                .loading-brand,
                .loading-logo,
                .loading-tip,
                .loading-spinner {
                    animation: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Rotate tips
    let tipIndex = Math.floor(Math.random() * tips.length);
    const tipEl = loadingScreen.querySelector('.loading-tip');
    const tipInterval = setInterval(() => {
        if (tipEl && document.body.contains(loadingScreen)) {
            tipIndex = (tipIndex + 1) % tips.length;
            tipEl.style.opacity = '0';
            setTimeout(() => {
                if (tipEl && document.body.contains(loadingScreen)) {
                    tipEl.textContent = tips[tipIndex];
                    tipEl.style.opacity = '1';
                }
            }, 300);
        } else {
            clearInterval(tipInterval);
        }
    }, 4000);
}

// Calculate total assets
function calculateTotalAssets() {
    AssetLoader.totalAssets = 
        ASSET_MANIFEST.images.length +
        ASSET_MANIFEST.audio.length +
        ASSET_MANIFEST.fonts.length;
}

// Load all assets
async function loadAllAssets() {
    AssetLoader.loadedAssets = 0;
    AssetLoader.loadingProgress = 0;
    
    updateLoadingStatus('Loading images...');
    await loadImages();
    
    updateLoadingStatus('Loading audio...');
    await loadAudio();
    
    updateLoadingStatus('Loading fonts...');
    await loadFonts();
    
    updateLoadingStatus('Complete!');
    hideLoadingScreen();
    
    if (AssetLoader.onComplete) {
        AssetLoader.onComplete();
    }
}

// Load images
async function loadImages() {
    const promises = ASSET_MANIFEST.images.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                AssetLoader.assets.images[path] = img;
                assetLoaded();
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                // Fallback: create placeholder
                AssetLoader.assets.images[path] = createPlaceholderImage();
                assetLoaded();
                resolve(null);
            };
            img.src = path;
        });
    });
    
    await Promise.all(promises);
}

// Load audio
async function loadAudio() {
    const promises = ASSET_MANIFEST.audio.map(path => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                AssetLoader.assets.audio[path] = audio;
                assetLoaded();
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${path}`);
                assetLoaded();
                resolve(null);
            };
            audio.src = path;
            audio.preload = 'auto';
        });
    });
    
    await Promise.all(promises);
}

// Load fonts
async function loadFonts() {
    if (!document.fonts) {
        // Fallback for browsers without Font Loading API
        ASSET_MANIFEST.fonts.forEach(() => assetLoaded());
        return;
    }
    
    const promises = ASSET_MANIFEST.fonts.map(font => {
        return document.fonts.load(font).then(() => {
            AssetLoader.assets.fonts[font] = true;
            assetLoaded();
        }).catch(() => {
            console.warn(`Failed to load font: ${font}`);
            assetLoaded();
        });
    });
    
    await Promise.all(promises);
}

// Create placeholder image
function createPlaceholderImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('?', 16, 20);
    return canvas;
}

// Asset loaded callback
function assetLoaded() {
    AssetLoader.loadedAssets++;
    AssetLoader.loadingProgress = (AssetLoader.loadedAssets / AssetLoader.totalAssets) * 100;
    updateProgressBar(AssetLoader.loadingProgress);
    
    if (AssetLoader.onProgress) {
        AssetLoader.onProgress(AssetLoader.loadingProgress);
    }
}

// Update progress bar
function updateProgressBar(progress) {
    const bar = document.getElementById('loadingProgressBar');
    if (bar) {
        const progressPercent = Math.min(100, progress);
        bar.style.width = `${progressPercent}%`;
    }
}

// Update loading status
function updateLoadingStatus(text) {
    const status = document.getElementById('loadingStatus');
    if (status) {
        status.textContent = text;
    }
    
    // Also update progress bar if we have progress info
    if (AssetLoader.totalAssets > 0) {
        const progress = (AssetLoader.loadedAssets / AssetLoader.totalAssets) * 100;
        updateProgressBar(progress);
    }
}

// Hide loading screen
function hideLoadingScreen() {
    if (AssetLoader.loadingScreen) {
        AssetLoader.loadingScreen.style.opacity = '0';
        AssetLoader.loadingScreen.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (AssetLoader.loadingScreen.parentNode) {
                AssetLoader.loadingScreen.parentNode.removeChild(AssetLoader.loadingScreen);
            }
        }, 500);
    }
}

// Get asset
function getAsset(type, path) {
    return AssetLoader.assets[type]?.[path] || null;
}

// Preload specific asset
async function preloadAsset(type, path) {
    if (type === 'image') {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                AssetLoader.assets.images[path] = img;
                resolve(img);
            };
            img.onerror = () => {
                AssetLoader.assets.images[path] = createPlaceholderImage();
                resolve(null);
            };
            img.src = path;
        });
    } else if (type === 'audio') {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                AssetLoader.assets.audio[path] = audio;
                resolve(audio);
            };
            audio.onerror = () => resolve(null);
            audio.src = path;
            audio.preload = 'auto';
        });
    }
}

// Export
window.AssetLoader = {
    ...AssetLoader,
    init: initAssetLoader,
    loadAll: loadAllAssets,
    get: getAsset,
    preload: preloadAsset,
    onComplete: null,
    onProgress: null
};

