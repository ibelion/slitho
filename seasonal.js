// ==================== SEASONAL EVENTS SYSTEM ====================
// Auto-detects season based on system date and applies themes

let currentSeason = 'default';
let seasonalEffects = {
    particles: [],
    active: false
};

// Detect current season based on date
function detectSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    
    // Halloween: October
    if (month === 10) {
        return 'halloween';
    }
    
    // Winter: December, January, February
    if (month === 12 || month === 1 || month === 2) {
        return 'winter';
    }
    
    // Spring: March, April, May
    if (month === 3 || month === 4 || month === 5) {
        return 'spring';
    }
    
    // Summer: June, July, August
    if (month === 6 || month === 7 || month === 8) {
        return 'summer';
    }
    
    // Fall (default for September, November)
    return 'default';
}

// Apply seasonal theme
function applySeasonalTheme(season) {
    currentSeason = season;
    const body = document.body;
    
    // Remove existing season classes
    body.classList.remove('season-winter', 'season-halloween', 'season-spring', 'season-summer');
    
    // Apply new season class
    body.classList.add(`season-${season}`);
    
    // Update CSS variables based on season
    const root = document.documentElement;
    
    switch (season) {
        case 'winter':
            root.style.setProperty('--season-bg', '#e3f2fd');
            root.style.setProperty('--season-primary', '#2196f3');
            root.style.setProperty('--season-accent', '#64b5f6');
            root.style.setProperty('--season-particles', '#ffffff');
            break;
            
        case 'halloween':
            root.style.setProperty('--season-bg', '#1a1a1a');
            root.style.setProperty('--season-primary', '#ff6b35');
            root.style.setProperty('--season-accent', '#ff8c42');
            root.style.setProperty('--season-particles', '#ff6b35');
            break;
            
        case 'spring':
            root.style.setProperty('--season-bg', '#f3e5f5');
            root.style.setProperty('--season-primary', '#e91e63');
            root.style.setProperty('--season-accent', '#f48fb1');
            root.style.setProperty('--season-particles', '#e91e63');
            break;
            
        case 'summer':
            root.style.setProperty('--season-bg', '#fff3e0');
            root.style.setProperty('--season-primary', '#ff9800');
            root.style.setProperty('--season-accent', '#ffb74d');
            root.style.setProperty('--season-particles', '#ffeb3b');
            break;
            
        default:
            root.style.setProperty('--season-bg', '');
            root.style.setProperty('--season-primary', '');
            root.style.setProperty('--season-accent', '');
            root.style.setProperty('--season-particles', '');
    }
    
    // Initialize seasonal effects
    initSeasonalEffects(season);
}

// Initialize seasonal particle effects
function initSeasonalEffects(season) {
    seasonalEffects.active = true;
    seasonalEffects.particles = [];
    
    switch (season) {
        case 'winter':
            startSnowEffect();
            break;
        case 'halloween':
            startFogEffect();
            break;
        case 'spring':
            startButterflyEffect();
            break;
        case 'summer':
            startSunshineEffect();
            break;
    }
}

// Snow particles for winter
function startSnowEffect() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create snowflakes
    for (let i = 0; i < 50; i++) {
        seasonalEffects.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
    
    function animateSnow() {
        if (!seasonalEffects.active || currentSeason !== 'winter') return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        seasonalEffects.particles.forEach(flake => {
            flake.y += flake.speed;
            flake.x += Math.sin(flake.y * 0.01) * 0.5;
            
            if (flake.y > canvas.height) {
                flake.y = 0;
                flake.x = Math.random() * canvas.width;
            }
            
            ctx.save();
            ctx.globalAlpha = flake.opacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        requestAnimationFrame(animateSnow);
    }
    
    animateSnow();
}

// Fog effect for Halloween
function startFogEffect() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < 20; i++) {
        seasonalEffects.particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            size: Math.random() * 100 + 50,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
    
    function animateFog() {
        if (!seasonalEffects.active || currentSeason !== 'halloween') return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        seasonalEffects.particles.forEach(fog => {
            fog.y -= fog.speed;
            fog.x += Math.sin(fog.y * 0.01) * 0.3;
            
            if (fog.y < -fog.size) {
                fog.y = canvas.height + fog.size;
                fog.x = Math.random() * canvas.width;
            }
            
            ctx.save();
            ctx.globalAlpha = fog.opacity;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(fog.x, fog.y, fog.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        requestAnimationFrame(animateFog);
    }
    
    animateFog();
}

// Butterfly effect for spring
function startButterflyEffect() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < 10; i++) {
        seasonalEffects.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 5 + 3,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
    
    function animateButterflies() {
        if (!seasonalEffects.active || currentSeason !== 'spring') return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        seasonalEffects.particles.forEach(butterfly => {
            butterfly.x += butterfly.speedX;
            butterfly.y += butterfly.speedY + Math.sin(butterfly.x * 0.01) * 0.5;
            
            if (butterfly.x < 0 || butterfly.x > canvas.width) butterfly.speedX *= -1;
            if (butterfly.y < 0 || butterfly.y > canvas.height) butterfly.speedY *= -1;
            
            ctx.save();
            ctx.globalAlpha = butterfly.opacity;
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.arc(butterfly.x, butterfly.y, butterfly.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        requestAnimationFrame(animateButterflies);
    }
    
    animateButterflies();
}

// Sunshine effect for summer
function startSunshineEffect() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < 30; i++) {
        seasonalEffects.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.3 + 0.2
        });
    }
    
    function animateSunshine() {
        if (!seasonalEffects.active || currentSeason !== 'summer') return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        seasonalEffects.particles.forEach(ray => {
            ray.y -= ray.speed;
            ray.x += Math.sin(ray.y * 0.02) * 0.5;
            
            if (ray.y < 0) {
                ray.y = canvas.height;
                ray.x = Math.random() * canvas.width;
            }
            
            ctx.save();
            ctx.globalAlpha = ray.opacity;
            ctx.fillStyle = '#ffeb3b';
            ctx.fillRect(ray.x, ray.y, ray.size, ray.size * 3);
            ctx.restore();
        });
        
        requestAnimationFrame(animateSunshine);
    }
    
    animateSunshine();
}

// Get seasonal food skin
function getSeasonalFoodSkin() {
    switch (currentSeason) {
        case 'winter':
            return { color: '#e3f2fd', icon: '❄️' };
        case 'halloween':
            return { color: '#ff6b35', icon: '🎃' };
        case 'spring':
            return { color: '#e91e63', icon: '🌸' };
        case 'summer':
            return { color: '#ff9800', icon: '☀️' };
        default:
            return { color: '#FF0000', icon: '🍎' };
    }
}

// Initialize seasonal system
function initSeasonalSystem() {
    const season = detectSeason();
    applySeasonalTheme(season);
}

// Export
window.initSeasonalSystem = initSeasonalSystem;
window.getSeasonalFoodSkin = getSeasonalFoodSkin;
window.currentSeason = () => currentSeason;

