import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '~/lib/utils';
import { WALINE_CONFIG } from '~/config';
import { useAdmin } from '../AdminContext';

interface PostEditorProps {
    showPreview: boolean;
    showMetaConfig: boolean;
}

export default function PostEditor({ showPreview, showMetaConfig }: PostEditorProps) {
  const { body, setBody, meta, setMeta, triggerUpload, stageForWrite } = useAdmin();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(true);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    setBody(newText);
    setTimeout(() => {
        if (textarea) {
            textarea.focus();
            const newCursorPos = start + before.length + selection.length + after.length;
            textarea.setSelectionRange(start === end ? start + before.length : start, newCursorPos);
        }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
            case 'b': e.preventDefault(); insertText('**', '**'); break;
            case 'i': e.preventDefault(); insertText('*', '*'); break;
            case 'k': e.preventDefault(); insertText('[', '](url)'); break;
            case 's': e.preventDefault(); stageForWrite(); break;
        }
    }
  };

  const TOOLBAR_ITEMS = [
      { icon: 'icon-[ph--text-b]', label: 'Bold', action: () => insertText('**', '**'), shortcut: '⌘B' },
      { icon: 'icon-[ph--text-italic]', label: 'Italic', action: () => insertText('*', '*'), shortcut: '⌘I' },
      { icon: 'icon-[ph--text-strikethrough]', label: 'Strike', action: () => insertText('~~', '~~'), shortcut: '' },
      { icon: 'icon-[ph--code]', label: 'Code', action: () => insertText('`', '`'), shortcut: '' },
      { icon: 'icon-[ph--link]', label: 'Link', action: () => insertText('[', '](url)'), shortcut: '⌘K' },
      { icon: 'icon-[ph--quotes]', label: 'Quote', action: () => insertText('> ', ''), shortcut: '' },
      { icon: 'icon-[ph--list-bullets]', label: 'List', action: () => insertText('- ', ''), shortcut: '' },
      { icon: 'icon-[ph--text-h-one]', label: 'H1', action: () => insertText('# ', ''), shortcut: '' },
      { icon: 'icon-[ph--text-h-two]', label: 'H2', action: () => insertText('## ', ''), shortcut: '' },
      ...(WALINE_CONFIG.enableImgUpload ? [{ 
        icon: 'icon-[ph--image]', label: 'Img', action: () => triggerUpload('body'), shortcut: '' 
      }] : []),
  ];

  return (
    <>
        {showMetaConfig && !showPreview && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-border border-b border-border shadow-sm shrink-0">
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
                  {WALINE_CONFIG.enableImgUpload ? (
                    <span onClick={()=>triggerUpload('hero')} className="cursor-pointer text-[9px] font-mono text-primary border border-primary/30 px-1 hover:bg-primary/10 transition-colors uppercase">[Upload_Hero]</span>
                  ) : <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">[UPLOAD_DISABLED]</span>}
                  <input value={meta.heroImage} onChange={e=>setMeta({...meta, heroImage: e.target.value})} className="flex-1 bg-transparent text-xs font-mono text-muted-foreground focus:outline-none rounded-none" placeholder="IMAGE_URL..." />
                </div>
            </div>
        )}
        
        <div className="flex-1 relative flex flex-col min-h-0 bg-background">
            {showPreview ? (
                <div className="absolute inset-0 overflow-y-auto w-full p-8 bg-background text-foreground custom-scrollbar prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
            ) : (
                <textarea 
                    ref={textareaRef} 
                    value={body} 
                    onChange={e => setBody(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-8 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar placeholder:text-muted-foreground/10 text-foreground" 
                    placeholder="// START_ENTRY..." 
                    spellCheck={false}
                />
            )}
        </div>

        {!showPreview && (
            <div className="border-t border-border bg-background shrink-0 transition-all duration-300">
                <div className="flex items-center justify-between h-9 px-2">
                    <button onClick={() => setShowToolbar(!showToolbar)} className="h-full px-2 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
                        <span className={cn("size-3.5 transition-transform icon-[ph--caret-right]", showToolbar ? "rotate-90" : "")}></span>
                    </button>
                    {showToolbar && (
                        <div className="flex-1 flex items-center gap-1 overflow-x-auto custom-scrollbar px-2">
                            {TOOLBAR_ITEMS.map((tool, i) => (
                                <button key={i} onClick={tool.action} className="h-7 px-2 min-w-[32px] flex items-center justify-center gap-1.5 rounded-none hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors text-xs border border-transparent hover:border-primary/20 group">
                                    <span className={cn("size-4", tool.icon)}></span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest px-2 select-none">MD_MODE</div>
                </div>
            </div>
        )}
    </>
  );
}