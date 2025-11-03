// Settings form logic for MediaCord Web UI

function populateSettingsForm(config) {
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
}

export { populateSettingsForm };
