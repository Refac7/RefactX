import { useState } from 'react'
import { cn } from '~/lib/utils'
import { SECTION_HEADER_CLASS, SECTION_TITLE_CLASS, SECTION_NUM_CLASS, SECTION_META_CLASS } from '~/lib/ui'
import { useAdmin } from './AdminContext'
import Captcha from '~/components/ui/Captcha'

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
    <div className="flex-1 flex flex-col justify-center w-full px-6 lg:px-8 xl:px-12 lg:py-20">
      <div className="w-full max-w-md mx-auto">
        {/* Section header in site style */}
        <div className={SECTION_HEADER_CLASS}>
          <div className="flex items-center">
            <span className={SECTION_NUM_CLASS}>01</span>
            <h2 className={SECTION_TITLE_CLASS}>Authenticate</h2>
          </div>
          <span className={SECTION_META_CLASS}>// 管理员登录</span>
        </div>

        {/* Login card */}
        <div className="bg-background/70 border border-primary/15 rounded-3xl overflow-hidden mb-6 relative">
          {/* Card header */}
          <div className="relative px-6 sm:px-8 pt-8 pb-6 bg-gradient-to-br from-primary/15 via-accent to-primary/5 border-b border-primary/15">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <span className="icon-[ph--lock-key-bold] size-6" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">欢迎回来 🐾</h3>
            <p className="text-xs text-muted-foreground mt-1">登录 RefactX CMS 管理面板，继续发布你的创作吧～</p>
          </div>

          {/* Card body */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-primary/70 ml-1">用户名</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 icon-[ph--user] size-4" />
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
                    'w-full pl-9 pr-4 py-2.5 rounded-2xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                    loginError
                      ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                      : 'border-primary/25 focus:border-primary/50 focus:ring-primary/20'
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-primary/70 ml-1">密码</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 icon-[ph--key] size-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isValidating}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full pl-9 pr-10 py-2.5 rounded-2xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
                    loginError
                      ? 'border-red-500/50 focus:ring-red-500/20 text-red-500'
                      : 'border-primary/25 focus:border-primary/50 focus:ring-primary/20'
                  )}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground/60 hover:text-primary transition-colors"
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
                'w-full py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                canSubmit && !loginError
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-accent text-muted-foreground border border-primary/20 cursor-not-allowed'
              )}
            >
              {isValidating ? (
                <>
                  <span className="icon-[ph--spinner] animate-spin size-4" /> 验证中…
                </>
              ) : (
                <>
                  进入面板 →
                  <span className="icon-[ph--arrow-right] size-4" />
                </>
              )}
            </button>

            <div className="h-4 flex items-center justify-center">
              {loginError && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                  <span className="icon-[ph--warning-circle] size-3.5" />
                  账号或密码错误，再试一次喵～
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
