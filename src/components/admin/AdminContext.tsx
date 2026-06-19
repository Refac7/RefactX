import React, { createContext, useContext, useState, useEffect } from 'react'
import type { MobileView } from './types'
import { useAdminToast } from './hooks/useAdminToast'
import { useAdminAuth } from './hooks/useAdminAuth'
import { useAdminEditor } from './hooks/useAdminEditor'
import { useAdminFileSystem } from './hooks/useAdminFileSystem'

function useAnimatedToasts<T extends { id: string | number }>(originalToasts: T[]) {
  const [renderedToasts, setRenderedToasts] = useState<{ toast: T; isLeaving: boolean }[]>([])

  useEffect(() => {
    setRenderedToasts((prev) => {
      const currentIds = originalToasts.map((t) => t.id)

      const next = prev.map((item) => {
        if (!currentIds.includes(item.toast.id) && !item.isLeaving) {
          return { ...item, isLeaving: true }
        }
        return item
      })

      const prevIds = prev.map((item) => item.toast.id)
      originalToasts.forEach((t) => {
        if (!prevIds.includes(t.id)) {
          next.push({ toast: t, isLeaving: false })
        }
      })

      return next
    })
  }, [originalToasts])

  const handleAnimationEnd = (id: string | number, isLeaving: boolean) => {
    if (isLeaving) {
      setRenderedToasts((prev) => prev.filter((item) => item.toast.id !== id))
    }
  }

  return { renderedToasts, handleAnimationEnd }
}

export interface AdminContextType
  extends ReturnType<typeof useAdminAuth>,
    ReturnType<typeof useAdminEditor>,
    ReturnType<typeof useAdminFileSystem> {
  mobileView: MobileView
  setMobileView: (v: MobileView) => void
  showLeftPanel: boolean
  setShowLeftPanel: (v: boolean) => void
  showRightPanel: boolean
  setShowRightPanel: (v: boolean) => void
  showToast: ReturnType<typeof useAdminToast>['showToast']
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileView, setMobileView] = useState<MobileView>('editor')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)

  const { toasts, showToast } = useAdminToast()

  const { renderedToasts, handleAnimationEnd } = useAnimatedToasts(toasts)

  const auth = useAdminAuth(showToast)
  const editor = useAdminEditor(showToast)
  const fileSystem = useAdminFileSystem(showToast, auth.getAuthHeaders, auth.handleLogout, editor, setMobileView)

  useEffect(() => {
    if (auth.isLoggedIn) {
      fileSystem.fetchRemoteFiles()
    }
  }, [auth.isLoggedIn, fileSystem.fetchRemoteFiles])

  const value = {
    ...auth,
    ...editor,
    ...fileSystem,
    mobileView,
    setMobileView,
    showLeftPanel,
    setShowLeftPanel,
    showRightPanel,
    setShowRightPanel,
    showToast,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
      <style>{`
        @keyframes geist-toast-slide-in {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes geist-toast-slide-out {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
      <div className="fixed bottom-12 left-6 z-9999 flex flex-col gap-3 pointer-events-none">
        {renderedToasts.map(({ toast, isLeaving }) => (
          <div
            key={toast.id}
            onAnimationEnd={() => handleAnimationEnd(toast.id, isLeaving)}
            className="bg-background border border-border/40 px-4 py-3 rounded-lg text-sm font-medium shadow-lg flex items-center gap-3 pointer-events-auto"
            style={{
              animation: isLeaving
                ? 'geist-toast-slide-out 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                : 'geist-toast-slide-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}
          >
            <span
              className={`flex size-2 rounded-full shrink-0 ${
                toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-emerald-500' : 'bg-muted-foreground'
              }`}
            ></span>
            <span className="text-foreground">{toast.msg}</span>
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within an AdminProvider')
  return context
}

export default AdminProvider
