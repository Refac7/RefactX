import { useState } from 'react'
import { cn } from '~/lib/utils'
import { useAdmin } from './AdminContext'
import Captcha from '~/components/ui/Captcha'

export default function LoginScreen() {
  const { performLogin, isValidating, loginError } = useAdmin()
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && captchaToken) {
      performLogin(password, captchaToken)
    }
  }

  return (
    <div className="relative min-h-[80vh] flex flex-col p-6 lg:p-12 font-sans overflow-hidden">
      <div className="absolute top-6 left-6 lg:top-12 lg:left-12 flex items-center gap-2 select-none">
        <span className={cn('size-2 rounded-full', loginError ? 'bg-red-500 animate-pulse' : 'bg-primary')}></span>
        <span className="text-xs font-medium text-foreground tracking-tight">RefactX Admin</span>
      </div>

      <div className="absolute top-6 right-6 lg:top-12 lg:right-12 select-none">
        <span className="text-xs font-medium text-muted-foreground">Restricted Access</span>
      </div>

      <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-12 select-none hidden sm:block">
        <span className="text-xs font-medium text-muted-foreground/50">Terminal ID: AX-01</span>
      </div>

      <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 select-none">
        <span className="text-xs font-medium text-muted-foreground/50">&copy; {new Date().getFullYear()}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        <div className="w-full max-w-[340px] bg-background rounded-lg border border-border/40 p-8 sm:p-10 relative">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Authenticate</h1>
            <p className="text-sm text-muted-foreground">Sign in to the CMS dashboard.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground ml-1">Passkey</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isValidating}
                placeholder="••••••••"
                autoFocus
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                  loginError
                    ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                    : 'border-border/60 focus:border-primary/50 focus:ring-primary/20'
                )}
              />
            </div>

            <Captcha onVerify={setCaptchaToken} />

            <button
              onClick={() => captchaToken && performLogin(password, captchaToken)}
              disabled={isValidating || !captchaToken}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                !captchaToken || loginError
                  ? 'bg-muted text-muted-foreground border border-border/50 cursor-not-allowed'
                  : 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
              )}
            >
              {isValidating ? (
                <>
                  <span className="icon-[ph--spinner] animate-spin size-4"></span> Verifying...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>

          <div className="mt-6 h-4 flex items-center justify-center">
            {loginError && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                <span className="icon-[ph--warning-circle] size-3.5"></span>
                Invalid credentials.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
