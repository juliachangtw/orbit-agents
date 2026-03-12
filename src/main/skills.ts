import { readFileSync, readdirSync, statSync, lstatSync, realpathSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { Skill, SkillScanResult } from '../shared/types'

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      meta[key] = value
    }
  }
  return { meta, body: match[2] }
}

function scanSkillsDir(dirPath: string, scope: 'user' | 'project'): { skills: Skill[]; errors: string[] } {
  const skills: Skill[] = []
  const errors: string[] = []

  // Resolve the skills dir itself (could be a symlink)
  let resolvedDir: string
  try {
    resolvedDir = realpathSync(dirPath)
  } catch {
    return { skills, errors }
  }

  let entries: string[]
  try {
    entries = readdirSync(resolvedDir)
  } catch {
    return { skills, errors }
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue

    const entryPath = join(resolvedDir, entry)
    let resolvedPath: string

    try {
      // realpathSync resolves all symlinks in the path
      resolvedPath = realpathSync(entryPath)
      const stat = statSync(resolvedPath)
      if (!stat.isDirectory()) continue
    } catch {
      continue
    }

    // Look for SKILL.md
    const skillMdPath = join(resolvedPath, 'SKILL.md')
    try {
      const content = readFileSync(skillMdPath, 'utf-8')
      const { meta, body } = parseFrontmatter(content)

      if (meta.name) {
        const isSymlink = entryPath !== resolvedPath
        console.log(`[Skills] Found skill: ${meta.name} (${scope}${isSymlink ? ', symlink → ' + resolvedPath : ''})`)
        skills.push({
          name: meta.name,
          description: meta.description || '',
          invocation: meta.invocation,
          filePath: skillMdPath,
          content: body.trim(),
          scope
        })
      }
    } catch {
      // No SKILL.md in this directory, skip
    }
  }

  return { skills, errors }
}

export function scanSkills(projectPath?: string): SkillScanResult {
  const allSkills: Skill[] = []
  const allErrors: string[] = []

  // 1. Scan user scope: ~/.claude/skills/
  const userSkillsDir = join(homedir(), '.claude', 'skills')
  const userResult = scanSkillsDir(userSkillsDir, 'user')
  allSkills.push(...userResult.skills)
  allErrors.push(...userResult.errors)

  // 2. Scan project scope: <projectPath>/.claude/skills/
  if (projectPath) {
    const projectSkillsDir = join(projectPath, '.claude', 'skills')
    const projectResult = scanSkillsDir(projectSkillsDir, 'project')
    allSkills.push(...projectResult.skills)
    allErrors.push(...projectResult.errors)
  }

  return {
    skills: allSkills,
    projectPath,
    errors: allErrors.length > 0 ? allErrors : undefined
  }
}
