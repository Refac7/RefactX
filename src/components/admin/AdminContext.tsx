import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
    REPO_CONFIG, DEFAULT_META, DATA_FILES, UPLOAD_CONFIG, 
    type FileType, type MobileView, type EditorMode, type QueueItem, type RemoteFile, type MetaType 
} from './types';

// 定义 Toast 类型
type ToastType = 'success' | 'error' | 'info';
interface ToastMsg {
  id: string;
  msg: string;
  type: ToastType;
}

interface AdminContextType {
  isLoggedIn: boolean;
  performLogin: (pass: string, captchaToken: string) => Promise<void>;
  handleLogout: () => void;
  isValidating: boolean;
  loginError: boolean;
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  showLeftPanel: boolean;
  setShowLeftPanel: (v: boolean) => void;
  showRightPanel: boolean;
  setShowRightPanel: (v: boolean) => void;
  remoteFiles: RemoteFile[];
  queue: QueueItem[];
  isLoadingFiles: boolean;
  isProcessingQueue: boolean;
  fetchRemoteFiles: () => Promise<void>;
  loadFile: (name: string, isData?: boolean, path?: string) => Promise<void>;
  stageForDelete: (file: RemoteFile) => void;
  stageForWrite: () => void;
  removeFromQueue: (id: string, e?: React.MouseEvent) => void;
  processQueue: () => Promise<void>;
  handleNewPost: () => void;
  loadFromQueue: (item: QueueItem) => void;
  currentMode: FileType;
  setCurrentMode: (m: FileType) => void;
  editorMode: EditorMode;
  setEditorMode: (m: EditorMode) => void;
  filename: string;
  setFilename: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  meta: MetaType;
  setMeta: (m: MetaType) => void;
  jsonContent: string;
  setJsonContent: (s: string) => void;
  parsedJson: any[];
  setParsedJson: (a: any[]) => void;
  editingItemIndex: number | null;
  setEditingItemIndex: (n: number | null) => void;
  isFetchingContent: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadTargetRef: React.RefObject<string>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerUpload: (target: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [mobileView, setMobileView] = useState<MobileView>('editor');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);

  const [currentMode, setCurrentMode] = useState<FileType>('post');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [filename, setFilename] = useState('');
  const [body, setBody] = useState('');
  const [meta, setMeta] = useState<MetaType>(DEFAULT_META);
  const [jsonContent, setJsonContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('body');

  const showToast = (msg: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_jwt_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const isTokenValid = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const payload = JSON.parse(jsonPayload);
      return !(payload.exp && payload.exp < Date.now() / 1000);
    } catch (e) { return false; }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt_token');
    setIsLoggedIn(false);
    setRemoteFiles([]);
    showToast('Logged out', 'info');
  };

