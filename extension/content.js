// Content script that runs on Netflix pages
// Hooks into the video player to sync playback

let videoElement = null;
let isRemoteAction = false; // Flag to prevent infinite loops

// Find the Netflix video element
function findVideoElement() {
  const video = document.querySelector('video');
  if (video && video !== videoElement) {
    videoElement = video;
    console.log('[Netflix Sync] Video element found');
    attachVideoListeners();
  }
}

// Attach listeners to video events
function attachVideoListeners() {
  if (!videoElement) return;

  videoElement.addEventListener('pause', handlePause);
  videoElement.addEventListener('play', handlePlay);

  console.log('[Netflix Sync] Listeners attached');
}

// Handle local pause event
function handlePause() {
  if (isRemoteAction) {
    isRemoteAction = false;
    return;
  }

  const timestamp = videoElement.currentTime;
  console.log('[Netflix Sync] Local pause at', timestamp);

  // Send to background script
  chrome.runtime.sendMessage({
    type: 'SYNC_EVENT',
    action: 'pause',
    timestamp: timestamp
  });
}

// Handle local play event
function handlePlay() {
  if (isRemoteAction) {
    isRemoteAction = false;
    return;
  }

  const timestamp = videoElement.currentTime;
  console.log('[Netflix Sync] Local play at', timestamp);

  // Send to background script
  chrome.runtime.sendMessage({
    type: 'SYNC_EVENT',
    action: 'play',
    timestamp: timestamp
  });
}

// Listen for messages from background script (remote events)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REMOTE_SYNC') {
    handleRemoteSync(message);
  }
});

// Handle sync events from remote device
function handleRemoteSync(message) {
  if (!videoElement) {
    console.log('[Netflix Sync] No video element found for remote sync');
    return;
  }

  isRemoteAction = true;

  console.log('[Netflix Sync] Remote sync:', message.action, 'at', message.timestamp);

  // Sync timestamp first
  videoElement.currentTime = message.timestamp;

  // Then perform action
  if (message.action === 'pause') {
    videoElement.pause();
  } else if (message.action === 'play') {
    videoElement.play().catch(err => {
      console.error('[Netflix Sync] Play failed:', err);
      // Chrome requires user interaction for autoplay
      // This might fail if user hasn't interacted with the page
    });
  }
}

// Wait for video element to load
function init() {
  // Netflix is a single-page app, so we need to keep checking
  findVideoElement();

  // Check periodically in case video element loads later or changes
  setInterval(findVideoElement, 2000);
}

// Start when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[Netflix Sync] Content script loaded');
