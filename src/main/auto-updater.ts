import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import {
  checkForAsarUpdate,
  downloadAsar,
  installAsar,
  AsarUpdateResult
} from './asar-updater'

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
// Disable code signature verification for unsigned apps (like Tauri does)
autoUpdater.disableWebInstaller = false
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// Store the update info for UI
let updateAvailable: UpdateInfo | null = null
let asarUpdateInfo: AsarUpdateResult | null = null

export interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  downloading: boolean
  progress: number
  version: string | null
  error: string | null
  releaseUrl?: string
  updateMethod?: 'asar' | 'full' | null
}

let currentStatus: UpdateStatus = {
  checking: false,
  available: false,
  downloaded: false,
  downloading: false,
  progress: 0,
  version: null,
  error: null,
  updateMethod: null
}

function sendStatusToRenderer(mainWindow: BrowserWindow | null): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', currentStatus)
  }
}

export function initAutoUpdater(mainWindow: BrowserWindow | null): void {
  // Skip auto-updater in development mode
  if (is.dev) {
    console.log('Auto-updater disabled in development mode')
    return
  }

  // Set up electron-updater event listeners (for full update fallback)
  autoUpdater.on('checking-for-update', () => {
    currentStatus = {
      ...currentStatus,
      checking: true,
      error: null
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    updateAvailable = info
    currentStatus = {
      ...currentStatus,
      checking: false,
      available: true,
      version: info.version,
      updateMethod: 'full'
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('update-not-available', () => {
    currentStatus = {
      ...currentStatus,
      checking: false,
      available: false,
      version: null,
      updateMethod: null
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('error', (err: Error) => {
    const isMac = process.platform === 'darwin'
    const isSignatureError =
      err.message.includes('Code signature') ||
      err.message.includes('Could not get code signature')

    if (isMac && isSignatureError && updateAvailable) {
      currentStatus = {
        ...currentStatus,
        checking: false,
        downloading: false,
        available: true,
        version: updateAvailable.version,
        error: 'Automatic update requires code signing. Please download manually.',
        releaseUrl: `https://github.com/mukiwu/orbit-agents/releases/tag/v${updateAvailable.version}`
      }
    } else {
      currentStatus = {
        ...currentStatus,
        checking: false,
        downloading: false,
        error: err.message
      }
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('download-progress', (progress) => {
    currentStatus = {
      ...currentStatus,
      downloading: true,
      progress: progress.percent
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    currentStatus = {
      ...currentStatus,
      downloading: false,
      downloaded: true,
      progress: 100,
      version: info.version
    }
    sendStatusToRenderer(mainWindow)
  })

  // Auto-check on startup
  checkForUpdatesWithAsar(mainWindow)
}

/**
 * Check for updates: try asar first, fall back to electron-updater
 */
async function checkForUpdatesWithAsar(
  mainWindow: BrowserWindow | null
): Promise<UpdateStatus> {
  currentStatus = {
    ...currentStatus,
    checking: true,
    error: null,
    updateMethod: null
  }
  sendStatusToRenderer(mainWindow)

  try {
    // Step 1: Try asar update first
    const asarResult = await checkForAsarUpdate()

    if (asarResult.type === 'asar') {
      // Asar update available
      asarUpdateInfo = asarResult
      currentStatus = {
        ...currentStatus,
        checking: false,
        available: true,
        version: asarResult.version || null,
        updateMethod: 'asar'
      }
      sendStatusToRenderer(mainWindow)
      return currentStatus
    }

    if (asarResult.type === 'none') {
      // Already up to date
      currentStatus = {
        ...currentStatus,
        checking: false,
        available: false,
        version: null,
        updateMethod: null
      }
      sendStatusToRenderer(mainWindow)
      return currentStatus
    }

    // Step 2: Fall back to electron-updater for full update
    asarUpdateInfo = null
    const result: UpdateCheckResult | null = await autoUpdater.checkForUpdates()

    if (result && result.updateInfo) {
      updateAvailable = result.updateInfo
      currentStatus = {
        ...currentStatus,
        checking: false,
        available: true,
        version: result.updateInfo.version,
        updateMethod: 'full'
      }
    } else {
      currentStatus = {
        ...currentStatus,
        checking: false,
        available: false,
        updateMethod: null
      }
    }

    sendStatusToRenderer(mainWindow)
    return currentStatus
  } catch (err) {
    console.error('Update check failed:', err)

    // If asar check fails (e.g. rate limit), try electron-updater
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result && result.updateInfo) {
        updateAvailable = result.updateInfo
        currentStatus = {
          ...currentStatus,
          checking: false,
          available: true,
          version: result.updateInfo.version,
          updateMethod: 'full'
        }
        sendStatusToRenderer(mainWindow)
        return currentStatus
      }
    } catch {
      // Both methods failed
    }

    currentStatus = {
      ...currentStatus,
      checking: false,
      error: err instanceof Error ? err.message : 'Update check failed'
    }
    sendStatusToRenderer(mainWindow)
    return currentStatus
  }
}

export function registerAutoUpdaterIpcHandlers(): void {
  let mainWindowRef: BrowserWindow | null = null

  // Store mainWindow reference from first status send
  const getMainWindow = (): BrowserWindow | null => {
    if (!mainWindowRef) {
      const windows = BrowserWindow.getAllWindows()
      mainWindowRef = windows.length > 0 ? windows[0] : null
    }
    return mainWindowRef
  }

  // ---- Dev mode simulation ----
  const DEV_SIMULATE_UPDATE = is.dev && false // Set to true to enable simulation

  // Check for updates manually
  ipcMain.handle('updater:check', async (): Promise<UpdateStatus> => {
    if (is.dev && !DEV_SIMULATE_UPDATE) {
      return {
        checking: false,
        available: false,
        downloaded: false,
        downloading: false,
        progress: 0,
        version: null,
        error: 'Auto-update is disabled in development mode',
        updateMethod: null
      }
    }

    if (DEV_SIMULATE_UPDATE) {
      const mainWindow = getMainWindow()
      // Simulate checking delay
      currentStatus = { ...currentStatus, checking: true, error: null, updateMethod: null }
      sendStatusToRenderer(mainWindow)

      await new Promise((r) => setTimeout(r, 1500))

      currentStatus = {
        checking: false,
        available: true,
        downloaded: false,
        downloading: false,
        progress: 0,
        version: '1.1.0',
        error: null,
        updateMethod: 'asar'
      }
      sendStatusToRenderer(mainWindow)
      return currentStatus
    }

    return checkForUpdatesWithAsar(getMainWindow())
  })

  // Download update (asar or full)
  ipcMain.handle('updater:download', async (): Promise<boolean> => {
    if (is.dev && !DEV_SIMULATE_UPDATE) return false

    if (DEV_SIMULATE_UPDATE) {
      const mainWindow = getMainWindow()
      // Simulate download progress
      for (let i = 0; i <= 100; i += 5) {
        currentStatus = { ...currentStatus, downloading: true, progress: i }
        sendStatusToRenderer(mainWindow)
        await new Promise((r) => setTimeout(r, 150))
      }
      currentStatus = {
        ...currentStatus,
        downloading: false,
        downloaded: true,
        progress: 100
      }
      sendStatusToRenderer(mainWindow)
      return true
    }

    const mainWindow = getMainWindow()

    // Asar update path
    if (currentStatus.updateMethod === 'asar' && asarUpdateInfo?.asarUrl) {
      try {
        currentStatus = {
          ...currentStatus,
          downloading: true,
          progress: 0
        }
        sendStatusToRenderer(mainWindow)

        await downloadAsar(
          asarUpdateInfo.asarUrl,
          (percent) => {
            currentStatus = {
              ...currentStatus,
              downloading: true,
              progress: percent
            }
            sendStatusToRenderer(mainWindow)
          }
        )

        currentStatus = {
          ...currentStatus,
          downloading: false,
          downloaded: true,
          progress: 100
        }
        sendStatusToRenderer(mainWindow)
        return true
      } catch (err) {
        console.error('[Updater] Asar download failed, falling back to full update:', err)
        // Fall back to full update
        asarUpdateInfo = null
        currentStatus = {
          ...currentStatus,
          downloading: false,
          progress: 0,
          error: null,
          updateMethod: 'full'
        }
        sendStatusToRenderer(mainWindow)
        try {
          await autoUpdater.downloadUpdate()
          return true
        } catch (fullErr) {
          currentStatus = {
            ...currentStatus,
            downloading: false,
            error: fullErr instanceof Error ? fullErr.message : 'Download failed'
          }
          sendStatusToRenderer(mainWindow)
          return false
        }
      }
    }

    // Full update path (electron-updater)
    if (!updateAvailable) return false

    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (err) {
      currentStatus = {
        ...currentStatus,
        error: err instanceof Error ? err.message : 'Download failed'
      }
      sendStatusToRenderer(mainWindow)
      return false
    }
  })

  // Install update and restart
  ipcMain.handle('updater:install', (): void => {
    if (is.dev) return

    if (currentStatus.updateMethod === 'asar') {
      installAsar()
    } else {
      // Full update via electron-updater
      autoUpdater.quitAndInstall()
    }
  })

  // Get current update status
  ipcMain.handle('updater:status', (): UpdateStatus => {
    return currentStatus
  })
}
