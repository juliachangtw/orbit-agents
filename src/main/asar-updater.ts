import { app, net } from 'electron'
import { join, dirname } from 'path'
import { gunzipSync } from 'zlib'

// Use original-fs to bypass Electron's asar interception
// eslint-disable-next-line @typescript-eslint/no-var-requires
const originalFs = require('original-fs')

const GITHUB_OWNER = 'mukiwu'
const GITHUB_REPO = 'orbit-agents'

export interface AsarUpdateResult {
  type: 'asar' | 'full' | 'none'
  version?: string
  asarUrl?: string
}

// ── Network helpers (using Electron's net module) ──

function netFetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    let data = ''
    request.on('response', (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        const redirectUrl = Array.isArray(response.headers.location)
          ? response.headers.location[0]
          : response.headers.location
        netFetch(redirectUrl).then(resolve).catch(reject)
        return
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      response.on('data', (chunk) => { data += chunk.toString() })
      response.on('end', () => resolve(data))
      response.on('error', reject)
    })
    request.on('error', reject)
    request.end()
  })
}

function netDownload(
  url: string,
  destPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    request.on('response', (response) => {
      if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
        const redirectUrl = Array.isArray(response.headers.location)
          ? response.headers.location[0]
          : response.headers.location
        netDownload(redirectUrl, destPath, onProgress).then(resolve).catch(reject)
        return
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${response.statusCode}`))
        return
      }
      const contentLength = parseInt(
        Array.isArray(response.headers['content-length'])
          ? response.headers['content-length'][0]
          : response.headers['content-length'] || '0',
        10
      )
      const chunks: Buffer[] = []
      let received = 0
      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        received += chunk.length
        if (contentLength > 0 && onProgress) {
          onProgress(Math.round((received / contentLength) * 100))
        }
      })
      response.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks)
          originalFs.writeFileSync(destPath, buffer)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
      response.on('error', reject)
    })
    request.on('error', reject)
    request.end()
  })
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

// ── Check for update ──

export async function checkForAsarUpdate(): Promise<AsarUpdateResult> {
  const currentVersion = app.getVersion()

  // Check if Resources dir is writable
  try {
    originalFs.accessSync(process.resourcesPath, originalFs.constants.W_OK)
  } catch {
    console.log('[Asar Updater] Resources dir not writable, falling back to full update')
    return { type: 'full' }
  }

  try {
    const json = await netFetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    )
    const data = JSON.parse(json)
    const latestVersion = (data.tag_name || '').replace(/^v/, '')

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return { type: 'none' }
    }

    // Look for compressed asar asset (app-asar-v*.gz)
    let asarUrl = ''
    if (Array.isArray(data.assets)) {
      const asarAsset = data.assets.find(
        (a: { name: string }) => /^app-asar-v.*\.gz$/.test(a.name)
      )
      if (asarAsset) {
        asarUrl = asarAsset.browser_download_url
      }
    }

    if (!asarUrl) {
      return { type: 'full' }
    }

    return {
      type: 'asar',
      version: latestVersion,
      asarUrl
    }
  } catch (err) {
    console.error('[Asar Updater] Check failed:', err)
    return { type: 'full' }
  }
}

// ── Download asar ──

export async function downloadAsar(
  asarUrl: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const userData = app.getPath('userData')
  const gzPath = join(userData, 'update-pending.asar.gz')
  const asarPath = join(userData, 'update-pending.asar')

  try {
    // Download compressed asar
    await netDownload(asarUrl, gzPath, onProgress)

    // Decompress gzip
    const gzBuffer = originalFs.readFileSync(gzPath)
    const decompressed = gunzipSync(gzBuffer)
    originalFs.writeFileSync(asarPath, decompressed)

    // Clean up gz
    try { originalFs.unlinkSync(gzPath) } catch { /* ignore */ }
  } catch (err) {
    // Clean up partial files
    try { originalFs.unlinkSync(gzPath) } catch { /* ignore */ }
    try { originalFs.unlinkSync(asarPath) } catch { /* ignore */ }
    throw err
  }
}

// ── Install asar (replace and restart) ──

export function installAsar(): { success: boolean; error?: string } {
  const userData = app.getPath('userData')
  const pendingAsar = join(userData, 'update-pending.asar')
  const resourcesDir = dirname(app.getAppPath())
  const targetAsar = join(resourcesDir, 'app.asar')
  const backupAsar = join(resourcesDir, 'app.asar.old')

  try {
    // Disable asar interception BEFORE any fs operations on .asar files
    process.noAsar = true

    // Verify pending asar exists
    originalFs.accessSync(pendingAsar)

    if (process.platform === 'win32') {
      // Windows: app.asar is locked while running. Use a batch script to
      // replace it after the process exits, then relaunch.
      const { spawn } = require('child_process')
      const exePath = app.getPath('exe')
      const batPath = join(userData, 'update-apply.bat')
      const batContent = [
        '@echo off',
        'timeout /t 3 /nobreak >nul',
        `del /f /q "${backupAsar}" 2>nul`,
        `move /y "${targetAsar}" "${backupAsar}"`,
        `copy /y "${pendingAsar}" "${targetAsar}"`,
        `del /f /q "${pendingAsar}" 2>nul`,
        `start "" "${exePath}"`,
        `del /f /q "${batPath}" 2>nul`
      ].join('\r\n')
      originalFs.writeFileSync(batPath, batContent, 'utf8')
      const child = spawn('cmd.exe', ['/c', batPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      })
      child.unref()
      process.noAsar = false
      app.quit()
      return { success: true }
    }

    // macOS/Linux: direct overwrite (file isn't locked)
    originalFs.copyFileSync(pendingAsar, targetAsar)

    // Clean up pending file
    try { originalFs.unlinkSync(pendingAsar) } catch { /* ignore */ }

    // Read new version from the updated asar's package.json
    process.noAsar = false
    let newVersion = ''
    try {
      const asarPkg = JSON.parse(
        require('fs').readFileSync(join(targetAsar, 'package.json'), 'utf8')
      )
      newVersion = asarPkg.version || ''
    } catch { /* ignore */ }

    // macOS: update Info.plist so the system "About" dialog shows the new version
    if (process.platform === 'darwin' && newVersion) {
      try {
        const { execSync } = require('child_process')
        const contentsDir = dirname(resourcesDir)
        const plistPath = join(contentsDir, 'Info.plist')
        execSync(
          `/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${newVersion}" "${plistPath}"`
        )
        execSync(
          `/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${newVersion}" "${plistPath}"`
        )
      } catch (plistErr) {
        console.error('[Asar Updater] Failed to update Info.plist version:', plistErr)
      }
    }

    // Relaunch
    app.relaunch()
    app.quit()
    return { success: true }
  } catch (err) {
    process.noAsar = false
    console.error('[Asar Updater] Install failed:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Startup cleanup ──

export function cleanupUpdateArtifacts(): void {
  try {
    const resourcesDir = dirname(app.getAppPath())
    const backupAsar = join(resourcesDir, 'app.asar.old')
    try { originalFs.unlinkSync(backupAsar) } catch { /* ignore */ }

    const userData = app.getPath('userData')
    const pendingGz = join(userData, 'update-pending.asar.gz')
    const pendingAsar = join(userData, 'update-pending.asar')
    try { originalFs.unlinkSync(pendingGz) } catch { /* ignore */ }
    try { originalFs.unlinkSync(pendingAsar) } catch { /* ignore */ }
  } catch {
    // ignore cleanup errors
  }
}
