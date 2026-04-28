import { useState, useCallback } from 'react';
import { isTokenValid } from '~/lib/jwt-handler';

/**
 * 管理认证相关的状态：登录状态、验证进程、错误信息
 */
export function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('admin_jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const performLogin = useCallback(
    async (password: string, captchaToken: string, onSuccess?: () => void) => {
      if (!password || !captchaToken) return;

      setIsValidating(true);
      setLoginError(false);

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, captchaToken }),
        });

        const data = await res.json();

        if (res.status === 429 || res.status === 403) {
          setLoginError(true);
          return;
        }

        if (res.ok && data.token) {
          localStorage.setItem('admin_jwt_token', data.token);
          setIsLoggedIn(true);
          onSuccess?.();
        } else {
          setLoginError(true);
          localStorage.removeItem('admin_jwt_token');
        }
      } catch {
        setLoginError(true);
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_jwt_token');
    setIsLoggedIn(false);
  }, []);

  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem('admin_jwt_token');
    if (token) {
      if (isTokenValid(token)) {
        setIsLoggedIn(true);
        return true;
      } else {
        handleLogout();
        return false;
      }
    }
    return false;
  }, [handleLogout]);

  return {
    isLoggedIn,
    setIsLoggedIn,
    isValidating,
    setIsValidating,
    loginError,
    setLoginError,
    getAuthHeaders,
    performLogin,
    handleLogout,
    checkTokenValidity,
  };
}
