// Simple WebSocket signaling server for Netflix Sync
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store rooms: { roomId: [client1, client2, ...] }
const rooms = new Map();

// Generate a random 6-character room code
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Ensure it's unique
  if (rooms.has(roomId)) {
    return generateRoomId();
  }

  return roomId;
}

// Send message to client
function sendToClient(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Broadcast message to all clients in a room except sender
function broadcastToRoom(roomId, message, excludeClient = null) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  clients.forEach(client => {
    if (client !== excludeClient) {
      sendToClient(client, message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.currentRoom = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message);

      switch (message.type) {
        case 'create':
          // Create a new room
          const roomId = generateRoomId();
          rooms.set(roomId, [ws]);
          ws.currentRoom = roomId;

          sendToClient(ws, {
            type: 'room_created',
            roomId: roomId
          });

          console.log(`Room created: ${roomId}`);
          break;

        case 'join':
          // Join an existing room
          if (!message.roomId) {
            sendToClient(ws, {
              type: 'error',
              message: 'Room ID is required'
            });
            return;
          }

          if (!rooms.has(message.roomId)) {
            sendToClient(ws, {
              type: 'error',
              message: 'Room not found'
            });
            return;
          }

          // Leave current room if in one
          if (ws.currentRoom && rooms.has(ws.currentRoom)) {
            const currentClients = rooms.get(ws.currentRoom);
            const index = currentClients.indexOf(ws);
            if (index > -1) {
              currentClients.splice(index, 1);
            }
            if (currentClients.length === 0) {
              rooms.delete(ws.currentRoom);
              console.log(`Room deleted: ${ws.currentRoom}`);
            }
          }

          // Join new room
          const clients = rooms.get(message.roomId);
          clients.push(ws);
          ws.currentRoom = message.roomId;

          sendToClient(ws, {
            type: 'room_joined',
            roomId: message.roomId
          });

          console.log(`Client joined room: ${message.roomId} (${clients.length} clients)`);
          break;

        case 'sync':
          // Broadcast sync event to all clients in room
          if (!ws.currentRoom) {
            sendToClient(ws, {
              type: 'error',
              message: 'Not in a room'
            });
            return;
          }

          console.log(`Syncing in room ${ws.currentRoom}: ${message.action} at ${message.timestamp}`);

          broadcastToRoom(ws.currentRoom, {
            type: 'sync',
            action: message.action,
            timestamp: message.timestamp
          }, ws);
          break;

        case 'leave':
          // Leave current room
          if (ws.currentRoom && rooms.has(ws.currentRoom)) {
            const clients = rooms.get(ws.currentRoom);
            const index = clients.indexOf(ws);
            if (index > -1) {
              clients.splice(index, 1);
            }
            if (clients.length === 0) {
              rooms.delete(ws.currentRoom);
              console.log(`Room deleted: ${ws.currentRoom}`);
            }
            ws.currentRoom = null;
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    // Remove client from room
    if (ws.currentRoom && rooms.has(ws.currentRoom)) {
      const clients = rooms.get(ws.currentRoom);
      const index = clients.indexOf(ws);
      if (index > -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        rooms.delete(ws.currentRoom);
        console.log(`Room deleted: ${ws.currentRoom}`);
      }
    }
  });
});

console.log(`WebSocket server running on port ${PORT}`);
console.log(`Clients can connect to: ws://localhost:${PORT}`);
