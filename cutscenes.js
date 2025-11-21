// ==================== CUTSCENE SYSTEM ====================
// JSON-driven cutscene engine with timed text, animations, fades, zooms, and camera pans

let currentCutscene = null;
let cutsceneIndex = 0;
let cutsceneSkippable = true;
let cutsceneContainer = null;

// Initialize cutscene container
function initCutsceneSystem() {
    if (!cutsceneContainer) {
        cutsceneContainer = document.createElement('div');
        cutsceneContainer.id = 'cutsceneContainer';
        cutsceneContainer.className = 'cutscene-container';
        cutsceneContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;
        document.body.appendChild(cutsceneContainer);
    }
}

// Export init function
window.initCutsceneSystem = initCutsceneSystem;

// Show text box with timed display
function showTextBox(text, duration = 3000) {
    return new Promise((resolve) => {
        if (!cutsceneContainer) initCutsceneSystem();
        
        // Remove existing text box
        const existing = cutsceneContainer.querySelector('.cutscene-textbox');
        if (existing) existing.remove();
        
        const textBox = document.createElement('div');
        textBox.className = 'cutscene-textbox';
        textBox.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 30px 40px;
            border-radius: 10px;
            font-size: 1.5em;
            text-align: center;
            max-width: 80%;
            border: 2px solid #4CAF50;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        textBox.textContent = text;
        
        cutsceneContainer.appendChild(textBox);
        fadeIn(textBox, 300);
        
        setTimeout(() => {
            fadeOut(textBox, 300).then(() => {
                textBox.remove();
                resolve();
            });
        }, duration);
    });
}

// Fade in element
function fadeIn(element, time = 500) {
    return new Promise((resolve) => {
        element.style.opacity = '0';
        element.style.transition = `opacity ${time}ms ease`;
        setTimeout(() => {
            element.style.opacity = '1';
            setTimeout(resolve, time);
        }, 10);
    });
}

// Fade out element
function fadeOut(element, time = 500) {
    return new Promise((resolve) => {
        element.style.transition = `opacity ${time}ms ease`;
        element.style.opacity = '0';
        setTimeout(() => {
            resolve();
        }, time);
    });
}

// Move camera to position (simulated with canvas transform)
let cameraX = 0;
let cameraY = 0;
let cameraTargetX = 0;
let cameraTargetY = 0;
let cameraMoving = false;

function moveCameraTo(x, y, time = 1000) {
    return new Promise((resolve) => {
        cameraTargetX = x;
        cameraTargetY = y;
        cameraMoving = true;
        
        const startX = cameraX;
        const startY = cameraY;
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / time, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            cameraX = startX + (cameraTargetX - startX) * eased;
            cameraY = startY + (cameraTargetY - startY) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                cameraMoving = false;
                resolve();
            }
        }
        
        animate();
    });
}

// Play character animation (placeholder - can be extended with sprites)
const characterAnimations = {};

function playCharacterAnimation(name) {
    return new Promise((resolve) => {
        // Create animation element if it doesn't exist
        let animElement = cutsceneContainer.querySelector(`.character-${name}`);
        if (!animElement) {
            animElement = document.createElement('div');
            animElement.className = `character-${name}`;
            animElement.style.cssText = `
                position: absolute;
                font-size: 4em;
                transition: transform 0.3s ease;
            `;
            cutsceneContainer.appendChild(animElement);
        }
        
        // Simple animation example
        animElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            animElement.style.transform = 'scale(1)';
            setTimeout(resolve, 300);
        }, 300);
    });
}

