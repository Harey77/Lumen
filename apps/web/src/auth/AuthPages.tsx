import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Redirect, useLocation, useSearch } from 'wouter'
import { Icon } from '../components/Icon'
import { usePageTitle } from '../routes/usePageTitle'
import { authConfigProblem, authConfigured, friendlyAuthError, sendReset, signIn, signOut, signUp, updatePassword, useAuth, validateEmail, validatePassword } from './auth'

function PasswordField({ id, label, value, onChange, error, autoComplete, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string | null; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const toggle = () => {
    // Keep the caret where it was when switching between hidden and visible.
    const el = input.current
    const pos = el?.selectionStart ?? null
    setShow((s) => !s)
    requestAnimationFrame(() => {
      el?.focus()
      if (pos !== null) el?.setSelectionRange(pos, pos)
    })
  }
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password">
        <input ref={input} id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={describedBy} />
        <button type="button" className="password__toggle" onClick={toggle} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field__help">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

function EmailField({ id, value, onChange, error }: { id: string; value: string; onChange: (v: string) => void; error?: string | null }) {
  return (
    <div className="field">
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" inputMode="email" autoComplete="email" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
      {error && (
        <p id={`${id}-err`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  usePageTitle(title)
  return (
    <div className="page auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="display display--small">
          {title}
        </h1>
        <p className="muted">{lead}</p>
        {!authConfigured && (
          <div className="notice" role="status">
            <strong>Sign-in is unavailable.</strong> {authConfigProblem} Until then, Lumen works without an account and keeps progress in this browser.
          </div>
        )}
        {children}
      </section>
    </div>
  )
}

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/my-learning')

export function LoginPage() {
  const id = useId()
  const [, navigate] = useLocation()
  const next = safeNext(new URLSearchParams(useSearch()).get('next'))
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({})
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'error'; text: string }>({ kind: 'idle', text: '' })
  if (user) return <Redirect to={next} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.kind === 'busy') return
    const errs = { email: validateEmail(email), password: password ? null : 'Enter your password.' }
    setErrors(errs)
    if (errs.email || errs.password) return setStatus({ kind: 'error', text: 'Fix the highlighted fields.' })
    setStatus({ kind: 'busy', text: 'Logging in…' })
    try {
      await signIn(email.trim(), password)
      navigate(next)
    } catch (err) {
      setStatus({ kind: 'error', text: friendlyAuthError(err) })
    }
  }

  return (
    <Shell title="Log in" lead="Log in to keep your learning tied to your account.">
      <form className="form" onSubmit={submit} noValidate aria-busy={status.kind === 'busy'}>
        <EmailField id={`${id}-email`} value={email} onChange={setEmail} error={errors.email} />
        <PasswordField id={`${id}-pw`} label="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        <button type="submit" className="btn btn--accent" disabled={!authConfigured || status.kind === 'busy'}>
          {status.kind === 'busy' ? 'Logging in…' : 'Log in'}
        </button>
        <p className={`form__status form__status--${status.kind === 'error' ? 'invalid' : 'idle'}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      </form>
      <p>
        <Link href="/forgot-password">Forgot your password?</Link> · New to Lumen? <Link href="/signup">Create an account</Link>
      </p>
    </Shell>
  )
}

export function SignupPage() {
  const id = useId()
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null; confirm?: string | null }>({})
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'error' | 'sent'; text: string }>({ kind: 'idle', text: '' })
  if (user) return <Redirect to="/my-learning" />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.kind === 'busy') return
    const errs = { email: validateEmail(email), password: validatePassword(password), confirm: confirm === password ? null : 'The passwords do not match.' }
    setErrors(errs)
    if (errs.email || errs.password || errs.confirm) return setStatus({ kind: 'error', text: 'Fix the highlighted fields.' })
    setStatus({ kind: 'busy', text: 'Creating your account…' })
    try {
      const { needsConfirmation } = await signUp(email.trim(), password)
      if (needsConfirmation) {
        setPassword('')
        setConfirm('')
        setStatus({ kind: 'sent', text: `Account created. We sent a confirmation link to ${email.trim()}. Open it, then log in.` })
      } else navigate('/my-learning')
    } catch (err) {
      setStatus({ kind: 'error', text: friendlyAuthError(err) })
    }
  }

  return (
    <Shell title="Sign up" lead="Create a free account. You can keep learning without one.">
      <form className="form" onSubmit={submit} noValidate aria-busy={status.kind === 'busy'}>
        <EmailField id={`${id}-email`} value={email} onChange={setEmail} error={errors.email} />
        <PasswordField id={`${id}-pw`} label="Password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" hint="At least 8 characters, with a letter and a number." />
        <PasswordField id={`${id}-pw2`} label="Confirm password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <button type="submit" className="btn btn--accent" disabled={!authConfigured || status.kind === 'busy'}>
          {status.kind === 'busy' ? 'Creating account…' : 'Create account'}
        </button>
        <p className={`form__status form__status--${status.kind === 'error' ? 'invalid' : status.kind === 'sent' ? 'saved' : 'idle'}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      </form>
      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </Shell>
  )
}

export function ForgotPasswordPage() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'error' | 'sent'; text: string }>({ kind: 'idle', text: '' })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (err) return
    setStatus({ kind: 'busy', text: 'Sending…' })
    try {
      await sendReset(email.trim())
      setStatus({ kind: 'sent', text: `If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox.` })
    } catch (e2) {
      setStatus({ kind: 'error', text: friendlyAuthError(e2) })
    }
  }
  return (
    <Shell title="Reset password" lead="We will email you a link to choose a new password.">
      <form className="form" onSubmit={submit} noValidate>
        <EmailField id={`${id}-email`} value={email} onChange={setEmail} error={error} />
        <button type="submit" className="btn btn--accent" disabled={!authConfigured || status.kind === 'busy'}>
          {status.kind === 'busy' ? 'Sending…' : 'Send reset link'}
        </button>
        <p className={`form__status form__status--${status.kind === 'error' ? 'invalid' : status.kind === 'sent' ? 'saved' : 'idle'}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      </form>
      <p>
        <Link href="/login">Back to log in</Link>
      </p>
    </Shell>
  )
}

export function ResetPasswordPage() {
  const id = useId()
  const [, navigate] = useLocation()
  const { session, recovery } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'error'; text: string }>({ kind: 'idle', text: '' })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validatePassword(password)
    setError(err)
    if (err) return
    setStatus({ kind: 'busy', text: 'Saving…' })
    try {
      await updatePassword(password)
      navigate('/my-learning')
    } catch (e2) {
      setStatus({ kind: 'error', text: friendlyAuthError(e2) })
    }
  }
  return (
    <Shell title="Choose a new password" lead="Open this page from the link in your reset email.">
      {authConfigured && !session && !recovery ? (
        <p className="notice">This page needs the link from your reset email. <Link href="/forgot-password">Request a new link</Link>.</p>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <PasswordField id={`${id}-pw`} label="New password" value={password} onChange={setPassword} error={error} autoComplete="new-password" hint="At least 8 characters, with a letter and a number." />
          <button type="submit" className="btn btn--accent" disabled={!authConfigured || status.kind === 'busy'}>
            Save new password
          </button>
          <p className={`form__status form__status--${status.kind === 'error' ? 'invalid' : 'idle'}`} role={status.kind === 'error' ? 'alert' : 'status'}>
            {status.text}
          </p>
        </form>
      )}
    </Shell>
  )
}

/**
 * Guards learner-specific pages. With accounts configured, signed-out visitors go to log in.
 * Without configuration there is no account to require, so the page works locally and says so.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [path] = useLocation()
  if (!authConfigured) return <>{children}</>
  if (loading) return <p className="page muted" role="status">Checking your sign-in…</p>
  if (!user) return <Redirect to={`/login?next=${encodeURIComponent(path)}`} />
  return <>{children}</>
}

export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!user)
    return (
      <Link href="/login" className="btn btn--small account-link" onClick={onNavigate}>
        <Icon name="next" size={14} />
        Log in
      </Link>
    )
  return (
    <span className="account">
      <span className="account__who" title={user.email ?? ''}>
        {user.email}
      </span>
      <button
        type="button"
        className="btn btn--small btn--quiet"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await signOut()
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Logging out…' : 'Log out'}
      </button>
    </span>
  )
}
