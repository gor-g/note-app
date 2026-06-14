// Holds the active encryption Cipher for the current session. The key is derived
// from the user's password at login/signup and is also cached in this tab's
// sessionStorage, so a page reload can rebuild the Cipher without asking for the
// password again. sessionStorage (not localStorage) means the cached key is
// dropped when the tab closes, and is never shared with other tabs.

import { Cipher } from "./cipher";

const STORAGE_KEY = "memonote.encryptionKey";

class SessionKey {
  private cipher: Cipher | null = null;

  async set(cipher: Cipher): Promise<void> {
    this.cipher = cipher;
    sessionStorage.setItem(STORAGE_KEY, await cipher.exportRawKey());
  }

  get(): Cipher | null {
    return this.cipher;
  }

  // Rebuild the in-memory Cipher from the cached key after a reload. Returns null
  // when nothing is cached (e.g. a fresh tab, or after logout).
  async restoreFromStorage(): Promise<Cipher | null> {
    if (this.cipher) return this.cipher;
    const cachedKey = sessionStorage.getItem(STORAGE_KEY);
    if (!cachedKey) return null;
    this.cipher = await Cipher.fromRawKey(cachedKey);
    return this.cipher;
  }

  clear(): void {
    this.cipher = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export const sessionKey = new SessionKey();
