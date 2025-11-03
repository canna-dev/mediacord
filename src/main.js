import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MediaSourceManager } from './media-source-manager.js';
import { DiscordPresence } from './discord-presence.js';
import { ConfigManager } from './config-manager.js';
import { VLCSetupHelper } from './vlc-setup-helper.js';
import { logger } from './logger.js';
import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

// Load environment variables
dotenv.config();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize configuration manager
const configManager = new ConfigManager();
const baseConfig = configManager.getConfig();

// Configuration with fallback to env vars
const PORT = process.env.PORT || 7200;
const mediaConfig = configManager.getMediaSourceConfig();

// Override with environment variables if present
if (process.env.VLC_HOST) mediaConfig.vlcHost = process.env.VLC_HOST;
if (process.env.VLC_PORT) mediaConfig.vlcPort = process.env.VLC_PORT;
if (process.env.VLC_PASSWORD) mediaConfig.vlcPassword = process.env.VLC_PASSWORD;
if (process.env.DISCORD_CLIENT_ID) mediaConfig.discordClientId = process.env.DISCORD_CLIENT_ID;
if (process.env.TMDB_API_KEY) mediaConfig.tmdbApiKey = process.env.TMDB_API_KEY;

// Validate required configuration
function validateEnvironment() {
  if (!mediaConfig.discordClientId || mediaConfig.discordClientId === 'YOUR_DISCORD_CLIENT_ID_HERE') {
    logger.error('Missing required Discord Client ID');
    logger.info('Please configure DISCORD_CLIENT_ID in:');
    logger.info('  1. .env file, OR');
    logger.info('  2. Web UI at http://localhost:7100 (after starting)');
    logger.info('');
    logger.info('See README.md for setup instructions.');
    logger.info('Starting anyway - configure via web UI...\n');
  }
}

validateEnvironment();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Enable CORS
app.use(cors());
app.use(express.json());

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Serve static files from public directory with caching
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1h',
  etag: true
}));

// Initialize VLC setup helper
const vlcSetupHelper = new VLCSetupHelper();

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
    platform: process.platform,
    nodeVersion: process.version,
  version: pkg.version,
    sources: {
      vlc: mediaSourceManager?.vlcMonitor?.currentStatus?.connected || false,
      iina: mediaSourceManager?.iinaMonitor?.currentStatus?.connected || false,
      activeSource: mediaSourceManager?.activeSource || 'none'
    },
    discord: {
      connected: discordPresence?.connected || false,
      hasClientId: !!mediaConfig.discordClientId && mediaConfig.discordClientId !== 'YOUR_DISCORD_CLIENT_ID_HERE'
    }
  };
  res.json(health);
});
// Recent logs endpoint for debug info
app.get('/logs', (req, res) => {
  try {
    const logs = logger.getRecentLogs();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Could not retrieve logs' });
  }
});

// API endpoints for direct Discord control
app.get('/api/discord/status', (req, res) => {
  res.json(discordPresence.getConnectionStatus());
});

app.post('/api/discord/connect', (req, res) => {
  discordPresence.initialize();
  res.json({ message: 'Discord connection initiated' });
});

app.post('/api/discord/disconnect', (req, res) => {
  discordPresence.disconnect();
  res.json({ message: 'Discord disconnected' });
});

app.post('/api/discord/clear', (req, res) => {
  discordPresence.clearPresence();
  res.json({ message: 'Discord presence cleared' });
});

// VLC setup and diagnostic endpoints
app.post('/api/vlc/test', async (req, res) => {
  const { host, port, password } = req.body;
  const result = await vlcSetupHelper.testVLCConnection(host, port, password);
  res.json(result);
});

app.get('/api/vlc/setup-info', async (req, res) => {
  const systemInfo = await vlcSetupHelper.getSystemInfo();
  res.json(systemInfo);
});

app.get('/api/config', (req, res) => {
  res.json(configManager.getConfig());
});

app.post('/api/config', (req, res) => {
  const saved = configManager.saveConfig(req.body);
  res.json({ success: saved });
});

