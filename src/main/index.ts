import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import {
  initDatabase,
  closeDatabase,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  getExecutionLogs,
  getExecutionLogById,
  getAllSettings,
  updateSettings
} from './database'
import {
  initScheduler,
  stopScheduler,
  scheduleTask,
  unscheduleTask,
  runTaskNow,
  onExecutionUpdate
} from './scheduler'
import { testClaudeConnection, listMcpServers } from './claude-cli'
import { testGeminiConnection, listMcpServers as listGeminiMcpServers } from './gemini-cli'
import { testCodexConnection, listMcpServers as listCodexMcpServers } from './codex-cli'
import { resetTransporter, sendTestEmail } from './email'
import type {
  CreateTaskInput,
  UpdateTaskInput,
  Settings,
  ExecutionLog
} from '../shared/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Register IPC handlers
function registerIpcHandlers(): void {
  // Task handlers
  ipcMain.handle('task:list', () => {
    return getAllTasks()
  })

  ipcMain.handle('task:get', (_, id: string) => {
    return getTaskById(id)
  })

  ipcMain.handle('task:create', (_, input: CreateTaskInput) => {
    const task = createTask(input)
    scheduleTask(task)
    return task
  })

  ipcMain.handle('task:update', (_, input: UpdateTaskInput) => {
    const task = updateTask(input)
    scheduleTask(task)
    return task
  })

  ipcMain.handle('task:delete', (_, id: string) => {
    unscheduleTask(id)
    deleteTask(id)
  })

  ipcMain.handle('task:toggle', (_, id: string) => {
    const task = toggleTask(id)
    if (task.enabled) {
      scheduleTask(task)
    } else {
      unscheduleTask(id)
    }
    return task
  })

  ipcMain.handle('task:run-now', async (_, id: string) => {
    return runTaskNow(id)
  })

  // Log handlers
  ipcMain.handle('log:list', (_, taskId?: string, limit?: number) => {
    return getExecutionLogs(taskId, limit)
  })

  ipcMain.handle('log:get', (_, id: string) => {
    return getExecutionLogById(id)
  })

  // Settings handlers
  ipcMain.handle('settings:get', () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:update', (_, settings: Partial<Settings>) => {
    updateSettings(settings)
    resetTransporter() // Reset transporter so new settings take effect
  })

  ipcMain.handle('settings:test-email', async (_, toAddress: string) => {
    await sendTestEmail(toAddress)
  })

  // Claude CLI handlers
  ipcMain.handle('claude:test', async () => {
    return testClaudeConnection()
  })

  ipcMain.handle('claude:list-mcps', async () => {
    return listMcpServers()
  })

  // Gemini CLI handlers
  ipcMain.handle('gemini:test', async () => {
    return testGeminiConnection()
  })

  ipcMain.handle('gemini:list-mcps', async () => {
    return listGeminiMcpServers()
  })

  // Codex CLI handlers
  ipcMain.handle('codex:test', async () => {
    return testCodexConnection()
  })

  ipcMain.handle('codex:list-mcps', async () => {
    return listCodexMcpServers()
  })

  // File dialog handler
  ipcMain.handle('dialog:open-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'json', 'csv', 'log'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
      ]
    })
    return result.canceled ? [] : result.filePaths
  })
}

// App lifecycle
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.cronschedule')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  initDatabase()

  // Register IPC handlers
  registerIpcHandlers()

  // Initialize scheduler
  initScheduler()

  // Listen for execution updates and send to renderer
  onExecutionUpdate((log: ExecutionLog) => {
    mainWindow?.webContents.send('execution:update', log)
  })

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopScheduler()
  closeDatabase()
})
