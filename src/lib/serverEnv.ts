/**
 * Read a server-side environment variable at runtime.
 *
 * `import.meta.env` values are inlined by Vite at build time, which works for
 * local dev (`.env`) but is brittle on serverless runtimes where secrets are
 * only injected into `process.env` at runtime. This helper prefers the
 * build-time value and falls back to `process.env`.
 */
export function serverEnv(key: string): string | undefined {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key]
  if (fromMeta) return fromMeta
  if (typeof process !== 'undefined' && process.env) return process.env[key]
  return undefined
}
