// Theme toggle logic for MediaCord Web UI

function setTheme(mode) {
    const themeIcon = document.getElementById('theme-icon');
    if (mode === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.textContent = '🌞';
    } else {
        document.body.classList.remove('light-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
    localStorage.setItem('mediacord-theme', mode);
}

function getSavedTheme() {
    return localStorage.getItem('mediacord-theme') === 'light' ? 'light' : 'dark';
}

export { setTheme, getSavedTheme };
