// ==================== BOSS AI SYSTEM ====================
// Finite State Machine-based boss AI with patterns, telegraphed attacks, and difficulty scaling

const BossAI = {
    // Configuration
    config: {
        enabled: true,
        debugMode: false,
        defaultDifficulty: 1.0,
        minDifficulty: 0.5,
        maxDifficulty: 3.0
    },
    
    // State
    activeBosses: new Map(),
    bossTemplates: new Map(),
    patternLibrary: new Map(),
    
    // Initialize
    init: function() {
        this.loadBossTemplates();
        this.loadPatternLibrary();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('BossAI', this);
        }
        
        window.BossAI = this;
    },
    
    // Load boss templates
    loadBossTemplates: function() {
        // Default boss templates
        this.bossTemplates.set('basic', {
            name: 'Basic Boss',
            health: 100,
            speed: 1.0,
            size: 3,
            color: '#ff0000',
            patterns: ['chase', 'dash'],
            telegraphDuration: 1000,
            attackCooldown: 2000
        });
        
        this.bossTemplates.set('aggressive', {
            name: 'Aggressive Boss',
            health: 150,
            speed: 1.5,
            size: 2,
            color: '#ff6b35',
            patterns: ['chase', 'dash', 'ambush'],
            telegraphDuration: 800,
            attackCooldown: 1500
        });
        
        this.bossTemplates.set('tactical', {
            name: 'Tactical Boss',
            health: 200,
            speed: 0.8,
            size: 4,
            color: '#8a2be2',
            patterns: ['trap', 'ambush', 'dash'],
            telegraphDuration: 1500,
            attackCooldown: 2500
        });
    },
    
    // Load pattern library
    loadPatternLibrary: function() {
        // Chase pattern
        this.patternLibrary.set('chase', {
            name: 'Chase',
            duration: 3000,
            execute: (boss, target, deltaTime) => {
                return this.executeChase(boss, target, deltaTime);
            },
            telegraph: (boss, target) => {
                return this.telegraphChase(boss, target);
            }
        });
        
        // Dash pattern
        this.patternLibrary.set('dash', {
            name: 'Dash',
            duration: 1000,
            execute: (boss, target, deltaTime) => {
                return this.executeDash(boss, target, deltaTime);
            },
            telegraph: (boss, target) => {
                return this.telegraphDash(boss, target);
            }
        });
        
        // Ambush pattern
        this.patternLibrary.set('ambush', {
            name: 'Ambush',
            duration: 4000,
            execute: (boss, target, deltaTime) => {
                return this.executeAmbush(boss, target, deltaTime);
            },
            telegraph: (boss, target) => {
                return this.telegraphAmbush(boss, target);
            }
        });
        
        // Trap placement pattern
        this.patternLibrary.set('trap', {
            name: 'Trap',
            duration: 2000,
            execute: (boss, target, deltaTime) => {
                return this.executeTrap(boss, target, deltaTime);
            },
            telegraph: (boss, target) => {
                return this.telegraphTrap(boss, target);
            }
        });
    },
    
    // Create boss instance
    createBoss: function(templateId, x, y, difficulty = 1.0) {
        const template = this.bossTemplates.get(templateId);
        if (!template) {
            console.warn('Boss template not found:', templateId);
            return null;
        }
        
        const boss = {
            id: `boss_${Date.now()}_${Math.random()}`,
            templateId: templateId,
            name: template.name,
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            health: Math.floor(template.health * difficulty),
            maxHealth: Math.floor(template.health * difficulty),
            speed: template.speed * difficulty,
            size: template.size,
            color: template.color,
            difficulty: difficulty,
            
            // FSM state
            state: 'idle', // idle, telegraphing, attacking, cooldown
            currentPattern: null,
            patternStartTime: 0,
            patternDuration: 0,
            telegraphStartTime: 0,
            telegraphDuration: template.telegraphDuration,
            cooldownEndTime: 0,
            cooldownDuration: template.attackCooldown,
            
            // Pattern queue
            availablePatterns: [...template.patterns],
            patternHistory: [],
            
            // Hitbox/hurtbox
            hitbox: {
                x: x,
                y: y,
                radius: template.size * 0.5
            },
            hurtbox: {
                x: x,
                y: y,
                radius: template.size * 0.3
            },
            
            // Visual state
            telegraphIndicator: null,
            attackIndicator: null,
            
            // Stats
            damageDealt: 0,
            attacksPerformed: 0,
            patternsUsed: []
        };
        
        this.activeBosses.set(boss.id, boss);
        return boss;
    },
    
    // Update boss AI
    updateBoss: function(bossId, target, deltaTime) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return;
        
        const now = Date.now();
        
        // Update FSM
        switch (boss.state) {
            case 'idle':
                this.updateIdle(boss, target, now);
                break;
            case 'telegraphing':
                this.updateTelegraphing(boss, target, now, deltaTime);
                break;
            case 'attacking':
                this.updateAttacking(boss, target, now, deltaTime);
                break;
            case 'cooldown':
                this.updateCooldown(boss, now);
                break;
        }
        
        // Update hitbox/hurtbox positions
        boss.hitbox.x = boss.x;
        boss.hitbox.y = boss.y;
        boss.hurtbox.x = boss.x;
        boss.hurtbox.y = boss.y;
        
        // Check collision with target
        if (this.checkCollision(boss, target)) {
            this.onBossHitTarget(boss, target);
        }
    },
    
    // Update idle state
    updateIdle: function(boss, target, now) {
        // Choose next pattern
        const patternId = this.choosePattern(boss);
        if (!patternId) return;
        
        const pattern = this.patternLibrary.get(patternId);
        if (!pattern) return;
        
        // Start telegraphing
        boss.currentPattern = patternId;
        boss.state = 'telegraphing';
        boss.telegraphStartTime = now;
        boss.telegraphDuration = boss.telegraphDuration || 1000;
        
        // Telegraph the attack
        if (pattern.telegraph) {
            pattern.telegraph(boss, target);
        }
    },
    
    // Update telegraphing state
    updateTelegraphing: function(boss, target, now, deltaTime) {
        const elapsed = now - boss.telegraphStartTime;
        
        if (elapsed >= boss.telegraphDuration) {
            // Start attacking
            boss.state = 'attacking';
            boss.patternStartTime = now;
            const pattern = this.patternLibrary.get(boss.currentPattern);
            boss.patternDuration = pattern.duration;
            
            // Clear telegraph indicator
            boss.telegraphIndicator = null;
        } else {
            // Update telegraph visual
            const progress = elapsed / boss.telegraphDuration;
            this.updateTelegraphVisual(boss, target, progress);
        }
    },
    
    // Update attacking state
    updateAttacking: function(boss, target, now, deltaTime) {
        const elapsed = now - boss.patternStartTime;
        const pattern = this.patternLibrary.get(boss.currentPattern);
        
        if (!pattern) {
            boss.state = 'cooldown';
            boss.cooldownEndTime = now + boss.cooldownDuration;
            return;
        }
        
        if (elapsed >= boss.patternDuration) {
            // Pattern complete, enter cooldown
            boss.state = 'cooldown';
            boss.cooldownEndTime = now + boss.cooldownDuration;
            boss.attacksPerformed++;
            boss.patternHistory.push(boss.currentPattern);
            boss.currentPattern = null;
            boss.attackIndicator = null;
        } else {
            // Execute pattern
            if (pattern.execute) {
                const result = pattern.execute(boss, target, deltaTime);
                if (result && result.complete) {
                    boss.state = 'cooldown';
                    boss.cooldownEndTime = now + boss.cooldownDuration;
                }
            }
        }
    },
    
    // Update cooldown state
    updateCooldown: function(boss, now) {
        if (now >= boss.cooldownEndTime) {
            boss.state = 'idle';
        }
    },
    
    // Choose pattern (deterministic if seed provided)
    choosePattern: function(boss) {
        if (boss.availablePatterns.length === 0) return null;
        
        // Simple selection: avoid repeating same pattern too often
        const recentPatterns = boss.patternHistory.slice(-3);
        const available = boss.availablePatterns.filter(p => !recentPatterns.includes(p));
        const patternsToChoose = available.length > 0 ? available : boss.availablePatterns;
        
        // Use seeded RNG if available for deterministic behavior
        let randomIndex;
        if (window.SyncSafeEngine && window.SyncSafeEngine.getSeededRandom) {
            randomIndex = Math.floor(window.SyncSafeEngine.getSeededRandom() * patternsToChoose.length);
        } else {
            randomIndex = Math.floor(Math.random() * patternsToChoose.length);
        }
        
        return patternsToChoose[randomIndex];
    },
    
    // Execute chase pattern
    executeChase: function(boss, target, deltaTime) {
        const dx = target.x - boss.x;
        const dy = target.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
            const speed = boss.speed * (deltaTime / 16.67); // Normalize to 60fps
            boss.x += (dx / distance) * speed;
            boss.y += (dy / distance) * speed;
        }
        
        return { complete: false };
    },
    
    // Telegraph chase
    telegraphChase: function(boss, target) {
        boss.telegraphIndicator = {
            type: 'arrow',
            from: { x: boss.x, y: boss.y },
            to: { x: target.x, y: target.y },
            color: '#ff0000',
            opacity: 0.5
        };
    },
    
    // Execute dash pattern
    executeDash: function(boss, target, deltaTime) {
        if (!boss.dashTarget) {
            // Calculate dash target (predict player position)
            const dx = target.x - boss.x;
            const dy = target.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dashDistance = Math.min(distance * 1.5, 10);
            
            boss.dashTarget = {
                x: boss.x + (dx / distance) * dashDistance,
                y: boss.y + (dy / distance) * dashDistance
            };
            boss.dashStartX = boss.x;
            boss.dashStartY = boss.y;
        }
        
        // Move towards dash target
        const dx = boss.dashTarget.x - boss.x;
        const dy = boss.dashTarget.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dashSpeed = boss.speed * 3 * (deltaTime / 16.67);
        
        if (distance > 0.1) {
            boss.x += (dx / distance) * dashSpeed;
            boss.y += (dy / distance) * dashSpeed;
        } else {
            boss.x = boss.dashTarget.x;
            boss.y = boss.dashTarget.y;
            boss.dashTarget = null;
            return { complete: true };
        }
        
        return { complete: false };
    },
    
    // Telegraph dash
    telegraphDash: function(boss, target) {
        const dx = target.x - boss.x;
        const dy = target.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dashDistance = Math.min(distance * 1.5, 10);
        
        boss.telegraphIndicator = {
            type: 'line',
            from: { x: boss.x, y: boss.y },
            to: {
                x: boss.x + (dx / distance) * dashDistance,
                y: boss.y + (dy / distance) * dashDistance
            },
            color: '#ff6b35',
            opacity: 0.7,
            width: 3
        };
    },
    
    // Execute ambush pattern
    executeAmbush: function(boss, target, deltaTime) {
        if (!boss.ambushStarted) {
            // Move to ambush position (behind or to side of target)
            const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
            const ambushAngle = angle + Math.PI + (Math.random() - 0.5) * Math.PI / 2;
            const ambushDistance = 8;
            
            boss.ambushTarget = {
                x: target.x + Math.cos(ambushAngle) * ambushDistance,
                y: target.y + Math.sin(ambushAngle) * ambushDistance
            };
            boss.ambushStarted = true;
        }
        
        // Move to ambush position
        const dx = boss.ambushTarget.x - boss.x;
        const dy = boss.ambushTarget.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = boss.speed * 1.5 * (deltaTime / 16.67);
        
        if (distance > 0.5) {
            boss.x += (dx / distance) * speed;
            boss.y += (dy / distance) * speed;
        } else {
            boss.ambushStarted = false;
            return { complete: true };
        }
        
        return { complete: false };
    },
    
    // Telegraph ambush
    telegraphAmbush: function(boss, target) {
        boss.telegraphIndicator = {
            type: 'circle',
            center: { x: boss.x, y: boss.y },
            radius: boss.size * 1.5,
            color: '#8a2be2',
            opacity: 0.4
        };
    },
    
    // Execute trap pattern
    executeTrap: function(boss, target, deltaTime) {
        if (!boss.trapPlaced) {
            // Place trap near target
            const trapX = Math.floor(target.x);
            const trapY = Math.floor(target.y);
            
            // Create trap (hazard tile)
            if (window.GlobalModifiers && window.GlobalModifiers.spawnHazardTile) {
                window.GlobalModifiers.spawnHazardTile(trapX, trapY, 5000); // 5 second duration
            }
            
            boss.trapPlaced = true;
            return { complete: true };
        }
        
        return { complete: false };
    },
    
    // Telegraph trap
    telegraphTrap: function(boss, target) {
        boss.telegraphIndicator = {
            type: 'marker',
            position: { x: Math.floor(target.x), y: Math.floor(target.y) },
            color: '#ff00ff',
            opacity: 0.6,
            pulse: true
        };
    },
    
    // Update telegraph visual
    updateTelegraphVisual: function(boss, target, progress) {
        if (!boss.telegraphIndicator) return;
        
        // Update opacity based on progress
        boss.telegraphIndicator.opacity = 0.3 + (progress * 0.4);
    },
    
    // Check collision with target
    checkCollision: function(boss, target) {
        const dx = target.x - boss.x;
        const dy = target.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (boss.hitbox.radius + 0.5);
    },
    
    // On boss hits target
    onBossHitTarget: function(boss, target) {
        // Deal damage (if target has health system)
        if (target.takeDamage) {
            target.takeDamage(10 * boss.difficulty);
        }
        
        boss.damageDealt += 10 * boss.difficulty;
        
        // Trigger camera shake
        if (window.CameraShake) {
            window.CameraShake.trigger(5, 300, 'linear');
        }
        
        // Trigger hit feedback
        if (window.HitFeedback) {
            window.HitFeedback.trigger('damage');
        }
    },
    
    // Damage boss
    damageBoss: function(bossId, damage) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return false;
        
        boss.health -= damage;
        
        if (boss.health <= 0) {
            this.defeatBoss(bossId);
            return true; // Boss defeated
        }
        
        return false; // Boss still alive
    },
    
    // Defeat boss
    defeatBoss: function(bossId) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return;
        
        // Trigger defeat event
        if (window.EventController) {
            window.EventController.trigger('boss_defeated', {
                bossId: bossId,
                bossName: boss.name,
                difficulty: boss.difficulty
            });
        }
        
        // Remove boss
        this.activeBosses.delete(bossId);
    },
    
    // Get active boss
    getBoss: function(bossId) {
        return this.activeBosses.get(bossId);
    },
    
    // Get all active bosses
    getAllBosses: function() {
        return Array.from(this.activeBosses.values());
    },
    
    // Scale difficulty
    scaleDifficulty: function(baseDifficulty, level, mode) {
        let multiplier = 1.0;
        
        if (mode === 'endless') {
            multiplier = 1.0 + (level * 0.1);
        } else if (mode === 'story') {
            multiplier = 1.0 + (level * 0.05);
        }
        
        return Math.min(baseDifficulty * multiplier, this.config.maxDifficulty);
    },
    
    // Register custom pattern
    registerPattern: function(patternId, pattern) {
        this.patternLibrary.set(patternId, pattern);
    },
    
    // Register custom boss template
    registerBossTemplate: function(templateId, template) {
        this.bossTemplates.set(templateId, template);
    },
    
    // Enable debug mode
    enableDebug: function() {
        this.config.debugMode = true;
    },
    
    // Disable debug mode
    disableDebug: function() {
        this.config.debugMode = false;
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BossAI.init());
} else {
    BossAI.init();
}

