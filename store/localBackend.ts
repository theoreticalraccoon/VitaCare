import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hashPassword,
  normalizeUsername,
  randomSalt,
  verifyPassword,
} from '@/lib/auth';
import { UserData } from '@/types';
import {
  AppUser,
  AuthOutcome,
  Backend,
  freshUserData,
  SessionSnapshot,
} from './defaults';

const KEY = 'vitacare:local:v1';

interface LocalAccount {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  salt: string;
}

interface LocalDB {
  accounts: LocalAccount[];
  data: Record<string, UserData>;
  sessionUserId: string | null;
}

async function read(): Promise<LocalDB> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { accounts: [], data: {}, sessionUserId: null, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { accounts: [], data: {}, sessionUserId: null };
}

async function write(db: LocalDB): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(db));
}

function toUser(a: LocalAccount): AppUser {
  return { id: a.id, name: a.name, username: a.username };
}

/** Offline fallback backend — accounts + data persisted in AsyncStorage. */
export const localBackend: Backend = {
  mode: 'local',

  async restore(): Promise<SessionSnapshot | null> {
    const db = await read();
    if (!db.sessionUserId) return null;
    const account = db.accounts.find((a) => a.id === db.sessionUserId);
    if (!account) return null;
    return { user: toUser(account), data: db.data[account.id] ?? freshUserData() };
  },

  // Local storage is already the source of truth — nothing to revalidate.
  async revalidate(): Promise<SessionSnapshot | null> {
    return null;
  },

  async signUp(input): Promise<AuthOutcome> {
    const db = await read();
    const username = normalizeUsername(input.username);
    if (db.accounts.some((a) => a.username === username)) {
      return { ok: false, error: 'That username is already taken.' };
    }
    const salt = randomSalt();
    const passwordHash = await hashPassword(input.password, salt);
    const account: LocalAccount = {
      id: `u${Date.now()}`,
      name: input.name.trim(),
      username,
      passwordHash,
      salt,
    };
    const data = freshUserData();
    db.accounts.push(account);
    db.data[account.id] = data;
    db.sessionUserId = account.id;
    await write(db);
    return { ok: true, session: { user: toUser(account), data } };
  },

  async signIn(input): Promise<AuthOutcome> {
    const db = await read();
    const username = normalizeUsername(input.username);
    const account = db.accounts.find((a) => a.username === username);
    if (!account) return { ok: false, error: 'No account found for that username.' };
    const valid = await verifyPassword(
      input.password,
      account.salt,
      account.passwordHash
    );
    if (!valid) return { ok: false, error: 'Incorrect password.' };
    db.sessionUserId = account.id;
    await write(db);
    return {
      ok: true,
      session: { user: toUser(account), data: db.data[account.id] ?? freshUserData() },
    };
  },

  async signOut(): Promise<void> {
    const db = await read();
    db.sessionUserId = null;
    await write(db);
  },

  async deleteAccount(user: AppUser): Promise<{ ok: boolean; error?: string }> {
    const db = await read();
    db.accounts = db.accounts.filter((a) => a.id !== user.id);
    delete db.data[user.id];
    if (db.sessionUserId === user.id) db.sessionUserId = null;
    await write(db);
    return { ok: true };
  },

  async persist(userId: string, data: UserData): Promise<void> {
    const db = await read();
    db.data[userId] = data;
    await write(db);
  },
};
