#!/usr/bin/env node
// Run this script to generate placeholder icons
// Replace with real icons before launching

const fs = require('fs');
const path = require('path');

// You'll need to replace the icons in public/icons/ with real ones
// Recommended: use a tool like https://realfavicongenerator.net
// or create them in Figma/Canva and export as PNG

// For now this creates the directory
const iconDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
  console.log('Created public/icons/ directory');
  console.log('');
  console.log('Next steps:');
  console.log('1. Create your app icon (a simple design works great)');
  console.log('2. Export as PNG at these sizes:');
  console.log('   - icon-192.png (192x192)');
  console.log('   - icon-512.png (512x512)');
  console.log('   - icon-152.png (152x152)');
  console.log('   - icon-180.png (180x180)');
  console.log('3. Place them in public/icons/');
  console.log('');
  console.log('Quick option: Use https://realfavicongenerator.net');
  console.log('Upload any square image and it generates all sizes for you.');
}
