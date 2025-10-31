import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, '..', 'mediacord-config.json');

export class ConfigManager {
  constructor() {
    this.defaultConfig = {
      // VLC settings
      vlcHost: 'localhost',
      vlcPort: 8080,
      vlcPassword: 'vlcpassword',
      vlcPollingInterval: 500,
      
      // IINA settings
      iinaPollingInterval: 500,
      iinaStatusPaths: [], // Custom status file paths (empty = use defaults)
      
      // Media source preferences
      preferredSource: 'auto', // 'vlc', 'iina', or 'auto'
      enableAutoSourceSwitching: true,
      
      // External service settings
      tmdbApiKey: 'ccc1fa36a0821299ae4d7a6c155b442d'
    };
    
    this.config = this.loadConfig();
  }
  
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const savedConfig = JSON.parse(data);
        
        // Merge with defaults to ensure all keys exist
        return { ...this.defaultConfig, ...savedConfig };
      }
    } catch (error) {
      console.warn('Error loading config file, using defaults:', error.message);
    }
    
    return { ...this.defaultConfig };
  }
  
  saveConfig(newConfig) {
    try {
      // Validate certain config values
      const validatedConfig = this.validateConfig(newConfig);
      
      // Merge with current config
      this.config = { ...this.config, ...validatedConfig };
      
      // Save to file
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
      
      return true;
    } catch (error) {
      console.error('Error saving config:', error.message);
      return false;
    }
  }
  
  validateConfig(config) {
    const validated = { ...config };
    
    // Validate polling intervals
    if (validated.vlcPollingInterval !== undefined) {
      validated.vlcPollingInterval = Math.max(500, Math.min(10000, validated.vlcPollingInterval));
    }
    
    if (validated.iinaPollingInterval !== undefined) {
      validated.iinaPollingInterval = Math.max(500, Math.min(10000, validated.iinaPollingInterval));
    }
    
    // Validate preferred source
    if (validated.preferredSource !== undefined) {
      const validSources = ['auto', 'vlc', 'iina'];
      if (!validSources.includes(validated.preferredSource)) {
        validated.preferredSource = 'auto';
      }
    }
    
    // Validate IINA status paths
    if (validated.iinaStatusPaths !== undefined && !Array.isArray(validated.iinaStatusPaths)) {
      validated.iinaStatusPaths = [];
    }
    
    return validated;
  }
  
  getConfig() {
    return { ...this.config };
  }
  
  get(key) {
    return this.config[key];
  }
  
  set(key, value) {
    this.config[key] = value;
    return this.saveConfig({ [key]: value });
  }
  
  // Get media source specific configuration
  getVLCConfig() {
    return {
      host: this.config.vlcHost,
      port: this.config.vlcPort,
      password: this.config.vlcPassword,
      pollingInterval: this.config.vlcPollingInterval,
      tmdbApiKey: this.config.tmdbApiKey
    };
  }
  
  getIINAConfig() {
    return {
      pollingInterval: this.config.iinaPollingInterval,
      statusPaths: this.config.iinaStatusPaths,
      tmdbApiKey: this.config.tmdbApiKey
    };
  }
  
  getMediaSourceConfig() {
    return {
      preferredSource: this.config.preferredSource,
      enableAutoSourceSwitching: this.config.enableAutoSourceSwitching,
      vlcHost: this.config.vlcHost,
      vlcPort: this.config.vlcPort,
      vlcPassword: this.config.vlcPassword,
      vlcPollingInterval: this.config.vlcPollingInterval,
      iinaPollingInterval: this.config.iinaPollingInterval,
      iinaStatusPaths: this.config.iinaStatusPaths,
      tmdbApiKey: this.config.tmdbApiKey
    };
  }
  
  // Check if IINA is configured
  isIINAConfigured() {
    return process.platform === 'darwin'; // IINA is only available on macOS
  }
  
  // Get platform-specific default configuration
  getPlatformDefaults() {
    const defaults = { ...this.defaultConfig };
    
    // Adjust defaults based on platform
    if (process.platform === 'darwin') {
      // macOS: prefer IINA if available
      defaults.preferredSource = 'auto';
    } else {
      // Other platforms: VLC only
      defaults.preferredSource = 'vlc';
    }
    
    return defaults;
  }
}
