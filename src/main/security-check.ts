/**
 * Security check module for detecting dangerous operations
 * Detects actual dangerous shell commands that could cause data loss.
 * Focused on real executable patterns, not natural language discussion.
 */

export interface SecurityCheckResult {
  isDangerous: boolean
  reason: string
  detectedCommand?: string
}

/**
 * Check if text contains dangerous deletion operations.
 * Only flags patterns that look like actual executable commands,
 * not natural language mentions of deletion concepts.
 */
export function checkDangerousOperations(text: string): SecurityCheckResult {
  // Dangerous deletion command patterns — focused on real shell commands
  const dangerousPatterns = [
    // rm -rf targeting dangerous paths
    {
      pattern: /\brm\s+-rf\s+[\/~]/i,
      reason: '檢測到危險的刪除命令: rm -rf 指向根目錄或家目錄',
      command: 'rm -rf /~'
    },
    {
      pattern: /\brm\s+-rf\s+\.\.\//i,
      reason: '檢測到危險的刪除命令: rm -rf 指向上層目錄',
      command: 'rm -rf ../'
    },
    {
      pattern: /\brm\s+-rf\s+\*\s/i,
      reason: '檢測到危險的刪除命令: rm -rf * (刪除所有檔案)',
      command: 'rm -rf *'
    },
    {
      pattern: /\brm\s+-(rf|fr)\s+\//i,
      reason: '檢測到危險的刪除命令: rm -rf / (刪除根目錄)',
      command: 'rm -rf /'
    },
    // rm -r -f variants targeting dangerous paths
    {
      pattern: /\brm\s+-r\s+-f\s+[\/~]/i,
      reason: '檢測到危險的刪除命令: rm -r -f 指向根目錄或家目錄',
      command: 'rm -r -f /~'
    },
    // rm targeting root or wildcard everything
    {
      pattern: /\brm\s+.*\s+\/\s*$/m,
      reason: '檢測到危險的刪除命令: 嘗試刪除根目錄',
      command: 'rm /'
    },
    // Dangerous redirect + delete combos
    {
      pattern: />\s*\/dev\/null.*\brm\b/i,
      reason: '檢測到危險的刪除操作: 重定向到 /dev/null 並刪除',
      command: '> /dev/null ... rm'
    },
    // Variable expansion with rm -rf (injection risk)
    {
      pattern: /\brm\s+-(rf|fr)\s+.*\$\{/i,
      reason: '檢測到危險的刪除命令: 變數展開配合 rm -rf',
      command: 'rm -rf ${...}'
    },
    // mkfs / format disk
    {
      pattern: /\bmkfs\b.*\/dev\//i,
      reason: '檢測到危險的格式化命令: mkfs',
      command: 'mkfs /dev/'
    },
    // dd overwriting disk
    {
      pattern: /\bdd\b.*of=\/dev\//i,
      reason: '檢測到危險的磁碟覆寫命令: dd of=/dev/',
      command: 'dd of=/dev/'
    }
  ]

  // Check each pattern
  for (const { pattern, reason, command } of dangerousPatterns) {
    if (pattern.test(text)) {
      console.log(`[Security] Dangerous operation detected: ${command}`)
      console.log(`[Security] Reason: ${reason}`)
      console.log(`[Security] Text snippet: ${text.substring(0, 200)}`)
      return {
        isDangerous: true,
        reason,
        detectedCommand: command
      }
    }
  }

  return {
    isDangerous: false,
    reason: ''
  }
}

/**
 * Check if prompt itself contains dangerous operations (pre-execution check)
 */
export function checkPromptSafety(prompt: string): SecurityCheckResult {
  return checkDangerousOperations(prompt)
}
