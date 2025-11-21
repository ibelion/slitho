// ==================== INTERACTIVE ROADMAP ====================
// Displays development roadmap with filtering by status
// Editable via data/roadmap.json for buyers

const Roadmap = {
    items: [],
    currentFilter: 'all',
    initialized: false,
    
    init: async function() {
        if (this.initialized) return;
        this.initialized = true;
        
        await this.loadRoadmap();
        this.createRoadmapModal();
        this.setupButton();
    },
    
    loadRoadmap: async function() {
        try {
            const response = await fetch('data/roadmap.json');
            if (!response.ok) {
                console.warn('Failed to load roadmap.json:', response.status);
                this.items = [];
                return;
            }
            const data = await response.json();
            this.items = data.items || [];
        } catch (e) {
            console.warn('Failed to load roadmap:', e);
            this.items = [];
        }
    },
    
    createRoadmapModal: function() {
        if (document.getElementById('roadmapModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'roadmapModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>🗺️ Development Roadmap</h2>
                    <button class="modal-close" id="roadmapClose" aria-label="Close Roadmap">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="roadmap-filters">
                        <button class="roadmap-filter-btn active" data-status="all" id="roadmapFilterAll">All</button>
                        <button class="roadmap-filter-btn" data-status="planned" id="roadmapFilterPlanned">📋 Planned</button>
                        <button class="roadmap-filter-btn" data-status="in_progress" id="roadmapFilterInProgress">🚧 In Progress</button>
                        <button class="roadmap-filter-btn" data-status="completed" id="roadmapFilterCompleted">✅ Completed</button>
                    </div>
                    <div id="roadmapContent" class="roadmap-content"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup filters
        const filterButtons = modal.querySelectorAll('.roadmap-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                this.render(status);
                
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = status;
            });
            
            // Register with UnifiedButtonHandler
            if (window.UnifiedButtonHandler && btn.id) {
                window.UnifiedButtonHandler.registerButton(btn.id, () => {
                    const status = btn.dataset.status;
                    this.render(status);
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentFilter = status;
                });
            }
        });
        
        // Register close button
        const closeBtn = document.getElementById('roadmapClose');
        if (closeBtn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('roadmapClose', () => {
                    window.UnifiedButtonHandler.closeModal('roadmapModal');
                });
            } else {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
        }
    },
    
    setupButton: function() {
        // Add button to mode select screen
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) return;
        
        // Check if button already exists
        let btn = document.getElementById('roadmapBtn');
        
        if (!btn) {
            // Create button if it doesn't exist
            const modeSelectContent = modeSelectScreen.querySelector('.mode-select-content');
            if (!modeSelectContent) return;
            
            btn = document.createElement('button');
            btn.id = 'roadmapBtn';
            btn.className = 'btn';
            btn.innerHTML = '🗺️ Roadmap';
            btn.style.cssText = 'margin-top: var(--spacing-md);';
            btn.setAttribute('aria-label', 'View Development Roadmap');
            
            // Insert after other buttons
            const existingBtn = modeSelectContent.querySelector('#progressionDashboardBtn');
            if (existingBtn && existingBtn.nextSibling) {
                modeSelectContent.insertBefore(btn, existingBtn.nextSibling);
            } else {
                modeSelectContent.appendChild(btn);
            }
        }
        
        // Always register click handler (even if button already existed)
        if (!btn) {
            console.warn('[Roadmap] Button not found for setup');
            return;
        }
        
        const showRoadmap = () => {
            console.log('[Roadmap] Showing roadmap');
            this.show();
        };
        
        // Try to register with UnifiedButtonHandler first
        let registeredWithHandler = false;
        if (window.UnifiedButtonHandler && typeof window.UnifiedButtonHandler.registerButton === 'function') {
            try {
                registeredWithHandler = window.UnifiedButtonHandler.registerButton('roadmapBtn', showRoadmap);
                if (registeredWithHandler) {
                    console.log('[Roadmap] Registered with UnifiedButtonHandler');
                } else {
                    console.warn('[Roadmap] Failed to register with UnifiedButtonHandler');
                }
            } catch (e) {
                console.warn('[Roadmap] Error registering with UnifiedButtonHandler:', e);
            }
        }
        
        // Add direct event listener only if UnifiedButtonHandler registration failed
        if (!registeredWithHandler) {
            console.log('[Roadmap] Adding direct click handler as fallback');
            const currentBtn = document.getElementById('roadmapBtn');
            if (currentBtn) {
                // Remove any existing direct listeners by cloning
                const newBtn = currentBtn.cloneNode(true);
                if (currentBtn.parentNode) {
                    currentBtn.parentNode.replaceChild(newBtn, currentBtn);
                }
                
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Roadmap] Direct click handler triggered');
                    showRoadmap();
                };
                
                newBtn.addEventListener('click', clickHandler);
                console.log('[Roadmap] Direct click handler added');
            }
        } else {
            console.log('[Roadmap] Using UnifiedButtonHandler, skipping direct listener');
        }
    },
    
    render: function(filterStatus = 'all') {
        const content = document.getElementById('roadmapContent');
        if (!content) return;
        
        // Reload roadmap data
        this.loadRoadmap();
        
        const filtered = filterStatus === 'all' 
            ? this.items 
            : this.items.filter(item => item.status === filterStatus);
        
        if (filtered.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">No items in this category.</p>';
            return;
        }
        
        content.innerHTML = filtered.map(item => `
            <div class="roadmap-item roadmap-${item.status}">
                <div class="roadmap-item-header">
                    <h3>${item.title}</h3>
                    <span class="roadmap-status-badge status-${item.status}">${this.formatStatus(item.status)}</span>
                </div>
                <p class="roadmap-description">${item.description}</p>
                ${item.category ? `<span class="roadmap-category">${item.category}</span>` : ''}
            </div>
        `).join('');
    },
    
    formatStatus: function(status) {
        const map = {
            'planned': '📋 Planned',
            'in_progress': '🚧 In Progress',
            'completed': '✅ Completed'
        };
        return map[status] || status;
    },
    
    show: function() {
        this.render(this.currentFilter);
        const modal = document.getElementById('roadmapModal');
        if (modal) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.openModal('roadmapModal');
            } else {
                modal.classList.add('show');
            }
        }
    }
};

// Export
window.Roadmap = Roadmap;

