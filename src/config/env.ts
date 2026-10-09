/**
 * Application environment configuration.
 *
 * Sensitive credentials are kept out of version control:
 * - Local development: loaded from git-ignored `src/config/env.local.ts` or `.env`
 * - CI / GitHub Actions: injected during workflow execution via GitHub Secrets
 */

declare const process: any;

let localEnv: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string } = {};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localEnv = require('./env.local').ENV || {};
} catch {
  // env.local is git-ignored and optional in repo
}

export const SUPABASE_URL: string =
  localEnv.SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

export const SUPABASE_ANON_KEY: string =
  localEnv.SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';
