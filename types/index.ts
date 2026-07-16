/** Shared domain types for VitaCare. */

/** How a scheduled dose ended up. */
export type DoseStatus =
  | 'pending' // not yet due
  | 'due' // time has arrived, awaiting confirmation
  | 'taken' // confirmed on time
  | 'late' // confirmed after the grace window
  | 'missed'; // recorded as not taken

/** Reminder delivery channels the user can enable. */
export interface ReminderChannels {
  notification: boolean;
  email: boolean;
  phoneAlarm: boolean;
}

/** A scheduled medication. */
export interface Medication {
  id: string;
  name: string;
  dosage?: string; // e.g. "500 mg", "1 tablet"
  time: string; // "HH:MM" 24-hour
  color: string; // hex, color-coded schedule
}

/** A single dose occurrence on a given day. */
export interface DoseLog {
  id: string; // `${medicationId}-${date}`
  medicationId: string;
  medicationName: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // "HH:MM"
  status: DoseStatus;
  confirmedAt?: string; // ISO timestamp of confirmation
  minutesLate?: number;
  escalations: EscalationLevel[];
}

/** Who has been notified for a late/missed dose. */
export type EscalationLevel = 'primary' | 'secondary';

/** Optional caregiver / family contacts for the escalation chain. */
export interface Caregivers {
  primaryName: string;
  primaryEmail: string;
  secondaryName: string;
  secondaryEmail: string;
}

/** A registered user account (local auth). */
export interface Account {
  id: string;
  name: string;
  username: string; // stored lower-cased
  passwordHash: string;
  salt: string;
  createdAt: string;
}

/** Per-user application data. */
export interface UserData {
  hasOnboarded: boolean;
  medications: Medication[];
  channels: ReminderChannels;
  caregivers: Caregivers;
  /** Confirmation history keyed by `${medicationId}-${date}`. */
  logs: Record<string, DoseLog>;
}

/** The full persisted state: accounts + their data + active session. */
export interface PersistedState {
  accounts: Account[];
  userData: Record<string, UserData>; // keyed by account id
  sessionUserId: string | null;
}

/** Result of an auth attempt. */
export interface AuthResult {
  ok: boolean;
  error?: string;
}
