import { useState, useEffect, useCallback } from 'react'
import { REPO_CONFIG, DATA_FILES, DEFAULT_META, type RemoteFile, type QueueItem, type MobileView } from '../types'
import type { ToastType } from './useAdminToast'

export function useAdminFileSystem(
  showToast: (msg: string, type?: ToastType) => void,
  getAuthHeaders: () => any,
  handleLogout: () => void,
  editor: any, // 传入 editor hook 返回的完整对象以获取其状态和设值函数
  setMobileView: (v: MobileView) => void,
  username: string | null
) {
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [isFetchingContent, setIsFetchingContent] = useState(false)

  useEffect(() => {
    const savedQueue = localStorage.getItem('admin_queue_v1')
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin_queue_v1', JSON.stringify(queue))
  }, [queue])

  const parseContent = (raw: string) => {
    try {
      const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
      const match = raw.match(regex)
      if (!match) return { meta: DEFAULT_META, body: raw }
      const yamlBlock = match[1]
      const bodyContent = match[2].trim()
      const extract = (key: string, isString = true) => {
        const regex = new RegExp(`^${key}:\\s*(.*)$`, 'm')
        const m = yamlBlock.match(regex)
        if (!m) return ''
        let val = m[1].trim()
        if (isString && val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/''/g, "'")
        return val
      }
      const tags = extract('tags', false)
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((t) => t.trim().replace(/^'|'$/g, ''))
        .join(', ')
      const newMeta = {
        title: extract('title'),
        description: extract('description'),
        pubDate: extract('pubDate', false),
        author: extract('author'),
        tags: tags,
        recommend: extract('recommend', false) === 'true',
        heroImage: extract('heroImage', false) === 'none' ? '' : extract('heroImage', false),
        ogImage: extract('ogImage', false) === 'none' ? '' : extract('ogImage', false),
        heroImageAspectRatio: extract('heroImageAspectRatio') || '16/9',
      }
      return { meta: { ...DEFAULT_META, ...newMeta }, body: bodyContent }
    } catch (e) {
      return { meta: DEFAULT_META, body: raw }
    }
  }

  const fetchRemoteFiles = useCallback(async () => {
    setIsLoadingFiles(true)
    try {
      const res = await fetch('/api/list-files', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: REPO_CONFIG }),
      })
      if (res.status === 401) throw new Error('UNAUTHORIZED')
      const data = await res.json()
      if (data.files) setRemoteFiles(data.files)
    } catch (e: any) {
      if (e.message === 'UNAUTHORIZED') handleLogout()
      else showToast('Failed to fetch files', 'error')
    } finally {
      setIsLoadingFiles(false)
    }
  }, [getAuthHeaders, handleLogout, showToast])

  const loadFile = async (name: string, isData = false, path?: string) => {
    if ((isData ? editor.jsonContent : editor.body).length > 50 && !confirm('Override current workspace?')) return
    setIsFetchingContent(true)
    try {
      const res = await fetch('/api/get-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(isData ? { config: REPO_CONFIG, absolutePath: path } : { config: REPO_CONFIG, filename: name }),
      })
      if (res.status === 401) throw new Error('UNAUTHORIZED')

      if (res.status === 404 && isData) {
        editor.setFilename(name)
        editor.setJsonContent('[]')
        editor.setParsedJson([])
        editor.setCurrentMode('data')
        editor.setEditorMode('visual')
        editor.setEditingItemIndex(null)
        setMobileView('editor')
        showToast('New data file initialized', 'info')
        return
      }
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({ error: 'Forbidden' }))
        showToast(errData.error || 'You can only access your own posts', 'error')
        return
      }
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()

      if (isData) {
        editor.setFilename(name)
        editor.setCurrentMode('data')
        try {
          const parsed = JSON.parse(data.content)
          editor.setJsonContent(JSON.stringify(parsed, null, 2))
          editor.setParsedJson(Array.isArray(parsed) ? parsed : [])
          editor.setEditingItemIndex(null)
          editor.setEditorMode('visual')
        } catch (e) {
          editor.setJsonContent(data.content)
          editor.setEditorMode('raw')
        }
      } else {
        const { meta: parsedMeta, body: parsedBody } = parseContent(data.content)
        editor.setFilename(name)
        editor.setMeta(parsedMeta)
        editor.setBody(parsedBody)
        editor.setCurrentMode('post')
      }
      setMobileView('editor')
      showToast(`Loaded ${name}`, 'success')
    } catch (e: any) {
      if (e.message === 'UNAUTHORIZED') handleLogout()
      else showToast('Failed to load file', 'error')
    } finally {
      setIsFetchingContent(false)
    }
  }

  const stageForWrite = () => {
    let content = ''
    let finalFilename = ''

    if (editor.currentMode === 'post') {
      if (!editor.filename || !editor.meta.title) {
        showToast('Filename and Title are required', 'error')
        return
      }
      finalFilename = editor.filename.endsWith('.md') ? editor.filename : `${editor.filename}.md`
      content = `---\ntitle: '${editor.meta.title.replace(/'/g, "''")}'\ndescription: '${editor.meta.description.replace(/'/g, "''")}'\npubDate: ${editor.meta.pubDate}\nauthor: '${editor.meta.author}'\ntags: [${editor.meta.tags
        .split(/[,，]/)
        .map((t: string) => `'${t.trim()}'`)
        .filter(Boolean)
        .join(
          ', '
        )}]\nrecommend: ${editor.meta.recommend}\nheroImage: ${editor.meta.heroImage || 'none'}\nogImage: ${editor.meta.ogImage || 'none'}\nheroImageAspectRatio: '${editor.meta.heroImageAspectRatio}'\n---\n\n${editor.body}`
    } else {
      if (!editor.filename) {
        showToast('Filename is required', 'error')
        return
      }
      try {
        JSON.parse(editor.jsonContent)
      } catch (e) {
        showToast('Invalid JSON format', 'error')
        return
      }
      finalFilename = DATA_FILES.find((f) => f.name === editor.filename)?.path || editor.filename
      content = editor.jsonContent
    }

    setQueue((prev) => {
      const newItem: QueueItem = {
        id: Date.now().toString(),
        type: 'write',
        filename: finalFilename,
        content,
        status: 'pending',
        isDataFile: editor.currentMode === 'data',
      }
      const existingIndex = prev.findIndex((p) => p.filename === finalFilename)
      if (existingIndex !== -1) {
        const newQueue = [...prev]
        newQueue[existingIndex] = newItem
        return newQueue
      }
      return [...prev, newItem]
    })
    showToast('Staged for commit', 'success')
  }

  const stageForDelete = (file: RemoteFile) => {
    if (!confirm(`DELETE ${file.name}?`)) return
    setQueue((prev) => {
      const newItem: QueueItem = {
        id: Date.now().toString(),
        type: 'delete',
        filename: file.name,
        sha: file.sha,
        status: 'pending',
        isDataFile: false,
      }
      const existingIndex = prev.findIndex((p) => p.filename === file.name)
      if (existingIndex !== -1) {
        const newQueue = [...prev]
        newQueue[existingIndex] = newItem
        return newQueue
      }
      return [...prev, newItem]
    })
    showToast('Staged for deletion', 'success')
  }

  const processQueue = async () => {
    if (queue.length === 0 || !confirm(`EXECUTE ${queue.length} OPERATIONS?`)) return
    setIsProcessingQueue(true)
    try {
      const res = await fetch('/api/batch-commit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: REPO_CONFIG, operations: queue }),
      })
      if (res.status === 401) throw new Error('UNAUTHORIZED')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'BATCH FAILED' }))
        throw new Error(errData.error || 'BATCH FAILED')
      }
      setQueue([])
      localStorage.removeItem('admin_queue_v1')
      showToast('Operations committed successfully', 'success')
      await fetchRemoteFiles()
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') handleLogout()
      else showToast(error.message || 'Batch commit failed', 'error')
    } finally {
      setIsProcessingQueue(false)
    }
  }

  const handleNewPost = async () => {
    if ((editor.body + editor.jsonContent).length > 20 && !confirm('CLEAR WORKSPACE?')) return
    editor.setCurrentMode('post')
    editor.setFilename('')
    editor.setBody('')
    editor.setMeta({ ...DEFAULT_META, author: username || DEFAULT_META.author })
    showToast('Workspace cleared', 'info')
    try {
      const res = await fetch('/api/next-filename', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: REPO_CONFIG }),
      })
      if (res.status === 401) throw new Error('UNAUTHORIZED')
      const d = await res.json()
      if (d.filename) editor.setFilename(d.filename)
    } catch (e: any) {
      if (e.message === 'UNAUTHORIZED') handleLogout()
    }
    setMobileView('editor')
  }

  const loadFromQueue = (item: QueueItem) => {
    if (item.type === 'delete') return
    if ((editor.body.length > 20 || editor.jsonContent.length > 20) && !confirm('DISCARD CHANGES?')) return
    try {
      let displayFilename = item.filename.includes('/') ? item.filename.split('/').pop() || item.filename : item.filename
      editor.setFilename(displayFilename)
      if (item.isDataFile) {
        editor.setCurrentMode('data')
        editor.setJsonContent(item.content || '')
        try {
          editor.setParsedJson(JSON.parse(item.content || '[]'))
          editor.setEditorMode('visual')
        } catch {
          editor.setEditorMode('raw')
        }
      } else {
        editor.setCurrentMode('post')
        const { meta: m, body: b } = parseContent(item.content || '')
        editor.setMeta(m)
        editor.setBody(b)
      }
      setMobileView('editor')
      showToast('Loaded from queue', 'info')
    } catch (e) {}
  }

  const removeFromQueue = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setQueue((prev) => prev.filter((item) => item.id !== id))
    showToast('Removed from queue', 'info')
  }

  return {
    remoteFiles,
    queue,
    isLoadingFiles,
    isProcessingQueue,
    isFetchingContent,
    fetchRemoteFiles,
    loadFile,
    stageForWrite,
    stageForDelete,
    processQueue,
    handleNewPost,
    loadFromQueue,
    removeFromQueue,
  }
}
