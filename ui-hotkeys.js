// ==================== UI HOTKEYS PANEL ====================
// Modern, minimal hotkey helper UI.
// NOTE: Pure UI only – does NOT modify gameplay, movement, collisions, or tick logic.

(function () {
    const UIHotkeys = {
        toggleButton: null,
        panel: null,
        hasAutoHidden: false,

        init() {
            // Ensure DOM is available
            if (!document || !document.body) return;

            this.createElements();
            this.attachListeners();
        },

        createElements() {
            // Create toggle button (floating in top-right corner)
            const toggle = document.createElement('button');
            toggle.id = 'hotkeyToggle';
            toggle.className = 'icon-btn hotkey-toggle';
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Show hotkeys');
            toggle.innerText = '?';

            // Create panel
            const panel = document.createElement('div');
            panel.id = 'hotkeyPanel';
            panel.className = 'hotkey-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', 'Keyboard hotkeys');
            panel.setAttribute('aria-hidden', 'true');

            panel.innerHTML = `
                <div class="hotkey-panel-header">
                    <span class="hotkey-title">Hotkeys</span>
                    <button type="button" class="hotkey-close-btn" aria-label="Close hotkeys">&times;</button>
                </div>
                <ul class="hotkey-list">
                    <li><span class="hotkey-label">Move</span><span class="hotkey-keys">Arrow Keys / WASD</span></li>
                    <li><span class="hotkey-label">Pause</span><span class="hotkey-keys">P</span></li>
                    <li><span class="hotkey-label">Restart</span><span class="hotkey-keys">R</span></li>
                    <li><span class="hotkey-label">Menu</span><span class="hotkey-keys">ESC</span></li>
                    <li><span class="hotkey-label">Toggle Theme</span><span class="hotkey-keys">T</span></li>
                </ul>
            `;

            document.body.appendChild(toggle);
            document.body.appendChild(panel);

            this.toggleButton = toggle;
            this.panel = panel;
        },

        attachListeners() {
            if (!this.toggleButton || !this.panel) return;

            const panel = this.panel;

            const closeBtn = panel.querySelector('.hotkey-close-btn');
            const toggleHandler = () => this.togglePanel();
            const closeHandler = () => this.hidePanel();

            // Use unified button handler if available for consistency
            if (window.UnifiedButtonHandler && typeof window.UnifiedButtonHandler.registerButton === 'function') {
                window.UnifiedButtonHandler.registerButton(this.toggleButton, toggleHandler);
                if (closeBtn) {
                    window.UnifiedButtonHandler.registerButton(closeBtn, closeHandler);
                }
            } else {
                this.toggleButton.addEventListener('click', toggleHandler);
                if (closeBtn) {
                    closeBtn.addEventListener('click', closeHandler);
                }
            }

            // Auto-hide when clicking outside the panel
            document.addEventListener('click', (e) => {
                if (!panel.classList.contains('show')) return;
                if (e.target === this.toggleButton) return;
                if (panel.contains(e.target)) return;
                this.hidePanel();
            });

            // Auto-hide on first movement key (does not block input)
            const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
            const movementListener = (e) => {
                if (movementKeys.includes(e.key)) {
                    this.autoHideOnce();
                    document.removeEventListener('keydown', movementListener);
                }
            };
            document.addEventListener('keydown', movementListener);

            // Best-effort hook: if a custom game start event exists, hide panel
            window.addEventListener('gameStarted', () => {
                this.autoHideOnce();
            });
        },

        togglePanel() {
            if (this.panel.classList.contains('show')) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        },

        showPanel() {
            if (!this.panel) return;
            this.panel.classList.add('show');
            this.panel.setAttribute('aria-hidden', 'false');
        },

        hidePanel() {
            if (!this.panel) return;
            this.panel.classList.remove('show');
            this.panel.setAttribute('aria-hidden', 'true');
        },

        autoHideOnce() {
            if (this.hasAutoHidden) return;
            this.hasAutoHidden = true;
            this.hidePanel();
        }
    };

    // Expose globally and register with module loader if present
    window.UIHotkeys = UIHotkeys;
    if (window.ModuleLoader && typeof window.ModuleLoader.register === 'function') {
        window.ModuleLoader.register('UIHotkeys', UIHotkeys);
    }

    // Initialize after load to avoid interfering with core initialization
    window.addEventListener('load', () => {
        try {
            UIHotkeys.init();
        } catch (e) {
            if (window.ErrorHandler && typeof window.ErrorHandler.handle === 'function') {
                window.ErrorHandler.handle(e, 'UIHotkeys', 0);
            } else {
                console.error('UIHotkeys init error:', e);
            }
        }
    });
})();


