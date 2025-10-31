# IINA Integration Guide

MediaCord now supports **IINA** (the modern media player for macOS) in addition to VLC Media Player! This integration allows you to use Discord Rich Presence with either player, or automatically switch between them.

## 🎬 What is IINA?

[IINA](https://iina.io/) is a modern media player for macOS built with MPV. It provides a native macOS experience with excellent video playback quality.

## ✨ Features

- **Automatic Detection**: MediaCord automatically detects if you're on macOS and if IINA is installed
- **Seamless Switching**: Automatically switches between VLC and IINA based on which is playing media
- **Status Bridge Integration**: Works with the [iina-status-bridge](https://github.com/canna-dev/iina-status-bridge) plugin
- **Same Rich Experience**: All features work the same - TMDb metadata, Discord Rich Presence, etc.

## 📋 Prerequisites

### For IINA Support:
1. **macOS** 10.15 or later (IINA is macOS-only)
2. **IINA** 1.3.0 or later installed
3. **iina-status-bridge** plugin installed in IINA

### For VLC Support (all platforms):
1. **VLC Media Player** installed
2. VLC HTTP interface enabled

## 🚀 Setup Instructions

### Step 1: Install IINA (macOS only)

1. Download IINA from [https://iina.io/](https://iina.io/)
2. Install IINA to `/Applications/IINA.app`

### Step 2: Install the IINA Status Bridge Plugin

1. Download the iina-status-bridge plugin from [https://github.com/canna-dev/iina-status-bridge/releases](https://github.com/canna-dev/iina-status-bridge/releases)
2. Double-click the `.iinaplugin` folder to install, or
3. In IINA: Go to **Preferences → Extensions → Install Plugin**
4. Restart IINA

### Step 3: Configure MediaCord

1. Start MediaCord
2. Open the web interface at `http://localhost:7100`
3. Go to **Settings**
4. Under **Media Source Preferences**:
   - Set "Preferred Source" to:
     - `Auto` - Automatically use whichever is playing (recommended)
     - `IINA` - Always prefer IINA when available
     - `VLC` - Always prefer VLC
   - Enable "Enable automatic source switching" for seamless transitions

### Step 4: Start Playing Media

1. Open a video file in IINA (or VLC)
2. MediaCord will automatically detect the player and start showing Rich Presence on Discord!

## ⚙️ Configuration Options

### Media Source Preferences

- **Preferred Source**: Choose which media player to prioritize
  - `auto`: Automatically detect and use the active player
  - `vlc`: Prefer VLC Media Player
  - `iina`: Prefer IINA (macOS only)

- **Enable automatic source switching**: Allow MediaCord to switch between sources automatically

### IINA Settings (macOS only)

- **Polling Interval**: How often to check for status updates (default: 2000ms)
- **Custom Status File Paths**: Override default status file locations (advanced users only)

Default status file locations:
- `~/status.json` (home directory)
- `~/Library/Application Support/com.colliderli.iina/plugin_data/com.canna.iina-status-bridge/status.json`
- `~/Library/Application Support/IINA/plugin_data/com.canna.iina-status-bridge/status.json`

### VLC Settings

- **Host**: VLC HTTP interface host (default: localhost)
- **Port**: VLC HTTP interface port (default: 8080)
- **Password**: VLC HTTP password (default: vlcpassword)
- **Polling Interval**: How often to check VLC status (default: 1000ms)

## 🎯 How It Works

### Architecture

```
┌─────────────┐
│  MediaCord  │
│    Main     │
└──────┬──────┘
       │
       ├─── Media Source Manager
       │    │
       │    ├─── VLC Monitor (HTTP polling)
       │    │    └─── Polls http://localhost:8080/requests/status.json
       │    │
       │    └─── IINA Monitor (File watching)
       │         └─── Watches ~/status.json and plugin directories
       │
       ├─── Discord Rich Presence
       │    └─── Updates Discord with media info
       │
       └─── TMDb Client
            └─── Fetches movie/TV metadata
```

### Media Source Detection

1. **Platform Check**: MediaCord checks if running on macOS
2. **IINA Detection**: Looks for IINA.app in `/Applications`
3. **Status File Check**: Monitors status file locations for IINA output
4. **VLC Connection**: Attempts to connect to VLC HTTP interface
5. **Auto Selection**: Uses the source that's actively playing media

### Status Bridge Format

The iina-status-bridge plugin outputs JSON in a VLC-compatible format:

```json
{
  "filename": "Movie.Title.2023.1080p.mkv",
  "time": 1847,
  "length": 7200,
  "volume": 75,
  "state": "playing"
}
```

MediaCord reads this file and processes it the same way as VLC status data.

## 🔧 Troubleshooting

### IINA Not Detected

**Problem**: MediaCord doesn't show IINA as an available source

**Solutions**:
1. Verify you're running on macOS
2. Check that IINA is installed in `/Applications/IINA.app`
3. Restart MediaCord after installing IINA

### Status Not Updating

**Problem**: IINA is detected but media status doesn't update

**Solutions**:
1. Verify iina-status-bridge plugin is installed (IINA → Preferences → Extensions)
2. Check that the status file exists: `ls -la ~/status.json`
3. Restart IINA after installing the plugin
4. Check file permissions on the home directory

### Multiple Sources Conflicting

**Problem**: MediaCord keeps switching between VLC and IINA

**Solutions**:
1. Set a **Preferred Source** in settings instead of "Auto"
2. Disable "Enable automatic source switching"
3. Close one of the media players

### Status File Location Issues

**Problem**: Custom status file paths not working

**Solutions**:
1. Use absolute paths (e.g., `/Users/yourusername/custom/status.json`)
2. Ensure the directory exists and is writable
3. Check file permissions: `ls -la ~/status.json`

## 🆚 VLC vs IINA

| Feature | VLC | IINA |
|---------|-----|------|
| Platform | Windows, macOS, Linux | macOS only |
| Integration Method | HTTP API | File watching |
| Polling Interval | 1000ms | 2000ms |
| Setup Complexity | Medium (requires HTTP interface) | Easy (just install plugin) |
| Native UI | Cross-platform | macOS native |
| Performance | Good | Excellent (MPV-based) |

## 🌟 Recommendations

- **macOS Users**: Use "Auto" mode to seamlessly work with both players
- **Windows/Linux Users**: VLC is your only option (IINA is macOS-only)
- **Performance**: IINA generally has better performance on macOS
- **Compatibility**: VLC supports more formats and codecs

## 📚 Additional Resources

- [IINA Official Website](https://iina.io/)
- [iina-status-bridge Plugin](https://github.com/canna-dev/iina-status-bridge)
- [MediaCord GitHub](https://github.com/canna-dev/mediacord)
- [Discord Rich Presence Documentation](https://discord.com/developers/docs/rich-presence/how-to)

## 🤝 Contributing

Found a bug or have a suggestion? Please open an issue on the [MediaCord GitHub repository](https://github.com/canna-dev/mediacord/issues).

## 📄 License

MediaCord is licensed under the MIT License. See LICENSE file for details.
