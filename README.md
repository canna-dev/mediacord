# MediaCord

![MediaCord Logo](assets/logo.png)

**MediaCord** is a Universal Discord Rich Presence integration for multiple media players (VLC, IINA) that automatically displays what you're watching on Discord. It features a clean web interface, automatic movie/TV show detection with TMDb integration, real-time status updates, and intelligent multi-player support.

> **Note**: MediaCord is the evolution of [VLCord](https://github.com/canna-dev/vlcord), expanding from VLC-only support to a universal multi-player solution with cross-platform compatibility.

## ✨ Features

- 🎬 **Multi-Player Support** - Works with VLC (all platforms) and IINA (macOS)
- 🌍 **Cross-Platform** - Windows, macOS, and Linux with automatic platform detection
- 🔄 **Automatic Source Switching** - Seamlessly switches between active media players
- 🎭 **TMDb Integration** - Fetches rich metadata including posters, descriptions, and genres
- 🎮 **Discord Rich Presence** - Shows detailed "Watching" status with beautiful cards
- 🌐 **Modern Web Interface** - Clean dashboard for monitoring and configuration
- ⚡ **Real-time Updates** - Live progress tracking and play/pause status
- 🔧 **Easy Setup** - Automated configuration and setup guides
- 🍎 **macOS Optimized** - Native IINA support with plugin integration
- 🏥 **Health Monitoring** - Built-in health check endpoint
- 🛡️ **Error Handling** - Robust error boundaries and graceful recovery
- 📊 **Logging System** - Leveled logging for better debugging

## 📸 Screenshots

### Discord Rich Presence
![Discord Rich Presence Example](assets/discord-preview.png)

### Web Interface
![Web Interface - Overview](assets/web-interface-1.png)
![Web Interface - Settings](assets/web-interface-2.png)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **VLC Media Player** 3.0+ ([Windows](https://www.videolan.org/vlc/download-windows.html) | [macOS](https://www.videolan.org/vlc/download-macosx.html) | [Linux](https://www.videolan.org/vlc/#download)) OR **IINA** 1.3+ ([macOS only](https://iina.io/))
- **Discord** desktop app
- **Operating System**: Windows 10+, macOS 10.14+, or Linux

### Quick Test
Run the cross-platform compatibility test:
```bash
npm test
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/canna-dev/mediacord.git
   cd mediacord
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

4. **Start MediaCord**
   ```bash
   npm start
   # Or use the platform-specific script:
   # Windows: MediaCord.bat
   # macOS/Linux: ./MediaCord.sh
   ```

5. **Open the web interface**
   - Navigate to http://localhost:7100
   - Follow the setup wizard for media player and Discord configuration

## ⚙️ Configuration

### Media Player Setup

**VLC (All Platforms):**
MediaCord requires VLC's HTTP interface to be enabled. You can:

1. **Use the built-in setup wizard** (recommended)
   - Open http://localhost:7100
   - Click "Setup Instructions" 
   - Follow the automated setup process

2. **Manual setup**
   - Launch VLC with: `--intf http --http-host localhost --http-port 8080 --http-password vlcpassword`
   - Or enable via VLC Preferences → Interface → Main interfaces → Web

**IINA (macOS Only):**
1. Install the [iina-status-bridge plugin](https://github.com/canna-dev/iina-status-bridge)
2. Double-click to install or use IINA → Preferences → Extensions
3. Restart IINA - MediaCord will automatically detect it!
4. See [IINA Integration Guide](IINA-INTEGRATION.md) for details

### Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Copy the Application ID to MediaCord settings
4. Upload these assets under Rich Presence → Art Assets:
   - `vlc` - VLC logo
   - `play` - Play icon  
   - `pause` - Pause icon

### TMDb API (optional but recommended)

**MediaCord works out-of-the-box with shared keys, but getting your own API key provides significant benefits:**

#### 🚀 Why get your own TMDb API key?

- **⚡ No rate limits** - Unlimited movie/TV show lookups vs shared quota
- **🚄 Faster responses** - Dedicated API quota just for you
- **🛡️ Better reliability** - No throttling from other users
- **🆓 Completely FREE** - Takes just 2 minutes to set up

#### 📝 TMDb Setup Steps

1. Sign up at [TheMovieDB](https://www.themoviedb.org/)
2. Go to Settings → API → Create new API key
3. Enter the API key in MediaCord settings for enhanced metadata

### Discord Application (Required)

**MediaCord requires you to create your own Discord Application:**

#### 🎮 Why you need your own Discord app:

- **🏷️ Custom branding** - "YourName's MediaCord" instead of generic name
- **🎨 Personal app icon** - Upload your own custom icon
- **⚡ Independent control** - Full control over your integration
- **🆓 Completely FREE** - No cost to create

#### 📝 Discord Setup Steps

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Copy the Application ID to MediaCord settings
4. Upload these assets under Rich Presence → Art Assets:
   - `vlc` - VLC logo
   - `play` - Play icon  
   - `pause` - Pause icon

## 🎯 Usage

1. **Start MediaCord** - Run `npm start`
2. **Open VLC** - Launch with HTTP interface enabled (or IINA on macOS)
3. **Play media** - Start watching any movie or TV show
4. **Check Discord** - Your status will automatically update

### Health Check

Check if MediaCord is running properly:
```bash
npm run health
# or visit: http://localhost:7100/health
```

### Supported Formats

MediaCord intelligently parses various filename formats:

- **Movies**: `Movie.Title.2023.1080p.BluRay.x264`
- **TV Shows**: `Show.Name.S01E05.Episode.Title.1080p`
- **Anime**: `[Group] Anime Title - 12 [1080p]`

## 🌐 Web Interface

Access the web dashboard at http://localhost:7100:

- **Overview Tab**: Real-time media status and connection monitoring
- **Settings Tab**: Configure VLC, Discord, and TMDb integration
- **Setup Wizard**: Guided configuration for first-time users

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on file changes.

### Project Structure

```
mediacord/
├── src/
│   ├── main.js              # Main server entry point
│   ├── vlc-monitor.js       # VLC HTTP interface integration  
│   ├── discord-presence.js  # Discord RPC client
│   ├── title-cleaner.js     # Filename parsing logic
│   ├── tmdb-client.js       # TMDb API integration
│   └── config-manager.js    # Configuration management
├── public/
│   ├── index.html           # Web interface
│   ├── css/styles.css       # Styling
│   ├── js/app.js           # Frontend JavaScript
│   └── assets/             # Images and icons
└── docs/                   # Additional documentation
```

## 🛠️ Configuration Options

### Environment Variables (.env)

```env
# Server Configuration
PORT=7100
HOST=localhost

# VLC Configuration  
VLC_HOST=localhost
VLC_PORT=8080
VLC_PASSWORD=vlcpassword

# Discord Configuration
DISCORD_CLIENT_ID=your_client_id

# TMDb Configuration
TMDB_API_KEY=your_api_key

# Polling Configuration
POLLING_INTERVAL=1000
```

### Web Interface Settings

All settings can be configured through the web interface:

- **VLC Connection**: Host, port, and password
- **Discord Integration**: Application client ID
- **TMDb Integration**: API key for enhanced metadata
- **Real-time Testing**: Built-in connection testing tools

## 🐛 Troubleshooting

### Common Issues

**VLC Not Connecting**
- Ensure VLC HTTP interface is enabled
- Check host/port/password settings
- Try the built-in connection test

**Discord Not Updating**
- Verify Discord client ID is correct
- Make sure Discord is running
- Check Discord developer console for errors

**No Movie/TV Metadata**
- Add TMDb API key in settings
- Check filename formatting
- Verify internet connection

### Getting Help

1. Check the [Issues](https://github.com/canna-dev/mediacord/issues) page
2. Review the built-in setup instructions
3. Use the web interface diagnostic tools

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [VLCord](https://github.com/canna-dev/vlcord) - The original VLC-focused project that MediaCord is based on
- [Discord RPC](https://github.com/discordjs/RPC) for Discord integration
- [TMDb](https://www.themoviedb.org/) for movie/TV metadata
- [VLC Media Player](https://www.videolan.org/vlc/) for the awesome media player
- [IINA](https://iina.io/) for the beautiful macOS media player
- [parse-torrent-name](https://github.com/clement-escolano/parse-torrent-name) for filename parsing

## 📞 Support

If you enjoy MediaCord, please consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code

---

**Made with ❤️ for the Discord and VLC communities**
