import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '~/lib/utils';

// --- 配置区域 ---
const REPO_CONFIG = {
  owner: 'Refac7', // 请修改
  repo: 'RefactX',        // 请修改
  branch: 'main',
  pathPrefix: 'src/content/posts/' 
};

// 上传配置 (对应你的 Waline 图床)
const UPLOAD_CONFIG = {
  url: 'https://img.refact.cc/upload?path=root', 
  token: import.meta.env.PUBLIC_UPLOAD_TOKEN || 'YOUR_UPLOAD_TOKEN'
};

const DEFAULT_META = {
  title: '',
  description: '',
  pubDate: new Date().toISOString().split('T')[0],
  author: 'Refact',
  tags: '',
  recommend: false,
  heroImage: 'none',
  heroImageAspectRatio: '16/9'
};

export default function AdminDashboard() {
  // --- 状态定义 ---
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const [filename, setFilename] = useState('');
  const [body, setBody] = useState('Write your content here...');
  const [meta, setMeta] = useState(DEFAULT_META);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // 图片上传状态
  const [showMetaConfig, setShowMetaConfig] = useState(true);

  // 引用 Textarea 以便在光标处插入内容
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 引用隐藏的文件输入框
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 图片处理逻辑 (复用你的 Waline 逻辑) ---
  const compressImage = async (file: File, maxSize = 1024 * 1024) => {
    return new Promise<File>((resolve, reject) => {
      if (file.size <= maxSize) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if(ctx) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }
          let quality = 0.8;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas blob failed'));
                if (blob.size <= maxSize || quality <= 0.1) {
                  resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                } else {
                  quality -= 0.1;
                  tryCompress();
                }
              }, 'image/jpeg', quality);
          };
          tryCompress();
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Compressing & Uploading...');

    try {
      // 1. 压缩
      const compressedFile = await compressImage(file);
      
      // 2. 上传
      const formData = new FormData();
      formData.append('file', compressedFile);
      
      const response = await fetch(UPLOAD_CONFIG.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${UPLOAD_CONFIG.token}` },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      // 3. 插入 Markdown
      insertTextAtCursor(`![](${data.url})`);
      toast.success('Image inserted!', { id: toastId });
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 重置 Input
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    setBody(newValue);

    // 恢复焦点并移动光标
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // --- 自动获取文件名逻辑 ---
  const fetchNextFilename = async (currentPassword: string) => {
    // 只有当文件名为空时才自动获取，避免覆盖用户已输入的内容
    if (filename) return; 

    try {
        const res = await fetch('/api/next-filename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword, config: REPO_CONFIG })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.filename) {
                setFilename(data.filename);
                // 同时把 Title 也可以稍微预设一下，或者留空
                // setMeta(prev => ({ ...prev, title: `New Post ${data.filename}` })); 
            }
        }
    } catch (e) {
        console.error('Failed to auto-fetch filename');
    }
  };

  // --- 辅助逻辑：生成最终文件内容 ---
  const generateFullContent = () => {
    const tagArray = meta.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    const tagsString = `[${tagArray.map(t => `'${t}'`).join(', ')}]`;

    return `---
title: '${meta.title.replace(/'/g, "''")}'
description: '${meta.description.replace(/'/g, "''")}'
pubDate: ${meta.pubDate}
author: '${meta.author}'
tags: ${tagsString}
recommend: ${meta.recommend}
heroImage: ${meta.heroImage}
ogImage: none
heroImageAspectRatio: '${meta.heroImageAspectRatio}'
---

