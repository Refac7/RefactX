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

function initWaline() {
  const container = document.querySelector('#waline-container')
  if (!container || window.__walineInstance) return

  container.innerHTML = ''
  const walineEl = document.createElement('div')
  walineEl.id = 'waline'
  container.appendChild(walineEl)

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
  if (window.__walineInstance) {
    try {
      window.__walineInstance.destroy()
    } catch (e) {}
  }
  window.__walineInstance = null
})
