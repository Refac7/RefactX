import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '~/lib/utils';

// --- 配置区域 ---
const REPO_CONFIG = {
  owner: 'Refac7', // 请修改
  repo: 'RefactX', // 请修改
  branch: 'main',
  pathPrefix: 'src/content/posts/' 
};

// 数据文件定义
const DATA_FILES = [
  { name: 'projects.json', path: 'src/content/data/projects.json', label: 'PROJECTS' },
  { name: 'friends.json', path: 'src/content/data/friends.json', label: 'FRIENDS' },
  { name: 'photos.json', path: 'src/content/data/photos.json', label: 'PHOTOS' }
];

// Schema 定义 (可视化表单结构)
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
    { key: 'icon', label: 'Icon/Image', type: 'image' },
    { key: 'star', label: 'Stars (Override)', type: 'text' },
    { key: 'fork', label: 'Forks (Override)', type: 'text' },
  ],
  'photos.json': [
    { key: 'title', label: 'Album Title', type: 'text' },
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'icon', label: 'Icon (JSON)', type: 'json' },
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

  // --- Auth ---
  useEffect(() => {
    const savedPass = localStorage.getItem('admin_simple_pass');
    if (savedPass) { setPassword(savedPass); performLogin(savedPass); }
  }, []);

  const performLogin = async (pass: string) => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ password: pass }) });
      if (res.ok) {
        localStorage.setItem('admin_simple_pass', pass);
        setIsLoggedIn(true); setPassword(pass);
        toast.success('System Online');
        fetchRemoteFiles(pass);
      } else { toast.error('Auth Failed'); localStorage.removeItem('admin_simple_pass'); }
    } catch { toast.error('Connection Error'); } finally { setIsValidating(false); }
  };

  const handleLogout = () => { localStorage.removeItem('admin_simple_pass'); setIsLoggedIn(false); setPassword(''); };

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
      const res = await fetch('/api/list-files', { method: 'POST', body: JSON.stringify({ password: pass, config: REPO_CONFIG }) });
      const data = await res.json();
      if (data.files) setRemoteFiles(data.files);
    } catch (e) { console.error(e); } finally { setIsLoadingFiles(false); }
  };

  // --- Logic: Load Content (包含 404 处理) ---
  const loadFile = async (name: string, isData = false, path?: string) => {
    if ((isData ? jsonContent : body).length > 50 && !confirm("Replace current content?")) return;
    
    setIsFetchingContent(true);
    const toastId = toast.loading(`Fetching ${name}...`);
    
    const requestBody = isData ? { password, config: REPO_CONFIG, absolutePath: path } : { password, config: REPO_CONFIG, filename: name };

    try {
        const res = await fetch('/api/get-content', { method: 'POST', body: JSON.stringify(requestBody) });
        
        // --- 修复点：处理 404 不存在的情况 ---
        if (res.status === 404 && isData) {
            // 如果是数据文件且不存在，则初始化为空数组，允许用户新建
            setFilename(name);
            setJsonContent('[]');
            setParsedJson([]);
            setCurrentMode('data');
            setEditorMode('visual');
            setEditingItemIndex(null);
            setMobileView('editor');
            toast('File not found remotely. Initialized empty.', { icon: '🆕', id: toastId });
            return;
        }

        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();

        if (isData) {
            setFilename(name);
            setCurrentMode('data');
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
    } catch (e) { toast.error('Failed to fetch. Does it exist?', { id: toastId }); } 
    finally { setIsFetchingContent(false); }
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
        const filtered = prev.filter(p => p.filename !== finalFilename);
        return [...filtered, {
            id: Date.now().toString(), type: 'write', filename: finalFilename,
            content, status: 'pending', isDataFile: currentMode === 'data'
        }];
    });
    
    if (window.innerWidth < 1024) toast.success('Added to Buffer. Check [BUFFER] tab.');
    else toast.success('Added to Buffer');
  };

  const stageForDelete = (file: RemoteFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    setQueue(prev => [...prev.filter(p => p.filename !== file.name), {
        id: Date.now().toString(), type: 'delete', filename: file.name,
        sha: file.sha, status: 'pending'
    }]);
    toast.success(`Marked delete`);
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const processQueue = async () => {
    if (queue.length === 0 || !confirm(`Execute ${queue.length} ops?`)) return;
    setIsProcessingQueue(true);
    for (const item of queue) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q));
        try {
            const reqBody = {
                password, config: REPO_CONFIG,
                content: item.content, action: item.type, sha: item.sha,
                filename: item.filename, 
                isAbsolutePath: item.isDataFile || item.filename.includes('/') 
            };
            const res = await fetch('/api/publish', { method: 'POST', body: JSON.stringify(reqBody) });
            if (!res.ok) throw new Error('Error');
            setQueue(prev => prev.filter(q => q.id !== item.id));
        } catch (error) { setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q)); }
    }
    setIsProcessingQueue(false);
    toast.success('Batch Complete');
    fetchRemoteFiles();
  };

  // --- Upload ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading...');
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(UPLOAD_CONFIG.url, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${UPLOAD_CONFIG.token}` } });
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
    } catch(e) { toast.error('Error', { id: toastId }); }
    finally { if(fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const triggerUpload = (t: string) => { uploadTargetRef.current = t; fileInputRef.current?.click(); };
  
  const handleNewPost = async () => {
    if ((body+jsonContent).length > 20 && !confirm("Clear workspace?")) return;
    setCurrentMode('post');
    setFilename(''); setBody(''); setMeta(DEFAULT_META);
    try {
        const res = await fetch('/api/next-filename', { method: 'POST', body: JSON.stringify({ password, config: REPO_CONFIG }) });
        const d = await res.json();
        if(d.filename) setFilename(d.filename);
    } catch(e){}
    setMobileView('editor');
    toast('New Post Ready', { icon: '✨' });
  };

  // --- Render Visual JSON ---
  const renderVisualEditor = () => {
    const schema = SCHEMAS[filename] || [];
    if (schema.length === 0) return <div className="p-8 text-center text-muted-foreground text-xs font-mono">No schema for this file. Use CODE mode to edit.</div>;

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
                                    value={typeof item[field.key] === 'object' ? JSON.stringify(item[field.key], null, 2) : item[field.key]} 
                                    onChange={e => handleUpdateItem(editingItemIndex, field.key, field.type === 'json' ? JSON.parse(e.target.value || '{}') : e.target.value)}
                                    className="w-full bg-muted/20 border border-border/50 p-2 text-sm rounded font-mono focus:border-primary/50 focus:outline-none min-h-[100px]"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input 
                                        value={item[field.key] || ''} 
                                        onChange={e => handleUpdateItem(editingItemIndex, field.key, e.target.value)}
                                        className="w-full bg-muted/20 border border-border/50 p-2 text-sm rounded font-mono focus:border-primary/50 focus:outline-none"
                                    />
                                    {field.type === 'image' && item[field.key] && (
                                        <div className="size-9 shrink-0 border border-border rounded overflow-hidden">
                                            <img src={item[field.key]} className="size-full object-cover" alt="preview"/>
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
                {parsedJson.map((item, idx) => (
                    <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group bg-background border border-border/60 p-3 rounded cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all relative">
                        <div className="flex items-start gap-3">
                            {(item.avatar || item.icon) && (
                                <div className="size-10 bg-muted/20 rounded-full overflow-hidden shrink-0 border border-border flex items-center justify-center">
                                    {typeof (item.avatar || item.icon) === 'string' ? (
                                        <img src={item.avatar || item.icon} className="size-full object-cover" alt="icon" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    ) : (
                                        <span className="text-xs">JSON</span>
                                    )}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="text-sm font-bold truncate">{item.name || item.title || 'Untitled'}</div>
                                <div className="text-xs text-muted-foreground truncate">{item.description || item.date || 'No description'}</div>
                            </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="icon-[ph--pencil-simple] size-4 text-primary"></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // --- Render ---
  if (!isLoggedIn) {
     return <div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-sm border p-8"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 mb-4" placeholder="TOKEN"/><button onClick={()=>performLogin(password)} className="w-full bg-primary text-white py-2">CONNECT</button></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 lg:p-6 flex flex-col">
      <Toaster toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333', fontFamily: 'monospace' } }} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-border/40 pb-4 shrink-0 gap-4 sm:gap-0">
         <div>
            <div className="text-[10px] font-mono text-muted-foreground/60 mb-1">// SYSTEM_ADMIN // V.3.2</div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center<span className="text-primary">.</span></h1>
         </div>
         <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono text-muted-foreground">REPO</div>
                <div className="text-sm font-mono truncate max-w-[120px]">{REPO_CONFIG.repo}</div>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400 font-mono border border-red-500/20 px-3 py-1 bg-red-500/5">EXIT</button>
         </div>
      </header>

      {/* Mobile Tabs */}
      <div className="flex lg:hidden mb-4 border border-border/60 bg-muted/5 font-mono text-xs">
          {['files', 'editor', 'queue'].map(v => (
             <button key={v} onClick={() => setMobileView(v as MobileView)} className={cn("flex-1 py-2 border-r border-border/40 text-center uppercase", mobileView === v ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground')}>{v === 'files' ? 'DATA' : v === 'queue' ? `BUFFER [${queue.length}]` : v}</button>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border-b border-dashed border-border/40 bg-muted/5 text-xs max-h-[200px] overflow-y-auto shrink-0">
                                <div className="sm:col-span-2"><label className="text-[10px] text-muted-foreground/60 block">TITLE</label><input value={meta.title} onChange={e=>setMeta({...meta, title: e.target.value})} className="w-full bg-background border p-1" /></div>
                                <div className="sm:col-span-2"><label className="text-[10px] text-muted-foreground/60 block">DESC</label><input value={meta.description} onChange={e=>setMeta({...meta, description: e.target.value})} className="w-full bg-background border p-1" /></div>
                                <div><label className="text-[10px] text-muted-foreground/60 block">DATE</label><input type="date" value={meta.pubDate} onChange={e=>setMeta({...meta, pubDate: e.target.value})} className="w-full bg-background border p-1" /></div>
                                <div><label className="text-[10px] text-muted-foreground/60 block">TAGS</label><input value={meta.tags} onChange={e=>setMeta({...meta, tags: e.target.value})} className="w-full bg-background border p-1 text-primary" /></div>
                                <div className="sm:col-span-2"><label className="text-[10px] text-muted-foreground/60 flex justify-between"><span>HERO</span><span onClick={()=>triggerUpload('hero')} className="cursor-pointer hover:text-primary">[UP]</span></label><input value={meta.heroImage} onChange={e=>setMeta({...meta, heroImage: e.target.value})} className="w-full bg-background border p-1 text-muted-foreground" /></div>
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
            <div className="p-3 border-b border-border/40 flex justify-between items-center bg-muted/10"><span className="text-xs font-mono font-bold">BUFFER</span><span className="text-[10px] font-mono text-muted-foreground">{queue.length} OPS</span></div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {queue.map(item => (
                    <div key={item.id} className="relative bg-background border border-border/50 p-3 flex flex-col gap-1 group">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", item.status === 'done' ? 'bg-green-500' : item.status === 'processing' ? 'bg-yellow-500 animate-pulse' : item.type === 'delete' ? 'bg-red-500' : 'bg-primary')}></div>
                        <div className="flex justify-between"><span className={cn("text-[10px] font-bold uppercase", item.type === 'delete' ? 'text-red-500' : 'text-primary')}>{item.type} {item.isDataFile ? 'DATA' : 'POST'}</span>{item.status === 'pending' && <button onClick={()=>removeFromQueue(item.id)}><span className="icon-[ph--x] size-3"></span></button>}</div>
                        <div className="text-xs font-mono truncate" title={item.filename}>{item.filename.split('/').pop()}</div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t"><button onClick={processQueue} disabled={isProcessingQueue || queue.length === 0} className="w-full bg-primary text-primary-foreground py-2 text-xs font-bold font-mono hover:opacity-90 disabled:opacity-50">{isProcessingQueue ? 'SENDING...' : 'EXECUTE'}</button></div>
         </div>
      </div>
    </div>
  );
}