${body}`;
  };

  // --- 基础 Draft/Auth 逻辑 ---
  const loadDraft = () => {
    const draft = localStorage.getItem('admin_draft_v2');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.filename) setFilename(d.filename);
        if (d.body) setBody(d.body);
        if (d.meta) setMeta({ ...DEFAULT_META, ...d.meta });
        toast.success('Restored from draft', { icon: '📂' });
        return true; // 表示加载了草稿
      } catch (e) { console.error(e); }
    }
    return false;
  };

  const saveDraft = () => {
    localStorage.setItem('admin_draft_v2', JSON.stringify({ filename, body, meta }));
    toast.success('Draft Saved');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_simple_pass');
    setPassword('');
    setIsLoggedIn(false);
    toast('Session Terminated', { icon: '🔒' });
  };

  const performLogin = async (pass: string) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });

      if (response.ok) {
        localStorage.setItem('admin_simple_pass', pass);
        setIsLoggedIn(true);
        setPassword(pass); // 确保 state 同步
        toast.success('Access Granted');
        
        // 登录成功逻辑：先尝试加载草稿，如果没有草稿，则去获取新文件名
        const hasDraft = loadDraft();
        if (!hasDraft) {
            fetchNextFilename(pass);
        }
      } else {
        toast.error('Wrong Password');
        localStorage.removeItem('admin_simple_pass');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const savedPass = localStorage.getItem('admin_simple_pass');
    if (savedPass) {
        setPassword(savedPass);
        performLogin(savedPass);
    }
  }, []);

  const handlePublish = async () => {
    if (!filename || !meta.title) return toast.error('Filename and Title required');
    setIsPublishing(true);
    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const finalContent = generateFullContent();

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password,
          filename: finalFilename,
          content: finalContent,
          config: REPO_CONFIG
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      toast.success('Published! Build triggered.');
      localStorage.removeItem('admin_draft_v2');
    } catch (error: any) {
      toast.error(error.message);
      if (error.message.includes('Access Denied')) handleLogout();
    } finally {
      setIsPublishing(false);
    }
  };

  // --- 渲染 ---
  if (!isLoggedIn) {
     // (此处保持之前的登录界面代码不变，为了节省篇幅略去)
     return (
        <div className="max-w-[1400px] mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6">
        <Toaster />
        <div className="w-full max-w-md border border-border/60 bg-background p-8 relative overflow-hidden group">
           <span className="absolute -right-4 -top-6 text-[100px] font-black text-muted-foreground/[0.03] font-mono select-none">Auth</span>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</h2>
             </div>
             <input 
                type="password" 
                className="w-full bg-muted/20 border border-border/50 p-3 font-mono text-sm focus:border-primary/50 focus:outline-none transition-colors mb-4"
                placeholder="ENTER PASSWORD..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performLogin(password)}
                disabled={isValidating}
             />
             <button 
                onClick={() => performLogin(password)}
                disabled={isValidating}
                className="w-full bg-primary text-primary-foreground py-2 font-mono text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
             >
                {isValidating ? 'Verifying...' : 'Unlock'}
             </button>
           </div>
        </div>
      </div>
     );
  }

  return (
    <div className="min-h-[70vh] relative py-12 px-6 sm:px-8 font-sans overflow-hidden max-w-[1400px] mx-auto">
      <Toaster toastOptions={{ style: { background: '#333', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' } }} />

      {/* 隐形文件输入框 */}
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleImageUpload} 
         className="hidden" 
         accept="image/*"
      />

      {/* Header 区域 (保持不变) */}
      <div className="mb-10 relative">
        <div className="flex items-center justify-between pb-2 mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
             // SYSTEM_CONTROLLER // {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-2 cursor-pointer hover:text-red-500 transition-colors" onClick={handleLogout}>
              <span className="font-mono text-[10px] uppercase text-emerald-500 font-bold">Admin_Active</span>
          </div>
        </div>
        <h1 className="text-6xl font-bold tracking-tighter leading-[0.9] -ml-1 mb-6">
           Control<span className="text-primary/80">.</span>
        </h1>
      </div>

      <div className="flex items-end gap-4 mb-6 select-none">
         <span className="font-mono text-4xl font-black text-muted-foreground/10 leading-none -mb-1">01</span>
         <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Editor_Interface</span>
         <div className="h-px bg-gradient-to-r from-border to-transparent flex-1 mb-1.5"></div>
      </div>

      <div className="group relative flex flex-col bg-background border border-border/60 shadow-sm overflow-hidden">
        
        {/* 工具栏 */}
        <div className="flex justify-between items-center p-4 border-b border-border/40 bg-muted/5">
          <div className="flex gap-4 w-full max-w-md items-center">
             <span className="icon-[ph--file-text] size-5 text-muted-foreground"></span>
             <input 
                type="text" 
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Auto-generating filename..."
                className="bg-transparent border-b border-transparent focus:border-primary/50 text-foreground font-mono text-sm w-full focus:outline-none pb-1 placeholder:text-muted-foreground/50"
             />
          </div>
          <div className="flex gap-3 items-center">
             {/* 图片上传按钮 */}
             <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50" 
                title="Insert Image"
             >
                {isUploading ? (
                    <span className="animate-spin size-5 border-2 border-current border-t-transparent rounded-full block"></span>
                ) : (
                    <span className="icon-[ph--image] size-5"></span>
                )}
             </button>

             <div className="h-4 w-px bg-border/40"></div>

             <button onClick={() => setShowMetaConfig(!showMetaConfig)} className={cn("p-2 transition-colors", showMetaConfig ? "text-primary" : "text-muted-foreground")} title="Config">
                <span className="icon-[ph--sliders-horizontal] size-5"></span>
             </button>
             <button onClick={saveDraft} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Save Draft">
                <span className="icon-[ph--floppy-disk] size-5"></span>
             </button>
             <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all text-xs font-mono uppercase tracking-wider disabled:opacity-50"
             >
                {isPublishing ? 'Pushing...' : 'Deploy'}
             </button>
          </div>
        </div>

        {/* 元数据面板 (保持不变) */}
        {showMetaConfig && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 border-b border-dashed border-border/40 bg-muted/5">
                <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-wider">Title</label>
                    <input value={meta.title} onChange={(e) => setMeta({...meta, title: e.target.value})} className="w-full bg-background border border-border/50 p-2 text-sm focus:border-primary/50 focus:outline-none rounded-sm font-bold" />
                </div>
                <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-wider">Description</label>
                    <input value={meta.description} onChange={(e) => setMeta({...meta, description: e.target.value})} className="w-full bg-background border border-border/50 p-2 text-sm focus:border-primary/50 focus:outline-none rounded-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-wider">PubDate</label>
                    <input type="date" value={meta.pubDate} onChange={(e) => setMeta({...meta, pubDate: e.target.value})} className="w-full bg-background border border-border/50 p-2 text-sm focus:border-primary/50 focus:outline-none rounded-sm font-mono" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-wider">Tags</label>
                    <input value={meta.tags} onChange={(e) => setMeta({...meta, tags: e.target.value})} className="w-full bg-background border border-border/50 p-2 text-sm focus:border-primary/50 focus:outline-none rounded-sm font-mono text-primary" placeholder="Me, Tech" />
                </div>
            </div>
        )}

        {/* 正文编辑区 */}
        <div className="relative z-10 flex-1 min-h-[500px] flex flex-col">
           <textarea 
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full flex-1 p-6 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none text-foreground/90 selection:bg-primary/20"
              spellCheck={false}
              placeholder="# Start writing..."
           />
        </div>
      </div>
    </div>
  );
}