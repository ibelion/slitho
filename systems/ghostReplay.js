// ==================== GHOST REPLAY SYSTEM ====================
// Recording and playback of best runs per level

const GHOST_COMPRESSION_ENABLED = true;
const MAX_GHOST_REPLAYS = 10;

// Global/master toggle for the entire ghost system.
// When false:
// - No recording
// - No playback
// - No ghost state processed
let ghostSystemEnabled = true;

let ghostReplayState = {
    recording: false,
    playing: false,
    currentLevel: null,
    frames: [],
    startTime: 0,
    playbackIndex: 0,
    playbackTime: 0
};

// Initialize ghost replay
function initGhostReplay() {
    // Restore persisted master toggle
    try {
        const saved = localStorage.getItem('ghostSystemEnabled');
        if (saved !== null) {
            ghostSystemEnabled = saved === 'true';
        }
    } catch (e) {
        console.warn('GhostReplay: failed to read ghostSystemEnabled from storage:', e);
    }

    ghostReplayState = {
        recording: false,
        playing: false,
        currentLevel: null,
        frames: [],
        startTime: 0,
        playbackIndex: 0,
        playbackTime: 0
    };
}

// Start recording ghost replay
function startRecording(levelId) {
    if (!ghostSystemEnabled) return;
    ghostReplayState.recording = true;
    ghostReplayState.currentLevel = levelId;
    ghostReplayState.frames = [];
    ghostReplayState.startTime = performance.now();
}

// Stop recording
function stopRecording() {
    ghostReplayState.recording = false;
    
    if (ghostReplayState.frames.length === 0) return;
    
    // Compress and save
    const compressed = compressGhostData(ghostReplayState.frames);
    saveGhostReplay(ghostReplayState.currentLevel, compressed);
}

// Record frame
function recordFrame(snake, dx, dy, timeElapsed) {
    if (!ghostSystemEnabled || !ghostReplayState.recording) return;
    
    // Compact representation: only head position, direction, and body length
    const frame = {
        t: timeElapsed, // Time elapsed
        hx: snake[0].x, // Head X
        hy: snake[0].y, // Head Y
        dx: dx,         // Direction X
        dy: dy,         // Direction Y
        l: snake.length // Length
    };
    
    ghostReplayState.frames.push(frame);
}

// Compress ghost data using delta encoding and RLE
function compressGhostData(frames) {
    if (!GHOST_COMPRESSION_ENABLED || frames.length === 0) {
        return frames;
    }
    
    const compressed = [];
    let lastFrame = null;
    let runLength = 1;
    
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        if (lastFrame === null) {
            // First frame - store full data
            compressed.push(frame);
            lastFrame = frame;
            continue;
        }
        
        // Check if frame is identical to previous (RLE)
        if (frame.hx === lastFrame.hx && 
            frame.hy === lastFrame.hy && 
            frame.dx === lastFrame.dx && 
            frame.dy === lastFrame.dy &&
            frame.l === lastFrame.l) {
            runLength++;
            continue;
        }
        
        // If we had a run, encode it
        if (runLength > 1) {
            compressed[compressed.length - 1].r = runLength; // Run length
            runLength = 1;
        }
        
        // Delta encoding: store differences
        const delta = {
            t: frame.t - lastFrame.t,
            hx: frame.hx - lastFrame.hx,
            hy: frame.hy - lastFrame.hy,
            dx: frame.dx,
            dy: frame.dy,
            l: frame.l - lastFrame.l
        };
        
        compressed.push(delta);
        lastFrame = frame;
    }
    
    // Handle final run
    if (runLength > 1) {
        compressed[compressed.length - 1].r = runLength;
    }
    
    return compressed;
}

// Decompress ghost data
function decompressGhostData(compressed) {
    if (!GHOST_COMPRESSION_ENABLED || compressed.length === 0) {
        return compressed;
    }
    
    const frames = [];
    let currentFrame = null;
    let frameIndex = 0;
    
    for (let i = 0; i < compressed.length; i++) {
        const data = compressed[i];
        const runLength = data.r || 1;
        
        if (i === 0) {
            // First frame - full data
            currentFrame = { ...data };
        } else {
            // Delta frame - reconstruct
            currentFrame = {
                t: currentFrame.t + (data.t || 0),
                hx: currentFrame.hx + (data.hx || 0),
                hy: currentFrame.hy + (data.hy || 0),
                dx: data.dx,
                dy: data.dy,
                l: currentFrame.l + (data.l || 0)
            };
        }
        
        // Expand run length
        for (let r = 0; r < runLength; r++) {
            frames.push({ ...currentFrame });
        }
    }
    
    return frames;
}

