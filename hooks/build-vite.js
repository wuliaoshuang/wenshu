#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (!existsSync(join(root, 'vite.config.js'))) {
  console.warn('[vite] vite.config.js not found; skipping web build.');
  process.exit(0);
}

execFileSync(npmCmd, ['run', 'build:web'], {
  cwd: root,
  stdio: 'inherit',
});
