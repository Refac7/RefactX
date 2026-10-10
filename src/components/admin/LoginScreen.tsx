import { useState } from 'react'
import { cn } from '~/lib/utils'
import { SECTION_HEADER_CLASS, SECTION_TITLE_CLASS, SECTION_NUM_CLASS, SECTION_META_CLASS } from '~/lib/ui'
import { useAdmin } from './AdminContext'
import Captcha from '~/components/ui/Captcha'

const ACCESS_SPEC = [
  { label: 'Access Level', value: 'Administrator' },
  { label: 'Auth Method', value: 'bcrypt · PoW' },
  { label: 'Session', value: 'JWT · 2h' },
  { label: 'Scope', value: 'Posts · Data · Deploy' },
]

const SECURITY_NOTES = [
  { icon: 'icon-[ph--shield-check-fill]', tone: 'text-primary', text: '仅限授权管理员访问，请使用分配的凭据登录。' },
  { icon: 'icon-[ph--key-fill]', tone: 'text-primary', text: '登录状态以 JWT 保存，过期后需要重新验证。' },
  { icon: 'icon-[ph--warning-circle-fill]', tone: 'text-warning', text: '请勿在公共设备上保存凭据。' },
]

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = Boolean(captchaToken && username.trim() && password)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) {
      performLogin(username.trim(), password, captchaToken!)
    }
  }

  return (
    <div className="px-6 lg:px-8 xl:px-12 lg:py-20 flex-1 flex flex-col">
      <div className="fade-up">
        {/* Section header in site style */}
        <div className={SECTION_HEADER_CLASS}>
          <div className="flex items-center">
            <span className={SECTION_NUM_CLASS}>01</span>
            <h2 className={SECTION_TITLE_CLASS}>Authenticate</h2>
          </div>
          <span className={SECTION_META_CLASS}>// System_Login</span>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-10">
          {/* Access information */}
          <div className="flex flex-col">
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/50 p-6">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-10 select-none text-[7rem] font-black leading-none tracking-tighter text-foreground/[0.04]"
              >
                SEC
              </span>

              <div className="relative z-10 mb-6 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <span className="icon-[ph--lock-key-fill] size-6" />
                </span>
                <div>
                  <p className="text-sm font-bold tracking-tight text-foreground">Restricted Access</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">Authorized personnel only</p>
                </div>
              </div>

              <dl className="relative z-10 divide-y divide-border/40 border-y border-border/40">
                {ACCESS_SPEC.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{row.label}</dt>
                    <dd className="text-xs font-medium text-foreground/90">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {SECURITY_NOTES.map((note) => (
                <li key={note.icon} className="flex items-start gap-2.5">
                  <span className={cn('size-4 shrink-0 mt-0.5', note.tone, note.icon)} />
                  <span>{note.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Credentials form */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50">
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-5 py-4">
                <span className="text-sm font-semibold tracking-tight">Credentials</span>
                <span className="rounded-full border border-border/40 bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  JWT
                </span>
              </div>

              <div className="space-y-5 p-5">
                <div className="space-y-1.5">
                  <label className="ml-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Username</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 icon-[ph--user] size-4" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isValidating}
                      placeholder="admin"
                      autoFocus
                      autoComplete="username"
                      className={cn(
                        'w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                        loginError
                          ? 'border-danger/50 text-danger focus:ring-danger/20'
                          : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Passkey</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 icon-[ph--key] size-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isValidating}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        'w-full rounded-lg border bg-background py-2.5 pl-9 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                        loginError
                          ? 'border-danger/50 text-danger focus:ring-danger/20'
                          : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                      )}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className={cn('size-4', showPassword ? 'icon-[ph--eye-slash]' : 'icon-[ph--eye]')} />
                    </button>
                  </div>
                </div>

                <Captcha onVerify={setCaptchaToken} />

                <button
                  onClick={() => canSubmit && performLogin(username.trim(), password, captchaToken!)}
                  disabled={isValidating || !canSubmit}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                    canSubmit && !loginError
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'cursor-not-allowed border border-border/50 bg-muted text-muted-foreground'
                  )}
                >
                  {isValidating ? (
                    <>
                      <span className="icon-[ph--spinner] animate-spin size-4" /> Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <span className="icon-[ph--arrow-right] size-4" />
                    </>
                  )}
                </button>

                <div className="flex h-4 items-center justify-center">
                  {loginError && (
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-danger animate-in fade-in slide-in-from-bottom-2">
                      <span className="icon-[ph--warning-circle] size-3.5" />
                      Invalid credentials.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
              Protected by HMAC CAPTCHA · bcrypt
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
