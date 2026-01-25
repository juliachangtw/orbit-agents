import { useState } from 'react'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import ExecutionLog from './components/ExecutionLog'
import Settings from './components/Settings'
import type { Task } from '../../shared/types'

type View = 'tasks' | 'logs' | 'settings'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('tasks')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskListKey, setTaskListKey] = useState(0)

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const handleCloseForm = () => {
    setEditingTask(null)
    setShowTaskForm(false)
  }

  const handleTaskSaved = () => {
    setTaskListKey(prev => prev + 1)
    handleCloseForm()
  }

  return (
    <div className="flex h-screen bg-[#F8F7F6]">
      {/* Sidebar */}
      <div className="w-56 bg-[#F8F7F6] flex flex-col border-r border-gray-200/60">
        {/* App Title with drag region */}
        <div className="h-12 drag-region flex items-center px-4">
          <div className="pl-14 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">CronSchedule</span>
          </div>
        </div>

        {/* New Task Button */}
        <div className="px-3 pt-2 pb-4">
          <button
            onClick={handleNewTask}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          <NavItem
            label="Tasks"
            icon={
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            active={currentView === 'tasks'}
            onClick={() => setCurrentView('tasks')}
          />
          <NavItem
            label="Execution Logs"
            icon={
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            active={currentView === 'logs'}
            onClick={() => setCurrentView('logs')}
          />
          <NavItem
            label="Settings"
            icon={
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </nav>

        {/* Version info */}
        <div className="p-4 text-xs text-gray-400">
          v1.0.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header drag region */}
        <div className="h-12 drag-region bg-[#F8F7F6]" />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'tasks' && (
            <div className="h-full bg-white rounded-tl-2xl shadow-sm border-t border-l border-gray-200/60 p-6 overflow-auto">
              <TaskList key={taskListKey} onEditTask={handleEditTask} onNewTask={handleNewTask} />
            </div>
          )}
          {currentView === 'logs' && <ExecutionLog />}
          {currentView === 'settings' && (
            <div className="h-full bg-white rounded-tl-2xl shadow-sm border-t border-l border-gray-200/60 p-6 overflow-auto">
              <Settings />
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm task={editingTask} onClose={handleCloseForm} onSaved={handleTaskSaved} />
      )}
    </div>
  )
}

interface NavItemProps {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}

function NavItem({ label, icon, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-[13px] ${
        active
          ? 'bg-white shadow-sm text-gray-900 font-medium border border-gray-200/60'
          : 'text-gray-600 hover:bg-white/60'
      }`}
    >
      <span className={active ? 'text-gray-700' : 'text-gray-500'}>{icon}</span>
      {label}
    </button>
  )
}