// Test VLC Connection endpoint
app.get('/api/test-vlc-connection', async (req, res) => {
  try {
    const result = await vlcSetupHelper.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ connected: false, message: error.message });
  }
});

// Media source management endpoints
app.get('/api/media-sources', (req, res) => {
  res.json(mediaSourceManager.getSourceStatuses());
});

app.post('/api/media-sources/switch', (req, res) => {
  const { source } = req.body;
  try {
    mediaSourceManager.switchToSource(source);
    res.json({ success: true, message: `Switched to ${source}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/media-sources/test/:source', async (req, res) => {
  const { source } = req.params;
  try {
    const result = await mediaSourceManager.testSource(source);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Download VLC Shortcut endpoint
app.get('/api/download-vlc-shortcut', (req, res) => {
  try {
    const shortcutPath = vlcSetupHelper.createVLCShortcut();
    res.download(shortcutPath, 'VLC_Web_Interface.lnk');
  } catch (error) {
    res.status(500).json({ error: 'Failed to create VLC shortcut', message: error.message });
  }
});

// Initialize Media Source Manager (replaces individual VLC monitor)
const mediaSourceManager = new MediaSourceManager(mediaConfig);

// Initialize Discord Presence
const discordPresence = new DiscordPresence({
  clientId: mediaConfig.discordClientId || baseConfig.discordClientId
});

// Set up WebSocket communication
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current status on connection
  socket.emit('mediaStatus', mediaSourceManager.getCurrentStatus());
  socket.emit('discordStatus', discordPresence.getConnectionStatus());
  socket.emit('config', {
    ...baseConfig,
    availableSources: mediaSourceManager.getSourceStatuses().available
  });
  
  // Handle configuration updates
  socket.on('updateConfig', (newConfig) => {
    console.log('Saving configuration...');
    
    // Save configuration
    const saved = configManager.saveConfig(newConfig);
    
    if (saved) {
      // Update media source manager
      mediaSourceManager.updateConfig(newConfig);
      
      // Update Discord presence
      if (newConfig.discordClientId) {
        discordPresence.updateConfig({
          clientId: newConfig.discordClientId
        });
      }
      
      socket.emit('configUpdated', { success: true, message: 'Configuration saved successfully!' });
    } else {
      socket.emit('configUpdated', { success: false, message: 'Failed to save configuration' });
    }
  });
  
  // Handle manual source switching
  socket.on('switchMediaSource', (sourceName) => {
    try {
      mediaSourceManager.switchToSource(sourceName);
      socket.emit('sourceSwitch', { success: true, source: sourceName });
    } catch (error) {
      socket.emit('sourceSwitch', { success: false, error: error.message });
    }
  });
  
  // Handle source status requests
  socket.on('getSourceStatuses', () => {
    socket.emit('sourceStatuses', mediaSourceManager.getSourceStatuses());
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Media source status update events
mediaSourceManager.on('statusUpdate', (status) => {
  io.emit('mediaStatus', status);
  
  // Update Discord presence based on media status
  if (status.connected) {
    discordPresence.updatePresence(status);
  } else {
    discordPresence.clearPresence();
  }
});

// Discord connection status events
discordPresence.on('connectionUpdate', (status) => {
  io.emit('discordStatus', status);
});

// Start server
server.listen(PORT, () => {
  logger.success(`MediaCord server running on http://localhost:${PORT}`);
  logger.info(`Platform: ${process.platform}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Web interface: http://localhost:${PORT}`);
  if (!mediaConfig.discordClientId || mediaConfig.discordClientId === 'YOUR_DISCORD_CLIENT_ID_HERE') {
    logger.warn('Discord Client ID not configured - configure via web UI');
  }
  
  // Start media source monitoring
  mediaSourceManager.start();
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  logger.debug('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.info('Attempting graceful shutdown...');
  cleanup();
  process.exit(1);
});

// Cleanup function
function cleanup() {
  try {
    mediaSourceManager?.stop();
    discordPresence?.disconnect();
    server?.close();
  } catch (error) {
    logger.error('Error during cleanup:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down gracefully...');
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  cleanup();
  process.exit(0);
});
