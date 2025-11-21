// ==================== WORLD MAP SYSTEM ====================
// Node-based world map with unlocking rules and animations

let worldMapData = null;
let unlockedNodes = new Set(['forest']); // Start with forest unlocked
let worldMapCanvas = null;
let worldMapCtx = null;

// World map JSON structure
const WORLD_MAP_STRUCTURE = {
    nodes: [
        {
            id: 'forest',
            name: 'Forest',
            x: 100,
            y: 150,
            icon: '🌲',
            color: '#4CAF50',
            levels: [1, 2, 3],
            boss: 'forest_guardian',
            minigames: ['fruit_rush'],
            connections: ['desert', 'ice_caves']
        },
        {
            id: 'desert',
            name: 'Desert',
            x: 300,
            y: 150,
            icon: '🏜️',
            color: '#ff9800',
            levels: [4, 5, 6],
            boss: 'sand_worm',
            minigames: ['avoider'],
            connections: ['forest', 'volcano'],
            locked: true
        },
        {
            id: 'ice_caves',
            name: 'Ice Caves',
            x: 100,
            y: 350,
            icon: '❄️',
            color: '#2196f3',
            levels: [7, 8, 9],
            boss: 'ice_queen',
            minigames: ['precision_bite'],
            connections: ['forest', 'volcano'],
            locked: true
        },
        {
            id: 'volcano',
            name: 'Volcano',
            x: 300,
            y: 350,
            icon: '🌋',
            color: '#f44336',
            levels: [10, 11, 12],
            boss: 'lava_titan',
            minigames: [],
            connections: ['desert', 'ice_caves'],
            locked: true
        }
    ]
};

// Initialize world map
function initWorldMap() {
    worldMapData = WORLD_MAP_STRUCTURE;
    loadUnlockedNodes();
    
    // Create canvas if it doesn't exist
    if (!worldMapCanvas) {
        worldMapCanvas = document.createElement('canvas');
        worldMapCanvas.id = 'worldMapCanvas';
        worldMapCanvas.width = 600;
        worldMapCanvas.height = 600;
        worldMapCanvas.style.cssText = `
            border: 2px solid var(--border-color);
            border-radius: 10px;
            cursor: pointer;
            background: var(--bg-secondary);
        `;
        worldMapCtx = worldMapCanvas.getContext('2d');
    }
    
    renderWorldMap();
    setupWorldMapEvents();
}

// Render world map
function renderWorldMap() {
    if (!worldMapCtx || !worldMapData) return;
    
    const ctx = worldMapCtx;
    ctx.clearRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);
    
    // Draw connections (paths)
    worldMapData.nodes.forEach(node => {
        if (!unlockedNodes.has(node.id)) return;
        
        node.connections.forEach(connectionId => {
            const connectedNode = worldMapData.nodes.find(n => n.id === connectionId);
            if (connectedNode && unlockedNodes.has(connectionId)) {
                // Draw path
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(connectedNode.x, connectedNode.y);
                ctx.stroke();
                
                // Animate path reveal
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    });
    
    // Draw nodes
    worldMapData.nodes.forEach(node => {
        const isUnlocked = unlockedNodes.has(node.id);
        const isLocked = node.locked && !isUnlocked;
        
        // Node circle
        ctx.fillStyle = isUnlocked ? node.color : '#666';
        ctx.strokeStyle = isUnlocked ? '#fff' : '#333';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Lock icon if locked
        if (isLocked) {
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', node.x, node.y + 10);
        } else {
            // Node icon
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.icon, node.x, node.y + 10);
        }
        
        // Node name
        ctx.fillStyle = isUnlocked ? '#fff' : '#999';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + 60);
    });
}

// Setup click events for nodes
function setupWorldMapEvents() {
    if (!worldMapCanvas) return;
    
    worldMapCanvas.addEventListener('click', (e) => {
        const rect = worldMapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check which node was clicked
        worldMapData.nodes.forEach(node => {
            const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dist < 40) {
                if (unlockedNodes.has(node.id)) {
                    openNodeMenu(node);
                } else {
                    // Show locked message
                    alert(`${node.name} is locked! Complete connected areas to unlock.`);
                }
            }
        });
    });
}