// Save ghost replay
function saveGhostReplay(levelId, compressedData) {
    if (!ghostSystemEnabled) return;
    try {
        const saved = localStorage.getItem('ghostReplays');
        const replays = saved ? JSON.parse(saved) : {};
        
        // Check if this is better than existing
        const existing = replays[levelId];
        if (existing) {
            const existingFrames = decompressGhostData(existing.frames);
            if (compressedData.length >= existingFrames.length) {
                // Not better, don't save
                return;
            }
        }
        
        replays[levelId] = {
            level: levelId,
            frames: compressedData,
            timestamp: Date.now(),
            frameCount: compressedData.length
        };
        
        // Limit number of stored replays
        const levelIds = Object.keys(replays);
        if (levelIds.length > MAX_GHOST_REPLAYS) {
            // Remove oldest
            levelIds.sort((a, b) => replays[a].timestamp - replays[b].timestamp);
            delete replays[levelIds[0]];
        }
        
        localStorage.setItem('ghostReplays', JSON.stringify(replays));
    } catch (e) {
        console.error('Failed to save ghost replay:', e);
    }
}

// Load ghost replay
function loadGhostReplay(levelId) {
    if (!ghostSystemEnabled) return null;
    try {
        const saved = localStorage.getItem('ghostReplays');
        if (!saved) return null;
        
        const replays = JSON.parse(saved);
        const replay = replays[levelId];
        
        if (!replay) return null;
        
        // Decompress
        const frames = decompressGhostData(replay.frames);
        
        return {
            level: levelId,
            frames: frames,
            timestamp: replay.timestamp
        };
    } catch (e) {
        console.error('Failed to load ghost replay:', e);
        return null;
    }
}

// Start playback
function startPlayback(levelId) {
    if (!ghostSystemEnabled) return false;
    const replay = loadGhostReplay(levelId);
    if (!replay || !replay.frames || replay.frames.length === 0) {
        return false;
    }
    
    ghostReplayState.playing = true;
    ghostReplayState.currentLevel = levelId;
    ghostReplayState.frames = replay.frames;
    ghostReplayState.playbackIndex = 0;
    ghostReplayState.playbackTime = 0;
    
    return true;
}

// Stop playback
function stopPlayback() {
    ghostReplayState.playing = false;
    ghostReplayState.frames = [];
    ghostReplayState.playbackIndex = 0;
}

// Update playback (call every frame)
function updatePlayback(currentTime) {
    if (!ghostSystemEnabled || !ghostReplayState.playing || ghostReplayState.frames.length === 0) {
        return null;
    }
    
    // Find frame at current time
    while (ghostReplayState.playbackIndex < ghostReplayState.frames.length - 1) {
        const frame = ghostReplayState.frames[ghostReplayState.playbackIndex];
        const nextFrame = ghostReplayState.frames[ghostReplayState.playbackIndex + 1];
        
        if (currentTime >= frame.t && currentTime < nextFrame.t) {
            // Interpolate between frames
            const t = (currentTime - frame.t) / (nextFrame.t - frame.t);
            return {
                x: frame.hx + (nextFrame.hx - frame.hx) * t,
                y: frame.hy + (nextFrame.hy - frame.hy) * t,
                dx: frame.dx,
                dy: frame.dy,
                length: frame.l
            };
        }
        
        ghostReplayState.playbackIndex++;
    }
    
    // Return last frame
    const lastFrame = ghostReplayState.frames[ghostReplayState.frames.length - 1];
    return {
        x: lastFrame.hx,
        y: lastFrame.hy,
        dx: lastFrame.dx,
        dy: lastFrame.dy,
        length: lastFrame.l
    };
}

// Get ghost replay state
function getGhostReplayState() {
    return {
        recording: ghostReplayState.recording,
        playing: ghostReplayState.playing,
        currentLevel: ghostReplayState.currentLevel
    };
}

// Clear ghost replay for a level
function clearGhostReplay(levelId) {
    try {
        const saved = localStorage.getItem('ghostReplays');
        if (!saved) return;
        
        const replays = JSON.parse(saved);
        delete replays[levelId];
        localStorage.setItem('ghostReplays', JSON.stringify(replays));
    } catch (e) {
        console.error('Failed to clear ghost replay:', e);
    }
}

// Export
window.GhostReplay = {
    init: initGhostReplay,
    startRecording,
    stopRecording,
    recordFrame,
    startPlayback,
    stopPlayback,
    updatePlayback,
    getState: getGhostReplayState,
    clear: clearGhostReplay,
    load: loadGhostReplay,
    // Master ghost system toggle API
    isSystemEnabled: function () {
        return ghostSystemEnabled;
    },
    setSystemEnabled: function (enabled) {
        ghostSystemEnabled = !!enabled;
        try {
            localStorage.setItem('ghostSystemEnabled', ghostSystemEnabled.toString());
        } catch (e) {
            console.warn('GhostReplay: failed to persist ghostSystemEnabled:', e);
        }
        // Immediately stop any ongoing recording or playback when disabled
        if (!ghostSystemEnabled) {
            stopRecording();
            stopPlayback();
        }
    }
};

