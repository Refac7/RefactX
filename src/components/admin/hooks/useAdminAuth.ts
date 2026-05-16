import { useState, useEffect, useCallback } from 'react';
import type { ToastType } from './useAdminToast';

export function useAdminAuth(showToast: (msg: string, type?: ToastType) => void) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('admin_jwt_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const isTokenValid = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const payload = JSON.parse(jsonPayload);
      return !(payload.exp && payload.exp < Date.now() / 1000);
    } catch (e) { return false; }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_jwt_token');
    setIsLoggedIn(false);
    showToast('Logged out', 'info');
  }, [showToast]);

  const performLogin = async (pass: string, captchaToken: string) => {
    if (!pass || !captchaToken) {
        showToast('Password and CAPTCHA required', 'error');
        return;
    }
    setIsValidating(true);
    setLoginError(false);
    
    try {
      const res = await fetch('/api/auth', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password: pass, captchaToken }) 
      });

      const data = await res.json();
      if (res.status === 429 || res.status === 403) {
        setLoginError(true);
        showToast('Access denied or rate limited', 'error');
        return;
      }
      if (res.ok && data.token) {
        localStorage.setItem('admin_jwt_token', data.token);
        setIsLoggedIn(true);
        showToast('Login successful', 'success');
      } else {
        setLoginError(true);
        localStorage.removeItem('admin_jwt_token');
        showToast('Invalid credentials', 'error');
      }
    } catch (error) { 
        setLoginError(true); 
        showToast('Network error during login', 'error');
    } finally { setIsValidating(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt_token');
    if (token) {
        if (isTokenValid(token)) setIsLoggedIn(true);
        else handleLogout();
    }
  }, [handleLogout]);

  return { isLoggedIn, isValidating, loginError, performLogin, handleLogout, getAuthHeaders };
}