#!/usr/bin/env node

const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const builtWww = join(root, 'dist', 'www');

const targets = [
  join(root, 'platforms', 'android', 'app', 'src', 'main', 'assets', 'www'),
  join(root, 'platforms', 'ios', 'www'),
];

if (!existsSync(builtWww)) {
  console.warn('[vite] dist/www not found; skipping Cordova webroot sync.');
  process.exit(0);
}

for (const target of targets) {
  if (!existsSync(target)) continue;

  for (const dir of ['html', 'assets']) {
    rmSync(join(target, dir), { recursive: true, force: true });
  }

  mkdirSync(target, { recursive: true });
  cpSync(builtWww, target, { recursive: true });
  console.log(`[vite] synced ${builtWww} -> ${target}`);
}
