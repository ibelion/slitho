// ==================== BOSS ENCOUNTERS SYSTEM ====================
// Special boss levels with arenas, scripted phases, and multi-stage battles

const BossEncounters = {
    // Configuration
    config: {
        enabled: true,
        defaultArenaSize: 20,
        phaseTransitionDuration: 2000
    },
    
    // State
    activeEncounter: null,
    encounterTemplates: new Map(),
    arenaLayouts: new Map(),
    
    // Initialize
    init: function() {
        this.loadEncounterTemplates();
        this.loadArenaLayouts();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('BossEncounters', this);
        }
        
        window.BossEncounters = this;
    },
    
    // Load encounter templates
    loadEncounterTemplates: function() {
        // Basic boss encounter
        this.encounterTemplates.set('basic', {
            name: 'Basic Boss Fight',
            bossTemplate: 'basic',
            arena: 'open',
            phases: [
                {
                    name: 'Phase 1',
                    duration: 30000,
                    bossHealth: 0.5, // Boss has 50% health in this phase
                    patterns: ['chase', 'dash'],
                    fruitSpawnRate: 2000,
                    modifiers: []
                },
                {
                    name: 'Phase 2',
                    duration: 30000,
                    bossHealth: 0.3,
                    patterns: ['chase', 'dash', 'ambush'],
                    fruitSpawnRate: 1500,
                    modifiers: ['speed_boost']
                },
                {
                    name: 'Phase 3',
                    duration: 0, // Until boss defeated
                    bossHealth: 0.2,
                    patterns: ['chase', 'dash', 'ambush', 'trap'],
                    fruitSpawnRate: 1000,
                    modifiers: ['speed_boost', 'fog']
                }
            ],
            rewards: {
                coins: 100,
                experience: 50,
                items: ['power_up_shield'],
                skins: []
            }
        });
        
        // Aggressive boss encounter
        this.encounterTemplates.set('aggressive', {
            name: 'Aggressive Boss Fight',
            bossTemplate: 'aggressive',
            arena: 'walls',
            phases: [
                {
                    name: 'Phase 1',
                    duration: 25000,
                    bossHealth: 0.4,
                    patterns: ['chase', 'dash'],
                    fruitSpawnRate: 1800,
                    modifiers: []
                },
                {
                    name: 'Phase 2',
                    duration: 0,
                    bossHealth: 0.6,
                    patterns: ['chase', 'dash', 'ambush'],
                    fruitSpawnRate: 1200,
                    modifiers: ['speed_boost', 'hazard_spawn']
                }
            ],
            rewards: {
                coins: 150,
                experience: 75,
                items: ['power_up_score_multiplier'],
                skins: ['aggressive_boss_skin']
            }
        });
    },
    
    // Load arena layouts
    loadArenaLayouts: function() {
        // Open arena (no walls)
        this.arenaLayouts.set('open', {
            name: 'Open Arena',
            walls: [],
            hazards: [],
            size: 20
        });
        
        // Arena with walls
        this.arenaLayouts.set('walls', {
            name: 'Walled Arena',
            walls: [
                { x: 5, y: 5, width: 10, height: 1 },
                { x: 5, y: 14, width: 10, height: 1 },
                { x: 5, y: 5, width: 1, height: 10 },
                { x: 14, y: 5, width: 1, height: 10 }
            ],
            hazards: [],
            size: 20
        });
        
        // Arena with hazards
        this.arenaLayouts.set('hazards', {
            name: 'Hazard Arena',
            walls: [],
            hazards: [
                { x: 10, y: 10, type: 'spike' },
                { x: 5, y: 5, type: 'spike' },
                { x: 15, y: 15, type: 'spike' }
            ],
            size: 20
        });
    },
    
    // Start boss encounter
    startEncounter: function(encounterId, difficulty = 1.0, seed = null) {
        const template = this.encounterTemplates.get(encounterId);
        if (!template) {
            console.warn('Encounter template not found:', encounterId);
            return null;
        }
        
        // Initialize RNG with seed if provided
        if (seed !== null) {
            this.setSeed(seed);
        }
        
        const encounter = {
            id: `encounter_${Date.now()}`,
            templateId: encounterId,
            name: template.name,
            difficulty: difficulty,
            seed: seed,
            
            // Arena
            arena: this.createArena(template.arena),
            
            // Boss
            boss: null,
            bossId: null,
            
            // Phases
            currentPhase: 0,
            phases: template.phases.map((phase, index) => ({
                ...phase,
                index: index,
                startTime: 0,
                endTime: 0,
                active: false,
                completed: false
            })),
            
            // State
            state: 'setup', // setup, fighting, phase_transition, victory, defeat
            startTime: Date.now(),
            lastFruitSpawn: 0,
            
            // Rewards
            rewards: template.rewards,
            rewardsGiven: false,
            
            // Stats
            damageTaken: 0,
            fruitEaten: 0,
            timeElapsed: 0
        };
        
        this.activeEncounter = encounter;
        
        // Setup arena
        this.setupArena(encounter.arena);
        
        // Start first phase
        this.startPhase(encounter, 0);
        
        return encounter;
    },
    
    // Create arena
    createArena: function(arenaId) {
        const layout = this.arenaLayouts.get(arenaId);
        if (!layout) {
            console.warn('Arena layout not found:', arenaId);
            return this.arenaLayouts.get('open');
        }
        
        return {
            id: arenaId,
            ...layout,
            walls: [...layout.walls],
            hazards: [...layout.hazards]
        };
    },
    
    // Setup arena
    setupArena: function(arena) {
        // Spawn walls
        if (window.StateManager) {
            const terrainTiles = [];
            arena.walls.forEach(wall => {
                for (let x = wall.x; x < wall.x + wall.width; x++) {
                    for (let y = wall.y; y < wall.y + wall.height; y++) {
                        terrainTiles.push({ x, y, type: 'WALL' });
                    }
                }
            });
            window.StateManager.setTerrainTiles(terrainTiles);
        }
        
        // Spawn hazards
        if (window.GlobalModifiers) {
            arena.hazards.forEach(hazard => {
                if (window.GlobalModifiers.spawnHazardTile) {
                    window.GlobalModifiers.spawnHazardTile(hazard.x, hazard.y, -1); // Permanent
                }
            });
        }
    },
    
    // Start phase
    startPhase: function(encounter, phaseIndex) {
        const phase = encounter.phases[phaseIndex];
        if (!phase) return;
        
        phase.active = true;
        phase.startTime = Date.now();
        if (phase.duration > 0) {
            phase.endTime = phase.startTime + phase.duration;
        }
        
        encounter.currentPhase = phaseIndex;
        encounter.state = 'fighting';
        
        // Spawn or update boss
        if (!encounter.boss) {
            // Create boss
            const bossX = encounter.arena.size / 2;
            const bossY = encounter.arena.size / 2;
            const bossDifficulty = encounter.difficulty * (1 - phase.bossHealth);
            
            encounter.bossId = window.BossAI.createBoss(
                encounter.templateId === 'aggressive' ? 'aggressive' : 'basic',
                bossX,
                bossY,
                bossDifficulty
            )?.id;
            
            if (encounter.bossId) {
                encounter.boss = window.BossAI.getBoss(encounter.bossId);
            }
        } else {
            // Update boss health for phase
            const targetHealth = Math.floor(encounter.boss.maxHealth * phase.bossHealth);
            encounter.boss.health = Math.max(encounter.boss.health, targetHealth);
        }
        
        // Apply modifiers
        phase.modifiers.forEach(modifier => {
            this.applyModifier(modifier);
        });
        
        // Trigger phase start event
        if (window.EventController) {
            window.EventController.trigger('boss_phase_start', {
                encounterId: encounter.id,
                phaseIndex: phaseIndex,
                phaseName: phase.name
            });
        }
    },
    
    // Update encounter
    updateEncounter: function(deltaTime) {
        if (!this.activeEncounter) return;
        
        const encounter = this.activeEncounter;
        const now = Date.now();
        encounter.timeElapsed = now - encounter.startTime;
        
        if (encounter.state === 'fighting') {
            this.updateFightingPhase(encounter, now, deltaTime);
        } else if (encounter.state === 'phase_transition') {
            this.updatePhaseTransition(encounter, now);
        }
    },
    
    // Update fighting phase
    updateFightingPhase: function(encounter, now, deltaTime) {
        const phase = encounter.phases[encounter.currentPhase];
        if (!phase) return;
        
        // Check phase duration
        if (phase.duration > 0 && now >= phase.endTime) {
            this.completePhase(encounter, encounter.currentPhase);
            return;
        }
        
        // Update boss
        if (encounter.bossId && encounter.boss) {
            const target = this.getPlayerPosition();
            if (target) {
                window.BossAI.updateBoss(encounter.bossId, target, deltaTime);
            }
            
            // Check if boss defeated
            if (encounter.boss.health <= 0) {
                this.defeatBoss(encounter);
                return;
            }
        }
        
        // Spawn fruit
        if (now - encounter.lastFruitSpawn >= phase.fruitSpawnRate) {
            this.spawnBossFruit(encounter);
            encounter.lastFruitSpawn = now;
        }
        
        // Check player death
        if (this.isPlayerDead()) {
            this.playerDefeated(encounter);
            return;
        }
    },
    
    // Complete phase
    completePhase: function(encounter, phaseIndex) {
        const phase = encounter.phases[phaseIndex];
        if (!phase) return;
        
        phase.active = false;
        phase.completed = true;
        
        // Check if more phases
        if (phaseIndex < encounter.phases.length - 1) {
            // Transition to next phase
            encounter.state = 'phase_transition';
            encounter.transitionStartTime = Date.now();
            
            // Trigger phase transition event
            if (window.EventController) {
                window.EventController.trigger('boss_phase_transition', {
                    encounterId: encounter.id,
                    fromPhase: phaseIndex,
                    toPhase: phaseIndex + 1
                });
            }
        } else {
            // All phases complete, boss should be defeated
            if (encounter.boss && encounter.boss.health > 0) {
                // Force defeat if health is very low
                if (encounter.boss.health <= encounter.boss.maxHealth * 0.1) {
                    this.defeatBoss(encounter);
                }
            }
        }
    },
    
    // Update phase transition
    updatePhaseTransition: function(encounter, now) {
        const elapsed = now - encounter.transitionStartTime;
        
        if (elapsed >= this.config.phaseTransitionDuration) {
            // Start next phase
            this.startPhase(encounter, encounter.currentPhase + 1);
        }
    },
    
    // Defeat boss
    defeatBoss: function(encounter) {
        encounter.state = 'victory';
        
        // Give rewards
        if (!encounter.rewardsGiven) {
            this.giveRewards(encounter);
            encounter.rewardsGiven = true;
        }
        
        // Trigger victory event
        if (window.EventController) {
            window.EventController.trigger('boss_defeated', {
                encounterId: encounter.id,
                bossName: encounter.boss?.name,
                timeElapsed: encounter.timeElapsed,
                damageTaken: encounter.damageTaken,
                fruitEaten: encounter.fruitEaten
            });
        }
        
        // Cleanup
        if (encounter.bossId) {
            window.BossAI.defeatBoss(encounter.bossId);
        }
    },
    
    // Player defeated
    playerDefeated: function(encounter) {
        encounter.state = 'defeat';
        
        // Trigger defeat event
        if (window.EventController) {
            window.EventController.trigger('boss_player_defeated', {
                encounterId: encounter.id,
                phase: encounter.currentPhase,
                timeElapsed: encounter.timeElapsed
            });
        }
    },
    
    // Spawn boss fruit
    spawnBossFruit: function(encounter) {
        if (!window.StateManager) return;
        
        const arena = encounter.arena;
        const snake = window.StateManager.getSnake();
        if (!snake || snake.length === 0) return;
        
        // Find safe position (not on snake, not on walls) - deterministic if seed provided
        let attempts = 0;
        let x, y;
        const useSeededRNG = encounter.seed !== null && window.SyncSafeEngine && window.SyncSafeEngine.getSeededRandom;
        
        do {
            if (useSeededRNG) {
                x = Math.floor(window.SyncSafeEngine.getSeededRandom() * arena.size);
                y = Math.floor(window.SyncSafeEngine.getSeededRandom() * arena.size);
            } else {
                x = Math.floor(Math.random() * arena.size);
                y = Math.floor(Math.random() * arena.size);
            }
            attempts++;
        } while (
            attempts < 50 &&
            (this.isPositionOnSnake(x, y, snake) || this.isPositionOnWall(x, y, arena))
        );
        
        if (attempts < 50) {
            window.StateManager.setFood({ x, y });
        }
    },
    
    // Check if position is on snake
    isPositionOnSnake: function(x, y, snake) {
        return snake.some(segment => segment.x === x && segment.y === y);
    },
    
    // Check if position is on wall
    isPositionOnWall: function(x, y, arena) {
        return arena.walls.some(wall =>
            x >= wall.x && x < wall.x + wall.width &&
            y >= wall.y && y < wall.y + wall.height
        );
    },
    
    // Get player position
    getPlayerPosition: function() {
        if (!window.StateManager) return null;
        
        const snake = window.StateManager.getSnake();
        if (!snake || snake.length === 0) return null;
        
        return {
            x: snake[0].x,
            y: snake[0].y
        };
    },
    
    // Check if player is dead
    isPlayerDead: function() {
        if (!window.StateManager) return false;
        return !window.StateManager.getGameRunning();
    },
    
    // Apply modifier
    applyModifier: function(modifierId) {
        if (window.GlobalModifiers) {
            switch (modifierId) {
                case 'speed_boost':
                    // Increase game speed
                    break;
                case 'fog':
                    window.GlobalModifiers.enableFog();
                    break;
                case 'hazard_spawn':
                    // Spawn periodic hazards
                    break;
            }
        }
    },
    
    // Give rewards
    giveRewards: function(encounter) {
        const rewards = encounter.rewards;
        
        // Give coins
        if (rewards.coins && window.MetaProgression) {
            window.MetaProgression.addCoins(rewards.coins);
        }
        
        // Give experience
        if (rewards.experience && window.MetaProgression) {
            window.MetaProgression.addExperience(rewards.experience);
        }
        
        // Give items
        if (rewards.items && window.Inventory) {
            rewards.items.forEach(itemId => {
                // Add item to inventory
            });
        }
        
        // Unlock skins
        if (rewards.skins && window.CosmeticSystem) {
            rewards.skins.forEach(skinId => {
                window.CosmeticSystem.unlockSkin(skinId);
            });
        }
    },
    
    // Set seed for deterministic generation
    setSeed: function(seed) {
        // Simple seeded RNG
        this.rngSeed = seed;
        this.rngState = seed;
    },
    
    // Seeded random
    seededRandom: function() {
        if (this.rngState === undefined) {
            this.rngState = Date.now();
        }
        this.rngState = (this.rngState * 9301 + 49297) % 233280;
        return this.rngState / 233280;
    },
    
    // Get active encounter
    getActiveEncounter: function() {
        return this.activeEncounter;
    },
    
    // End encounter
    endEncounter: function() {
        if (this.activeEncounter && this.activeEncounter.bossId) {
            window.BossAI.defeatBoss(this.activeEncounter.bossId);
        }
        this.activeEncounter = null;
    },
    
    // Register custom encounter
    registerEncounter: function(encounterId, template) {
        this.encounterTemplates.set(encounterId, template);
    },
    
    // Register custom arena
    registerArena: function(arenaId, layout) {
        this.arenaLayouts.set(arenaId, layout);
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BossEncounters.init());
} else {
    BossEncounters.init();
}

