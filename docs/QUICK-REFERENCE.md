# MediaCord v2.0.0 - Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Test compatibility
npm test

# Start server
npm start

# Development mode (auto-restart)
npm run dev

# Check health
npm run health
```

## 🔧 Configuration

### Required
- **Discord Client ID** - Get from https://discord.com/developers/applications

### Optional
- **TMDb API Key** - Get from https://www.themoviedb.org/settings/api
- **VLC Settings** - Host, port, password
- **IINA Paths** - Custom status file locations

### Config Locations
1. `.env` file
2. Web UI at http://localhost:7100
3. `mediacord-config.json` (auto-generated)

## 📡 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web interface |
| `/health` | GET | Health check |
| `/api/discord/status` | GET | Discord status |
| `/api/vlc/test` | POST | Test VLC connection |
| `/api/config` | GET/POST | Configuration |

## 🔍 Health Check Response

```json
{
  "status": "ok",
  "uptime": 3600,
  "platform": "win32",
  "nodeVersion": "v22.21.0",
  "sources": {
    "vlc": true,
    "iina": false
  },
  "discord": {
    "connected": true,
    "hasClientId": true
  }
}
```

## 📝 Logging Levels

Set via `LOG_LEVEL` environment variable:

- `error` - Only errors
- `warn` - Warnings + errors
- `info` - Info + warnings + errors (default)
- `debug` - Everything

```bash
# Example
LOG_LEVEL=debug npm start
```

## 🛡️ Error Handling

### Graceful Shutdown
- `Ctrl+C` (SIGINT) - Graceful stop
- `SIGTERM` - Docker/PM2 stop
- Unhandled errors - Auto cleanup + exit

### Error Recovery
- Discord disconnection - Auto reconnect (10 attempts)
- VLC/IINA lost - Auto retry
- Config errors - Validation + warnings

## 🎯 Platform Support

| Platform | VLC | IINA | Status |
|----------|-----|------|--------|
| Windows | ✅ | ❌ | Fully supported |
| macOS | ✅ | ✅ | Fully supported |
| Linux | ✅ | ❌ | Fully supported |

## 🔐 Security

### Implemented
- ✅ Input validation
- ✅ Request timeouts (30s)
- ✅ CORS configuration
- ✅ Error sanitization
- ✅ 0 vulnerabilities

### Production Recommendations
- Use HTTPS reverse proxy
- Set restrictive CORS
- Enable rate limiting
- Monitor `/health` endpoint
- Regular updates

## 📦 Dependencies (Latest)

- axios: 1.7.9
- express: 4.21.2
- socket.io: 4.8.1
- discord-rpc: 4.0.1
- dotenv: 16.4.7
- nodemon: 3.1.10 (dev)

## 🐛 Troubleshooting

### Server won't start
1. Check Node.js version (need 18+)
2. Run `npm install`
3. Check port 7100 availability
4. Review logs for errors

### Discord not connecting
1. Verify Client ID in config
2. Check Discord app is running
3. Review `/health` endpoint
4. Check firewall settings

### VLC not detected
1. Enable HTTP interface in VLC
2. Verify host/port/password
3. Use `/api/vlc/test` endpoint
4. Check VLC is running

### IINA not working (macOS)
1. Install iina-status-bridge plugin
2. Verify IINA is installed
3. Check status file paths
4. Review IINA-INTEGRATION.md

## 📊 Monitoring

### Health Check
```bash
# Check every 30 seconds
watch -n 30 'curl -s http://localhost:7100/health | jq'
```

### Process Management
```bash
# Using PM2
pm2 start npm --name "mediacord" -- start
pm2 monit mediacord
pm2 logs mediacord
```

### Docker
```bash
# Build
docker build -t mediacord .

# Run
docker run -d -p 7100:7100 \
  -e DISCORD_CLIENT_ID=your_id \
  -e LOG_LEVEL=info \
  --name mediacord \
  mediacord
```

## 🎨 Web Interface Features

- 🟢 Live connection status indicators
- 📊 Real-time media information
- ⚙️ Easy configuration management
- 🔄 Source selection (VLC/IINA)
- 🎬 Currently playing display
- ⏯️ Play/pause status
- 📈 Progress tracking

## 📝 Environment Variables

```bash
# Required
DISCORD_CLIENT_ID=your_discord_app_id

# Optional
TMDB_API_KEY=your_tmdb_key
VLC_HOST=localhost
VLC_PORT=8080
VLC_PASSWORD=vlcpassword
PORT=7100
LOG_LEVEL=info
```

## 🔄 Update Guide

```bash
# Pull latest changes
git pull

# Update dependencies
npm install

# Test compatibility
npm test

# Restart
npm start
```

## 📚 Documentation Files

- `README.md` - Main documentation
- `IMPROVEMENTS.md` - Enhancement guide
- `UPDATE-SUMMARY.md` - v2.0.0 changes
- `CROSS-PLATFORM-CHECKLIST.md` - Compatibility
- `PLATFORM-VERIFICATION.md` - Testing docs
- `IINA-INTEGRATION.md` - IINA setup
- `VLC-SETUP.md` - VLC configuration
- `CHANGELOG.md` - Version history

---

**Quick Links:**
- GitHub: https://github.com/canna-dev/mediacord
- Issues: https://github.com/canna-dev/mediacord/issues
- Discord Developers: https://discord.com/developers/applications
- TMDb API: https://www.themoviedb.org/settings/api

**Version:** 2.0.0 | **Status:** ✅ Production Ready
