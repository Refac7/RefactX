import { useState, useCallback } from 'react';
import { DEFAULT_META, type FileType, type EditorMode, type MetaType } from '../types';
import { parseContent, buildContent } from '~/lib/markdown-parser';

/**
 * 管理编辑器相关的状态：文件名、正文、元数据、JSON 内容等
 */
export function useEditorState() {
  const [currentMode, setCurrentMode] = useState<FileType>('post');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [filename, setFilename] = useState('');
  const [body, setBody] = useState('');
  const [meta, setMeta] = useState<MetaType>(DEFAULT_META);
  const [jsonContent, setJsonContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isFetchingContent, setIsFetchingContent] = useState(false);

  const loadPostContent = useCallback((rawContent: string) => {
    const { meta: parsedMeta, body: parsedBody } = parseContent(rawContent);
    setMeta(parsedMeta);
    setBody(parsedBody);
    setCurrentMode('post');
  }, []);

  const loadDataContent = useCallback((content: string) => {
    setCurrentMode('data');
    try {
      const parsed = JSON.parse(content);
      setJsonContent(JSON.stringify(parsed, null, 2));
      setParsedJson(Array.isArray(parsed) ? parsed : []);
      setEditingItemIndex(null);
      setEditorMode('visual');
    } catch {
      setJsonContent(content);
      setEditorMode('raw');
    }
  }, []);

  const resetEditor = useCallback((mode: FileType = 'post') => {
    setCurrentMode(mode);
    setFilename('');
    setBody('');
    setMeta(DEFAULT_META);
    setJsonContent('');
    setParsedJson([]);
    setEditingItemIndex(null);
  }, []);

  const buildMarkdownContent = useCallback(() => {
    return buildContent(meta, body);
  }, [meta, body]);

  const handleUpdateJsonItem = useCallback((index: number, key: string, value: any) => {
    const newData = [...parsedJson];
    newData[index] = { ...newData[index], [key]: value };
    setParsedJson(newData);
    setJsonContent(JSON.stringify(newData, null, 2));
  }, [parsedJson]);

  return {
    currentMode,
    setCurrentMode,
    editorMode,
    setEditorMode,
    filename,
    setFilename,
    body,
    setBody,
    meta,
    setMeta,
    jsonContent,
    setJsonContent,
    parsedJson,
    setParsedJson,
    editingItemIndex,
    setEditingItemIndex,
    isFetchingContent,
    setIsFetchingContent,
    loadPostContent,
    loadDataContent,
    resetEditor,
    buildMarkdownContent,
    handleUpdateJsonItem,
  };
}
