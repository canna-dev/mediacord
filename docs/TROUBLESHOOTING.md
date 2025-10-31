# MediaCord Troubleshooting Guide

## Common Issues and Solutions

### VLC Issues

#### ⚠️ "VLC not detected - Make sure VLC is running with HTTP interface enabled"

**Problem**: MediaCord can't connect to VLC's HTTP interface.

**Solutions**:
1. **Make sure VLC is running** with the HTTP interface enabled
2. **Test VLC connection**: Run `npm run test-vlc` for detailed diagnostics
3. **Check VLC settings**:
   - Tools → Preferences → Show all settings (bottom left)
   - Interface → Main interfaces → Check "Web"
   - Interface → Main interfaces → Lua → Lua HTTP → Set password
4. **Launch VLC with parameters**:
   ```bash
   vlc --intf http --http-host localhost --http-port 8080 --http-password vlcpassword
   ```
5. **Verify settings in MediaCord**:
   - Open http://localhost:7100
   - Settings → VLC Connection
   - Host: `localhost`, Port: `8080`, Password: `vlcpassword`

#### ⚠️ "VLC authentication failed - Check your password in settings"

**Problem**: VLC is running but the password is incorrect.

**Solutions**:
1. Check your VLC HTTP password setting (Tools → Preferences → Interface → Lua → Lua HTTP)
2. Update MediaCord settings to match:
   - Web UI: Settings → VLC Connection → Password
   - Or in `.env`: `VLC_PASSWORD=your_password_here`

#### ⚠️ "VLC connection timeout - VLC might be busy"

**Problem**: VLC is running but not responding.

**Solutions**:
1. Restart VLC
2. Check if another application is using port 8080
3. Try a different port in VLC settings and update MediaCord accordingly

---

### IINA Issues (macOS Only)

#### ❌ IINA Not Detected

**Problem**: MediaCord doesn't show IINA as an available source.

**Platform Check**:
- IINA only works on macOS. If you're on Windows/Linux, use VLC instead.

**On macOS**:
1. **Verify IINA is installed**:
   ```bash
   ls /Applications/IINA.app
   ```
2. **Run the IINA diagnostic**:
   ```bash
   npm run test:iina
   ```

#### ❌ IINA Plugin Not Working

**Problem**: IINA is installed but MediaCord can't read its status.

**Solutions**:

1. **Install the iina-status-bridge plugin**:
   - Download from: https://github.com/canna-dev/iina-status-bridge/releases
   - Double-click the `.iinaplugin` file to install
   - Or manually place in `~/Library/Application Support/com.colliderli.iina/plugins/`

2. **Restart IINA after installing the plugin**

3. **Verify plugin installation**:
   ```bash
   npm run test:iina
   ```
   This will show:
   - If IINA is installed
   - If the plugin is detected
   - Where status files are located
   - Current IINA playback status

4. **Check status file manually**:
   ```bash
   cat ~/status.json
   ```
   Should show JSON like:
   ```json
   {
     "filename": "video.mkv",
     "time": 123.45,
     "length": 3600,
     "volume": 75,
     "state": "playing"
   }
   ```

5. **Enable debug mode** to see detailed IINA monitoring logs:
   - Add to `.env` file:
     ```
     IINA_DEBUG_MODE=true
     ```
   - Restart MediaCord
   - Check console for debug messages starting with 🔍

6. **Possible status file locations**:
   - `~/status.json` (primary)
   - `~/Library/Application Support/com.colliderli.iina/plugin_data/com.canna.iina-status-bridge/status.json`
   - `~/Library/Application Support/IINA/plugin_data/com.canna.iina-status-bridge/status.json`

---

### Discord Issues

#### ❌ Discord Status Not Updating

**Problem**: MediaCord connects to media player but Discord doesn't show activity.

**Solutions**:
1. **Verify Discord Client ID is set**:
   - Settings → Discord Integration → Client ID
   - Or in `.env`: `DISCORD_CLIENT_ID=your_client_id_here`

2. **Create Discord Application**:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Copy the Application ID

3. **Upload Discord assets**:
   - In your Discord Application: Rich Presence → Art Assets
   - Upload images named:
     - `vlc` - VLC logo
     - `iina` - IINA logo (optional)
     - `play` - Play icon
     - `pause` - Pause icon

4. **Restart Discord desktop app**

5. **Check Discord status in MediaCord**:
   - Web UI should show "Discord: Connected"

#### ⚠️ Discord Shows "Not playing" Despite Media Playing

**Problem**: Discord connection works but doesn't update with media info.

