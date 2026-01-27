import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useExecutionLogs, useExecutionLog, useProcessInput } from '../hooks/useApi'
import type { ExecutionLogWithTask } from '../../../shared/types'

export default function ExecutionLog() {
  const { logs, loading, error, deleteLogs } = useExecutionLogs(undefined, 200)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [checkedLogIds, setCheckedLogIds] = useState<Set<string>>(new Set())

  // Auto-select first log when logs load
  useEffect(() => {
    if (logs.length > 0 && !selectedLogId) {
      setSelectedLogId(logs[0].id)
    }
  }, [logs, selectedLogId])

  const selectedLog = logs.find(l => l.id === selectedLogId) || null

  const handleCheck = (id: string, checked: boolean) => {
    const newChecked = new Set(checkedLogIds)
    if (checked) {
      newChecked.add(id)
    } else {
      newChecked.delete(id)
    }
    setCheckedLogIds(newChecked)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedLogIds(new Set(logs.map(l => l.id)))
    } else {
      setCheckedLogIds(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (checkedLogIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${checkedLogIds.size} logs?`)) return

    const idsToDelete = Array.from(checkedLogIds)
    await deleteLogs(idsToDelete)
    setCheckedLogIds(new Set())
    
    // If selected log was deleted, select the first available one
    if (selectedLogId && idsToDelete.includes(selectedLogId)) {
      const remainingLogs = logs.filter(l => !idsToDelete.includes(l.id))
      if (remainingLogs.length > 0) {
        setSelectedLogId(remainingLogs[0].id)
      } else {
        setSelectedLogId(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-tl-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-white rounded-tl-2xl p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-8">
      {/* Left Panel - Log List */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-1">
        {/* List Header */}
        <div className="mb-4 px-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Execution Logs</h2>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                checked={logs.length > 0 && checkedLogIds.size === logs.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={logs.length === 0}
              />
              <p className="text-xs text-gray-400">Select all</p>
            </div>
          </div>
          {checkedLogIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
            >
              Delete ({checkedLogIds.size})
            </button>
          )}
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
               <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <p className="text-sm text-gray-500">No logs found.</p>
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <LogListItem
                  key={log.id}
                  log={log}
                  isSelected={selectedLogId === log.id}
                  isChecked={checkedLogIds.has(log.id)}
                  onCheck={(checked) => handleCheck(log.id, checked)}
                  onClick={() => setSelectedLogId(log.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Log Detail */}
      <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-w-0">
        {selectedLog ? (
          <LogDetail log={selectedLog} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No Log Selected</h3>
            <p className="text-sm max-w-xs mx-auto">Select an execution log from the list to view its details and output.</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface LogListItemProps {
  log: ExecutionLogWithTask
  isSelected: boolean
  isChecked: boolean
  onCheck: (checked: boolean) => void
  onClick: () => void
}

function LogListItem({ log, isSelected, isChecked, onCheck, onClick }: LogListItemProps) {
  const statusColors = {
    running: 'bg-blue-500',
    success: 'bg-emerald-500',
    failed: 'bg-red-500'
  }

  return (
    <div
      onClick={onClick}
      className={`group w-full flex items-center p-3 rounded-xl transition-all border cursor-pointer relative ${
        isSelected 
          ? 'bg-white shadow-md border-blue-200 ring-1 ring-blue-100 z-10' 
          : 'bg-white/40 border-transparent hover:bg-white hover:shadow-sm hover:border-gray-200'
      }`}
    >
      <input
        type="checkbox"
        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={isChecked}
        onChange={(e) => onCheck(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <div 
        className="flex-1 flex items-start gap-3 text-left min-w-0"
      >
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusColors[log.status]}`}>
          {log.status === 'running' && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Task name */}
          <p className={`text-sm truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
            {log.task_name || 'Unknown Task'}
          </p>

          {/* Time */}
          <p className="text-sm text-gray-400 mt-0.5">
            {formatRelativeTime(log.started_at)}
          </p>
        </div>

        {/* Status badge */}
        <span className={`text-sm font-medium px-1.5 py-0.5 rounded ${
          log.status === 'running' ? 'bg-blue-100 text-blue-700' :
          log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {log.status === 'running' ? 'Running' : log.status === 'success' ? 'Done' : 'Failed'}
        </span>
      </div>
    </div>
  )
}

interface LogDetailProps {
  log: ExecutionLogWithTask
}

function LogDetail({ log: initialLog }: LogDetailProps) {
  const { log: liveLog } = useExecutionLog(initialLog.id)
  const log = liveLog ? { ...initialLog, ...liveLog } : initialLog
  const outputEndRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (log.status === 'running' && outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [log.output, log.status])

  const handleCopy = async () => {
    if (log.output) {
      await navigator.clipboard.writeText(log.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Parse Gemini CLI interactive permission prompt
  const parseMcpPermissionPrompt = (output: string): { 
    hasPrompt: boolean
    toolName?: string
    serverName?: string
    question?: string
  } => {
    if (!output) return { hasPrompt: false }
    
    // Pattern: "Allow execution of MCP tool "tool_name" from server "server_name"?"
    const promptMatch = output.match(/Allow\s+execution\s+of\s+MCP\s+tool\s+"([^"]+)"\s+from\s+server\s+"([^"]+)"\?/i)
    if (promptMatch) {
      return {
        hasPrompt: true,
        toolName: promptMatch[1],
        serverName: promptMatch[2],
        question: `Allow execution of MCP tool "${promptMatch[1]}" from server "${promptMatch[2]}"?`
      }
    }
    
    // Also check for Chinese version or variations
    const chineseMatch = output.match(/允許.*MCP.*工具\s+"([^"]+)".*伺服器\s+"([^"]+)"\?/i)
    if (chineseMatch) {
      return {
        hasPrompt: true,
        toolName: chineseMatch[1],
        serverName: chineseMatch[2],
        question: `允許執行 MCP 工具 "${chineseMatch[1]}" 來自伺服器 "${chineseMatch[2]}"?`
      }
    }
    
    // Check if output contains the permission prompt pattern with options
    if (output.includes('Allow execution of MCP tool') && 
        (output.includes('Allow once') || output.includes('1. Allow'))) {
      // Try to extract tool and server from context
      const toolMatch = output.match(/MCP\s+tool\s+"([^"]+)"/i)
      const serverMatch = output.match(/server\s+"([^"]+)"/i)
      if (toolMatch || serverMatch) {
        return {
          hasPrompt: true,
          toolName: toolMatch?.[1],
          serverName: serverMatch?.[1],
          question: 'Allow execution of MCP tool?'
        }
      }
    }
    
    return { hasPrompt: false }
  }

  // Detect permission requests in output
  const detectPermissionRequest = (output: string): { hasRequest: boolean; message: string } => {
    if (!output) return { hasRequest: false, message: '' }
    
    const lowerOutput = output.toLowerCase()
    
    // Check for Gemini CLI interactive prompt first
    const mcpPrompt = parseMcpPermissionPrompt(output)
    if (mcpPrompt.hasPrompt) {
      return {
        hasRequest: true,
        message: `需要授權執行 MCP 工具 "${mcpPrompt.toolName || 'unknown'}"`
      }
    }
    
    // More comprehensive permission detection patterns
    const permissionPatterns = [
      // Policy denied errors (highest priority - check first)
      {
        test: (text: string) => 
          text.includes('Denied by policy') ||
          text.includes('denied by policy') ||
          text.includes('操作遭到系統政策拒絕') ||
          text.includes('政策拒絕') ||
          (text.includes('系統政策') && (text.includes('拒絕') || text.includes('denied'))) ||
          (text.includes('policy') && text.includes('denied')),
        message: 'MCP 工具被系統政策拒絕'
      },
      // MCP server not started or permission not configured
      {
        test: (text: string) => 
          (text.includes('MCP Server') || text.includes('mcp server') || text.includes('MCP 伺服器')) &&
          (text.includes('未正確啟動') || text.includes('not.*start') || text.includes('未啟動') || text.includes('權限未配置') || text.includes('permission.*not.*config')),
        message: 'MCP Server 未正確啟動或權限未配置'
      },
      // Security policy restriction
      {
        test: (text: string) => 
          text.includes('目前的執行環境安全策略限制') || 
          text.includes('執行環境安全策略') ||
          text.includes('安全策略限制'),
        message: '執行環境安全策略限制 - 需要授權確認'
      },
      // GA4 specific
      {
        test: (text: string) => 
          text.includes('i will execute these data fetches now') && 
          (text.includes('權限政策限制') || text.includes('無法直接存取') || text.includes('ga4') || text.includes('安全策略')),
        message: '需要授權存取 Google Analytics 4 數據'
      },
      // MCP tools specific
      {
        test: (text: string) => 
          (text.includes('mcp') || text.includes('tool')) && 
          (text.includes('permission') || text.includes('授權') || text.includes('權限') || text.includes('access') || text.includes('存取')),
        message: '需要授權存取 MCP 工具'
      },
      // General permission patterns
      {
        test: (text: string) => 
          (text.includes('[y/n]') || text.includes('(y/n)')) && 
          (text.includes('permission') || text.includes('授權') || text.includes('allow') || text.includes('允許')),
        message: '需要授權確認'
      },
      {
        test: (text: string) => 
          text.includes('permission') && text.includes('access') && 
          (text.includes('allow') || text.includes('grant') || text.includes('授權')),
        message: '需要授權確認'
      },
      {
        test: (text: string) => 
          (text.includes('授權') || text.includes('權限')) && 
          (text.includes('存取') || text.includes('access') || text.includes('允許') || text.includes('allow')),
        message: '需要授權確認'
      },
      // Check if output seems stuck waiting for input (common sign of permission prompt)
      {
        test: (text: string) => {
          const lines = text.split('\n').filter(l => l.trim())
          const lastLine = lines[lines.length - 1] || ''
          return (
            lastLine.includes('?') && 
            (lastLine.includes('allow') || lastLine.includes('permission') || lastLine.includes('授權') || lastLine.includes('允許')) &&
            text.length > 100 // Only if there's substantial output (not just a prompt)
          )
        },
        message: '等待權限確認'
      }
    ]

    for (const pattern of permissionPatterns) {
      if (pattern.test(lowerOutput)) {
        return { hasRequest: true, message: pattern.message }
      }
    }

    return { hasRequest: false, message: '' }
  }

  // Extract current activity from output
  const extractCurrentActivity = (output: string): string => {
    if (!output || output.trim().length === 0) {
      return '正在初始化...'
    }

    const lines = output.split('\n').filter(line => line.trim().length > 0)
    const lastLine = lines[lines.length - 1] || ''
    const lowerLastLine = lastLine.toLowerCase()

    // Pattern 1: "I will..." statements (including "I will start by...")
    const willMatch = lastLine.match(/i\s+will\s+(?:start\s+by\s+)?(.+?)(?:\.|$)/i)
    if (willMatch) {
      const action = willMatch[1].trim()
      const actionMap: Record<string, string> = {
        'search': '正在搜尋',
        'fetch': '正在獲取',
        'analyze': '正在分析',
        'access': '正在存取',
        'check': '正在檢查',
        'list': '正在列出',
        'get': '正在取得',
        'read': '正在讀取',
        'process': '正在處理',
        'execute': '正在執行',
        'connect': '正在連線',
        'query': '正在查詢',
        'calculate': '正在計算',
        'generate': '正在生成',
        'create': '正在建立',
        'update': '正在更新',
        'retrieve': '正在檢索',
        'confirm': '正在確認',
        'identify': '正在識別'
      }
      
      // Try to extract specific objects (GA4, schema, data, etc.)
      const objectPatterns = [
        { pattern: /ga4\s+(schema|metadata|data|dimension|metric)/i, label: 'GA4' },
        { pattern: /the\s+ga4\s+(schema|metadata)/i, label: 'GA4 結構' },
        { pattern: /performance\s+data/i, label: '效能數據' },
        { pattern: /(dimension|metric)\s+names?/i, label: '維度和指標' },
        { pattern: /high-traffic\s+articles?/i, label: '高流量文章' },
        { pattern: /engagement\s+(data|metrics?)/i, label: '互動數據' },
        { pattern: /bounce\s+rates?/i, label: '跳出率' }
      ]
      
      for (const objPattern of objectPatterns) {
        if (action.match(objPattern.pattern)) {
          for (const [key, value] of Object.entries(actionMap)) {
            if (action.toLowerCase().includes(key)) {
              return `${value} ${objPattern.label}...`
            }
          }
        }
      }
      
      // Fallback: extract action verb and object
      for (const [key, value] of Object.entries(actionMap)) {
        if (action.toLowerCase().includes(key)) {
          // Try to extract object after the verb
          const objectMatch = action.match(new RegExp(`${key}\\s+(?:the|a|an)?\\s*(.+?)(?:\\s+to|\\s+for|\\s+and|$|\\s+to\\s+confirm|\\s+to\\s+check)`, 'i'))
          if (objectMatch && objectMatch[1]) {
            const object = objectMatch[1].trim()
            // Shorten long objects
            const shortObject = object.length > 30 ? object.substring(0, 30) + '...' : object
            return `${value} ${shortObject}...`
          }
          return `${value}...`
        }
      }
      
      // If no action found, show the first part of the action
      const shortAction = action.length > 40 ? action.substring(0, 40) + '...' : action
      return `正在執行: ${shortAction}...`
    }

    // Pattern 2: Chinese action patterns "正在..." or "將要..."
    const chineseMatch = lastLine.match(/(正在|將要|開始)(.+?)(?:[。，\.]|$)/)
    if (chineseMatch) {
      return `${chineseMatch[1]}${chineseMatch[2]}...`
    }

    // Pattern 3: "Searching...", "Fetching...", etc.
    const ingMatch = lastLine.match(/(\w+ing)\s+(.+?)(?:\.|$)/i)
    if (ingMatch) {
      const action = ingMatch[1]
      const object = ingMatch[2].trim()
      const actionMap: Record<string, string> = {
        'searching': '正在搜尋',
        'fetching': '正在獲取',
        'analyzing': '正在分析',
        'accessing': '正在存取',
        'checking': '正在檢查',
        'processing': '正在處理',
        'executing': '正在執行',
        'connecting': '正在連線',
        'querying': '正在查詢',
        'calculating': '正在計算',
        'generating': '正在生成',
        'creating': '正在建立',
        'updating': '正在更新',
        'retrieving': '正在檢索',
        'loading': '正在載入',
        'reading': '正在讀取'
      }
      const translatedAction = actionMap[action.toLowerCase()] || `正在${action}`
      return `${translatedAction} ${object}...`
    }

    // Pattern 4: Look for key phrases in the last few sentences
    const recentText = lines.slice(-3).join(' ').toLowerCase()
    
    if (recentText.includes('ga4') || recentText.includes('google analytics')) {
      if (recentText.includes('schema') || recentText.includes('metadata')) {
        return '正在檢查 GA4 結構...'
      }
      if (recentText.includes('fetch') || recentText.includes('get') || recentText.includes('retrieve')) {
        return '正在獲取 GA4 數據...'
      }
      if (recentText.includes('analyze') || recentText.includes('analysis')) {
        return '正在分析 GA4 數據...'
      }
      return '正在處理 GA4 相關操作...'
    }

    if (recentText.includes('mcp') || recentText.includes('tool')) {
      return '正在呼叫 MCP 工具...'
    }

    if (recentText.includes('permission') || recentText.includes('授權') || recentText.includes('權限')) {
      return '正在處理權限請求...'
    }

    // Default: show last meaningful sentence
    if (lastLine.length > 50) {
      return `正在處理: ${lastLine.substring(0, 50)}...`
    }

    return '正在處理中...'
  }

  const permissionRequest = log.output ? detectPermissionRequest(log.output) : { hasRequest: false, message: '' }
  const mcpPermissionPrompt = log.output ? parseMcpPermissionPrompt(log.output) : { hasPrompt: false }
  const currentActivity = log.status === 'running' && log.output 
    ? extractCurrentActivity(log.output) 
    : log.status === 'running' 
      ? '正在初始化任務...' 
      : ''

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            {initialLog.task_name || 'Unknown Task'}
          </h2>
          <StatusBadge status={log.status} />
        </div>

        {log.output && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-6 py-4 space-y-4 min-w-0">
          {/* Timing Info */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDateTime(log.started_at)}</span>
            </div>
            {log.finished_at && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{formatDuration(log.started_at, log.finished_at)}</span>
              </div>
            )}
          </div>

          {/* Running indicator with activity status */}
          {log.status === 'running' && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent flex-shrink-0"></div>
              <span className="text-sm font-medium">{currentActivity || '任務執行中...'}</span>
            </div>
          )}

          {/* Error */}
          {log.error && (
            <div className={`rounded-lg p-4 ${
              log.error.includes('🚫') || log.error.includes('安全檢查') 
                ? 'bg-red-100 border-2 border-red-400 shadow-lg' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {log.error.includes('🚫') || log.error.includes('安全檢查') ? (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`font-medium ${
                  log.error.includes('🚫') || log.error.includes('安全檢查') 
                    ? 'text-red-800 text-base' 
                    : 'text-red-700 text-sm'
                }`}>
                  {log.error.includes('🚫') || log.error.includes('安全檢查') ? '🚫 安全檢查失敗' : 'Error'}
                </span>
              </div>
              <pre className={`whitespace-pre-wrap font-mono mb-3 ${
                log.error.includes('🚫') || log.error.includes('安全檢查') 
                  ? 'text-sm text-red-800 font-semibold' 
                  : 'text-sm text-red-600'
              }`}>{log.error}</pre>
              
              {/* Security check failure - show detailed warning */}
              {(log.error.includes('🚫') || log.error.includes('安全檢查')) && (
                <div className="bg-red-200 border-2 border-red-400 rounded-lg p-4 mt-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 mb-2">⚠️ 安全保護機制已啟動</h4>
                      <p className="text-xs text-red-800 mb-2">
                        系統檢測到嘗試執行危險的刪除操作，已自動停止執行以保護您的系統安全。
                      </p>
                      <div className="bg-red-300 rounded p-2 mt-2">
                        <p className="text-xs font-semibold text-red-900 mb-1">保護措施：</p>
                        <ul className="text-xs text-red-800 list-disc list-inside space-y-1">
                          <li>嚴格禁止在未經使用者授權下主動刪除項目</li>
                          <li>自動檢測並阻止危險的刪除命令（如 rm -rf）</li>
                          <li>執行已立即停止，不會對系統造成任何影響</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Policy denied error */}
              {!log.error.includes('🚫') && !log.error.includes('安全檢查') && 
               (log.error.includes('Denied by policy') || log.error.includes('政策拒絕') || log.error.includes('系統政策')) && (
                <div className="bg-red-100 border border-red-300 rounded p-3 text-xs text-red-800 mt-3">
                  <p className="font-medium mb-2">🔧 MCP 工具政策拒絕 - 解決步驟：</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>檢查 Gemini CLI 配置文件（通常在 <code className="bg-red-200 px-1 rounded">~/.config/gemini-cli/settings.json</code>）</li>
                    <li>為您的 MCP server 添加 <code className="bg-red-200 px-1 rounded">"trust": true</code> 設定</li>
                    <li>確認 MCP Server 已正確啟動（執行 <code className="bg-red-200 px-1 rounded">gemini mcp list</code> 檢查）</li>
                    <li>確認 Google Analytics API 權限已正確配置</li>
                    <li>重新啟動 Gemini CLI 或應用程式</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          
          {/* Policy Denied Warning in Output */}
          {log.output && (log.output.includes('Denied by policy') || log.output.includes('操作遭到系統政策拒絕') || log.output.includes('政策拒絕')) && !log.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">MCP 工具被系統政策拒絕</h4>
                  <div className="bg-red-100 border border-red-300 rounded p-3 text-xs text-red-800 mb-3">
                    <p className="font-medium mb-2">🔧 解決步驟：</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>檢查 Gemini CLI 配置文件（<code className="bg-red-200 px-1 rounded">~/.config/gemini-cli/settings.json</code>）</li>
                      <li>為 MCP server 添加 <code className="bg-red-200 px-1 rounded">"trust": true</code></li>
                      <li>確認 MCP Server 已啟動（執行 <code className="bg-red-200 px-1 rounded">gemini mcp list</code>）</li>
                      <li>檢查 Google Analytics API 權限配置</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gemini CLI Interactive MCP Permission Prompt */}
          {mcpPermissionPrompt.hasPrompt && log.status === 'running' && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5 mb-4 shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-2">MCP 工具執行權限</h4>
                  <div className="bg-white/80 rounded-lg p-3 mb-4 border border-purple-100">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">工具：</span>
                      <code className="ml-2 px-2 py-1 bg-purple-100 rounded text-purple-700 font-mono text-xs">
                        {mcpPermissionPrompt.toolName || 'unknown'}
                      </code>
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">伺服器：</span>
                      <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-700 font-mono text-xs">
                        {mcpPermissionPrompt.serverName || 'unknown'}
                      </code>
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    {mcpPermissionPrompt.question || '允許執行此 MCP 工具？'}
                  </p>
                  <McpPermissionOptions executionId={log.id} />
                </div>
              </div>
            </div>
          )}

          {/* Permission Request Alert (fallback for other types) */}
          {permissionRequest.hasRequest && !mcpPermissionPrompt.hasPrompt && log.status === 'running' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">權限請求</h4>
                  <p className="text-sm text-amber-700 mb-2">{permissionRequest.message}</p>
                  {(permissionRequest.message.includes('安全策略限制') || 
                    permissionRequest.message.includes('政策拒絕') ||
                    permissionRequest.message.includes('MCP Server')) && (
                    <div className="bg-amber-100 border border-amber-300 rounded p-2 mb-3 text-xs text-amber-800">
                      <p className="font-medium mb-1">💡 解決方案：</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>檢查 Gemini CLI 配置文件（settings.json），為 MCP servers 添加 <code className="bg-amber-200 px-1 rounded">"trust": true</code></li>
                        <li>確認 MCP Server 已正確啟動並運行</li>
                        <li>檢查 Google Analytics API 權限是否已正確配置</li>
                        <li>確認執行環境已取得 Google Analytics 的授權</li>
                      </ul>
                    </div>
                  )}
                  <PermissionConfirmButton executionId={log.id} />
                </div>
              </div>
            </div>
          )}

          {/* Output - Chat Style */}
          {log.output ? (
            <div className="space-y-4">
              <ChatMessage 
                content={log.output} 
                isStreaming={log.status === 'running'}
                showPermissionAlert={permissionRequest.hasRequest && log.status === 'running'}
              />
              <div ref={outputEndRef} />
            </div>
          ) : log.status === 'running' ? (
            <div className="text-gray-400 text-sm">Waiting for output...</div>
          ) : null}
        </div>
      </div>
      
      {log.status === 'running' && <LogInput executionId={log.id} />}
    </>
  )
}

function ChatMessage({ content, isStreaming, showPermissionAlert }: { content: string; isStreaming: boolean; showPermissionAlert: boolean }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-gray-100">
          <div className="prose prose-sm max-w-none overflow-hidden
            prose-headings:text-gray-900 prose-headings:font-semibold
            prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-3
            prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2
            prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:break-words prose-p:my-2
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:break-all
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-code:break-all
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:my-2
            prose-ul:text-gray-700 prose-ol:text-gray-700 prose-ul:my-2 prose-ol:my-2
            prose-li:marker:text-gray-400
            [&_table]:w-full [&_table]:table-fixed [&_table]:text-sm [&_table]:border-collapse [&_table]:my-2
            [&_thead]:bg-gray-50
            [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-2 [&_th]:py-2 [&_th]:border-b [&_th]:border-gray-200 [&_th]:break-words
            [&_td]:px-2 [&_td]:py-2 [&_td]:text-gray-600 [&_td]:border-b [&_td]:border-gray-100 [&_td]:align-top [&_td]:break-words [&_td]:overflow-hidden
            [&_tr:last-child_td]:border-b-0
            [&_tbody_tr:hover]:bg-gray-50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function McpPermissionOptions({ executionId }: { executionId: string }) {
  const { sendInput } = useProcessInput()
  const [sending, setSending] = useState<string | null>(null)

  const handleSelect = async (option: '1' | '2' | '3' | 'esc') => {
    setSending(option)
    try {
      // Send the option number or ESC key
      // Gemini CLI expects: '1', '2', '3' (writeToProcess will add \n), or '\x1b' (ESC, no newline)
      const input = option === 'esc' ? '\x1b' : option
      console.log(`[UI] Sending MCP permission option: ${option} (input: ${JSON.stringify(input)})`)
      await sendInput(executionId, input)
    } catch (err) {
      console.error('Failed to send permission selection:', err)
    } finally {
      setSending(null)
    }
  }

  const options = [
    {
      value: '1' as const,
      label: 'Allow once',
      description: '僅允許此次執行',
      icon: '✓',
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
    },
    {
      value: '2' as const,
      label: 'Allow tool for this session',
      description: '允許此工具在此次會話中使用',
      icon: '🔒',
      color: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
    },
    {
      value: '3' as const,
      label: 'Allow all server tools for this session',
      description: '允許此伺服器的所有工具在此次會話中使用',
      icon: '🔓',
      color: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600'
    },
    {
      value: 'esc' as const,
      label: 'No, suggest changes',
      description: '拒絕並建議修改',
      icon: '✗',
      color: 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'
    }
  ]

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          disabled={sending !== null}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
            option.color
          } ${sending === option.value ? 'opacity-75' : ''} ${
            sending !== null && sending !== option.value ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {option.value === 'esc' ? 'ESC' : option.value}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs opacity-90 mt-0.5">{option.description}</div>
          </div>
          {sending === option.value && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          )}
        </button>
      ))}
    </div>
  )
}

function PermissionConfirmButton({ executionId }: { executionId: string }) {
  const { sendInput } = useProcessInput()
  const [sending, setSending] = useState(false)

  const handleConfirm = async () => {
    setSending(true)
    try {
      await sendInput(executionId, 'y')
    } catch (err) {
      console.error('Failed to send confirmation:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={sending}
      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {sending ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
          <span>確認中...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>確認授權</span>
        </>
      )}
    </button>
  )
}

function LogInput({ executionId }: { executionId: string }) {
  const [input, setInput] = useState('')
  const { sendInput } = useProcessInput()
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    try {
      await sendInput(executionId, input)
      setInput('')
    } catch (err) {
      console.error('Failed to send input:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入回應或輸入 'y' 確認權限..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? '發送中...' : '發送'}
        </button>
      </div>
    </form>
  )
}

interface StatusBadgeProps {
  status: 'running' | 'success' | 'failed'
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700'
  }

  const labels = {
    running: 'Running',
    success: 'Completed',
    failed: 'Failed'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-medium ${styles[status]}`}>
      {status === 'running' && (
        <div className="animate-spin rounded-full h-2.5 w-2.5 border border-blue-700 border-t-transparent"></div>
      )}
      {labels[status]}
    </span>
  )
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()

  if (diffMs < 1000) return `${diffMs}ms`
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`

  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.round((diffMs % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
