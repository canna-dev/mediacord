// Overlay control module for MediaCord Web UI

function showLoadingOverlay(message = 'Connecting to MediaCord...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        document.getElementById('loading-message').textContent = message;
    }
}

function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

function showDisconnectedOverlay(message = 'Disconnected from MediaCord server') {
    const disconnectedOverlay = document.getElementById('disconnected-overlay');
    if (disconnectedOverlay) {
        disconnectedOverlay.style.display = 'flex';
        document.getElementById('disconnected-message').textContent = message;
    }
}

function hideDisconnectedOverlay() {
    const disconnectedOverlay = document.getElementById('disconnected-overlay');
    if (disconnectedOverlay) disconnectedOverlay.style.display = 'none';
}

export { showLoadingOverlay, hideLoadingOverlay, showDisconnectedOverlay, hideDisconnectedOverlay };
