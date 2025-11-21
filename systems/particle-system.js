// ==================== PARTICLE SYSTEM ====================
// Optimized particle effects with object pooling

// Particle pool
const particlePool = [];
const MAX_POOL_SIZE = 500;
const activeParticles = [];

// Particle types
const ParticleTypes = {
    DUST: 'dust',
    SPARKS: 'sparks',
    TRAIL: 'trail',
    BURST: 'burst',
    SMOKE: 'smoke'
};

// Initialize particle system
function initParticleSystem() {
    // Pre-allocate particle pool
    for (let i = 0; i < MAX_POOL_SIZE; i++) {
        particlePool.push(createParticle());
    }
}

// Create particle object
function createParticle() {
    return {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        color: '#fff',
        alpha: 1,
        type: ParticleTypes.DUST,
        active: false
    };
}

// Get particle from pool (with size limit)
function getParticle() {
    // Enforce maximum active particles
    const MAX_ACTIVE_PARTICLES = 500;
    if (activeParticles.length >= MAX_ACTIVE_PARTICLES) {
        // Release oldest particle
        const oldest = activeParticles[0];
        if (oldest) {
            releaseParticle(oldest);
        }
    }
    
    let particle = particlePool.find(p => !p.active);
    if (!particle) {
        // Pool exhausted, create new one (but limit pool growth)
        if (particlePool.length < MAX_POOL_SIZE * 2) {
            particle = createParticle();
            particlePool.push(particle);
        } else {
            // Pool too large, reuse oldest inactive
            return null; // Skip creating particle
        }
    }
    particle.active = true;
    activeParticles.push(particle);
    return particle;
}

// Release particle back to pool
function releaseParticle(particle) {
    particle.active = false;
    const index = activeParticles.indexOf(particle);
    if (index > -1) {
        activeParticles.splice(index, 1);
    }
}

// Create dust particles
function createDustParticles(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
        const p = getParticle();
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
        p.life = 0;
        p.maxLife = 30 + Math.random() * 20;
        p.size = 2 + Math.random() * 3;
        p.color = '#888';
        p.alpha = 0.8;
        p.type = ParticleTypes.DUST;
    }
}

// Create spark particles
function createSparkParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        const p = getParticle();
        p.x = x;
        p.y = y;
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 20 + Math.random() * 15;
        p.size = 3 + Math.random() * 2;
        p.color = `hsl(${Math.random() * 60}, 100%, 60%)`;
        p.alpha = 1;
        p.type = ParticleTypes.SPARKS;
    }
}

// Create trail particles
function createTrailParticle(x, y, color = '#4CAF50') {
    const p = getParticle();
    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 0.5;
    p.vy = (Math.random() - 0.5) * 0.5;
    p.life = 0;
    p.maxLife = 15 + Math.random() * 10;
    p.size = 2 + Math.random() * 2;
    p.color = color;
    p.alpha = 0.6;
    p.type = ParticleTypes.TRAIL;
}

// Create burst particles
function createBurstParticles(x, y, color = '#4CAF50', count = 15) {
    for (let i = 0; i < count; i++) {
        const p = getParticle();
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 25 + Math.random() * 20;
        p.size = 3 + Math.random() * 3;
        p.color = color;
        p.alpha = 1;
        p.type = ParticleTypes.BURST;
    }
}

// Create smoke particles
function createSmokeParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        const p = getParticle();
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 1;
        p.vy = -1 - Math.random() * 1;
        p.life = 0;
        p.maxLife = 40 + Math.random() * 30;
        p.size = 4 + Math.random() * 4;
        p.color = `rgba(100, 100, 100, ${0.3 + Math.random() * 0.3})`;
        p.alpha = 0.5;
        p.type = ParticleTypes.SMOKE;
    }
}

// Update all particles (optimized: iterate backwards, avoid slice)
function updateParticles(deltaTime = 1) {
    // Limit update rate for performance (iterate backwards for safe removal)
    const MAX_PARTICLES_TO_UPDATE = 200;
    const startIndex = activeParticles.length > MAX_PARTICLES_TO_UPDATE
        ? activeParticles.length - MAX_PARTICLES_TO_UPDATE // Update newest particles first
        : 0;
    
    // Iterate backwards for safe removal
    for (let i = activeParticles.length - 1; i >= startIndex; i--) {
        const p = activeParticles[i];
        if (!p || !p.active) continue;
        
        // Update position
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        
        // Update life
        p.life += deltaTime;
        
        // Fade out
        p.alpha = 1 - (p.life / p.maxLife);
        
        // Gravity for some types
        if (p.type === ParticleTypes.DUST || p.type === ParticleTypes.SMOKE) {
            p.vy += 0.1 * deltaTime;
        }
        
        // Decay velocity
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // Remove dead particles
        if (p.life >= p.maxLife || p.alpha <= 0) {
            releaseParticle(p);
        }
    }
}

// Draw all particles (optimized: batch by type, reduce state changes)
function drawParticles(ctx) {
    if (activeParticles.length === 0) return;
    
    ctx.save();
    
    // Batch particles by type to reduce state changes
    let lastAlpha = -1;
    let lastColor = '';
    let lastType = null;
    
    for (let i = 0; i < activeParticles.length; i++) {
        const p = activeParticles[i];
        if (!p || !p.active) continue;
        
        // Only change state if needed
        if (p.alpha !== lastAlpha) {
            ctx.globalAlpha = p.alpha;
            lastAlpha = p.alpha;
        }
        
        if (p.type === ParticleTypes.SPARKS) {
            if (p.color !== lastColor || p.type !== lastType) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                lastColor = p.color;
                lastType = p.type;
            }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
            ctx.stroke();
        } else {
            if (p.color !== lastColor || p.type !== lastType) {
                ctx.fillStyle = p.color;
                lastColor = p.color;
                lastType = p.type;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Clear all particles
function clearParticles() {
    for (const p of activeParticles) {
        releaseParticle(p);
    }
}

// Get active particle count
function getActiveParticleCount() {
    return activeParticles.length;
}

// Export
window.ParticleSystem = {
    init: initParticleSystem,
    createDust: createDustParticles,
    createSparks: createSparkParticles,
    createTrail: createTrailParticle,
    createBurst: createBurstParticles,
    createSmoke: createSmokeParticles,
    update: updateParticles,
    draw: drawParticles,
    clear: clearParticles,
    getCount: getActiveParticleCount,
    Types: ParticleTypes
};

