// Source selection UI logic for MediaCord Web UI

function updateSourceSelection(availableSources, currentSource, socket) {
    const sourceList = document.getElementById('source-list');
    const sourceSelection = document.getElementById('source-selection');
    const switchSourceBtn = document.getElementById('switch-source-btn');
    if (!sourceList) return;
    sourceList.innerHTML = '';
    if (availableSources.length > 1) {
        sourceSelection.style.display = 'block';
        switchSourceBtn.style.display = 'inline-block';
        availableSources.forEach(source => {
            const sourceCard = document.createElement('div');
            sourceCard.className = 'source-card' + (source.name === currentSource ? ' active' : '');
            sourceCard.innerHTML = `
                <h4>${source.displayName}</h4>
                <p>${source.description}</p>
                <small>Platform: ${source.platform}</small>
                ${source.name !== currentSource ? `<button class="switch-to-source-btn" data-source="${source.name}" tabindex="0" aria-label="Switch to ${source.displayName}" title="Switch to ${source.displayName}">Use This Source</button>` : '<span class="badge" title="Active Source">Active</span>'}
            `;
            sourceList.appendChild(sourceCard);
        });
        document.querySelectorAll('.switch-to-source-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const sourceName = this.getAttribute('data-source');
                socket.emit('switchMediaSource', sourceName);
            });
        });
    } else {
        sourceSelection.style.display = 'none';
        switchSourceBtn.style.display = 'none';
    }
}

export { updateSourceSelection };
