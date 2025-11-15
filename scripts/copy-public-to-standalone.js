/**
 * Copy public folder to Next.js standalone build
 * This ensures static assets are available when deployed to Firebase App Hosting
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const standalonePublicDir = path.join(__dirname, '..', '.next', 'standalone', 'public');

console.log('📦 Copying public folder to standalone build...');
console.log(`   Source: ${publicDir}`);
console.log(`   Destination: ${standalonePublicDir}`);

// Check if standalone directory exists
const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
if (!fs.existsSync(standaloneDir)) {
  console.log('⚠️  Standalone build directory not found - skipping public folder copy');
  console.log('   (This is normal for non-standalone builds)');
  process.exit(0);
}

// Function to copy directory recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log(`   ✓ Copied: ${path.basename(dest)}`);
  }
}

try {
  // Copy the public folder
  copyRecursiveSync(publicDir, standalonePublicDir);
  console.log('✅ Successfully copied public folder to standalone build');
} catch (error) {
  console.error('❌ Error copying public folder:', error.message);
  // Don't fail the build if copy fails
  process.exit(0);
}
