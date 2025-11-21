// ==================== STORY MODE SYSTEM ====================
// Procedural story campaign with world map, branching paths, and narrative events

const StoryMode = {
    // Configuration
    config: {
        enabled: true,
        defaultSeed: null,
        chapterCount: 5,
        nodesPerChapter: 8,
        bossGateFrequency: 0.3 // 30% chance of boss gate
    },
    
    // State
    currentStory: null,
    storyTemplates: new Map(),
    eventTemplates: new Map(),
    loreEntries: new Map(),
    
    // Initialize
    init: function() {
        this.loadStoryTemplates();
        this.loadEventTemplates();
        this.loadLoreEntries();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('StoryMode', this);
        }
        
        window.StoryMode = this;
    },
    
    // Load story templates
    loadStoryTemplates: function() {
        // Basic story structure
        this.storyTemplates.set('default', {
            name: 'The Snake\'s Journey',
            chapters: 5,
            startingChapter: 1,
            endings: ['good', 'neutral', 'bad']
        });
    },
    
    // Load event templates
    loadEventTemplates: function() {
        // Combat event
        this.eventTemplates.set('combat', {
            type: 'combat',
            name: 'Combat Encounter',
            difficulty: 1.0,
            modifiers: [],
            rewards: { coins: 10, experience: 5 }
        });
        
        // Boss gate event
        this.eventTemplates.set('boss_gate', {
            type: 'boss_gate',
            name: 'Boss Gate',
            bossEncounter: 'basic',
            requiredProgress: 0.5,
            rewards: { coins: 50, experience: 25, items: [] }
        });
        
        // Narrative event
        this.eventTemplates.set('narrative', {
            type: 'narrative',
            name: 'Story Event',
            text: 'You discover an ancient artifact...',
            choices: [
                { text: 'Examine it', effect: 'gain_item' },
                { text: 'Leave it', effect: 'nothing' }
            ]
        });
        
        // Shop event
        this.eventTemplates.set('shop', {
            type: 'shop',
            name: 'Merchant',
            items: ['power_up_shield', 'power_up_score_multiplier'],
            discount: 0.1
        });
        
        // Rest event
        this.eventTemplates.set('rest', {
            type: 'rest',
            name: 'Safe Haven',
            healAmount: 0.5,
            description: 'You find a safe place to rest...'
        });
    },
    
    // Load lore entries
    loadLoreEntries: function() {
        this.loreEntries.set('chapter1_intro', {
            id: 'chapter1_intro',
            chapter: 1,
            title: 'The Beginning',
            text: 'Long ago, in a world of endless grids, a snake was born...',
            unlocked: true
        });
        
        this.loreEntries.set('boss1_lore', {
            id: 'boss1_lore',
            chapter: 1,
            title: 'The First Guardian',
            text: 'The guardian of the first gate watches over the ancient path...',
            unlocked: false
        });
    },
    
    // Start new story
    startStory: function(templateId = 'default', seed = null) {
        const template = this.storyTemplates.get(templateId);
        if (!template) {
            console.warn('Story template not found:', templateId);
            return null;
        }
        
        // Initialize RNG with seed
        if (seed === null) {
            seed = Date.now();
        }
        this.setSeed(seed);
        
        const story = {
            id: `story_${Date.now()}`,
            templateId: templateId,
            name: template.name,
            seed: seed,
            
            // Progression
            currentChapter: template.startingChapter,
            currentNode: 0,
            completedChapters: [],
            completedNodes: [],
            
            // World map
            worldMap: this.generateWorldMap(template.chapters, seed),
            
            // Player state
            playerStats: {
                level: 1,
                experience: 0,
                coins: 0,
                items: [],
                upgrades: []
            },
            
            // Story state
            state: 'exploring', // exploring, combat, boss, narrative, victory, defeat
            activeEvent: null,
            
            // Progression tracking
            chapterGoals: this.generateChapterGoals(template.chapters),
            bossGates: [],
            endings: template.endings,
            endingReached: null,
            
            // Lore
            unlockedLore: ['chapter1_intro'],
            
            // Stats
            startTime: Date.now(),
            playTime: 0,
            nodesVisited: 0,
            bossesDefeated: 0
        };
        
        this.currentStory = story;
        
        // Load story progress from save
        this.loadStoryProgress(story);
        
        return story;
    },
    
    // Generate world map
    generateWorldMap: function(chapterCount, seed) {
        const map = {
            chapters: [],
            connections: []
        };
        
        for (let chapter = 1; chapter <= chapterCount; chapter++) {
            const chapterNodes = this.generateChapterNodes(chapter, seed + chapter);
            map.chapters.push({
                chapter: chapter,
                nodes: chapterNodes
            });
            
            // Connect to previous chapter
            if (chapter > 1) {
                const prevChapter = map.chapters[chapter - 2];
                const lastNode = prevChapter.nodes[prevChapter.nodes.length - 1];
                const firstNode = chapterNodes[0];
                
                map.connections.push({
                    from: { chapter: chapter - 1, node: lastNode.id },
                    to: { chapter: chapter, node: firstNode.id }
                });
            }
        }
        
        return map;
    },
    
    // Generate chapter nodes
    generateChapterNodes: function(chapter, seed) {
        const nodes = [];
        const nodeCount = this.config.nodesPerChapter;
        
        this.setSeed(seed);
        
        for (let i = 0; i < nodeCount; i++) {
            const node = {
                id: `chapter${chapter}_node${i}`,
                chapter: chapter,
                index: i,
                x: (i % 4) * 100 + 50,
                y: Math.floor(i / 4) * 100 + 50,
                type: this.chooseNodeType(i, nodeCount),
                event: this.generateNodeEvent(chapter, i),
                visited: false,
                completed: false,
                locked: i > 0
            };
            
            nodes.push(node);
        }
        
        // Add connections between nodes
        for (let i = 0; i < nodes.length - 1; i++) {
            nodes[i].connections = [nodes[i + 1].id];
        }
        
        return nodes;
    },
    
    // Choose node type (deterministic with seed)
    chooseNodeType: function(index, total) {
        if (index === 0) return 'start';
        if (index === total - 1) return 'boss';
        
        // Use seeded RNG for deterministic generation
        const rand = this.seededRandom();
        if (rand < this.config.bossGateFrequency) {
            return 'boss_gate';
        } else if (rand < 0.4) {
            return 'combat';
        } else if (rand < 0.6) {
            return 'narrative';
        } else if (rand < 0.8) {
            return 'shop';
        } else {
            return 'rest';
        }
    },
    
    // Generate node event
    generateNodeEvent: function(chapter, nodeIndex) {
        const nodeType = this.chooseNodeType(nodeIndex, this.config.nodesPerChapter);
        const template = this.eventTemplates.get(nodeType);
        
        if (!template) return null;
        
        // Scale difficulty with chapter
        const difficulty = 1.0 + (chapter - 1) * 0.2;
        
        return {
            ...template,
            difficulty: difficulty * (template.difficulty || 1.0),
            chapter: chapter,
            nodeIndex: nodeIndex
        };
    },
    
    // Generate chapter goals
    generateChapterGoals: function(chapterCount) {
        const goals = [];
        
        for (let chapter = 1; chapter <= chapterCount; chapter++) {
            goals.push({
                chapter: chapter,
                goal: `Complete Chapter ${chapter}`,
                completed: false,
                requirements: {
                    nodesCompleted: this.config.nodesPerChapter,
                    bossDefeated: chapter === chapterCount // Final chapter requires boss
                }
            });
        }
        
        return goals;
    },
    
    // Visit node
    visitNode: function(nodeId) {
        if (!this.currentStory) return null;
        
        const node = this.findNode(nodeId);
        if (!node || node.locked) return null;
        
        node.visited = true;
        this.currentStory.nodesVisited++;
        this.currentStory.currentNode = node.index;
        
        // Start event
        if (node.event) {
            return this.startEvent(node.event);
        }
        
        return null;
    },
    
    // Find node
    findNode: function(nodeId) {
        if (!this.currentStory) return null;
        
        for (const chapter of this.currentStory.worldMap.chapters) {
            const node = chapter.nodes.find(n => n.id === nodeId);
            if (node) return node;
        }
        
        return null;
    },
    
    // Start event
    startEvent: function(event) {
        if (!this.currentStory) return null;
        
        this.currentStory.state = event.type;
        this.currentStory.activeEvent = event;
        
        // Trigger event start
        if (window.EventController) {
            window.EventController.trigger('story_event_start', {
                eventType: event.type,
                eventName: event.name,
                chapter: this.currentStory.currentChapter
            });
        }
        
        // Handle event type
        switch (event.type) {
            case 'combat':
                return this.startCombatEvent(event);
            case 'boss_gate':
                return this.startBossGateEvent(event);
            case 'narrative':
                return this.startNarrativeEvent(event);
            case 'shop':
                return this.startShopEvent(event);
            case 'rest':
                return this.startRestEvent(event);
        }
        
        return event;
    },
    
    // Start combat event
    startCombatEvent: function(event) {
        // Start normal game mode with modifiers
        if (window.StateManager) {
            window.StateManager.setGameRunning(true);
        }
        
        // Apply modifiers
        if (event.modifiers && window.GlobalModifiers) {
            event.modifiers.forEach(modifier => {
                // Apply modifier
            });
        }
        
        return event;
    },
    
    // Start boss gate event
    startBossGateEvent: function(event) {
        // Check if player has required progress
        const progress = this.getStoryProgress();
        if (progress < event.requiredProgress) {
            // Lock gate
            return { locked: true, message: 'Not enough progress to enter boss gate' };
        }
        
        // Start boss encounter
        if (window.BossEncounters) {
            const encounter = window.BossEncounters.startEncounter(
                event.bossEncounter,
                event.difficulty || this.currentStory.currentChapter,
                this.currentStory.seed
            );
            
            return encounter;
        }
        
        return event;
    },
    
    // Start narrative event
    startNarrativeEvent: function(event) {
        // Show narrative UI
        if (window.NarrativeTools) {
            window.NarrativeTools.showNarrative(event);
        }
        
        return event;
    },
    
    // Start shop event
    startShopEvent: function(event) {
        // Open shop with special items
        if (window.UI && window.UI.openShop) {
            window.UI.openShop(event.items, event.discount);
        }
        
        return event;
    },
    
    // Start rest event
    startRestEvent: function(event) {
        // Heal player
        // Show rest UI
        
        return event;
    },
    
    // Complete event
    completeEvent: function(success = true) {
        if (!this.currentStory || !this.currentStory.activeEvent) return;
        
        const event = this.currentStory.activeEvent;
        const node = this.findNodeByEvent(event);
        
        if (node) {
            node.completed = success;
            this.currentStory.completedNodes.push(node.id);
        }
        
        // Give rewards
        if (success && event.rewards) {
            this.giveRewards(event.rewards);
        }
        
        // Check chapter completion
        this.checkChapterCompletion();
        
        // Clear active event
        this.currentStory.activeEvent = null;
        this.currentStory.state = 'exploring';
        
        // Trigger event complete
        if (window.EventController) {
            window.EventController.trigger('story_event_complete', {
                eventType: event.type,
                success: success
            });
        }
    },
    
    // Find node by event
    findNodeByEvent: function(event) {
        if (!this.currentStory) return null;
        
        for (const chapter of this.currentStory.worldMap.chapters) {
            const node = chapter.nodes.find(n => n.event === event);
            if (node) return node;
        }
        
        return null;
    },
    
    // Check chapter completion
    checkChapterCompletion: function() {
        if (!this.currentStory) return;
        
        const chapter = this.currentStory.worldMap.chapters.find(
            c => c.chapter === this.currentStory.currentChapter
        );
        
        if (!chapter) return;
        
        const completedNodes = chapter.nodes.filter(n => n.completed).length;
        const totalNodes = chapter.nodes.length;
        
        if (completedNodes >= totalNodes) {
            this.completeChapter(this.currentStory.currentChapter);
        }
    },
    
    // Complete chapter
    completeChapter: function(chapter) {
        if (!this.currentStory) return;
        
        const goal = this.currentStory.chapterGoals.find(g => g.chapter === chapter);
        if (goal) {
            goal.completed = true;
        }
        
        this.currentStory.completedChapters.push(chapter);
        
        // Unlock next chapter
        if (chapter < this.currentStory.worldMap.chapters.length) {
            const nextChapter = this.currentStory.worldMap.chapters[chapter];
            if (nextChapter && nextChapter.nodes[0]) {
                nextChapter.nodes[0].locked = false;
            }
        }
        
        // Unlock lore
        this.unlockLore(`chapter${chapter}_complete`);
        
        // Check for ending
        if (chapter === this.currentStory.worldMap.chapters.length) {
            this.reachEnding('good');
        }
        
        // Trigger chapter complete
        if (window.EventController) {
            window.EventController.trigger('story_chapter_complete', {
                chapter: chapter
            });
        }
    },
    
    // Reach ending
    reachEnding: function(endingId) {
        if (!this.currentStory) return;
        
        this.currentStory.endingReached = endingId;
        this.currentStory.state = 'victory';
        
        // Unlock ending lore
        this.unlockLore(`ending_${endingId}`);
        
        // Trigger ending event
        if (window.EventController) {
            window.EventController.trigger('story_ending', {
                endingId: endingId,
                playTime: Date.now() - this.currentStory.startTime
            });
        }
    },
    
    // Get story progress
    getStoryProgress: function() {
        if (!this.currentStory) return 0;
        
        const totalNodes = this.currentStory.worldMap.chapters.reduce(
            (sum, chapter) => sum + chapter.nodes.length, 0
        );
        const completedNodes = this.currentStory.completedNodes.length;
        
        return completedNodes / totalNodes;
    },
    
    // Give rewards
    giveRewards: function(rewards) {
        if (!this.currentStory) return;
        
        if (rewards.coins) {
            this.currentStory.playerStats.coins += rewards.coins;
            if (window.MetaProgression) {
                window.MetaProgression.addCoins(rewards.coins);
            }
        }
        
        if (rewards.experience) {
            this.currentStory.playerStats.experience += rewards.experience;
            if (window.MetaProgression) {
                window.MetaProgression.addExperience(rewards.experience);
            }
        }
        
        if (rewards.items) {
            rewards.items.forEach(itemId => {
                this.currentStory.playerStats.items.push(itemId);
            });
        }
    },
    
    // Unlock lore
    unlockLore: function(loreId) {
        if (!this.currentStory) return;
        
        if (!this.currentStory.unlockedLore.includes(loreId)) {
            this.currentStory.unlockedLore.push(loreId);
        }
    },
    
    // Get lore entry
    getLoreEntry: function(loreId) {
        return this.loreEntries.get(loreId);
    },
    
    // Get unlocked lore
    getUnlockedLore: function() {
        if (!this.currentStory) return [];
        
        return this.currentStory.unlockedLore
            .map(id => this.loreEntries.get(id))
            .filter(entry => entry !== undefined);
    },
    
    // Set seed
    setSeed: function(seed) {
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
    
    // Load story progress
    loadStoryProgress: function(story) {
        // Load from save system
        if (window.RobustSaveSystem) {
            const saved = window.RobustSaveSystem.load('story_progress');
            if (saved && saved.storyId === story.id) {
                // Restore progress
                story.currentChapter = saved.currentChapter || story.currentChapter;
                story.completedChapters = saved.completedChapters || [];
                story.completedNodes = saved.completedNodes || [];
                story.unlockedLore = saved.unlockedLore || story.unlockedLore;
                story.playerStats = saved.playerStats || story.playerStats;
            }
        }
    },
    
    // Save story progress
    saveStoryProgress: function() {
        if (!this.currentStory || !window.RobustSaveSystem) return;
        
        const progress = {
            storyId: this.currentStory.id,
            currentChapter: this.currentStory.currentChapter,
            completedChapters: this.currentStory.completedChapters,
            completedNodes: this.currentStory.completedNodes,
            unlockedLore: this.currentStory.unlockedLore,
            playerStats: this.currentStory.playerStats,
            endingReached: this.currentStory.endingReached
        };
        
        window.RobustSaveSystem.save('story_progress', progress);
    },
    
    // Get current story
    getCurrentStory: function() {
        return this.currentStory;
    },
    
    // Register custom story template
    registerStoryTemplate: function(templateId, template) {
        this.storyTemplates.set(templateId, template);
    },
    
    // Register custom event template
    registerEventTemplate: function(eventId, template) {
        this.eventTemplates.set(eventId, template);
    },
    
    // Register lore entry
    registerLoreEntry: function(loreId, entry) {
        this.loreEntries.set(loreId, entry);
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StoryMode.init());
} else {
    StoryMode.init();
}

