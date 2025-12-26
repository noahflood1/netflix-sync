# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Netflix Sync is a Chrome extension that synchronizes Netflix playback between two devices. Users can watch Netflix in sync with a partner by sharing a simple room code.

## Architecture

The project consists of two main components:

1. **Chrome Extension** (`extension/`): Runs in the browser, hooks into Netflix player, manages UI
2. **WebSocket Server** (`server/`): Node.js signaling server for room management and message routing

See `ARCHITECTURE.md` for detailed design decisions and data flow.

## Development Commands

### Server Setup
```bash
cd server
npm install
npm start
```

Server runs on `ws://localhost:8080` by default.

### Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory
5. The extension icon should appear in your toolbar

### Testing
1. Start the WebSocket server
2. Load the extension in Chrome
3. Open Netflix in two browser windows/tabs
4. In one window, click the extension icon and "Create New Room"
5. Share the 6-character code
6. In the other window, click the extension icon and "Join Room" with the code
7. Play/pause should now sync between both windows

## Key Architecture Decisions

### Sync Strategy
- **Event-based, not polling**: Only syncs on pause/play events to minimize network traffic
- **Timestamp synchronization**: When either device pauses/plays, both jump to the same timestamp
- **No seek sync**: Only handles play/pause for simplicity

### Communication Flow
```
Netflix Video Player → Content Script → Background Script → WebSocket Server → Other Device
```

### State Management
The extension maintains minimal state:
- `roomId`: Current room identifier (6-character code)
- `isConnected`: WebSocket connection status
- `isRemoteAction`: Flag to prevent infinite event loops

### File Structure

**Extension:**
- `manifest.json`: Extension configuration (Manifest V3)
- `content.js`: Injected into Netflix pages, controls video element
- `background.js`: Service worker managing WebSocket connection
- `popup.html/js`: UI for creating/joining rooms

**Server:**
- `server.js`: WebSocket server with room management
- Rooms stored in memory (Map structure)
- Auto-cleanup when all clients disconnect

## Common Development Tasks

### Debugging the Extension
- Open Chrome DevTools on the Netflix page (for content script logs)
- Go to `chrome://extensions/` and click "service worker" (for background script logs)
- Right-click extension popup and "Inspect" (for popup logs)
- All components use `console.log` with `[Netflix Sync]` prefix

### Debugging the Server
- Server logs all connections, room operations, and sync events to console
- Use `ws://localhost:8080` for local development

### Updating WebSocket Server URL
If deploying to production, update `WS_SERVER` in `extension/background.js`:
```javascript
const WS_SERVER = 'ws://localhost:8080'; // Change to your server URL
```

## Known Limitations

1. **Autoplay restrictions**: Chrome requires user interaction before allowing video playback. If remote play fails, the user may need to click the video first.
2. **No seek synchronization**: Only play/pause events are synced. Manual scrubbing is not synchronized.
3. **Two devices only**: Architecture supports multiple devices per room, but UI assumes two participants.
4. **No reconnection handling**: If WebSocket disconnects, extension attempts reconnection every 5 seconds but may lose room state.

## Technology Stack

- **Extension**: Vanilla JavaScript (Manifest V3)
- **Server**: Node.js with `ws` WebSocket library
- **Protocol**: WebSocket for real-time bidirectional communication
- **No frameworks**: Intentionally minimal dependencies for simplicity
