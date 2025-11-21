// ==================== EVENT CONTROLLER ====================
// Time-based event system for seasonal, weekly, and monthly events

const EventController = {
    // Active events
    activeEvents: [],
    
    // Event definitions
    events: new Map(),
    
    // Current date/time
    currentDate: new Date(),
    
    // Initialize
    init: function() {
        this.loadEventDefinitions();
        this.updateActiveEvents();
        this.startEventLoop();
    },
    
    // Load event definitions from JSON
    loadEventDefinitions: async function() {
        try {
            const response = await fetch('/content/events/events.json');
            if (response.ok) {
                const data = await response.json();
                data.events.forEach(event => this.registerEvent(event));
            }
        } catch (e) {
            console.warn('Failed to load event definitions, using defaults:', e);
            this.loadDefaultEvents();
        }
    },
    
    // Load default events
    loadDefaultEvents: function() {
        // Seasonal events
        this.registerEvent({
            id: 'winter_2024',
            name: 'Winter Wonderland',
            type: 'seasonal',
            startDate: '2024-12-01',
            endDate: '2024-12-31',
            theme: 'winter',
            modifiers: { snow: true, lowGravity: 0.8 },
            rewards: { bonusCoins: 1.5 }
        });
        
        this.registerEvent({
            id: 'halloween_2024',
            name: 'Halloween Spooktacular',
            type: 'seasonal',
            startDate: '2024-10-01',
            endDate: '2024-10-31',
            theme: 'halloween',
            modifiers: { fog: 0.5, darkMode: true },
            rewards: { bonusCoins: 1.5 }
        });
        
        // Weekly events
        this.registerEvent({
            id: 'speed_week',
            name: 'Speed Week',
            type: 'weekly',
            dayOfWeek: 1, // Monday
            duration: 7, // days
            modifiers: { speedMultiplier: 1.3 },
            rewards: { bonusCoins: 1.2 }
        });
        
        // Monthly events
        this.registerEvent({
            id: 'double_fruit_month',
            name: 'Double Fruit Month',
            type: 'monthly',
            month: 6, // June
            modifiers: { fruitMultiplier: 2.0 },
            rewards: { bonusCoins: 1.3 }
        });
    },
    
    // Register event
    registerEvent: function(event) {
        if (!event.id) {
            console.error('Event missing id:', event);
            return;
        }
        this.events.set(event.id, event);
    },
    
    // Update active events based on current date
    updateActiveEvents: function() {
        this.currentDate = new Date();
        this.activeEvents = [];
        
        for (const event of this.events.values()) {
            if (this.isEventActive(event)) {
                this.activeEvents.push(event);
            }
        }
        
        // Apply event effects
        this.applyEventEffects();
    },
    
    // Check if event is active
    isEventActive: function(event) {
        const now = this.currentDate;
        
        switch (event.type) {
            case 'seasonal':
                return this.isSeasonalEventActive(event, now);
            case 'weekly':
                return this.isWeeklyEventActive(event, now);
            case 'monthly':
                return this.isMonthlyEventActive(event, now);
            case 'daily':
                return this.isDailyEventActive(event, now);
            default:
                return false;
        }
    },
    
    // Check seasonal event
    isSeasonalEventActive: function(event, now) {
        if (!event.startDate || !event.endDate) return false;
        
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        
        return now >= start && now <= end;
    },
    
    // Check weekly event
    isWeeklyEventActive: function(event, now) {
        if (event.dayOfWeek === undefined) return false;
        
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        
        // Check if we're in the event week (deterministic based on week number)
        const weekNumber = this.getWeekNumber(now);
        const eventWeek = event.weekNumber || (weekNumber % event.repeatInterval || 4);
        
        return dayOfWeek === event.dayOfWeek && (weekNumber % (event.repeatInterval || 4)) === eventWeek;
    },
    
    // Check monthly event
    isMonthlyEventActive: function(event, now) {
        if (event.month === undefined) return false;
        return now.getMonth() === event.month;
    },
    
    // Check daily event
    isDailyEventActive: function(event, now) {
        // Daily events are handled by DailyChallenge system
        return false;
    },
    
    // Get week number (deterministic)
    getWeekNumber: function(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Apply event effects
    applyEventEffects: function() {
        // Merge all active event modifiers
        const combinedModifiers = {};
        const combinedRewards = {};
        
        for (const event of this.activeEvents) {
            if (event.modifiers) {
                Object.assign(combinedModifiers, event.modifiers);
            }
            if (event.rewards) {
                Object.assign(combinedRewards, event.rewards);
            }
            
            // Apply theme if specified
            if (event.theme && window.ThemeManager) {
                window.ThemeManager.setEventTheme(event.theme);
            }
        }
        
        // Apply modifiers to game
        if (window.GlobalModifiers) {
            Object.keys(combinedModifiers).forEach(key => {
                const value = combinedModifiers[key];
                switch (key) {
                    case 'speedMultiplier':
                        window.GlobalModifiers.applySpeedup(value);
                        break;
                    case 'fog':
                        window.GlobalModifiers.applyFog(value);
                        break;
                    case 'lowGravity':
                        window.GlobalModifiers.applyGravity(1 - value);
                        break;
                    // Add more modifier types as needed
                }
            });
        }
        
        // Store rewards for later application
        window.activeEventRewards = combinedRewards;
    },
    
    // Start event update loop
    startEventLoop: function() {
        // Update events every hour
        setInterval(() => {
            this.updateActiveEvents();
        }, 3600000); // 1 hour
        
        // Also update on date change
        this.checkDateChange();
    },
    
    // Check if date changed
    checkDateChange: function() {
        const lastDate = localStorage.getItem('lastEventCheckDate');
        const currentDateStr = this.currentDate.toDateString();
        
        if (lastDate !== currentDateStr) {
            localStorage.setItem('lastEventCheckDate', currentDateStr);
            this.updateActiveEvents();
        }
    },
    
    // Get active events
    getActiveEvents: function() {
        return [...this.activeEvents];
    },
    
    // Get event by ID
    getEvent: function(id) {
        return this.events.get(id);
    },
    
    // Check if specific event is active
    isEventActiveById: function(id) {
        return this.activeEvents.some(e => e.id === id);
    },
    
    // Get event rewards multiplier
    getRewardsMultiplier: function() {
        let multiplier = 1.0;
        for (const event of this.activeEvents) {
            if (event.rewards && event.rewards.bonusCoins) {
                multiplier *= event.rewards.bonusCoins;
            }
        }
        return multiplier;
    }
};

// Export
window.EventController = EventController;

