import { cn } from '~/lib/utils';
import { WALINE_CONFIG } from '~/config';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, type SchemaField } from '../types';

export default function JsonEditor() {
  const { 
    filename, editorMode, jsonContent, setJsonContent, 
    parsedJson, setParsedJson, editingItemIndex, setEditingItemIndex, 
    triggerUpload 
  } = useAdmin();

  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newData = [...parsedJson];
    newData[index] = { ...newData[index], [key]: value };
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
  };

  const handleAddItem = () => {
    const schema = SCHEMAS[filename] || [];
    const newItem: any = {};
    schema.forEach((field: SchemaField) => newItem[field.key] = '');
    let newData, newIndex;
    if (filename === 'friends.json') {
        newData = [...parsedJson, newItem]; newIndex = parsedJson.length;
    } else {
        newData = [newItem, ...parsedJson]; newIndex = 0;
    }
    setParsedJson(newData); setJsonContent(JSON.stringify(newData, null, 2)); setEditingItemIndex(newIndex);
  };

  const handleDeleteItem = (index: number) => {
    if(!confirm('CONFIRM DELETION?')) return;
    const newData = parsedJson.filter((_, i) => i !== index);
    setParsedJson(newData); setJsonContent(JSON.stringify(newData, null, 2));
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

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
                        <span className="icon-[ph--arrow-left] size-4 group-hover:-translate-x-1 transition-transform"></span> RETURN_TO_GRID
                    </button>
                    <span className="text-4xl font-black font-mono text-muted-foreground/10 select-none pointer-events-none">{serialId}</span>
                </div>
                <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
                    {schema.map((field: SchemaField) => (
                        <div key={field.key} className="space-y-2 group">
                            <label className="flex justify-between items-end text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 group-focus-within:text-primary transition-colors">
                                <span>{field.label}</span>
                                {field.type === 'image' && WALINE_CONFIG.enableImgUpload && (
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
                        <button onClick={() => handleDeleteItem(editingItemIndex)} className="w-full py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-mono font-bold tracking-widest uppercase rounded-none">DELETE_COMPONENT</button>
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
                {parsedJson.map((item: any, idx: number) => {
                    const iconValue = item.avatar || item.icon;
                    const serialId = `0${idx + 1}`.slice(-2);
                    let iconEl;
                    if (typeof iconValue === 'string') {
                        if (iconValue.startsWith('icon-') || iconValue.includes('icon-[')) {
                            iconEl = <span className={cn(iconValue, "text-xl text-foreground/80")} />;
                        } else if (iconValue) {
                            iconEl = <img src={iconValue} className="size-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="icon" onError={(e) => (e.currentTarget.style.display = 'none')} />;
                        } else { iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>; }
                    } else if (typeof iconValue === 'object') { iconEl = <span className="text-xs font-mono">{iconValue.value}</span>;
                    } else { iconEl = <span className="icon-[ph--cube] text-muted-foreground"/>; }

                    return (
                        <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group relative bg-background border border-border p-4 cursor-pointer hover:border-primary/50 transition-all min-h-[140px] flex flex-col justify-between overflow-hidden">
                            <span className="absolute right-2 top-0 text-5xl font-black text-muted-foreground/[0.04] group-hover:text-primary/[0.05] transition-colors pointer-events-none font-mono select-none">{serialId}</span>
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/0 group-hover:border-primary/60 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/0 group-hover:border-primary/60 transition-colors"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="size-10 bg-muted/10 border border-border/60 flex items-center justify-center rounded-none group-hover:border-primary/30 transition-colors">{iconEl}</div>
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

  return (
    <>
        {editorMode === 'visual' ? renderVisualEditor() : (
            <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[9px] font-mono font-bold px-2 py-1 pointer-events-none z-10 border-l border-b border-primary/30">RAW_JSON_MODE</div>
                <textarea 
                    value={jsonContent} 
                    onChange={e => setJsonContent(e.target.value)} 
                    className="flex-1 p-4 bg-transparent text-[#d4d4d4] text-xs font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar" 
                    spellCheck={false}
                />
            </div>
        )}
    </>
  );
}