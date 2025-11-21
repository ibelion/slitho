// ==================== HOME PAGE ANIMATION SYSTEM ====================
// Subtle entrance animations and micro-interactions for the mode select screen
// Respects reduced motion preferences and accessibility settings

const HomeAnimations = {
    enabled: true,
    reducedMotion: false,
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Check for reduced motion preference
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Check accessibility settings
        if (window.Accessibility && window.Accessibility.settings && window.Accessibility.settings.lowMotion) {
            this.reducedMotion = true;
        }
        
        // Wait for mode select screen to be ready
        // Use multiple attempts to catch when DOM is ready
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(() => {
            attempts++;
            const modeSelectScreen = document.getElementById('modeSelectScreen');
            if (modeSelectScreen || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (modeSelectScreen) {
                    this.setupAnimations();
                }
            }
        }, 100);
        
        // Also try on DOMContentLoaded and load events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        }
        window.addEventListener('load', () => this.setupAnimations());
    },
    
    setupAnimations: function() {
        if (!this.enabled || this.reducedMotion) return;
        
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) return;
        
        // Add entrance animations to sections
        this.animateEntrance();
        
        // Add hover micro-interactions
        this.setupHoverInteractions();
        
        // Add card animations
        this.setupCardAnimations();
        
        // Re-setup when mode select screen is shown
        const observer = new MutationObserver(() => {
            // Check both inline style and computed style to handle 'important' flag
            const inlineDisplay = modeSelectScreen.style.display;
            const computedDisplay = window.getComputedStyle(modeSelectScreen).display;
            const isVisible = (inlineDisplay !== 'none' && inlineDisplay !== '') || 
                             (computedDisplay !== 'none' && !modeSelectScreen.hasAttribute('data-game-active'));
            
            if (isVisible) {
                // Small delay to ensure elements are visible
                setTimeout(() => {
                    this.animateEntrance();
                }, 50);
            }
        });
        
        observer.observe(modeSelectScreen, {
            attributes: true,
            attributeFilter: ['style']
        });
    },
    
    animateEntrance: function() {
        if (this.reducedMotion) return;
        
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) return;
        
        // Check both inline style and computed style, and data attribute
        const inlineDisplay = modeSelectScreen.style.display;
        const computedDisplay = window.getComputedStyle(modeSelectScreen).display;
        const hasDataGameActive = modeSelectScreen.hasAttribute('data-game-active');
        
        if (inlineDisplay === 'none' || computedDisplay === 'none' || hasDataGameActive) return;
        
        const logo = document.querySelector('.mode-select-content .app-logo');
        const buttons = document.querySelectorAll('.mode-buttons .btn, .mode-select-content .btn');
        
        // Logo fade and slide
        if (logo && !logo.dataset.animated) {
            logo.dataset.animated = 'true';
            logo.style.opacity = '0';
            logo.style.transform = 'translateY(-20px)';
            logo.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    logo.style.opacity = '1';
                    logo.style.transform = 'translateY(0)';
                });
            });
        }
        
        // Stagger button animations
        buttons.forEach((btn, index) => {
            if (btn.dataset.animated) return;
            btn.dataset.animated = 'true';
            
            // Set initial state
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px) scale(0.95)';
            btn.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
            
            // Ensure buttons become visible with multiple fallbacks
            const makeVisible = () => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0) scale(1)';
            };
            
            requestAnimationFrame(() => {
                setTimeout(makeVisible, 50);
                // Fallback in case animation fails
                setTimeout(makeVisible, 1000);
            });
        });
    },
    
    setupHoverInteractions: function() {
        if (this.reducedMotion) return;
        
        const buttons = document.querySelectorAll('.mode-buttons .btn, .btn');
        const cards = document.querySelectorAll('.mode-buttons .btn');
        
        buttons.forEach(btn => {
            // Skip if already has listeners
            if (btn.dataset.hoverSetup) return;
            btn.dataset.hoverSetup = 'true';
            
            // Add hover effect
            btn.addEventListener('mouseenter', function() {
                if (HomeAnimations.reducedMotion) return;
                this.style.transform = 'translateY(-2px) scale(1.02)';
                this.style.boxShadow = 'var(--shadow-elevation-3)';
            });
            
            btn.addEventListener('mouseleave', function() {
                if (HomeAnimations.reducedMotion) return;
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = 'var(--shadow-elevation-1)';
            });
            
            // Add click ripple effect
            btn.addEventListener('click', function(e) {
                if (HomeAnimations.reducedMotion) return;
                
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                    animation: ripple 0.6s ease-out;
                    z-index: 1;
                `;
                
                // Ensure parent has relative positioning
                const originalPosition = window.getComputedStyle(this).position;
                if (originalPosition === 'static') {
                    this.style.position = 'relative';
                }
                
                this.appendChild(ripple);
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.remove();
                    }
                    if (originalPosition === 'static') {
                        this.style.position = '';
                    }
                }, 600);
            });
        });
    },
    
    setupCardAnimations: function() {
        if (this.reducedMotion) return;
        
        // Add subtle pulse to logo icon
        const logoIcon = document.querySelector('.app-logo-icon');
        if (logoIcon && !logoIcon.dataset.pulseSetup) {
            logoIcon.dataset.pulseSetup = 'true';
            
            // Only animate when mode select is visible
            const checkVisibility = () => {
                const modeSelectScreen = document.getElementById('modeSelectScreen');
                if (modeSelectScreen) {
                    const inlineDisplay = modeSelectScreen.style.display;
                    const computedDisplay = window.getComputedStyle(modeSelectScreen).display;
                    const hasDataGameActive = modeSelectScreen.hasAttribute('data-game-active');
                    const isVisible = (inlineDisplay !== 'none' && inlineDisplay !== '') || 
                                     (computedDisplay !== 'none' && !hasDataGameActive);
                    
                    if (isVisible) {
                        logoIcon.style.animation = 'subtlePulse 2s ease-in-out infinite';
                    } else {
                        logoIcon.style.animation = 'none';
                    }
                } else {
                    logoIcon.style.animation = 'none';
                }
            };
            
            // Check periodically
            setInterval(checkVisibility, 100);
            checkVisibility();
        }
    },
    
    // Public method to re-initialize when needed
    refresh: function() {
        this.setupAnimations();
    }
};

// Export
window.HomeAnimations = HomeAnimations;

