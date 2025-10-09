#!/usr/bin/env node

// Prebuild script to set up workspace packages for Cloud Build
const fs = require('fs');
const path = require('path');

// This script runs before the buildpack tries to install packages
// It ensures that the buildpack understands the workspace structure

console.log('🔧 Setting up workspace for Cloud Build...');

const rootDir = process.cwd();
const mercurDir = path.join(rootDir, 'mercur');

// Check if we're in the right structure
if (fs.existsSync(mercurDir)) {
  console.log('📦 Found mercur workspace structure');

  // Create a .yarnrc.yml to help with workspace resolution
  const yarnrcPath = path.join(mercurDir, '.yarnrc.yml');
  const yarnrcContent = `nodeLinker: node-modules

npmScopes:
  mercurjs:
    npmRegistryServer: "https://registry.npmjs.org"

yarnPath: .yarn/releases/yarn-1.22.21.cjs`;
  fs.writeFileSync(yarnrcPath, yarnrcContent);
  console.log('📝 Created .yarnrc.yml for workspace resolution');

  // Copy the root package.json to mercur directory so buildpack can find it
  const rootPackageJson = path.join(rootDir, 'package.json');
  const mercurPackageJson = path.join(mercurDir, 'package.json');

  if (fs.existsSync(rootPackageJson)) {
    // Read and modify the root package.json to remove the workspaces reference for buildpack
    const rootPkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
    const buildPkg = { ...rootPkg };
    delete buildPkg.workspaces; // Buildpack doesn't need workspaces

    fs.writeFileSync(mercurPackageJson, JSON.stringify(buildPkg, null, 2));
    console.log('📋 Created package.json in mercur directory for buildpack');
  }

  console.log('✅ Workspace setup completed');
} else {
  console.log('⚠️  Mercur workspace structure not found');
  console.log('Current directory:', rootDir);
  console.log('Mercur directory exists:', fs.existsSync(mercurDir));
}

console.log('🔧 Prebuild setup completed');
