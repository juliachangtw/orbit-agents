import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { getAllSettings } from './database'
import type { Task, ExecutionLog, Settings } from '../shared/types'

let transporter: Transporter | null = null

function createTransporter(settings: Settings): Transporter | null {
  if (!settings.email_smtp_host || !settings.email_smtp_user || !settings.email_smtp_pass) {
    return null
  }

  return nodemailer.createTransport({
    host: settings.email_smtp_host,
    port: parseInt(settings.email_smtp_port || '587', 10),
    secure: settings.email_smtp_port === '465',
    auth: {
      user: settings.email_smtp_user,
      pass: settings.email_smtp_pass
    }
  })
}

function getTransporter(): Transporter | null {
  if (!transporter) {
    const settings = getAllSettings()
    transporter = createTransporter(settings)
  }
  return transporter
}

export function resetTransporter(): void {
  transporter = null
}

export async function sendTaskResultEmail(
  task: Task,
  log: ExecutionLog
): Promise<void> {
  const transport = getTransporter()

  if (!transport) {
    throw new Error('Email not configured. Please set SMTP settings.')
  }

  const settings = getAllSettings()
  const fromAddress = settings.email_from || settings.email_smtp_user

  if (!task.email_to) {
    throw new Error('No recipient email address configured for this task.')
  }

  const statusEmoji = log.status === 'success' ? '✅' : '❌'
  const statusText = log.status === 'success' ? 'Completed Successfully' : 'Failed'

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: ${log.status === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .output {
      background: #1f2937;
      color: #f3f4f6;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      white-space: pre-wrap;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
    }
    .meta {
      color: #6b7280;
      font-size: 14px;
      margin-top: 16px;
    }
    .label {
      font-weight: 600;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">${statusEmoji} Task ${statusText}</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">${task.name}</p>
  </div>
  <div class="content">
    <p class="label">Prompt:</p>
    <p style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
      ${escapeHtml(task.prompt)}
    </p>

    ${log.output ? `
    <p class="label" style="margin-top: 20px;">Output:</p>
    <div class="output">${escapeHtml(log.output)}</div>
    ` : ''}

    ${log.error ? `
    <div class="error">
      <p class="label" style="margin: 0;">Error:</p>
      <p style="margin: 8px 0 0 0;">${escapeHtml(log.error)}</p>
    </div>
    ` : ''}

    <div class="meta">
      <p><span class="label">Started:</span> ${log.started_at}</p>
      ${log.finished_at ? `<p><span class="label">Finished:</span> ${log.finished_at}</p>` : ''}
    </div>
  </div>
</body>
</html>
`

  await transport.sendMail({
    from: fromAddress,
    to: task.email_to,
    subject: `[CronSchedule] ${statusEmoji} ${task.name} - ${statusText}`,
    html: htmlContent,
    text: `Task: ${task.name}\nStatus: ${statusText}\n\nPrompt:\n${task.prompt}\n\n${log.output ? `Output:\n${log.output}` : ''}${log.error ? `\n\nError:\n${log.error}` : ''}`
  })
}

export async function sendTestEmail(toAddress: string): Promise<void> {
  const transport = getTransporter()

  if (!transport) {
    throw new Error('Email not configured. Please set SMTP settings.')
  }

  const settings = getAllSettings()
  const fromAddress = settings.email_from || settings.email_smtp_user

  await transport.sendMail({
    from: fromAddress,
    to: toAddress,
    subject: '[CronSchedule] Test Email',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 style="color: #16a34a; margin: 0;">✅ Email Configuration Working!</h1>
    <p>Your CronSchedule email settings are configured correctly.</p>
    <p style="color: #6b7280; font-size: 14px;">Sent at: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
`,
    text: 'Your CronSchedule email settings are configured correctly.'
  })
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char])
}
