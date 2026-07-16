import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { DoseLog } from '@/types';
import { formatTimestamp12, formatTime12, weekdayName } from './time';

export interface RecordEntry {
  id: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  isAlert: boolean;
  sortKey: number;
}

function escalationSentence(log: DoseLog): string {
  if (log.escalations.includes('secondary')) {
    return 'Primary caregiver and secondary contact notified.';
  }
  if (log.escalations.includes('primary')) {
    return 'Primary caregiver notified.';
  }
  return '';
}

/** Turns a confirmation log into a human-readable timeline sentence. */
export function describeLog(log: DoseLog): RecordEntry {
  const day = log.confirmedAt
    ? weekdayName(log.confirmedAt)
    : weekdayName(`${log.date}T00:00:00`);
  const sortKey = new Date(log.confirmedAt ?? `${log.date}T23:59:59`).getTime();

  if (log.status === 'missed') {
    return {
      id: log.id,
      color: Colors.danger,
      icon: 'close',
      text: `${log.medicationName} wasn't taken on ${day}. ${escalationSentence(
        log
      )}`,
      isAlert: true,
      sortKey,
    };
  }

  if (log.status === 'late') {
    const at = log.confirmedAt ? formatTimestamp12(log.confirmedAt) : '';
    return {
      id: log.id,
      color: Colors.warning,
      icon: 'alert',
      text: `${log.medicationName} was taken at ${at} on ${day}, ${log.minutesLate} minutes late. ${escalationSentence(
        log
      )}`,
      isAlert: true,
      sortKey,
    };
  }

  const at = log.confirmedAt ? formatTimestamp12(log.confirmedAt) : '';
  return {
    id: log.id,
    color: Colors.success,
    icon: 'checkmark',
    text: `${log.medicationName} taken on time at ${at} on ${day} (scheduled ${formatTime12(
      log.scheduledTime
    )}).`,
    isAlert: false,
    sortKey,
  };
}

/** All records, newest first. */
export function buildTimeline(logs: Record<string, DoseLog>): RecordEntry[] {
  return Object.values(logs)
    .map(describeLog)
    .sort((a, b) => b.sortKey - a.sortKey);
}

/** Count of late/missed doses within the trailing 7 days. */
export function alertsThisWeek(logs: Record<string, DoseLog>): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return Object.values(logs).filter((log) => {
    const t = new Date(log.confirmedAt ?? `${log.date}T23:59:59`).getTime();
    return t >= weekAgo && (log.status === 'late' || log.status === 'missed');
  }).length;
}
