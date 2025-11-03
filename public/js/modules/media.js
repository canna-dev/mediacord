// Media source status and preview logic for MediaCord Web UI

function updateMediaSourceStatus(status) {
    const mediaTitle = document.getElementById('media-title');
    const mediaMetadata = document.getElementById('media-metadata');
    const mediaPoster = document.getElementById('media-poster');
    const progressFill = document.getElementById('progress-fill');
    const progressTime = document.getElementById('progress-time');
    const progressPercentage = document.getElementById('progress-percentage');
    const tmdbLink = document.getElementById('tmdb-link');
    const imdbLink = document.getElementById('imdb-link');

    if (status.connected) {
        if (status.title) {
            mediaTitle.textContent = status.title;
            if (status.metadata) {
                const meta = status.metadata;
                if (meta.type === 'movie') {
                    mediaMetadata.textContent = `${meta.year ? `(${meta.year}) \u2022 ` : ''}${meta.genres.slice(0, 3).join(', ')}`;
                    mediaPoster.src = meta.posterUrl || 'assets/vlc.png';
                } else if (meta.type === 'tv') {
                    const episodeInfo = meta.formattedEpisode ? ` \u2022 ${meta.formattedEpisode}` : '';
                    mediaMetadata.textContent = `${meta.episodeTitle || ''}${episodeInfo} \u2022 ${meta.genres.slice(0, 2).join(', ')}`;
                    mediaPoster.src = meta.posterUrl || 'assets/vlc.png';
                }
                if (meta.imdbId && meta.imdbId.length > 0) {
                    const imdbUrl = `https://www.imdb.com/title/${meta.imdbId}/`;
                    if (imdbLink) {
                        imdbLink.href = imdbUrl;
                        imdbLink.style.display = 'inline-block';
                    }
                    if (tmdbLink) tmdbLink.style.display = 'none';
                } else if (meta.tmdbUrl && tmdbLink) {
                    tmdbLink.href = meta.tmdbUrl;
                    tmdbLink.style.display = 'inline-block';
                    if (imdbLink) imdbLink.style.display = 'none';
                } else {
                    if (tmdbLink) tmdbLink.style.display = 'none';
                    if (imdbLink) imdbLink.style.display = 'none';
                }
            } else {
                mediaMetadata.textContent = status.mediaType || 'Unknown type';
                mediaPoster.src = 'assets/vlc.png';
                if (tmdbLink) tmdbLink.style.display = 'none';
                if (imdbLink) imdbLink.style.display = 'none';
            }
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

function resetMediaDisplay() {
    const mediaTitle = document.getElementById('media-title');
    const mediaMetadata = document.getElementById('media-metadata');
    const mediaPoster = document.getElementById('media-poster');
    const progressFill = document.getElementById('progress-fill');
    const progressTime = document.getElementById('progress-time');
    const progressPercentage = document.getElementById('progress-percentage');
    const tmdbLink = document.getElementById('tmdb-link');
    const imdbLink = document.getElementById('imdb-link');
    if (mediaTitle) mediaTitle.textContent = 'Not playing';
    if (mediaMetadata) mediaMetadata.textContent = '-';
    if (mediaPoster) mediaPoster.src = 'assets/vlc.png';
    if (progressFill) progressFill.style.width = '0%';
    if (progressTime) progressTime.textContent = '0:00 / 0:00';
    if (progressPercentage) progressPercentage.textContent = '0%';
    if (tmdbLink) tmdbLink.style.display = 'none';
    if (imdbLink) imdbLink.style.display = 'none';
}

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

export { updateMediaSourceStatus, resetMediaDisplay, formatTime };
