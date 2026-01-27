/**
 * Security check module for detecting dangerous operations
 * Strictly prohibits unauthorized deletion operations
 */

export interface SecurityCheckResult {
  isDangerous: boolean
  reason: string
  detectedCommand?: string
}

/**
 * Check if text contains dangerous deletion operations
 */
export function checkDangerousOperations(text: string): SecurityCheckResult {
  const lowerText = text.toLowerCase()

  // Dangerous deletion command patterns
  const dangerousPatterns = [
    // rm -rf patterns (most dangerous)
    {
      pattern: /\brm\s+-rf\s+/i,
      reason: '檢測到危險的刪除命令: rm -rf (遞迴強制刪除)',
      command: 'rm -rf'
    },
    {
      pattern: /\brm\s+-r\s+-f\s+/i,
      reason: '檢測到危險的刪除命令: rm -r -f (遞迴強制刪除)',
      command: 'rm -r -f'
    },
    {
      pattern: /\brm\s+-fr\s+/i,
      reason: '檢測到危險的刪除命令: rm -fr (遞迴強制刪除)',
      command: 'rm -fr'
    },
    // rm with dangerous flags
    {
      pattern: /\brm\s+-r\s+/i,
      reason: '檢測到危險的刪除命令: rm -r (遞迴刪除)',
      command: 'rm -r'
    },
    {
      pattern: /\brm\s+-f\s+/i,
      reason: '檢測到危險的刪除命令: rm -f (強制刪除)',
      command: 'rm -f'
    },
    // Dangerous paths with rm
    {
      pattern: /\brm\s+.*\/\s*$/i,
      reason: '檢測到危險的刪除命令: 嘗試刪除根目錄',
      command: 'rm /'
    },
    {
      pattern: /\brm\s+.*\.\.\/\.\.\/\.\./i,
      reason: '檢測到危險的刪除命令: 嘗試刪除上層目錄',
      command: 'rm ../..'
    },
    // Other dangerous deletion commands
    {
      pattern: /\bunlink\s+.*\/\s*$/i,
      reason: '檢測到危險的刪除命令: unlink 根目錄',
      command: 'unlink /'
    },
    {
      pattern: /\brmdir\s+.*\/\s*$/i,
      reason: '檢測到危險的刪除命令: rmdir 根目錄',
      command: 'rmdir /'
    },
    // Dangerous file operations
    {
      pattern: />\s*\/dev\/null.*rm/i,
      reason: '檢測到危險的刪除操作: 重定向到 /dev/null 並刪除',
      command: '> /dev/null ... rm'
    },
    // Shell dangerous patterns
    {
      pattern: /\$\{.*\}.*rm.*-rf/i,
      reason: '檢測到危險的刪除命令: 變數展開配合 rm -rf',
      command: '${...} rm -rf'
    },
    // Chinese deletion keywords in dangerous context
    {
      pattern: /刪除.*所有|刪除.*全部|刪除.*根目錄|刪除.*系統/i,
      reason: '檢測到危險的刪除意圖: 嘗試刪除所有/全部/根目錄/系統文件',
      command: '刪除所有/全部'
    },
    // Dangerous delete operations in code blocks
    {
      pattern: /```[\s\S]*?rm\s+-rf[\s\S]*?```/i,
      reason: '檢測到危險的刪除命令: 在代碼區塊中包含 rm -rf',
      command: 'rm -rf (in code block)'
    },
    {
      pattern: /```[\s\S]*?rm\s+-r[\s\S]*?```/i,
      reason: '檢測到危險的刪除命令: 在代碼區塊中包含 rm -r',
      command: 'rm -r (in code block)'
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

  // Additional check: look for rm commands that might be dangerous
  // but weren't caught by the patterns above
  const rmMatch = text.match(/\brm\s+([^\s\n]+)/i)
  if (rmMatch) {
    const target = rmMatch[1]
    // Check if target is a dangerous path
    if (target === '/' || target === '/*' || target.startsWith('../') || target.includes('*')) {
      return {
        isDangerous: true,
        reason: `檢測到危險的刪除命令: rm ${target} (可能刪除重要文件或目錄)`,
        detectedCommand: `rm ${target}`
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
