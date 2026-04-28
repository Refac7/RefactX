import React, { createContext, useContext, useEffect } from 'react';
import { DATA_FILES, type QueueItem, type RemoteFile, type FileType, type EditorMode, type MobileView } from './types';
import {
  useAuthState,
  useEditorState,
  useQueueState,
  useUIState,
  useApiCalls,
  useFileUpload,
} from './hooks';

interface AdminContextType {
  // 认证
  isLoggedIn: boolean;
  performLogin: (pass: string, captchaToken: string) => Promise<void>;
  handleLogout: () => void;
  isValidating: boolean;
  loginError: boolean;

  // 文件和队列
  remoteFiles: RemoteFile[];
  queue: QueueItem[];
  isLoadingFiles: boolean;
  isProcessingQueue: boolean;
  fetchRemoteFiles: () => Promise<void>;
  loadFile: (name: string, isData?: boolean, path?: string) => Promise<void>;
  removeFromQueue: (id: string) => void;
  processQueue: () => Promise<void>;

  // 编辑器
  currentMode: FileType;
  setCurrentMode: (m: FileType) => void;
  editorMode: EditorMode;
  setEditorMode: (m: EditorMode) => void;
  filename: string;
  setFilename: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  meta: any;
  setMeta: (m: any) => void;
  jsonContent: string;
  setJsonContent: (s: string) => void;
  parsedJson: any[];
  setParsedJson: (a: any[]) => void;
  editingItemIndex: number | null;
  setEditingItemIndex: (n: number | null) => void;
  isFetchingContent: boolean;
  buildMarkdownContent: () => string;
  resetEditor: (mode?: FileType) => void;
  handleNewPost: () => void;
  loadFromQueue: (item: QueueItem) => void;
  stageForWrite: () => void;
  stageForDelete: (file: RemoteFile) => void;

