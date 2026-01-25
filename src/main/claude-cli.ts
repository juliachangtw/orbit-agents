import { spawn, execFile } from 'child_process'
import { getSetting } from './database'
import type { ClaudeCliResult, McpServer, ModelType } from '../shared/types'

function getClaudeCliPath(): string {
  // Return full path for execFile (which doesn't use shell)
  const customPath = getSetting('claude_cli_path')
  if (customPath) return customPath

  // Default claude path - try common locations
  const homedir = process.env.HOME || ''
  return `${homedir}/.local/bin/claude`
}

const IDLE_TIMEOUT = 10 * 60 * 1000 // 10 minutes of no output = timeout

// Callback for streaming output updates
type OutputCallback = (partialOutput: string) => void

// Parse stream-json output from Claude CLI
// Extracts all assistant text messages and relevant tool results
function parseStreamJsonOutput(rawOutput: string): string {
  const lines = rawOutput.split('\n').filter(line => line.trim())
  const outputParts: string[] = []

  for (const line of lines) {
    try {
      const json = JSON.parse(line)

      // Handle different message types
      if (json.type === 'assistant' && json.message?.content) {
        // Extract text from assistant messages
        for (const block of json.message.content) {
          if (block.type === 'text' && block.text) {
            outputParts.push(block.text)
          }
        }
      } else if (json.type === 'result' && json.result) {
        // Final result message
        if (typeof json.result === 'string') {
          outputParts.push(json.result)
        }
      } else if (json.type === 'content_block_delta' && json.delta?.text) {
        // Streaming text delta
        outputParts.push(json.delta.text)
      }
    } catch {
      // Not valid JSON, might be plain text - include it
      if (line.trim() && !line.startsWith('{')) {
        outputParts.push(line)
      }
    }
  }

  // If no parsed content, return raw output (fallback)
  if (outputParts.length === 0) {
    return rawOutput.trim()
  }

  return outputParts.join('\n\n').trim()
}

export async function executeClaudeCli(
  prompt: string,
  mcpTools?: string[],
  model?: ModelType | null,
  onOutput?: OutputCallback,
  attachments?: string[]
): Promise<ClaudeCliResult> {
  const cliPath = getClaudeCliPath()

  // Use --print for non-interactive mode
  // Use --dangerously-skip-permissions to bypass permission prompts for scheduled tasks
  // Use stream-json to capture the full conversation including tool calls and intermediate results
  const args: string[] = [
    '--print',
    '--output-format', 'stream-json',
    '--dangerously-skip-permissions',
    '--verbose'
  ]

  // Add model if specified
  if (model) {
    args.push('--model', model)
  }

  // Add allowed tools if specified
  if (mcpTools && mcpTools.length > 0) {
    args.push('--allowedTools', mcpTools.join(','))
  }

  // Add file attachments using Claude CLI's native --file flag
  if (attachments && attachments.length > 0) {
    for (const filePath of attachments) {
      args.push('--file', filePath)
    }
  }

  // Add the prompt with -p flag (required when using --file)
  args.push('-p', prompt)

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let killed = false
    let lastActivityTime = Date.now()

    const fullCommand = `${cliPath} ${args.map(a => `"${a}"`).join(' ')}`
    console.log('[Claude CLI] Executing:', fullCommand)

    // Get session token from settings
    const sessionToken = getSetting('claude_session_token')
    const env = { ...process.env }
    if (sessionToken) {
      env.CLAUDE_CODE_SESSION_ACCESS_TOKEN = sessionToken
    }

    // Use spawn without shell to properly handle Unicode/Chinese characters
    const proc = spawn(cliPath, args, {
      shell: false,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],  // stdin ignored, stdout/stderr piped
      detached: false
    })

    console.log('[Claude CLI] Process spawned with PID:', proc.pid)

    // Check for idle timeout periodically (only timeout if no activity)
    const idleChecker = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime
      if (idleTime > IDLE_TIMEOUT) {
        console.log(`[Claude CLI] Idle timeout: no output for ${IDLE_TIMEOUT / 1000} seconds`)
        killed = true
        clearInterval(idleChecker)
        proc.kill('SIGTERM')
        resolve({
          success: false,
          output: parseStreamJsonOutput(stdout),
          error: `Idle timeout: No output received for ${IDLE_TIMEOUT / 1000 / 60} minutes`
        })
      }
    }, 30000) // Check every 30 seconds

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      console.log('[Claude CLI] stdout chunk received, length:', text.length)
      stdout += text
      lastActivityTime = Date.now() // Reset activity timer

      // Parse stream-json and extract assistant messages for display
      if (onOutput) {
        const parsedOutput = parseStreamJsonOutput(stdout)
        onOutput(parsedOutput)
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      console.log('[Claude CLI] stderr:', text.substring(0, 200))
      stderr += text
      lastActivityTime = Date.now() // Reset activity timer
    })

    proc.on('close', (code) => {
      console.log('[Claude CLI] Process closed with code:', code)
      clearInterval(idleChecker)
      if (killed) return // Already resolved by timeout

      // Parse the stream-json output to get the full conversation
      const parsedOutput = parseStreamJsonOutput(stdout)

      if (code === 0) {
        resolve({
          success: true,
          output: parsedOutput
        })
      } else {
        resolve({
          success: false,
          output: parsedOutput,
          error: stderr.trim() || `Process exited with code ${code}`
        })
      }
    })

    proc.on('error', (err) => {
      console.log('[Claude CLI] Process error:', err.message)
      clearInterval(idleChecker)
      if (killed) return

      resolve({
        success: false,
        output: '',
        error: err.message
      })
    })
  })
}

export async function testClaudeConnection(): Promise<ClaudeCliResult> {
  const cliPath = getClaudeCliPath()

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
          output: `Claude CLI found: ${stdout.trim()}`
        })
      } else {
        resolve({
          success: false,
          output: '',
          error: stderr.trim() || `Claude CLI not found or failed (exit code: ${code})`
        })
      }
    })

    proc.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: `Failed to execute Claude CLI: ${err.message}`
      })
    })
  })
}

export async function listMcpServers(): Promise<McpServer[]> {
  const cliPath = getClaudeCliPath()

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    // Use spawn without shell for proper handling
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
      console.log('[Claude CLI] mcp list output:', stdout.substring(0, 500))
      if (stderr) console.log('[Claude CLI] mcp list stderr:', stderr.substring(0, 200))

      // Parse text output to extract server names
      // Format: "servername: command... - ✓ Connected" or similar
      const servers: McpServer[] = []
      const lines = stdout.split('\n')

      for (const line of lines) {
        // Match lines like "context7: npx..." or "Sentry: npx..."
        const match = line.match(/^([^:]+):\s+.+/)
        if (match && !line.includes('Checking') && !line.startsWith(' ')) {
          const serverName = match[1].trim()
          // Skip header lines
          if (serverName && !serverName.includes('MCP') && serverName.length < 50) {
            servers.push({
              name: serverName,
              tools: ['*'] // We don't have individual tools, so use wildcard
            })
          }
        }
      }

      console.log('[Claude CLI] Found MCP servers:', servers.map(s => s.name))
      resolve(servers)
    })

    proc.on('error', (err) => {
      console.log('[Claude CLI] mcp list error:', err.message)
      resolve([])
    })
  })
}
