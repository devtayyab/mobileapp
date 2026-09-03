/**
 * Shared search constants in a plain module.
 *
 * Not exported from SearchBox.tsx: that file is `'use client'`, and a
 * non-component export imported from a client module into a Server Component
 * arrives as a client *reference* rather than the value — so the server's
 * `query.length < MIN_QUERY` guard silently compared against an object.
 */
export const MIN_QUERY = 2;
