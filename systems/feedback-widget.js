// ==================== FEEDBACK & BUG REPORT WIDGET ====================
// Slide-out panel for user feedback and bug reports
// Stores submissions locally, ready for backend integration

const FeedbackWidget = {
    isOpen: false,
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Wait for DOM to be ready
        const initWidget = () => {
            this.createWidget();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initWidget);
        } else {
            initWidget();
        }
        
        window.addEventListener('load', () => {
            setTimeout(initWidget, 500);
        });
    },
    
    createWidget: function() {
        // Check if already created
        if (document.getElementById('feedbackWidgetButton')) return;
        
        // Floating button
        const button = document.createElement('button');
        button.id = 'feedbackWidgetButton';
        button.className = 'feedback-widget-button';
        button.innerHTML = '💬';
        button.setAttribute('aria-label', 'Send Feedback');
        button.setAttribute('title', 'Send Feedback or Report a Bug');
        document.body.appendChild(button);
        
        // Register button
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton('feedbackWidgetButton', () => {
                this.toggle();
            });
        } else {
            button.addEventListener('click', () => this.toggle());
        }
        
        // Panel
        const panel = document.createElement('div');
        panel.id = 'feedbackWidgetPanel';
        panel.className = 'feedback-widget-panel';
        panel.innerHTML = `
            <div class="feedback-widget-header">
                <h3>Send Feedback</h3>
                <button class="feedback-widget-close" id="feedbackClose" aria-label="Close">&times;</button>
            </div>
            <div class="feedback-widget-content">
                <div class="feedback-type-selector">
                    <button class="feedback-type-btn active" data-type="feedback" id="feedbackTypeFeedback">
                        💡 Feedback
                    </button>
                    <button class="feedback-type-btn" data-type="bug" id="feedbackTypeBug">
                        🐛 Bug Report
                    </button>
                </div>
                <textarea id="feedbackText" placeholder="Tell us what you think..." rows="5" aria-label="Feedback text"></textarea>
                <input type="email" id="feedbackEmail" placeholder="Email (optional)" aria-label="Email address" />
                <button class="btn" id="feedbackSubmit">Send</button>
                <p class="feedback-note">Feedback is stored locally and ready for backend integration.</p>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Setup handlers
        const closeBtn = document.getElementById('feedbackClose');
        const submitBtn = document.getElementById('feedbackSubmit');
        
        if (closeBtn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('feedbackClose', () => this.toggle());
            } else {
                closeBtn.addEventListener('click', () => this.toggle());
            }
        }
        
        if (submitBtn) {
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton('feedbackSubmit', () => this.submit());
            } else {
                submitBtn.addEventListener('click', () => this.submit());
            }
        }
        
        // Type selector
        const typeButtons = panel.querySelectorAll('.feedback-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update placeholder based on type
                const textarea = document.getElementById('feedbackText');
                if (textarea) {
                    if (btn.dataset.type === 'bug') {
                        textarea.placeholder = 'Describe the bug, steps to reproduce, and what you expected to happen...';
                    } else {
                        textarea.placeholder = 'Tell us what you think...';
                    }
                }
            });
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggle();
            }
        });
    },
    
    toggle: function() {
        const panel = document.getElementById('feedbackWidgetPanel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        panel.classList.toggle('open');
        
        // Focus textarea when opening
        if (this.isOpen) {
            setTimeout(() => {
                const textarea = document.getElementById('feedbackText');
                if (textarea) {
                    textarea.focus();
                }
            }, 300);
        }
    },
    
    submit: function() {
        const text = document.getElementById('feedbackText')?.value;
        const email = document.getElementById('feedbackEmail')?.value;
        const typeBtn = document.querySelector('.feedback-type-btn.active');
        const type = typeBtn?.dataset.type || 'feedback';
        
        if (!text || text.trim().length === 0) {
            alert('Please enter your feedback');
            return;
        }
        
        const feedback = {
            id: Date.now(),
            type: type,
            text: text.trim(),
            email: email ? email.trim() : 'anonymous',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            version: document.querySelector('meta[name="version"]')?.content || 
                    (typeof VERSION !== 'undefined' ? VERSION : 'unknown'),
            url: window.location.href
        };
        
        // Store locally
        try {
            const existing = JSON.parse(localStorage.getItem('feedbackSubmissions') || '[]');
            existing.push(feedback);
            // Keep only last 50 submissions
            const recent = existing.slice(-50);
            localStorage.setItem('feedbackSubmissions', JSON.stringify(recent));
        } catch (e) {
            console.warn('Failed to save feedback:', e);
        }
        
        // Clear form
        const textarea = document.getElementById('feedbackText');
        const emailInput = document.getElementById('feedbackEmail');
        if (textarea) textarea.value = '';
        if (emailInput) emailInput.value = '';
        
        // Show confirmation
        const btn = document.getElementById('feedbackSubmit');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✓ Sent!';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                this.toggle();
            }, 2000);
        }
        
        console.log('Feedback submitted:', feedback);
    }
};

// Export
window.FeedbackWidget = FeedbackWidget;

