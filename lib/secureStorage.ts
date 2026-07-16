import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as aesjs from 'aes-js';

/**
 * Encrypted-at-rest key/value storage (CWE-922 mitigation).
 *
 * Each value is encrypted with a fresh AES-256 key. The key is stored in the
 * hardware-backed device keystore (iOS Keychain / Android Keystore) via
 * expo-secure-store; the ciphertext is stored in AsyncStorage. This protects
 * Supabase session tokens and cached health data on a lost/rooted device, and
 * avoids SecureStore's ~2 KB value limit (only the 32-byte key lives there).
 */

// SecureStore keys allow only [A-Za-z0-9._-]; map arbitrary keys into that set.
function keyId(key: string): string {
  return `vc_${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

async function encrypt(key: string, value: string): Promise<string> {
  const aesKey = Crypto.getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(aesKey, new aesjs.Counter(1));
  const ciphertext = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(keyId(key), aesjs.utils.hex.fromBytes(aesKey));
  return aesjs.utils.hex.fromBytes(ciphertext);
}

async function decrypt(key: string, ciphertextHex: string): Promise<string | null> {
  const aesKeyHex = await SecureStore.getItemAsync(keyId(key));
  if (!aesKeyHex) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(aesKeyHex),
    new aesjs.Counter(1)
  );
  const plaintext = cipher.decrypt(aesjs.utils.hex.toBytes(ciphertextHex));
  return aesjs.utils.utf8.fromBytes(plaintext);
}

/** A drop-in async storage adapter that encrypts values at rest. */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const ciphertext = await AsyncStorage.getItem(key);
      if (!ciphertext) return null;
      return await decrypt(key, ciphertext);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, await encrypt(key, value));
    } catch {
      // best-effort; never block the UI on storage
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      await SecureStore.deleteItemAsync(keyId(key));
    } catch {
      // ignore
    }
  },
};
