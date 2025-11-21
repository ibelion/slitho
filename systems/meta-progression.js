// ==================== META-PROGRESSION SYSTEM ====================
// Extended progression with skill trees, evolutions, difficulty tiers, mastery

const MetaProgression = {
    // Skill tree branches
    skillBranches: new Map(),
    
    // Evolutions
    evolutions: new Map(),
    currentEvolution: null,
    evolutionStage: 0,
    
    // Difficulty tiers
    difficultyTiers: [],
    unlockedTiers: ['normal'],
    currentTier: 'normal',
    
    // Mastery stats
    mastery: {
        levels: {}, // levelId -> mastery data
        worlds: {}, // worldId -> mastery data
        skills: {}, // skillId -> mastery data
        overall: {
            totalPlayTime: 0,
            totalFoodEaten: 0,
            totalDeaths: 0,
            bestStreak: 0
        }
    },
    
    // S-rank rewards
    sRankRewards: {
        skillPoints: 1.0,
        coins: 50,
        masteryXP: 100
    },
    
    // Initialize
    init: function() {
        this.loadSkillBranches();
        this.loadEvolutions();
        this.loadDifficultyTiers();
        this.loadMastery();
    },
    
    // Load skill branches
    loadSkillBranches: function() {
        // Default branches
        this.registerSkillBranch({
            id: 'combat',
            name: 'Combat',
            description: 'Combat-focused skills',
            skills: []
        });
        
        this.registerSkillBranch({
            id: 'survival',
            name: 'Survival',
            description: 'Survival-focused skills',
            skills: []
        });
        
        this.registerSkillBranch({
            id: 'speed',
            name: 'Speed',
            description: 'Speed-focused skills',
            skills: []
        });
    },
    
    // Register skill branch
    registerSkillBranch: function(branch) {
        if (!branch.id) {
            console.error('Skill branch missing id:', branch);
            return;
        }
        this.skillBranches.set(branch.id, branch);
    },
    
    // Load evolutions
    loadEvolutions: function() {
        // Multi-stage evolutions
        this.registerEvolution({
            id: 'snake_evolution',
            name: 'Snake Evolution',
            stages: [
                { stage: 0, name: 'Basic Snake', appearance: 'default' },
                { stage: 1, name: 'Advanced Snake', appearance: 'advanced', requirement: { foodEaten: 100 } },
                { stage: 2, name: 'Elite Snake', appearance: 'elite', requirement: { foodEaten: 500 } },
                { stage: 3, name: 'Master Snake', appearance: 'master', requirement: { foodEaten: 1000 } },
                { stage: 4, name: 'Legendary Snake', appearance: 'legendary', requirement: { foodEaten: 5000 } }
            ]
        });
    },
    
    // Register evolution
    registerEvolution: function(evolution) {
        if (!evolution.id) {
            console.error('Evolution missing id:', evolution);
            return;
        }
        this.evolutions.set(evolution.id, evolution);
    },
    
    // Load difficulty tiers
    loadDifficultyTiers: function() {
        this.difficultyTiers = [
            { id: 'normal', name: 'Normal', unlocked: true, multiplier: 1.0 },
            { id: 'hard', name: 'Hard', unlocked: false, multiplier: 1.5, requirement: { levelsCompleted: 10 } },
            { id: 'expert', name: 'Expert', unlocked: false, multiplier: 2.0, requirement: { levelsCompleted: 20 } },
            { id: 'master', name: 'Master', unlocked: false, multiplier: 3.0, requirement: { sRanks: 10 } },
            { id: 'legend', name: 'Legend', unlocked: false, multiplier: 5.0, requirement: { sRanks: 20 } }
        ];
    },
    
    // Load mastery
    loadMastery: function() {
        const saved = localStorage.getItem('metaProgressionMastery');
        if (saved) {
            try {
                this.mastery = { ...this.mastery, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load mastery data:', e);
            }
        }
    },
    
    // Save mastery
    saveMastery: function() {
        localStorage.setItem('metaProgressionMastery', JSON.stringify(this.mastery));
    },
    
    // Update mastery for level
    updateLevelMastery: function(levelId, data) {
        if (!this.mastery.levels[levelId]) {
            this.mastery.levels[levelId] = {
                completions: 0,
                bestTime: null,
                bestRank: null,
                totalTime: 0
            };
        }
        
        const mastery = this.mastery.levels[levelId];
        mastery.completions++;
        
        if (data.time && (!mastery.bestTime || data.time < mastery.bestTime)) {
            mastery.bestTime = data.time;
        }
        
        if (data.rank && (!mastery.bestRank || this.rankValue(data.rank) > this.rankValue(mastery.bestRank))) {
            mastery.bestRank = data.rank;
        }
        
        if (data.time) {
            mastery.totalTime += data.time;
        }
        
        this.saveMastery();
    },
    
    // Rank value (for comparison)
    rankValue: function(rank) {
        const ranks = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        return ranks[rank] || 0;
    },
    
    // Update overall mastery
    updateOverallMastery: function(data) {
        if (data.playTime) {
            this.mastery.overall.totalPlayTime += data.playTime;
        }
        if (data.foodEaten) {
            this.mastery.overall.totalFoodEaten += data.foodEaten;
        }
        if (data.death) {
            this.mastery.overall.totalDeaths++;
        }
        if (data.streak && data.streak > this.mastery.overall.bestStreak) {
            this.mastery.overall.bestStreak = data.streak;
        }
        
        this.saveMastery();
    },
    
    // Check evolution progress
    checkEvolutionProgress: function() {
        const evolution = this.evolutions.get('snake_evolution');
        if (!evolution) return;
        
        for (let i = evolution.stages.length - 1; i >= 0; i--) {
            const stage = evolution.stages[i];
            if (this.meetsEvolutionRequirement(stage.requirement)) {
                if (i > this.evolutionStage) {
                    this.evolutionStage = i;
                    this.currentEvolution = evolution.id;
                    this.onEvolutionUpgrade(i);
                }
                break;
            }
        }
    },
    
    // Check if requirement is met
    meetsEvolutionRequirement: function(requirement) {
        if (!requirement) return true;
        
        if (requirement.foodEaten) {
            return this.mastery.overall.totalFoodEaten >= requirement.foodEaten;
        }
        
        if (requirement.levelsCompleted) {
            const completed = Object.keys(this.mastery.levels).length;
            return completed >= requirement.levelsCompleted;
        }
        
        return false;
    },
    
    // On evolution upgrade
    onEvolutionUpgrade: function(stage) {
        const evolution = this.evolutions.get(this.currentEvolution);
        if (!evolution) return;
        
        const stageData = evolution.stages[stage];
        console.log(`Evolution upgraded to: ${stageData.name}`);
        
        // Apply evolution benefits
        if (window.SkinManager) {
            window.SkinManager.unlockEvolutionSkin(stageData.appearance);
        }
    },
    
    // Unlock difficulty tier
    unlockDifficultyTier: function(tierId) {
        if (this.unlockedTiers.includes(tierId)) {
            return true;
        }
        
        const tier = this.difficultyTiers.find(t => t.id === tierId);
        if (!tier) {
            return false;
        }
        
        if (tier.requirement && !this.meetsDifficultyRequirement(tier.requirement)) {
            return false;
        }
        
        this.unlockedTiers.push(tierId);
        this.saveDifficultyTiers();
        return true;
    },
    
    // Check difficulty requirement
    meetsDifficultyRequirement: function(requirement) {
        if (requirement.levelsCompleted) {
            const completed = Object.keys(this.mastery.levels).length;
            return completed >= requirement.levelsCompleted;
        }
        
        if (requirement.sRanks) {
            const sRanks = Object.values(this.mastery.levels).filter(
                m => m.bestRank === 'S'
            ).length;
            return sRanks >= requirement.sRanks;
        }
        
        return false;
    },
    
    // Save difficulty tiers
    saveDifficultyTiers: function() {
        localStorage.setItem('unlockedDifficultyTiers', JSON.stringify(this.unlockedTiers));
    },
    
    // Get mastery for level
    getLevelMastery: function(levelId) {
        return this.mastery.levels[levelId] || null;
    },
    
    // Get overall mastery
    getOverallMastery: function() {
        return this.mastery.overall;
    },
    
    // Get current evolution
    getCurrentEvolution: function() {
        return {
            id: this.currentEvolution,
            stage: this.evolutionStage,
            data: this.evolutions.get(this.currentEvolution)
        };
    },
    
    // Get unlocked difficulty tiers
    getUnlockedTiers: function() {
        return [...this.unlockedTiers];
    }
};

// Export
window.MetaProgression = MetaProgression;