**Solutions**:
1. Make sure media is actually playing (not paused)
2. Check that the media file has a recognizable filename
3. Verify TMDb API is working (Settings → TMDb Integration)
4. Check browser console (F12) for errors

---

### TMDb Metadata Issues

#### ❌ No Movie/TV Show Information

**Problem**: Media plays but no metadata (poster, description) appears.

**Solutions**:
1. **Check internet connection** - TMDb requires internet access
2. **Verify TMDb API key**:
   - Settings → TMDb Integration → API Key
   - Default key should work, but you can get your own at https://www.themoviedb.org/
3. **Check filename format**:
   - Movies: `Movie.Title.2023.1080p.mkv`
   - TV Shows: `Show.Name.S01E05.1080p.mkv`
   - MediaCord uses the filename to search TMDb

#### ⚠️ Wrong Metadata Displayed

**Problem**: Shows the wrong movie/show information.

**Solutions**:
1. **Rename file with more specific information**:
   - Include year for movies: `Inception.2010.mkv`
   - Use proper S##E## format for TV: `Breaking.Bad.S01E01.mkv`
2. Clear browser cache and refresh
3. Check TMDb to see if the show exists: https://www.themoviedb.org/

---

### Web Interface Issues

#### ❌ Can't Access Web Interface

**Problem**: http://localhost:7100 doesn't load.

**Solutions**:
1. **Verify MediaCord is running**:
   ```bash
   npm start
   ```
2. **Check the port** in `.env`:
   ```
   WEB_PORT=7100
   ```
3. **Check for port conflicts**:
   - Another application might be using port 7100
   - Try a different port in `.env`
4. **Check firewall settings** - Allow Node.js through firewall

#### ⚠️ Settings Not Saving

**Problem**: Changes in web UI don't persist.

**Solutions**:
1. Click "Save Settings" button
2. Check browser console (F12) for errors
3. Verify file permissions on `mediacord-config.json`
4. Restart MediaCord after saving

---

### General Debugging

#### Enable Verbose Logging

**For VLC**:
- Errors are now rate-limited (1 per 30 seconds) to reduce spam
- Check console for ⚠️ warnings

**For IINA** (macOS only):
- Add to `.env`:
  ```
  IINA_DEBUG_MODE=true
  ```
- Console will show 🔍 debug messages with:
  - File paths being monitored
  - Status file read attempts
  - JSON parsing results
  - Playback state changes

**For Full System**:
```bash
npm run dev  # Runs with nodemon for auto-restart
```

#### Check System Health

```bash
npm run health
```

Returns:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "connections": {
    "discord": true,
    "mediaSource": true
  },
  "activeSource": "vlc" | "iina" | null
}
```

#### Test Platform Compatibility

```bash
npm test
```

Checks:
- Node.js version
- Platform detection
- File system access
- Network connectivity
- Package installation

---

### Platform-Specific Issues

#### Windows

- **VLC path issues**: Use the setup wizard in web UI
- **Permissions**: Run as Administrator if file access fails
- **IINA not available**: IINA is macOS-only, use VLC

#### macOS

- **Security prompts**: Allow Node.js and IINA in System Preferences → Security
- **Plugin installation**: Double-click `.iinaplugin` file or drag to IINA preferences
- **File watcher limits**: macOS should handle this automatically

#### Linux

- **VLC package differences**: Some distros name it `vlc-bin`
- **HTTP interface**: May need to enable manually in preferences
- **IINA not available**: IINA is macOS-only, use VLC

---

### Getting More Help

If you're still having issues:

1. **Check existing issues**: https://github.com/canna-dev/mediacord/issues
2. **Run diagnostics**:
   ```bash
   npm run test           # Platform compatibility
   npm run test:iina      # IINA integration (macOS)
   npm run health         # System health
   ```
3. **Gather information**:
   - Operating System & version
   - Node.js version (`node --version`)
   - MediaCord version (from package.json)
   - Error messages from console
   - Output of diagnostic commands
4. **Create an issue**: https://github.com/canna-dev/mediacord/issues/new
   - Include diagnostic information
   - Describe steps to reproduce
   - Include error messages

---

### Quick Reference Commands

```bash
# Start MediaCord
npm start

# Development mode (auto-restart)
npm run dev

# Test platform compatibility
npm test

# Test IINA integration (macOS)
npm run test:iina

# Check system health
npm run health

# Access web interface
# http://localhost:7100
```

---

**Last Updated**: October 31, 2025  
**Version**: 2.0.0
