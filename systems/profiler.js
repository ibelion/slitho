// ==================== PERFORMANCE PROFILER ====================
// Auto performance profiler with F3 toggle
// Updates every 500ms

const PROFILER_UPDATE_INTERVAL = 500; // ms
const FPS_SMOOTHING_FRAMES = 30;
const TICK_HISTORY_SIZE = 60;

let profilerOverlay = null;
let isProfilerVisible = false;
let profilerUpdateInterval = null;

// Performance metrics
let performanceMetrics = {
    fps: 0,
    tickRate: 0,
    avgTickDuration: 0,
    avgFrameTime: 0,
    jsHeapUsed: 0,
    jsHeapTotal: 0
};

// Circular buffers for tracking
let frameTimeHistory = [];
let tickDurationHistory = [];
let tickCountHistory = [];
let lastTickCount = 0;
let lastTickTime = performance.now();
let lastFrameTime = performance.now();

// Initialize profiler
function initProfiler() {
    // Create overlay element
    profilerOverlay = document.createElement('div');
    profilerOverlay.id = 'profilerOverlay';
    profilerOverlay.className = 'profiler-overlay';
    profilerOverlay.innerHTML = `
        <div class="profiler-content">
            <div class="profiler-row">
                <span class="profiler-label">FPS:</span>
                <span class="profiler-value" id="profilerFPS">0</span>
            </div>
            <div class="profiler-row">
                <span class="profiler-label">Tick Rate:</span>
                <span class="profiler-value" id="profilerTickRate">0</span>
            </div>
            <div class="profiler-row">
                <span class="profiler-label">Avg Tick:</span>
                <span class="profiler-value" id="profilerTickDuration">0.00ms</span>
            </div>
            <div class="profiler-row">
                <span class="profiler-label">Frame Time:</span>
                <span class="profiler-value" id="profilerFrameTime">0.00ms</span>
            </div>
            <div class="profiler-row" id="profilerHeapRow" style="display: none;">
                <span class="profiler-label">Heap:</span>
                <span class="profiler-value" id="profilerHeap">0 / 0 MB</span>
            </div>
        </div>
    `;
    document.body.appendChild(profilerOverlay);
    
    // F3 toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            e.preventDefault();
            toggleProfiler();
        }
    });
    
    // Start update loop
    startProfilerUpdate();
}

// Start profiler update loop
function startProfilerUpdate() {
    if (profilerUpdateInterval) return;
    
    profilerUpdateInterval = setInterval(() => {
        updateProfilerMetrics();
        if (isProfilerVisible) {
            updateProfilerUI();
        }
    }, PROFILER_UPDATE_INTERVAL);
}

// Stop profiler update loop
function stopProfilerUpdate() {
    if (profilerUpdateInterval) {
        clearInterval(profilerUpdateInterval);
        profilerUpdateInterval = null;
    }
}

// Record frame time
function recordFrameTime(frameTime) {
    frameTimeHistory.push(frameTime);
    if (frameTimeHistory.length > FPS_SMOOTHING_FRAMES) {
        frameTimeHistory.shift();
    }
}

// Record tick duration
function recordTickDuration(duration) {
    tickDurationHistory.push(duration);
    if (tickDurationHistory.length > TICK_HISTORY_SIZE) {
        tickDurationHistory.shift();
    }
}

// Record tick count
function recordTickCount() {
    const now = performance.now();
    const deltaTime = now - lastTickTime;
    
    if (deltaTime >= 1000) {
        // Calculate tick rate per second
        const tickRate = ((tickCountHistory.length > 0 ? tickCountHistory.reduce((a, b) => a + b, 0) : 0) / (deltaTime / 1000));
        tickCountHistory = [];
        lastTickTime = now;
        
        if (tickRate > 0) {
            performanceMetrics.tickRate = Math.round(tickRate);
        }
    }
    
    // Track tick count in current second
    const currentSecond = Math.floor(now / 1000);
    const lastSecond = Math.floor(lastTickTime / 1000);
    
    if (currentSecond !== lastSecond) {
        tickCountHistory = [];
    }
    
    tickCountHistory.push(1);
}

// Update profiler metrics
function updateProfilerMetrics() {
    // Calculate FPS (smoothed average)
    if (frameTimeHistory.length > 0) {
        const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
        performanceMetrics.fps = Math.round(1000 / avgFrameTime);
        performanceMetrics.avgFrameTime = avgFrameTime;
    }
    
    // Calculate average tick duration
    if (tickDurationHistory.length > 0) {
        performanceMetrics.avgTickDuration = tickDurationHistory.reduce((a, b) => a + b, 0) / tickDurationHistory.length;
    }
    
    // Get JS heap size (if available)
    if (performance.memory) {
        performanceMetrics.jsHeapUsed = performance.memory.usedJSHeapSize;
        performanceMetrics.jsHeapTotal = performance.memory.totalJSHeapSize;
    }
}

// Update profiler UI
function updateProfilerUI() {
    if (!profilerOverlay) return;
    
    const fpsEl = document.getElementById('profilerFPS');
    const tickRateEl = document.getElementById('profilerTickRate');
    const tickDurationEl = document.getElementById('profilerTickDuration');
    const frameTimeEl = document.getElementById('profilerFrameTime');
    const heapEl = document.getElementById('profilerHeap');
    const heapRow = document.getElementById('profilerHeapRow');
    
    if (fpsEl) {
        fpsEl.textContent = performanceMetrics.fps;
        fpsEl.className = 'profiler-value ' + (performanceMetrics.fps < 30 ? 'profiler-warning' : 
                                                performanceMetrics.fps < 50 ? 'profiler-caution' : '');
    }
    
    if (tickRateEl) {
        tickRateEl.textContent = performanceMetrics.tickRate + '/s';
    }
    
    if (tickDurationEl) {
        tickDurationEl.textContent = performanceMetrics.avgTickDuration.toFixed(2) + 'ms';
    }
    
    if (frameTimeEl) {
        frameTimeEl.textContent = performanceMetrics.avgFrameTime.toFixed(2) + 'ms';
    }
    
    if (heapEl && performanceMetrics.jsHeapTotal > 0) {
        const usedMB = (performanceMetrics.jsHeapUsed / 1024 / 1024).toFixed(2);
        const totalMB = (performanceMetrics.jsHeapTotal / 1024 / 1024).toFixed(2);
        heapEl.textContent = `${usedMB} / ${totalMB} MB`;
        if (heapRow) {
            heapRow.style.display = 'flex';
        }
    }
}

// Toggle profiler
function toggleProfiler() {
    if (!profilerOverlay) return;
    
    isProfilerVisible = !isProfilerVisible;
    
    if (isProfilerVisible) {
        profilerOverlay.classList.add('show');
        updateProfilerUI();
    } else {
        profilerOverlay.classList.remove('show');
    }
}

// Export
window.Profiler = {
    init: initProfiler,
    recordFrameTime,
    recordTickDuration,
    recordTickCount,
    toggle: toggleProfiler,
    getMetrics: () => ({ ...performanceMetrics })
};

