import { spawn } from 'child_process'
import { getSetting } from './database'
import type { GeminiCliResult, ModelType, McpServer } from '../shared/types'

function getGeminiCliPath(): string {
  const customPath = getSetting('gemini_cli_path')
  if (customPath) return customPath

  // Default path - try common locations or assume it's in PATH
  return 'gemini'
}

// Callback for streaming output updates
type OutputCallback = (partialOutput: string) => void

export async function executeGeminiCli(
  prompt: string,
  model?: ModelType | null,
  onOutput?: OutputCallback,
  attachments?: string[],
  mcpTools?: string[]
): Promise<GeminiCliResult> {
  const cliPath = getGeminiCliPath()

  // Basic args - adapt as needed for the actual CLI
  const args: string[] = []

  // Add model if specified and not default
  // Currently mapping both gemini-3 and gemini-2.5 to default (no flag) 
  // because specific model aliases are returning 404s with the current CLI version
  // Add model if specified and not default
  if (model) {
    console.log('[Gemini CLI] Received model:', model)
    if (model === 'gemini-2') {
      args.push('--model', 'gemini-2.0-flash-exp')
    } else if (model !== 'gemini-3' && model !== 'gemini-2.5') {
      args.push('--model', model)
    }
  }

  // Add allowed tools if specified
  if (mcpTools && mcpTools.length > 0) {
    args.push('--allowedTools', mcpTools.join(','))
  }

  // Add attachments
  if (attachments && attachments.length > 0) {
    for (const filePath of attachments) {
      args.push('--file', filePath)
    }
  }

  // Add prompt
  args.push(prompt)

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    const apiKey = getSetting('gemini_api_key')
    const env = { ...process.env }
    if (apiKey) {
      env.GEMINI_API_KEY = apiKey
    }

    console.log('[Gemini CLI] Executing:', cliPath, args.join(' '))

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
      console.log('[Gemini CLI] Process closed with code:', code)

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
      console.log('[Gemini CLI] Process error:', err.message)
      resolve({
        success: false,
        output: '',
        error: err.message
      })
    })
  })
}

export async function testGeminiConnection(): Promise<GeminiCliResult> {
  const cliPath = getGeminiCliPath()

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    // Assume --version or help is a safe test
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
          output: `Gemini CLI found: ${stdout.trim()}`
        })
      } else {
        resolve({
          success: false,
          output: '',
          error: stderr.trim() || `Gemini CLI not found or failed (exit code: ${code})`
        })
      }
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: `Failed to execute Gemini CLI: ${err.message}`
      })
    })
  })
}

export async function listMcpServers(): Promise<McpServer[]> {
  const cliPath = getGeminiCliPath()

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
      console.log('[Gemini CLI] mcp list output:', stdout.substring(0, 500))

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
          // Filter out invalid names
          if (serverName && !serverName.includes('MCP') && serverName.length < 50) {
            servers.push({
              name: serverName,
              tools: ['*']
            })
          }
        }
      }

      console.log('[Gemini CLI] Found MCP servers:', servers.map(s => s.name))
      resolve(servers)
    })

    proc.on('error', (err) => {
      console.log('[Gemini CLI] mcp list error:', err.message)
      resolve([])
    })
  })
}
