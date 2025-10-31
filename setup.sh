#!/bin/bash

echo "====================================="
echo "      MediaCord Setup for Unix/Linux"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js 18.0.0 or higher"
    echo "Visit: https://nodejs.org/ or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL:   sudo yum install nodejs npm"
    echo "  Arch:          sudo pacman -S nodejs npm"
    echo "  macOS:         brew install node"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found${NC}"
node --version

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not available${NC}"
    echo "Please ensure npm is installed with Node.js"
    exit 1
fi

echo -e "${GREEN}✅ npm found${NC}"
npm --version

echo
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install dependencies${NC}"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo
echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo
    echo -e "${BLUE}📝 Creating .env file from template...${NC}"
    cat > .env << EOF
# MediaCord Configuration
# Default TMDb API key included - get your own for better performance
TMDB_API_KEY=ccc1fa36a0821299ae4d7a6c155b442d
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID_HERE
PORT=3000
VLC_HOST=localhost
VLC_PORT=8080
VLC_PASSWORD=vlcpassword
EOF
    echo
    echo -e "${GREEN}🚀 MediaCord requires you to set up your own Discord Application:${NC}"
    echo
    echo -e "${BLUE}💡 TMDb API Key Benefits:${NC}"
    echo -e "   ${GREEN}✅ No rate limits${NC} - unlimited movie/show lookups"
    echo -e "   ${GREEN}✅ Faster responses${NC} - dedicated quota just for you"
    echo -e "   ${GREEN}✅ Better reliability${NC} - no shared throttling"
    echo -e "   ${GREEN}✅ FREE and takes 2 minutes:${NC} https://www.themoviedb.org/settings/api"
    echo
    echo -e "${BLUE}🎮 Discord Client ID Benefits:${NC}"
    echo -e "   ${GREEN}✅ Custom app name${NC} in Discord - \"YourName's MediaCord\" instead of generic"
    echo -e "   ${GREEN}✅ Your own app icon${NC} and branding"
    echo -e "   ${GREEN}✅ Independent${NC} from shared app quotas"
    echo -e "   ${GREEN}✅ FREE at:${NC} https://discord.com/developers/applications"
    echo
    echo -e "${YELLOW}💬 Think of it like having your own Netflix account vs sharing one!${NC}"
fi

# Make the script executable
chmod +x setup.sh

echo
echo -e "${GREEN}🎯 Setup complete! Next steps:${NC}"
echo
echo "1. Configure your .env file with API keys"
echo "2. Enable VLC Web Interface (see docs/vlc-connection-guide.md)"
echo "3. Run 'npm start' to launch MediaCord"
echo
echo -e "${BLUE}📚 For detailed setup instructions, see README.md${NC}"
echo