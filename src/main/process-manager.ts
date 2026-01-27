import { ChildProcess } from 'child_process'

const activeProcesses = new Map<string, ChildProcess>()

export function registerProcess(executionId: string, process: ChildProcess): void {
  activeProcesses.set(executionId, process)

  // Auto-cleanup when process exits
  process.on('close', () => {
    activeProcesses.delete(executionId)
  })
}

export function getProcess(executionId: string): ChildProcess | undefined {
  return activeProcesses.get(executionId)
}

export function writeToProcess(executionId: string, input: string): boolean {
  const process = activeProcesses.get(executionId)
  if (process && process.stdin && !process.stdin.destroyed) {
    // Don't add newline for ESC key (0x1b) or if input already ends with newline
    const shouldAddNewline = !input.endsWith('\n') && input !== '\x1b' && !input.includes('\x1b')
    process.stdin.write(input + (shouldAddNewline ? '\n' : ''))
    return true
  }
  return false
}

export function unregisterProcess(executionId: string): void {
  activeProcesses.delete(executionId)
}
