import { useCallback } from 'react';

const MAX_FILE_SIZE = 1024 * 1024;

/**
 * 管理文件上传相关的逻辑，包括图片压缩
 */
export function useFileUpload(uploadFile: (file: File) => Promise<string>) {
  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    const scale = Math.sqrt(MAX_FILE_SIZE / file.size);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

    if (!blob) throw new Error('Compression failed');

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
      type: 'image/jpeg',
    });
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const fileToUpload = await compressImage(file);
      const url = await uploadFile(fileToUpload);
      return url;
    },
    [compressImage, uploadFile]
  );

  return {
    handleFileUpload,
    compressImage,
  };
}
