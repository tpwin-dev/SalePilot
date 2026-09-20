const ITERATIONS = 210_000

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    256,
  )
  return toBase64(new Uint8Array(bits))
}

export async function createPasswordHash(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { hash: await derive(password, salt), salt: toBase64(salt) }
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
): Promise<boolean> {
  return (await derive(password, fromBase64(salt))) === expectedHash
}
