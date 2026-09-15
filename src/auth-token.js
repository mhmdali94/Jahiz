// Shared by both sides of the access-control system: cli/serial.js (Node)
// imports this to CREATE tokens, src/auth.js (browser) imports the exact
// same code to VERIFY them — one implementation, so signer and verifier can
// never quietly drift apart. Works unmodified in both environments: it only
// uses @noble/ed25519, Web Crypto (`crypto.subtle`, `crypto.getRandomValues`
// — both global in Node 20+ and in every evergreen browser) and
// TextEncoder/atob/btoa, nothing environment-specific.

import * as ed from '@noble/ed25519';

function base64urlEncode(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * @param {{ id: string, client: string, clientAr: string, type: string|null }} payload
 * @param {string} privateKeyHex
 * @returns {Promise<string>} `<payload>.<signature>`, both base64url
 */
export async function createToken(payload, privateKeyHex) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await ed.signAsync(payloadBytes, privateKeyHex);
  return `${base64urlEncode(payloadBytes)}.${base64urlEncode(signature)}`;
}

/**
 * Verifies a token's signature only — no revocation check, that's a
 * property of a specific deployment's bundled revoked.json, so it belongs
 * in src/auth.js, not here.
 * @returns {Promise<{ valid: true, data: object } | { valid: false, reason: string }>}
 */
export async function verifyToken(tokenString, publicKeyHex) {
  const [payloadPart, sigPart] = (tokenString || '').split('.');
  if (!payloadPart || !sigPart) return { valid: false, reason: 'malformed' };
  try {
    const payloadBytes = base64urlDecode(payloadPart);
    const signature = base64urlDecode(sigPart);
    const ok = await ed.verifyAsync(signature, payloadBytes, publicKeyHex);
    if (!ok) return { valid: false, reason: 'bad_signature' };
    return { valid: true, data: JSON.parse(new TextDecoder().decode(payloadBytes)) };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Excludes 0/O/1/I/L — easy to misread out loud over the phone or WhatsApp.
const SHORT_CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** `K7QP-3M2A-XR9T` — 12 chars in groups of 4. */
export function generateShortCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => SHORT_CODE_CHARSET[b % SHORT_CODE_CHARSET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function normalizeShortCode(code) {
  return (code || '').replace(/[\s-]/g, '').toUpperCase();
}

export function generateKeyPairHex() {
  const privateKey = ed.utils.randomPrivateKey();
  return ed.getPublicKeyAsync(privateKey).then((publicKey) => ({
    privateKeyHex: ed.etc.bytesToHex(privateKey),
    publicKeyHex: ed.etc.bytesToHex(publicKey),
  }));
}

export function randomId(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}
