const fs = require('fs');
const path = require('path');

const files = ['index.html','main.js','style.css'];
const destDir = path.join(__dirname, '..', 'www');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

files.forEach(file => {
  const src = path.join(__dirname, '..', file);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, path.join(destDir, file));
      console.log('Copied', file);
    } catch (err) {
      console.error('Failed to copy', file, err.message);
    }
  } else {
    console.log('Not found, skipping', file);
  }
});
