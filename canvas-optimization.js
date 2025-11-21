// ==================== CANVAS OPTIMIZATION ====================
// Cached rendering and performance optimizations

let cachedGridCanvas = null;
let cachedUICanvas = null;
let gridDirty = true;
let uiDirty = true;

// Initialize canvas optimizations
function initCanvasOptimization() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { 
        willReadFrequently: false,
        alpha: true,
        desynchronized: false
    });
    
    // Create cached canvases
    cachedGridCanvas = document.createElement('canvas');
    cachedGridCanvas.width = canvas.width;
    cachedGridCanvas.height = canvas.height;
    
    cachedUICanvas = document.createElement('canvas');
    cachedUICanvas.width = canvas.width;
    cachedUICanvas.height = canvas.height;
    
    // Mark as dirty initially
    gridDirty = true;
    uiDirty = true;
}

// Draw cached grid (only redraw when dirty)
function drawCachedGrid(ctx, colors) {
    if (!cachedGridCanvas) {
        initCanvasOptimization();
    }
    
    if (gridDirty) {
        const gridCtx = cachedGridCanvas.getContext('2d');
        gridCtx.clearRect(0, 0, cachedGridCanvas.width, cachedGridCanvas.height);
        
        // Draw grid background
        gridCtx.fillStyle = colors.bg;
        gridCtx.fillRect(0, 0, cachedGridCanvas.width, cachedGridCanvas.height);
        
        // Draw grid lines (only if not in performance mode)
        if (!window.getPerformanceSetting || !window.getPerformanceSetting('reducedAnimations')) {
            gridCtx.strokeStyle = colors.grid;
            gridCtx.lineWidth = 1;
            
            for (let x = 0; x <= GRID_COLS; x++) {
                gridCtx.beginPath();
                gridCtx.moveTo(x * CELL_SIZE, 0);
                gridCtx.lineTo(x * CELL_SIZE, GRID_ROWS * CELL_SIZE);
                gridCtx.stroke();
            }
            
            for (let y = 0; y <= GRID_ROWS; y++) {
                gridCtx.beginPath();
                gridCtx.moveTo(0, y * CELL_SIZE);
                gridCtx.lineTo(GRID_COLS * CELL_SIZE, y * CELL_SIZE);
                gridCtx.stroke();
            }
        }
        
        gridDirty = false;
    }
    
    // Draw cached grid to main canvas
    ctx.drawImage(cachedGridCanvas, 0, 0);
}

// Mark grid as dirty (call when grid needs redraw)
function markGridDirty() {
    gridDirty = true;
}

// Draw cached UI elements
function drawCachedUI(ctx) {
    if (!cachedUICanvas) {
        initCanvasOptimization();
    }
    
    // UI elements that don't change often can be cached
    // For now, we'll keep UI dynamic but this can be optimized further
}

// Optimize canvas context settings
function optimizeCanvasContext(ctx) {
    if (!ctx) return;
    
    // Disable image smoothing for pixel art style (optional)
    // ctx.imageSmoothingEnabled = false;
    
    // Use faster composite operations
    ctx.globalCompositeOperation = 'source-over';
}

// Batch draw operations
function batchDraw(ctx, operations) {
    ctx.save();
    
    operations.forEach(op => {
        if (op.type === 'fillRect') {
            ctx.fillStyle = op.color;
            ctx.fillRect(op.x, op.y, op.w, op.h);
        } else if (op.type === 'strokeRect') {
            ctx.strokeStyle = op.color;
            ctx.lineWidth = op.width || 1;
            ctx.strokeRect(op.x, op.y, op.w, op.h);
        } else if (op.type === 'fillText') {
            ctx.fillStyle = op.color;
            ctx.font = op.font || '12px Arial';
            ctx.fillText(op.text, op.x, op.y);
        }
    });
    
    ctx.restore();
}

// Clear canvas efficiently
function clearCanvas(ctx, width, height) {
    // Use clearRect instead of fillRect for better performance
    ctx.clearRect(0, 0, width, height);
}

// Export
window.initCanvasOptimization = initCanvasOptimization;
window.drawCachedGrid = drawCachedGrid;
window.markGridDirty = markGridDirty;
window.drawCachedUI = drawCachedUI;
window.optimizeCanvasContext = optimizeCanvasContext;
window.batchDraw = batchDraw;
window.clearCanvas = clearCanvas;

