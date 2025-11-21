// ==================== ERROR HANDLER ====================
// Error boundaries and safe reload behavior

const ErrorHandler = {
    errorCount: 0,
    maxErrors: 10,
    errorLog: [],
    recoveryMode: false
};

// Initialize error handler
function initErrorHandler() {
    // Global error handler
    window.addEventListener('error', (event) => {
        handleError(event.error || event.message, event.filename, event.lineno);
    });
    
    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason, 'Promise', 0);
    });
    
    // Create error boundary UI
    createErrorBoundary();
}

// Handle error
function handleError(error, filename, lineno) {
    ErrorHandler.errorCount++;
    
    const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        filename: filename || 'unknown',
        lineno: lineno || 0,
        timestamp: Date.now()
    };
    
    ErrorHandler.errorLog.push(errorInfo);
    
    // Keep only last 50 errors
    if (ErrorHandler.errorLog.length > 50) {
        ErrorHandler.errorLog.shift();
    }
    
    // Log to console
    console.error('Error caught:', errorInfo);
    
    // Log to debug overlay if available
    if (window.DebugOverlay) {
        window.DebugOverlay.log('error', errorInfo.message, errorInfo);
    }
    
    // Enter recovery mode if too many errors
    if (ErrorHandler.errorCount >= ErrorHandler.maxErrors && !ErrorHandler.recoveryMode) {
        enterRecoveryMode();
    }
}

// Enter recovery mode
function enterRecoveryMode() {
    ErrorHandler.recoveryMode = true;
    
    console.warn('Entering recovery mode due to excessive errors');
    
    // Stop game loop
    if (window.TickEngine) {
        window.TickEngine.stop();
    }
    
    // Show recovery UI
    showRecoveryUI();
    
    // Attempt to save state
    if (window.SaveSystem) {
        try {
            window.SaveSystem.save();
        } catch (e) {
            console.error('Failed to save in recovery mode:', e);
        }
    }
}

// Create error boundary UI
function createErrorBoundary() {
    const boundary = document.createElement('div');
    boundary.id = 'errorBoundary';
    boundary.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 99998;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-family: Arial, sans-serif;
    `;
    
    boundary.innerHTML = `
        <h1 style="color: #ff6b6b; margin-bottom: 20px;">⚠️ Error Detected</h1>
        <p id="errorMessage" style="margin-bottom: 20px; text-align: center; max-width: 600px;"></p>
        <div style="display: flex; gap: 10px;">
            <button id="errorReloadBtn" class="btn" style="background: #4CAF50;">Reload Game</button>
            <button id="errorContinueBtn" class="btn" style="background: #666;">Continue Anyway</button>
        </div>
    `;
    
    document.body.appendChild(boundary);
    
    // Event listeners
    document.getElementById('errorReloadBtn').addEventListener('click', () => {
        safeReload();
    });
    
    document.getElementById('errorContinueBtn').addEventListener('click', () => {
        hideErrorBoundary();
    });
}

// Show error boundary
function showErrorBoundary(message) {
    const boundary = document.getElementById('errorBoundary');
    const messageEl = document.getElementById('errorMessage');
    
    if (boundary && messageEl) {
        messageEl.textContent = message || 'An error occurred. The game may be unstable.';
        boundary.style.display = 'flex';
    }
}

// Hide error boundary
function hideErrorBoundary() {
    const boundary = document.getElementById('errorBoundary');
    if (boundary) {
        boundary.style.display = 'none';
    }
}

// Show recovery UI
function showRecoveryUI() {
    const recovery = document.createElement('div');
    recovery.id = 'recoveryUI';
    recovery.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-family: Arial, sans-serif;
    `;
    
    recovery.innerHTML = `
        <h1 style="color: #ff6b6b; margin-bottom: 20px;">⚠️ Recovery Mode</h1>
        <p style="margin-bottom: 20px; text-align: center; max-width: 600px;">
            The game encountered multiple errors and has entered recovery mode.
            Your progress has been saved. Please reload the game.
        </p>
        <button id="recoveryReloadBtn" class="btn" style="background: #4CAF50; padding: 15px 30px; font-size: 1.2em;">
            Reload Game
        </button>
    `;
    
    document.body.appendChild(recovery);
    
    document.getElementById('recoveryReloadBtn').addEventListener('click', () => {
        safeReload();
    });
}

// Safe reload
function safeReload() {
    // Save state before reload
    if (window.SaveSystem) {
        try {
            window.SaveSystem.save();
        } catch (e) {
            console.error('Failed to save before reload:', e);
        }
    }
    
    // Clear error state
    ErrorHandler.errorCount = 0;
    ErrorHandler.recoveryMode = false;
    
    // Reload page
    window.location.reload();
}

// Compatibility check for save files
function checkSaveCompatibility(saveData) {
    if (!saveData || !saveData.version) {
        return { compatible: false, reason: 'Invalid save data' };
    }
    
    const currentVersion = window.SaveSystem ? 3 : 1;
    const saveVersion = saveData.version;
    
    if (saveVersion > currentVersion) {
        return { 
            compatible: false, 
            reason: `Save file version (${saveVersion}) is newer than game version (${currentVersion})` 
        };
    }
    
    if (saveVersion < currentVersion - 2) {
        return { 
            compatible: false, 
            reason: `Save file version (${saveVersion}) is too old` 
        };
    }
    
    return { compatible: true, needsMigration: saveVersion < currentVersion };
}

// Export
window.ErrorHandler = {
    ...ErrorHandler,
    init: initErrorHandler,
    handle: handleError,
    showBoundary: showErrorBoundary,
    hideBoundary: hideErrorBoundary,
    safeReload,
    checkCompatibility: checkSaveCompatibility,
    getErrorLog: () => [...ErrorHandler.errorLog]
};

