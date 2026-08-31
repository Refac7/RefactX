import { useState } from 'react'
import { cn } from '~/lib/utils'

interface CaptchaProps {
  onVerify: (token: string) => void
  className?: string
}

// 纯前端计算 SHA-256 寻找符合条件的 nonce
const solvePoW = async (challenge: string, difficulty: number): Promise<number> => {
  let nonce = 0
  const targetPrefix = '0'.repeat(difficulty)
  const encoder = new TextEncoder()

  while (true) {
    const data = encoder.encode(`${challenge}:${nonce}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    if (hashHex.startsWith(targetPrefix)) return nonce
    nonce++

    // 每计算 5000 次让出一下主线程，防止浏览器界面卡死
    if (nonce % 5000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
}

const Captcha = ({ onVerify, className }: CaptchaProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'computing' | 'success' | 'error'>('idle')

  const handleVerify = async () => {
    if (status !== 'idle' && status !== 'error') return
    setStatus('loading')

    try {
      // 1. 获取挑战
      const req1 = await fetch('/api/captcha', { method: 'POST' })
      const { challenge, difficulty } = await req1.json()

      // 2. 本地大量计算 (PoW)
      setStatus('computing')
      const nonce = await solvePoW(challenge, difficulty)

      // 3. 提交答案，获取 Token
      const req2 = await fetch('/api/captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, nonce }),
      })

      if (!req2.ok) throw new Error()
      const { token } = await req2.json()

      setStatus('success')
      onVerify(token)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      onClick={handleVerify}
      className={cn(
        'flex items-center gap-3 p-2 px-3 border border-border/60 bg-background/50 cursor-pointer select-none transition-all',
        status === 'idle' ? 'hover:border-primary/40 hover:bg-muted/30' : 'cursor-default',
        status === 'error' && 'border-red-500/50 bg-red-500/5',
        className
      )}
    >
      <div className="flex items-center justify-center size-5">
        {status === 'idle' && <span className="icon-[ph--square] size-5 text-muted-foreground/60"></span>}
        {(status === 'loading' || status === 'computing') && (
          <span className="icon-[ph--spinner-gap] size-5 text-primary animate-spin"></span>
        )}
        {status === 'success' && <span className="icon-[ph--check-circle-fill] size-5 text-green-500 animate-in zoom-in-50"></span>}
        {status === 'error' && <span className="icon-[ph--warning-circle-fill] size-5 text-red-500"></span>}
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {status === 'idle'
          ? 'Verify you are human'
          : status === 'loading'
            ? 'Connecting to edge...'
            : status === 'computing'
              ? 'Securing connection...' // 增加一个计算中的文案
              : status === 'success'
                ? 'Verification complete'
                : 'Verification failed, retry'}
      </span>
    </div>
  )
}

export default Captcha
