// App-side gate. Deliberately simple per the spec: this is a speed bump,
// not real security — a static site with no server can't do better, and
// there's nothing on the other side worth protecting beyond "don't let
// search engines/randoms stumble into someone else's onboarding form."
// No expiry, no usage counters, no key rotation — just signature + a
// revocation list that only takes effect on the next deploy.

import { verifyToken, sha256Hex, normalizeShortCode } from './auth-token.js';
import { PUBLIC_KEY_HEX } from './auth-public-key.js';
import revokedIds from './revoked.json';
import shortCodeIndex from './shortcodes.json';

const SESSION_KEY = 'jahiz:auth-token';

function isRevoked(id) {
  return Array.isArray(revokedIds) && revokedIds.includes(id);
}

/** Verifies a token string's signature AND checks it hasn't been revoked in *this* build. */
export async function verifyTokenString(tokenString) {
  if (!PUBLIC_KEY_HEX) return { valid: false, reason: 'not_configured' };
  const result = await verifyToken(tokenString, PUBLIC_KEY_HEX);
  if (!result.valid) return result;
  if (isRevoked(result.data.id)) return { valid: false, reason: 'revoked' };
  return result;
}

export function getHashToken() {
  const match = location.hash.match(/[#&]t=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function saveSessionAuth(tokenString) {
  try {
    sessionStorage.setItem(SESSION_KEY, tokenString);
  } catch {
    /* private mode etc — the client just re-verifies from the URL hash on next load instead */
  }
}

function loadSessionAuth() {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function clearSessionAuth() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Resolves access for this page load: a token in the URL hash wins over a
 * previously-saved session (so a fresh link always takes effect), falling
 * back to a saved session so a refresh mid-form doesn't kick the client
 * out. Revocation is re-checked every time, including from a saved
 * session — a redeploy with an updated revoked.json must take effect
 * immediately, not just for links opened fresh.
 */
export async function authenticate() {
  const tokenString = getHashToken() || loadSessionAuth();
  if (!tokenString) return { valid: false, reason: 'missing' };

  const result = await verifyTokenString(tokenString);
  if (result.valid) saveSessionAuth(tokenString);
  else clearSessionAuth();
  return result;
}

/**
 * Ends the current session so the next load shows the welcome screen again.
 * Clearing sessionStorage alone isn't enough for a client who arrived via a
 * long link (`#t=...` in the URL) — authenticate() checks the URL hash
 * *before* the saved session, so that link would just log them straight
 * back in on reload. Clearing the hash too closes that gap.
 */
export function logout() {
  clearSessionAuth();
  history.replaceState(null, '', location.pathname + location.search);
}

/** Resolves a short code the client typed, then runs it through the normal token path. */
export async function authenticateWithShortCode(code) {
  const hash = await sha256Hex(normalizeShortCode(code));
  const tokenString = shortCodeIndex[hash];
  if (!tokenString) return { valid: false, reason: 'unknown_code' };
  const result = await verifyTokenString(tokenString);
  if (result.valid) saveSessionAuth(tokenString);
  return result;
}
