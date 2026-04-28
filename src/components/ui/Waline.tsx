import React, { useEffect, useRef } from 'react';
import { WALINE_CONFIG } from '~/config';

interface WalineProps {
  path: string;
  className?: string;
}

// 提取：原有的图片压缩与上传逻辑
const compressImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > 1920 || height > 1920) {
          const ratio = Math.min(1920 / width, 1920 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        
        let quality = 0.8;
        const attempt = () => canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Canvas error'));
          if (blob.size <= maxSize || quality <= 0.2) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            quality -= 0.15;
            attempt();
          }
        }, 'image/jpeg', quality);
        attempt();
      };
    };
  });
};

const handleImageUpload = async (file: File) => {
  const MAX_SIZE = 1024 * 1024;
  let fileToUpload = file.size > MAX_SIZE ? await compressImage(file, MAX_SIZE) : file;
  const formData = new FormData();
  formData.append('file', fileToUpload);
  const res = await fetch(WALINE_CONFIG.imgbedURL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WALINE_CONFIG.uploadToken}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).url;
};

export default function Waline({ path, className }: WalineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!WALINE_CONFIG.enableComment || !containerRef.current) return;

    // 1. 动态注入 CSS：放弃 JS 内存变量，改为强依赖真实 DOM 校验，完美兼容 Astro 路由切换
    if (!document.getElementById('waline-core-css')) {
      const link = document.createElement('link');
      link.id = 'waline-core-css'; 
      link.rel = 'stylesheet'; 
      link.href = '/css/waline.css';
      document.head.appendChild(link);
    }
    
    if (!document.getElementById('waline-custom-css')) {
      const style = document.createElement('style');
      style.id = 'waline-custom-css';
      style.innerHTML = `
        #waline { --waline-font-family: inherit !important; --waline-theme-color: hsl(var(--primary)) !important; --waline-active-color: hsl(var(--primary)) !important; --waline-color: hsl(var(--foreground)) !important; --waline-bgcolor: hsl(var(--background)) !important; --waline-border-color: hsl(var(--border) / 0.4) !important; --waline-border-radius: 0.5rem !important; --waline-avatar-radius: 50% !important; }
        .wl-panel:focus-within { background-color: var(--waline-bgcolor) !important; border-color: var(--waline-border-color) !important; }
        .wl-panel { margin: 0rem !important; background-color: var(--waline-bgcolor); border-color: var(--waline-border-color); border-radius: var(--waline-border-radius); }
        .wl-editor { padding: .75em !important; } .wl-action { font-size: 12px !important; }
        .wl-btn { border-radius: .25em !important; font-weight: 500; transition: opacity 0.2s; }
        .wl-btn:hover { opacity: 0.8; } .wl-actions { gap: 0.25rem !important; }
        .wl-header-item { border-bottom: 1px dashed var(--waline-border-color) !important; padding: .5rem 0rem !important; }
        .wl-header { border: none !important; } .wl-cards { padding: 0rem !important; }
        .wl-card-item { padding: 1.5rem 0rem !important; } .wl-meta-head { display: none !important; }
        .wl-quote { border: none !important; }
        .wl-text-number { display: none !important; }
        .wl-avatar { margin-right: 0.75rem !important; }
        .wl-login-nick { display: none !important; }
        #waline .wl-editor:focus, #waline .wl-input:focus { background-color: transparent !important; }
      `;
      document.head.appendChild(style);
    }

    // 2. 初始化 Waline 实例
    const initWaline = () => {
      // @ts-ignore
      if (!window.Waline || !containerRef.current) return;
      // @ts-ignore
      instanceRef.current = window.Waline.init({
        el: containerRef.current,
        serverURL: WALINE_CONFIG.serverURL,
        path: path,
        lang: 'zh',
        dark: 'html.dark',
        emoji: false,
        search: false,
        imageUploader: WALINE_CONFIG.enableImgUpload ? handleImageUpload : false,
        locale: { placeholder: 'Write a comment...' }
      });
    };

    // 确保脚本加载后初始化 (利用 window 全局对象，因为它在页面切换中不会丢失)
    // @ts-ignore
    if (window.Waline) {
      initWaline();
    } else if (!document.getElementById('waline-script')) {
      const script = document.createElement('script');
      script.id = 'waline-script';
      script.src = '/js/waline.umd.js';
      script.onload = initWaline;
      document.head.appendChild(script);
    }

    // 清理函数，防止 React 重渲染导致内存泄漏
    return () => {
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (e) {}
      }
    };
  }, [path]);

  return <div id="waline" ref={containerRef} className={className} />;
}