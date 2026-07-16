import { Colors } from '@/constants/Colors';
import {
  DoseLog,
  DoseStatus,
  EscalationLevel,
  Medication,
} from '@/types';
import {
  GRACE_MINUTES,
  MISSED_MINUTES,
  nowMinutes,
  timeToMinutes,
  todayKey,
} from './time';

/** Rotating palette used to color-code newly added medications. */
export const DOSE_COLORS = [
  Colors.primary,
  Colors.accent,
  '#5B8DEF',
  '#9B6BDE',
  '#E8920C',
  '#2BB3A3',
];

export function nextDoseColor(existing: Medication[]): string {
  return DOSE_COLORS[existing.length % DOSE_COLORS.length];
}

/**
 * Live status of *today's* dose, derived from the log (if confirmed) or from
 * the current time relative to the schedule. Today's doses never auto-expire to
 * "missed" so the confirmation loop is always available; past-day misses are
 * recorded explicitly in the logs.
 */
export function resolveStatus(
  med: Medication,
  log: DoseLog | undefined,
  now: Date = new Date()
): DoseStatus {
  if (log && (log.status === 'taken' || log.status === 'late')) {
    return log.status;
  }
  const delta = nowMinutes(now) - timeToMinutes(med.time);
  return delta < 0 ? 'pending' : 'due';
}

/** True when a dose is actionable right now (due / overdue but not missed). */
export function isConfirmable(status: DoseStatus): boolean {
  return status === 'due';
}

export interface StatusStyle {
  color: string;
  soft: string;
  label: string;
}

export function statusStyle(status: DoseStatus): StatusStyle {
  switch (status) {
    case 'taken':
      return { color: Colors.success, soft: Colors.successSoft, label: 'Taken' };
    case 'late':
      return {
        color: Colors.warning,
        soft: Colors.warningSoft,
        label: 'Taken late',
      };
    case 'due':
      return {
        color: Colors.warning,
        soft: Colors.warningSoft,
        label: 'Due now',
      };
    case 'missed':
      return { color: Colors.danger, soft: Colors.dangerSoft, label: 'Missed' };
    default:
      return {
        color: Colors.textMuted,
        soft: Colors.primarySofter,
        label: 'Upcoming',
      };
  }
}

/**
 * Builds the confirmation log entry when a dose is taken, computing lateness
 * and the caregiver escalation chain.
 */
export function confirmDose(med: Medication, now: Date = new Date()): DoseLog {
  const scheduled = timeToMinutes(med.time);
  const current = nowMinutes(now);
  const minutesLate = Math.max(0, current - scheduled);
  const late = minutesLate > GRACE_MINUTES;

  const escalations: EscalationLevel[] = [];
  if (late) escalations.push('primary');
  if (minutesLate > MISSED_MINUTES) escalations.push('secondary');

  return {
    id: `${med.id}-${todayKey(now)}`,
    medicationId: med.id,
    medicationName: med.name,
    date: todayKey(now),
    scheduledTime: med.time,
    status: late ? 'late' : 'taken',
    confirmedAt: now.toISOString(),
    minutesLate: late ? minutesLate : 0,
    escalations,
  };
}

/** Adherence rate (0–100) over a set of resolved doses. */
export function adherenceRate(
  doses: { status: DoseStatus }[]
): number {
  const closed = doses.filter(
    (d) => d.status === 'taken' || d.status === 'late' || d.status === 'missed'
  );
  if (closed.length === 0) return 100;
  const adhered = closed.filter(
    (d) => d.status === 'taken' || d.status === 'late'
  ).length;
  return Math.round((adhered / closed.length) * 100);
}

/**
 * Consecutive-day streak of full adherence (every dose taken/late, none
 * missed), counting back from yesterday plus today if already perfect.
 * The retention hook.
 */
export function adherenceStreak(
  medications: Medication[],
  logs: Record<string, DoseLog>,
  now: Date = new Date()
): number {
  if (medications.length === 0) return 0;
  let streak = 0;

  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const key = todayKey(d);

    let confirmed = 0;
    let missed = 0;
    for (const med of medications) {
      const log = logs[`${med.id}-${key}`];
      if (log && (log.status === 'taken' || log.status === 'late')) {
        confirmed++;
      } else if (dayOffset > 0) {
        // A past day with no confirmation counts as a miss.
        missed++;
      }
    }

    if (dayOffset === 0) {
      // Today only extends an existing streak once fully confirmed.
      if (confirmed === medications.length) streak++;
      continue;
    }

    if (missed === 0 && confirmed === medications.length) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
