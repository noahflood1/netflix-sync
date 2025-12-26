# Netflix Sync Architecture

## Overview
A Chrome extension that synchronizes Netflix playback between two devices using a peer-to-peer connection.

## Design Choices

### 1. Sync Strategy: Event-Based (Pause-Triggered)
**Decision**: Only sync when pause/play events occur, not continuous timestamp polling.
**Rationale**:
- Minimizes network traffic
- Reduces battery/CPU usage
- Netflix playback is naturally synchronized once started at the same timestamp
- Only need to handle user interactions (pause/play)

### 2. Communication Layer: WebSocket Signaling Server
**Decision**: Use a simple WebSocket server for signaling, not peer-to-peer WebRTC data channels.
**Rationale**:
- Simpler implementation (no STUN/TURN servers needed)
- Low latency for play/pause events
- Minimal data transfer (just state changes)
- Easy to implement room-based pairing

**Alternative Considered**: WebRTC Data Channels
- Rejected: Overcomplicated for simple state sync
- Would need STUN/TURN infrastructure
- Play/pause events don't need peer-to-peer bandwidth

### 3. State Management
**Shared State**:
```javascript
{
  roomId: string,           // Shared room identifier
  isPaused: boolean,        // Current pause state
  timestamp: number,        // Video timestamp in seconds
  lastUpdatedBy: string     // Device that triggered last update
}
```

**Sync Logic**:
- Either person pauses → both devices pause and sync to same timestamp
- Either person plays → both devices play from synced timestamp
- No continuous polling, only event-driven updates

### 4. Room Pairing System
**Decision**: Simple room code generation and sharing.
**Implementation**:
- User 1 creates a room → gets 6-character code
- User 2 enters room code → joins same room
- WebSocket server broadcasts state changes to all devices in room

### 5. Netflix Integration
**Decision**: Content script injection to hook into Netflix video player.
**Implementation**:
- Detect Netflix video element (`<video>` tag)
- Listen to `pause` and `play` events
- Control playback via `.play()`, `.pause()`, and `.currentTime`

## Architecture Diagram

```
┌─────────────┐                    ┌─────────────┐
│  Device 1   │                    │  Device 2   │
│  (Chrome)   │                    │  (Chrome)   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  Content Script                  │  Content Script
       │  - Hooks Netflix player          │  - Hooks Netflix player
       │  - Sends pause/play events       │  - Sends pause/play events
       │                                  │
       └────────┬─────────────────────────┘
                │
                │  WebSocket
                │
         ┌──────▼──────┐
         │   Signaling │
         │   Server    │
         │  (Node.js)  │
         └─────────────┘

         Room-based broadcasting
```

## Component Breakdown

### Chrome Extension Components
1. **manifest.json**: Extension configuration, permissions
2. **content.js**: Injected into Netflix pages, controls video element
3. **popup.html/popup.js**: UI for creating/joining rooms
4. **background.js**: WebSocket connection management

### Server Component
1. **server.js**: Simple Node.js WebSocket server
   - Room management
   - State broadcasting
   - Connection handling

## Data Flow

### User Pauses Video
```
Device 1: User pauses Netflix
    ↓
Content Script detects 'pause' event
    ↓
Sends to Background Script: {action: 'pause', timestamp: 123.45}
    ↓
WebSocket → Server
    ↓
Server broadcasts to all devices in room
    ↓
Device 2 receives: {action: 'pause', timestamp: 123.45}
    ↓
Device 2 Content Script: video.pause(); video.currentTime = 123.45
```

### User Plays Video
```
Device 1: User plays Netflix
    ↓
Content Script detects 'play' event
    ↓
Sends to Background Script: {action: 'play', timestamp: 123.45}
    ↓
WebSocket → Server
    ↓
Server broadcasts to all devices in room
    ↓
Device 2 receives: {action: 'play', timestamp: 123.45}
    ↓
Device 2 Content Script: video.currentTime = 123.45; video.play()
```

## Simplicity Principles Applied

1. **No continuous sync**: Only sync on pause/play events
2. **No complex peer discovery**: Simple room codes
3. **No authentication**: Focus on core functionality
4. **Minimal UI**: Just room code input/display
5. **Single WebSocket connection**: No fallback transports needed
6. **No state persistence**: Rooms exist only while users are connected

## Technology Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Extension**: Chrome Extension Manifest V3
- **Backend**: Node.js + `ws` (WebSocket library)
- **Protocol**: WebSocket (wss:// for production)

## Future Considerations (Out of Scope)

- Handling network disconnections/reconnections
- Seeking synchronization
- Multiple participants (>2 people)
- Authentication/security
- Persistent room history
