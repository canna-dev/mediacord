import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import cleanTitle from './title-cleaner.js';
import { isTvShow, extractTvInfo, enhanceTmdbResult } from './tv-show-helper.js';
import { TMDbClient } from './tmdb-client.js';
import * as animeHandler from './anime-titles.js';

export class IINAMonitor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
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
      volume: 100,
      lastUpdated: Date.now(),
      source: 'iina'
    };
    
    this.interval = null;
    this.tmdbClient = new TMDbClient(config.tmdbApiKey);
    this.lastMetadataLookup = '';
    this.metadataCache = new Map();
    this.fileWatchers = [];
    
    // Check if IINA monitoring is supported on this platform
    this.isSupported = this.checkPlatformSupport();
    
    // Define possible status file locations
    this.statusPaths = this.getStatusPaths();
    this.activeStatusFile = null;
    this.lastFileData = null;
  }

  checkPlatformSupport() {
    // IINA is only available on macOS
    if (process.platform !== 'darwin') {
      console.log('IINA monitor: Not supported on this platform (IINA is macOS-only)');
      return false;
    }
    
    // Check if IINA is installed
    try {
      const iinaAppPath = '/Applications/IINA.app';
      if (fs.existsSync(iinaAppPath)) {
        console.log('IINA monitor: IINA application found');
        return true;
      } else {
        console.log('IINA monitor: IINA application not found in /Applications');
        return false;
      }
    } catch (error) {
      console.warn('IINA monitor: Error checking for IINA installation:', error.message);
      return false;
    }
  }

  isAvailable() {
    return this.isSupported;
  }

  getStatusPaths() {
    // Only return paths if platform is supported
    if (!this.isSupported) {
      return [];
    }
    
    const homeDir = os.homedir();
    const paths = [];
    
    // Primary location: home directory
    paths.push(path.join(homeDir, 'status.json'));
    
    // macOS-specific IINA plugin data directories
    const iinaDataPaths = [
      // User-specific IINA data directory
      path.join(homeDir, 'Library', 'Application Support', 'com.colliderli.iina', 'plugin_data', 'com.canna.iina-status-bridge', 'status.json'),
      // Alternative plugin data location
      path.join(homeDir, 'Library', 'Application Support', 'IINA', 'plugin_data', 'com.canna.iina-status-bridge', 'status.json'),
      // Temporary location
      path.join(homeDir, 'Library', 'Caches', 'com.colliderli.iina', 'plugin_tmp', 'com.canna.iina-status-bridge', 'status.json')
    ];
    paths.push(...iinaDataPaths);
    
    return paths;
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.tmdbClient.updateApiKey(config.tmdbApiKey);
    
    // Update status paths if custom paths provided
    if (config.iinaStatusPaths && Array.isArray(config.iinaStatusPaths)) {
      this.statusPaths = [...config.iinaStatusPaths, ...this.getStatusPaths()];
    }
    
    // Restart monitoring with new config
    this.stop();
    this.start();
  }

  start() {
    if (!this.isSupported) {
      console.log('IINA monitor: Not supported on this platform (macOS only)');
      this.currentStatus.connected = false;
      this.emit('statusUpdate', this.getCurrentStatus());
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Log status file locations on startup so user knows where to check
    console.log(`IINA monitor started - watching for status file at:`);
    console.log(`  Primary: ${this.statusPaths[0]}`);
    console.log(`  (+ ${this.statusPaths.length - 1} additional locations)`);
    
    // Start file watching
    this.startFileWatching();
    
    // Also poll files periodically as backup
    this.interval = setInterval(() => this.pollStatusFiles(), this.config.pollingInterval || 2000);
    
    // Poll immediately on start
    this.pollStatusFiles();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Stop file watchers
    this.stopFileWatching();
    
    // Update status to disconnected
    this.currentStatus.connected = false;
    this.emit('statusUpdate', this.getCurrentStatus());
    
    console.log('IINA monitor stopped');
  }

  startFileWatching() {
    this.stopFileWatching(); // Clean up any existing watchers
    
    this.statusPaths.forEach(filePath => {
      try {
        // Watch for file changes
        if (fs.existsSync(filePath)) {
          console.log(`Watching IINA status file: ${filePath}`);
          const watcher = fs.watchFile(filePath, { interval: 500 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
              this.readStatusFile(filePath);
            }
          });
          this.fileWatchers.push({ path: filePath, watcher });
        } else {
          // Watch for file creation
          const dir = path.dirname(filePath);
          if (fs.existsSync(dir)) {
            const watcher = fs.watch(dir, (eventType, filename) => {
              if (filename === path.basename(filePath) && eventType === 'rename') {
                if (fs.existsSync(filePath)) {
                  console.log(`IINA status file created: ${filePath}`);
                  this.readStatusFile(filePath);
                  // Switch to watching the file directly
                  this.startFileWatching();
                }
              }
            });
            this.fileWatchers.push({ path: dir, watcher });
          }
        }
      } catch (error) {
        console.warn(`Could not watch IINA status file ${filePath}:`, error.message);
      }
    });
  }

  stopFileWatching() {
    this.fileWatchers.forEach(({ path, watcher }) => {
      try {
        if (typeof watcher.close === 'function') {
          watcher.close();
        } else {
          fs.unwatchFile(path);
        }
      } catch (error) {
        console.warn(`Error stopping file watcher for ${path}:`, error.message);
      }
    });
    this.fileWatchers = [];
  }

  getCurrentStatus() {
    return { ...this.currentStatus };
  }

  pollStatusFiles() {
    // Check all status file locations
    for (const filePath of this.statusPaths) {
      if (this.readStatusFile(filePath)) {
        // Successfully read from this file, mark it as active
        if (this.activeStatusFile !== filePath) {
          this.activeStatusFile = filePath;
          console.log(`✅ IINA connected - reading from: ${filePath}`);
        }
        return; // Stop checking other files once we find a valid one
      }
    }
    
    // No valid status files found - don't spam, we already logged paths on startup
    if (this.currentStatus.connected) {
      console.log('IINA disconnected - status file not found');
      this.currentStatus.connected = false;
      this.currentStatus.playing = false;
      this.currentStatus.paused = false;
      this.currentStatus.title = null;
      this.currentStatus.originalTitle = null;
      this.currentStatus.mediaType = null;
      this.currentStatus.metadata = null;
      this.emit('statusUpdate', this.getCurrentStatus());
    }
  }

  readStatusFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      const stat = fs.statSync(filePath);
      const currentTime = Date.now();
      
      // Check if file is recent (within last 10 seconds)
      if (currentTime - stat.mtime.getTime() > 10000) {
        return false; // File is too old
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8').trim();
      if (!fileContent) {
        return false;
      }
      
      // Skip if content hasn't changed
      if (fileContent === this.lastFileData) {
        return this.currentStatus.connected;
      }
      
      this.lastFileData = fileContent;
      
      // Parse the JSON status
      const statusData = JSON.parse(fileContent);
      
      // Validate required fields
      if (!statusData || typeof statusData !== 'object') {
        return false;
      }
      
      return this.processStatusData(statusData);
      
    } catch (error) {
      // Silently ignore parse errors (file might be being written)
      return false;
    }
  }

  processStatusData(statusData) {
    const wasConnected = this.currentStatus.connected;
    
    // Update connection status
    this.currentStatus.connected = true;
    this.currentStatus.lastUpdated = Date.now();
    
    // Map IINA status to MediaCord format
    const state = statusData.state || 'stopped';
    this.currentStatus.playing = state === 'playing';
    this.currentStatus.paused = state === 'paused';
    
    // Time and position information
    const time = statusData.time || 0;
    const length = statusData.length || 0;
    this.currentStatus.elapsed = Math.floor(time);
    this.currentStatus.length = Math.floor(length);
    this.currentStatus.remaining = Math.floor(length - time);
    this.currentStatus.position = length > 0 ? time / length : 0;
    this.currentStatus.percentage = Math.floor(this.currentStatus.position * 100);
    
    // Volume information
    this.currentStatus.volume = statusData.volume || 100;
    
    // Media title processing
    const filename = statusData.filename || '';
    
    if (!filename || state === 'stopped') {
      this.currentStatus.title = null;
      this.currentStatus.originalTitle = null;
      this.currentStatus.mediaType = null;
      this.currentStatus.metadata = null;
    } else {
      this.processMediaTitle(filename);
    }
    
    // Emit status update
    this.emit('statusUpdate', this.getCurrentStatus());
    
    // Log connection established
    if (!wasConnected) {
      console.log('IINA connection established');
    }
    
    return true;
  }

  async processMediaTitle(filename) {
    // Store the original filename
    this.currentStatus.originalTitle = filename;
    
    // Determine media type using existing MediaCord logic
    let mediaType = 'unknown';
    if (isTvShow(filename)) {
      mediaType = 'tv';
    } else if (filename.toLowerCase().includes('anime') || 
               /\[(?:subsplease|erai-raws|horriblesubs|judas|mtbb)\]/i.test(filename)) {
      mediaType = 'anime';
    }
    
    // Use the enhanced title cleaner
    const cleanInfo = cleanTitle(filename);
    if (cleanInfo && cleanInfo.type && mediaType === 'unknown') {
      mediaType = cleanInfo.type;
    }
    
    this.currentStatus.mediaType = mediaType || 'movie';
    
    // Process title based on media type
    let titleForLookup;
    if (!cleanInfo || !cleanInfo.title || cleanInfo.title === 'Unknown') {
      // Fallback to basic filename processing
      titleForLookup = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      this.currentStatus.title = titleForLookup;
    } else {
      // Use cleaned title information
      if (mediaType === 'tv' || cleanInfo.type === 'tv') {
        titleForLookup = cleanInfo.showTitle || cleanInfo.title;
        this.currentStatus.title = titleForLookup;
        
        if (cleanInfo.season !== null && cleanInfo.episode !== null) {
          this.currentStatus.season = cleanInfo.season;
          this.currentStatus.episode = cleanInfo.episode;
          this.currentStatus.episodeTitle = cleanInfo.episodeTitle;
        }
      } else if (mediaType === 'anime' || cleanInfo.type === 'anime') {
        titleForLookup = cleanInfo.title;
        this.currentStatus.title = titleForLookup;
        
        if (cleanInfo.season !== null && cleanInfo.episode !== null) {
          this.currentStatus.season = cleanInfo.season;
          this.currentStatus.episode = cleanInfo.episode;
          this.currentStatus.episodeTitle = cleanInfo.episodeTitle;
        }
      } else {
        titleForLookup = cleanInfo.title;
        this.currentStatus.title = titleForLookup;
        
        if (cleanInfo.year) {
          this.currentStatus.year = cleanInfo.year;
        }
      }
    }
    
    // Fetch metadata if title changed and media is playing
    if (titleForLookup !== this.lastMetadataLookup && this.currentStatus.playing) {
      this.lastMetadataLookup = titleForLookup;
      
      // Check cache first
      if (this.metadataCache.has(titleForLookup)) {
        this.currentStatus.metadata = this.metadataCache.get(titleForLookup);
      } else {
        try {
          const metadata = await this.fetchMetadata(filename, mediaType);
          if (metadata) {
            this.currentStatus.metadata = metadata;
            this.metadataCache.set(titleForLookup, metadata);
          }
        } catch (error) {
          console.error('Error fetching metadata:', error.message);
        }
      }
    }
  }

  async fetchMetadata(title, mediaType) {
    try {
      let metadata = null;
      
      // Use the enhanced title cleaner
      const cleanInfo = cleanTitle(title);
      
      if (mediaType === 'movie' || cleanInfo.type === 'movie') {
        metadata = await this.tmdbClient.searchMovie(cleanInfo.title, cleanInfo.year);
      } else if (mediaType === 'tv' || cleanInfo.type === 'tv') {
        metadata = await this.tmdbClient.searchTvShow(
          cleanInfo.showTitle || cleanInfo.title,
          cleanInfo.season,
          cleanInfo.episode,
          title
        );
        
        if (metadata && cleanInfo.season !== null && cleanInfo.episode !== null) {
          metadata = enhanceTmdbResult(metadata, {
            season: cleanInfo.season,
            episode: cleanInfo.episode,
            episodeTitle: cleanInfo.episodeTitle
          });
        }
      } else if (mediaType === 'anime' || cleanInfo.type === 'anime') {
        if (cleanInfo.season !== null && cleanInfo.episode !== null) {
          metadata = await this.tmdbClient.searchTvShow(
            cleanInfo.showTitle || cleanInfo.title,
            cleanInfo.season,
            cleanInfo.episode,
            title
          );
        } else {
          metadata = await this.tmdbClient.searchMovie(cleanInfo.title, cleanInfo.year);
        }
        
        if (metadata) {
          console.log(`Applying anime formatting to "${metadata.title}"`);
          metadata = animeHandler.formatAnimeTitle(metadata);
        }
      } else {
        metadata = await this.tmdbClient.searchGeneric(cleanInfo.title);
      }
      
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error.message);
      return null;
    }
  }
}