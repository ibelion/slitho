// ==================== THEME PRESETS SYSTEM ====================
// Customizable UI theme presets: Neo, Vapor, Midnight, Carbon
// Coexists with existing game theme system

const ThemePresets = {
    themes: {
        default: {
            name: "Default",
            colors: {},
            icon: '🎨',
            description: 'Original theme'
        },
        neo: {
            name: "Neo",
            colors: {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#252525',
                '--color-primary': '#00ff88',
                '--color-primary-light': '#33ffaa',
                '--color-secondary': '#00d4ff',
                '--text-primary': '#ffffff',
                '--snake-color': '#00ff88',
                '--food-color': '#ff0088',
                '--border-color': '#00ff88'
            },
            icon: '💚',
            description: 'Neon green cyberpunk'
        },
        vapor: {
            name: "Vapor",
            colors: {
                '--bg-primary': '#1a0a2e',
                '--bg-secondary': '#16213e',
                '--bg-tertiary': '#0f3460',
                '--color-primary': '#ff6b9d',
                '--color-primary-light': '#ff8fb3',
                '--color-secondary': '#c44569',
                '--text-primary': '#ffffff',
                '--snake-color': '#ff6b9d',
                '--food-color': '#00d4ff',
                '--border-color': '#ff6b9d'
            },
            icon: '🌊',
            description: 'Vaporwave aesthetic'
        },
        midnight: {
            name: "Midnight",
            colors: {
                '--bg-primary': '#0d1b2a',
                '--bg-secondary': '#1b263b',
                '--bg-tertiary': '#415a77',
                '--color-primary': '#778da9',
                '--color-primary-light': '#9bb5d1',
                '--color-secondary': '#e0e1dd',
                '--text-primary': '#e0e1dd',
                '--snake-color': '#778da9',
                '--food-color': '#ff6b9d',
                '--border-color': '#778da9'
            },
            icon: '🌙',
            description: 'Deep blue night'
        },
        carbon: {
            name: "Carbon",
            colors: {
                '--bg-primary': '#1a1a1a',
                '--bg-secondary': '#2a2a2a',
                '--bg-tertiary': '#3a3a3a',
                '--color-primary': '#ffffff',
                '--color-primary-light': '#cccccc',
                '--color-secondary': '#888888',
                '--text-primary': '#ffffff',
                '--snake-color': '#ffffff',
                '--food-color': '#ff4444',
                '--border-color': '#ffffff'
            },
            icon: '⚫',
            description: 'Monochrome minimal'
        }
    },
    
    currentTheme: 'default',
    initialized: false,
    
    init: function() {
        console.log('[ThemePresets] init() called, initialized:', this.initialized);
        if (this.initialized) {
            console.log('[ThemePresets] Already initialized, skipping');
            return;
        }
        this.initialized = true;
        
        console.log('[ThemePresets] Loading theme and setting up selector');
        this.loadTheme();
        
        // Wait for mode select screen to be ready
        let retryCount = 0;
        const maxRetries = 50; // 5 seconds max
        
        const checkReady = () => {
            const modeSelectScreen = document.getElementById('modeSelectScreen');
            console.log('[ThemePresets] checkReady attempt', retryCount + 1, '- modeSelectScreen found:', !!modeSelectScreen);
            
            if (modeSelectScreen) {
                console.log('[ThemePresets] Calling addThemeSelector');
                this.addThemeSelector();
            } else {
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log('[ThemePresets] modeSelectScreen not found, retrying in 100ms');
                    setTimeout(checkReady, 100);
                } else {
                    console.warn('[ThemePresets] Max retries reached, modeSelectScreen not found');
                }
            }
        };
        
        if (document.readyState === 'loading') {
            console.log('[ThemePresets] Document still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', checkReady);
        } else {
            console.log('[ThemePresets] Document ready, checking immediately');
            checkReady();
        }
        
        window.addEventListener('load', () => {
            console.log('[ThemePresets] Window loaded, final check in 500ms');
            setTimeout(checkReady, 500);
        });
    },
    
    loadTheme: function() {
        const saved = localStorage.getItem('themePreset');
        console.log('[ThemePresets] loadTheme - saved theme:', saved);
        if (saved && this.themes[saved]) {
            console.log('[ThemePresets] Applying saved theme:', saved);
            this.applyTheme(saved, false); // Don't animate on load
        } else {
            console.log('[ThemePresets] No saved theme or theme not found, using default');
        }
    },
    
    applyTheme: function(themeId, animate = true) {
        console.log('[ThemePresets] applyTheme called with themeId:', themeId, 'animate:', animate);
        const theme = this.themes[themeId];
        if (!theme) {
            console.warn('[ThemePresets] Theme not found:', themeId, 'Available themes:', Object.keys(this.themes));
            return;
        }
        
        const root = document.documentElement;
        const self = this; // Preserve context for RAF callback
        
        // Update state immediately (not visual, so no need to defer)
        this.currentTheme = themeId;
        localStorage.setItem('themePreset', themeId);
        this.updateActiveState();
        
        // Store theme colors before RAF to avoid context issues
        const themeColors = theme.colors ? Object.entries(theme.colors) : [];
        const allThemeProps = new Set();
        Object.values(this.themes).forEach(t => {
            if (t.colors) {
                Object.keys(t.colors).forEach(prop => allThemeProps.add(prop));
            }
        });
        
        // Add theme-transition class for smooth animation
        if (animate) {
            root.classList.add('theme-transition');
            // Force reflow to ensure class is processed before CSS variables change
            void root.offsetHeight;
        }
        
        // Defer CSS variable changes to next frame to ensure transitions trigger
        requestAnimationFrame(() => {
            try {
                console.log('[ThemePresets] Applying CSS variables for theme:', themeId);
                // Apply colors using CSS variables
                if (themeId === 'default') {
                    // Reset to default by removing custom properties
                    console.log('[ThemePresets] Removing', allThemeProps.size, 'custom properties');
                    allThemeProps.forEach(prop => {
                        root.style.removeProperty(prop);
                    });
                } else {
                    // Apply theme colors as CSS variables
                    console.log('[ThemePresets] Setting', themeColors.length, 'CSS variables');
                    themeColors.forEach(([prop, value]) => {
                        root.style.setProperty(prop, value);
                    });
                }
                
                // Remove transition class after animation completes
                if (animate) {
                    setTimeout(() => {
                        root.classList.remove('theme-transition');
                        console.log('[ThemePresets] Removed theme-transition class');
                    }, 300);
                }
            } catch (error) {
                console.error('[ThemePresets] Error applying theme:', error);
            }
        });
    },
    
    addThemeSelector: function() {
        console.log('[ThemePresets] addThemeSelector called');
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) {
            console.warn('[ThemePresets] modeSelectScreen not found');
            return;
        }
        console.log('[ThemePresets] modeSelectScreen found');
        
        // Check if selector already exists
        const existingSelector = document.getElementById('themePresetSelector');
        if (existingSelector) {
            console.log('[ThemePresets] themePresetSelector already exists, skipping');
            return;
        }
        
        console.log('[ThemePresets] Creating theme selector with', Object.keys(this.themes).length, 'themes');
        
        const modeSelectContent = modeSelectScreen.querySelector('.mode-select-content');
        if (!modeSelectContent) {
            console.warn('[ThemePresets] mode-select-content not found in modeSelectScreen');
            return;
        }
        console.log('[ThemePresets] mode-select-content found');
        
        const selector = document.createElement('div');
        selector.id = 'themePresetSelector';
        selector.className = 'theme-preset-selector';
        selector.innerHTML = `
            <div class="theme-preset-label">UI Theme</div>
            <div class="theme-preset-grid">
                ${Object.entries(this.themes).map(([id, theme]) => `
                    <button class="theme-preset-btn ${this.currentTheme === id ? 'active' : ''}" 
                            data-theme="${id}"
                            aria-label="${theme.name} theme"
                            title="${theme.description}">
                        <span class="theme-preset-icon">${theme.icon}</span>
                        <span class="theme-preset-name">${theme.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        // Insert after mode-buttons or at end
        const modeButtons = modeSelectContent.querySelector('.mode-buttons');
        const existingSelectorInContent = modeSelectContent.querySelector('#themePresetSelector');
        
        console.log('[ThemePresets] Inserting selector, modeButtons found:', !!modeButtons);
        
        if (existingSelectorInContent) {
            console.log('[ThemePresets] Replacing existing selector in content');
            existingSelectorInContent.replaceWith(selector);
        } else if (modeButtons && modeButtons.nextSibling) {
            console.log('[ThemePresets] Inserting before modeButtons.nextSibling');
            modeSelectContent.insertBefore(selector, modeButtons.nextSibling);
        } else {
            console.log('[ThemePresets] Appending to modeSelectContent');
            modeSelectContent.appendChild(selector);
        }
        
        console.log('[ThemePresets] Selector inserted into DOM');
        
        // Add click handlers after selector is in DOM
        const self = this; // Preserve context
        const buttons = selector.querySelectorAll('.theme-preset-btn');
        console.log('[ThemePresets] Found', buttons.length, 'theme preset buttons');
        
        buttons.forEach((btn, index) => {
            const themeId = btn.dataset.theme;
            console.log('[ThemePresets] Setting up click handler for button', index, 'themeId:', themeId, 'button:', btn);
            
            // Use both capture and bubble phases, and arrow function to preserve context
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const clickedThemeId = btn.dataset.theme || themeId;
                console.log('[ThemePresets] Button clicked, themeId:', clickedThemeId, 'event:', e);
                if (clickedThemeId) {
                    self.applyTheme(clickedThemeId);
                } else {
                    console.warn('[ThemePresets] No themeId found on clicked button');
                }
            };
            
            btn.addEventListener('click', clickHandler, false);
            console.log('[ThemePresets] Click handler attached to button', index);
        });
        
        // Register with UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            console.log('[ThemePresets] Registering buttons with UnifiedButtonHandler');
            selector.querySelectorAll('.theme-preset-btn').forEach((btn, index) => {
                const themeId = btn.dataset.theme;
                const buttonId = btn.id || `theme-preset-${themeId}`;
                if (!btn.id) btn.id = buttonId;
                
                console.log('[ThemePresets] Registering button', index, 'with id:', buttonId, 'themeId:', themeId);
                
                try {
                    window.UnifiedButtonHandler.registerButton(buttonId, () => {
                        console.log('[ThemePresets] UnifiedButtonHandler triggered, themeId:', themeId);
                        if (themeId) {
                            self.applyTheme(themeId);
                        }
                    });
                    console.log('[ThemePresets] Successfully registered button', buttonId);
                } catch (error) {
                    console.error('[ThemePresets] Error registering button with UnifiedButtonHandler:', error);
                }
            });
        } else {
            console.log('[ThemePresets] UnifiedButtonHandler not available');
        }
        
        console.log('[ThemePresets] addThemeSelector completed successfully');
    },
    
    updateActiveState: function() {
        document.querySelectorAll('.theme-preset-btn').forEach(btn => {
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    // Public method to refresh selector
    refresh: function() {
        this.addThemeSelector();
    }
};

// Export
window.ThemePresets = ThemePresets;

