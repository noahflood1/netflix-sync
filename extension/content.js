// Content script that runs on Netflix pages
// Hooks into the video player to sync playback

let videoElement = null;
let ignoreNextEvent = { pause: false, play: false }; // Prevent infinite loops
let syncInProgress = false;

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
  if (ignoreNextEvent.pause) {
    console.log('[Netflix Sync] Ignoring pause event (remote triggered)');
    ignoreNextEvent.pause = false;
    return;
  }

  if (syncInProgress) {
    console.log('[Netflix Sync] Sync in progress, ignoring local pause');
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
  if (ignoreNextEvent.play) {
    console.log('[Netflix Sync] Ignoring play event (remote triggered)');
    ignoreNextEvent.play = false;
    return;
  }

  if (syncInProgress) {
    console.log('[Netflix Sync] Sync in progress, ignoring local play');
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

  syncInProgress = true;
  console.log('[Netflix Sync] Remote sync:', message.action, 'at', message.timestamp);

  // Set flag to ignore the event we're about to trigger
  if (message.action === 'pause') {
    ignoreNextEvent.pause = true;
  } else if (message.action === 'play') {
    ignoreNextEvent.play = true;
  }

  // Sync timestamp first
  const currentTime = videoElement.currentTime;
  const timeDiff = Math.abs(currentTime - message.timestamp);

  // Only seek if there's a significant difference (more than 0.5 seconds)
  if (timeDiff > 0.5) {
    console.log(`[Netflix Sync] Seeking from ${currentTime} to ${message.timestamp}`);
    videoElement.currentTime = message.timestamp;
  }

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

  // Clear sync flag after a short delay
  setTimeout(() => {
    syncInProgress = false;
  }, 500);
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
