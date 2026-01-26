export type ScheduleMode = 'simple' | 'advanced'
export type FrequencyType = 'interval' | 'daily' | 'weekly' | 'monthly'

export const WEEKDAYS = [
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
  { value: 0, label: 'Sun', fullLabel: 'Sunday' }
]

export function parseCronToSimple(cron: string): {
  mode: ScheduleMode
  frequency: FrequencyType
  intervalValue: number
  intervalUnit: 'minutes' | 'hours'
  time: string
  weekdays: number[]
  weekInterval: number
  monthDay: number
} {
  const defaults = {
    mode: 'simple' as ScheduleMode,
    frequency: 'daily' as FrequencyType,
    intervalValue: 30,
    intervalUnit: 'minutes' as 'minutes' | 'hours',
    time: '09:00',
    weekdays: [1], // Monday
    weekInterval: 1,
    monthDay: 1
  }

  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { ...defaults, mode: 'advanced' }

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts

  // Check for interval patterns
  if (minute.startsWith('*/') && hour === '*') {
    const interval = parseInt(minute.slice(2))
    if (!isNaN(interval)) {
      return { ...defaults, frequency: 'interval', intervalValue: interval, intervalUnit: 'minutes' }
    }
  }
  if (minute === '0' && hour.startsWith('*/')) {
    const interval = parseInt(hour.slice(2))
    if (!isNaN(interval)) {
      return { ...defaults, frequency: 'interval', intervalValue: interval, intervalUnit: 'hours' }
    }
  }

  // Check for specific time patterns
  const minuteNum = parseInt(minute)
  const hourNum = parseInt(hour)
  if (isNaN(minuteNum) || isNaN(hourNum) || minuteNum < 0 || minuteNum > 59 || hourNum < 0 || hourNum > 23) {
    return { ...defaults, mode: 'advanced' }
  }
  const time = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`

  // Daily
  if (dayOfMonth === '*' && dayOfWeek === '*') {
    return { ...defaults, frequency: 'daily', time }
  }

  // Weekly
  if (dayOfMonth === '*' && dayOfWeek !== '*') {
    const weekdays = dayOfWeek.split(',').flatMap(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        const days: number[] = []
        for (let i = start; i <= end; i++) days.push(i)
        return days
      }
      return [parseInt(part)]
    }).filter(n => !isNaN(n))
    if (weekdays.length > 0) {
      return { ...defaults, frequency: 'weekly', time, weekdays }
    }
  }

  // Monthly
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    const day = parseInt(dayOfMonth)
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return { ...defaults, frequency: 'monthly', time, monthDay: day }
    }
  }

  return { ...defaults, mode: 'advanced' }
}

export function simpleToCron(
  frequency: FrequencyType,
  intervalValue: number,
  intervalUnit: 'minutes' | 'hours',
  time: string,
  weekdays: number[],
  _weekInterval: number,
  monthDay: number
): string {
  const [hour, minute] = time.split(':').map(Number)

  switch (frequency) {
    case 'interval':
      if (intervalUnit === 'minutes') {
        return `*/${intervalValue} * * * *`
      } else {
        return `0 */${intervalValue} * * *`
      }
    case 'daily':
      return `${minute} ${hour} * * *`
    case 'weekly':
      return `${minute} ${hour} * * ${weekdays.sort((a, b) => a - b).join(',')}`
    case 'monthly':
      return `${minute} ${hour} ${monthDay} * *`
    default:
      return '0 9 * * *'
  }
}

export function getScheduleDescription(
  frequency: FrequencyType,
  intervalValue: number,
  intervalUnit: 'minutes' | 'hours',
  time: string,
  weekdays: number[],
  weekInterval: number,
  monthDay: number
): string {
  const [hour, minute] = time.split(':').map(Number)
  const timeStr = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  switch (frequency) {
    case 'interval':
      return `Every ${intervalValue} ${intervalUnit}`
    case 'daily':
      return `Daily at ${timeStr}`
    case 'weekly': {
      const dayNames = weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).filter(Boolean)
      const weekPrefix = weekInterval === 1 ? 'Every' : `Every ${weekInterval} weeks on`
      return `${weekPrefix} ${dayNames.join(', ')} at ${timeStr}`
    }
    case 'monthly':
      return `Monthly on day ${monthDay} at ${timeStr}`
    default:
      return ''
  }
}
