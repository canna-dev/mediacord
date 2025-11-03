// Centralized state management for MediaCord Web UI

const MediaCordState = {
    isConnected: false,
    currentConfig: {},
    availableSources: [],
    currentSource: null,
    theme: localStorage.getItem('mediacord-theme') === 'light' ? 'light' : 'dark',
    overlays: {
        loading: false,
        disconnected: false
    },
    discord: {
        connected: false,
        username: ''
    },
    media: {
        connected: false,
        title: '',
        metadata: null,
        position: 0,
        elapsed: 0,
        length: 0
    }
};

export default MediaCordState;
