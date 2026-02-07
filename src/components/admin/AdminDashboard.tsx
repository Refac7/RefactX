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

// Schema 定义
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

if (WALINE_CONFIG.enableImgUpload === false) {
  console.warn('图片上传功能已禁用，无法上传图片到图床');
}

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
  if (!CMS_CONFIG.enableCMS) {
    return <div className="min-h-screen flex items-center justify-center text-center text-muted-foreground font-mono text-sm">
      <p>// SYSTEM_OFFLINE // CMS DISABLED</p>
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

  // Layout State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('body');

  useEffect(() => {
    const saved = localStorage.getItem('admin_queue_v1');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        const resetQueue = parsed.map((item: QueueItem) => ({ ...item, status: 'pending' }));
        setQueue(resetQueue); 
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (queue.length > 0) localStorage.setItem('admin_queue_v1', JSON.stringify(queue));
    else localStorage.removeItem('admin_queue_v1');
  }, [queue]);

  useEffect(() => {
    const savedPass = localStorage.getItem('admin_simple_pass');
    if (savedPass) { setPassword(savedPass); performLogin(savedPass); }
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
        toast.success('ACCESS GRANTED');
        fetchRemoteFiles(pass);
      } else {
        setLoginError(true);
        localStorage.removeItem('admin_simple_pass');
        toast.error('ACCESS DENIED');
      }
    } catch (error) { 
      setLoginError(true);
      toast.error('NETWORK ERROR'); 
    } finally { 
      setIsValidating(false); 
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('admin_simple_pass'); 
    localStorage.removeItem('admin_queue_v1');
    setIsLoggedIn(false); 
    setPassword(''); 
    setQueue([]); 
    toast.success('SIGNED_OUT');
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
    } catch (e) { toast.error('SYNC FAILED'); } finally { setIsLoadingFiles(false); }
  };

  const loadFile = async (name: string, isData = false, path?: string) => {
    if ((isData ? jsonContent : body).length > 50 && !confirm("Override current workspace?")) return;
    setIsFetchingContent(true);
    const toastId = toast.loading(`RETRIEVING ${name}...`);
    
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
            toast('FILE_NOT_FOUND // CREATING NEW', { icon: '🆕', id: toastId });
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
                toast.error('JSON_PARSE_ERROR');
            }
        } else {
            const { meta: parsedMeta, body: parsedBody } = parseContent(data.content);
            setFilename(name); setMeta(parsedMeta); setBody(parsedBody);
            setCurrentMode('post');
        }
        setMobileView('editor');
        toast.success('DATA_LOADED', { id: toastId });
    } catch (e) { 
      toast.error('FETCH_ERROR', { id: toastId }); 
    } finally { 
      setIsFetchingContent(false); 
    }
  };

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

    let newData;
    let newIndex;

    if (filename === 'friends.json') {
        newData = [...parsedJson, newItem];
        newIndex = parsedJson.length;
    } else {
        newData = [newItem, ...parsedJson];
        newIndex = 0;
    }

    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
    setEditingItemIndex(newIndex);
  };

  const handleDeleteItem = (index: number) => {
    if(!confirm('CONFIRM DELETION?')) return;
    const newData = parsedJson.filter((_, i) => i !== index);
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  const loadFromQueue = (item: QueueItem) => {
    if (item.type === 'delete') return toast('CANNOT EDIT DELETION', { icon: '🚫' });
    if ((body.length > 20 || jsonContent.length > 20) && !confirm("DISCARD CHANGES?")) return;

    try {
        let displayFilename = item.filename;
        if (displayFilename.includes('/')) displayFilename = displayFilename.split('/').pop() || displayFilename;
        setFilename(displayFilename);

        if (item.isDataFile) {
            setCurrentMode('data');
            setJsonContent(item.content || '');
            try {
                setParsedJson(JSON.parse(item.content || '[]'));
                setEditorMode('visual');
            } catch { setEditorMode('raw'); }
        } else {
            setCurrentMode('post');
            const { meta: m, body: b } = parseContent(item.content || '');
            setMeta(m);
            setBody(b);
        }
        setMobileView('editor');
        toast.success('RESTORED FROM BUFFER');
    } catch (e) { toast.error('BUFFER_PARSE_ERROR'); }
  };

  const stageForWrite = () => {
    let content = '';
    let finalFilename = '';
    
    if (currentMode === 'post') {
        if (!filename || !meta.title) return toast.error('MISSING META');
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
        if (!filename) return toast.error('FILENAME ERROR');
        try { JSON.parse(jsonContent); } catch (e) { return toast.error('INVALID JSON'); }
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
    toast.success('STAGED TO BUFFER');
  };

  const stageForDelete = (file: RemoteFile) => {
    if (!confirm(`DELETE ${file.name}?`)) return;
    setQueue(prev => [...prev, {
        id: Date.now().toString(), type: 'delete', filename: file.name, sha: file.sha, status: 'pending', isDataFile: false
    }]);
    toast.success('MARKED FOR DELETION');
  };

  const removeFromQueue = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const processQueue = async () => {
    if (queue.length === 0) return toast.error('BUFFER EMPTY');
    if (!confirm(`EXECUTE ${queue.length} OPERATIONS?`)) return;
    
    setIsProcessingQueue(true);
    const toastId = toast.loading('PROCESSING BATCH...');

    try {
        const res = await fetch('/api/batch-commit', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password, config: REPO_CONFIG,
                operations: queue.map(item => ({
                    type: item.type, filename: item.filename, content: item.content, sha: item.sha, isDataFile: item.isDataFile
                }))
            }) 
        });

        if (!res.ok) throw new Error('BATCH FAILED');
        setQueue([]);
        localStorage.removeItem('admin_queue_v1'); 
        toast.success(`BATCH COMPLETE // ${queue.length} OPS`, { id: toastId });
        await fetchRemoteFiles();

    } catch (error: any) { 
        toast.error(`ERROR: ${error.message}`, { id: toastId });
    } finally { setIsProcessingQueue(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('UPLOADING...');
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(UPLOAD_CONFIG.url, { 
          method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${UPLOAD_CONFIG.token}` } 
        });
        if (!res.ok) throw new Error('Failed');
        const { url } = await res.json();
        
        const target = uploadTargetRef.current;
        if (target.startsWith('json_')) {
             const [_, indexStr, key] = target.split('___');
             handleUpdateItem(parseInt(indexStr), key, url);
        } else if (target === 'json_raw') {
             const ta = jsonTextareaRef.current;
             if(ta) setJsonContent(ta.value.substring(0, ta.selectionStart) + url + ta.value.substring(ta.selectionEnd));
        } else if (target === 'body') {
            const ta = textareaRef.current;
            if(ta) setBody(ta.value.substring(0, ta.selectionStart) + `![](${url})` + ta.value.substring(ta.selectionEnd));
        } else if (target === 'hero') setMeta(p => ({ ...p, heroImage: url, ogImage: p.ogImage ? p.ogImage : url }));
        else if (target === 'og') setMeta(p => ({ ...p, ogImage: url }));
        
        toast.success('UPLOAD COMPLETE', { id: toastId });
    } catch(e) { toast.error('UPLOAD FAILED', { id: toastId }); } 
    finally { if(fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const triggerUpload = (t: string) => { uploadTargetRef.current = t; fileInputRef.current?.click(); };
  
  const handleNewPost = async () => {
    if ((body+jsonContent).length > 20 && !confirm("CLEAR WORKSPACE?")) return;
    setCurrentMode('post');
    setFilename(''); setBody(''); setMeta(DEFAULT_META);
    try {
        const res = await fetch('/api/next-filename', { 
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, config: REPO_CONFIG }) 
        });
        const d = await res.json();
        if(d.filename) setFilename(d.filename);
    } catch(e) {}
    setMobileView('editor');
    toast('WORKSPACE INITIALIZED', { icon: '✨' });
  };

  // --- Render Visual JSON Editor (Card Style) ---
  const renderVisualEditor = () => {
    const schema = SCHEMAS[filename] || [];
    if (schema.length === 0) return <div className="p-8 text-center text-muted-foreground text-xs font-mono">NO SCHEMA FOUND. USE RAW MODE.</div>;

    if (editingItemIndex !== null) {
        const item = parsedJson[editingItemIndex] || {};
        const serialId = `0${editingItemIndex + 1}`.slice(-2);

        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-dashed border-border">
                    <button onClick={() => setEditingItemIndex(null)} className="group flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground hover:text-primary transition-colors">
                        <span className="icon-[ph--arrow-left] size-4 group-hover:-translate-x-1 transition-transform"></span> 
                        RETURN_TO_GRID
                    </button>
                    <span className="text-4xl font-black font-mono text-muted-foreground/10 select-none pointer-events-none">{serialId}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
                    {schema.map(field => (
                        <div key={field.key} className="space-y-2 group">
                            <label className="flex justify-between items-end text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 group-focus-within:text-primary transition-colors">
                                <span>{field.label}</span>
                                {field.type === 'image' && (
                                    <span onClick={() => triggerUpload(`json____${editingItemIndex}___${field.key}`)} className="cursor-pointer text-xs hover:text-primary hover:underline decoration-dotted transition-colors">[UPLOAD_FILE]</span>
                                )}
                            </label>
                            
                            {field.type === 'textarea' || field.type === 'json' ? (
                                <textarea 
                                    value={typeof item[field.key] === 'object' ? JSON.stringify(item[field.key], null, 2) : item[field.key] || ''} 
                                    onChange={e => {
                                      try {
                                        const newValue = field.type === 'json' ? JSON.parse(e.target.value || '{}') : e.target.value;
                                        handleUpdateItem(editingItemIndex, field.key, newValue);
                                      } catch (err) { if (field.type !== 'json') handleUpdateItem(editingItemIndex, field.key, e.target.value); }
                                    }}
                                    className="w-full bg-muted/5 border border-border p-4 text-sm font-mono focus:border-primary focus:outline-none min-h-[120px] rounded-none transition-colors"
                                    placeholder={`ENTER ${field.label}...`}
                                />
                            ) : (
                                <div className="flex gap-4">
                                    <input 
                                        value={item[field.key] || ''} 
                                        onChange={e => handleUpdateItem(editingItemIndex, field.key, e.target.value)}
                                        className="flex-1 bg-muted/5 border border-border p-3 text-sm font-mono focus:border-primary focus:outline-none rounded-none transition-colors"
                                        placeholder={`ENTER ${field.label}...`}
                                    />
                                    {field.type === 'image' && item[field.key] && !item[field.key].startsWith('icon-') && (
                                        <div className="size-11 shrink-0 border border-border bg-muted/10 p-0.5">
                                            <img src={item[field.key]} className="size-full object-cover" alt="preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <div className="pt-8 border-t border-border/40 mt-4">
                        <button onClick={() => handleDeleteItem(editingItemIndex)} className="w-full py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-mono font-bold tracking-widest uppercase rounded-none">
                            DELETE_COMPONENT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-muted/[0.02]">
            <div className="flex justify-between items-end mb-6 pb-2 border-b border-border/60">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">// COMPONENT_LIST ({parsedJson.length})</span>
                <button onClick={handleAddItem} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs font-mono font-bold hover:opacity-90 transition-opacity rounded-none uppercase tracking-wide">
                    <span className="icon-[ph--plus-bold] size-3.5"></span> ADD_NEW
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedJson.map((item, idx) => {
                    const iconValue = item.avatar || item.icon;
                    const serialId = `0${idx + 1}`.slice(-2);
                    let iconEl;
                    
                    if (typeof iconValue === 'string') {
                        if (iconValue.startsWith('icon-') || iconValue.includes('icon-[')) {
                            iconEl = <span className={cn(iconValue, "text-xl text-foreground/80")} />;
                        } else if (iconValue) {
                            iconEl = <img src={iconValue} className="size-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="icon" onError={(e) => (e.currentTarget.style.display = 'none')} />;
                        } else {
                            iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>;
                        }
                    } else if (typeof iconValue === 'object') {
                        iconEl = <span className="text-xs font-mono">{iconValue.value}</span>;
                    } else {
                        iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>;
                    }

                    return (
                        <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group relative bg-background border border-border p-4 cursor-pointer hover:border-primary/50 transition-all min-h-[140px] flex flex-col justify-between overflow-hidden">
                            {/* Watermark */}
                            <span className="absolute right-2 top-0 text-5xl font-black text-muted-foreground/[0.04] group-hover:text-primary/[0.05] transition-colors pointer-events-none font-mono select-none">{serialId}</span>
                            
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/0 group-hover:border-primary/60 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/0 group-hover:border-primary/60 transition-colors"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div className="size-10 bg-muted/10 border border-border/60 flex items-center justify-center rounded-none group-hover:border-primary/30 transition-colors">
                                    {iconEl}
                                </div>
                                <span className="icon-[ph--pencil-simple] size-4 text-muted-foreground/20 group-hover:text-primary transition-colors"></span>
                            </div>
                            
                            <div className="relative z-10 pt-4">
                                <div className="text-sm font-bold truncate font-sans tracking-tight">{item.name || item.title || 'UNTITLED_UNIT'}</div>
                                <div className="text-[10px] text-muted-foreground truncate font-mono mt-1 opacity-70">{item.description || item.date || 'No data provided'}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // --- Render: Login ---
  if (!isLoggedIn) {
     return (
        <div className="min-h-[80vh] flex items-center justify-center text-foreground font-mono p-4 relative">
            <Toaster position="top-left" toastOptions={{ style: { background: '#111', color: '#fff', marginTop: '100px', marginLeft: '10px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '12px', borderRadius: '0' } }} />
            
            <div className="w-full max-w-sm bg-background border border-border p-1 relative shadow-xl">
                {/* Decorative borders */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

                <div className="bg-muted/5 p-8 border border-border/50 flex flex-col items-center">
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="size-12 bg-primary/10 border border-primary flex items-center justify-center">
                                <span className="icon-[ph--terminal-window] size-6 text-primary"></span>
                            </div>
                        </div>
                        <h1 className="text-xl font-bold tracking-widest uppercase mb-2">Refac7_Core</h1>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Secure Access Required</p>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="relative group">
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                                onKeyDown={e => e.key === 'Enter' && performLogin(password)}
                                className={cn(
                                    "w-full bg-background border p-3 text-center tracking-[0.5em] text-xs focus:outline-none transition-all duration-300 rounded-none",
                                    loginError ? "border-red-500 text-red-500 animate-pulse" : "border-border focus:border-primary text-foreground"
                                )}
                                placeholder="PASSKEY"
                                disabled={isValidating}
                                autoFocus
                            />
                        </div>

                        <button 
                            onClick={() => performLogin(password)} 
                            disabled={isValidating}
                            className={cn(
                                "w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-none border",
                                loginError 
                                    ? "bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500/20" 
                                    : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                            )}
                        >
                            {isValidating ? 'VERIFYING...' : 'ESTABLISH_LINK'}
                        </button>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-dashed border-border/40 w-full flex justify-between text-[9px] text-muted-foreground/40">
                        <span>SYS: ONLINE</span>
                        <span>V.3.5.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- Render: Dashboard ---
  return (
    <div className="text-foreground font-sans min-h-screen flex flex-col relative">
      <Toaster position="top-left" toastOptions={{ style: { background: '#111', color: '#fff', marginTop: '100px', marginLeft: '10px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '12px', borderRadius: '0' } }} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    {/* Hero Header */}
      <div className="relative z-10 border-b border-border/60 bg-background">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 p-6 sm:p-8">
                
                {/* Left: Title Area (8 cols) */}
                <div className="lg:col-span-8 lg:border-r border-border/60 flex flex-col justify-between min-h-[360px]">
                     
                     {/* Top Status Bar */}
                     <div className="flex justify-between items-start mb-8 lg:pr-12 select-none">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                            // SYS_ADMIN // V.3.5
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex relative h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-600"></span>
                            </div>
                            <span className="font-mono text-[10px] uppercase text-foreground font-bold tracking-wider">
                                SYS: ONLINE
                            </span>
                        </div>
                     </div>

                     {/* Main Heading */}
                     <div>
                        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.85] text-foreground -ml-1 select-none">
                            CONSOLE<span className="text-primary">.</span>
                        </h1>
                        <div className="mt-6 flex flex-col gap-2">
                            <div className="h-1 w-12 bg-foreground/10"></div>
                            <p className="text-lg sm:text-xl text-muted-foreground font-light max-w-xl leading-relaxed">
                                Administrator Mode Active.<br/>
                                <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">
                                    Full write access granted to repository.
                                </span>
                            </p>
                        </div>
                     </div>
                </div>

                {/* Right: Stats & Info (4 cols) */}
                <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 border-border/60">
                    
                    {/* Top Info Box */}
                    <div className="flex-1 p-6 sm:p-8 bg-muted/5 border-b border-border/60 lg:border-b border-none xl:border-dashed flex flex-col">
                        <span className="block text-[10px] font-mono uppercase text-muted-foreground/60 tracking-wider mb-4">
                            // CURRENT_SESSION
                        </span>
                        
                        <div className="flex-1 space-y-6">
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-mono block mb-1">Target_Repo</span>
                                <span className="font-mono text-xs text-foreground break-all bg-background border border-border px-2 py-1 inline-block">
                                    {REPO_CONFIG.repo}
                                </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed font-mono border-l-2 border-primary/20 pl-3">
                                RefactX Control Panel.<br/>
                                Centralized content management system.
                            </p>
                        </div>

                        {/* Logout Button */}
                        <div className="mt-8 pt-4 border-t border-dashed border-border/40">
                            <button 
                                onClick={handleLogout} 
                                className="group w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors"
                            >
                                <span>Terminate_Session</span>
                                <span className="icon-[ph--sign-out] size-4 group-hover:translate-x-1 transition-transform"></span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Stats Grid (1px gap style) */}
                    <div className="grid grid-cols-2 bg-border/60 gap-px border-t border-border/60 lg:border-t-0">
                        
                        {/* Modules Count */}
                        <div className="bg-background p-6 flex flex-col items-center justify-center h-32 hover:bg-muted/5 transition-colors group relative">
                            <span className="text-3xl font-mono font-bold text-foreground group-hover:text-primary transition-colors tracking-tighter">
                                {remoteFiles.length.toString().padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-mono uppercase text-muted-foreground mt-2 tracking-widest">
                                Total_Modules
                            </span>
                            {/* Corner Accent */}
                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 bg-primary"></div>
                            </div>
                        </div>

                        {/* Buffer Count */}
                        <div 
                            className="bg-background p-6 flex flex-col items-center justify-center h-32 hover:bg-muted/5 transition-colors group relative cursor-pointer" 
                            onClick={() => setMobileView('queue')}
                        >
                             <span className={cn(
                                 "text-3xl font-mono font-bold tracking-tighter transition-colors", 
                                 queue.length > 0 ? "text-primary animate-pulse" : "text-foreground"
                             )}>
                                 {queue.length.toString().padStart(2, '0')}
                             </span>
                             <span className="text-[9px] font-mono uppercase text-muted-foreground mt-2 tracking-widest">
                                 Buffer_Tasks
                             </span>
                             {/* Corner Accent */}
                             <div className="absolute bottom-0 left-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="w-1.5 h-1.5 bg-primary"></div>
                             </div>
                        </div>

                    </div>
                </div>
            </div>
          </div>
      </div>


      <div className="max-w-[1600px] mx-6 md:mx-8 flex-1 flex flex-col lg:grid lg:grid-cols-12 relative border-x border-border/60 bg-background/90">
          
          {/* Mobile Tabs */}
          <div className="grid grid-cols-3 border-b border-border lg:hidden bg-background">
              {['files', 'editor', 'queue'].map(v => (
                 <button key={v} onClick={() => setMobileView(v as MobileView)} className={cn("py-3 text-[10px] tracking-widest uppercase font-mono border-r last:border-r-0 border-border hover:bg-muted/5 focus:outline-none rounded-none", mobileView === v ? 'bg-primary/10 text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(var(--primary))]' : 'text-muted-foreground')}>
                   {v === 'files' ? 'DATA' : v === 'queue' ? `BUFFER [${queue.length}]` : v}
                 </button>
              ))}
          </div>

          {/* 1. DATA BANK */}
          <div className={cn(
              "flex-col border-b lg:border-b-0 lg:border-r border-border bg-muted/[0.02] transition-all duration-300 relative", 
              mobileView === 'files' ? 'flex h-[65vh] lg:h-auto' : 'hidden',
              showLeftPanel ? 'lg:flex lg:col-span-2' : 'lg:hidden'
          )}>
            <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur sticky top-0 z-10">
                <span className="text-[10px] font-mono font-bold tracking-wider opacity-70 flex items-center gap-2">
                    <span className="size-1.5 bg-foreground"></span> DATA_BANK
                </span>
                <div className="flex gap-2">
                    <button onClick={handleNewPost} className="hover:text-primary transition-colors" title="New Post"><span className="icon-[ph--plus] size-4"></span></button>
                    <button onClick={() => fetchRemoteFiles()} className="hover:text-primary transition-colors" title="Refresh"><span className="icon-[ph--arrows-clockwise] size-4"></span></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <div className="px-3 py-2 bg-muted/10 border-b border-border/40 text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest">Config_Files</div>
                {DATA_FILES.map(f => (
                    <div key={f.name} onClick={() => loadFile(f.name, true, f.path)} className={cn("group flex items-center justify-between text-xs px-3 py-2 border-b border-border/40 cursor-pointer transition-colors", filename === f.name ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground")}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className={cn("icon-[ph--brackets-curly] size-3 shrink-0", filename === f.name ? "text-primary" : "text-muted-foreground/50")}></span>
                            <span className="font-mono truncate uppercase tracking-tight">{f.label}</span>
                        </div>
                    </div>
                ))}

                <div className="px-3 py-2 bg-muted/10 border-y border-border/40 text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest mt-4">Archive_Logs</div>
                {isLoadingFiles ? (
                    <div className="p-4 text-center"><span className="icon-[ph--spinner] animate-spin text-primary size-4"></span></div>
                ) : remoteFiles.map(f => (
                    <div key={f.sha} className={cn("group flex justify-between items-center text-xs px-3 py-2 border-b border-border/40 cursor-pointer transition-colors", filename === f.name ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/5 hover:text-foreground")}>
                        <span onClick={() => loadFile(f.name)} className="font-mono truncate flex-1">{f.name.replace('.md', '')}</span>
                        <button onClick={(e) => { e.stopPropagation(); stageForDelete(f); }} className="text-muted-foreground/30 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><span className="icon-[ph--trash] size-3.5"></span></button>
                    </div>
                ))}
            </div>
          </div>

          {/* 2. WORKSTATION */}
          <div className={cn(
              "flex-col bg-background lg:flex transition-all duration-300 relative z-0", 
              mobileView === 'editor' ? 'flex h-[80vh] lg:h-auto' : 'hidden',
              showLeftPanel && showRightPanel ? "lg:col-span-7" : !showLeftPanel && showRightPanel ? "lg:col-span-9" : showLeftPanel && !showRightPanel ? "lg:col-span-10" : "lg:col-span-12"
          )}>
            {/* Toolbar */}
            <div className="h-10 flex justify-between items-center border-b border-border bg-background relative z-10 px-0">
                <div className="flex items-center h-full flex-1 min-w-0">
                    <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary border-r border-border hover:bg-muted/5 transition-colors">
                      <span className={cn("size-3.5 transition-transform", showLeftPanel ? "" : "rotate-180", "icon-[ph--caret-left]")}></span>
                    </button>
                    <div className="flex-1 flex items-center px-4 gap-2">
                        <span className={cn("size-3.5 text-primary", currentMode === 'data' ? "icon-[ph--brackets-curly]" : "icon-[ph--file-text]")}></span>
                        <input value={filename} onChange={e => setFilename(e.target.value)} disabled={currentMode === 'data'} placeholder="UNTITLED_FILE" className="bg-transparent text-xs font-mono font-bold w-full focus:outline-none tracking-wide placeholder:text-muted-foreground/30 text-foreground" />
                    </div>
                </div>

                <div className="flex items-center h-full">
                    {currentMode === 'post' ? (
                        <>
                            {/* 未启用上传功能时隐藏 */}
                            {WALINE_CONFIG.enableImgUpload && (
                              <button onClick={() => triggerUpload('body')} className="h-full px-3 hover:bg-primary/10 hover:text-primary text-muted-foreground border-l border-border transition-colors"><span className="icon-[ph--image] size-4"></span></button>
                            )}
                            <button onClick={() => setShowMetaConfig(!showMetaConfig)} className={cn("h-full px-3 hover:bg-primary/10 hover:text-primary text-muted-foreground border-l border-border transition-colors", showMetaConfig && "text-primary bg-primary/5")}><span className="icon-[ph--sliders-horizontal] size-4"></span></button>
                        </>
                    ) : (
                        <button onClick={() => setEditorMode(editorMode === 'visual' ? 'raw' : 'visual')} className="h-full px-3 border-l border-border hover:bg-primary/10 text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                          {editorMode === 'visual' ? 'VISUAL' : 'CODE'}
                        </button>
                    )}
                    
                    <button onClick={stageForWrite} className="h-full px-5 bg-primary text-primary-foreground text-[10px] font-mono font-bold hover:bg-primary/90 tracking-widest uppercase transition-all flex items-center gap-2">
                        <span className="icon-[ph--floppy-disk] size-3.5"></span> SAVE
                    </button>

                    <button onClick={() => setShowRightPanel(!showRightPanel)} className="hidden lg:flex h-full w-8 items-center justify-center text-muted-foreground hover:text-primary border-l border-border hover:bg-muted/5 transition-colors">
                      <span className={cn("size-3.5 transition-transform", showRightPanel ? "" : "rotate-180", "icon-[ph--caret-right]")}></span>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative w-full h-full min-h-[400px] flex flex-col overflow-hidden bg-background">
                {isFetchingContent && (
                    <div className="absolute inset-0 bg-background/80 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                        <span className="icon-[ph--spinner] animate-spin size-8 text-primary"></span>
                        <span className="text-xs font-mono uppercase tracking-[0.3em] animate-pulse">Retrieving Data...</span>
                    </div>
                )}
                {currentMode === 'post' && (
                    <>
                        {showMetaConfig && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-border border-b border-border shadow-sm">
                                <div className="sm:col-span-4 bg-background p-2">
                                  <label className="block text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Title</label>
                                  <input value={meta.title} onChange={e=>setMeta({...meta, title: e.target.value})} className="w-full bg-transparent text-sm font-bold focus:outline-none rounded-none placeholder:text-muted-foreground/20" placeholder="ENTER TITLE..." />
                                </div>
                                
                                <div className="sm:col-span-4 bg-background p-2">
                                  <label className="block text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Description</label>
                                  <input value={meta.description} onChange={e=>setMeta({...meta, description: e.target.value})} className="w-full bg-transparent text-xs focus:outline-none rounded-none placeholder:text-muted-foreground/20" placeholder="Brief summary..." />
                                </div>
                                
                                <div className="sm:col-span-1 bg-background p-2">
                                  <label className="block text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Date</label>
                                  <input type="date" value={meta.pubDate} onChange={e=>setMeta({...meta, pubDate: e.target.value})} className="w-full bg-transparent text-xs focus:outline-none rounded-none font-mono" />
                                </div>
                                
                                <div className="sm:col-span-2 bg-background p-2">
                                  <label className="block text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Tags</label>
                                  <input value={meta.tags} onChange={e=>setMeta({...meta, tags: e.target.value})} className="w-full bg-transparent text-xs focus:outline-none rounded-none font-mono text-primary" placeholder="TAG1, TAG2" />
                                </div>

                                <div className="sm:col-span-1 bg-background p-2 flex items-center justify-center">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={meta.recommend} onChange={e => setMeta({...meta, recommend: e.target.checked})} className="size-3 accent-primary rounded-none" />
                                        <span className={cn("text-[10px] font-mono font-bold uppercase", meta.recommend ? "text-primary" : "text-muted-foreground")}>Featured</span>
                                    </label>
                                </div>
                                
                                <div className="sm:col-span-4 bg-background p-2 flex items-center gap-2">
                                  {/* 未启用图床时隐藏上传按钮，直接输入URL */}
                                  {WALINE_CONFIG.enableImgUpload ? (
                                    <span onClick={()=>triggerUpload('hero')} className="cursor-pointer text-[9px] font-mono text-primary border border-primary/30 px-1 hover:bg-primary/10 transition-colors uppercase">[Upload_Hero]</span>
                                  ) : (
                                    <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">[UPLOAD_DISABLED]</span>
                                  )}
                                  <input value={meta.heroImage} onChange={e=>setMeta({...meta, heroImage: e.target.value})} className="flex-1 bg-transparent text-xs font-mono text-muted-foreground focus:outline-none rounded-none" placeholder="IMAGE_URL..." />
                                </div>
                            </div>
                        )}
                        <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)} className="flex-1 p-8 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar placeholder:text-muted-foreground/10" placeholder="// START_ENTRY..." spellCheck={false}/>
                    </>
                )}
                {currentMode === 'data' && (
                    <>
                        {editorMode === 'visual' ? renderVisualEditor() : (
                            <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                                <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[9px] font-mono font-bold px-2 py-1 pointer-events-none z-10 border-l border-b border-primary/30">RAW_JSON_MODE</div>
                                <textarea ref={jsonTextareaRef} value={jsonContent} onChange={e => setJsonContent(e.target.value)} className="flex-1 p-4 bg-transparent text-[#d4d4d4] text-xs font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar" spellCheck={false}/>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>

          {/* 3. BUFFER */}
          <div className={cn(
              "flex-col border-t lg:border-t-0 lg:border-l border-border bg-muted/[0.02] transition-all duration-300 relative", 
              mobileView === 'queue' ? 'flex h-[60vh] lg:h-auto' : 'hidden',
              showRightPanel ? 'lg:flex lg:col-span-3' : 'lg:hidden'
          )}>
            <div className="h-10 px-3 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur sticky top-0 z-10">
              <span className="text-[10px] font-mono font-bold tracking-wider opacity-70 flex items-center gap-2">
                  <span className="size-1.5 bg-yellow-500"></span> STAGING_AREA
              </span>
              <span className="text-[9px] font-mono text-muted-foreground bg-border/40 px-1.5 py-0.5">{queue.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 select-none">
                    <span className="icon-[ph--queue] size-8 block mb-2 opacity-50"></span>
                    <span className="text-[10px] font-mono uppercase tracking-widest">Buffer Clear</span>
                  </div>
                ) : (
                  queue.map(item => (
                    <div key={item.id} className="relative bg-background border border-border p-3 flex flex-col gap-2 group hover:border-primary/40 transition-colors shadow-sm">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", item.status === 'done' ? 'bg-emerald-500' : item.status === 'processing' ? 'bg-yellow-500 animate-pulse' : item.type === 'delete' ? 'bg-red-500' : 'bg-primary')}></div>
                        
                        <div className="flex justify-between items-start pl-2">
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider border px-1", item.type === 'delete' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-primary/30 text-primary bg-primary/5')}>
                            {item.type === 'delete' ? 'DEL' : 'WRI'} : {item.isDataFile ? 'JSON' : 'MD'}
                          </span>
                          <div className="flex gap-1">
                            {item.type === 'write' && (
                                <button onClick={() => loadFromQueue(item)} className="hover:text-primary transition-colors" title="Edit">
                                  <span className="icon-[ph--pencil-simple] size-3.5"></span>
                                </button>
                            )}
                            {item.status === 'pending' && (
                                <button onClick={(e)=>removeFromQueue(item.id, e)} className="hover:text-red-500 transition-colors" title="Drop">
                                  <span className="icon-[ph--x] size-3.5"></span>
                                </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="pl-2">
                              <div className="text-xs font-mono font-bold truncate text-foreground" title={item.filename}>{item.filename.split('/').pop()}</div>
                        </div>
                    </div>
                  ))
                )}
            </div>
            
            <div className="p-4 border-t border-border bg-background">
              <button 
                onClick={processQueue} 
                disabled={isProcessingQueue || queue.length === 0} 
                className={cn(
                  "w-full py-4 text-xs font-bold font-mono uppercase tracking-[0.2em] transition-all relative overflow-hidden group border",
                  isProcessingQueue || queue.length === 0 
                    ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50" 
                    : "bg-foreground text-background border-foreground hover:bg-primary hover:text-white hover:border-primary"
                )}
              >
                {isProcessingQueue ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="icon-[ph--spinner] animate-spin size-3"></span> PROCESSING
                  </span>
                ) : (
                  `COMMIT_CHANGES`
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}