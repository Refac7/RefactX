import { useCallback } from 'react';
import { REPO_CONFIG, UPLOAD_CONFIG, type RemoteFile } from '../types';

/**
 * 管理所有 API 调用相关的逻辑
 */
export function useApiCalls(getAuthHeaders: () => Record<string, string>) {
  const fetchRemoteFiles = useCallback(async () => {
    const res = await fetch('/api/list-files', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ config: REPO_CONFIG }),
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    const data = await res.json();
    return data.files || [];
  }, [getAuthHeaders]);

  const fetchFileContent = useCallback(
    async (filename: string, isData?: boolean, path?: string) => {
      const res = await fetch('/api/get-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(
          isData ? { config: REPO_CONFIG, absolutePath: path } : { config: REPO_CONFIG, filename }
        ),
      });

      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (res.status === 404 && isData) {
        return { content: '[]', sha: undefined };
      }

      if (!res.ok) {
        throw new Error('Fetch failed');
      }

      return res.json();
    },
    [getAuthHeaders]
  );

  const generateNextFilename = useCallback(async () => {
    const res = await fetch('/api/next-filename', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ config: REPO_CONFIG }),
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    const data = await res.json();
    return data.filename || '';
  }, [getAuthHeaders]);

  const submitBatchCommit = useCallback(
    async (operations: any[]) => {
      const res = await fetch('/api/batch-commit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: REPO_CONFIG, operations }),
      });

      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (!res.ok) {
        throw new Error('BATCH FAILED');
      }

      return res.json();
    },
    [getAuthHeaders]
  );

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = new URL(UPLOAD_CONFIG.url);
    uploadUrl.searchParams.set('path', 'root');

    const res = await fetch(uploadUrl.toString(), {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${UPLOAD_CONFIG.token}` },
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const data = await res.json();
    return data.url;
  }, []);

  return {
    fetchRemoteFiles,
    fetchFileContent,
    generateNextFilename,
    submitBatchCommit,
    uploadFile,
  };
}
