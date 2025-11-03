// MediaCord Web Interface JavaScript

import MediaCordState from './modules/state.js';
import { showLoadingOverlay, hideLoadingOverlay, showDisconnectedOverlay, hideDisconnectedOverlay } from './modules/overlays.js';
import { showNotification } from './modules/notifications.js';
import { setTheme, getSavedTheme } from './modules/theme.js';
import { initTabs } from './modules/tabs.js';
import { updateMediaSourceStatus, resetMediaDisplay, formatTime } from './modules/media.js';
import { updateDiscordStatus, setDiscordStatus } from './modules/discord.js';
import { updateSourceSelection } from './modules/sourceSelection.js';
import { populateSettingsForm } from './modules/settings.js';
import { getPlatform } from './modules/platform.js';
import { copyDebugInfo } from './modules/debug.js';
import { showFeedbackModal } from './modules/feedback.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- ADVANCED SETTINGS TOGGLE LOGIC ---
    const advancedToggle = document.getElementById('advanced-toggle');
    let advancedVisible = false;
    function getAdvancedGroups() {
        return [...document.querySelectorAll('.settings-group')];
    }
    function setAdvancedVisible(visible) {
        const advancedGroups = getAdvancedGroups();
        if (!advancedGroups || advancedGroups.length === 0) return;
        advancedGroups.forEach(group => {
            group.style.display = visible ? '' : 'none';
        });
        advancedVisible = visible;
        if (advancedToggle) {
            advancedToggle.textContent = visible ? 'Hide Advanced Settings' : 'Show Advanced Settings';
        }
    }
    if (advancedToggle) {
        advancedToggle.addEventListener('click', function() {
            setAdvancedVisible(!advancedVisible);
        });
        setAdvancedVisible(false);
    }
    // Initialize tab navigation
    initTabs();
    // Helper to show/hide IINA settings group
    function updateIINASettingsVisibility() {
        const iinaSettingsGroup = document.getElementById('iina-settings');
        const sources = MediaCordState.availableSources || [];
        const platform = getPlatform();
        if (sources.includes('iina') && platform.toLowerCase().includes('mac')) {
            iinaSettingsGroup.style.display = 'block';
        } else {
            iinaSettingsGroup.style.display = 'none';
        }
    }
    // Initialize Socket.io connection FIRST
    const socket = io();

    // Show platform info with icon and label
    const platformInfo = document.getElementById('platform-info');
    const osIcon = document.getElementById('os-icon');
    const osLabel = document.getElementById('os-label');
    let platform = getPlatform().toLowerCase();
    if (platformInfo && osIcon && osLabel) {
        let icon = '';
        let label = '';
        if (platform.includes('win')) {
            icon = '🪟'; label = 'Windows';
        } else if (platform.includes('mac')) {
            icon = ''; label = 'macOS';
        } else if (platform.includes('linux')) {
            icon = '🐧'; label = 'Linux';
        } else {
            icon = '💻'; label = platform;
        }
        osIcon.textContent = icon;
        osLabel.textContent = label;
    }
    // Version info in footer
    const versionInfo = document.getElementById('version-info');
    function updateVersionInfo() {
        fetch('/health')
            .then(res => res.json())
            .then(data => {
                let status = data.status === 'ok' ? 'Up to date' : 'Status: ' + data.status;
                let version = data.version ? `v${data.version}` : '';
                versionInfo.textContent = `MediaCord ${version} • ${status}`;
            })
            .catch(() => {
                versionInfo.textContent = 'MediaCord (version info unavailable)';
            });
    }
    updateVersionInfo();
    // ...existing code...
        // --- MEDIA PREVIEW UPDATE LOGIC ---
        function updateMediaPreview(status) {
            const mediaTitle = document.getElementById('media-title');
            const mediaMetadata = document.getElementById('media-metadata');
            const mediaPoster = document.getElementById('media-poster');
            const progressFill = document.getElementById('progress-fill');
            const progressTime = document.getElementById('progress-time');
            const progressPercentage = document.getElementById('progress-percentage');
            const imdbLink = document.getElementById('imdb-link');
            if (!mediaTitle || !mediaMetadata || !mediaPoster || !progressFill || !progressTime || !progressPercentage || !imdbLink) return;

            if (status.connected && status.title) {
                mediaTitle.textContent = status.title;
                let metaText = '';
                if (status.metadata) {
                    if (status.metadata.year) metaText += `(${status.metadata.year}) `;
                    if (status.metadata.genres) metaText += `• ${status.metadata.genres.join(', ')}`;
                    if (status.metadata.type) metaText += ` • ${status.metadata.type.charAt(0).toUpperCase() + status.metadata.type.slice(1)}`;
                }
                mediaMetadata.textContent = metaText.trim() || '-';
                mediaPoster.src = status.metadata && status.metadata.posterUrl ? status.metadata.posterUrl : 'assets/vlc.png';
                // Progress
                const elapsed = status.elapsed || 0;
                const total = status.length || 0;
                progressFill.style.width = total > 0 ? `${Math.floor((elapsed / total) * 100)}%` : '0%';
                progressTime.textContent = `${formatTime(elapsed)} / ${formatTime(total)}`;
                progressPercentage.textContent = total > 0 ? `${Math.floor((elapsed / total) * 100)}%` : '0%';
                // IMDb button
                if (status.metadata && status.metadata.imdbId) {
                    imdbLink.style.display = '';
                    imdbLink.href = `https://www.imdb.com/title/${status.metadata.imdbId}/`;
                    imdbLink.textContent = 'View on IMDb';
                    imdbLink.classList.add('imdb-btn');
                } else {
                    imdbLink.style.display = 'none';
                }
            } else {
                mediaTitle.textContent = 'Not playing';
                mediaMetadata.textContent = '-';
                mediaPoster.src = 'assets/vlc.png';
                progressFill.style.width = '0%';
                progressTime.textContent = '0:00 / 0:00';
                progressPercentage.textContent = '0%';
                imdbLink.style.display = 'none';
            }
        }

        // Listen for mediaStatus and update preview
        socket.on('mediaStatus', (status) => {
            updateMediaSourceStatus(status);
            updateMediaPreview(status);
        });
        // --- MEDIA PLAYER STATUS CARD UPDATE ---
        function updateMediaSourceStatus(status) {
            const mediaSourceName = document.getElementById('media-source-name');
            const mediaSourceText = document.getElementById('media-source-text');
            const mediaSourceType = document.getElementById('media-source-type');
            const mediaSourceIcon = document.getElementById('media-source-icon');
            if (!mediaSourceName || !mediaSourceText || !mediaSourceType || !mediaSourceIcon) return;

            if (status.connected) {
                // Show actual media player info
                let sourceLabel = 'Media Player';
                let iconSrc = 'assets/vlc.png';
                if (status.source === 'vlc') {
                    sourceLabel = 'VLC Media Player';
                    iconSrc = 'assets/vlc.png';
                } else if (status.source === 'iina') {
                    sourceLabel = 'IINA';
                    iconSrc = 'assets/iina.png';
                }
                mediaSourceName.textContent = sourceLabel;
                mediaSourceText.textContent = status.playing ? 'Playing' : (status.paused ? 'Paused' : 'Idle');
                mediaSourceType.textContent = status.title ? status.title : '';
                mediaSourceIcon.src = iconSrc;
            } else {
                // Default connecting state
                mediaSourceName.textContent = 'Media Player';
                mediaSourceText.textContent = 'Connecting...';
                mediaSourceType.textContent = 'Detecting sources...';
                mediaSourceIcon.src = 'assets/vlc.png';
            }
        }
        // --- FOOTER LINKS HANDLERS ---
        // Setup Instructions Modal
        const setupInstructionsBtn = document.getElementById('setup-instructions');
        const instructionsModal = document.getElementById('instructions-modal');
        if (setupInstructionsBtn && instructionsModal) {
            setupInstructionsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                instructionsModal.style.display = 'block';
            });
            instructionsModal.querySelectorAll('.close-btn, .modal-close-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    instructionsModal.style.display = 'none';
                });
            });
        }


        // Changelog link (open changelog.html)
        const changelogLink = document.getElementById('changelog-link');
        if (changelogLink) {
            changelogLink.addEventListener('click', function(e) {
                // Let browser handle navigation
            });
        }

        // Copy Debug Info
        const copyDebugBtn = document.getElementById('copy-debug');
        if (copyDebugBtn) {
            copyDebugBtn.addEventListener('click', function(e) {
                e.preventDefault();
                copyDebugInfo();
            });
        }

        // --- MEDIA PLAYER STATUS TIMEOUT ---
        setTimeout(() => {
            if (!MediaCordState.media || !MediaCordState.media.connected) {
                showNotification('No media player detected. Make sure VLC is running and configured.', 'error');
            }
        }, 5000);

    // Declare settings buttons before use
    const saveSettingsButton = document.getElementById('save-settings');
    const resetSettingsButton = document.getElementById('reset-settings');
    // ...existing code...

    // --- MOVE SOCKET.IO AND SETTINGS LOGIC HERE ---
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            const iinaStatusPathsTextarea = document.getElementById('iina-status-paths');
            const preferredSourceSelect = document.getElementById('preferred-source');
            const enableAutoSwitchingCheckbox = document.getElementById('enable-auto-switching');
            const vlcHostInput = document.getElementById('vlc-host');
            const vlcPortInput = document.getElementById('vlc-port');
            const vlcPasswordInput = document.getElementById('vlc-password');
            const vlcPollingIntervalInput = document.getElementById('vlc-polling-interval');
            const iinaPollingIntervalInput = document.getElementById('iina-polling-interval');
            const discordClientIdInput = document.getElementById('discord-client-id');
            const tmdbApiKeyInput = document.getElementById('tmdb-api-key');
            const iinaStatusPaths = iinaStatusPathsTextarea.value
                .split('\n')
                .map(p => sanitizeText(p))
                .filter(p => p.length > 0);
            const config = {
                preferredSource: sanitizeText(preferredSourceSelect.value),
                enableAutoSourceSwitching: enableAutoSwitchingCheckbox ? enableAutoSwitchingCheckbox.checked : true,
                vlcHost: sanitizeHost(vlcHostInput.value),
                vlcPort: sanitizePort(vlcPortInput.value),
                vlcPassword: sanitizeText(vlcPasswordInput.value),
                vlcPollingInterval: sanitizeInterval(vlcPollingIntervalInput.value, 500, 5000, 1000),
                iinaPollingInterval: sanitizeInterval(iinaPollingIntervalInput.value, 500, 10000, 2000),
                iinaStatusPaths: iinaStatusPaths,
                discordClientId: sanitizeText(discordClientIdInput.value),
                tmdbApiKey: sanitizeApiKey(tmdbApiKeyInput.value)
            };

            // Basic validation feedback
            if (!config.vlcHost) {
                showNotification('VLC host is invalid.', 'error');
                return;
            }
            if (!config.vlcPassword) {
                showNotification('VLC password is required.', 'error');
                return;
            }
            if (!config.discordClientId) {
                showNotification('Discord Client ID is required.', 'error');
                return;
            }

            socket.emit('updateConfig', config);
            const originalText = saveSettingsButton.textContent;
            saveSettingsButton.textContent = 'Saved!';
            setTimeout(() => {
                saveSettingsButton.textContent = originalText;
            }, 2000);
        });
    }

    // Reset to Defaults button logic
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', function() {
            const preferredSourceSelect = document.getElementById('preferred-source');
            const enableAutoSwitchingCheckbox = document.getElementById('enable-auto-switching');
            const vlcHostInput = document.getElementById('vlc-host');
            const vlcPortInput = document.getElementById('vlc-port');
            const vlcPasswordInput = document.getElementById('vlc-password');
            const vlcPollingIntervalInput = document.getElementById('vlc-polling-interval');
            const iinaPollingIntervalInput = document.getElementById('iina-polling-interval');
            const iinaStatusPathsTextarea = document.getElementById('iina-status-paths');
            const discordClientIdInput = document.getElementById('discord-client-id');
            const tmdbApiKeyInput = document.getElementById('tmdb-api-key');

            preferredSourceSelect.value = 'auto';
            enableAutoSwitchingCheckbox.checked = true;
            vlcHostInput.value = 'localhost';
            vlcPortInput.value = '8080';
            vlcPasswordInput.value = 'vlcpassword';
            vlcPollingIntervalInput.value = '1000';
            iinaPollingIntervalInput.value = '2000';
            iinaStatusPathsTextarea.value = '';
            discordClientIdInput.value = '';
            tmdbApiKeyInput.value = 'ccc1fa36a0821299ae4d7a6c155b442d';
            showNotification('Settings reset to defaults.', 'success');
        });
    }
    const themeToggle = document.getElementById('theme-toggle');
    setTheme(getSavedTheme());
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isLight = document.body.classList.contains('light-mode');
            setTheme(isLight ? 'dark' : 'light');
        });
    }
    // Toast notification for settings save
    socket.on('configUpdated', function(data) {
        if (data.success) {
            showNotification(data.message || 'Settings saved successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to save settings', 'error');
        }
    });
    // Show loading overlay on initial load
    showLoadingOverlay();
    // Error feedback from backend (VLC, IINA, Discord)
    socket.on('errorFeedback', function(error) {
        let sourceLabel = error.source || error.type;
        let message = error.message || 'Unknown error';
        showNotification(`${sourceLabel} error: ${message}`, 'error');
    });
    
    // ...existing code...

    // Socket.io event handlers
    socket.on('connect', () => {
        console.log('Connected to MediaCord server');
        MediaCordState.isConnected = true;
        hideLoadingOverlay();
        hideDisconnectedOverlay();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from MediaCord server');
        MediaCordState.isConnected = false;
        showDisconnectedOverlay();
        setDiscordStatus(false);
    });
    
    // Socket event handlers
    socket.on('mediaStatus', (status) => {
        if (!status.connected) {
            showLoadingOverlay('Waiting for media player...');
        } else {
            hideLoadingOverlay();
        }
        MediaCordState.media = {
            ...MediaCordState.media,
            ...status
        };
        updateMediaSourceStatus(status);
    });

    socket.on('discordStatus', (status) => {
        if (!status.connected) {
            showLoadingOverlay('Connecting to Discord...');
        } else {
            hideLoadingOverlay();
        }
        MediaCordState.discord = {
            ...MediaCordState.discord,
            ...status
        };
        updateDiscordStatus(status);
    });

    socket.on('config', (config) => {
        MediaCordState.currentConfig = config;
        MediaCordState.availableSources = config.availableSources || [];
        populateSettingsForm(config);
        updateIINASettingsVisibility();
        updateSourceSelection(MediaCordState.availableSources, MediaCordState.currentSource, socket);
    });

    socket.on('sourceStatuses', (statuses) => {
        MediaCordState.availableSources = statuses.available || [];
        MediaCordState.currentSource = statuses.active;
        updateSourceSelection(MediaCordState.availableSources, MediaCordState.currentSource, socket);
    });
    
    // Settings save button logic (already declared above)
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            const iinaStatusPathsTextarea = document.getElementById('iina-status-paths');
            const preferredSourceSelect = document.getElementById('preferred-source');
            const enableAutoSwitchingCheckbox = document.getElementById('enable-auto-switching');
            const vlcHostInput = document.getElementById('vlc-host');
            const vlcPortInput = document.getElementById('vlc-port');
            const vlcPasswordInput = document.getElementById('vlc-password');
            const vlcPollingIntervalInput = document.getElementById('vlc-polling-interval');
            const iinaPollingIntervalInput = document.getElementById('iina-polling-interval');
            const discordClientIdInput = document.getElementById('discord-client-id');
            const tmdbApiKeyInput = document.getElementById('tmdb-api-key');

            // Sanitize and validate inputs
            function sanitizeText(str) {
                return str.replace(/[^\w\-\.\s@]/g, '').trim();
            }
            function sanitizeHost(str) {
                return str.replace(/[^\w\-\.]/g, '').trim();
            }
            function sanitizePort(val) {
                let port = parseInt(val, 10);
                if (isNaN(port) || port < 1 || port > 65535) port = 8080;
                return port;
            }
            function sanitizeInterval(val, min, max, def) {
                let interval = parseInt(val, 10);
                if (isNaN(interval) || interval < min || interval > max) interval = def;
                return interval;
            }
            function sanitizeApiKey(str) {
                return str.replace(/[^a-zA-Z0-9]/g, '').trim();
            }

            const iinaStatusPaths = iinaStatusPathsTextarea.value
                .split('\n')
                .map(p => sanitizeText(p))
                .filter(p => p.length > 0);

            const config = {
                preferredSource: sanitizeText(preferredSourceSelect.value),
                enableAutoSourceSwitching: enableAutoSwitchingCheckbox ? enableAutoSwitchingCheckbox.checked : true,
                vlcHost: sanitizeHost(vlcHostInput.value),
                vlcPort: sanitizePort(vlcPortInput.value),
                vlcPassword: sanitizeText(vlcPasswordInput.value),
                vlcPollingInterval: sanitizeInterval(vlcPollingIntervalInput.value, 500, 5000, 1000),
                iinaPollingInterval: sanitizeInterval(iinaPollingIntervalInput.value, 500, 10000, 2000),
                iinaStatusPaths: iinaStatusPaths,
                discordClientId: sanitizeText(discordClientIdInput.value),
                tmdbApiKey: sanitizeApiKey(tmdbApiKeyInput.value)
            };

            // Basic validation feedback
            if (!config.vlcHost) {
                showNotification('VLC host is invalid.', 'error');
                return;
            }
            if (!config.vlcPassword) {
                showNotification('VLC password is required.', 'error');
                return;
            }
            if (!config.discordClientId) {
                showNotification('Discord Client ID is required.', 'error');
                return;
            }

            socket.emit('updateConfig', config);
            const originalText = saveSettingsButton.textContent;
            saveSettingsButton.textContent = 'Saved!';
            setTimeout(() => {
                saveSettingsButton.textContent = originalText;
            }, 2000);
        });
    }
    
    // Show/Hide API Key button
    const showApiKeyButton = document.getElementById('show-api-key');
    const tmdbApiKeyInput = document.getElementById('tmdb-api-key');
    if (showApiKeyButton) {
        showApiKeyButton.addEventListener('click', function() {
            if (tmdbApiKeyInput.type === 'password') {
                tmdbApiKeyInput.type = 'text';
                showApiKeyButton.textContent = 'Hide';
            } else {
                tmdbApiKeyInput.type = 'password';
                showApiKeyButton.textContent = 'Show';
            }
        });
    }
    
    // ...existing code...

    // Helper Functions
    function getSourceInfo(sourceName) {
        // ...existing code...
        if (tmdbLink) {
            tmdbLink.style.display = 'none';
        }
    }
    
    // Helper function for time formatting
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
});
