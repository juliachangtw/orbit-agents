import { app } from 'electron'
import { createHash } from 'crypto'
import { join } from 'path'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'

const GITHUB_OWNER = 'mukiwu'
const GITHUB_REPO = 'orbit-agents'
const FLAG_FILE = 'asar-update-in-progress'
const BACKUP_NAME = 'app.asar.bak'

export interface AsarManifest {
  version: string
  electronVersion: string
  sha256: string
  size: number
  fileName: string
}

export interface AsarUpdateResult {
  type: 'asar' | 'full' | 'none'
  version?: string
  downloadUrl?: string
  manifest?: AsarManifest
}

function getFlagPath(): string {
  return join(app.getPath('userData'), FLAG_FILE)
}

function getBackupPath(): string {
  return join(process.resourcesPath, BACKUP_NAME)
}

function getAsarPath(): string {
  return join(process.resourcesPath, 'app.asar')
}

/**
 * Check if resources directory is writable (required for asar replacement)
 */
function isResourcesWritable(): boolean {
  try {
    fs.accessSync(process.resourcesPath, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Fetch JSON from a URL using Node.js built-in https
 */
function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': `orbit-agents/${app.getVersion()}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }

    https.get(url, options, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson<T>(res.headers.location).then(resolve).catch(reject)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

/**
 * Download a file with progress reporting
 */
function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl: string): void => {
      const protocol = requestUrl.startsWith('https') ? https : http
      const options = {
        headers: {
          'User-Agent': `orbit-agents/${app.getVersion()}`,
          Accept: 'application/octet-stream'
        }
      }

      protocol.get(requestUrl, options, (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeRequest(res.headers.location)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`))
          return
        }

        const totalSize = parseInt(res.headers['content-length'] || '0', 10)
        let downloadedSize = 0
        const file = fs.createWriteStream(destPath)

        res.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (totalSize > 0 && onProgress) {
            onProgress((downloadedSize / totalSize) * 100)
          }
        })

        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
        file.on('error', (err) => {
          fs.unlinkSync(destPath)
          reject(err)
        })
        res.on('error', (err) => {
          fs.unlinkSync(destPath)
          reject(err)
        })
      }).on('error', reject)
    }

    makeRequest(url)
  })
}

/**
 * Calculate SHA-256 hash of a file
 */
function computeSha256(filePath: string): string {
  const content = fs.readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Check GitHub releases for an asar update
 */
export async function checkForAsarUpdate(): Promise<AsarUpdateResult> {
  const currentVersion = app.getVersion()
  const currentElectronVersion = process.versions.electron

  // Check if resources directory is writable
  if (!isResourcesWritable()) {
    return { type: 'full' }
  }

  const releaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

  interface GitHubAsset {
    name: string
    browser_download_url: string
  }
  interface GitHubRelease {
    tag_name: string
    assets: GitHubAsset[]
  }

  const release = await fetchJson<GitHubRelease>(releaseUrl)
  const releaseVersion = release.tag_name.replace(/^v/, '')

  // No update needed
  if (releaseVersion === currentVersion) {
    return { type: 'none' }
  }

  // Look for asar-manifest.json in assets
  const manifestAsset = release.assets.find((a) => a.name === 'asar-manifest.json')
  if (!manifestAsset) {
    // No asar asset, fall back to full update
    return { type: 'full' }
  }

  // Download and parse manifest
  const manifest = await fetchJson<AsarManifest>(manifestAsset.browser_download_url)

  // Check Electron version compatibility
  if (manifest.electronVersion !== currentElectronVersion) {
    console.log(
      `Asar update skipped: Electron version mismatch (current: ${currentElectronVersion}, required: ${manifest.electronVersion})`
    )
    return { type: 'full' }
  }

  // Find the asar file asset
  const asarAsset = release.assets.find((a) => a.name === manifest.fileName)
  if (!asarAsset) {
    return { type: 'full' }
  }

  return {
    type: 'asar',
    version: manifest.version,
    downloadUrl: asarAsset.browser_download_url,
    manifest
  }
}

/**
 * Download and apply asar update
 */
export async function downloadAndApplyAsar(
  downloadUrl: string,
  expectedSha256: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const asarPath = getAsarPath()
  const backupPath = getBackupPath()
  // Download to resourcesPath for atomic rename
  const tempPath = join(process.resourcesPath, 'app.asar.new')

  // Step 1: Create backup
  if (fs.existsSync(asarPath)) {
    fs.copyFileSync(asarPath, backupPath)
  }

  // Step 2: Write update-in-progress flag
  fs.writeFileSync(getFlagPath(), Date.now().toString())

  try {
    // Step 3: Download new asar
    await downloadFile(downloadUrl, tempPath, onProgress)

    // Step 4: Verify SHA-256
    const actualSha256 = computeSha256(tempPath)
    if (actualSha256 !== expectedSha256) {
      fs.unlinkSync(tempPath)
      throw new Error(`SHA-256 mismatch: expected ${expectedSha256}, got ${actualSha256}`)
    }

    // Step 5: Replace asar (rename is atomic on same filesystem)
    fs.renameSync(tempPath, asarPath)
  } catch (err) {
    // Clean up on failure
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath)
    }
    // Restore backup
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, asarPath)
    }
    // Remove flag
    if (fs.existsSync(getFlagPath())) {
      fs.unlinkSync(getFlagPath())
    }
    throw err
  }
}

/**
 * Mark asar update as successful (call after app boots successfully)
 */
export function markAsarUpdateSuccess(): void {
  const flagPath = getFlagPath()
  if (fs.existsSync(flagPath)) {
    fs.unlinkSync(flagPath)
  }
  // Clean up backup after successful boot
  const backupPath = getBackupPath()
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath)
  }
}

/**
 * Check if a rollback is needed (call at app startup before anything else)
 */
export function checkAndRollbackIfNeeded(): boolean {
  const flagPath = getFlagPath()
  const backupPath = getBackupPath()

  if (fs.existsSync(flagPath) && fs.existsSync(backupPath)) {
    // Flag exists = previous update didn't complete successfully
    console.log('Asar update rollback: restoring previous version')
    try {
      const asarPath = getAsarPath()
      fs.copyFileSync(backupPath, asarPath)
      fs.unlinkSync(backupPath)
      fs.unlinkSync(flagPath)
      console.log('Asar rollback completed successfully')
      return true
    } catch (err) {
      console.error('Asar rollback failed:', err)
    }
  }

  return false
}

/**
 * Restart app after asar replacement
 */
export function restartApp(): void {
  app.relaunch()
  app.exit(0)
}
