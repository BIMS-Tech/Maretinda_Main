#!/usr/bin/env node

// Prebuild script to set up workspace packages for Cloud Build
const fs = require('fs');
const path = require('path');

// This script runs before the buildpack tries to install packages
// It ensures that the buildpack understands the workspace structure

console.log('🔧 Setting up workspace for Cloud Build...');

const rootDir = process.cwd();
const mercurDir = path.join(rootDir, 'mercur');
const packagesDir = path.join(mercurDir, 'packages');

// Check if we're in the right structure
if (fs.existsSync(packagesDir)) {
  console.log('📦 Found mercur workspace structure');
  
  // Get all package directories
  const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
    
  console.log(`Found ${packageDirs.length} local packages:`, packageDirs.join(', '));
  
  // Create a .yarnrc.yml if it doesn't exist to help with workspace resolution
  const yarnrcPath = path.join(mercurDir, '.yarnrc.yml');
  if (!fs.existsSync(yarnrcPath)) {
    const yarnrcContent = `nodeLinker: node-modules

npmScopes:
  mercurjs:
    npmRegistryServer: "https://registry.npmjs.org"

yarnPath: .yarn/releases/yarn-1.22.21.cjs`;
    fs.writeFileSync(yarnrcPath, yarnrcContent);
    console.log('📝 Created .yarnrc.yml for workspace resolution');
  }
  
  console.log('✅ Workspace setup completed');
} else {
  console.log('⚠️  Mercur workspace structure not found');
  console.log('Current directory:', rootDir);
  console.log('Mercur directory exists:', fs.existsSync(mercurDir));
}

console.log('🔧 Prebuild setup completed');
