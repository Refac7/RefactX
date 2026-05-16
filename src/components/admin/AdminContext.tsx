import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MobileView } from './types';
import { useAdminToast } from './hooks/useAdminToast';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminEditor } from './hooks/useAdminEditor';
import { useAdminFileSystem } from './hooks/useAdminFileSystem';

// 为了保持现有组件不报错，我们将所有的返回值都打平在一个 interface 中，相当于一个聚合体
export interface AdminContextType extends ReturnType<typeof useAdminAuth>, ReturnType<typeof useAdminEditor>, ReturnType<typeof useAdminFileSystem> {
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  showLeftPanel: boolean;
  setShowLeftPanel: (v: boolean) => void;
  showRightPanel: boolean;
  setShowRightPanel: (v: boolean) => void;
  showToast: ReturnType<typeof useAdminToast>['showToast'];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileView, setMobileView] = useState<MobileView>('editor');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const { toasts, showToast } = useAdminToast();
  const auth = useAdminAuth(showToast);
  const editor = useAdminEditor(showToast);
  const fileSystem = useAdminFileSystem(showToast, auth.getAuthHeaders, auth.handleLogout, editor, setMobileView);

  // 认证成功后自动拉取文件列表
  useEffect(() => {
    if (auth.isLoggedIn) {
      fileSystem.fetchRemoteFiles();
    }
  }, [auth.isLoggedIn, fileSystem.fetchRemoteFiles]);

  const value = {
    ...auth, ...editor, ...fileSystem,
    mobileView, setMobileView,
    showLeftPanel, setShowLeftPanel,
    showRightPanel, setShowRightPanel,
    showToast
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
      {/* 极简 Toast 提示 */}
      <style>{`
        @keyframes geist-toast-slide {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="fixed bottom-12 left-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="bg-background border border-border/40 px-4 py-3 rounded-lg text-sm font-medium shadow-lg flex items-center gap-3 pointer-events-auto"
            style={{ animation: 'geist-toast-slide 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}
          >
            <span className={`flex size-2 rounded-full shrink-0 ${
              toast.type === 'error' ? 'bg-red-500' : 
              toast.type === 'success' ? 'bg-emerald-500' : 
              'bg-muted-foreground'
            }`}></span>
            <span className="text-foreground">{toast.msg}</span>
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};

export default AdminProvider;