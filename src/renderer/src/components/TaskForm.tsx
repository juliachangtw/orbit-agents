import { useState, useEffect, useMemo } from 'react'
import { useTasks, useClaudeCli, useGeminiCli, useCodexCli } from '../hooks/useApi'
import type { Task, CreateTaskInput, McpServer, ModelType } from '../../../shared/types'
import { RefreshCw, Sun, Calendar, CalendarDays } from 'lucide-react'

interface TaskFormProps {
  task: Task | null
  onClose: () => void
  onSaved?: () => void
}

import {
  parseCronToSimple,
  simpleToCron,
  getScheduleDescription,
  WEEKDAYS,
  type ScheduleMode,
  type FrequencyType
} from '../utils/cron'



export default function TaskForm({ task, onClose, onSaved }: TaskFormProps) {
  const { createTask, updateTask } = useTasks()
  const { listMcps: listClaudeMcps } = useClaudeCli()
  const { listMcps: listGeminiMcps } = useGeminiCli()
  const { listMcps: listCodexMcps } = useCodexCli()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [loadingMcps, setLoadingMcps] = useState(false)

  // Parse existing cron to determine initial schedule mode
  const initialSchedule = useMemo(() => {
    return parseCronToSimple(task?.cron_expression || '0 9 * * *')
  }, [task?.cron_expression])

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(initialSchedule.mode)
  const [frequency, setFrequency] = useState<FrequencyType>(initialSchedule.frequency)
  const [intervalValue, setIntervalValue] = useState(initialSchedule.intervalValue)
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>(initialSchedule.intervalUnit)
  const [scheduleTime, setScheduleTime] = useState(initialSchedule.time)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(initialSchedule.weekdays)
  const [weekInterval, setWeekInterval] = useState(initialSchedule.weekInterval)
  const [monthDay, setMonthDay] = useState(initialSchedule.monthDay)

  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    cron_expression: task?.cron_expression || '0 9 * * *',
    prompt: task?.prompt || '',
    cli_tool: (task?.cli_tool || 'claude') as 'claude' | 'gemini' | 'codex',
    model: (task?.model || 'sonnet') as ModelType,
    mcp_tools: task?.mcp_tools ? JSON.parse(task.mcp_tools) : [] as string[],
    attachments: task?.attachments ? JSON.parse(task.attachments) : [] as string[],
    output_type: (task?.output_type || 'log') as 'log' | 'email' | 'both',
    email_to: task?.email_to || '',
    enabled: task ? task.enabled === 1 : true
  })

  // Update cron expression when simple schedule changes
  useEffect(() => {
    if (scheduleMode === 'simple') {
      const newCron = simpleToCron(frequency, intervalValue, intervalUnit, scheduleTime, selectedWeekdays, weekInterval, monthDay)
      setFormData(prev => ({ ...prev, cron_expression: newCron }))
    }
  }, [scheduleMode, frequency, intervalValue, intervalUnit, scheduleTime, selectedWeekdays, weekInterval, monthDay])

  const scheduleDescription = useMemo(() => {
    return getScheduleDescription(frequency, intervalValue, intervalUnit, scheduleTime, selectedWeekdays, weekInterval, monthDay)
  }, [frequency, intervalValue, intervalUnit, scheduleTime, selectedWeekdays, weekInterval, monthDay])

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => {
      if (prev.includes(day)) {
        // Don't allow removing the last day
        if (prev.length === 1) return prev
        return prev.filter(d => d !== day)
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  useEffect(() => {
    const fetchMcps = async () => {
      setLoadingMcps(true)
      try {
        let servers: McpServer[] = []
        if (formData.cli_tool === 'claude') {
          servers = await listClaudeMcps()
        } else if (formData.cli_tool === 'gemini') {
          servers = await listGeminiMcps()
        } else if (formData.cli_tool === 'codex') {
          servers = await listCodexMcps()
        }
        setMcpServers(servers)
      } catch (err) {
        console.error(`Failed to fetch MCP servers for ${formData.cli_tool}:`, err)
        setMcpServers([])
      } finally {
        setLoadingMcps(false)
      }
    }

    fetchMcps()
  }, [formData.cli_tool, listClaudeMcps, listGeminiMcps, listCodexMcps])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const input: CreateTaskInput = {
        name: formData.name,
        description: formData.description || undefined,
        cron_expression: formData.cron_expression,
        prompt: formData.prompt,
        cli_tool: formData.cli_tool,
        model: formData.model,
        mcp_tools: formData.mcp_tools.length > 0 ? formData.mcp_tools : undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
        output_type: formData.output_type,
        email_to: formData.email_to || undefined,
        enabled: formData.enabled
      }

      if (task) {
        await updateTask({ id: task.id, ...input })
      } else {
        await createTask(input)
      }

      if (onSaved) {
        onSaved()
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const toggleMcpTool = (toolPattern: string) => {
    setFormData((prev) => ({
      ...prev,
      mcp_tools: prev.mcp_tools.includes(toolPattern)
        ? prev.mcp_tools.filter((t) => t !== toolPattern)
        : [...prev.mcp_tools, toolPattern]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {task ? 'Edit Task' : 'New Task'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure your scheduled AI task</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                placeholder="e.g., Daily Security Report"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                placeholder="Brief description of this task"
              />
            </div>

            {/* Schedule */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-600">
                  Schedule <span className="text-red-500">*</span>
                </label>
                <div className="flex bg-gray-100 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('simple')}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      scheduleMode === 'simple'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('advanced')}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      scheduleMode === 'advanced'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              {scheduleMode === 'simple' ? (
                <div className="space-y-3 bg-gray-50/70 rounded-lg p-3 border border-gray-200/60">
                  {/* Frequency Type */}
                  <div className="flex gap-1.5">
                    {[
                      { value: 'interval', label: 'Interval', Icon: RefreshCw },
                      { value: 'daily', label: 'Daily', Icon: Sun },
                      { value: 'weekly', label: 'Weekly', Icon: Calendar },
                      { value: 'monthly', label: 'Monthly', Icon: CalendarDays }
                    ].map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFrequency(f.value as FrequencyType)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          frequency === f.value
                            ? 'bg-violet-100 border-violet-300 text-violet-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <f.Icon className="w-3.5 h-3.5" />
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Interval options */}
                  {frequency === 'interval' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Every</span>
                      <input
                        type="number"
                        min={1}
                        max={intervalUnit === 'minutes' ? 59 : 23}
                        value={intervalValue}
                        onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-center"
                      />
                      <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIntervalUnit('minutes')}
                          className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                            intervalUnit === 'minutes' ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          minutes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntervalUnit('hours')}
                          className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                            intervalUnit === 'hours' ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          hours
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Time picker for daily only */}
                  {frequency === 'daily' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">At</span>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      />
                    </div>
                  )}

                  {/* Weekday selector for weekly */}
                  {frequency === 'weekly' && (
                    <div className="space-y-3">
                      {/* Time + Week interval in one row */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">At</span>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Every</span>
                          <select
                            value={weekInterval}
                            onChange={(e) => setWeekInterval(parseInt(e.target.value))}
                            className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                          </select>
                          <span className="text-xs text-gray-600">{weekInterval === 1 ? 'week' : 'weeks'}</span>
                        </div>
                      </div>

                      {/* Day selection */}
                      <div>
                        <span className="text-xs text-gray-600 block mb-1.5">On</span>
                        <div className="flex gap-1">
                          {WEEKDAYS.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleWeekday(day.value)}
                              className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                                selectedWeekdays.includes(day.value)
                                  ? 'bg-violet-100 border-violet-300 text-violet-700'
                                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                              }`}
                              title={day.fullLabel}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Warning for multi-week intervals */}
                      {weekInterval > 1 && (
                        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-md">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Multi-week intervals run weekly; use execution logs to track cycles.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day of month for monthly */}
                  {frequency === 'monthly' && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">At</span>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">On day</span>
                        <select
                          value={monthDay}
                          onChange={(e) => setMonthDay(parseInt(e.target.value))}
                          className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Schedule description */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                    <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-violet-600 font-medium">{scheduleDescription}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={formData.cron_expression}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cron_expression: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-mono transition-colors"
                    placeholder="* * * * *"
                  />
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-500">Cron format: minute hour day month weekday</p>
                      <p className="mt-1">Examples: <code className="bg-gray-100 px-1 rounded">0 9 * * *</code> (daily 9am), <code className="bg-gray-100 px-1 rounded">*/15 * * * *</code> (every 15 min)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                AI Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.prompt}
                onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                rows={5}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-mono transition-colors resize-none"
                placeholder="Enter the prompt for Claude to execute..."
              />
            </div>

            {/* AI Provider & Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  AI Provider
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'claude', label: 'Claude' },
                    { value: 'gemini', label: 'Gemini' },
                    { value: 'codex', label: 'Codex' }
                  ].map((tool) => (
                    <label
                      key={tool.value}
                      className={`flex-1 flex items-center justify-center p-2.5 h-14 border rounded-lg cursor-pointer transition-all ${
                        formData.cli_tool === tool.value
                          ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cli_tool"
                        value={tool.value}
                        checked={formData.cli_tool === tool.value}
                        onChange={(e) => {
                          const tool = e.target.value as 'claude' | 'gemini' | 'codex'
                          let defaultModel: ModelType = 'sonnet'
                          if (tool === 'gemini') defaultModel = 'gemini-3'
                          if (tool === 'codex') defaultModel = 'codex-default'
                          
                          setFormData((prev) => ({
                            ...prev,
                            cli_tool: tool,
                            model: defaultModel,
                            mcp_tools: [] // Clear selected tools when provider changes
                          }))
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{tool.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  AI Model
                </label>
                <div className="flex gap-2">
                  {(() => {
                    let models: { value: ModelType, label: string, desc: string }[] = []
                    
                    if (formData.cli_tool === 'claude') {
                      models = [
                        { value: 'haiku', label: 'Haiku', desc: 'Fast' },
                        { value: 'sonnet', label: 'Sonnet', desc: 'Balanced' },
                        { value: 'opus', label: 'Opus', desc: 'Powerful' }
                      ]
                    } else if (formData.cli_tool === 'gemini') {
                      models = [
                        { value: 'gemini-3', label: 'Auto (Gemini 3)', desc: 'Best for task (3-pro/3-flash)' }
                      ]
                    } else if (formData.cli_tool === 'codex') {
                      models = [
                        { value: 'codex-default', label: 'Default', desc: 'Standard' }
                      ]
                    }

                    return models.map((model) => (
                      <label
                        key={model.value}
                        className={`flex-1 flex flex-col items-center justify-center p-2.5 h-14 border rounded-lg cursor-pointer transition-all ${
                          formData.model === model.value
                            ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="model"
                          value={model.value}
                          checked={formData.model === model.value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              model: e.target.value as ModelType
                            }))
                          }
                          className="sr-only"
                        />
                        <span className="font-medium text-sm">{model.label}</span>
                        <span className="text-[10px] opacity-70">{model.desc}</span>
                      </label>
                    ))
                  })()}
                </div>
              </div>
            </div>

            {/* MCP Tools */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                MCP Tools <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              {loadingMcps ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-600 border-t-transparent"></div>
                  Loading MCP servers...
                </div>
              ) : mcpServers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mcpServers.map((server) => {
                    const toolPattern = `mcp__${server.name}__*`
                    const isSelected = formData.mcp_tools.includes(toolPattern)
                    return (
                      <button
                        key={server.name}
                        type="button"
                        onClick={() => toggleMcpTool(toolPattern)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-violet-100 border-violet-300 text-violet-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {server.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  No MCP servers configured in {formData.cli_tool} CLI
                </p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Attachments <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    const files = await (window.electronApi.invoke as (channel: string) => Promise<string[]>)('dialog:open-files')
                    if (files.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        attachments: [...prev.attachments, ...files]
                      }))
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Add Files
                </button>
                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.attachments.map((filePath, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-700">
                        <span className="truncate max-w-[150px]" title={filePath}>
                          {filePath.split('/').pop()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== index)
                            }))
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Output Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Output
              </label>
              <div className="flex gap-2">
                {(['log', 'email', 'both'] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg cursor-pointer transition-all text-xs font-medium ${
                      formData.output_type === type
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="output_type"
                      value={type}
                      checked={formData.output_type === type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          output_type: e.target.value as 'log' | 'email' | 'both'
                        }))
                      }
                      className="sr-only"
                    />
                    {type === 'log' && 'Log Only'}
                    {type === 'email' && 'Email'}
                    {type === 'both' && 'Log + Email'}
                  </label>
                ))}
              </div>
            </div>

            {/* Email To (conditional) */}
            {(formData.output_type === 'email' || formData.output_type === 'both') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email_to}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email_to: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="recipient@example.com"
                />
              </div>
            )}

            {/* Enabled */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  formData.enabled ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    formData.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <label className="text-xs text-gray-600">
                Enable task immediately
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              )}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
