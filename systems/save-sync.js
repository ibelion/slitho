// ==================== SAVE SYNC SYSTEM ====================
// Export/import save files with QR code support for cross-device transfer

const SaveSync = {
    // Configuration
    config: {
        version: '1.0.0',
        compressionEnabled: true,
        qrCodeEnabled: true
    },
    
    // Initialize
    init: function() {
        // Load QR code library if available
        this.loadQRCodeLibrary();
        
        // Register with module loader
        if (window.ModuleLoader) {
            window.ModuleLoader.register('SaveSync', this);
        }
        
        window.SaveSync = this;
    },
    
    // Load QR code library (dynamically)
    loadQRCodeLibrary: function() {
        // Check if QR code library is already loaded
        if (window.QRCode) return Promise.resolve();
        
        // Try to load from CDN
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            script.onload = () => resolve();
            script.onerror = () => {
                console.warn('QR code library not available, QR export disabled');
                this.config.qrCodeEnabled = false;
                resolve(); // Continue without QR code
            };
            document.head.appendChild(script);
        });
    },
    
    // Export save data
    exportSave: function() {
        try {
            // Get all save data
            const saveData = this.collectSaveData();
            
            // Add metadata
            const exportData = {
                version: this.config.version,
                exportDate: new Date().toISOString(),
                gameVersion: this.getGameVersion(),
                data: saveData
            };
            
            // Compress if enabled
            if (this.config.compressionEnabled) {
                return this.compressData(exportData);
            }
            
            return JSON.stringify(exportData);
        } catch (e) {
            console.error('Failed to export save:', e);
            throw e;
        }
    },
    
    // Import save data
    importSave: function(data) {
        try {
            let importData;
            
            // Try to decompress first
            if (typeof data === 'string' && data.startsWith('{')) {
                importData = JSON.parse(data);
            } else {
                importData = this.decompressData(data);
            }
            
            // Validate version
            if (!this.validateVersion(importData.version)) {
                throw new Error('Incompatible save file version');
            }
            
            // Restore save data
            this.restoreSaveData(importData.data);
            
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            throw e;
        }
    },
    
    // Collect all save data
    collectSaveData: function() {
        const saveData = {};
        
        // Collect from various systems
        if (window.RobustSaveSystem) {
            saveData.gameState = window.RobustSaveSystem.export();
        }
        
        if (window.MetaProgression) {
            saveData.progression = window.MetaProgression.export();
        }
        
        if (window.CosmeticSystem) {
            saveData.cosmetics = window.CosmeticSystem.export();
        }
        
        if (window.PlayerIdentity) {
            saveData.identity = window.PlayerIdentity.export();
        }
        
        // Collect from localStorage
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('snake') || key.startsWith('game')) {
                localStorageData[key] = localStorage.getItem(key);
            }
        }
        saveData.localStorage = localStorageData;
        
        return saveData;
    },
    
    // Restore save data
    restoreSaveData: function(data) {
        // Restore to systems
        if (data.gameState && window.RobustSaveSystem) {
            window.RobustSaveSystem.import(data.gameState);
        }
        
        if (data.progression && window.MetaProgression) {
            window.MetaProgression.import(data.progression);
        }
        
        if (data.cosmetics && window.CosmeticSystem) {
            window.CosmeticSystem.import(data.cosmetics);
        }
        
        if (data.identity && window.PlayerIdentity) {
            window.PlayerIdentity.import(data.identity);
        }
        
        // Restore localStorage
        if (data.localStorage) {
            for (const [key, value] of Object.entries(data.localStorage)) {
                try {
                    localStorage.setItem(key, value);
                } catch (e) {
                    console.warn('Failed to restore localStorage key:', key, e);
                }
            }
        }
    },
    
    // Compress data (simple base64 encoding for now)
    compressData: function(data) {
        const json = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(json)));
    },
    
    // Decompress data
    decompressData: function(compressed) {
        try {
            const json = decodeURIComponent(escape(atob(compressed)));
            return JSON.parse(json);
        } catch (e) {
            // Try as regular JSON
            return JSON.parse(compressed);
        }
    },
    
    // Validate version compatibility
    validateVersion: function(version) {
        // Simple version check (can be enhanced)
        const current = this.config.version.split('.').map(Number);
        const imported = version.split('.').map(Number);
        
        // Major version must match
        return current[0] === imported[0];
    },
    
    // Get game version
    getGameVersion: function() {
        // Try to get from version file or system
        if (window.VersionManager) {
            return window.VersionManager.getGameVersion();
        }
        
        // Fallback
        return '1.0.0';
    },
    
    // Export as file download
    exportToFile: function() {
        try {
            const data = this.exportSave();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snake-save-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            return true;
        } catch (e) {
            console.error('Failed to export to file:', e);
            return false;
        }
    },
    
    // Import from file
    importFromFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.importSave(e.target.result);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },
    
    // Generate QR code
    generateQRCode: function(canvasElement) {
        if (!this.config.qrCodeEnabled) {
            return Promise.reject(new Error('QR code not available'));
        }
        
        return this.loadQRCodeLibrary().then(() => {
            if (!window.QRCode) {
                throw new Error('QR code library not loaded');
            }
            
            const data = this.exportSave();
            
            return new Promise((resolve, reject) => {
                window.QRCode.toCanvas(canvasElement, data, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(canvasElement);
                    }
                });
            });
        });
    },
    
    // Scan QR code (requires camera access)
    scanQRCode: function(videoElement) {
        // This would require a QR code scanner library
        // For now, return a placeholder
        return Promise.reject(new Error('QR code scanning not yet implemented'));
    },
    
    // Show export UI
    showExportUI: function() {
        const modal = document.getElementById('saveExportModal');
        if (!modal) {
            this.createExportModal();
        }
        
        const exportModal = document.getElementById('saveExportModal');
        if (exportModal) {
            exportModal.classList.add('show');
            this.updateExportUI();
        }
    },
    
    // Show import UI
    showImportUI: function() {
        const modal = document.getElementById('saveImportModal');
        if (!modal) {
            this.createImportModal();
        }
        
        const importModal = document.getElementById('saveImportModal');
        if (importModal) {
            importModal.classList.add('show');
        }
    },
    
    // Create export modal
    createExportModal: function() {
        const modal = document.createElement('div');
        modal.id = 'saveExportModal';
        modal.className = 'modal save-export-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Export Save Data</h2>
                    <button class="close-btn" onclick="this.closest('.modal').classList.remove('show')">×</button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <button id="exportFileBtn" class="btn btn-primary">Download as File</button>
                        <button id="exportQRBtn" class="btn btn-secondary">Show QR Code</button>
                    </div>
                    <div id="qrCodeContainer" style="display: none; text-align: center; margin-top: 20px;">
                        <canvas id="qrCodeCanvas"></canvas>
                        <p>Scan this QR code with another device to import your save</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup event listeners
        document.getElementById('exportFileBtn').addEventListener('click', () => {
            this.exportToFile();
        });
        
        document.getElementById('exportQRBtn').addEventListener('click', () => {
            const container = document.getElementById('qrCodeContainer');
            const canvas = document.getElementById('qrCodeCanvas');
            container.style.display = 'block';
            this.generateQRCode(canvas).catch(err => {
                console.error('Failed to generate QR code:', err);
                alert('QR code generation failed. Please use file export instead.');
            });
        });
    },
    
    // Create import modal
    createImportModal: function() {
        const modal = document.createElement('div');
        modal.id = 'saveImportModal';
        modal.className = 'modal save-import-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Import Save Data</h2>
                    <button class="close-btn" onclick="this.closest('.modal').classList.remove('show')">×</button>
                </div>
                <div class="modal-body">
                    <div class="import-options">
                        <label class="file-input-label">
                            <input type="file" id="importFileInput" accept=".json" style="display: none;">
                            <span class="btn btn-primary">Choose File</span>
                        </label>
                        <p class="warning">⚠️ Importing will overwrite your current save data!</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup file input
        const fileInput = document.getElementById('importFileInput');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (confirm('This will overwrite your current save data. Continue?')) {
                    this.importFromFile(file).then(() => {
                        alert('Save data imported successfully!');
                        modal.classList.remove('show');
                        // Reload game state
                        if (window.location) {
                            window.location.reload();
                        }
                    }).catch(err => {
                        alert('Failed to import save: ' + err.message);
                    });
                }
            }
        });
    },
    
    // Update export UI
    updateExportUI: function() {
        // Update any dynamic content
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SaveSync.init());
} else {
    SaveSync.init();
}

