// ==================== CLASSIC MODE LOADER ====================
// Minimal loader that initializes Classic Mode
// This file is dynamically loaded by classic.html with fallback handling

(function() {
    'use strict';
    
    console.log('[ClassicMode] classic.js loaded, initializing Classic Mode...');
    
    // Wait for game.js to be fully loaded and initClassicMode to be available
    function initializeClassicMode() {
        // Check if initClassicMode is available
        const initFunc = typeof initClassicMode === 'function' ? initClassicMode : 
                        (typeof window.initClassicMode === 'function' ? window.initClassicMode : null);
        
        if (initFunc) {
            console.log('[ClassicMode] Calling initClassicMode()');
            try {
                initFunc();
                
                // Show game screen (classic.html doesn't have mode select screen)
                const gameScreenEl = document.getElementById('gameScreen');
                if (gameScreenEl) {
                    gameScreenEl.style.setProperty('display', 'flex', 'important');
                }
                
                // Set up mode select button to return to main menu
                const modeSelectBtn = document.getElementById('modeSelectBtn');
                if (modeSelectBtn && !modeSelectBtn._classicListenerAdded) {
                    modeSelectBtn.addEventListener('click', function() {
                        console.log('[ClassicMode] Returning to main menu');
                        window.location.href = 'index.html';
                    });
                    modeSelectBtn._classicListenerAdded = true;
                }
                
                // Set global flag to indicate Classic Mode has loaded
                window.classicLoaded = true;
                console.log('[ClassicMode] Classic Mode initialized successfully');
            } catch (error) {
                console.error('[ClassicMode] Error initializing Classic Mode:', error);
                window.classicLoaded = false;
            }
        } else {
            console.error('[ClassicMode] initClassicMode function not found');
            // Try to wait a bit more for game.js to load
            if (document.readyState === 'loading') {
                setTimeout(initializeClassicMode, 100);
            } else {
                // If still not available after waiting, set flag to false
                window.classicLoaded = false;
            }
        }
    }
    
    // Try to initialize immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initializeClassicMode();
    } else {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', initializeClassicMode);
    }
    
    // Also try on window load as backup
    window.addEventListener('load', function() {
        setTimeout(initializeClassicMode, 100);
    });
    
    // Expose initialization function globally
    window.initClassicModeFromLoader = initializeClassicMode;
})();

