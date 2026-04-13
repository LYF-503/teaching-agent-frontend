// src/api/upload.ts

import { apiRequest } from './client';

// 上传文件
export async function uploadFile(
  sessionId: string,
  file: File,
  referenceNote?: string
) {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('file', file);
  if (referenceNote) {
    formData.append('reference_note', referenceNote);
  }

  const response = await fetch('http://localhost:8000/v1/upload/file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// 模拟上传（开发用）
export function mockUploadFile(file: File): Promise<{ file_id: string; file_name: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        file_id: `mock-${Date.now()}`,
        file_name: file.name,
      });
    }, 1000);
  });
}