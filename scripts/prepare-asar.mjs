/**
 * Post-build script: Extract app.asar and generate asar-manifest.json
 *
 * Usage: node scripts/prepare-asar.mjs
 *
 * This script:
 * 1. Finds the built app.asar from the electron-builder output
 * 2. Copies it as app-{version}.asar to dist/
 * 3. Generates asar-manifest.json with version, electron version, and SHA-256 hash
 *
 * After running this, upload both files to the GitHub release:
 *   gh release upload v{version} dist/app-{version}.asar dist/asar-manifest.json --clobber
 */

import { createHash } from 'crypto'
import { readFileSync, copyFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// Read package.json
const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'))
const version = pkg.version

// Determine Electron version from installed package
let electronVersion
const electronPkgPath = join(projectRoot, 'node_modules', 'electron', 'package.json')
if (existsSync(electronPkgPath)) {
  const electronPkg = JSON.parse(readFileSync(electronPkgPath, 'utf-8'))
  electronVersion = electronPkg.version
} else {
  // Fallback: parse from devDependencies
  electronVersion = pkg.devDependencies.electron.replace(/[\^~]/, '')
}

// Find the built app.asar
const platform = process.platform
const arch = process.arch

const possiblePaths = [
  // macOS
  join(projectRoot, 'dist', `mac-${arch}`, `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', 'mac', `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', `mac-arm64`, `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
  join(projectRoot, 'dist', `mac-x64`, `${pkg.build.productName}.app`, 'Contents', 'Resources', 'app.asar'),
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
  console.error('\nMake sure to run "npm run build:mac" (or build:win/build:linux) first.')
  process.exit(1)
}

console.log(`Found app.asar: ${asarSourcePath}`)

// Copy asar to dist
const asarFileName = `app-${version}.asar`
const asarDestPath = join(projectRoot, 'dist', asarFileName)
copyFileSync(asarSourcePath, asarDestPath)
console.log(`Copied to: ${asarDestPath}`)

// Calculate SHA-256
const asarContent = readFileSync(asarDestPath)
const sha256 = createHash('sha256').update(asarContent).digest('hex')
const size = asarContent.length

// Generate manifest
const manifest = {
  version,
  electronVersion,
  sha256,
  size,
  fileName: asarFileName
}

const manifestPath = join(projectRoot, 'dist', 'asar-manifest.json')
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log('\nasar-manifest.json:')
console.log(JSON.stringify(manifest, null, 2))
console.log(`\nTo upload to GitHub release:`)
console.log(`  gh release upload v${version} "${asarDestPath}" "${manifestPath}" --clobber`)
