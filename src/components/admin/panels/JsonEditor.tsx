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
    if(!confirm('Are you sure you want to delete this item?')) return;
    const newData = parsedJson.filter((_, i) => i !== index);
    setParsedJson(newData); setJsonContent(JSON.stringify(newData, null, 2));
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  const renderVisualEditor = () => {
    const schema = SCHEMAS[filename] || [];
    if (schema.length === 0) return <div className="p-8 text-center text-muted-foreground text-sm">No visual schema available. Please use Raw Mode.</div>;

    if (editingItemIndex !== null) {
        const item = parsedJson[editingItemIndex] || {};
        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-background">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                    <button onClick={() => setEditingItemIndex(null)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xs hover:bg-muted">
                        <span className="icon-[ph--arrow-left] size-4"></span> Back to List
                    </button>
                    <button onClick={() => handleDeleteItem(editingItemIndex)} className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-xs transition-colors">
                        Delete Item
                    </button>
                </div>
                <div className="mx-auto space-y-6 pb-12">
                    {schema.map((field: SchemaField) => (
                        <div key={field.key} className="space-y-2">
                            <label className="flex justify-between items-center text-sm font-medium text-foreground">
                                <span>{field.label}</span>
                                {field.type === 'image' && WALINE_CONFIG.enableImgUpload && (
                                    <button onClick={() => triggerUpload(`json____${editingItemIndex}___${field.key}`)} className="text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded">Upload Image</button>
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
                                    className="w-full bg-background border border-border/40 p-3 rounded-xs text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px] transition-all"
                                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                                />
                            ) : (
                                <div className="flex gap-4 items-center">
                                    <input 
                                        value={item[field.key] || ''} 
                                        onChange={e => handleUpdateItem(editingItemIndex, field.key, e.target.value)}
                                        className="flex-1 bg-background border border-border/40 p-3 rounded-xs text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                    />
                                    {field.type === 'image' && item[field.key] && !item[field.key].startsWith('icon-') && (
                                        <div className="size-10 shrink-0 rounded-xs border border-border/40 overflow-hidden bg-muted/20">
                                            <img src={item[field.key]} className="size-full object-cover" alt="preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-semibold text-foreground">Items ({parsedJson.length})</span>
                <button onClick={handleAddItem} className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-xs text-sm font-medium hover:bg-foreground/90 transition-colors shadow-xs">
                    <span className="icon-[ph--plus] size-4"></span> Add Item
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {parsedJson.map((item: any, idx: number) => {
                    const iconValue = item.avatar || item.icon;
                    let iconEl;
                    if (typeof iconValue === 'string') {
                        if (iconValue.startsWith('icon-') || iconValue.includes('icon-[')) {
                            iconEl = <span className={cn(iconValue, "text-2xl text-foreground/70")} />;
                        } else if (iconValue) {
                            iconEl = <img src={iconValue} className="size-full object-cover" alt="icon" onError={(e) => (e.currentTarget.style.display = 'none')} />;
                        } else { iconEl = <span className="icon-[ph--cube] text-muted-foreground/50 size-6"/>; }
                    } else if (typeof iconValue === 'object') { iconEl = <span className="text-xs font-mono">{iconValue.value}</span>;
                    } else { iconEl = <span className="icon-[ph--cube] text-muted-foreground/50 size-6"/>; }

                    return (
                        <div key={idx} onClick={() => setEditingItemIndex(idx)} className="group bg-background border border-border/40 rounded-lg p-4 cursor-pointer hover:border-border hover:shadow-xs hover:bg-muted/10 transition-all flex flex-col justify-between">
                            <div className="flex items-start justify-between mb-4">
                                <div className="size-12 bg-muted/30 border border-border/40 rounded-xs flex items-center justify-center overflow-hidden">{iconEl}</div>
                                <span className="icon-[ph--pencil-simple] size-4 text-muted-foreground/30 group-hover:text-foreground transition-colors"></span>
                            </div>
                            <div>
                                <div className="text-sm font-semibold truncate text-foreground mb-1">{item.name || item.title || 'Untitled Item'}</div>
                                <div className="text-xs text-muted-foreground truncate">{item.description || item.date || 'No description'}</div>
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
            <div className="flex-1 flex flex-col relative bg-muted/10">
                <textarea 
                    value={jsonContent} 
                    onChange={e => setJsonContent(e.target.value)} 
                    className="flex-1 p-6 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none custom-scrollbar" 
                    spellCheck={false}
                />
            </div>
        )}
    </>
  );
}