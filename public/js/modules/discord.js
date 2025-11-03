// Discord status and account info logic for MediaCord Web UI

function updateDiscordStatus(status) {
    const discordStatusText = document.getElementById('discord-status-text');
    const discordAccountInfo = document.getElementById('discord-account-info');
    const discordReconnectBtn = document.getElementById('discord-reconnect-btn');
    setDiscordStatus(status.connected);
    if (discordAccountInfo) {
        if (status.connected && status.username) {
            discordAccountInfo.textContent = `Connected as ${status.username}`;
            discordAccountInfo.style.display = 'inline-block';
            if (discordReconnectBtn) discordReconnectBtn.style.display = 'none';
        } else {
            discordAccountInfo.textContent = '';
            discordAccountInfo.style.display = 'none';
            if (discordReconnectBtn) discordReconnectBtn.style.display = 'inline-block';
        }
    }
}

function setDiscordStatus(connected) {
    const discordStatusText = document.getElementById('discord-status-text');
    if (discordStatusText) {
        discordStatusText.textContent = connected ? 'Connected' : 'Disconnected';
        discordStatusText.className = connected ? 'status-connected' : 'status-disconnected';
    }
}

export { updateDiscordStatus, setDiscordStatus };
