import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
// Disable code signature verification for unsigned apps (like Tauri does)
autoUpdater.disableWebInstaller = false
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// Store the update info for UI
let updateAvailable: UpdateInfo | null = null
let downloadProgress = 0
let isDownloading = false

export interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  downloading: boolean
  progress: number
  version: string | null
  error: string | null
}

let currentStatus: UpdateStatus = {
  checking: false,
  available: false,
  downloaded: false,
  downloading: false,
  progress: 0,
  version: null,
  error: null
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

  // Set up event listeners
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
      version: info.version
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('update-not-available', () => {
    currentStatus = {
      ...currentStatus,
      checking: false,
      available: false,
      version: null
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('error', (err: Error) => {
    const isMac = process.platform === 'darwin'
    const isSignatureError = err.message.includes('Code signature') || err.message.includes('Could not get code signature')

    if (isMac && isSignatureError && updateAvailable) {
      currentStatus = {
        ...currentStatus,
        checking: false,
        downloading: false,
        // Mark as available but with special error/action
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
    downloadProgress = progress.percent
    isDownloading = true
    currentStatus = {
      ...currentStatus,
      downloading: true,
      progress: progress.percent
    }
    sendStatusToRenderer(mainWindow)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    isDownloading = false
    currentStatus = {
      ...currentStatus,
      downloading: false,
      downloaded: true,
      progress: 100,
      version: info.version
    }
    sendStatusToRenderer(mainWindow)
  })
}

export function registerAutoUpdaterIpcHandlers(): void {
  // Check for updates manually
  ipcMain.handle('updater:check', async (): Promise<UpdateStatus> => {
    if (is.dev) {
      return {
        checking: false,
        available: false,
        downloaded: false,
        downloading: false,
        progress: 0,
        version: null,
        error: 'Auto-update is disabled in development mode'
      }
    }

    try {
      currentStatus = {
        ...currentStatus,
        checking: true,
        error: null
      }
      const result: UpdateCheckResult | null = await autoUpdater.checkForUpdates()

      if (result && result.updateInfo) {
        updateAvailable = result.updateInfo
        currentStatus = {
          ...currentStatus,
          checking: false,
          available: true,
          version: result.updateInfo.version
        }
      } else {
        currentStatus = {
          ...currentStatus,
          checking: false,
          available: false
        }
      }

      return currentStatus
    } catch (err) {
      const isMac = process.platform === 'darwin'
      const isSignatureError = err instanceof Error && err.message.includes('Code signature')

      // If it's a signature error on Mac, we still want to show the update is available
      // but force manual download
      if (isMac && isSignatureError && updateAvailable) {
        currentStatus = {
          ...currentStatus,
          checking: false,
          available: true,
          downloading: false,
          error: 'Automatic update requires code signing. Please download manually.',
          version: updateAvailable.version,
          releaseUrl: `https://github.com/mukiwu/orbit-agents/releases/tag/v${updateAvailable.version}`
        }
      } else {
        currentStatus = {
          ...currentStatus,
          checking: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
      return currentStatus
    }
  })

  // Download update
  ipcMain.handle('updater:download', async (): Promise<boolean> => {
    if (is.dev || !updateAvailable) {
      return false
    }

    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (err) {
      currentStatus = {
        ...currentStatus,
        error: err instanceof Error ? err.message : 'Download failed'
      }
      return false
    }
  })

  // Install update and restart
  ipcMain.handle('updater:install', (): void => {
    if (is.dev) return
    autoUpdater.quitAndInstall()
  })

  // Get current update status
  ipcMain.handle('updater:status', (): UpdateStatus => {
    return currentStatus
  })
}
