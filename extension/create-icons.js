// Simple script to create placeholder icons using canvas
// Run this in a browser console to generate icons, or use any image editor

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Red background (Netflix color)
  ctx.fillStyle = '#e50914';
  ctx.fillRect(0, 0, size, size);

  // White "NS" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NS', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

// Create icons (requires canvas package: npm install canvas)
// For now, users can create their own icons or use this as a reference

console.log('To create icons, either:');
console.log('1. Install canvas: npm install canvas');
console.log('2. Run this script: node create-icons.js');
console.log('3. Or create 16x16, 48x48, and 128x128 PNG icons manually');
console.log('4. Place them in the extension folder as icon16.png, icon48.png, icon128.png');
