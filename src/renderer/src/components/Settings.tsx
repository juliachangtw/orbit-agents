import { useState, useEffect, useCallback } from 'react'
import { useSettings, useClaudeCli, useGeminiCli, useCodexCli } from '../hooks/useApi'
import type { ClaudeCliResult, GeminiCliResult, CodexCliResult } from '../../../shared/types'

interface SettingsProps {
  onUnsavedChange?: (hasUnsaved: boolean) => void
}

export default function Settings({ onUnsavedChange }: SettingsProps) {
  const { settings, loading, updateSettings, testEmail } = useSettings()
  const { testConnection: testClaude } = useClaudeCli()
  const { testConnection: testGemini } = useGeminiCli()
  const { testConnection: testCodex } = useCodexCli()
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [formData, setFormData] = useState({
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_user: '',
    email_smtp_pass: '',
    email_from: '',
    claude_cli_path: '',
    claude_session_token: '',
    gemini_cli_path: '',
    gemini_api_key: '',
    codex_cli_path: '',
    auto_launch: 'true'
  })

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [testingClaude, setTestingClaude] = useState(false)
  const [claudeResult, setClaudeResult] = useState<ClaudeCliResult | null>(null)
  
  const [testingGemini, setTestingGemini] = useState(false)
  const [geminiResult, setGeminiResult] = useState<GeminiCliResult | null>(null)
  
  const [testingCodex, setTestingCodex] = useState(false)
  const [codexResult, setCodexResult] = useState<CodexCliResult | null>(null)

  const [testingEmail, setTestingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testEmailAddress, setTestEmailAddress] = useState('')

  useEffect(() => {
    if (!loading && settings) {
      setFormData({
        email_smtp_host: settings.email_smtp_host || '',
        email_smtp_port: settings.email_smtp_port || '587',
        email_smtp_user: settings.email_smtp_user || '',
        email_smtp_pass: settings.email_smtp_pass || '',
        email_from: settings.email_from || '',
        claude_cli_path: settings.claude_cli_path || '',
        claude_session_token: settings.claude_session_token || '',
        gemini_cli_path: settings.gemini_cli_path || '',
        gemini_api_key: settings.gemini_api_key || '',
        codex_cli_path: settings.codex_cli_path || '',
        auto_launch: settings.auto_launch ?? 'true'
      })
      setHasUnsavedChanges(false)
    }
  }, [loading, settings])

  // Check for unsaved changes
  const checkUnsavedChanges = useCallback(() => {
    if (!settings) return false
    return (
      formData.email_smtp_host !== (settings.email_smtp_host || '') ||
      formData.email_smtp_port !== (settings.email_smtp_port || '587') ||
      formData.email_smtp_user !== (settings.email_smtp_user || '') ||
      formData.email_smtp_pass !== (settings.email_smtp_pass || '') ||
      formData.email_from !== (settings.email_from || '') ||
      formData.claude_cli_path !== (settings.claude_cli_path || '') ||
      formData.claude_session_token !== (settings.claude_session_token || '') ||
      formData.gemini_cli_path !== (settings.gemini_cli_path || '') ||
      formData.gemini_api_key !== (settings.gemini_api_key || '') ||
      formData.codex_cli_path !== (settings.codex_cli_path || '') ||
      formData.auto_launch !== (settings.auto_launch ?? 'true')
    )
  }, [formData, settings])

  useEffect(() => {
    const unsaved = checkUnsavedChanges()
    setHasUnsavedChanges(unsaved)
    onUnsavedChange?.(unsaved)
  }, [checkUnsavedChanges, onUnsavedChange])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await updateSettings(formData)
      setHasUnsavedChanges(false)
      onUnsavedChange?.(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTestClaude = async () => {
    setTestingClaude(true)
    setClaudeResult(null)
    try {
      const result = await testClaude()
      setClaudeResult(result)
    } catch (err) {
      setClaudeResult({
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setTestingClaude(false)
    }
  }

  const handleTestGemini = async () => {
    setTestingGemini(true)
    setGeminiResult(null)
    try {
      const result = await testGemini()
      setGeminiResult(result)
    } catch (err) {
      setGeminiResult({
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setTestingGemini(false)
    }
  }

  const handleTestCodex = async () => {
    setTestingCodex(true)
    setCodexResult(null)
    try {
      const result = await testCodex()
      setCodexResult(result)
    } catch (err) {
      setCodexResult({
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setTestingCodex(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      setEmailResult({ success: false, message: 'Please enter an email address' })
      return
    }

    setTestingEmail(true)
    setEmailResult(null)
    try {
      await testEmail(testEmailAddress)
      setEmailResult({ success: true, message: 'Test email sent successfully!' })
    } catch (err) {
      setEmailResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send test email'
      })
    } finally {
      setTestingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your Claude CLI and email settings</p>
      </div>

      {/* General Settings */}
      <section className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">General</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Launch at Login
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically start Orbit Agent when you log in
              </p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, auto_launch: prev.auto_launch === 'true' ? 'false' : 'true' }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                formData.auto_launch === 'true' ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.auto_launch === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Claude CLI Settings */}
      <section className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Claude CLI</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              CLI Path
            </label>
            <input
              type="text"
              value={formData.claude_cli_path}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, claude_cli_path: e.target.value }))
              }
              placeholder="Leave empty for default path"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Default: ~/.local/bin/claude
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Session Token <span className="text-gray-400 font-normal">(Required for file uploads)</span>
            </label>
            <input
              type="password"
              value={formData.claude_session_token}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, claude_session_token: e.target.value }))
              }
              placeholder="CLAUDE_CODE_SESSION_ACCESS_TOKEN"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors font-mono"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Get sessionKey from claude.ai cookies
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestClaude}
              disabled={testingClaude}
              className="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {testingClaude && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-600 border-t-transparent"></div>
              )}
              Test Connection
            </button>

            {claudeResult && (
              <span className={`text-xs ${claudeResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {claudeResult.success ? claudeResult.output : claudeResult.error}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Gemini CLI Settings */}
      <section className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Gemini CLI</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              CLI Path
            </label>
            <input
              type="text"
              value={formData.gemini_cli_path}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gemini_cli_path: e.target.value }))
              }
              placeholder="Leave empty for default"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              API Key <span className="text-gray-400 font-normal">(Optional if configured in env)</span>
            </label>
            <input
              type="password"
              value={formData.gemini_api_key}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gemini_api_key: e.target.value }))
              }
              placeholder="GEMINI_API_KEY"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestGemini}
              disabled={testingGemini}
              className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {testingGemini && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-600 border-t-transparent"></div>
              )}
              Test Connection
            </button>

            {geminiResult && (
              <span className={`text-xs ${geminiResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {geminiResult.success ? geminiResult.output : geminiResult.error}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Codex CLI Settings */}
      <section className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Codex CLI</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              CLI Path
            </label>
            <input
              type="text"
              value={formData.codex_cli_path}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, codex_cli_path: e.target.value }))
              }
              placeholder="Leave empty for default"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestCodex}
              disabled={testingCodex}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {testingCodex && (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent"></div>
              )}
              Test Connection
            </button>

            {codexResult && (
              <span className={`text-xs ${codexResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {codexResult.success ? codexResult.output : codexResult.error}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Email Settings */}
      <section className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Email (SMTP)</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                SMTP Host
              </label>
              <input
                type="text"
                value={formData.email_smtp_host}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email_smtp_host: e.target.value }))
                }
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Port
              </label>
              <input
                type="text"
                value={formData.email_smtp_port}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email_smtp_port: e.target.value }))
                }
                placeholder="587"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={formData.email_smtp_user}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_smtp_user: e.target.value }))
              }
              placeholder="your-email@gmail.com"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={formData.email_smtp_pass}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_smtp_pass: e.target.value }))
              }
              placeholder="App password"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              From Address <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              value={formData.email_from}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_from: e.target.value }))
              }
              placeholder="noreply@yourdomain.com"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="pt-3 mt-3 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {testingEmail && (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                )}
                Send Test
              </button>
            </div>
            {emailResult && (
              <p className={`mt-2 text-xs ${emailResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {emailResult.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors ${
            hasUnsavedChanges
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-violet-600 hover:bg-violet-700'
          }`}
        >
          {saving && (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
          )}
          {hasUnsavedChanges ? 'Save Settings *' : 'Save Settings'}
        </button>

        {hasUnsavedChanges && !saving && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Unsaved changes
          </span>
        )}

        {saveSuccess && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Settings saved
          </span>
        )}
      </div>
    </div>
  )
}
