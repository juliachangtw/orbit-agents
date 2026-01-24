import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useExecutionLogs, useExecutionLog } from '../hooks/useApi'
import type { ExecutionLogWithTask } from '../../../shared/types'

export default function ExecutionLog() {
  const { logs, loading, error } = useExecutionLogs(undefined, 200)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  // Auto-select first log when logs load
  useEffect(() => {
    if (logs.length > 0 && !selectedLogId) {
      setSelectedLogId(logs[0].id)
    }
  }, [logs, selectedLogId])

  const selectedLog = logs.find(l => l.id === selectedLogId) || null

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-tl-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
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
    <div className="h-full flex">
      {/* Left Panel - Log List */}
      <div className="w-80 border-r border-gray-200/60 bg-white rounded-tl-2xl flex flex-col">
        {/* List Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Execution Logs</h2>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-center">No execution logs yet.<br />Run a task to see logs here.</p>
            </div>
          ) : (
            <div className="py-1">
              {logs.map((log) => (
                <LogListItem
                  key={log.id}
                  log={log}
                  isSelected={selectedLogId === log.id}
                  onClick={() => setSelectedLogId(log.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Log Detail */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden min-w-0">
        {selectedLog ? (
          <LogDetail log={selectedLog} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a log to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface LogListItemProps {
  log: ExecutionLogWithTask
  isSelected: boolean
  onClick: () => void
}

function LogListItem({ log, isSelected, onClick }: LogListItemProps) {
  const statusColors = {
    running: 'bg-blue-500',
    success: 'bg-emerald-500',
    failed: 'bg-red-500'
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors ${
        isSelected
          ? 'bg-violet-50 border-l-2 border-violet-500'
          : 'hover:bg-gray-50 border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
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
          <p className="text-xs text-gray-400 mt-0.5">
            {formatRelativeTime(log.started_at)}
          </p>
        </div>

        {/* Status badge */}
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          log.status === 'running' ? 'bg-blue-100 text-blue-700' :
          log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {log.status === 'running' ? 'Running' : log.status === 'success' ? 'Done' : 'Failed'}
        </span>
      </div>
    </button>
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
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
          <div className="flex items-center gap-6 text-xs text-gray-500">
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

          {/* Running indicator */}
          {log.status === 'running' && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">Task is running...</span>
            </div>
          )}

          {/* Error */}
          {log.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-700">Error</span>
              </div>
              <pre className="text-sm text-red-600 whitespace-pre-wrap font-mono">{log.error}</pre>
            </div>
          )}

          {/* Output */}
          {log.output ? (
            <div className="prose prose-sm max-w-none overflow-hidden
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-h1:text-xl prose-h1:mt-6 prose-h1:mb-4
              prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-3
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:break-words
              prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-a:break-all
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-code:break-all
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-xs
              prose-ul:text-gray-600 prose-ol:text-gray-600
              prose-li:marker:text-gray-400
              [&_table]:w-full [&_table]:table-fixed [&_table]:text-xs [&_table]:border-collapse
              [&_thead]:bg-gray-50
              [&_th]:text-left [&_th]:text-[10px] [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-2 [&_th]:py-2 [&_th]:border-b [&_th]:border-gray-200 [&_th]:break-words
              [&_td]:px-2 [&_td]:py-2 [&_td]:text-gray-600 [&_td]:border-b [&_td]:border-gray-100 [&_td]:align-top [&_td]:break-words [&_td]:overflow-hidden
              [&_tr:last-child_td]:border-b-0
              [&_tbody_tr:hover]:bg-gray-50
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.output}</ReactMarkdown>
              <div ref={outputEndRef} />
            </div>
          ) : log.status === 'running' ? (
            <div className="text-gray-400 text-sm">Waiting for output...</div>
          ) : null}
        </div>
      </div>
    </>
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
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
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
