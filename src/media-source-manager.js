import { EventEmitter } from 'events';
import { VLCMonitor } from './vlc-monitor.js';
import { IINAMonitor } from './iina-monitor.js';

export class MediaSourceManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    
    // Initialize both monitors
    this.vlcMonitor = new VLCMonitor({
      host: config.vlcHost || 'localhost',
      port: config.vlcPort || 8080,
      password: config.vlcPassword || 'vlcpassword',
      tmdbApiKey: config.tmdbApiKey,
      pollingInterval: config.vlcPollingInterval || 1000
    });
    
    this.iinaMonitor = new IINAMonitor({
      tmdbApiKey: config.tmdbApiKey,
      pollingInterval: config.iinaPollingInterval || 2000,
      iinaStatusPaths: config.iinaStatusPaths
    });
    
    // Current active source
    this.activeSource = null;
    this.preferredSource = config.preferredSource || 'auto'; // 'vlc', 'iina', or 'auto'
    
    // Combined status
    this.currentStatus = {
      connected: false,
      playing: false,
      paused: false,
      title: null,
      originalTitle: null,
      position: 0,
      length: 0,
      elapsed: 0,
      remaining: 0,
      percentage: 0,
      mediaType: null,
      metadata: null,
      lastUpdated: Date.now(),
      source: null,
      availableSources: this.getAvailableSources()
    };
    
    this.setupEventHandlers();
  }

  getAvailableSources() {
    const sources = [];
    
    // VLC is available on all platforms
    sources.push({
      name: 'vlc',
      displayName: 'VLC Media Player',
      description: 'Monitor VLC via HTTP interface',
      available: true,
      platform: 'all'
    });
    
    // IINA only on macOS
    if (this.iinaMonitor.isAvailable()) {
      sources.push({
        name: 'iina',
        displayName: 'IINA',
        description: 'Monitor IINA via status bridge plugin',
        available: true,
        platform: 'macOS'
      });
    }
    
    return sources;
  }

  setupEventHandlers() {
    // VLC status updates
    this.vlcMonitor.on('statusUpdate', (status) => {
      this.handleStatusUpdate('vlc', status);
    });
    
    // IINA status updates
    this.iinaMonitor.on('statusUpdate', (status) => {
      this.handleStatusUpdate('iina', status);
    });
  }

  handleStatusUpdate(source, status) {
    const wasConnected = this.currentStatus.connected;
    const previousSource = this.activeSource;
    
    // Determine which source should be active based on connection status and preferences
    const shouldSwitchSource = this.shouldUseSource(source, status);
    
    if (shouldSwitchSource) {
      // Switch to this source
      if (this.activeSource !== source) {
        console.log(`Media source switched: ${this.activeSource || 'none'} -> ${source}`);
        this.activeSource = source;
        
        // Stop monitoring from other sources to avoid conflicts
        if (source === 'vlc' && this.iinaMonitor) {
          // Don't actually stop IINA monitor, just ignore its updates temporarily
        } else if (source === 'iina' && this.vlcMonitor) {
          // Don't actually stop VLC monitor, just ignore its updates temporarily
        }
      }
      
      // Update current status
      this.currentStatus = {
        ...status,
        source: source,
        availableSources: this.currentStatus.availableSources
      };
      
      // Emit the updated status
      this.emit('statusUpdate', this.getCurrentStatus());
      
      // Log source changes
      if (previousSource !== source && status.connected) {
        console.log(`Now monitoring: ${source.toUpperCase()}`);
      }
    } else if (this.activeSource === source && !status.connected) {
      // Current source disconnected, try to find alternative
      this.findAlternativeSource();
    }
  }

  shouldUseSource(source, status) {
    // If no active source and this one is connected, use it
    if (!this.activeSource && status.connected) {
      return true;
    }
    
    // If this is the current active source, always update (even if disconnected)
    if (this.activeSource === source) {
      return true;
    }
    
    // Handle preferred source
    if (this.preferredSource !== 'auto') {
      // User has a specific preference
      if (this.preferredSource === source && status.connected) {
        return true;
      }
      return false;
    }
    
    // Auto mode: prefer IINA on macOS if available and connected
    if (source === 'iina' && status.connected && process.platform === 'darwin') {
      return true;
    }
    
    // Auto mode: use VLC if IINA is not available or not connected
    if (source === 'vlc' && status.connected && 
        (!this.iinaMonitor.isAvailable() || !this.getCurrentSourceStatus('iina').connected)) {
      return true;
    }
    
    return false;
  }

  findAlternativeSource() {
    const availableSources = this.getAvailableSources();
    
    for (const sourceInfo of availableSources) {
      const sourceName = sourceInfo.name;
      if (sourceName !== this.activeSource) {
        const sourceStatus = this.getCurrentSourceStatus(sourceName);
        if (sourceStatus.connected) {
          console.log(`Switching to alternative source: ${sourceName}`);
          this.handleStatusUpdate(sourceName, sourceStatus);
          return;
        }
      }
    }
    
    // No alternative sources available
    console.log('No alternative media sources available');
    this.activeSource = null;
    this.currentStatus.connected = false;
    this.currentStatus.playing = false;
    this.currentStatus.paused = false;
    this.currentStatus.source = null;
    this.emit('statusUpdate', this.getCurrentStatus());
  }

  getCurrentSourceStatus(source) {
    switch (source) {
      case 'vlc':
        return this.vlcMonitor.getCurrentStatus();
      case 'iina':
        return this.iinaMonitor.getCurrentStatus();
      default:
        return { connected: false };
    }
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
    
    // Update preferred source if specified
    if (config.preferredSource) {
      this.preferredSource = config.preferredSource;
      console.log(`Media source preference updated: ${this.preferredSource}`);
    }
    
    // Update VLC monitor config
    if (config.vlcHost || config.vlcPort || config.vlcPassword || config.tmdbApiKey || config.vlcPollingInterval) {
      this.vlcMonitor.updateConfig({
        host: config.vlcHost || this.config.vlcHost,
        port: config.vlcPort || this.config.vlcPort,
        password: config.vlcPassword || this.config.vlcPassword,
        tmdbApiKey: config.tmdbApiKey || this.config.tmdbApiKey,
        pollingInterval: config.vlcPollingInterval || this.config.vlcPollingInterval
      });
    }
    
    // Update IINA monitor config
    if (config.tmdbApiKey || config.iinaPollingInterval || config.iinaStatusPaths) {
      this.iinaMonitor.updateConfig({
        tmdbApiKey: config.tmdbApiKey || this.config.tmdbApiKey,
        pollingInterval: config.iinaPollingInterval || this.config.iinaPollingInterval,
        iinaStatusPaths: config.iinaStatusPaths || this.config.iinaStatusPaths
      });
    }
    
    // Update available sources
    this.currentStatus.availableSources = this.getAvailableSources();
  }

  start() {
    console.log('Starting Media Source Manager...');
    console.log(`Available sources: ${this.getAvailableSources().map(s => s.name).join(', ')}`);
    console.log(`Preferred source: ${this.preferredSource}`);

    // Start IINA if available
    let iinaStarted = false;
    if (this.iinaMonitor.isAvailable()) {
      this.iinaMonitor.start();
      iinaStarted = true;
    }

    // Only start VLC if:
    // - Preferred source is 'vlc'
    // - Preferred source is 'auto' and IINA is not available/connected
    const shouldStartVLC = (
      this.preferredSource === 'vlc' ||
      (this.preferredSource === 'auto' && (!iinaStarted || !this.iinaMonitor.getCurrentStatus().connected))
    );
    if (shouldStartVLC) {
      this.vlcMonitor.start();
    } else {
      this.vlcMonitor.stop();
    }
  }

  stop() {
    console.log('Stopping Media Source Manager...');
    
    // Stop all monitors
    this.vlcMonitor.stop();
    this.iinaMonitor.stop();
    
    // Reset status
    this.activeSource = null;
    this.currentStatus.connected = false;
    this.currentStatus.playing = false;
    this.currentStatus.paused = false;
    this.currentStatus.source = null;
    
    this.emit('statusUpdate', this.getCurrentStatus());
  }

  getCurrentStatus() {
    return { ...this.currentStatus };
  }

  getSourceStatuses() {
    return {
      vlc: this.vlcMonitor.getCurrentStatus(),
      iina: this.iinaMonitor.getCurrentStatus(),
      active: this.activeSource,
      available: this.getAvailableSources()
    };
  }

  // Manual source switching
  switchToSource(sourceName) {
    const availableSources = this.getAvailableSources().map(s => s.name);
    
    if (!availableSources.includes(sourceName)) {
      throw new Error(`Source '${sourceName}' is not available`);
    }
    
    console.log(`Manually switching to source: ${sourceName}`);
    this.preferredSource = sourceName;
    
    const sourceStatus = this.getCurrentSourceStatus(sourceName);
    if (sourceStatus.connected) {
      this.handleStatusUpdate(sourceName, sourceStatus);
    } else {
      console.warn(`Source '${sourceName}' is not currently connected`);
    }
  }

  // Test connectivity for a specific source
  async testSource(sourceName) {
    switch (sourceName) {
      case 'vlc':
        // VLC test is handled by VLCSetupHelper, but we can check current status
        return {
          source: 'vlc',
          available: true,
          connected: this.vlcMonitor.getCurrentStatus().connected,
          platform: process.platform
        };
      
      case 'iina':
        return {
          source: 'iina',
          available: this.iinaMonitor.isAvailable(),
          connected: this.iinaMonitor.getCurrentStatus().connected,
          platform: process.platform,
          supported: process.platform === 'darwin'
        };
      
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }
}