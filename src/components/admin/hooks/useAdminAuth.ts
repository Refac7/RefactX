import { useState, useEffect, useCallback } from 'react'
import type { ToastType } from './useAdminToast'

export function useAdminAuth(showToast: (msg: string, type?: ToastType) => void) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [loginError, setLoginError] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('admin_jwt_token')
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }, [])

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const isTokenValid = (token: string) => {
    const payload = decodeToken(token)
    if (!payload) return false
    return !(payload.exp && payload.exp < Date.now() / 1000)
  }

  const restoreSession = useCallback(() => {
    const token = localStorage.getItem('admin_jwt_token')
    if (token) {
      if (isTokenValid(token)) {
        const payload = decodeToken(token)
        if (payload?.username) {
          setUsername(payload.username)
        }
        return true
      }
    }
    return false
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_jwt_token')
    setIsLoggedIn(false)
    setUsername(null)
    showToast('Logged out', 'info')
  }, [showToast])

  const performLogin = async (user: string, pass: string, captchaToken: string) => {
    if (!user || !pass || !captchaToken) {
      showToast('Username, password and CAPTCHA required', 'error')
      return
    }
    setIsValidating(true)
    setLoginError(false)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, captchaToken }),
      })

      const data = await res.json()
      if (res.status === 429 || res.status === 403) {
        setLoginError(true)
        showToast('Access denied or rate limited', 'error')
        return
      }
      if (res.ok && data.token) {
        localStorage.setItem('admin_jwt_token', data.token)
        setUsername(data.username || user)
        setIsLoggedIn(true)
        showToast('Login successful', 'success')
      } else {
        setLoginError(true)
        localStorage.removeItem('admin_jwt_token')
        setUsername(null)
        showToast('Invalid credentials', 'error')
      }
    } catch (error) {
      setLoginError(true)
      showToast('Network error during login', 'error')
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (restoreSession()) {
      setIsLoggedIn(true)
    }
  }, [restoreSession])

  return { isLoggedIn, isValidating, loginError, username, performLogin, handleLogout, getAuthHeaders }
}
