import { useState, useRef, useCallback } from 'react';
import { type MobileView } from '../types';

/**
 * 管理 UI 显示相关的状态：移动视图、面板显示、文件上传等
 */
export function useUIState() {
  const [mobileView, setMobileView] = useState<MobileView>('editor');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string>('body');

  const triggerUpload = useCallback((target: string) => {
    uploadTargetRef.current = target;
    fileInputRef.current?.click();
  }, []);

  return {
    mobileView,
    setMobileView,
    showLeftPanel,
    setShowLeftPanel,
    showRightPanel,
    setShowRightPanel,
    fileInputRef,
    uploadTargetRef,
    triggerUpload,
  };
}
