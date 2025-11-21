// ==================== SNAKE ANIMATOR ====================
// Smooth, snake-accurate animations with interpolation and easing

// Easing modes
const EASING_MODES = {
    linear: (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    smoothstep: (t) => t * t * (3 - 2 * t),
    'cubic-ease-in-out': (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
};

// Current easing mode (loaded from localStorage)
let currentEasingMode = 'smoothstep';

// Animation state
let snakeAnimationState = {
    segments: [], // Interpolated segment positions
    headDirection: { x: 0, y: 0 },
    previousPositions: [], // For interpolation
    tailWiggle: 0, // Tail wiggle animation value
    stretchFactor: 1.0 // Stretch/squash factor
};

// Initialize animator
function initSnakeAnimator() {
    loadEasingMode();
    resetSnakeAnimator();
}

// Load easing mode from localStorage
function loadEasingMode() {
    const saved = localStorage.getItem('snakeEasingMode');
    if (saved && EASING_MODES[saved]) {
        currentEasingMode = saved;
    }
}

// Save easing mode to localStorage
function saveEasingMode(mode) {
    if (EASING_MODES[mode]) {
        currentEasingMode = mode;
        localStorage.setItem('snakeEasingMode', mode);
    }
}

// Get current easing mode
function getEasingMode() {
    return currentEasingMode;
}

// Apply easing to interpolation value
function applyEasing(t) {
    const easingFunc = EASING_MODES[currentEasingMode] || EASING_MODES.smoothstep;
    return easingFunc(Math.max(0, Math.min(1, t)));
}

// Reset animator state
function resetSnakeAnimator() {
    snakeAnimationState = {
        segments: [],
        headDirection: { x: 0, y: 0 },
        previousPositions: [],
        tailWiggle: 0,
        stretchFactor: 1.0
    };
}

// Update snake animation state
function updateSnakeAnimation(snake, dx, dy, interpolation) {
    if (!snake || snake.length === 0) return;
    
    // Apply easing to interpolation (only for rendering, not gameplay)
    const easedInterpolation = applyEasing(interpolation);
    
    // Save previous positions for interpolation
    if (snakeAnimationState.previousPositions.length !== snake.length) {
        snakeAnimationState.previousPositions = snake.map(seg => ({ ...seg }));
    }
    
    // Update head direction
    snakeAnimationState.headDirection = { x: dx, y: dy };
    
    // Calculate interpolated positions
    snakeAnimationState.segments = [];
    
    for (let i = 0; i < snake.length; i++) {
        const current = snake[i];
        const previous = snakeAnimationState.previousPositions[i] || current;
        
        // Interpolate position with easing
        let interpX = previous.x + (current.x - previous.x) * easedInterpolation;
        let interpY = previous.y + (current.y - previous.y) * easedInterpolation;
        
        // Head-leading motion (slight anticipation)
        if (i === 0 && (dx !== 0 || dy !== 0)) {
            const anticipation = 0.15; // 15% anticipation
            interpX += dx * anticipation;
            interpY += dy * anticipation;
        }
        
        // Time-delayed interpolation for body segments
        // Each segment follows with a slight delay
        if (i > 0) {
            const delay = i * 0.05; // 5% delay per segment
            const delayedInterpolation = Math.max(0, easedInterpolation - delay);
            interpX = previous.x + (current.x - previous.x) * delayedInterpolation;
            interpY = previous.y + (current.y - previous.y) * delayedInterpolation;
        }
        
        snakeAnimationState.segments.push({
            x: interpX,
            y: interpY,
            index: i
        });
    }
    
    // Update previous positions
    snakeAnimationState.previousPositions = snake.map(seg => ({ ...seg }));
    
    // Update tail wiggle
    if (snake.length > 3) {
        snakeAnimationState.tailWiggle = Math.sin(Date.now() / 200) * 0.1; // Slow wiggle
    }
    
    // Update stretch factor based on direction changes
    if (dx !== 0 || dy !== 0) {
        const speed = Math.sqrt(dx * dx + dy * dy);
        snakeAnimationState.stretchFactor = 1.0 + speed * 0.1; // Slight stretch when moving
    } else {
        snakeAnimationState.stretchFactor = 1.0;
    }
}

// Get interpolated snake segments for rendering
function getAnimatedSnakeSegments() {
    return snakeAnimationState.segments;
}

// Get head direction for rendering
function getHeadDirection() {
    return snakeAnimationState.headDirection;
}

// Get tail wiggle offset
function getTailWiggle() {
    return snakeAnimationState.tailWiggle;
}

// Get stretch factor
function getStretchFactor() {
    return snakeAnimationState.stretchFactor;
}

// Draw smooth snake with animations
function drawAnimatedSnake(ctx, snake, dx, dy, interpolation, CELL_SIZE, getSnakeColor) {
    if (!snake || snake.length === 0) return;
    
    // Update animation state
    updateSnakeAnimation(snake, dx, dy, interpolation);
    
    const segments = getAnimatedSnakeSegments();
    const headDirection = getHeadDirection();
    const tailWiggle = getTailWiggle();
    const stretchFactor = getStretchFactor();
    const snakeColor = getSnakeColor();
    
    // Draw each segment
    segments.forEach((segment, index) => {
        const isHead = index === 0;
        const isTail = index === segments.length - 1;
        
        // Calculate position with sub-cell precision
        let x = segment.x * CELL_SIZE;
        let y = segment.y * CELL_SIZE;
        
        // Apply tail wiggle to last segment
        if (isTail && segments.length > 3) {
            const angle = tailWiggle;
            const offsetX = Math.cos(angle) * (CELL_SIZE * 0.1);
            const offsetY = Math.sin(angle) * (CELL_SIZE * 0.1);
            x += offsetX;
            y += offsetY;
        }
        
        // Apply stretch factor to head
        let size = CELL_SIZE - 2;
        if (isHead && stretchFactor !== 1.0) {
            size *= stretchFactor;
            // Adjust position to keep centered
            x -= (size - (CELL_SIZE - 2)) / 2;
            y -= (size - (CELL_SIZE - 2)) / 2;
        }
        
        // Smooth corner transitions
        let cornerRadius = 0;
        if (!isHead && index < segments.length - 1) {
            const prev = segments[index - 1];
            const next = segments[index + 1];
            
            // Check if turning corner
            const dx1 = segment.x - prev.x;
            const dy1 = segment.y - prev.y;
            const dx2 = next.x - segment.x;
            const dy2 = next.y - segment.y;
            
            if ((dx1 !== dx2 || dy1 !== dy2) && (dx1 !== 0 || dy1 !== 0) && (dx2 !== 0 || dy2 !== 0)) {
                cornerRadius = CELL_SIZE * 0.2; // Rounded corners when turning
            }
        }
        
        ctx.fillStyle = snakeColor;
        
        // Draw segment with smooth corners
        if (cornerRadius > 0) {
            ctx.beginPath();
            // Use arcTo for rounded corners (fallback if roundRect not available)
            if (ctx.roundRect) {
                ctx.roundRect(x + 1, y + 1, size, size, cornerRadius);
            } else {
                // Manual rounded rectangle
                const r = cornerRadius;
                ctx.moveTo(x + 1 + r, y + 1);
                ctx.lineTo(x + 1 + size - r, y + 1);
                ctx.quadraticCurveTo(x + 1 + size, y + 1, x + 1 + size, y + 1 + r);
                ctx.lineTo(x + 1 + size, y + 1 + size - r);
                ctx.quadraticCurveTo(x + 1 + size, y + 1 + size, x + 1 + size - r, y + 1 + size);
                ctx.lineTo(x + 1 + r, y + 1 + size);
                ctx.quadraticCurveTo(x + 1, y + 1 + size, x + 1, y + 1 + size - r);
                ctx.lineTo(x + 1, y + 1 + r);
                ctx.quadraticCurveTo(x + 1, y + 1, x + 1 + r, y + 1);
                ctx.closePath();
            }
            ctx.fill();
        } else {
            ctx.fillRect(x + 1, y + 1, size, size);
        }
        
        // Draw head direction indicator
        if (isHead && (headDirection.x !== 0 || headDirection.y !== 0)) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            const centerX = x + CELL_SIZE / 2;
            const centerY = y + CELL_SIZE / 2;
            const eyeSize = CELL_SIZE * 0.15;
            
            // Draw eyes in direction of movement
            if (headDirection.x > 0) {
                // Moving right
                ctx.fillRect(centerX + CELL_SIZE * 0.2, centerY - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(centerX + CELL_SIZE * 0.2, centerY + eyeSize, eyeSize, eyeSize);
            } else if (headDirection.x < 0) {
                // Moving left
                ctx.fillRect(centerX - CELL_SIZE * 0.2 - eyeSize, centerY - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(centerX - CELL_SIZE * 0.2 - eyeSize, centerY + eyeSize, eyeSize, eyeSize);
            } else if (headDirection.y > 0) {
                // Moving down
                ctx.fillRect(centerX - eyeSize, centerY + CELL_SIZE * 0.2, eyeSize, eyeSize);
                ctx.fillRect(centerX + eyeSize, centerY + CELL_SIZE * 0.2, eyeSize, eyeSize);
            } else if (headDirection.y < 0) {
                // Moving up
                ctx.fillRect(centerX - eyeSize, centerY - CELL_SIZE * 0.2 - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(centerX + eyeSize, centerY - CELL_SIZE * 0.2 - eyeSize, eyeSize, eyeSize);
            }
        }
    });
}

// Export
window.SnakeAnimator = {
    init: initSnakeAnimator,
    reset: resetSnakeAnimator,
    update: updateSnakeAnimation,
    getSegments: getAnimatedSnakeSegments,
    getHeadDirection,
    getTailWiggle,
    getStretchFactor,
    draw: drawAnimatedSnake,
    setEasingMode: saveEasingMode,
    getEasingMode,
    getAvailableEasingModes: () => Object.keys(EASING_MODES)
};

// Legacy exports for backward compatibility
window.initSnakeAnimator = initSnakeAnimator;
window.resetSnakeAnimator = resetSnakeAnimator;
window.updateSnakeAnimation = updateSnakeAnimation;
window.getAnimatedSnakeSegments = getAnimatedSnakeSegments;
window.getHeadDirection = getHeadDirection;
window.getTailWiggle = getTailWiggle;
window.getStretchFactor = getStretchFactor;
window.drawAnimatedSnake = drawAnimatedSnake;
