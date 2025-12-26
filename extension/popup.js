// Popup UI script
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const joinRoomInput = document.getElementById('joinRoomInput');
const roomCodeDisplay = document.getElementById('roomCode');
const statusText = document.getElementById('statusText');
const joinError = document.getElementById('joinError');
const disconnectedView = document.getElementById('disconnectedView');
const connectedView = document.getElementById('connectedView');

let currentRoomId = null;

// Initialize popup
function init() {
  // Check if already in a room
  chrome.runtime.sendMessage({ type: 'GET_ROOM' }, (response) => {
    if (response && response.roomId) {
      showConnectedView(response.roomId);
    } else {
      showDisconnectedView();
    }
  });
}

// Show view when connected to a room
function showConnectedView(roomId) {
  currentRoomId = roomId;
  roomCodeDisplay.textContent = roomId;
  disconnectedView.style.display = 'none';
  connectedView.style.display = 'block';
  statusText.textContent = 'Connected';
}

// Show view when not connected
function showDisconnectedView() {
  currentRoomId = null;
  disconnectedView.style.display = 'block';
  connectedView.style.display = 'none';
  statusText.textContent = 'Not connected';
  joinError.textContent = '';
}

// Create a new room
createRoomBtn.addEventListener('click', () => {
  createRoomBtn.disabled = true;
  statusText.textContent = 'Creating room...';
  joinError.textContent = '';

  chrome.runtime.sendMessage({ type: 'CREATE_ROOM' });
});

// Join an existing room
joinRoomBtn.addEventListener('click', () => {
  const roomId = joinRoomInput.value.trim().toUpperCase();

  if (!roomId) {
    joinError.textContent = 'Please enter a room code';
    return;
  }

  if (roomId.length !== 6) {
    joinError.textContent = 'Room code must be 6 characters';
    return;
  }

  joinRoomBtn.disabled = true;
  statusText.textContent = 'Joining room...';
  joinError.textContent = '';

  chrome.runtime.sendMessage({
    type: 'JOIN_ROOM',
    roomId: roomId
  });
});

// Leave current room
leaveRoomBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LEAVE_ROOM' });
  showDisconnectedView();
});

// Auto-uppercase room code input
joinRoomInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase();
  joinError.textContent = '';
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ROOM_UPDATE') {
    showConnectedView(message.roomId);
    createRoomBtn.disabled = false;
    joinRoomBtn.disabled = false;
  } else if (message.type === 'ERROR') {
    joinError.textContent = message.message;
    createRoomBtn.disabled = false;
    joinRoomBtn.disabled = false;
    statusText.textContent = 'Error';
  }
});

// Initialize on load
init();