  // UI
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  showLeftPanel: boolean;
  setShowLeftPanel: (v: boolean) => void;
  showRightPanel: boolean;
  setShowRightPanel: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerUpload: (target: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用所有的自定义 hooks
  const auth = useAuthState();
  const editor = useEditorState();
  const queue = useQueueState();
  const ui = useUIState();
  const api = useApiCalls(auth.getAuthHeaders);
  const fileUpload = useFileUpload(api.uploadFile);

  // 处理登录，并在成功后获取远程文件
  const handlePerformLogin = async (pass: string, captchaToken: string) => {
    return auth.performLogin(pass, captchaToken, async () => {
      try {
        const files = await api.fetchRemoteFiles();
        queue.setRemoteFiles(files);
      } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
          auth.handleLogout();
        }
      }
    });
  };

  // 获取远程文件列表
  const handleFetchRemoteFiles = async () => {
    queue.setIsLoadingFiles(true);
    try {
      const files = await api.fetchRemoteFiles();
      queue.setRemoteFiles(files);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        auth.handleLogout();
      }
    } finally {
      queue.setIsLoadingFiles(false);
    }
  };

  // 加载指定文件内容
  const handleLoadFile = async (name: string, isData = false, path?: string) => {
    const currentContent = isData ? editor.jsonContent : editor.body;
    if (currentContent.length > 50 && !confirm('Override current workspace?')) return;

    editor.setIsFetchingContent(true);
    try {
      const data = await api.fetchFileContent(name, isData, path);

      if (isData) {
        editor.setFilename(name);
        editor.loadDataContent(data.content);
      } else {
        editor.setFilename(name);
        editor.loadPostContent(data.content);
      }
      ui.setMobileView('editor');
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        auth.handleLogout();
      }
    } finally {
      editor.setIsFetchingContent(false);
    }
  };

  // 生成下一个文件名
  const handleNewPost = async () => {
    if ((editor.body + editor.jsonContent).length > 20 && !confirm('CLEAR WORKSPACE?')) return;

    editor.resetEditor('post');
    try {
      const filename = await api.generateNextFilename();
      editor.setFilename(filename);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        auth.handleLogout();
      }
    }
    ui.setMobileView('editor');
  };

  // 提交批量操作
  const handleProcessQueue = async () => {
    if (queue.queue.length === 0) return;
    if (!confirm(`EXECUTE ${queue.queue.length} OPERATIONS?`)) return;

    queue.setIsProcessingQueue(true);
    try {
      await api.submitBatchCommit(queue.queue);
      queue.clearQueue();
      await handleFetchRemoteFiles();
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        auth.handleLogout();
      }
    } finally {
      queue.setIsProcessingQueue(false);
    }
  };

  // 暂存写入操作
  const handleStageForWrite = () => {
    let finalFilename = '';
    let content = '';

    if (editor.currentMode === 'post') {
      if (!editor.filename || !editor.meta.title) return;
      finalFilename = editor.filename.endsWith('.md') ? editor.filename : `${editor.filename}.md`;
      content = editor.buildMarkdownContent();
    } else {
      if (!editor.filename) return;
      try {
        JSON.parse(editor.jsonContent);
      } catch {
        return;
      }
      finalFilename = DATA_FILES.find(f => f.name === editor.filename)?.path || editor.filename;
      content = editor.jsonContent;
    }

    queue.stageForWrite(finalFilename, content, editor.currentMode === 'data');
  };

  // 从队列加载
  const handleLoadFromQueue = (item: QueueItem) => {
    if (item.type === 'delete') return;
    if ((editor.body.length > 20 || editor.jsonContent.length > 20) && !confirm('DISCARD CHANGES?')) return;

    const displayFilename = item.filename.includes('/') ? item.filename.split('/').pop() || item.filename : item.filename;
    editor.setFilename(displayFilename);

    if (item.isDataFile) {
      editor.loadDataContent(item.content || '');
    } else {
      editor.loadPostContent(item.content || '');
    }
    ui.setMobileView('editor');
  };

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await fileUpload.handleFileUpload(file);
      const target = ui.uploadTargetRef.current;

      if (target.startsWith('json_')) {
        const [_, indexStr, key] = target.split('___');
        editor.handleUpdateJsonItem(parseInt(indexStr), key, url);
      } else if (target === 'json_raw') {
        editor.setJsonContent(prev => prev + url);
      } else if (target === 'body') {
        editor.setBody(prev => prev + `![](${url})`);
      } else if (target === 'hero') {
        editor.setMeta({
          ...editor.meta,
          heroImage: url,
          ogImage: editor.meta.ogImage ? editor.meta.ogImage : url,
        });
      } else if (target === 'og') {
        editor.setMeta({ ...editor.meta, ogImage: url });
      }
    } catch {
      // 上传失败，忽略
    } finally {
      if (ui.fileInputRef.current) ui.fileInputRef.current.value = '';
    }
  };

  // 初始化：检查已保存的令牌
  useEffect(() => {
    const isValid = auth.checkTokenValidity();
    if (isValid) {
      handleFetchRemoteFiles();
    }
  }, []);

  const value: AdminContextType = {
    // 认证
    isLoggedIn: auth.isLoggedIn,
    performLogin: handlePerformLogin,
    handleLogout: auth.handleLogout,
    isValidating: auth.isValidating,
    loginError: auth.loginError,

    // 文件和队列
    remoteFiles: queue.remoteFiles,
    queue: queue.queue,
    isLoadingFiles: queue.isLoadingFiles,
    isProcessingQueue: queue.isProcessingQueue,
    fetchRemoteFiles: handleFetchRemoteFiles,
    loadFile: handleLoadFile,
    removeFromQueue: queue.removeFromQueue,
    processQueue: handleProcessQueue,

    // 编辑器
    currentMode: editor.currentMode,
    setCurrentMode: editor.setCurrentMode,
    editorMode: editor.editorMode,
    setEditorMode: editor.setEditorMode,
    filename: editor.filename,
    setFilename: editor.setFilename,
    body: editor.body,
    setBody: editor.setBody,
    meta: editor.meta,
    setMeta: editor.setMeta,
    jsonContent: editor.jsonContent,
    setJsonContent: editor.setJsonContent,
    parsedJson: editor.parsedJson,
    setParsedJson: editor.setParsedJson,
    editingItemIndex: editor.editingItemIndex,
    setEditingItemIndex: editor.setEditingItemIndex,
    isFetchingContent: editor.isFetchingContent,
    buildMarkdownContent: editor.buildMarkdownContent,
    resetEditor: editor.resetEditor,
    handleNewPost: handleNewPost,
    loadFromQueue: handleLoadFromQueue,
    stageForWrite: handleStageForWrite,
    stageForDelete: queue.stageForDelete,

    // UI
    mobileView: ui.mobileView,
    setMobileView: ui.setMobileView,
    showLeftPanel: ui.showLeftPanel,
    setShowLeftPanel: ui.setShowLeftPanel,
    showRightPanel: ui.showRightPanel,
    setShowRightPanel: ui.setShowRightPanel,
    fileInputRef: ui.fileInputRef,
    triggerUpload: ui.triggerUpload,
    handleFileChange,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};

export default AdminProvider;
