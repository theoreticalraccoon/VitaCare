import { Caregivers, UserData } from '@/types';

export const emptyCaregivers: Caregivers = {
  primaryName: '',
  primaryEmail: '',
  secondaryName: '',
  secondaryEmail: '',
};

export function freshUserData(): UserData {
  return {
    hasOnboarded: false,
    medications: [],
    channels: { notification: true, email: false, phoneAlarm: false },
    caregivers: emptyCaregivers,
    logs: {},
  };
}

/** Lightweight user identity shared by both backends. */
export interface AppUser {
  id: string;
  name: string;
  username: string;
}

export interface SessionSnapshot {
  user: AppUser;
  data: UserData;
}

export interface AuthOutcome {
  ok: boolean;
  error?: string;
  /** Cloud sign-up may require email verification before a session exists. */
  needsVerification?: boolean;
  session?: SessionSnapshot;
}

export interface Backend {
  mode: 'cloud' | 'local';
  /** Fast path: returns the cached/local session immediately (no network wait). */
  restore(): Promise<SessionSnapshot | null>;
  /**
   * Background refresh from the source of truth (network). Returns fresh data
   * to reconcile into state, or null if nothing to revalidate / it failed.
   */
  revalidate(user: AppUser): Promise<SessionSnapshot | null>;
  signUp(input: {
    name: string;
    username: string;
    password: string;
  }): Promise<AuthOutcome>;
  signIn(input: { username: string; password: string }): Promise<AuthOutcome>;
  signOut(): Promise<void>;
  /** Permanently deletes the account and all its data. */
  deleteAccount(user: AppUser): Promise<{ ok: boolean; error?: string }>;
  persist(userId: string, data: UserData): Promise<void>;
}
