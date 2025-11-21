// ==================== STORY PROGRESSION SYSTEM ====================
// Manages story progression, chapter goals, boss gates, character upgrades, and lore

const StoryProgression = {
    // Configuration
    config: {
        enabled: true,
        autoSave: true
    },
    
    // State
    progressionData: null,
    characterUpgrades: new Map(),
    loreDatabase: new Map(),
    endings: new Map(),
    
    // Initialize
    init: function() {
        this.loadCharacterUpgrades();
        this.loadLoreDatabase();
        this.loadEndings();
        this.loadProgression();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('StoryProgression', this);
        }
        
        window.StoryProgression = this;
    },
    
    // Load character upgrades
    loadCharacterUpgrades: function() {
        // Speed upgrade
        this.characterUpgrades.set('speed', {
            id: 'speed',
            name: 'Speed Boost',
            description: 'Increases snake movement speed',
            cost: 100,
            maxLevel: 5,
            effect: (level) => 1.0 + (level * 0.1)
        });
        
        // Health upgrade
        this.characterUpgrades.set('health', {
            id: 'health',
            name: 'Health Boost',
            description: 'Increases maximum health',
            cost: 150,
            maxLevel: 3,
            effect: (level) => 100 + (level * 50)
        });
        
        // Damage upgrade
        this.characterUpgrades.set('damage', {
            id: 'damage',
            name: 'Damage Boost',
            description: 'Increases damage dealt',
            cost: 200,
            maxLevel: 5,
            effect: (level) => 1.0 + (level * 0.15)
        });
    },
    
    // Load lore database
    loadLoreDatabase: function() {
        this.loreDatabase.set('chapter1_intro', {
            id: 'chapter1_intro',
            chapter: 1,
            title: 'The Beginning',
            text: 'Long ago, in a world of endless grids, a snake was born. Its purpose was simple: grow, survive, and discover the truth behind the ancient patterns.',
            category: 'story',
            unlocked: true
        });
        
        this.loreDatabase.set('boss1_lore', {
            id: 'boss1_lore',
            chapter: 1,
            title: 'The First Guardian',
            text: 'The guardian of the first gate watches over the ancient path. Defeat it to unlock the secrets of the next realm.',
            category: 'boss',
            unlocked: false
        });
        
        this.loreDatabase.set('ending_good', {
            id: 'ending_good',
            chapter: 5,
            title: 'The True Path',
            text: 'You have discovered the true purpose of the snake. The journey continues...',
            category: 'ending',
            unlocked: false
        });
    },
    
    // Load endings
    loadEndings: function() {
        this.endings.set('good', {
            id: 'good',
            name: 'The True Path',
            description: 'You completed the journey with wisdom and skill.',
            requirements: {
                chaptersCompleted: 5,
                bossesDefeated: 5,
                loreUnlocked: 10
            },
            rewards: {
                coins: 500,
                experience: 250,
                skins: ['ending_good_skin']
            }
        });
        
        this.endings.set('neutral', {
            id: 'neutral',
            name: 'The Balanced Way',
            description: 'You completed the journey with balance.',
            requirements: {
                chaptersCompleted: 5,
                bossesDefeated: 3
            },
            rewards: {
                coins: 300,
                experience: 150
            }
        });
        
        this.endings.set('bad', {
            id: 'bad',
            name: 'The Dark Path',
            description: 'You completed the journey through darkness.',
            requirements: {
                chaptersCompleted: 5
            },
            rewards: {
                coins: 200,
                experience: 100
            }
        });
    },
    
    // Load progression
    loadProgression: function() {
        if (window.RobustSaveSystem) {
            const saved = window.RobustSaveSystem.load('story_progression');
            if (saved) {
                this.progressionData = saved;
            } else {
                this.progressionData = this.createNewProgression();
            }
        } else {
            this.progressionData = this.createNewProgression();
        }
    },
    
    // Create new progression
    createNewProgression: function() {
        return {
            version: '1.0.0',
            currentChapter: 1,
            completedChapters: [],
            chapterGoals: [],
            bossGates: [],
            characterUpgrades: {},
            unlockedLore: ['chapter1_intro'],
            unlockedEndings: [],
            stats: {
                playTime: 0,
                nodesVisited: 0,
                bossesDefeated: 0,
                eventsCompleted: 0
            }
        };
    },
    
    // Update chapter goal
    updateChapterGoal: function(chapter, goalId, progress) {
        if (!this.progressionData) return;
        
        let goal = this.progressionData.chapterGoals.find(
            g => g.chapter === chapter && g.id === goalId
        );
        
        if (!goal) {
            goal = {
                chapter: chapter,
                id: goalId,
                progress: 0,
                completed: false
            };
            this.progressionData.chapterGoals.push(goal);
        }
        
        goal.progress = progress;
        
        // Check completion
        if (progress >= 1.0 && !goal.completed) {
            goal.completed = true;
            this.onGoalCompleted(chapter, goalId);
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // On goal completed
    onGoalCompleted: function(chapter, goalId) {
        // Trigger event
        if (window.EventController) {
            window.EventController.trigger('chapter_goal_complete', {
                chapter: chapter,
                goalId: goalId
            });
        }
        
        // Check chapter completion
        this.checkChapterCompletion(chapter);
    },
    
    // Check chapter completion
    checkChapterCompletion: function(chapter) {
        if (!this.progressionData) return;
        
        const chapterGoals = this.progressionData.chapterGoals.filter(
            g => g.chapter === chapter
        );
        
        if (chapterGoals.length === 0) return;
        
        const allCompleted = chapterGoals.every(g => g.completed);
        
        if (allCompleted && !this.progressionData.completedChapters.includes(chapter)) {
            this.completeChapter(chapter);
        }
    },
    
    // Complete chapter
    completeChapter: function(chapter) {
        if (!this.progressionData) return;
        
        if (!this.progressionData.completedChapters.includes(chapter)) {
            this.progressionData.completedChapters.push(chapter);
        }
        
        // Unlock next chapter
        if (chapter < 5) {
            // Next chapter unlocked
        }
        
        // Unlock lore
        this.unlockLore(`chapter${chapter}_complete`);
        
        // Trigger event
        if (window.EventController) {
            window.EventController.trigger('chapter_complete', {
                chapter: chapter
            });
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // Unlock boss gate
    unlockBossGate: function(gateId, chapter) {
        if (!this.progressionData) return;
        
        const gate = {
            id: gateId,
            chapter: chapter,
            unlocked: true,
            defeated: false
        };
        
        const existing = this.progressionData.bossGates.find(g => g.id === gateId);
        if (existing) {
            existing.unlocked = true;
        } else {
            this.progressionData.bossGates.push(gate);
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // Defeat boss gate
    defeatBossGate: function(gateId) {
        if (!this.progressionData) return;
        
        const gate = this.progressionData.bossGates.find(g => g.id === gateId);
        if (gate) {
            gate.defeated = true;
            this.progressionData.stats.bossesDefeated++;
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // Purchase character upgrade
    purchaseUpgrade: function(upgradeId) {
        if (!this.progressionData) return false;
        
        const upgrade = this.characterUpgrades.get(upgradeId);
        if (!upgrade) return false;
        
        const currentLevel = this.progressionData.characterUpgrades[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) return false;
        
        const cost = upgrade.cost * (currentLevel + 1);
        
        // Check if player has enough coins
        if (window.MetaProgression) {
            const coins = window.MetaProgression.getCoins();
            if (coins < cost) return false;
            
            window.MetaProgression.spendCoins(cost);
        }
        
        // Apply upgrade
        this.progressionData.characterUpgrades[upgradeId] = currentLevel + 1;
        
        // Apply effect
        this.applyUpgrade(upgradeId, currentLevel + 1);
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
        
        return true;
    },
    
    // Apply upgrade
    applyUpgrade: function(upgradeId, level) {
        const upgrade = this.characterUpgrades.get(upgradeId);
        if (!upgrade) return;
        
        const effect = upgrade.effect(level);
        
        switch (upgradeId) {
            case 'speed':
                // Apply speed boost
                if (window.StateManager) {
                    // Modify game speed
                }
                break;
            case 'health':
                // Apply health boost
                break;
            case 'damage':
                // Apply damage boost
                break;
        }
    },
    
    // Unlock lore
    unlockLore: function(loreId) {
        if (!this.progressionData) return;
        
        if (!this.progressionData.unlockedLore.includes(loreId)) {
            this.progressionData.unlockedLore.push(loreId);
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // Get lore entry
    getLoreEntry: function(loreId) {
        return this.loreDatabase.get(loreId);
    },
    
    // Get unlocked lore
    getUnlockedLore: function() {
        if (!this.progressionData) return [];
        
        return this.progressionData.unlockedLore
            .map(id => this.loreDatabase.get(id))
            .filter(entry => entry !== undefined);
    },
    
    // Check ending requirements
    checkEndingRequirements: function(endingId) {
        if (!this.progressionData) return false;
        
        const ending = this.endings.get(endingId);
        if (!ending) return false;
        
        const requirements = ending.requirements;
        
        // Check chapters
        if (requirements.chaptersCompleted) {
            if (this.progressionData.completedChapters.length < requirements.chaptersCompleted) {
                return false;
            }
        }
        
        // Check bosses
        if (requirements.bossesDefeated) {
            if (this.progressionData.stats.bossesDefeated < requirements.bossesDefeated) {
                return false;
            }
        }
        
        // Check lore
        if (requirements.loreUnlocked) {
            if (this.progressionData.unlockedLore.length < requirements.loreUnlocked) {
                return false;
            }
        }
        
        return true;
    },
    
    // Unlock ending
    unlockEnding: function(endingId) {
        if (!this.progressionData) return;
        
        if (!this.progressionData.unlockedEndings.includes(endingId)) {
            this.progressionData.unlockedEndings.push(endingId);
            
            const ending = this.endings.get(endingId);
            if (ending && ending.rewards) {
                this.giveRewards(ending.rewards);
            }
        }
        
        if (this.config.autoSave) {
            this.saveProgression();
        }
    },
    
    // Give rewards
    giveRewards: function(rewards) {
        if (rewards.coins && window.MetaProgression) {
            window.MetaProgression.addCoins(rewards.coins);
        }
        
        if (rewards.experience && window.MetaProgression) {
            window.MetaProgression.addExperience(rewards.experience);
        }
        
        if (rewards.skins && window.CosmeticSystem) {
            rewards.skins.forEach(skinId => {
                window.CosmeticSystem.unlockSkin(skinId);
            });
        }
    },
    
    // Save progression
    saveProgression: function() {
        if (!this.progressionData || !window.RobustSaveSystem) return;
        
        window.RobustSaveSystem.save('story_progression', this.progressionData);
    },
    
    // Get progression data
    getProgressionData: function() {
        return this.progressionData;
    },
    
    // Register custom upgrade
    registerUpgrade: function(upgradeId, upgrade) {
        this.characterUpgrades.set(upgradeId, upgrade);
    },
    
    // Register lore entry
    registerLore: function(loreId, lore) {
        this.loreDatabase.set(loreId, lore);
    },
    
    // Register ending
    registerEnding: function(endingId, ending) {
        this.endings.set(endingId, ending);
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StoryProgression.init());
} else {
    StoryProgression.init();
}

