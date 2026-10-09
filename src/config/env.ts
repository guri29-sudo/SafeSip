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

const DEFAULT_SUPABASE_URL = 'https://nbakrwwnupvfrbsvbalv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYWtyd3dudXB2ZnJic3ZiYWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MTY3MTksImV4cCI6MjEwNzA5MjcxOX0.kWbo14REUSQmnBwCmRelLzX3Hk89txiD0LN4wBX-jvM';

export const SUPABASE_URL: string =
  localEnv.SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string =
  localEnv.SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;
