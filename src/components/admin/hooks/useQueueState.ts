import { useState, useCallback, useEffect } from 'react';
import { type QueueItem, type RemoteFile } from '../types';

const QUEUE_STORAGE_KEY = 'admin_queue_v1';

/**
 * 管理队列和文件操作相关的状态
 */
export function useQueueState() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // 从本地存储恢复队列
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存队列到本地存储
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback((item: QueueItem) => {
    setQueue(prev => {
      const existingIndex = prev.findIndex(p => p.filename === item.filename);
      if (existingIndex !== -1) {
        const newQueue = [...prev];
        newQueue[existingIndex] = item;
        return newQueue;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  const stageForWrite = useCallback(
    (filename: string, content: string, isDataFile: boolean) => {
      const item: QueueItem = {
        id: Date.now().toString(),
        type: 'write',
        filename,
        content,
        status: 'pending',
        isDataFile,
      };
      addToQueue(item);
    },
    [addToQueue]
  );

  const stageForDelete = useCallback(
    (file: RemoteFile) => {
      if (!confirm(`DELETE ${file.name}?`)) return;

      const item: QueueItem = {
        id: Date.now().toString(),
        type: 'delete',
        filename: file.name,
        sha: file.sha,
        status: 'pending',
        isDataFile: false,
      };
      addToQueue(item);
    },
    [addToQueue]
  );

  return {
    queue,
    setQueue,
    remoteFiles,
    setRemoteFiles,
    isLoadingFiles,
    setIsLoadingFiles,
    isProcessingQueue,
    setIsProcessingQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    stageForWrite,
    stageForDelete,
  };
}
