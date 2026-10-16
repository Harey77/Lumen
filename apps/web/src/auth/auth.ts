import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

/**
 * Supabase Auth. Configured only by public build-time values:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (the anon / publishable key, safe in the browser, protected by RLS).
 * Passwords go straight to Supabase over HTTPS; Lumen never stores them. The session is persisted and
 * refreshed by supabase-js itself.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Refuse a service-role key: it bypasses row-level security and must never ship to a browser. */
export function isServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true
  try {
    const payload = JSON.parse(atob(key.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

const unsafeKey = !!KEY && isServiceRoleKey(KEY)
export const authConfigured = !!URL_ && !!KEY && !unsafeKey
export const authConfigProblem = unsafeKey
  ? 'VITE_SUPABASE_ANON_KEY is a service-role key. Replace it with the anon (publishable) key; the service-role key must never be used in the browser.'
  : !URL_ || !KEY
    ? 'Accounts are not set up on this server. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/web/.env and rebuild.'
    : null

const client: SupabaseClient | null = authConfigured ? createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

interface AuthState {
  loading: boolean
  user: User | null
  session: Session | null
  recovery: boolean
}
let state: AuthState = { loading: authConfigured, user: null, session: null, recovery: false }
const listeners = new Set<() => void>()
const set = (s: Partial<AuthState>) => {
  state = { ...state, ...s }
  listeners.forEach((l) => l())
}

if (client) {
  client.auth.getSession().then(({ data }) => set({ loading: false, session: data.session, user: data.session?.user ?? null }))
  client.auth.onAuthStateChange((event, session) => set({ loading: false, session, user: session?.user ?? null, recovery: event === 'PASSWORD_RECOVERY' ? true : state.recovery }))
}

export function useAuth() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

/** Turns provider errors into messages a learner can act on. */
export function friendlyAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/invalid login credentials/i.test(msg)) return 'That email and password do not match an account. Check them, or reset your password.'
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first: open the link we sent you, then log in.'
  if (/already registered|already exists/i.test(msg)) return 'An account with this email already exists. Log in instead.'
  if (/password should be|weak password|at least/i.test(msg)) return `The password was rejected: ${msg}`
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a minute and try again.'
  if (/fetch|network|failed to fetch/i.test(msg)) return navigator.onLine ? 'Could not reach the sign-in service. Try again.' : 'You are offline. Connect to the internet to sign in.'
  return msg || 'Something went wrong. Try again.'
}

const need = () => {
  if (!client) throw new Error(authConfigProblem ?? 'Accounts are not set up.')
  return client
}

export async function signIn(email: string, password: string) {
  const { error } = await need().auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Returns whether the account still needs email confirmation. */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await need().auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/login` } })
  if (error) throw error
  return { needsConfirmation: !data.session }
}

export async function sendReset(email: string) {
  const { error } = await need().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await need().auth.updateUser({ password })
  if (error) throw error
  set({ recovery: false })
}

export async function signOut() {
  const { error } = await need().auth.signOut()
  if (error) throw error
}

export function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'Enter a valid email address, such as name@example.com.'
}
export function validatePassword(v: string) {
  if (v.length < 8) return 'Use at least 8 characters.'
  if (!/[a-zA-Z]/.test(v) || !/\d/.test(v)) return 'Use at least one letter and one number.'
  return null
}
