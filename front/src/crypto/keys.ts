// Key derivation for the E2EE scheme (see "Encryption & key derivation" in the
// project README). One password is turned, entirely in the browser, into:
//   - an `encryptionKey` (wrapped in a Cipher) that never leaves the device, and
//   - an `authCredential` that is sent to the server in place of the password.
// Because the server only ever receives `authCredential`, it cannot derive the
// encryption key.

import { argon2id } from "hash-wasm";
import { Cipher, toBase64 } from "./cipher";

// Pinned and versioned with the app: raising these changes every derived key, so
// it must be a deliberate, migrated change.
const ARGON2 = {
  parallelism: 1,
  iterations: 3,
  memorySize: 65536, // KiB (= 64 MiB)
  hashLength: 32, // bytes of master key
};

const HKDF_HASH = "SHA-256";

export interface DerivedKeys {
  cipher: Cipher;
  authCredential: string;
}

// Deterministic: the same email + password always produce the same keys, so any
// device reconstructs them with no stored key material.
export async function deriveKeys(
  email: string,
  password: string,
): Promise<DerivedKeys> {
  const salt = await saltFromEmail(email);

  const masterKey = await argon2id({
    password,
    salt,
    parallelism: ARGON2.parallelism,
    iterations: ARGON2.iterations,
    memorySize: ARGON2.memorySize,
    hashLength: ARGON2.hashLength,
    outputType: "binary",
  });

  // HKDF splits the master key into two independent values via distinct labels;
  // it's one-way, so `authCredential` reveals nothing about the encryption key.
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(masterKey),
    "HKDF",
    false,
    ["deriveKey", "deriveBits"],
  );

  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: HKDF_HASH,
      salt: new Uint8Array(),
      info: encodeUtf8("memonote-enc"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    // Extractable so the Cipher can be cached in sessionStorage and survive a
    // page reload (see crypto/session).
    true,
    ["encrypt", "decrypt"],
  );

  const authBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: HKDF_HASH,
      salt: new Uint8Array(),
      info: encodeUtf8("memonote-auth"),
    },
    hkdfKey,
    256,
  );

  return {
    cipher: new Cipher(encryptionKey),
    authCredential: toBase64(new Uint8Array(authBits)),
  };
}

// Salts need only be unique per account, not secret; deriving from the email
// avoids a server round-trip and any "is this email registered?" lookup.
async function saltFromEmail(email: string): Promise<Uint8Array<ArrayBuffer>> {
  const namespaced = "memonote:" + email.trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", encodeUtf8(namespaced));
  return new Uint8Array(digest);
}

function encodeUtf8(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}
