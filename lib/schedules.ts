/**
 * Shared parsing and validation for schedule forms.
 *
 * createSchedule and updateSchedule write to the same table and must agree on
 * what is valid — they previously did not, so a schedule could be edited into a
 * shape that could never have been created.
 */

/** Selectable priorities, ordered strongest first.
 *
 *  The resolver picks the winning schedule with `ORDER BY priority ASC`, so a
 *  LOWER number wins. Users never see the number — they pick a label — which
 *  keeps that inversion out of the UI.
 */
export const SCHEDULE_PRIORITIES = [
    { value: 1, label: 'Highest' },
    { value: 5, label: 'High' },
    { value: 10, label: 'Normal' },
] as const

export const DEFAULT_SCHEDULE_PRIORITY = 10

const VALID_PRIORITIES: number[] = SCHEDULE_PRIORITIES.map(p => p.value)

export type ParsedScheduleForm = {
    name: string
    startTime: string
    endTime: string
    days: number[]
    priority: number
}

const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

/** Format check plus a real range check — the old regex accepted "25:00",
 *  which Postgres then rejected with a raw driver error. */
function assertValidTime(value: string, field: string): void {
    const match = TIME_PATTERN.exec(value)
    if (!match) throw new Error('Invalid time format')

    const hours = Number(match[1])
    const minutes = Number(match[2])
    const seconds = match[3] ? Number(match[3]) : 0

    if (hours > 23 || minutes > 59 || seconds > 59) {
        throw new Error(`${field} is not a valid time of day`)
    }
}

/**
 * Parse and validate a schedule form.
 *
 * Overnight windows (start after end, e.g. 21:00–02:00) are legal — the
 * resolver wraps them past midnight. A zero-length window is not: start equal
 * to end can never match, so it would save and then silently never play.
 *
 * @throws Error with a message safe to surface to the user.
 */
export function parseScheduleForm(formData: FormData): ParsedScheduleForm {
    const name = (formData.get('name') as string | null)?.trim() ?? ''
    const startTime = (formData.get('startTime') as string | null) ?? ''
    const endTime = (formData.get('endTime') as string | null) ?? ''
    const days = formData.getAll('days').map(d => parseInt(d as string, 10))

    if (!name || !startTime || !endTime || days.length === 0) {
        throw new Error('Missing required fields')
    }

    assertValidTime(startTime, 'Start time')
    assertValidTime(endTime, 'End time')

    if (days.some(d => isNaN(d) || d < 0 || d > 6)) {
        throw new Error('Invalid day values')
    }

    if (normaliseTime(startTime) === normaliseTime(endTime)) {
        throw new Error('Start and end time cannot be the same')
    }

    const rawPriority = formData.get('priority')
    let priority = DEFAULT_SCHEDULE_PRIORITY
    if (rawPriority !== null && rawPriority !== '') {
        priority = parseInt(rawPriority as string, 10)
        if (!VALID_PRIORITIES.includes(priority)) {
            throw new Error('Invalid priority')
        }
    }

    return {
        name,
        startTime,
        endTime,
        days: [...new Set(days)],
        priority,
    }
}

/** "09:00" and "09:00:00" are the same instant — compare on a common form. */
function normaliseTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value
}

/** True when the window runs past midnight into the following day. */
export function isOvernight(startTime: string, endTime: string): boolean {
    return normaliseTime(startTime) > normaliseTime(endTime)
}
