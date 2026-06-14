// AES-GCM encryption for card blobs, plus the base64 helpers it needs. A Cipher
// wraps a single AES-GCM key (the per-user encryption key from key derivation).

// AES-GCM standard IV size: 96 bits. A fresh random IV per message is required —
// reusing an IV with the same key breaks GCM's confidentiality and integrity.
const IV_BYTE_LENGTH = 12;

const AES_GCM_KEY_PARAMS = { name: "AES-GCM", length: 256 } as const;

export class Cipher {
  private readonly key: CryptoKey;

  constructor(key: CryptoKey) {
    this.key = key;
  }

  // Output is base64 of [iv ‖ ciphertext+tag], so a single opaque string carries
  // everything decryption needs except the key.
  async encrypt(plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
    const data = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      data,
    );
    return toBase64(concatBytes(iv, new Uint8Array(ciphertext)));
  }

  // Rejects if the data was tampered with (GCM authentication fails) or the key
  // is wrong.
  async decrypt(blob: string): Promise<string> {
    const bytes = fromBase64(blob);
    const iv = bytes.subarray(0, IV_BYTE_LENGTH);
    const ciphertext = bytes.subarray(IV_BYTE_LENGTH);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      this.key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  }

  // Export the raw key as base64 so it can be cached (sessionStorage) and survive
  // a page reload. Only works on a key derived/imported as extractable.
  async exportRawKey(): Promise<string> {
    const raw = await crypto.subtle.exportKey("raw", this.key);
    return toBase64(new Uint8Array(raw));
  }

  // Rebuild a Cipher from a base64 key produced by exportRawKey().
  static async fromRawKey(base64Key: string): Promise<Cipher> {
    const key = await crypto.subtle.importKey(
      "raw",
      fromBase64(base64Key),
      AES_GCM_KEY_PARAMS,
      true,
      ["encrypt", "decrypt"],
    );
    return new Cipher(key);
  }
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Returns ArrayBuffer-backed bytes (not the wider ArrayBufferLike) so the result
// satisfies WebCrypto's BufferSource where it's used as an IV / key material.
export function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
