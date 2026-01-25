import { spawn } from 'child_process'
import { getSetting } from './database'
import type { CodexCliResult, ModelType, McpServer } from '../shared/types'

function getCodexCliPath(): string {
  const customPath = getSetting('codex_cli_path')
  if (customPath) return customPath
  return 'codex'
}

type OutputCallback = (partialOutput: string) => void

export async function executeCodexCli(
  prompt: string,
  model?: ModelType | null,
  onOutput?: OutputCallback,
  attachments?: string[],
  mcpTools?: string[]
): Promise<CodexCliResult> {
  const cliPath = getCodexCliPath()
  const args: string[] = []

  if (model) {
    args.push('--model', model)
  }

  // Add allowed tools if specified
  if (mcpTools && mcpTools.length > 0) {
    args.push('--allowedTools', mcpTools.join(','))
  }

  if (attachments && attachments.length > 0) {
    for (const filePath of attachments) {
      args.push('--file', filePath)
    }
  }

  args.push(prompt)

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    
    // Pass any necessary env vars here if needed
    const env = { ...process.env }

    console.log('[Codex CLI] Executing:', cliPath, args.join(' '))

    const proc = spawn(cliPath, args, {
      shell: false,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      stdout += text
      if (onOutput) {
        onOutput(stdout)
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout.trim()
        })
      } else {
        resolve({
          success: false,
          output: stdout.trim(),
          error: stderr.trim() || `Process exited with code ${code}`
        })
      }
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: err.message
      })
    })
  })
}

export async function testCodexConnection(): Promise<CodexCliResult> {
  const cliPath = getCodexCliPath()

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    const proc = spawn(cliPath, ['--version'], {
      shell: true,
      env: { ...process.env }
    })

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: `Codex CLI found: ${stdout.trim()}`
        })
      } else {
        resolve({
          success: false,
          output: '',
          error: stderr.trim() || `Codex CLI not found or failed (exit code: ${code})`
        })
      }
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: `Failed to execute Codex CLI: ${err.message}`
      })
    })
  })
}

export async function listMcpServers(): Promise<McpServer[]> {
  const cliPath = getCodexCliPath()

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    // Try to run 'mcp list' assuming it supports the standard command
    const proc = spawn(cliPath, ['mcp', 'list'], {
      shell: false,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      console.log('[Codex CLI] mcp list output:', stdout.substring(0, 500))
      
      const servers: McpServer[] = []
      const lines = stdout.split('\n')

      for (const line of lines) {
        // Clean the line of ANSI codes and whitespace
        // eslint-disable-next-line no-control-regex
        const cleanLine = line.replace(/\x1B\[\d+m/g, '').trim()
        
        // Skip empty lines or headers
        if (!cleanLine || cleanLine.startsWith('Configured MCP servers') || cleanLine.includes('Checking')) {
          continue
        }

        // Match "✓ name: command" or "name: command"
        const match = cleanLine.match(/^(?:✓\s*)?([^:]+):\s+(.+)$/)
        
        if (match) {
          const serverName = match[1].trim()
          if (serverName && !serverName.includes('MCP') && serverName.length < 50) {
            servers.push({
              name: serverName,
              tools: ['*'] 
            })
          }
        }
      }

      console.log('[Codex CLI] Found MCP servers:', servers.map(s => s.name))
      resolve(servers)
    })

    proc.on('error', (err) => {
      console.log('[Codex CLI] mcp list error:', err.message)
      resolve([])
    })
  })
}