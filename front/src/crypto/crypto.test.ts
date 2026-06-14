import { describe, it, expect } from 'vitest'
import { deriveKeys } from './keys'
import { Cipher, fromBase64, toBase64 } from './cipher'

describe('base64', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 254, 255])
    expect(Array.from(fromBase64(toBase64(bytes)))).toEqual(Array.from(bytes))
  })
})

describe('deriveKeys', () => {
  it('is deterministic, and normalises the email before salting', async () => {
    const a = await deriveKeys('User@Example.com ', 'correct horse battery staple')
    const b = await deriveKeys('user@example.com', 'correct horse battery staple')
    expect(a.authCredential).toBe(b.authCredential)
  })

  it('produces different credentials for different passwords', async () => {
    const a = await deriveKeys('user@example.com', 'password-one')
    const b = await deriveKeys('user@example.com', 'password-two')
    expect(a.authCredential).not.toBe(b.authCredential)
  })

  it('derives a working encryption key, distinct from the auth credential', async () => {
    const { cipher, authCredential } = await deriveKeys('user@example.com', 'pw')
    const secret = 'the mitochondria is the powerhouse of the cell'
    const blob = await cipher.encrypt(secret)
    expect(blob).not.toContain('mitochondria') // ciphertext doesn't leak plaintext
    expect(blob).not.toBe(authCredential) // independent branches of the master key
    expect(await cipher.decrypt(blob)).toBe(secret)
  })
})

describe('Cipher', () => {
  async function makeCipher(): Promise<Cipher> {
    const { cipher } = await deriveKeys('cipher@example.com', 'pw')
    return cipher
  }

  it('round-trips a Unicode string', async () => {
    const cipher = await makeCipher()
    const text = 'Q: 2 + 2?\nA: 4 — Unicode ✓ 日本語'
    expect(await cipher.decrypt(await cipher.encrypt(text))).toBe(text)
  })

  it('uses a fresh IV, so the same plaintext encrypts differently each time', async () => {
    const cipher = await makeCipher()
    expect(await cipher.encrypt('same')).not.toBe(await cipher.encrypt('same'))
  })

  it('rejects tampered ciphertext', async () => {
    const cipher = await makeCipher()
    const bytes = fromBase64(await cipher.encrypt('secret'))
    bytes[bytes.length - 1] ^= 0xff // corrupt the GCM auth tag
    await expect(cipher.decrypt(toBase64(bytes))).rejects.toBeTruthy()
  })
})
