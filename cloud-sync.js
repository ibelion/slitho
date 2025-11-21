// ==================== CLOUD SYNC MODULE ====================
// Optional, UI-focused cloud sync layer.
// - NO modifications to gameplay, movement, collisions, tick loop, or rendering.
// - Uses a mock JSON API adapter that can be replaced with a real backend.
// - Persists everything via localStorage; safe to run entirely offline.

(function () {
    const LOCAL_STATUS_KEY = 'cloudSyncStatus';
    const LOCAL_USER_KEY = 'cloudUser';
    const MOCK_CLOUD_KEY = '__MOCK_CLOUD__';
    const QUEUE_KEY = '__CLOUD_SYNC_QUEUE__';

    // Lightweight helper
    function safeParse(json, fallback) {
        try {
            return json ? JSON.parse(json) : fallback;
        } catch {
            return fallback;
        }
    }

    // -------------------- Mock JSON API Adapter --------------------
    // Swappable layer – replace with real network logic as needed.
    const MockCloudAdapter = {
        async isOnline() {
            // Allow override for testing; otherwise use navigator.onLine
            if (CloudSync._forceOffline) return false;
            if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
                return navigator.onLine;
            }
            return true;
        },

        async upload(userId, payload) {
            // Simulate storing payload by userId in a localStorage "cloud"
            const allCloud = safeParse(localStorage.getItem(MOCK_CLOUD_KEY), {});
            allCloud[userId] = {
                data: payload,
                updatedAt: Date.now()
            };
            localStorage.setItem(MOCK_CLOUD_KEY, JSON.stringify(allCloud));
            return { success: true, updatedAt: allCloud[userId].updatedAt };
        },

        async download(userId) {
            const allCloud = safeParse(localStorage.getItem(MOCK_CLOUD_KEY), {});
            if (!allCloud[userId]) {
                return { success: true, data: null, updatedAt: 0 };
            }
            return {
                success: true,
                data: allCloud[userId].data,
                updatedAt: allCloud[userId].updatedAt
            };
        }
    };

    // -------------------- Core CloudSync Object --------------------
    const CloudSync = {
        _adapter: MockCloudAdapter,
        _user: null,
        _status: 'idle', // 'idle' | 'syncing' | 'success' | 'error' | 'offline'
        _forceOffline: false, // testing flag

        init() {
            // Restore user + status
            this._user = safeParse(localStorage.getItem(LOCAL_USER_KEY), null);
            this._status = localStorage.getItem(LOCAL_STATUS_KEY) || 'idle';

            this.setupUI();
        },

        // -------------------- Public API --------------------
        async isOnline() {
            return this._adapter.isOnline();
        },

        getUser() {
            return this._user;
        },

        // Main entrypoint for login; email only, generates a local UID.
        async signIn(email) {
            if (!email || typeof email !== 'string') {
                throw new Error('Email is required for cloud sign-in.');
            }

            const normalizedEmail = email.trim().toLowerCase();
            const existing = this._user && this._user.email === normalizedEmail ? this._user : null;

            const user = existing || {
                id: this._generateUserId(normalizedEmail),
                email: normalizedEmail,
                createdAt: Date.now()
            };

            this._user = user;
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

            this._setStatus('idle');
            this.updateUI();

            // After successful sign-in, attempt initial bidirectional sync
            try {
                await this.syncNow();
            } catch (e) {
                console.warn('[CloudSync] Initial sync after sign-in failed:', e);
            }

            return user;
        },

        async signOut() {
            this._user = null;
            localStorage.removeItem(LOCAL_USER_KEY);
            this._setStatus('idle');
            this.updateUI();
        },

        // Primary sync workflow: local -> cloud -> local with merge.
        async syncNow() {
            if (!this._user) {
                console.warn('[CloudSync] No user signed in; sync skipped.');
                return { success: false, reason: 'no-user' };
            }

            this._setStatus('syncing');

            const online = await this.isOnline();
            if (!online) {
                this._setStatus('offline');
                this._queueLocalSnapshot();
                this.updateUI();
                return { success: false, reason: 'offline' };
            }

            try {
                // 1) Flush queued changes first
                await this._flushQueuedSnapshots();

                // 2) Current local snapshot
                const localSnapshot = this._captureLocalStorageSnapshot();

                // 3) Upload to cloud
                await this._adapter.upload(this._user.id, {
                    snapshot: localSnapshot,
                    updatedAt: Date.now()
                });

                // 4) Download from cloud, merge back to local
                const cloudResult = await this._adapter.download(this._user.id);
                const cloudSnapshot = cloudResult.data ? cloudResult.data.snapshot : null;

                if (cloudSnapshot) {
                    const merged = this.mergeLocalWithCloud(localSnapshot, cloudSnapshot);
                    this._applySnapshotToLocalStorage(merged);
                }

                this._setStatus('success');
                this.updateUI();
                return { success: true };
            } catch (e) {
                console.error('[CloudSync] syncNow error:', e);
                this._setStatus('error');
                this.updateUI();
                return { success: false, reason: 'error', error: e };
            }
        },

        // Public wrappers for external callers (e.g., tests)
        async syncToCloud() {
            if (!this._user) return { success: false, reason: 'no-user' };

            const online = await this.isOnline();
            if (!online) {
                this._queueLocalSnapshot();
                this._setStatus('offline');
                this.updateUI();
                return { success: false, reason: 'offline' };
            }

            const localSnapshot = this._captureLocalStorageSnapshot();
            await this._adapter.upload(this._user.id, {
                snapshot: localSnapshot,
                updatedAt: Date.now()
            });
            this._setStatus('success');
            this.updateUI();
            return { success: true };
        },

        async syncFromCloud() {
            if (!this._user) return { success: false, reason: 'no-user' };

            const online = await this.isOnline();
            if (!online) {
                this._setStatus('offline');
                this.updateUI();
                return { success: false, reason: 'offline' };
            }

            const cloudResult = await this._adapter.download(this._user.id);
            if (!cloudResult.data) {
                this._setStatus('success');
                this.updateUI();
                return { success: true, restored: false };
            }

            const cloudSnapshot = cloudResult.data.snapshot;
            const currentLocal = this._captureLocalStorageSnapshot();
            const merged = this.mergeLocalWithCloud(currentLocal, cloudSnapshot);
            this._applySnapshotToLocalStorage(merged);
            this._setStatus('success');
            this.updateUI();
            return { success: true, restored: true };
        },

        // Merge snapshots: cloud wins on conflicts by timestamp,
        // but local-only achievements are preserved.
        mergeLocalWithCloud(localSnapshot, cloudSnapshot) {
            const merged = { ...localSnapshot };

            Object.keys(cloudSnapshot || {}).forEach((key) => {
                const cloudValue = cloudSnapshot[key];
                const localValue = localSnapshot[key];

                // Special-case achievements: merge sets
                if (key.toLowerCase().includes('achievement') && Array.isArray(cloudValue) && Array.isArray(localValue)) {
                    const set = new Set([...localValue, ...cloudValue]);
                    merged[key] = Array.from(set);
                    return;
                }

                // Timestamp-based conflict resolution when values are objects with updatedAt
                if (
                    cloudValue &&
                    typeof cloudValue === 'object' &&
                    localValue &&
                    typeof localValue === 'object' &&
                    typeof cloudValue.updatedAt === 'number' &&
                    typeof localValue.updatedAt === 'number'
                ) {
                    merged[key] = cloudValue.updatedAt >= localValue.updatedAt ? cloudValue : localValue;
                    return;
                }

                // Default: cloud snapshot wins (but does not delete other local keys)
                merged[key] = cloudValue;
            });

            return merged;
        },

        // -------------------- Internal helpers --------------------
        _setStatus(status) {
            this._status = status;
            try {
                localStorage.setItem(LOCAL_STATUS_KEY, status);
            } catch {
                // ignore
            }
        },

        _captureLocalStorageSnapshot() {
            const snapshot = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                // Avoid syncing mock cloud & internal queue keys
                if (key === MOCK_CLOUD_KEY || key === QUEUE_KEY) continue;
                snapshot[key] = localStorage.getItem(key);
            }
            return snapshot;
        },

        _applySnapshotToLocalStorage(snapshot) {
            Object.keys(snapshot || {}).forEach((key) => {
                try {
                    localStorage.setItem(key, snapshot[key]);
                } catch (e) {
                    console.warn('[CloudSync] Failed to write key during restore:', key, e);
                }
            });
        },

        _queueLocalSnapshot() {
            try {
                const queue = safeParse(localStorage.getItem(QUEUE_KEY), []);
                queue.push({
                    timestamp: Date.now(),
                    snapshot: this._captureLocalStorageSnapshot()
                });
                localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            } catch (e) {
                console.warn('[CloudSync] Failed to queue snapshot:', e);
            }
        },

        async _flushQueuedSnapshots() {
            const queue = safeParse(localStorage.getItem(QUEUE_KEY), []);
            if (!queue.length || !this._user) return;

            for (const entry of queue) {
                try {
                    await this._adapter.upload(this._user.id, {
                        snapshot: entry.snapshot,
                        updatedAt: entry.timestamp
                    });
                } catch (e) {
                    console.warn('[CloudSync] Failed to flush queued snapshot:', e);
                    // Keep remaining entries; we'll try again later
                    return;
                }
            }

            // Clear queue if all uploads succeeded
            localStorage.removeItem(QUEUE_KEY);
        },

        _generateUserId(email) {
            const rand = Math.random().toString(36).slice(2);
            const ts = Date.now().toString(36);
            return `user_${ts}_${rand}`;
        },

        // -------------------- UI Wiring (minimal, non-blocking) --------------------
        setupUI() {
            if (typeof document === 'undefined') return;

            // Settings buttons
            const signInBtn = document.getElementById('cloudSignInBtn');
            const syncNowBtn = document.getElementById('cloudSyncNowBtn');
            const statusEl = document.getElementById('cloudSyncStatusText');
            const modal = document.getElementById('cloudSignInModal');
            const emailInput = document.getElementById('cloudEmailInput');
            const submitBtn = document.getElementById('cloudSignInSubmit');
            const cancelBtn = document.getElementById('cloudSignInCancel');

            const openModal = () => {
                if (!modal) return;
                modal.classList.add('show');
                if (emailInput) {
                    emailInput.value = this._user ? this._user.email : '';
                    emailInput.focus();
                }
            };

            const closeModal = () => {
                if (!modal) return;
                modal.classList.remove('show');
            };

            if (signInBtn) {
                signInBtn.addEventListener('click', () => {
                    openModal();
                });
            }

            if (syncNowBtn) {
                syncNowBtn.addEventListener('click', async () => {
                    const result = await this.syncNow();
                    if (result.success) {
                        this._showToast('Cloud sync completed');
                    } else if (result.reason === 'offline') {
                        this._showToast('Offline – changes will sync when connection is available');
                    } else if (result.reason === 'no-user') {
                        this._showToast('Sign in to enable cloud sync');
                    } else {
                        this._showToast('Cloud sync failed');
                    }
                });
            }

            if (submitBtn && emailInput) {
                submitBtn.addEventListener('click', async () => {
                    const raw = emailInput.value || '';
                    const email = raw.trim();
                    if (!email) {
                        this._showToast('Please enter an email');
                        return;
                    }
                    // Basic safety: limit length and strip obvious script injection characters
                    if (email.length > 254 || /[<>"']/g.test(email)) {
                        this._showToast('Invalid email format');
                        return;
                    }
                    try {
                        await this.signIn(email);
                        this._showToast('Signed in and synced with cloud');
                        closeModal();
                    } catch (e) {
                        console.error('[CloudSync] Sign-in error:', e);
                        this._showToast('Sign-in failed');
                    }
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    closeModal();
                });
            }

            // Simple status text updater
            if (statusEl) {
                this._statusElement = statusEl;
            }

            this.updateUI();
        },

        updateUI() {
            if (!this._statusElement) return;
            const userPart = this._user ? `Signed in as ${this._user.email}` : 'Not signed in';
            const statusPart = (() => {
                switch (this._status) {
                    case 'syncing': return 'Syncing…';
                    case 'success': return 'Last sync: OK';
                    case 'offline': return 'Offline – using local data';
                    case 'error': return 'Last sync: Error';
                    default: return 'Idle';
                }
            })();
            this._statusElement.textContent = `${userPart} • ${statusPart}`;
        },

        _showToast(message) {
            if (typeof document === 'undefined') return;
            let toast = document.getElementById('uiToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'uiToast';
                toast.className = 'ui-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            toast.classList.add('show');
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 2200);
        },

        // -------------------- Self-test for verification --------------------
        // NOTE: This is a helper for manual/dev verification and logging.
        async runSelfTest() {
            console.groupCollapsed('%c[CloudSync] Self-test', 'color:#4CAF50;font-weight:bold;');
            try {
                // Ensure a test user
                if (!this._user) {
                    await this.signIn('test@example.com');
                }

                // 1) Automatic sync test
                console.log('[CloudSync] Running automatic sync test…');
                localStorage.setItem('cloudTestKey', JSON.stringify({ value: 42, updatedAt: Date.now() }));
                await this.syncToCloud();
                localStorage.removeItem('cloudTestKey');
                const fromCloud = await this.syncFromCloud();
                const restored = localStorage.getItem('cloudTestKey');
                console.log('[CloudSync] Automatic sync test restored value:', restored, 'restored flag:', fromCloud.restored);

                // 2) Offline path test
                console.log('[CloudSync] Testing offline behavior…');
                this._forceOffline = true;
                localStorage.setItem('cloudOfflineKey', 'local-only');
                await this.syncToCloud(); // should queue
                this._forceOffline = false;
                await this.syncNow(); // should flush queue when back online
                console.log('[CloudSync] Offline/queue path exercised.');
            } catch (e) {
                console.error('[CloudSync] Self-test error:', e);
            }
            console.groupEnd();
        }
    };

    // Expose globally
    window.CloudSync = CloudSync;

    // Optional registration with InitManager, if present
    if (window.InitManager) {
        window.InitManager.register('CloudSync', () => CloudSync.init());
    } else {
        // Fallback init on load – UI-only, non-blocking
        window.addEventListener('load', () => {
            try {
                CloudSync.init();
            } catch (e) {
                console.error('[CloudSync] Init error:', e);
            }
        });
    }
})();


