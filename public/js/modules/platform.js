// Platform detection for MediaCord UI

function getPlatform() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') !== -1) return 'Windows';
    if (ua.indexOf('Mac') !== -1) return 'macOS';
    if (ua.indexOf('Linux') !== -1) return 'Linux';
    return 'Unknown';
}

export { getPlatform };
