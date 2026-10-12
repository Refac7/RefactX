async function handleImageUpload(file) {
  try {
    const MAX_SIZE = 1024 * 1024
    let fileToUpload = file.size > MAX_SIZE ? await compressImage(file, MAX_SIZE) : file
    const formData = new FormData()
    formData.append('file', fileToUpload)

    const response = await fetch(window.__walineImgBedUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${window.__walineUploadToken}` },
      body: formData,
    })
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
    return (await response.json()).url
  } catch (error) {
    console.error('[Waline] Upload error:', error)
    alert('Upload Failed. Check console.')
    throw error
  }
}

function compressImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > 1920 || height > 1920) {
          const ratio = Math.min(1920 / width, 1920 / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        let quality = 0.8
        const attempt = () =>
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Canvas error'))
              if (blob.size <= maxSize || quality <= 0.2) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }))
              } else {
                quality -= 0.15
                attempt()
              }
            },
            'image/jpeg',
            quality
          )
        attempt()
      }
      img.onerror = () => reject(new Error('Image load failed'))
    }
    reader.onerror = () => reject(new Error('File read failed'))
  })
}

/* ------------------------------------------------------------------ *
 * PoW 人机验证
 * 通过拦截 Waline 提交评论的 fetch 请求，在每次发表评论前强制完成一次
 * 本站 PoW 挑战，实现「每次发评论都需验证」。
 * ------------------------------------------------------------------ */
function injectPowStyle() {
  if (document.getElementById('pow-captcha-style')) return
  const style = document.createElement('style')
  style.id = 'pow-captcha-style'
  style.textContent = `
    .pow-verify{display:inline-flex;align-items:center;gap:.55rem;margin:0 auto;padding:.5rem .8rem;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;user-select:none;font-size:.8125rem;line-height:1;color:#4b5563;transition:border-color .2s,background .2s;}
    .pow-verify:hover{border-color:#9ca3af;}
    .pow-verify[data-state="success"]{border-color:#10b981;color:#10b981;cursor:default;}
    .pow-verify[data-state="error"]{border-color:#ef4444;color:#ef4444;}
    .pow-verify__icon{display:inline-flex;width:18px;height:18px;}
    .pow-verify__icon svg{width:18px;height:18px;display:block;}
    .pow-verify__spin{animation:powSpin .8s linear infinite;}
    @keyframes powSpin{to{transform:rotate(360deg)}}
    .pow-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(17,24,39,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
    .pow-modal__panel{width:100%;max-width:24rem;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1.5rem;box-shadow:0 20px 60px -20px rgba(0,0,0,.5);text-align:center;}
    .pow-modal__title{margin:0 0 .35rem;font-size:1rem;font-weight:700;color:#111827;}
    .pow-modal__desc{margin:0 0 1.1rem;font-size:.8125rem;line-height:1.6;color:#6b7280;}
    .pow-modal__cancel{margin-top:.9rem;background:none;border:none;color:#9ca3af;font-size:.75rem;cursor:pointer;}
    .pow-modal__cancel:hover{color:#6b7280;}
    html.dark .pow-verify{border-color:#374151;color:#d1d5db;}
    html.dark .pow-modal__panel{background:#171a1f;border-color:#2a2f37;}
    html.dark .pow-modal__title{color:#e5e7eb;}
    html.dark .pow-modal__desc{color:#9ca3af;}
  `
  document.head.appendChild(style)
}

const POW_ICONS = {
  idle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"/></svg>',
  loading:
    '<svg class="pow-verify__spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="9" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 16.2-3.5-3.5L4 14.2 9 19 20 8l-1.4-1.4z"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z"/></svg>',
}

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function computePoW(challenge, difficulty) {
  const prefix = '0'.repeat(difficulty)
  let nonce = 0
  while (true) {
    if ((await sha256Hex(`${challenge}:${nonce}`)).startsWith(prefix)) return nonce
    nonce++
    if (nonce % 5000 === 0) await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

function createPowWidget(container, onSolved) {
  injectPowStyle()
  container.innerHTML = ''

  const box = document.createElement('div')
  box.className = 'pow-verify'
  box.setAttribute('role', 'button')
  box.tabIndex = 0

  const icon = document.createElement('span')
  icon.className = 'pow-verify__icon'
  const text = document.createElement('span')

  const setState = (state, label) => {
    box.dataset.state = state
    icon.innerHTML = POW_ICONS[state]
    text.textContent = label
  }
  setState('idle', 'Verify you are human')

  const verify = async () => {
    if (box.dataset.busy === '1' || box.dataset.state === 'success') return
    box.dataset.busy = '1'
    setState('loading', 'Securing connection...')
    try {
      const challengeRes = await fetch('/api/captcha', { method: 'POST' })
      const { challenge, difficulty } = await challengeRes.json()
      const nonce = await computePoW(challenge, difficulty)
      const verifyRes = await fetch('/api/captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, nonce }),
      })
      if (!verifyRes.ok) throw new Error('PoW rejected')
      const { token } = await verifyRes.json()
      setState('success', 'Verification complete')
      onSolved(token)
    } catch (e) {
      setState('error', 'Verification failed, retry')
      box.dataset.busy = '0'
    }
  }

  box.addEventListener('click', verify)
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      verify()
    }
  })

  box.appendChild(icon)
  box.appendChild(text)
  container.appendChild(box)
}

let powModalCleanup = null

function openPowModal() {
  return new Promise((resolve) => {
    injectPowStyle()

    const overlay = document.createElement('div')
    overlay.className = 'pow-modal'

    const panel = document.createElement('div')
    panel.className = 'pow-modal__panel'

    const title = document.createElement('h3')
    title.className = 'pow-modal__title'
    title.textContent = '人机验证'

    const desc = document.createElement('p')
    desc.className = 'pow-modal__desc'
    desc.textContent = '发表评论前请完成一次验证，验证通过后评论将自动提交。'

    const widgetBox = document.createElement('div')

    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.className = 'pow-modal__cancel'
    cancel.textContent = '取消'

    const close = () => {
      overlay.remove()
      powModalCleanup = null
    }

    cancel.addEventListener('click', () => {
      close()
      resolve(null)
    })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close()
        resolve(null)
      }
    })

    createPowWidget(widgetBox, (token) => {
      setTimeout(close, 400)
      resolve(token)
    })

    panel.appendChild(title)
    panel.appendChild(desc)
    panel.appendChild(widgetBox)
    panel.appendChild(cancel)
    overlay.appendChild(panel)
    document.body.appendChild(overlay)

    powModalCleanup = () => {
      close()
      resolve(null)
    }
  })
}

function installCommentPowGuard() {
  if (window.__refactxPowGuard) return
  window.__refactxPowGuard = true

  const nativeFetch = window.fetch.bind(window)

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    const method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase()

    // 仅拦截「发表新评论」的请求，忽略编辑/删除等操作
    let isNewComment = false
    if (method === 'POST' && /\/comment(\?|$)|\/comment\/?$/.test(url)) {
      isNewComment = true
      try {
        const payload = init && typeof init.body === 'string' ? JSON.parse(init.body) : null
        if (payload && payload.objectId) isNewComment = false
      } catch (e) {}
    }

    if (isNewComment) {
      const token = await openPowModal()
      if (!token) throw new Error('已取消人机验证，评论未提交')
    }

    return nativeFetch(input, init)
  }
}

function initWaline() {
  const container = document.querySelector('#waline-container')
  if (!container || window.__walineInstance) return

  container.innerHTML = ''
  const walineEl = document.createElement('div')
  walineEl.id = 'waline'
  container.appendChild(walineEl)

  const useCaptcha = Boolean(window.__walineEnableCaptcha)
  if (useCaptcha) installCommentPowGuard()

  try {
    window.__walineInstance = window.Waline.init({
      el: walineEl,
      serverURL: window.__walineServerUrl,
      lang: 'zh',
      dark: 'html.dark',
      emoji: false,
      search: false,
      imageUploader: window.__walineEnableImgUpload ? handleImageUpload : null,
      locale: { placeholder: 'Write a comment...' },
    })
  } catch (e) {
    console.error('[Waline Init Error]:', e)
  }
}

function setupObserver() {
  const container = document.querySelector('#waline-container')
  if (!container) return
  if (window.__walineObserver) window.__walineObserver.disconnect()

  window.__walineObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        const check = setInterval(() => {
          if (window.Waline) {
            clearInterval(check)
            initWaline()
          }
        }, 100)
        window.__walineObserver.disconnect()
      }
    },
    { rootMargin: '200px' }
  )

  window.__walineObserver.observe(container)
}

setupObserver()
document.addEventListener('astro:page-load', () => setTimeout(setupObserver, 0))
document.addEventListener('astro:before-swap', () => {
  if (window.__walineObserver) window.__walineObserver.disconnect()
  if (powModalCleanup) powModalCleanup()
  if (window.__walineInstance) {
    try {
      window.__walineInstance.destroy()
    } catch (e) {}
  }
  window.__walineInstance = null
})
