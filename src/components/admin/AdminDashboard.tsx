import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '~/lib/utils';

// --- 配置区域 ---
const REPO_CONFIG = {
  owner: 'Refac7',
  repo: 'RefactX',
  branch: 'main',
  pathPrefix: 'src/content/posts/' 
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
  url: 'https://img.refact.cc/upload?path=root',
  token: import.meta.env.PUBLIC_UPLOAD_TOKEN || 'YOUR_UPLOAD_TOKEN'
};

const DEFAULT_META = {
  title: '', description: '', pubDate: new Date().toISOString().split('T')[0],
  author: 'Refact', tags: '', recommend: false,
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
        toast.error('ACCESS DENIED // INVALID CREDENTIALS');
      }
    } catch { 
      setLoginError(true);
      toast.error('CONNECTION FAILURE'); 
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
    const newData = [newItem, ...parsedJson];
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
    setEditingItemIndex(0);
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
                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
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
                                    className="w-full bg-muted/20 border border-border/50 p-2 text-sm rounded font-mono focus:border-primary/50 focus:outline-none min-h-[100px]"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input 
                                        value={item[field.key] || ''} 
                                        onChange={e => handleUpdateItem(editingItemIndex, field.key, e.target.value)}
                                        className="w-full bg-muted/20 border border-border/50 p-2 text-sm rounded font-mono focus:border-primary/50 focus:outline-none"
                                    />
                                    {/* Fix: 检查是否有值且不是 icon 类名 */}
                                    {field.type === 'image' && item[field.key] && !item[field.key].startsWith('icon-') && (
                                        <div className="size-9 shrink-0 border border-border rounded overflow-hidden">
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
                <button onClick={handleAddItem} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-mono hover:bg-primary/20">
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
                        <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group bg-background border border-border/60 p-3 rounded cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all relative">
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
        <div className="min-h-[80vh] flex items-center justify-center bg-background text-foreground font-mono p-4 relative overflow-hidden">
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
            
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
            
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

  // --- Render: Dashboard (头部还原) ---
  return (
    <div className="text-foreground font-sans p-4 lg:p-6 flex flex-col">
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
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Header (已还原第一版设计) */}
      <div className="mb-10 relative">
        <div className="flex items-center justify-between pb-2 mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
             // SYSTEM_CONTROLLER // V.3.2
          </span>
          <div className="flex items-center gap-2 cursor-pointer hover:text-red-500 transition-colors" onClick={handleLogout}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px] uppercase text-emerald-500 font-bold">Admin_Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-7">
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter text-foreground leading-[0.9] -ml-1">
              Control<span className="text-primary/80">.</span>
            </h1>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-end pb-2">
            <div className="border-l-2 border-primary/40 pl-6 flex flex-col gap-6">
               <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Centralized management for Markdown posts and JSON data configurations.
               </p>
               <div className="flex items-center gap-4 pt-4 border-t border-dashed border-border/60">
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">Total Modules</span>
                      <span className="text-3xl font-mono font-bold text-foreground tracking-tight">{remoteFiles.length}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60"></div>
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">Buffer Tasks</span>
                      <span className="text-3xl font-mono font-bold text-foreground tracking-tight">{queue.length}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60"></div>
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground/60 font-mono tracking-wider">Target Repo</span>
                      <span className="text-sm font-mono text-foreground mt-1 truncate max-w-[150px]" title={REPO_CONFIG.repo}>{REPO_CONFIG.repo}</span>
                  </div>
                  <div className="h-8 w-px bg-border/60"></div>
                  <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400 font-mono underline decoration-dotted underline-offset-4">LOGOUT</button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex lg:hidden mb-4 border border-border/60 bg-muted/5 font-mono text-xs">
          {['files', 'editor', 'queue'].map(v => (
             <button 
               key={v} 
               onClick={() => setMobileView(v as MobileView)} 
               className={cn(
                 "flex-1 py-2 border-r border-border/40 text-center uppercase", 
                 mobileView === v ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
               )}
             >
               {v === 'files' ? 'DATA' : v === 'queue' ? `BUFFER [${queue.length}]` : v}
             </button>
          ))}
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 relative">
         
         {/* 1. DATA BANK */}
         <div className={cn("lg:col-span-2 flex-col border border-border/60 bg-muted/5 min-h-[300px] lg:flex", mobileView === 'files' ? 'flex h-[60vh] lg:h-auto' : 'hidden')}>
            <div className="p-3 border-b border-border/40 flex justify-between items-center bg-muted/10">
                <span className="text-xs font-mono font-bold">DATA_BANK</span>
                <div className="flex gap-2">
                    <button onClick={handleNewPost} className="text-muted-foreground hover:text-primary"><span className="icon-[ph--plus] size-4"></span></button>
                    <button onClick={() => fetchRemoteFiles()} className="text-muted-foreground hover:text-primary"><span className="icon-[ph--arrows-clockwise] size-4"></span></button>
                </div>
            </div>
            <div className="px-2 py-2 text-[10px] font-mono font-bold text-muted-foreground/60">CONFIG_FILES</div>
            <div className="px-2 space-y-1">
                {DATA_FILES.map(f => (
                    <div key={f.name} onClick={() => loadFile(f.name, true, f.path)} className={cn("flex items-center text-xs p-2 border transition-all cursor-pointer", filename === f.name ? "bg-primary/10 border-primary/30 text-primary" : "border-transparent hover:bg-muted/10")}>
                        <span className="icon-[ph--brackets-curly] size-3 mr-2 opacity-70"></span>
                        <span className="font-mono truncate">{f.label}</span>
                    </div>
                ))}
            </div>
            <div className="px-2 py-2 mt-2 text-[10px] font-mono font-bold text-muted-foreground/60 border-t border-border/30">POSTS</div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                {isLoadingFiles ? <div className="text-xs text-center pt-2">Loading...</div> : remoteFiles.map(f => (
                    <div key={f.sha} className={cn("group flex justify-between items-center text-xs p-2 border transition-all cursor-pointer", filename === f.name ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/10")}>
                        <span onClick={() => loadFile(f.name)} className="font-mono truncate flex-1">{f.name.replace('.md', '')}</span>
                        <button onClick={(e) => { e.stopPropagation(); stageForDelete(f); }} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100"><span className="icon-[ph--trash] size-3"></span></button>
                    </div>
                ))}
            </div>
         </div>

         {/* 2. WORKSTATION */}
         <div className={cn("lg:col-span-7 flex-col border border-border/60 shadow-sm bg-background min-h-[500px] lg:flex", mobileView === 'editor' ? 'flex h-[75vh] lg:h-auto' : 'hidden')}>
            <div className="flex gap-2 justify-between items-center p-3 border-b border-border/40 bg-muted/5 overflow-x-auto no-scrollbar whitespace-nowrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className={cn("size-5 text-muted-foreground shrink-0", currentMode === 'data' ? "icon-[ph--brackets-curly]" : "icon-[ph--file-text]")}></span>
                    <input value={filename} onChange={e => setFilename(e.target.value)} disabled={currentMode === 'data'} placeholder="Filename..." className="bg-transparent text-sm font-mono w-full focus:outline-none min-w-[120px]" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {currentMode === 'post' ? (
                        <>
                            <button onClick={() => triggerUpload('body')} className="p-1.5 hover:bg-muted rounded" title="Img"><span className="icon-[ph--image] size-4"></span></button>
                            <button onClick={() => setShowMetaConfig(!showMetaConfig)} className={cn("p-1.5 hover:bg-muted rounded", showMetaConfig && "text-primary")}><span className="icon-[ph--sliders-horizontal] size-4"></span></button>
                        </>
                    ) : (
                        <>
                           <button onClick={() => setEditorMode(editorMode === 'visual' ? 'raw' : 'visual')} className="flex items-center gap-1 p-1.5 hover:bg-muted rounded text-xs font-mono border border-border/50">
                              <span className={cn("icon-[ph--eye] size-4", editorMode === 'visual' && 'text-primary')}></span>
                              <span className="hidden sm:inline">{editorMode === 'visual' ? 'UI' : 'CODE'}</span>
                           </button>
                           {editorMode === 'raw' && <button onClick={() => triggerUpload('json_raw')} className="p-1.5 hover:bg-muted rounded text-xs"><span className="icon-[ph--image] size-4"></span></button>}
                        </>
                    )}
                    <div className="h-4 w-px bg-border/40 mx-1"></div>
                    <button onClick={stageForWrite} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-xs font-mono font-bold hover:opacity-90">
                        <span className="icon-[ph--plus] size-3"></span>
                        <span className="hidden sm:inline">BUFFER</span><span className="sm:hidden">ADD</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative w-full h-full min-h-[300px] flex flex-col overflow-hidden">
                {isFetchingContent && <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center"><span className="icon-[ph--spinner] animate-spin size-8"></span></div>}
                {currentMode === 'post' && (
                    <>
                        {showMetaConfig && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 border-b border-dashed border-border/40 bg-muted/5 text-xs shrink-0 transition-all">
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] text-muted-foreground/60 block mb-1">TITLE</label>
                                  <input value={meta.title} onChange={e=>setMeta({...meta, title: e.target.value})} className="w-full h-9 bg-background border border-border/60 focus:border-primary/60 px-2 font-medium focus:outline-none transition-colors" placeholder="Post Title" />
                                </div>
                                
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] text-muted-foreground/60 block mb-1">DESCRIPTION</label>
                                  <input value={meta.description} onChange={e=>setMeta({...meta, description: e.target.value})} className="w-full h-9 bg-background border border-border/60 focus:border-primary/60 px-2 focus:outline-none transition-colors" placeholder="Short description..." />
                                </div>
                                
                                <div className="sm:col-span-1">
                                  <label className="text-[10px] text-muted-foreground/60 block mb-1">DATE</label>
                                  <input type="date" value={meta.pubDate} onChange={e=>setMeta({...meta, pubDate: e.target.value})} className="w-full h-9 bg-background border border-border/60 focus:border-primary/60 px-2 focus:outline-none uppercase" />
                                </div>
                                
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-muted-foreground/60 block mb-1">TAGS</label>
                                  <input value={meta.tags} onChange={e=>setMeta({...meta, tags: e.target.value})} className="w-full h-9 bg-background border border-border/60 focus:border-primary/60 px-2 text-primary focus:outline-none" placeholder="React, Tech..." />
                                </div>

                                <div className="sm:col-span-1 flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer group h-9 border border-border/60 bg-background px-2 w-full hover:border-primary/50 transition-colors select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={meta.recommend} 
                                            onChange={e => setMeta({...meta, recommend: e.target.checked})}
                                            className="appearance-none size-3 border border-muted-foreground/50 rounded-sm checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                        />
                                        <span className={cn("text-[10px] font-mono font-bold transition-colors", meta.recommend ? "text-primary" : "text-muted-foreground")}>
                                            RECOMMEND
                                        </span>
                                    </label>
                                </div>
                                
                                <div className="sm:col-span-4">
                                  <label className="text-[10px] text-muted-foreground/60 flex justify-between mb-1">
                                    <span>HERO IMAGE</span>
                                    <span onClick={()=>triggerUpload('hero')} className="cursor-pointer hover:text-primary transition-colors">[UPLOAD]</span>
                                  </label>
                                  <input value={meta.heroImage} onChange={e=>setMeta({...meta, heroImage: e.target.value})} className="w-full h-9 bg-background border border-border/60 focus:border-primary/60 px-2 text-muted-foreground focus:outline-none" placeholder="https://..." />
                                </div>
                            </div>
                        )}
                        <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)} className="flex-1 p-4 bg-transparent text-sm font-mono resize-none focus:outline-none custom-scrollbar" placeholder="// Markdown Body..." spellCheck={false}/>
                    </>
                )}
                {currentMode === 'data' && (
                    <>
                        {editorMode === 'visual' ? renderVisualEditor() : (
                            <div className="flex-1 flex flex-col relative">
                                <div className="absolute top-2 right-4 text-[10px] font-mono text-muted-foreground/40 pointer-events-none">RAW JSON MODE</div>
                                <textarea ref={jsonTextareaRef} value={jsonContent} onChange={e => setJsonContent(e.target.value)} className="flex-1 p-4 bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar" spellCheck={false}/>
                            </div>
                        )}
                    </>
                )}
            </div>
         </div>

         {/* 3. BUFFER */}
         <div className={cn("lg:col-span-3 flex-col border border-border/60 bg-muted/5 min-h-[300px] lg:flex", mobileView === 'queue' ? 'flex h-[60vh] lg:h-auto' : 'hidden')}>
            <div className="p-3 border-b border-border/40 flex justify-between items-center bg-muted/10">
              <span className="text-xs font-mono font-bold">BUFFER</span>
              <span className="text-[10px] font-mono text-muted-foreground">{queue.length} OPS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {queue.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground/50 text-xs">
                    <span className="icon-[ph--queue] size-8 block mx-auto mb-2 opacity-30"></span>
                    Buffer is empty
                  </div>
                ) : (
                  queue.map(item => (
                    <div key={item.id} className="relative bg-background border border-border/50 p-3 flex flex-col gap-1 group">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", item.status === 'done' ? 'bg-green-500' : item.status === 'processing' ? 'bg-yellow-500 animate-pulse' : item.type === 'delete' ? 'bg-red-500' : 'bg-primary')}></div>
                        <div className="flex justify-between">
                          <span className={cn("text-[10px] font-bold uppercase", item.type === 'delete' ? 'text-red-500' : 'text-primary')}>
                            {item.type} {item.isDataFile ? 'DATA' : 'POST'}
                          </span>
                          <div className="flex gap-1">
                            {/* 🔥 这里是回读按钮 🔥 */}
                            {item.type === 'write' && (
                                <button onClick={() => loadFromQueue(item)} className="hover:bg-muted/50 p-1 rounded text-primary" title="Edit">
                                  <span className="icon-[ph--pencil-simple] size-3"></span>
                                </button>
                            )}
                            {item.status === 'pending' && (
                                <button onClick={(e)=>removeFromQueue(item.id, e)} className="hover:bg-muted/50 p-1 rounded" title="Remove">
                                  <span className="icon-[ph--x] size-3"></span>
                                </button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-mono truncate" title={item.filename}>{item.filename.split('/').pop()}</div>
                        {item.type === 'write' && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {item.content && item.content.length > 100 ? 
                              `${item.content.substring(0, 100)}...` : 
                              item.content || 'Empty content'}
                          </div>
                        )}
                    </div>
                  ))
                )}
            </div>
            <div className="p-3 border-t">
              <button 
                onClick={processQueue} 
                disabled={isProcessingQueue || queue.length === 0} 
                className={cn(
                  "w-full py-2 text-xs font-bold font-mono hover:opacity-90 transition-all",
                  isProcessingQueue || queue.length === 0 
                    ? "bg-gray-500/20 text-gray-500 cursor-not-allowed" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isProcessingQueue ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="icon-[ph--spinner] animate-spin size-3"></span>
                    PROCESSING...
                  </span>
                ) : (
                  `EXECUTE (${queue.length})`
                )}
              </button>
              {queue.length > 0 && (
                <div className="text-[10px] text-muted-foreground/60 text-center mt-2">
                  All files in one commit • Only triggers 1 build
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}