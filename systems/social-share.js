// ==================== SOCIAL SHARE ENHANCEMENTS ====================
// Share buttons for social platforms and dynamic meta tag updates

const SocialShare = {
    initialized: false,
    
    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        
        const initShare = () => {
            this.addShareButtons();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initShare);
        } else {
            initShare();
        }
        
        window.addEventListener('load', () => {
            setTimeout(initShare, 500);
        });
    },
    
    addShareButtons: function() {
        const modeSelectScreen = document.getElementById('modeSelectScreen');
        if (!modeSelectScreen) return;
        
        // Check if already added
        if (document.getElementById('socialShareContainer')) return;
        
        const modeSelectContent = modeSelectScreen.querySelector('.mode-select-content');
        if (!modeSelectContent) return;
        
        const shareContainer = document.createElement('div');
        shareContainer.id = 'socialShareContainer';
        shareContainer.className = 'social-share-container';
        shareContainer.innerHTML = `
            <div class="social-share-label">Share Slitho:</div>
            <div class="social-share-buttons">
                <button class="social-share-btn" data-platform="twitter" id="shareTwitter" title="Share on Twitter" aria-label="Share on Twitter">🐦</button>
                <button class="social-share-btn" data-platform="facebook" id="shareFacebook" title="Share on Facebook" aria-label="Share on Facebook">📘</button>
                <button class="social-share-btn" data-platform="reddit" id="shareReddit" title="Share on Reddit" aria-label="Share on Reddit">🔴</button>
                <button class="social-share-btn" data-platform="copy" id="shareCopy" title="Copy Link" aria-label="Copy link to clipboard">🔗</button>
            </div>
        `;
        
        // Insert at end of mode select content
        modeSelectContent.appendChild(shareContainer);
        
        // Add click handlers
        shareContainer.querySelectorAll('.social-share-btn').forEach(btn => {
            const platform = btn.dataset.platform;
            
            if (window.UnifiedButtonHandler) {
                window.UnifiedButtonHandler.registerButton(btn.id || btn, () => {
                    this.share(platform);
                });
            } else {
                btn.addEventListener('click', () => {
                    this.share(platform);
                });
            }
        });
    },
    
    share: function(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('Slitho - Modern Snake Game');
        const text = encodeURIComponent('Check out this awesome snake game with minigames, boss fights, and daily challenges!');
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
            copy: null
        };
        
        if (platform === 'copy') {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const btn = document.querySelector('[data-platform="copy"]');
                    if (btn) {
                        const original = btn.textContent;
                        btn.textContent = '✓';
                        setTimeout(() => {
                            btn.textContent = original;
                        }, 2000);
                    }
                }).catch(err => {
                    console.warn('Failed to copy:', err);
                    this.fallbackCopy(window.location.href);
                });
            } else {
                this.fallbackCopy(window.location.href);
            }
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        }
    },
    
    fallbackCopy: function(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const btn = document.querySelector('[data-platform="copy"]');
            if (btn) {
                const original = btn.textContent;
                btn.textContent = '✓';
                setTimeout(() => {
                    btn.textContent = original;
                }, 2000);
            }
        } catch (err) {
            console.warn('Fallback copy failed:', err);
        }
        document.body.removeChild(textarea);
    },
    
    generateDynamicPreview: function(score, level) {
        // Update meta tags dynamically based on game state
        const metaDesc = document.querySelector('meta[property="og:description"]');
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        
        if (score && level) {
            const dynamicText = `Just scored ${score} points on level ${level} in Slitho! Can you beat it?`;
            if (metaDesc) metaDesc.setAttribute('content', dynamicText);
            if (twitterDesc) twitterDesc.setAttribute('content', dynamicText);
        }
    }
};

// Export
window.SocialShare = SocialShare;

