# Netflix Sync

A simple Chrome extension that synchronizes Netflix playback between two devices. Watch shows together with your partner, even when you're apart!

## Features

- Real-time play/pause synchronization
- Simple room code sharing (no account required)
- Automatic timestamp syncing
- Minimal setup required

## How It Works

1. One person creates a room and gets a 6-character code
2. The other person joins using that code
3. When either person pauses or plays, both devices sync automatically
4. Both devices stay in sync at the same timestamp

## Setup

### Prerequisites

- Node.js installed (for the server)
- Google Chrome browser

### Step 1: Start the Server

```bash
cd server
npm install
npm start
```

The server will start on `ws://localhost:8080`.

### Step 2: Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The Netflix Sync icon should appear in your toolbar

### Step 3: Create Icons (Optional)

The extension needs three icon files: `icon16.png`, `icon48.png`, and `icon128.png`.

You can either:
- Create your own PNG icons and place them in the `extension/` folder
- Use the provided `icon.svg` as a reference (convert to PNG at different sizes)
- Use any image editor to create simple 16x16, 48x48, and 128x128 icons

For a quick solution, you can use an online SVG to PNG converter with the provided `icon.svg` file.

## Usage

### Person 1 (Room Creator):
1. Open Netflix and start playing a video
2. Click the Netflix Sync extension icon
3. Click **Create New Room**
4. Share the 6-character code with your partner

### Person 2 (Room Joiner):
1. Open Netflix and navigate to the same video
2. Click the Netflix Sync extension icon
3. Enter the 6-character code
4. Click **Join Room**

### Watching Together:
- When either person pauses, both videos pause at the same timestamp
- When either person plays, both videos resume from the same point
- The sync happens automatically - no manual coordination needed!

## Architecture

See `ARCHITECTURE.md` for detailed design decisions and technical architecture.

### Quick Overview:
- **Chrome Extension**: Hooks into Netflix video player, manages sync logic
- **WebSocket Server**: Simple Node.js server for room management and message routing
- **Sync Strategy**: Event-based (only syncs on pause/play, not continuous polling)

## Troubleshooting

### Extension not working:
- Make sure the server is running (`npm start` in the `server/` folder)
- Check that you're on a Netflix video page (not the browse page)
- Open Chrome DevTools (F12) and look for `[Netflix Sync]` logs

### Video not playing after remote sync:
- Chrome requires user interaction before allowing autoplay
- Click the video once to enable autoplay, then try again

### Can't connect to room:
- Verify the server is running
- Make sure both devices are using the same room code
- Check the browser console for error messages

## Debugging

### Extension Logs:
- **Content Script**: Open DevTools on the Netflix page
- **Background Script**: Go to `chrome://extensions/` → click "service worker"
- **Popup**: Right-click the extension icon → Inspect

### Server Logs:
- All server activity is logged to the console where you ran `npm start`

## Deployment

For production use:

1. Deploy the server to a cloud provider (Heroku, AWS, DigitalOcean, etc.)
2. Update `WS_SERVER` in `extension/background.js` with your server URL
3. Use `wss://` (secure WebSocket) instead of `ws://` for production
4. Consider adding SSL/TLS certificates to your server

## Known Limitations

- Only syncs play/pause events (manual seeking is not synchronized)
- Requires both users to manually navigate to the same video
- Chrome autoplay restrictions may require initial user interaction
- Rooms are not persistent (exist only while users are connected)

## Contributing

This is a simple project designed to be easily understood and modified. Feel free to fork and customize!

## License

MIT License - do whatever you want with this code!
