// ==================== DEFENSIVE UTILITIES ====================
// Safe access patterns and validation helpers

const DefensiveUtils = {
    // Safe property access with fallback
    safeGet: function(obj, path, defaultValue = null) {
        try {
            const keys = path.split('.');
            let result = obj;
            for (const key of keys) {
                if (result == null) return defaultValue;
                result = result[key];
            }
            return result != null ? result : defaultValue;
        } catch (e) {
            console.warn(`Safe get failed for path: ${path}`, e);
            return defaultValue;
        }
    },
    
    // Safe function call
    safeCall: function(fn, context, ...args) {
        try {
            if (typeof fn === 'function') {
                return fn.apply(context, args);
            }
            return null;
        } catch (e) {
            console.warn('Safe call failed:', e);
            return null;
        }
    },
    
    // Validate number with bounds
    validateNumber: function(value, min = -Infinity, max = Infinity, defaultValue = 0) {
        const num = Number(value);
        if (isNaN(num)) return defaultValue;
        return Math.max(min, Math.min(max, num));
    },
    
    // Validate array
    validateArray: function(value, defaultValue = []) {
        return Array.isArray(value) ? value : defaultValue;
    },
    
    // Validate object
    validateObject: function(value, defaultValue = {}) {
        return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
    },
    
    // Safe JSON parse
    safeParseJSON: function(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('JSON parse failed:', e);
            return defaultValue;
        }
    },
    
    // Safe JSON stringify
    safeStringify: function(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.warn('JSON stringify failed:', e);
            return defaultValue;
        }
    },
    
    // Check if value is null or undefined
    isNullOrUndefined: function(value) {
        return value === null || value === undefined;
    },
    
    // Ensure value is not null/undefined
    ensureValue: function(value, defaultValue) {
        return this.isNullOrUndefined(value) ? defaultValue : value;
    },
    
    // Validate game state transition
    validateStateTransition: function(currentState, newState, allowedTransitions) {
        if (!allowedTransitions[currentState]) {
            console.warn(`Invalid state transition from ${currentState}`);
            return false;
        }
        if (!allowedTransitions[currentState].includes(newState)) {
            console.warn(`State transition ${currentState} -> ${newState} not allowed`);
            return false;
        }
        return true;
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export
window.DefensiveUtils = DefensiveUtils;

