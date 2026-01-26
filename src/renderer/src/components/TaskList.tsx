import { useState, useMemo } from 'react'
import { parseCronToSimple, getScheduleDescription } from '../utils/cron'
import { useTasks } from '../hooks/useApi'
import type { Task } from '../../../shared/types'

interface TaskListProps {
  onEditTask: (task: Task) => void
  onNewTask: () => void
}

export default function TaskList({ onEditTask }: TaskListProps) {
  const { tasks, loading, error, toggleTask, deleteTask, runTaskNow } = useTasks()
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set())
  const [deletingTask, setDeletingTask] = useState<string | null>(null)

  const handleToggle = async (task: Task) => {
    try {
      await toggleTask(task.id)
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleRunNow = async (taskId: string) => {
    setRunningTasks((prev) => new Set(prev).add(taskId))
    try {
      await runTaskNow(taskId)
    } catch (err) {
      console.error('Failed to run task:', err)
    } finally {
      setRunningTasks((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setDeletingTask(taskId)
    try {
      await deleteTask(taskId)
    } catch (err) {
      console.error('Failed to delete task:', err)
    } finally {
      setDeletingTask(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-4 font-medium text-gray-900">No tasks yet</h3>
        <p className="mt-2 text-sm text-gray-500">Create your first scheduled AI task to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isRunning={runningTasks.has(task.id)}
          isDeleting={deletingTask === task.id}
          onEdit={() => onEditTask(task)}
          onToggle={() => handleToggle(task)}
          onRunNow={() => handleRunNow(task.id)}
          onDelete={() => handleDelete(task.id)}
        />
      ))}
    </div>
  )
}

interface TaskCardProps {
  task: Task
  isRunning: boolean
  isDeleting: boolean
  onEdit: () => void
  onToggle: () => void
  onRunNow: () => void
  onDelete: () => void
}

function TaskCard({
  task,
  isRunning,
  isDeleting,
  onEdit,
  onToggle,
  onRunNow,
  onDelete
}: TaskCardProps) {
  const isEnabled = task.enabled === 1

  const description = useMemo(() => {
    const schedule = parseCronToSimple(task.cron_expression)
    if (schedule.mode === 'advanced') return null
    return getScheduleDescription(
      schedule.frequency,
      schedule.intervalValue,
      schedule.intervalUnit,
      schedule.time,
      schedule.weekdays,
      task.week_interval ?? schedule.weekInterval,
      schedule.monthDay
    )
  }, [task.cron_expression, task.week_interval])

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all ${
        isEnabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{task.name}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Schedule */}
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {description ? (
          <span className="font-medium text-gray-700">{description}</span>
        ) : (
          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono" title="Custom Cron Expression">
            {task.cron_expression}
          </code>
        )}
      </div>

      {/* Output Type Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            task.output_type === 'both'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {task.output_type === 'log' && 'Log Only'}
          {task.output_type === 'both' && 'Log + Email'}
        </span>
        {task.mcp_tools && JSON.parse(task.mcp_tools).length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            MCP Tools
          </span>
        )}
      </div>

      {/* Prompt Preview */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Prompt</p>
        <p className="text-sm text-gray-700 line-clamp-3">{task.prompt}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={onRunNow}
          disabled={isRunning || isDeleting}
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              Running...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Run Now
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting || isRunning}
            className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
