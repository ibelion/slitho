// ==================== WHAT'S NEW UPDATE PANEL ====================
// Shows update notifications when new features are added
// Reads from data/updates.json

const WhatsNew = {
    currentVersion: null,
    lastSeenVersion: null,
    updates: [],
    panelElement: null,
    
    init: function() {
        this.lastSeenVersion = localStorage.getItem('lastSeenUpdateVersion') || '0.0.0';
        this.loadUpdates();
    },
    
    loadUpdates: async function() {
        try {
            const response = await fetch('data/updates.json');
            if (!response.ok) {
                console.warn('Failed to load updates.json:', response.status);
                return;
            }
            const data = await response.json();
            this.currentVersion = data.version;
            this.updates = data.updates || [];
            
            // Check if there are new updates
            if (this.hasNewUpdates()) {
                // Wait a bit for page to load, then show
                setTimeout(() => {
                    this.showUpdatePanel();
                }, 1000);
            }
        } catch (e) {
            console.warn('Failed to load updates:', e);
        }
    },
    
    hasNewUpdates: function() {
        if (!this.updates || this.updates.length === 0) return false;
        return this.updates.some(update => {
            return this.compareVersions(update.version, this.lastSeenVersion) > 0;
        });
    },
    
    compareVersions: function(v1, v2) {
        if (!v1 || !v2) return 0;
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        return 0;
    },
    
    showUpdatePanel: function() {
        // Don't show if already dismissed or if panel exists
        if (this.panelElement || document.getElementById('whatsNewPanel')) return;
        
        const newUpdates = this.updates.filter(u => 
            this.compareVersions(u.version, this.lastSeenVersion) > 0
        );
        
        if (newUpdates.length === 0) return;
        
        const panel = document.createElement('div');
        panel.id = 'whatsNewPanel';
        panel.className = 'whats-new-panel';
        this.panelElement = panel;
        
        panel.innerHTML = `
            <button class="whats-new-close" id="whatsNewClose" aria-label="Close">&times;</button>
            <div class="whats-new-content">
                <h3>🎉 What's New</h3>
                ${newUpdates.map(update => `
                    <div class="whats-new-item">
                        <div class="whats-new-header">
                            <strong>${update.title}</strong>
                            <span class="whats-new-version">v${update.version}</span>
                        </div>
                        <p>${update.description}</p>
                        ${update.features && update.features.length > 0 ? `
                            <ul class="whats-new-features">
                                ${update.features.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
                <button class="btn" id="whatsNewDismiss">Got it!</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                panel.classList.add('show');
            });
        });
        
        // Setup dismiss handlers
        const dismissBtn = document.getElementById('whatsNewDismiss');
        const closeBtn = document.getElementById('whatsNewClose');
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismiss());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismiss());
        }
        
        // Register with UnifiedButtonHandler if available
        if (window.UnifiedButtonHandler) {
            if (dismissBtn) {
                window.UnifiedButtonHandler.registerButton('whatsNewDismiss', () => this.dismiss());
            }
            if (closeBtn) {
                window.UnifiedButtonHandler.registerButton('whatsNewClose', () => this.dismiss());
            }
        }
    },
    
    dismiss: function() {
        const panel = document.getElementById('whatsNewPanel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => {
                if (panel.parentNode) {
                    panel.parentNode.removeChild(panel);
                }
                this.panelElement = null;
            }, 300);
        }
        this.lastSeenVersion = this.currentVersion || '2.0.0';
        localStorage.setItem('lastSeenUpdateVersion', this.lastSeenVersion);
    }
};

// Export
window.WhatsNew = WhatsNew;

