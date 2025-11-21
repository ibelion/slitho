// ==================== ROTATING CONTENT SYSTEM ====================
// Daily and weekly rotating content with deterministic seeds

const RotatingContent = {
    // Daily content
    dailyChallenge: null,
    dailyBoss: null,
    dailyLevelSeed: null,
    dailyShopItems: [],
    
    // Weekly content
    weeklyBossVariation: null,
    weeklyLevelSeed: null,
    weeklyShopItems: [],
    weeklySkins: [],
    
    // Current date seed
    currentDateSeed: null,
    currentWeekSeed: null,
    
    // Initialize
    init: function() {
        this.updateDailyContent();
        this.updateWeeklyContent();
        this.startUpdateLoop();
    },
    
    // Update daily content
    updateDailyContent: function() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        this.currentDateSeed = this.stringToSeed(dateStr);
        
        // Generate deterministic random from seed
        const rng = this.seededRandom(this.currentDateSeed);
        
        // Daily challenge
        this.dailyChallenge = this.generateDailyChallenge(rng);
        
        // Daily boss variation
        this.dailyBoss = this.generateDailyBoss(rng);
        
        // Daily level seed
        this.dailyLevelSeed = Math.floor(rng() * 1000000);
        
        // Daily shop items
        this.dailyShopItems = this.generateDailyShopItems(rng);
        
        // Store date to detect changes
        localStorage.setItem('lastDailyContentDate', dateStr);
    },
    
    // Update weekly content
    updateWeeklyContent: function() {
        const today = new Date();
        const weekNumber = this.getWeekNumber(today);
        const year = today.getFullYear();
        const weekSeedStr = `${year}-W${weekNumber}`;
        this.currentWeekSeed = this.stringToSeed(weekSeedStr);
        
        const rng = this.seededRandom(this.currentWeekSeed);
        
        // Weekly boss variation
        this.weeklyBossVariation = this.generateWeeklyBossVariation(rng);
        
        // Weekly level seed
        this.weeklyLevelSeed = Math.floor(rng() * 1000000);
        
        // Weekly shop items
        this.weeklyShopItems = this.generateWeeklyShopItems(rng);
        
        // Weekly skins
        this.weeklySkins = this.generateWeeklySkins(rng);
        
        // Store week to detect changes
        localStorage.setItem('lastWeeklyContentWeek', weekSeedStr);
    },
    
    // Generate daily challenge
    generateDailyChallenge: function(rng) {
        const challenges = [
            { id: 'speed_run', name: 'Speed Run', target: 'time', value: 30 },
            { id: 'no_death', name: 'Perfect Run', target: 'deaths', value: 0 },
            { id: 'combo_master', name: 'Combo Master', target: 'combo', value: 5 },
            { id: 'food_collector', name: 'Food Collector', target: 'food', value: 20 }
        ];
        
        const challenge = challenges[Math.floor(rng() * challenges.length)];
        const difficulty = Math.floor(rng() * 3) + 1; // 1-3
        
        return {
            ...challenge,
            difficulty,
            seed: this.currentDateSeed,
            date: new Date().toISOString().split('T')[0]
        };
    },
    
    // Generate daily boss
    generateDailyBoss: function(rng) {
        const bossTypes = ['aggressive', 'defensive', 'fast', 'slow'];
        const type = bossTypes[Math.floor(rng() * bossTypes.length)];
        
        return {
            type,
            health: 3 + Math.floor(rng() * 2), // 3-4
            speed: 0.5 + rng() * 0.5, // 0.5-1.0
            seed: this.currentDateSeed
        };
    },
    
    // Generate daily shop items
    generateDailyShopItems: function(rng) {
        const allItems = window.Shop ? window.Shop.getAllItems() : [];
        const count = 3 + Math.floor(rng() * 3); // 3-5 items
        
        const selected = [];
        const used = new Set();
        
        for (let i = 0; i < count && i < allItems.length; i++) {
            let index;
            do {
                index = Math.floor(rng() * allItems.length);
            } while (used.has(index));
            
            used.add(index);
            selected.push({
                ...allItems[index],
                dailyPrice: Math.floor(allItems[index].price * (0.8 + rng() * 0.4)) // 80-120% of normal price
            });
        }
        
        return selected;
    },
    
    // Generate weekly boss variation
    generateWeeklyBossVariation: function(rng) {
        const variations = [
            { name: 'Titan', health: 5, size: 1.5 },
            { name: 'Swift', health: 2, speed: 2.0 },
            { name: 'Tank', health: 7, size: 1.2, speed: 0.5 }
        ];
        
        return variations[Math.floor(rng() * variations.length)];
    },
    
    // Generate weekly shop items
    generateWeeklyShopItems: function(rng) {
        // Similar to daily but with different selection
        const allItems = window.Shop ? window.Shop.getAllItems() : [];
        const count = 5 + Math.floor(rng() * 3); // 5-7 items
        
        const selected = [];
        const used = new Set();
        
        for (let i = 0; i < count && i < allItems.length; i++) {
            let index;
            do {
                index = Math.floor(rng() * allItems.length);
            } while (used.has(index));
            
            used.add(index);
            selected.push({
                ...allItems[index],
                weeklyPrice: Math.floor(allItems[index].price * (0.7 + rng() * 0.3)) // 70-100% of normal price
            });
        }
        
        return selected;
    },
    
    // Generate weekly skins
    generateWeeklySkins: function(rng) {
        const allSkins = window.SkinManager ? window.SkinManager.getAllSkins() : [];
        const count = 2 + Math.floor(rng() * 2); // 2-3 skins
        
        const selected = [];
        const used = new Set();
        
        for (let i = 0; i < count && i < allSkins.length; i++) {
            let index;
            do {
                index = Math.floor(rng() * allSkins.length);
            } while (used.has(index));
            
            used.add(index);
            selected.push({
                ...allSkins[index],
                weeklyUnlock: true
            });
        }
        
        return selected;
    },
    
    // String to seed (deterministic)
    stringToSeed: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    },
    
    // Seeded random number generator
    seededRandom: function(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    },
    
    // Get week number
    getWeekNumber: function(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Start update loop
    startUpdateLoop: function() {
        // Check for date change every hour
        setInterval(() => {
            this.checkAndUpdate();
        }, 3600000); // 1 hour
    },
    
    // Check and update if needed
    checkAndUpdate: function() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const lastDaily = localStorage.getItem('lastDailyContentDate');
        
        if (lastDaily !== dateStr) {
            this.updateDailyContent();
        }
        
        const weekNumber = this.getWeekNumber(today);
        const year = today.getFullYear();
        const weekSeedStr = `${year}-W${weekNumber}`;
        const lastWeekly = localStorage.getItem('lastWeeklyContentWeek');
        
        if (lastWeekly !== weekSeedStr) {
            this.updateWeeklyContent();
        }
    },
    
    // Get daily challenge
    getDailyChallenge: function() {
        this.checkAndUpdate();
        return this.dailyChallenge;
    },
    
    // Get daily boss
    getDailyBoss: function() {
        this.checkAndUpdate();
        return this.dailyBoss;
    },
    
    // Get daily level seed
    getDailyLevelSeed: function() {
        this.checkAndUpdate();
        return this.dailyLevelSeed;
    },
    
    // Get daily shop items
    getDailyShopItems: function() {
        this.checkAndUpdate();
        return this.dailyShopItems;
    },
    
    // Get weekly boss variation
    getWeeklyBossVariation: function() {
        this.checkAndUpdate();
        return this.weeklyBossVariation;
    },
    
    // Get weekly level seed
    getWeeklyLevelSeed: function() {
        this.checkAndUpdate();
        return this.weeklyLevelSeed;
    },
    
    // Get weekly shop items
    getWeeklyShopItems: function() {
        this.checkAndUpdate();
        return this.weeklyShopItems;
    },
    
    // Get weekly skins
    getWeeklySkins: function() {
        this.checkAndUpdate();
        return this.weeklySkins;
    }
};

// Export
window.RotatingContent = RotatingContent;