  const parseContent = (raw: string) => {
    try {
        const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = raw.match(regex);
        if (!match) return { meta: DEFAULT_META, body: raw };
        const yamlBlock = match[1];
        const bodyContent = match[2].trim();
        const extract = (key: string, isString = true) => {
            const regex = new RegExp(`^${key}:\\s*(.*)$`, 'm');
            const m = yamlBlock.match(regex);
            if (!m) return '';
            let val = m[1].trim();
            if (isString && val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/''/g, "'");
            return val;
        };
        const tags = extract('tags', false).replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^'|'$/g, '')).join(', ');
        const newMeta = {
            title: extract('title'), description: extract('description'),
            pubDate: extract('pubDate', false), author: extract('author'),
            tags: tags, recommend: extract('recommend', false) === 'true',
            heroImage: extract('heroImage', false) === 'none' ? '' : extract('heroImage', false),
            ogImage: extract('ogImage', false) === 'none' ? '' : extract('ogImage', false),
            heroImageAspectRatio: extract('heroImageAspectRatio') || '16/9'
        };
        return { meta: { ...DEFAULT_META, ...newMeta }, body: bodyContent };
    } catch (e) { return { meta: DEFAULT_META, body: raw }; }
  };

  const fetchRemoteFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/list-files', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ config: REPO_CONFIG }) });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      const data = await res.json();
      if (data.files) setRemoteFiles(data.files);
    } catch (e: any) { 
        if (e.message === 'UNAUTHORIZED') { handleLogout(); }
        else { showToast('Failed to fetch files', 'error'); }
    } finally { setIsLoadingFiles(false); }
  };

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
        fetchRemoteFiles();
      } else {
        setLoginError(true);
        localStorage.removeItem('admin_jwt_token');
        showToast('Invalid credentials', 'error');
      }
    } catch (error) { 
        setLoginError(true); 
        showToast('Network error during login', 'error');
    } finally { 
        setIsValidating(false); 
    }
  };

  const loadFile = async (name: string, isData = false, path?: string) => {
    if ((isData ? jsonContent : body).length > 50 && !confirm("Override current workspace?")) return;
    setIsFetchingContent(true);
    try {
      const res = await fetch('/api/get-content', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(isData ? { config: REPO_CONFIG, absolutePath: path } : { config: REPO_CONFIG, filename: name }) });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      
      if (res.status === 404 && isData) {
        setFilename(name); setJsonContent('[]'); setParsedJson([]);
        setCurrentMode('data'); setEditorMode('visual'); setEditingItemIndex(null); setMobileView('editor');
        showToast('New data file initialized', 'info');
        return;
      }
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      
      if (isData) {
        setFilename(name); setCurrentMode('data');
        try {
          const parsed = JSON.parse(data.content);
          setJsonContent(JSON.stringify(parsed, null, 2));
          setParsedJson(Array.isArray(parsed) ? parsed : []);
          setEditingItemIndex(null);
          setEditorMode('visual');
        } catch(e) {
          setJsonContent(data.content);
          setEditorMode('raw');
        }
      } else {
        const { meta: parsedMeta, body: parsedBody } = parseContent(data.content);
        setFilename(name); setMeta(parsedMeta); setBody(parsedBody);
        setCurrentMode('post');
      }
      setMobileView('editor');
      showToast(`Loaded ${name}`, 'success');
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') { handleLogout(); }
        else { showToast('Failed to load file', 'error'); }
    } finally { setIsFetchingContent(false); }
  };

  const stageForWrite = () => {
    let content = '';
    let finalFilename = '';
    
    if (currentMode === 'post') {
        if (!filename || !meta.title) {
            showToast('Filename and Title are required', 'error');
            return;
        }
        finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
        content = `---
title: '${meta.title.replace(/'/g, "''")}'
description: '${meta.description.replace(/'/g, "''")}'
pubDate: ${meta.pubDate}
author: '${meta.author}'
tags: [${meta.tags.split(/[,，]/).map(t => `'${t.trim()}'`).filter(Boolean).join(', ')}]
recommend: ${meta.recommend}
heroImage: ${meta.heroImage || 'none'}
ogImage: ${meta.ogImage || 'none'}
heroImageAspectRatio: '${meta.heroImageAspectRatio}'
---

${body}`;
    } else {
        if (!filename) {
            showToast('Filename is required', 'error');
            return;
        }
        try { JSON.parse(jsonContent); } catch (e) { 
            showToast('Invalid JSON format', 'error');
            return; 
        }
        finalFilename = DATA_FILES.find(f => f.name === filename)?.path || filename;
        content = jsonContent;
    }

    setQueue(prev => {
        const newItem: QueueItem = { id: Date.now().toString(), type: 'write', filename: finalFilename, content, status: 'pending', isDataFile: currentMode === 'data' };
        const existingIndex = prev.findIndex(p => p.filename === finalFilename);
        if (existingIndex !== -1) { const newQueue = [...prev]; newQueue[existingIndex] = newItem; return newQueue; }
        return [...prev, newItem];
    });
    showToast('Staged for commit', 'success');
  };

  const stageForDelete = (file: RemoteFile) => {
    if (!confirm(`DELETE ${file.name}?`)) return;
    setQueue(prev => {
        const newItem: QueueItem = { id: Date.now().toString(), type: 'delete', filename: file.name, sha: file.sha, status: 'pending', isDataFile: false };
        const existingIndex = prev.findIndex(p => p.filename === file.name);
        if (existingIndex !== -1) { const newQueue = [...prev]; newQueue[existingIndex] = newItem; return newQueue; }
        return [...prev, newItem];
    });
    showToast('Staged for deletion', 'success');
  };

  const processQueue = async () => {
    if (queue.length === 0) return;
    if (!confirm(`EXECUTE ${queue.length} OPERATIONS?`)) return;
    setIsProcessingQueue(true);
    try {
      const res = await fetch('/api/batch-commit', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ config: REPO_CONFIG, operations: queue }) });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      if (!res.ok) throw new Error('BATCH FAILED');
      setQueue([]);
      localStorage.removeItem('admin_queue_v1');
      showToast('Operations committed successfully', 'success');
      await fetchRemoteFiles();
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') { handleLogout(); }
      else { showToast('Batch commit failed', 'error'); }
    } finally { setIsProcessingQueue(false); }
  };

  const handleNewPost = async () => {
    if ((body+jsonContent).length > 20 && !confirm("CLEAR WORKSPACE?")) return;
    setCurrentMode('post');
    setFilename(''); setBody(''); setMeta(DEFAULT_META);
    showToast('Workspace cleared', 'info');
    try {
      const res = await fetch('/api/next-filename', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ config: REPO_CONFIG }) });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      const d = await res.json();
      if(d.filename) setFilename(d.filename);
    } catch(e: any) { if (e.message === 'UNAUTHORIZED') { handleLogout(); } }
    setMobileView('editor');
  };

  const loadFromQueue = (item: QueueItem) => {
    if (item.type === 'delete') return;
    if ((body.length > 20 || jsonContent.length > 20) && !confirm("DISCARD CHANGES?")) return;
    try {
        let displayFilename = item.filename.includes('/') ? item.filename.split('/').pop() || item.filename : item.filename;
        setFilename(displayFilename);
        if (item.isDataFile) {
            setCurrentMode('data');
            setJsonContent(item.content || '');
            try { setParsedJson(JSON.parse(item.content || '[]')); setEditorMode('visual'); } catch { setEditorMode('raw'); }
        } else {
            setCurrentMode('post');
            const { meta: m, body: b } = parseContent(item.content || '');
            setMeta(m); setBody(b);
        }
        setMobileView('editor');
        showToast('Loaded from queue', 'info');
    } catch (e) {}
  };

  const triggerUpload = (target: string) => {
      uploadTargetRef.current = target;
      fileInputRef.current?.click();
  };

  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newData = [...parsedJson];
    newData[index] = { ...newData[index], [key]: value };
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Uploading file...', 'info');
    try {
        const MAX_SIZE = 1024 * 1024;
        let fileToUpload = file;
        if (file.size > MAX_SIZE) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => { img.onload = resolve; });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = Math.sqrt(MAX_SIZE / file.size);
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            if (!blob) throw new Error('Compression failed');
            fileToUpload = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        }
        const formData = new FormData();
        formData.append('file', fileToUpload);
        const uploadUrl = new URL(UPLOAD_CONFIG.url);
        uploadUrl.searchParams.set('path', 'root'); 

        const res = await fetch(uploadUrl.toString(), { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${UPLOAD_CONFIG.token}` } });
        if (!res.ok) throw new Error('Failed');
        const { url } = await res.json();
        
        const target = uploadTargetRef.current;
        if (target.startsWith('json_')) {
             const [_, indexStr, key] = target.split('___');
             handleUpdateItem(parseInt(indexStr), key, url);
        } else if (target === 'json_raw') {
             setJsonContent(prev => prev + url);
        } else if (target === 'body') {
            setBody(prev => prev + `![](${url})`);
        } else if (target === 'hero') setMeta({ ...meta, heroImage: url, ogImage: meta.ogImage ? meta.ogImage : url });
        else if (target === 'og') setMeta({ ...meta, ogImage: url });
        
        showToast('Upload successful', 'success');
    } catch(e) { 
        showToast('Upload failed', 'error');
    } 
    finally { if(fileInputRef.current) fileInputRef.current.value = ''; }
  };

  useEffect(() => {
    const savedQueue = localStorage.getItem('admin_queue_v1');
    if (savedQueue) { try { setQueue(JSON.parse(savedQueue)); } catch {} }
  }, []);

  useEffect(() => { localStorage.setItem('admin_queue_v1', JSON.stringify(queue)); }, [queue]);

  useEffect(() => {
    const token = localStorage.getItem('admin_jwt_token');
    if (token) {
        if (isTokenValid(token)) { setIsLoggedIn(true); fetchRemoteFiles(); }
        else { handleLogout(); }
    }
  }, []);

  const removeFromQueue = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQueue(prev => prev.filter(item => item.id !== id));
    showToast('Removed from queue', 'info');
  };

  const value = {
    isLoggedIn, performLogin, handleLogout, isValidating, loginError,
    mobileView, setMobileView, showLeftPanel, setShowLeftPanel, showRightPanel, setShowRightPanel,
    remoteFiles, queue, isLoadingFiles, isProcessingQueue, fetchRemoteFiles,
    loadFile, stageForDelete, stageForWrite, removeFromQueue, processQueue, handleNewPost, loadFromQueue,
    currentMode, setCurrentMode, editorMode, setEditorMode, filename, setFilename,
    body, setBody, meta, setMeta, jsonContent, setJsonContent, parsedJson, setParsedJson,
    editingItemIndex, setEditingItemIndex, isFetchingContent,
    fileInputRef, uploadTargetRef, handleFileChange, triggerUpload, showToast
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
      <div className="fixed bottom-12 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
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