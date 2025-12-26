// Background service worker
// Manages WebSocket connection and message routing

let ws = null;
let roomId = null;
let isConnected = false;

// WebSocket server URL - update this with your server URL
const WS_SERVER = 'ws://localhost:8080';

// Connect to WebSocket server
function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('[Netflix Sync] Already connected');
    return;
  }

  console.log('[Netflix Sync] Connecting to server...');
  ws = new WebSocket(WS_SERVER);

  ws.onopen = () => {
    console.log('[Netflix Sync] Connected to server');
    isConnected = true;

    // If we have a room ID, rejoin it
    if (roomId) {
      ws.send(JSON.stringify({ type: 'join', roomId }));
    }
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('[Netflix Sync] Received:', message);

    if (message.type === 'sync') {
      // Forward sync event to content script
      chrome.tabs.query({ url: 'https://*.netflix.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'REMOTE_SYNC',
            action: message.action,
            timestamp: message.timestamp
          }).catch(err => {
            // Tab might not have content script loaded yet
            console.log('[Netflix Sync] Could not send to tab:', err);
          });
        });
      });
    } else if (message.type === 'room_created' || message.type === 'room_joined') {
      // Store room ID
      roomId = message.roomId;
      chrome.storage.local.set({ roomId });

      // Notify popup if open
      chrome.runtime.sendMessage({
        type: 'ROOM_UPDATE',
        roomId: message.roomId,
        status: message.type === 'room_created' ? 'created' : 'joined'
      }).catch(() => {
        // Popup might not be open
      });
    } else if (message.type === 'error') {
      console.error('[Netflix Sync] Server error:', message.message);

      chrome.runtime.sendMessage({
        type: 'ERROR',
        message: message.message
      }).catch(() => {
        // Popup might not be open
      });
    }
  };

  ws.onerror = (error) => {
    console.error('[Netflix Sync] WebSocket error:', error);
    isConnected = false;
  };

  ws.onclose = () => {
    console.log('[Netflix Sync] Disconnected from server');
    isConnected = false;

    // Try to reconnect after 5 seconds
    setTimeout(connect, 5000);
  };
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Netflix Sync] Message received:', message);

  if (message.type === 'SYNC_EVENT') {
    // Forward sync event to server
    if (ws && ws.readyState === WebSocket.OPEN && roomId) {
      ws.send(JSON.stringify({
        type: 'sync',
        roomId: roomId,
        action: message.action,
        timestamp: message.timestamp
      }));
    }
  } else if (message.type === 'CREATE_ROOM') {
    // Create a new room
    if (!isConnected) {
      connect();
      // Wait for connection before creating room
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'create' }));
        }
      }, 1000);
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'create' }));
    }
  } else if (message.type === 'JOIN_ROOM') {
    // Join an existing room
    roomId = message.roomId;
    if (!isConnected) {
      connect();
      // Wait for connection before joining
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'join', roomId: message.roomId }));
        }
      }, 1000);
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join', roomId: message.roomId }));
    }
  } else if (message.type === 'GET_ROOM') {
    // Return current room ID
    sendResponse({ roomId });
    return true;
  } else if (message.type === 'LEAVE_ROOM') {
    // Leave current room
    if (ws && ws.readyState === WebSocket.OPEN && roomId) {
      ws.send(JSON.stringify({ type: 'leave', roomId }));
    }
    roomId = null;
    chrome.storage.local.remove('roomId');
  }
});

// Load room ID from storage and connect on startup
chrome.storage.local.get(['roomId'], (result) => {
  if (result.roomId) {
    roomId = result.roomId;
    connect();
  }
});

console.log('[Netflix Sync] Background script loaded');
