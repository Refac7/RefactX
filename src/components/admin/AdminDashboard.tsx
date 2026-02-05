import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '~/lib/utils';
import { CMS_CONFIG, WALINE_CONFIG } from '~/config';

// --- 配置区域 ---
const REPO_CONFIG = {
  owner: CMS_CONFIG.owner,
  repo: CMS_CONFIG.repo,
  branch: CMS_CONFIG.branch,
  pathPrefix: CMS_CONFIG.pathPrefix 
};

// 数据文件定义
const DATA_FILES = [
  { name: 'projects.json', path: 'src/content/data/projects.json', label: 'PROJECTS' },
  { name: 'friends.json', path: 'src/content/data/friends.json', label: 'FRIENDS' },
  { name: 'photos.json', path: 'src/content/data/photos.json', label: 'PHOTOS' }
];

// Schema 定义 (保持不变)
const SCHEMAS: Record<string, { key: string; label: string; type: 'text' | 'image' | 'textarea' | 'json' }[]> = {
  'friends.json': [
    { key: 'name', label: 'Site Name', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'url', label: 'Link', type: 'text' },
    { key: 'avatar', label: 'Avatar URL', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  'projects.json': [
    { key: 'name', label: 'Project Name', type: 'text' },
    { key: 'description', label: 'Desc', type: 'textarea' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'githubUrl', label: 'GitHub', type: 'text' },
    { key: 'type', label: 'Type (icon/image)', type: 'text' },
    { key: 'icon', label: 'Icon Class / Image URL', type: 'text' },
    { key: 'star', label: 'Stars', type: 'text' },
    { key: 'fork', label: 'Forks', type: 'text' },
  ],
  'photos.json': [
    { key: 'title', label: 'Album Title', type: 'text' },
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'icon', label: 'Icon (JSON Object)', type: 'json' },
    { key: 'photos', label: 'Photos List (JSON)', type: 'json' },
  ]
};

const UPLOAD_CONFIG = {
  url: WALINE_CONFIG.imgbedURL,
  token: WALINE_CONFIG.uploadToken
};

const DEFAULT_META = {
  title: '', description: '', pubDate: new Date().toISOString().split('T')[0],
  author: CMS_CONFIG.owner, tags: '', recommend: false,
  heroImage: '', ogImage: '', heroImageAspectRatio: '16/9'
};

// --- 类型 ---
type FileType = 'post' | 'data';
type MobileView = 'files' | 'editor' | 'queue';
type EditorMode = 'visual' | 'raw';

type QueueItem = {
  id: string; type: 'write' | 'delete'; filename: string;
  content?: string; sha?: string; status: 'pending' | 'processing' | 'done' | 'error';
  isDataFile?: boolean;
};

type RemoteFile = { name: string; sha: string; path: string; };

export default function AdminDashboard() {
  // Check if CMS is enabled
  if (!CMS_CONFIG.enableCMS) {
    return <div className="min-h-screen flex items-center justify-center text-center text-muted-foreground font-mono text-sm">
      <p>CMS is currently disabled</p>
    </div>;
  }

  // Auth
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Data
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // Editor
  const [currentMode, setCurrentMode] = useState<FileType>('post');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [filename, setFilename] = useState('');
  const [body, setBody] = useState('');
  const [meta, setMeta] = useState(DEFAULT_META);
  
  // JSON Data
  const [jsonContent, setJsonContent] = useState(''); 
  const [parsedJson, setParsedJson] = useState<any[]>([]); 
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null); 
  
  const [showMetaConfig, setShowMetaConfig] = useState(true);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  
  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('editor');

  // Layout State (New)
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('body');

  // --- 自动保存暂存区到本地存储 ---
  useEffect(() => {
    // 1. 初始化时加载
    const saved = localStorage.getItem('admin_queue_v1');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // 确保状态重置为 pending
        const resetQueue = parsed.map((item: QueueItem) => ({
          ...item,
          status: 'pending' // 重置状态，避免之前的状态影响
        }));
        setQueue(resetQueue); 
      } catch (e) {
        console.error('Failed to parse saved queue:', e);
      }
    }
  }, []);

  useEffect(() => {
    // 2. 变化时自动保存
    if (queue.length > 0) {
      localStorage.setItem('admin_queue_v1', JSON.stringify(queue));
    } else {
      localStorage.removeItem('admin_queue_v1');
    }
  }, [queue]);

  // --- Auth Logic ---
  useEffect(() => {
    const savedPass = localStorage.getItem('admin_simple_pass');
    if (savedPass) { 
      setPassword(savedPass); 
      performLogin(savedPass); 
    }
  }, []);



  const performLogin = async (pass: string) => {
    if (!pass) return;
    setIsValidating(true);
    setLoginError(false);
    
    try {


      const res = await fetch('/api/auth', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      
      if (res.ok) {
        localStorage.setItem('admin_simple_pass', pass);
        setIsLoggedIn(true); 
        setPassword(pass);
        toast.success('IDENTITY CONFIRMED // SYSTEM ONLINE');
        fetchRemoteFiles(pass);
      } else {
        setLoginError(true);
        localStorage.removeItem('admin_simple_pass');
        
        // 细分错误提示
        const errorData = await res.json().catch(() => ({}));
        
        if (res.status === 429) {
          // 频率限制：暴力尝试锁定
          const message = errorData.error || 'Too many attempts. Please try again later.';
          toast.error(`RATE_LIMITED // ${message}`, { duration: 5000 });
        } else if (res.status === 403) {
          toast.error('ACCESS FORBIDDEN', { duration: 4000 });
        } else if (res.status === 401) {
          // 认证失败：密码错误
          toast.error('ACCESS DENIED // INVALID CREDENTIALS');
        } else if (res.status === 500) {
          // 服务器错误
          toast.error('SERVER_ERROR // Configuration issue', { duration: 4000 });
        } else {
          // 其他错误
          toast.error(`ERROR_${res.status} // ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) { 
      setLoginError(true);
      toast.error('CONNECTION_FAILURE // Network error'); 
    } finally { 
      setIsValidating(false); 
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('admin_simple_pass'); 
    localStorage.removeItem('admin_queue_v1'); // 同时清除暂存区
    setIsLoggedIn(false); 
    setPassword(''); 
    setQueue([]); // 清空队列
  };

  // --- Logic: Markdown Parser ---
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

  // --- Logic: Fetch Files ---
  const fetchRemoteFiles = async (pass = password) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/list-files', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass, config: REPO_CONFIG }) 
      });
      const data = await res.json();
      if (data.files) setRemoteFiles(data.files);
    } catch (e) { 
      console.error('Failed to fetch files:', e);
      toast.error('Failed to load file list');
    } finally { 
      setIsLoadingFiles(false); 
    }
  };

  // --- Logic: Load Content ---
  const loadFile = async (name: string, isData = false, path?: string) => {
    if ((isData ? jsonContent : body).length > 50 && !confirm("Replace current content?")) return;
    setIsFetchingContent(true);
    const toastId = toast.loading(`Fetching ${name}...`);
    
    const requestBody = isData ? 
      { password, config: REPO_CONFIG, absolutePath: path } : 
      { password, config: REPO_CONFIG, filename: name };

    try {
        const res = await fetch('/api/get-content', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody) 
        });
        
        if (res.status === 404 && isData) {
            setFilename(name); setJsonContent('[]'); setParsedJson([]);
            setCurrentMode('data'); setEditorMode('visual'); setEditingItemIndex(null); setMobileView('editor');
            toast('File not found remotely. Initialized empty.', { icon: '🆕', id: toastId });
            return;
        }

        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();

        if (isData) {
            setFilename(name); setCurrentMode('data');
            try {
                const parsed = JSON.parse(data.content);
                const formatted = JSON.stringify(parsed, null, 2);
                setJsonContent(formatted);
                setParsedJson(Array.isArray(parsed) ? parsed : []);
                setEditingItemIndex(null);
                setEditorMode('visual');
            } catch(e) {
                setJsonContent(data.content);
                setEditorMode('raw');
                toast.error('Invalid JSON, switching to Raw mode');
            }
        } else {
            const { meta: parsedMeta, body: parsedBody } = parseContent(data.content);
            setFilename(name); setMeta(parsedMeta); setBody(parsedBody);
            setCurrentMode('post');
        }
        setMobileView('editor');
        toast.success('Loaded', { id: toastId });
    } catch (e) { 
      toast.error('Failed to fetch', { id: toastId }); 
    } finally { 
      setIsFetchingContent(false); 
    }
  };

  // --- Logic: Visual JSON Editing ---
  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newData = [...parsedJson];
    newData[index] = { ...newData[index], [key]: value };
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
  };

  const handleAddItem = () => {
    const schema = SCHEMAS[filename] || [];
    const newItem: any = {};
    schema.forEach(field => newItem[field.key] = '');

    // 修改逻辑：判断文件名
    let newData;
    let newIndex;

    if (filename === 'friends.json') {
        // 友链：添加到末尾
        newData = [...parsedJson, newItem];
        newIndex = parsedJson.length; // 新项目的索引是原数组长度
    } else {
        // 其他文件：保持添加到头部
        newData = [newItem, ...parsedJson];
        newIndex = 0; // 新项目的索引是 0
    }

    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
    setEditingItemIndex(newIndex); // 自动进入编辑模式，定位到新添加的项
  };

  const handleDeleteItem = (index: number) => {
    if(!confirm('Delete this item?')) return;
    const newData = parsedJson.filter((_, i) => i !== index);
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  // --- Logic: Queue ---
  // 🔥🔥🔥 新增功能：从暂存区回读 🔥🔥🔥
  const loadFromQueue = (item: QueueItem) => {
    if (item.type === 'delete') return toast('Cannot edit a deletion task', { icon: '🚫' });
    if ((body.length > 20 || jsonContent.length > 20) && !confirm("Discard current changes and load from buffer?")) return;

    try {
        // 恢复文件名
        let displayFilename = item.filename;
        if (displayFilename.includes('/')) displayFilename = displayFilename.split('/').pop() || displayFilename;
        
        setFilename(displayFilename);

        if (item.isDataFile) {
            // 恢复 JSON
            setCurrentMode('data');
            setJsonContent(item.content || '');
            try {
                const p = JSON.parse(item.content || '[]');
                setParsedJson(p);
                setEditorMode('visual');
            } catch {
                setEditorMode('raw');
            }
        } else {
            // 恢复 Markdown
            setCurrentMode('post');
            const { meta: m, body: b } = parseContent(item.content || '');
            setMeta(m);
            setBody(b);
        }

        setMobileView('editor');
        toast.success('Restored from Buffer');
    } catch (e) {
        console.error(e);
        toast.error('Failed to parse buffer content');
    }
  };

  const stageForWrite = () => {
    let content = '';
    let finalFilename = '';
    
    if (currentMode === 'post') {
        if (!filename || !meta.title) return toast.error('Meta incomplete');
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
        if (!filename) return toast.error('Filename error');
        try { JSON.parse(jsonContent); } catch (e) { return toast.error('Invalid JSON Syntax'); }
        finalFilename = DATA_FILES.find(f => f.name === filename)?.path || filename;
        content = jsonContent;
    }

    setQueue(prev => {
        const existingIndex = prev.findIndex(p => p.filename === finalFilename);
        const newItem: QueueItem = {
            id: Date.now().toString(), 
            type: 'write', 
            filename: finalFilename,
            content, 
            status: 'pending', 
            isDataFile: currentMode === 'data'
        };
        if (existingIndex !== -1) {
            const newQueue = [...prev];
            newQueue[existingIndex] = newItem;
            return newQueue;
        }
        return [...prev, newItem];
    });
    
    toast.success('Saved to BUFFER');
  };

  const stageForDelete = (file: RemoteFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    setQueue(prev => [...prev, {
        id: Date.now().toString(), 
        type: 'delete', 
        filename: file.name,
        sha: file.sha, 
        status: 'pending',
        isDataFile: false
    }]);
    toast.success(`Marked for deletion`);
  };

  const removeFromQueue = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const processQueue = async () => {
    if (queue.length === 0) return toast.error('Buffer is empty');
    if (!confirm(`Execute ${queue.length} tasks?`)) return;
    
    setIsProcessingQueue(true);
    const toastId = toast.loading('Batch uploading...');

    try {
        const res = await fetch('/api/batch-commit', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password,
                config: REPO_CONFIG,
                operations: queue.map(item => ({
                    type: item.type,
                    filename: item.filename,
                    content: item.content,
                    sha: item.sha,
                    isDataFile: item.isDataFile
                }))
            }) 
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Batch failed');

        setQueue([]);
        localStorage.removeItem('admin_queue_v1'); 
        
        toast.success(`Batch completed! ${queue.length} files processed. Build triggered.`, { id: toastId });
        await fetchRemoteFiles();

    } catch (error: any) { 
        console.error('Batch error:', error);
        toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
        setIsProcessingQueue(false);
    }
  };

  // --- Upload ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading...');
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(UPLOAD_CONFIG.url, { 
          method: 'POST', 
          body: formData, 
          headers: { 'Authorization': `Bearer ${UPLOAD_CONFIG.token}` } 
        });
        if (!res.ok) throw new Error('Failed');
        const { url } = await res.json();
        
        const target = uploadTargetRef.current;
        if (target.startsWith('json_')) {
             const [_, indexStr, key] = target.split('___');
             const index = parseInt(indexStr);
             handleUpdateItem(index, key, url);
        } else if (target === 'json_raw') {
             const ta = jsonTextareaRef.current;
             if(ta) {
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                setJsonContent(ta.value.substring(0, start) + url + ta.value.substring(end));
             }
        } else if (target === 'body') {
            const ta = textareaRef.current;
            if(ta) {
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                setBody(ta.value.substring(0, start) + `![](${url})` + ta.value.substring(end));
            }
        } else if (target === 'hero') setMeta(p => ({ ...p, heroImage: url, ogImage: p.ogImage ? p.ogImage : url }));
        else if (target === 'og') setMeta(p => ({ ...p, ogImage: url }));
        
        toast.success('Uploaded', { id: toastId });
    } catch(e) { 
      toast.error('Upload failed', { id: toastId }); 
    } finally { 
      if(fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const triggerUpload = (t: string) => { 
    uploadTargetRef.current = t; 
    fileInputRef.current?.click(); 
  };
  
  const handleNewPost = async () => {
    if ((body+jsonContent).length > 20 && !confirm("Clear workspace?")) return;
    setCurrentMode('post');
    setFilename(''); setBody(''); setMeta(DEFAULT_META);
    try {
        const res = await fetch('/api/next-filename', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, config: REPO_CONFIG }) 
        });
        const d = await res.json();
        if(d.filename) setFilename(d.filename);
    } catch(e){
        console.error('Failed to get next filename:', e);
    }
    setMobileView('editor');
    toast('New Post Ready', { icon: '✨' });
  };

  // --- Render Visual JSON (已修复 src="" 报错) ---
  const renderVisualEditor = () => {
    const schema = SCHEMAS[filename] || [];
    if (schema.length === 0) return <div className="p-8 text-center text-muted-foreground text-xs font-mono">No schema for this file. Use CODE mode.</div>;

    if (editingItemIndex !== null) {
        const item = parsedJson[editingItemIndex] || {};
        return (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                    <button onClick={() => setEditingItemIndex(null)} className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary">
                        <span className="icon-[ph--arrow-left] size-4"></span> BACK
                    </button>
                    <span className="text-xs font-mono font-bold">ITEM #{editingItemIndex}</span>
                </div>
                <div className="grid grid-cols-1 gap-6 mx-auto">
                    {schema.map(field => (
                        <div key={field.key} className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground/70 flex justify-between">
                                {field.label}
                                {field.type === 'image' && (
                                    <span onClick={() => triggerUpload(`json____${editingItemIndex}___${field.key}`)} className="cursor-pointer text-primary hover:underline">[UPLOAD]</span>
                                )}
                            </label>
                            
                            {field.type === 'textarea' || field.type === 'json' ? (
                                <textarea 
                                    value={typeof item[field.key] === 'object' ? JSON.stringify(item[field.key], null, 2) : item[field.key] || ''} 
                                    onChange={e => {
                                      try {
                                        const newValue = field.type === 'json' ? 
                                          JSON.parse(e.target.value || '{}') : 
                                          e.target.value;
                                        handleUpdateItem(editingItemIndex, field.key, newValue);
                                      } catch (err) {
                                        if (field.type !== 'json') {
                                          handleUpdateItem(editingItemIndex, field.key, e.target.value);
                                        }
                                      }
                                    }}
                                    className="w-full bg-muted/20 border border-border/40 p-2 text-sm font-mono focus:border-primary/50 focus:outline-none min-h-[100px]"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input 
                                        value={item[field.key] || ''} 
                                        onChange={e => handleUpdateItem(editingItemIndex, field.key, e.target.value)}
                                        className="w-full bg-muted/20 border border-border/40 p-2 text-sm font-mono focus:border-primary/50 focus:outline-none"
                                    />
                                    {/* Fix: 检查是否有值且不是 icon 类名 */}
                                    {field.type === 'image' && item[field.key] && !item[field.key].startsWith('icon-') && (
                                        <div className="size-9 shrink-0 border border-border overflow-hidden">
                                            <img src={item[field.key]} className="size-full object-cover" alt="preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <button onClick={() => handleDeleteItem(editingItemIndex)} className="mt-8 w-full py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-mono">DELETE ITEM</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-muted/5">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-muted-foreground">{parsedJson.length} ITEMS</span>
                <button onClick={handleAddItem} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 text-xs font-mono hover:bg-primary/20">
                    <span className="icon-[ph--plus] size-3"></span> ADD NEW
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {parsedJson.map((item, idx) => {
                    const iconValue = item.avatar || item.icon;
                    let iconEl;
                    // Fix: 智能判断 CSS 类名 vs 图片 URL
                    if (typeof iconValue === 'string') {
                        if (iconValue.startsWith('icon-') || iconValue.includes('icon-[')) {
                            iconEl = <span className={cn(iconValue, "text-xl")} />;
                        } else if (iconValue) {
                            iconEl = <img src={iconValue} className="size-full object-cover" alt="icon" onError={(e) => (e.currentTarget.style.display = 'none')} />;
                        } else {
                            iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>;
                        }
                    } else if (typeof iconValue === 'object') {
                        iconEl = <span className="text-lg">{iconValue.value}</span>;
                    } else {
                        iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>;
                    }

                    return (
                        <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group bg-background border border-border/40 p-3 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all relative">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-muted/20 rounded-full overflow-hidden shrink-0 border border-border flex items-center justify-center">
                                    {iconEl}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">{item.name || item.title || 'Untitled'}</div>
                                    <div className="text-xs text-muted-foreground truncate">{item.description || item.date || 'No description'}</div>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="icon-[ph--pencil-simple] size-4 text-primary"></span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // --- Render: Login (保持原样) ---
  if (!isLoggedIn) {
     return (
        <div className="min-h-[80vh] flex items-center justify-center text-foreground font-mono p-4 relative overflow-hidden">
            <Toaster toastOptions={{ 
              style: { 
                marginTop: '100px',
                background: '#111', 
                color: '#fff', 
                border: '1px solid #333', 
                fontFamily: 'monospace',
                fontSize: '12px',
                borderRadius: '0'
              } 
            }} />
            
            <div className="w-full max-w-md border border-border bg-background/50 backdrop-blur-md p-8 relative shadow-xl overflow-hidden group">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tighter mb-2">IDENTITY_CORE</h1>
                    <p className="text-xs text-muted-foreground">Restricted Access // Authorization Required</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value);
                                setLoginError(false);
                            }}
                            onKeyDown={e => e.key === 'Enter' && performLogin(password)}
                            className={cn(
                                "w-full bg-muted/30 border p-3 text-center tracking-[0.5em] text-sm focus:outline-none transition-all duration-300 placeholder:tracking-normal",
                                loginError 
                                    ? "border-red-500 text-red-500 placeholder:text-red-500/50 animate-pulse" 
                                    : "border-border focus:border-primary text-foreground"
                            )}
                            placeholder="PASSKEY"
                            disabled={isValidating}
                            autoFocus
                        />
                        {loginError && <div className="text-[10px] text-red-500 mt-2 text-center font-bold tracking-wider">ERROR: INVALID CREDENTIALS</div>}
                    </div>



                    <button 
                        onClick={() => performLogin(password)} 
                        disabled={isValidating}
                        className={cn(
                            "w-full py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group/btn",
                            loginError ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:opacity-90"
                        )}
                    >
                        {isValidating ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="icon-[ph--spinner] animate-spin size-4"></span>
                                VERIFYING...
                            </span>
                        ) : (
                            <span className="group-hover/btn:tracking-[0.2em] transition-all">ESTABLISH LINK</span>
                        )}
                    </button>
                </div>

                <div className="mt-8 text-[9px] text-center text-muted-foreground/40 font-mono">
                    SECURE CONNECTION :: V.3.2
                </div>
            </div>
        </div>
    );
  }

  // --- Render: Login (保留初始核心设计) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-foreground font-mono p-4 relative overflow-hidden">
        <Toaster toastOptions={{ 
          style: { 
            background: '#111', 
            color: '#fff', 
            border: '1px solid #333', 
            fontFamily: 'monospace',
            fontSize: '12px',
            borderRadius: '0'
          } 
        }} />
        
        <div className="w-full max-w-md border border-border bg-background/50 backdrop-blur-md p-8 relative shadow-xl overflow-hidden group">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tighter mb-2">IDENTITY_CORE</h1>
            <p className="text-xs text-muted-foreground">Restricted Access // Authorization Required</p>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setLoginError(false);
                }}
                onKeyDown={e => e.key === 'Enter' && performLogin(password)}
                className={cn(
                  "w-full bg-muted/30 border p-3 text-center tracking-[0.5em] text-sm focus:outline-none transition-all duration-300 placeholder:tracking-normal",
                  loginError 
                    ? "border-red-500 text-red-500 placeholder:text-red-500/50 animate-pulse" 
                    : "border-border focus:border-primary text-foreground"
                )}
                placeholder="PASSKEY"
                disabled={isValidating}
                autoFocus
              />
              {loginError && <div className="text-[10px] text-red-500 mt-2 text-center font-bold tracking-wider">ERROR: INVALID CREDENTIALS</div>}
            </div>

            <button 
              onClick={() => performLogin(password)} 
              disabled={isValidating}
              className={cn(
                "w-full py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group/btn",
                loginError ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20" : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="icon-[ph--spinner] animate-spin size-4"></span>
                  VERIFYING...
                </span>
              ) : (
                <span className="group-hover/btn:tracking-[0.2em] transition-all">ESTABLISH LINK</span>
              )}
            </button>
          </div>

          <div className="mt-8 text-[9px] text-center text-muted-foreground/40 font-mono">
            SECURE CONNECTION :: V.3.2
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Dashboard (回归初始工业风核心设计，保留所有功能) ---
  return (
    <div className="text-foreground font-sans p-4 lg:p-6 flex flex-col min-h-screen">
      <Toaster toastOptions={{ 
        style: { 
          marginTop: '100px',
          background: '#111', 
          color: '#fff', 
          border: '1px solid #333', 
          fontFamily: 'monospace',
          fontSize: '12px',
          borderRadius: '0'
        } 
      }} 
    />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* 初始版核心头部：精简装饰，保留状态和核心信息 */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            // SYSTEM_CONTROLLER // V.3.2
          </span>
          <button onClick={handleLogout} className="flex items-center gap-2 cursor-pointer hover:text-red-500 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] uppercase text-emerald-500 font-bold">ADMIN_ACTIVE</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-6 gap-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
            CONSOLE<span className="text-primary">.</span>
          </h1>
          <div className="flex items-center gap-6 pt-2 border-t border-dashed border-border/40 w-full lg:w-auto lg:border-t-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">TOTAL FILES</span>
              <span className="text-2xl font-mono font-bold text-foreground tracking-tight">{remoteFiles.length}</span>
            </div>
            <div className="h-8 w-px bg-border/60"></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">BUFFER TASKS</span>
              <span className="text-2xl font-mono font-bold text-foreground tracking-tight">{queue.length}</span>
            </div>
            <div className="h-8 w-px bg-border/60"></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">TARGET REPO</span>
              <span className="text-sm font-mono text-foreground mt-1 truncate max-w-[150px]" title={REPO_CONFIG.repo}>{REPO_CONFIG.repo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端标签栏：初始工业风格式，保留功能 */}
      <div className="grid grid-cols-3 border border-border lg:hidden mb-6 bg-background">
        {['files', 'editor', 'queue'].map(v => (
          <button 
            key={v} 
            onClick={() => setMobileView(v as MobileView)} 
            className={cn(
              "py-3 text-[10px] tracking-widest uppercase font-mono transition-all duration-200", 
              mobileView === v 
                ? 'text-primary font-bold bg-primary/5 border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v === 'files' ? 'DATA' : v === 'queue' ? `BUFFER [${queue.length}]` : v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 核心三栏布局：保留折叠/响应式/所有功能，回归初始简洁样式 */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-px bg-border h-[calc(100vh-320px)] lg:h-[calc(100vh-280px)] overflow-hidden">
        {/* 1. 左侧 DATA BANK 面板：保留所有功能，初始样式 */}
        <div className={cn(
          "flex-col bg-background transition-all duration-300 overflow-hidden", 
          mobileView === 'files' ? 'flex h-full' : 'hidden',
          showLeftPanel ? 'lg:flex lg:col-span-2' : 'lg:hidden lg:col-span-0 w-0'
        )}>
          {/* 面板头部 */}
          <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-muted/10 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="size-1.5 bg-primary"></div>
              <span className="text-[10px] font-mono font-bold tracking-wider">DATA_BANK</span>
            </div>
            <div className="flex gap-1">
              <button onClick={handleNewPost} className="size-6 flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary" title="New Post">
                <span className="icon-[ph--plus] size-3.5"></span>
              </button>
              <button onClick={() => fetchRemoteFiles()} className="size-6 flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary" title="Refresh">
                <span className="icon-[ph--arrows-clockwise] size-3.5"></span>
              </button>
            </div>
          </div>

          {/* 面板内容：CONFIG + ARCHIVE，保留所有功能 */}
          <div className="flex-1 overflow-y-auto p-2 bg-background">
            {/* CONFIG 区域 */}
            <div className="px-1 py-2 flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-muted-foreground/40 tracking-widest uppercase">CONFIG</span>
              <div className="h-px bg-border/40 flex-1"></div>
            </div>
            <div className="space-y-1 mb-4">
              {DATA_FILES.map(f => (
                <div 
                  key={f.name} 
                  onClick={() => loadFile(f.name, true, f.path)} 
                  className={cn(
                    "group flex items-center text-xs px-2 py-1.5 border-l-2 transition-all cursor-pointer", 
                    filename === f.name ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                  )}
                >
                  <span className="icon-[ph--brackets-curly] size-3 mr-2 text-muted-foreground/50 group-hover:text-muted-foreground/80"></span>
                  <span className="font-mono truncate">{f.label}</span>
                </div>
              ))}
            </div>

            {/* ARCHIVE 区域 */}
            <div className="px-1 py-2 flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-muted-foreground/40 tracking-widest uppercase">ARCHIVE</span>
              <div className="h-px bg-border/40 flex-1"></div>
            </div>
            <div className="space-y-px">
              {isLoadingFiles ? (
                <div className="p-6 text-center text-muted-foreground/50">
                  <span className="icon-[ph--spinner] animate-spin size-4"></span>
                </div>
              ) : remoteFiles.map(f => (
                <div 
                  key={f.sha} 
                  className={cn(
                    "group flex justify-between items-center text-xs px-2 py-1.5 border-l-2 transition-all cursor-pointer", 
                    filename === f.name ? "bg-primary/10 border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                  )}
                >
                  <span onClick={() => loadFile(f.name)} className="font-mono truncate flex-1">{f.name.replace('.md', '')}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); stageForDelete(f); }} 
                    className="text-muted-foreground hover:text-red-500 size-5 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="icon-[ph--trash] size-3"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 中间 WORKSTATION 编辑器面板：保留所有功能，初始样式 */}
        <div className={cn(
          "flex-col bg-background transition-all duration-300 overflow-hidden", 
          mobileView === 'editor' ? 'flex h-full' : 'hidden',
          showLeftPanel && showRightPanel ? "lg:flex lg:col-span-7" :
          !showLeftPanel && showRightPanel ? "lg:flex lg:col-span-9" :
          showLeftPanel && !showRightPanel ? "lg:flex lg:col-span-10" :
          "lg:flex lg:col-span-12"
        )}>
          {/* 编辑器工具栏：保留所有功能，初始简洁样式 */}
          <div className="h-10 flex justify-between items-center border-b border-border bg-background sticky top-0 z-10">
            {/* 左侧折叠 + 文件名 */}
            <div className="flex items-center h-full">
              <button 
                onClick={() => setShowLeftPanel(!showLeftPanel)} 
                className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 border-r border-border"
                title={showLeftPanel ? "Collapse" : "Expand"}
              >
                <span className={cn("icon-[ph--caret-left] size-3.5", !showLeftPanel && "rotate-180")}></span>
              </button>
              <div className="flex items-center gap-2 px-3 h-full">
                <span className={cn("size-4 text-muted-foreground/50", currentMode === 'data' ? "icon-[ph--brackets-curly]" : "icon-[ph--file-text]")}></span>
                <div className="h-4 w-px bg-border/60 mx-1"></div>
                <input 
                  value={filename} 
                  onChange={e => setFilename(e.target.value)} 
                  disabled={currentMode === 'data'} 
                  placeholder="UNTITLED" 
                  className="bg-transparent text-xs font-mono w-full focus:outline-none uppercase tracking-wider placeholder:text-muted-foreground/20" 
                />
              </div>
            </div>

            {/* 右侧功能按钮 + STAGE + 折叠右侧 */}
            <div className="flex items-center h-full">
              <div className="flex items-center gap-1 px-2 h-1/2 border-l border-border/40">
                {currentMode === 'post' ? (
                  <>
                    <button onClick={() => triggerUpload('body')} className="size-7 flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary" title="Insert Image">
                      <span className="icon-[ph--image] size-4"></span>
                    </button>
                    <button 
                      onClick={() => setShowMetaConfig(!showMetaConfig)} 
                      className={cn("size-7 flex items-center justify-center hover:bg-primary/10 text-muted-foreground", showMetaConfig && "text-primary bg-primary/5")}
                      title="Metadata"
                    >
                      <span className="icon-[ph--sliders-horizontal] size-4"></span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setEditorMode(editorMode === 'visual' ? 'raw' : 'visual')} 
                      className="flex items-center gap-1 h-6 px-2 hover:bg-primary/10 text-[9px] font-mono text-muted-foreground hover:text-primary uppercase"
                    >
                      <span className={cn("icon-[ph--eye] size-3", editorMode === 'visual' && 'text-primary')}></span>
                      {editorMode === 'visual' ? 'UI' : 'CODE'}
                    </button>
                    {editorMode === 'raw' && (
                      <button onClick={() => triggerUpload('json_raw')} className="size-6 flex items-center justify-center hover:bg-muted text-xs" title="Upload Image">
                        <span className="icon-[ph--image] size-3.5"></span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <button 
                onClick={stageForWrite} 
                className="flex items-center gap-2 bg-primary text-primary-foreground h-10 px-4 text-[10px] font-mono font-bold hover:bg-primary/90 tracking-widest uppercase border-l border-primary/50"
              >
                <span className="icon-[ph--plus] size-3"></span>
                STAGE
              </button>

              <button 
                onClick={() => setShowRightPanel(!showRightPanel)} 
                className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 border-l border-border"
                title={showRightPanel ? "Collapse" : "Expand"}
              >
                <span className={cn("icon-[ph--caret-right] size-3.5", !showRightPanel && "rotate-180")}></span>
              </button>
            </div>
          </div>

          {/* 编辑器核心内容：保留所有功能（Markdown/JSON/可视化/RAW） */}
          <div className="flex-1 relative w-full h-full min-h-[300px] flex flex-col overflow-hidden bg-background">
            {isFetchingContent && (
              <div className="absolute inset-0 bg-background/80 z-20 flex items-center justify-center gap-3 backdrop-blur-sm">
                <span className="icon-[ph--spinner] animate-spin size-6 text-primary"></span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">LOADING...</span>
              </div>
            )}
            
            {/* Markdown 编辑器：元信息 + 正文，保留所有功能 */}
            {currentMode === 'post' && (
              <>
                {showMetaConfig && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b border-border/40 bg-muted/5 text-xs shrink-0">
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-widest">TITLE</label>
                      <input 
                        value={meta.title} 
                        onChange={e=>setMeta({...meta, title: e.target.value})} 
                        className="w-full h-9 bg-background border border-border focus:border-primary px-3 font-mono text-sm focus:outline-none placeholder:text-muted-foreground/20" 
                        placeholder="POST TITLE" 
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-widest">DESCRIPTION</label>
                      <input 
                        value={meta.description} 
                        onChange={e=>setMeta({...meta, description: e.target.value})} 
                        className="w-full h-9 bg-background border border-border focus:border-primary px-3 font-mono text-xs focus:outline-none" 
                        placeholder="BRIEF SUMMARY" 
                      />
                    </div>
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-widest">PUB DATE</label>
                      <input 
                        type="date" 
                        value={meta.pubDate} 
                        onChange={e=>setMeta({...meta, pubDate: e.target.value})} 
                        className="w-full h-9 bg-background border border-border focus:border-primary px-2 font-mono text-xs focus:outline-none" 
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-widest">TAGS (COMMA)</label>
                      <input 
                        value={meta.tags} 
                        onChange={e=>setMeta({...meta, tags: e.target.value})} 
                        className="w-full h-9 bg-background border border-border focus:border-primary px-3 font-mono text-xs text-primary focus:outline-none" 
                        placeholder="REACT, TECH" 
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <label className="flex items-center justify-center gap-2 cursor-pointer group h-9 border border-border bg-background hover:border-primary/50 w-full">
                        <input 
                          type="checkbox" 
                          checked={meta.recommend} 
                          onChange={e => setMeta({...meta, recommend: e.target.checked})}
                          className="appearance-none size-3 border border-muted-foreground/50 checked:bg-primary checked:border-primary rounded-none"
                        />
                        <span className={cn("text-[10px] font-mono font-bold tracking-wider", meta.recommend ? "text-primary" : "text-muted-foreground")}>
                          FEATURED
                        </span>
                      </label>
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground/70 flex justify-between uppercase tracking-widest">
                        <span>HERO IMAGE</span>
                        <span onClick={()=>triggerUpload('hero')} className="cursor-pointer hover:text-primary underline decoration-dotted">[UPLOAD]</span>
                      </label>
                      <input 
                        value={meta.heroImage} 
                        onChange={e=>setMeta({...meta, heroImage: e.target.value})} 
                        className="w-full h-9 bg-background border border-border focus:border-primary px-3 font-mono text-xs text-muted-foreground focus:outline-none" 
                        placeholder="HTTPS://..." 
                      />
                    </div>
                  </div>
                )}
                <textarea 
                  ref={textareaRef} 
                  value={body} 
                  onChange={e => setBody(e.target.value)} 
                  className="flex-1 p-6 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/20 selection:bg-primary/20" 
                  placeholder="// MARKDOWN EDITOR" 
                  spellCheck={false}
                />
              </>
            )}
            
            {/* JSON 编辑器：可视化 + RAW，保留所有功能 */}
            {currentMode === 'data' && (
              <>
                {editorMode === 'visual' ? renderVisualEditor() : (
                  <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                    <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[9px] font-mono font-bold px-2 py-1 pointer-events-none z-10">RAW JSON</div>
                    <textarea 
                      ref={jsonTextareaRef} 
                      value={jsonContent} 
                      onChange={e => setJsonContent(e.target.value)} 
                      className="flex-1 p-4 bg-transparent text-[#d4d4d4] text-xs font-mono leading-relaxed resize-none focus:outline-none" 
                      spellCheck={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3. 右侧 BUFFER 队列面板：保留所有功能，初始样式 */}
        <div className={cn(
          "flex-col bg-background transition-all duration-300 overflow-hidden", 
          mobileView === 'queue' ? 'flex h-full' : 'hidden',
          showRightPanel ? 'lg:flex lg:col-span-3' : 'lg:hidden lg:col-span-0 w-0'
        )}>
          {/* 面板头部 */}
          <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-muted/10 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="size-1.5 bg-yellow-500"></div>
              <span className="text-[10px] font-mono font-bold tracking-wider">BUFFER_ZONE</span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground bg-border/50 px-1.5 py-0.5">{queue.length} TASKS</span>
          </div>

          {/* 队列内容：保留回读/删除/空状态，所有功能 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/5">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                <div className="border-2 border-dashed border-current p-3 mb-2 opacity-50">
                  <span className="icon-[ph--queue] size-6 block"></span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest">BUFFER EMPTY</span>
              </div>
            ) : (
              queue.map(item => (
                <div 
                  key={item.id} 
                  className="relative bg-background border border-border p-3 flex flex-col gap-1.5 group hover:border-primary/40 transition-colors"
                >
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1", 
                    item.status === 'done' ? 'bg-emerald-500' : 
                    item.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 
                    item.type === 'delete' ? 'bg-red-500' : 'bg-primary'
                  )}></div>
                  <div className="flex justify-between items-start pl-2">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider border px-1", 
                      item.type === 'delete' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-primary/30 text-primary bg-primary/5'
                    )}>
                      {item.type === 'delete' ? 'DEL' : 'WRI'} : {item.isDataFile ? 'DATA' : 'POST'}
                    </span>
                    <div className="flex gap-1">
                      {item.type === 'write' && (
                        <button 
                          onClick={() => loadFromQueue(item)} 
                          className="hover:bg-primary/10 p-0.5 text-primary transition-all" 
                          title="Recall to Editor"
                        >
                          <span className="icon-[ph--pencil-simple] size-3.5"></span>
                        </button>
                      )}
                      {item.status === 'pending' && (
                        <button 
                          onClick={(e)=>removeFromQueue(item.id, e)} 
                          className="hover:bg-red-500/10 p-0.5 text-muted-foreground hover:text-red-500 transition-all" 
                          title="Remove"
                        >
                          <span className="icon-[ph--x] size-3.5"></span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="text-xs font-mono font-bold truncate text-foreground" title={item.filename}>
                      {item.filename.split('/').pop()}
                    </div>
                    {item.type === 'write' && (
                      <div className="text-[10px] text-muted-foreground mt-1 border-l-2 border-border/40 pl-2 line-clamp-2 font-mono opacity-70">
                        {item.content || '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 批量提交按钮：保留所有功能，初始样式 */}
          <div className="p-3 border-t border-border bg-background">
            <button 
              onClick={processQueue} 
              disabled={isProcessingQueue || queue.length === 0} 
              className={cn(
                "w-full py-3 text-xs font-bold font-mono uppercase tracking-[0.15em] transition-all border",
                isProcessingQueue || queue.length === 0 
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50" 
                  : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
              )}
            >
              {isProcessingQueue ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="icon-[ph--spinner] animate-spin size-3"></span>
                  PROCESSING...
                </span>
              ) : (
                `EXECUTE [${queue.length}]`
              )}
            </button>
            {queue.length > 0 && (
              <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-muted-foreground/50 uppercase">
                <span>SINGLE COMMIT</span>
                <span>READY</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}