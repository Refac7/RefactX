// 文件上传工具库

/**
 * 上传文件到指定的上传服务
 * @param file - 要上传的文件
 * @param token - 上传认证令牌
 * @param url - 上传服务 URL
 * @returns 上传后的文件 URL
 */
export async function uploadFile(
  file: File,
  token: string,
  url: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const uploadUrl = new URL(url);
  uploadUrl.searchParams.set('path', 'root');

  const response = await fetch(uploadUrl.toString(), {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}
