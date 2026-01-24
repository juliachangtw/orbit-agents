import { useState, useEffect, useMemo } from 'react'
import { useTasks, useClaudeCli } from '../hooks/useApi'
import type { Task, CreateTaskInput, McpServer, ModelType } from '../../../shared/types'
import { RefreshCw, Sun, Calendar, CalendarDays } from 'lucide-react'

interface TaskFormProps {
  task: Task | null
  onClose: () => void
  onSaved?: () => void
}

type ScheduleMode = 'simple' | 'advanced'
type FrequencyType = 'interval' | 'daily' | 'weekly' | 'monthly'

const WEEKDAYS = [
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
  { value: 0, label: 'Sun', fullLabel: 'Sunday' }
]

// Parse cron expression to simple schedule format
function parseCronToSimple(cron: string): {
  mode: ScheduleMode
  frequency: FrequencyType
  intervalValue: number
  intervalUnit: 'minutes' | 'hours'
  time: string
  weekdays: number[]
  weekInterval: number
  monthDay: number
} {
  const defaults = {
    mode: 'simple' as ScheduleMode,
    frequency: 'daily' as FrequencyType,
    intervalValue: 30,
    intervalUnit: 'minutes' as 'minutes' | 'hours',
    time: '09:00',
    weekdays: [1], // Monday
    weekInterval: 1,
    monthDay: 1
  }

  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { ...defaults, mode: 'advanced' }

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts

  // Check for interval patterns
  if (minute.startsWith('*/') && hour === '*') {
    const interval = parseInt(minute.slice(2))
    if (!isNaN(interval)) {
      return { ...defaults, frequency: 'interval', intervalValue: interval, intervalUnit: 'minutes' }
    }
  }
  if (minute === '0' && hour.startsWith('*/')) {
    const interval = parseInt(hour.slice(2))
    if (!isNaN(interval)) {
      return { ...defaults, frequency: 'interval', intervalValue: interval, intervalUnit: 'hours' }
    }
  }

  // Check for specific time patterns
  const minuteNum = parseInt(minute)
  const hourNum = parseInt(hour)
  if (isNaN(minuteNum) || isNaN(hourNum) || minuteNum < 0 || minuteNum > 59 || hourNum < 0 || hourNum > 23) {
    return { ...defaults, mode: 'advanced' }
  }
  const time = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`

  // Daily
  if (dayOfMonth === '*' && dayOfWeek === '*') {
    return { ...defaults, frequency: 'daily', time }
  }

  // Weekly
  if (dayOfMonth === '*' && dayOfWeek !== '*') {
    const weekdays = dayOfWeek.split(',').flatMap(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        const days: number[] = []
        for (let i = start; i <= end; i++) days.push(i)
        return days
      }
      return [parseInt(part)]
    }).filter(n => !isNaN(n))
    if (weekdays.length > 0) {
      return { ...defaults, frequency: 'weekly', time, weekdays }
    }
  }

  // Monthly
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    const day = parseInt(dayOfMonth)
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return { ...defaults, frequency: 'monthly', time, monthDay: day }
    }
  }

  return { ...defaults, mode: 'advanced' }
}

// Convert simple schedule to cron expression
// Note: weekInterval > 1 is stored but cron runs weekly; scheduler handles the interval logic
function simpleToCron(
  frequency: FrequencyType,
  intervalValue: number,
  intervalUnit: 'minutes' | 'hours',
  time: string,
  weekdays: number[],
  _weekInterval: number, // Used for display only; scheduler handles multi-week intervals
  monthDay: number
): string {
  const [hour, minute] = time.split(':').map(Number)

  switch (frequency) {
    case 'interval':
      if (intervalUnit === 'minutes') {
        return `*/${intervalValue} * * * *`
      } else {
        return `0 */${intervalValue} * * *`
      }
    case 'daily':
      return `${minute} ${hour} * * *`
    case 'weekly':
      return `${minute} ${hour} * * ${weekdays.sort((a, b) => a - b).join(',')}`
    case 'monthly':
      return `${minute} ${hour} ${monthDay} * *`
    default:
      return '0 9 * * *'
  }
}

// Generate human-readable description
function getScheduleDescription(
  frequency: FrequencyType,
  intervalValue: number,
  intervalUnit: 'minutes' | 'hours',
  time: string,
  weekdays: number[],
  weekInterval: number,
  monthDay: number
): string {
  const [hour, minute] = time.split(':').map(Number)
  const timeStr = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  switch (frequency) {
    case 'interval':
      return `Every ${intervalValue} ${intervalUnit}`
    case 'daily':
      return `Daily at ${timeStr}`
    case 'weekly': {
      const dayNames = weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).filter(Boolean)
      const weekPrefix = weekInterval === 1 ? 'Every' : `Every ${weekInterval} weeks on`
      return `${weekPrefix} ${dayNames.join(', ')} at ${timeStr}`
    }
    case 'monthly':
      return `Monthly on day ${monthDay} at ${timeStr}`
    default:
      return ''
  }
}

export default function TaskForm({ task, onClose, onSaved }: TaskFormProps) {
  const { createTask, updateTask } = useTasks()
  const { listMcps } = useClaudeCli()
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
        const servers = await listMcps()
        setMcpServers(servers)
      } catch (err) {
        console.error('Failed to fetch MCP servers:', err)
      } finally {
        setLoadingMcps(false)
      }
    }

    fetchMcps()
  }, [listMcps])

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

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                AI Model
              </label>
              <div className="flex gap-2">
                {([
                  { value: 'haiku', label: 'Haiku', desc: 'Fast' },
                  { value: 'sonnet', label: 'Sonnet', desc: 'Balanced' },
                  { value: 'opus', label: 'Opus', desc: 'Powerful' }
                ] as const).map((model) => (
                  <label
                    key={model.value}
                    className={`flex-1 flex flex-col items-center p-2.5 border rounded-lg cursor-pointer transition-all ${
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
                ))}
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
                  No MCP servers configured in Claude CLI
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
