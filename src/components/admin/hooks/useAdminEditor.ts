import { useState, useRef } from 'react'
import { DEFAULT_META, UPLOAD_CONFIG, type FileType, type EditorMode, type MetaType } from '../types'
import type { ToastType } from './useAdminToast'

export function useAdminEditor(showToast: (msg: string, type?: ToastType) => void) {
  const [currentMode, setCurrentMode] = useState<FileType>('post')
  const [editorMode, setEditorMode] = useState<EditorMode>('visual')
  const [filename, setFilename] = useState('')
  const [body, setBody] = useState('')
  const [meta, setMeta] = useState<MetaType>(DEFAULT_META)
  const [jsonContent, setJsonContent] = useState('')
  const [parsedJson, setParsedJson] = useState<any[]>([])
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string>('body')

  const triggerUpload = (target: string) => {
    uploadTargetRef.current = target
    fileInputRef.current?.click()
  }

  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newData = [...parsedJson]
    newData[index] = { ...newData[index], [key]: value }
    setParsedJson(newData)
    setJsonContent(JSON.stringify(newData, null, 2))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    showToast('Uploading file...', 'info')
    try {
      const MAX_SIZE = 1024 * 1024
      let fileToUpload = file
      if (file.size > MAX_SIZE) {
        const img = document.createElement('img')
        img.src = URL.createObjectURL(file)
        await new Promise((resolve) => {
          img.onload = resolve
        })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scale = Math.sqrt(MAX_SIZE / file.size)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
        if (!blob) throw new Error('Compression failed')
        fileToUpload = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
      }
      const formData = new FormData()
      formData.append('file', fileToUpload)
      const uploadUrl = new URL(UPLOAD_CONFIG.url)
      uploadUrl.searchParams.set('path', 'root')

      const res = await fetch(uploadUrl.toString(), {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${UPLOAD_CONFIG.token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const { url } = await res.json()

      const target = uploadTargetRef.current
      if (target.startsWith('json_')) {
        const [_, indexStr, key] = target.split('___')
        handleUpdateItem(parseInt(indexStr), key, url)
      } else if (target === 'json_raw') {
        setJsonContent((prev) => prev + url)
      } else if (target === 'body') {
        setBody((prev) => prev + `![](${url})`)
      } else if (target === 'hero') setMeta((prev) => ({ ...prev, heroImage: url, ogImage: prev.ogImage ? prev.ogImage : url }))
      else if (target === 'og') setMeta((prev) => ({ ...prev, ogImage: url }))

      showToast('Upload successful', 'success')
    } catch (e) {
      showToast('Upload failed', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
    fileInputRef,
    uploadTargetRef,
    triggerUpload,
    handleFileChange,
  }
}
