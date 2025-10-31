// MediaCord Web Interface JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.io connection
    const socket = io();
    
    // DOM Elements - Media Source
    const mediaSourceText = document.getElementById('media-source-text');
    const mediaSourceName = document.getElementById('media-source-name');
    const mediaSourceType = document.getElementById('media-source-type');
    const mediaSourceIcon = document.getElementById('media-source-icon');
    const switchSourceBtn = document.getElementById('switch-source-btn');
    const sourceSelection = document.getElementById('source-selection');
    const sourceList = document.getElementById('source-list');
    
    // DOM Elements - Status and Media
    const discordStatusText = document.getElementById('discord-status-text');
    const mediaTitle = document.getElementById('media-title');
    const mediaMetadata = document.getElementById('media-metadata');
    const mediaPoster = document.getElementById('media-poster');
    const progressFill = document.getElementById('progress-fill');
    const progressTime = document.getElementById('progress-time');
    const progressPercentage = document.getElementById('progress-percentage');
    const tmdbLink = document.getElementById('tmdb-link');
    
    // DOM Elements - Settings
    const settingsForm = document.getElementById('settings-form');
    const preferredSourceSelect = document.getElementById('preferred-source');
    const enableAutoSwitchingCheckbox = document.getElementById('enable-auto-switching');
    const vlcHostInput = document.getElementById('vlc-host');
    const vlcPortInput = document.getElementById('vlc-port');
    const vlcPasswordInput = document.getElementById('vlc-password');
    const vlcPollingIntervalInput = document.getElementById('vlc-polling-interval');
    const iinaPollingIntervalInput = document.getElementById('iina-polling-interval');
    const iinaStatusPathsTextarea = document.getElementById('iina-status-paths');
    const iinaSettingsGroup = document.getElementById('iina-settings');
    const discordClientIdInput = document.getElementById('discord-client-id');
    const tmdbApiKeyInput = document.getElementById('tmdb-api-key');
    const showApiKeyButton = document.getElementById('show-api-key');
    
    // DOM Elements - Modals
    const setupInstructionsButton = document.getElementById('setup-instructions');
    const instructionsModal = document.getElementById('instructions-modal');
    const vlcSetupModal = document.getElementById('vlc-setup-modal');
    const testVlcButton = document.getElementById('test-vlc-connection');
    const downloadShortcutButton = document.getElementById('download-vlc-shortcut');
    const closeModalButtons = document.querySelectorAll('.close-btn, .modal-close-btn');

    // Global state
    let currentConfig = {};
    let availableSources = [];
    let currentSource = null;

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Initialize tabs
    function initTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    // Initialize tabs on page load
    initTabs();

    // Socket.io event handlers
    socket.on('connect', () => {
        console.log('Connected to MediaCord server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from MediaCord server');
        setVLCStatus(false);
        setDiscordStatus(false);
    });
    
    // Socket event handlers
    socket.on('mediaStatus', (status) => {
        updateMediaSourceStatus(status);
    });
    
    socket.on('discordStatus', (status) => {
        updateDiscordStatus(status);
    });
    
    socket.on('config', (config) => {
        currentConfig = config;
        availableSources = config.availableSources || [];
        
        // Update form values with current config
        preferredSourceSelect.value = config.preferredSource || 'auto';
        if (enableAutoSwitchingCheckbox) {
            enableAutoSwitchingCheckbox.checked = config.enableAutoSourceSwitching !== false;
        }
        vlcHostInput.value = config.vlcHost || 'localhost';
        vlcPortInput.value = config.vlcPort || '8080';
        vlcPasswordInput.value = config.vlcPassword || 'vlcpassword';
        vlcPollingIntervalInput.value = config.vlcPollingInterval || 1000;
        iinaPollingIntervalInput.value = config.iinaPollingInterval || 2000;
        if (config.iinaStatusPaths && config.iinaStatusPaths.length > 0) {
            iinaStatusPathsTextarea.value = config.iinaStatusPaths.join('\n');
        }
        discordClientIdInput.value = config.discordClientId || '';
        tmdbApiKeyInput.value = config.tmdbApiKey || 'ccc1fa36a0821299ae4d7a6c155b442d';
        
        // Show IINA settings if IINA is available
        updateIINASettingsVisibility();
        
        // Update source selection UI
        updateSourceSelection();
    });
    
    socket.on('sourceStatuses', (statuses) => {
        availableSources = statuses.available || [];
        currentSource = statuses.active;
        updateSourceSelection();
    });
    
    // Settings save button
    const saveSettingsButton = document.getElementById('save-settings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            const iinaStatusPaths = iinaStatusPathsTextarea.value
                .split('\n')
                .map(p => p.trim())
                .filter(p => p.length > 0);
            
            const config = {
                preferredSource: preferredSourceSelect.value,
                enableAutoSourceSwitching: enableAutoSwitchingCheckbox ? enableAutoSwitchingCheckbox.checked : true,
                vlcHost: vlcHostInput.value,
                vlcPort: parseInt(vlcPortInput.value, 10),
                vlcPassword: vlcPasswordInput.value,
                vlcPollingInterval: parseInt(vlcPollingIntervalInput.value, 10),
                iinaPollingInterval: parseInt(iinaPollingIntervalInput.value, 10),
                iinaStatusPaths: iinaStatusPaths,
                discordClientId: discordClientIdInput.value,
                tmdbApiKey: tmdbApiKeyInput.value
            };
            
            socket.emit('updateConfig', config);
            
            // Show a temporary save confirmation
            const originalText = saveSettingsButton.textContent;
            saveSettingsButton.textContent = 'Saved!';
            setTimeout(() => {
                saveSettingsButton.textContent = originalText;
            }, 2000);
        });
    }
    
    // Show/Hide API Key button
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
    
    // Setup Instructions Modal
    if (setupInstructionsButton && instructionsModal) {
        setupInstructionsButton.addEventListener('click', function(e) {
            e.preventDefault();
            instructionsModal.style.display = 'block';
        });
    }

    // VLC Setup Wizard Button
    const vlcSetupButton = document.getElementById('vlc-setup-wizard');
    if (vlcSetupButton && vlcSetupModal) {
        vlcSetupButton.addEventListener('click', function() {
            vlcSetupModal.style.display = 'flex';
        });
    }

    // Test VLC Connection
    if (testVlcButton) {
        testVlcButton.addEventListener('click', async function() {
            const button = this;
            const originalText = button.textContent;
            button.textContent = 'Testing...';
            button.disabled = true;

            try {
                const response = await fetch('/api/test-vlc-connection');
                const result = await response.json();
                
                if (result.connected) {
                    showNotification('VLC connection successful!', 'success');
                } else {
                    showNotification('VLC connection failed: ' + (result.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showNotification('Error testing VLC connection', 'error');
            } finally {
                button.textContent = originalText;
                button.disabled = false;
            }
        });
    }

    // Download VLC Shortcut
    if (downloadShortcutButton) {
        downloadShortcutButton.addEventListener('click', function() {
            window.open('/api/download-vlc-shortcut', '_blank');
        });
    }
    
    // Close modal buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (instructionsModal) {
                instructionsModal.style.display = 'none';
            }
            if (vlcSetupModal) {
                vlcSetupModal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === instructionsModal) {
            instructionsModal.style.display = 'none';
        }
        if (e.target === vlcSetupModal) {
            vlcSetupModal.style.display = 'none';
        }
    });

    // Helper Functions
    function getSourceInfo(sourceName) {
        const sourceMap = {
            'vlc': {
                displayName: 'VLC Media Player',
                icon: 'assets/vlc.png'
            },
            'iina': {
                displayName: 'IINA',
                icon: 'assets/iina.png'
            }
        };
        
        return sourceMap[sourceName] || {
            displayName: 'Media Player',
            icon: 'assets/vlc.png'
        };
    }

    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    function updateMediaSourceStatus(status) {
        // Update source info display
        if (status.source) {
            currentSource = status.source;
            const sourceInfo = getSourceInfo(status.source);
            mediaSourceName.textContent = sourceInfo.displayName;
            mediaSourceIcon.src = sourceInfo.icon;
            
            // Update type info to show which source is active
            if (status.connected) {
                if (status.playing) {
                    mediaSourceType.textContent = `Playing (${sourceInfo.displayName})`;
                } else if (status.paused) {
                    mediaSourceType.textContent = `Paused (${sourceInfo.displayName})`;
                } else {
                    mediaSourceType.textContent = `Connected (${sourceInfo.displayName})`;
                }
            }
        } else {
            // No active source
            mediaSourceName.textContent = 'Media Player';
            mediaSourceIcon.src = 'assets/vlc.png';
        }
        
        // Update connection status
        if (mediaSourceText) {
            if (status.connected) {
                mediaSourceText.textContent = 'Connected';
                mediaSourceText.className = 'status-connected';
            } else {
                mediaSourceText.textContent = 'Disconnected';
                mediaSourceText.className = 'status-disconnected';
                mediaSourceType.textContent = 'Waiting for media player...';
            }
        }
        
        // Show switch button if multiple sources available
        if (switchSourceBtn && availableSources.length > 1) {
            switchSourceBtn.style.display = 'inline-block';
        }
        
        // Update media display
        if (status.connected) {
            if (status.title) {
                // Media is available
                mediaTitle.textContent = status.title;
                
                // Update metadata display
                if (status.metadata) {
                    const meta = status.metadata;
                    if (meta.type === 'movie') {
                        mediaMetadata.textContent = `${meta.year ? `(${meta.year}) • ` : ''}${meta.genres.slice(0, 3).join(', ')}`;
                        mediaPoster.src = meta.posterUrl || 'assets/vlc.png';
                    } else if (meta.type === 'tv') {
                        const episodeInfo = meta.formattedEpisode ? ` • ${meta.formattedEpisode}` : '';
                        mediaMetadata.textContent = `${meta.episodeTitle || ''}${episodeInfo} • ${meta.genres.slice(0, 2).join(', ')}`;
                        mediaPoster.src = meta.posterUrl || 'assets/vlc.png';
                    }
                    
                    if (meta.tmdbUrl && tmdbLink) {
                        tmdbLink.href = meta.tmdbUrl;
                        tmdbLink.style.display = 'inline-block';
                    } else if (tmdbLink) {
                        tmdbLink.style.display = 'none';
                    }
                } else {
                    mediaMetadata.textContent = status.mediaType || 'Unknown type';
                    mediaPoster.src = 'assets/vlc.png';
                    if (tmdbLink) {
                        tmdbLink.style.display = 'none';
                    }
                }
                
                // Update progress
                const position = status.position || 0;
                progressFill.style.width = `${position * 100}%`;
                
                const elapsed = formatTime(status.elapsed || 0);
                const total = formatTime(status.length || 0);
                progressTime.textContent = `${elapsed} / ${total}`;
                progressPercentage.textContent = `${Math.round(position * 100)}%`;
                
            } else {
                resetMediaDisplay();
            }
        } else {
            resetMediaDisplay();
        }
    }
    
    function updateSourceSelection() {
        if (!sourceList) return;
        
        sourceList.innerHTML = '';
        
        if (availableSources.length > 1) {
            sourceSelection.style.display = 'block';
            
            availableSources.forEach(source => {
                const sourceCard = document.createElement('div');
                sourceCard.className = 'source-card' + (source.name === currentSource ? ' active' : '');
                sourceCard.innerHTML = `
                    <h4>${source.displayName}</h4>
                    <p>${source.description}</p>
                    <small>Platform: ${source.platform}</small>
                    ${source.name !== currentSource ? `<button class="switch-to-source-btn" data-source="${source.name}">Use This Source</button>` : '<span class="badge">Active</span>'}
                `;
                sourceList.appendChild(sourceCard);
            });
            
            // Add event listeners to switch buttons
            document.querySelectorAll('.switch-to-source-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const sourceName = this.getAttribute('data-source');
                    socket.emit('switchMediaSource', sourceName);
                });
            });
        } else {
            sourceSelection.style.display = 'none';
        }
    }
    
    function updateIINASettingsVisibility() {
        if (!iinaSettingsGroup) return;
        
        // Show IINA settings if IINA is available
        const hasIINA = availableSources.some(s => s.name === 'iina');
        iinaSettingsGroup.style.display = hasIINA ? 'block' : 'none';
    }
    
    // Switch source button handler
    if (switchSourceBtn) {
        switchSourceBtn.addEventListener('click', function() {
            socket.emit('getSourceStatuses');
            if (sourceSelection) {
                sourceSelection.style.display = sourceSelection.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    function updateVLCStatus(status) {
        // Keep for backward compatibility, redirect to new function
        updateMediaSourceStatus(status);
    }
    
    function updateDiscordStatus(status) {
        setDiscordStatus(status.connected);
    }
    
    function setVLCStatus(connected) {
        if (vlcStatusText) {
            vlcStatusText.textContent = connected ? 'Connected' : 'Disconnected';
            vlcStatusText.className = connected ? 'status-connected' : 'status-disconnected';
        }
    }
    
    function setDiscordStatus(connected) {
        if (discordStatusText) {
            discordStatusText.textContent = connected ? 'Connected' : 'Disconnected';
            discordStatusText.className = connected ? 'status-connected' : 'status-disconnected';
        }
    }
    
    function resetMediaDisplay() {
        // Reset main media display
        if (mediaTitle) mediaTitle.textContent = 'Not playing';
        if (mediaMetadata) mediaMetadata.textContent = '-';
        if (mediaPoster) mediaPoster.src = 'assets/vlc.png';
        
        if (progressFill) progressFill.style.width = '0%';
        if (progressTime) progressTime.textContent = '0:00 / 0:00';
        if (progressPercentage) progressPercentage.textContent = '0%';
        
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
