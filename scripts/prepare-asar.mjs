/**
 * Post-build script: Compress app.asar for in-app update
 *
 * Usage: node scripts/prepare-asar.mjs
 *
 * This script:
 * 1. Finds the built app.asar from the electron-builder output
 * 2. Compresses it as app-asar-v{version}.gz to dist/
 *
 * After running this, upload the gz file to the GitHub release:
 *   gh release upload v{version} dist/app-asar-v{version}.gz --clobber
 */

import { readFileSync, existsSync } from 'fs'
import { gzipSync } from 'zlib'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Use original-fs to read .asar files as raw binary (not as virtual filesystem)
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let fsForAsar
try {
  fsForAsar = require('original-fs')
} catch {
  // Fallback if not running in Electron context
  fsForAsar = await import('fs')
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// Read package.json
const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'))
const version = pkg.version

// Find the built app.asar
const possiblePaths = [
  // macOS
  join(projectRoot, 'dist', `mac-${process.arch}`, `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', 'mac', `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', 'mac-arm64', `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', 'mac-x64', `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  // Windows
  join(projectRoot, 'dist', 'win-unpacked', 'resources', 'app.asar'),
  // Linux
  join(projectRoot, 'dist', 'linux-unpacked', 'resources', 'app.asar')
]

let asarSourcePath = null
for (const p of possiblePaths) {
  if (existsSync(p)) {
    asarSourcePath = p
    break
  }
}

if (!asarSourcePath) {
  console.error('Could not find app.asar in build output.')
  console.error('Searched paths:')
  possiblePaths.forEach((p) => console.error(`  - ${p}`))
  console.error('\nMake sure to run "bun run build && npx electron-builder --mac --config" first.')
  process.exit(1)
}

console.log(`Found app.asar: ${asarSourcePath}`)

// Compress asar with gzip
const gzFileName = `app-asar-v${version}.gz`
const gzDestPath = join(projectRoot, 'dist', gzFileName)
const asarBuffer = fsForAsar.readFileSync(asarSourcePath)
const compressed = gzipSync(asarBuffer)
fsForAsar.writeFileSync(gzDestPath, compressed)

const originalSize = (asarBuffer.length / 1024 / 1024).toFixed(1)
const compressedSize = (compressed.length / 1024 / 1024).toFixed(1)

console.log(`\nCompressed: ${originalSize}MB → ${compressedSize}MB`)
console.log(`Output: ${gzDestPath}`)
console.log(`\nTo upload to GitHub release:`)
console.log(`  gh release upload v${version} "${gzDestPath}" --clobber`)