// Play a cutscene from JSON data
async function playCutscene(cutsceneData) {
    if (!cutsceneData || !cutsceneData.sequences) return;
    
    currentCutscene = cutsceneData;
    cutsceneIndex = 0;
    cutsceneSkippable = cutsceneData.skippable !== false;
    
    if (!cutsceneContainer) initCutsceneSystem();
    cutsceneContainer.style.display = 'flex';
    cutsceneContainer.style.opacity = '0';
    fadeIn(cutsceneContainer, 500);
    
    // Add skip button (more accessible than just hint)
    if (cutsceneSkippable) {
        const skipButton = document.createElement('button');
        skipButton.id = 'cutsceneSkipBtn';
        skipButton.className = 'cutscene-skip-btn';
        skipButton.textContent = 'Skip';
        skipButton.setAttribute('aria-label', 'Skip cutscene');
        skipButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            z-index: 1000;
        `;
        
        // Register skip button
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(skipButton, () => {
                console.log('[Button] Cutscene Skip clicked');
                skipCutscene();
            });
        } else {
            skipButton.onclick = () => skipCutscene();
        }
        
        cutsceneContainer.appendChild(skipButton);
    }
    
    // Process sequences
    for (let i = 0; i < cutsceneData.sequences.length; i++) {
        if (currentCutscene !== cutsceneData) break; // Was skipped
        
        const sequence = cutsceneData.sequences[i];
        cutsceneIndex = i;
        
        switch (sequence.type) {
            case 'text':
                await showTextBox(sequence.text, sequence.duration || 3000);
                break;
                
            case 'fadeIn':
                await fadeIn(cutsceneContainer, sequence.duration || 500);
                break;
                
            case 'fadeOut':
                await fadeOut(cutsceneContainer, sequence.duration || 500);
                break;
                
            case 'cameraPan':
                await moveCameraTo(sequence.x || 0, sequence.y || 0, sequence.duration || 1000);
                break;
                
            case 'characterAnimation':
                await playCharacterAnimation(sequence.name || 'default');
                break;
                
            case 'wait':
                await new Promise(resolve => setTimeout(resolve, sequence.duration || 1000));
                break;
                
            case 'zoom':
                // Apply zoom to canvas
                const canvasWrapper = document.getElementById('canvasWrapper');
                if (canvasWrapper) {
                    canvasWrapper.style.transition = `transform ${sequence.duration || 1000}ms ease`;
                    canvasWrapper.style.transform = `scale(${sequence.scale || 1.5})`;
                    await new Promise(resolve => setTimeout(resolve, sequence.duration || 1000));
                    canvasWrapper.style.transform = 'scale(1)';
                }
                break;
        }
    }
    
    // End cutscene
    await fadeOut(cutsceneContainer, 500);
    cutsceneContainer.style.display = 'none';
    cutsceneContainer.innerHTML = '';
    currentCutscene = null;
}

// Skip current cutscene
function skipCutscene() {
    if (currentCutscene && cutsceneSkippable) {
        currentCutscene = null;
        if (cutsceneContainer) {
            cutsceneContainer.style.display = 'none';
            cutsceneContainer.innerHTML = '';
        }
    }
}

// Keyboard listener for skipping (prevent duplicate listeners)
if (!window._cutsceneSkipListenerRegistered) {
    document.addEventListener('keydown', (e) => {
        // Only skip if cutscene is active and no modal is open
        const activeModal = document.querySelector('.modal.show');
        if (!activeModal && (e.key === ' ' || e.key === 'Enter') && currentCutscene && cutsceneSkippable) {
            e.preventDefault();
            skipCutscene();
        }
    });
    window._cutsceneSkipListenerRegistered = true;
}

// Example cutscene data structures
const CUTSCENE_TEMPLATES = {
    bossIntro: {
        skippable: true,
        sequences: [
            { type: 'text', text: 'A powerful enemy approaches...', duration: 2000 },
            { type: 'wait', duration: 500 },
            { type: 'text', text: 'Prepare yourself!', duration: 2000 },
            { type: 'fadeOut', duration: 500 }
        ]
    },
    missionComplete: {
        skippable: true,
        sequences: [
            { type: 'text', text: 'Mission Complete!', duration: 2000 },
            { type: 'wait', duration: 500 },
            { type: 'text', text: 'Rewards earned!', duration: 2000 }
        ]
    },
    worldProgression: {
        skippable: true,
        sequences: [
            { type: 'text', text: 'New area unlocked!', duration: 2000 },
            { type: 'cameraPan', x: 100, y: 100, duration: 1500 },
            { type: 'zoom', scale: 1.5, duration: 1000 },
            { type: 'fadeOut', duration: 500 }
        ]
    }
};

// Export functions
window.playCutscene = playCutscene;
window.showTextBox = showTextBox;
window.fadeIn = fadeIn;
window.fadeOut = fadeOut;
window.moveCameraTo = moveCameraTo;
window.playCharacterAnimation = playCharacterAnimation;
window.skipCutscene = skipCutscene;
window.CUTSCENE_TEMPLATES = CUTSCENE_TEMPLATES;