// Open node menu (levels, boss, minigames)
function openNodeMenu(node) {
    const menu = document.createElement('div');
    menu.className = 'world-map-node-menu';
    menu.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-tertiary);
        border: 2px solid var(--border-color);
        border-radius: 10px;
        padding: 20px;
        z-index: 10001;
        min-width: 300px;
    `;
    
    menu.innerHTML = `
        <h2>${node.icon} ${node.name}</h2>
        <div style="margin: 20px 0;">
            <h3>Levels</h3>
            <div id="nodeLevels" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;"></div>
        </div>
        ${node.boss ? `
            <div style="margin: 20px 0;">
                <h3>Boss</h3>
                <button class="btn" id="worldMapBossBtn_${node.boss}" style="margin-top: 10px;">
                    Fight ${node.boss.replace('_', ' ')}
                </button>
            </div>
        ` : ''}
        ${node.minigames && node.minigames.length > 0 ? `
            <div style="margin: 20px 0;">
                <h3>Minigames</h3>
                <div id="nodeMinigames" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;"></div>
            </div>
        ` : ''}
        <button class="btn" id="worldMapCloseBtn" style="margin-top: 20px; width: 100%;">Close</button>
    `;
    
    // Add levels
    const levelsDiv = menu.querySelector('#nodeLevels');
    node.levels.forEach(level => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.id = `worldMapLevelBtn_${level}`;
        btn.textContent = `Level ${level}`;
        
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(btn, () => {
                console.log(`[Button] World Map Level clicked: ${level}`);
                startLevelFromMap(level);
                closeNodeMenu();
            });
        } else {
            btn.onclick = () => {
                startLevelFromMap(level);
                closeNodeMenu();
            };
        }
        
        levelsDiv.appendChild(btn);
    });
    
    // Add minigames
    if (node.minigames && node.minigames.length > 0) {
        const minigamesDiv = menu.querySelector('#nodeMinigames');
        node.minigames.forEach(minigame => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.id = `worldMapMinigameBtn_${minigame}`;
            btn.textContent = minigame.replace('_', ' ');
            
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(btn, () => {
                    console.log(`[Button] World Map Minigame clicked: ${minigame}`);
                    startMinigameFromMap(minigame);
                    closeNodeMenu();
                });
            } else {
                btn.onclick = () => {
                    startMinigameFromMap(minigame);
                    closeNodeMenu();
                };
            }
            
            minigamesDiv.appendChild(btn);
        });
    }
    
    // Register boss button if exists
    if (node.boss) {
        const bossBtn = menu.querySelector(`#worldMapBossBtn_${node.boss}`);
        if (bossBtn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(bossBtn, () => {
                    console.log(`[Button] World Map Boss clicked: ${node.boss}`);
                    startBossBattle(node.boss);
                    closeNodeMenu();
                });
            } else {
                bossBtn.onclick = () => {
                    startBossBattle(node.boss);
                    closeNodeMenu();
                };
            }
        }
    }
    
    // Register close button
    const closeBtn = menu.querySelector('#worldMapCloseBtn');
    if (closeBtn) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(closeBtn, () => {
                console.log('[Button] World Map Close clicked');
                closeNodeMenu();
            });
        } else {
            closeBtn.onclick = closeNodeMenu;
        }
    }
    
    document.body.appendChild(menu);
    
    // Add ESC key handler for closing menu
    const escHandler = (e) => {
        if (e.key === 'Escape' && document.querySelector('.world-map-node-menu')) {
            e.preventDefault();
            closeNodeMenu();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Close node menu
function closeNodeMenu() {
    const menu = document.querySelector('.world-map-node-menu');
    if (menu) menu.remove();
}

// Start level from world map
function startLevelFromMap(level) {
    currentLevel = level;
    targetScore = getCurrentLevelConfig().targetScore;
    hideWorldMap();
    init();
}

// Start minigame from world map
function startMinigameFromMap(minigameId) {
    hideWorldMap();
    if (window.loadMinigame) {
        window.loadMinigame(minigameId);
    }
}

// Start boss battle from world map
function startBossBattle(bossId) {
    hideWorldMap();
    initBossMode();
}

// Unlock node (called when completing a node's content)
function unlockNode(nodeId) {
    if (!unlockedNodes.has(nodeId)) {
        unlockedNodes.add(nodeId);
        saveUnlockedNodes();
        
        // Animate unlock
        const node = worldMapData.nodes.find(n => n.id === nodeId);
        if (node) {
            // Unlock connected nodes
            node.connections.forEach(connId => {
                const connNode = worldMapData.nodes.find(n => n.id === connId);
                if (connNode && connNode.locked) {
                    connNode.locked = false;
                }
            });
        }
        
        renderWorldMap();
    }
}

// Save unlocked nodes
function saveUnlockedNodes() {
    localStorage.setItem('unlockedNodes', JSON.stringify(Array.from(unlockedNodes)));
}

// Load unlocked nodes
function loadUnlockedNodes() {
    const saved = localStorage.getItem('unlockedNodes');
    if (saved) {
        unlockedNodes = new Set(JSON.parse(saved));
    }
}

// Show world map
function showWorldMap() {
    const container = document.getElementById('worldMapContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'worldMapContainer';
        newContainer.className = 'world-map-container';
        newContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 20px; text-align: center;';
        header.innerHTML = `
            <h1 style="color: white; margin-bottom: 10px;">World Map</h1>
            <button class="btn" id="worldMapCloseBtnMain">Close</button>
        `;
        
        // Register close button
        const closeBtnMain = header.querySelector('#worldMapCloseBtnMain');
        if (closeBtnMain) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(closeBtnMain, () => {
                    console.log('[Button] World Map Close (Main) clicked');
                    hideWorldMap();
                });
            } else {
                closeBtnMain.onclick = hideWorldMap;
            }
        }
        
        newContainer.appendChild(header);
        newContainer.appendChild(worldMapCanvas);
        document.body.appendChild(newContainer);
    } else {
        container.style.display = 'flex';
    }
    
    initWorldMap();
}

// Hide world map
function hideWorldMap() {
    const container = document.getElementById('worldMapContainer');
    if (container) {
        container.style.display = 'none';
    }
}

// Export functions
window.showWorldMap = showWorldMap;
window.hideWorldMap = hideWorldMap;
window.unlockNode = unlockNode;
window.initWorldMap = initWorldMap;

