// src/api/upload.ts

import { API_BASE_URL } from '../config';

export interface UploadResponse {
  file_id: string;
  file_name: string;
  message: string;
}

export interface VoiceUploadResponse {
  text: string;
  session_id: string;
}

// 上传文件
export async function uploadFile(
  sessionId: string,
  file: File,
  referenceNote?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (referenceNote) {
    formData.append('reference_note', referenceNote);
  }

  const response = await fetch(`${API_BASE_URL}/upload/file`, {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionId,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `上传失败: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

// 添加参考说明
export async function updateFileNote(
  sessionId: string,
  fileId: string,
  note: string
) {
  const response = await fetch(`${API_BASE_URL}/upload/file/${fileId}/note`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ note }),
  });

  if (!response.ok) {
    throw new Error(`更新说明失败: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// 获取解析结果
export async function getParsedResult(sessionId: string, fileId: string) {
  const response = await fetch(`${API_BASE_URL}/file/${fileId}/parsed`, {
    method: 'GET',
    headers: {
      'X-Session-ID': sessionId,
    },
  });

  if (!response.ok) {
    throw new Error(`获取解析结果失败: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// 模拟上传（开发用）
export function mockUploadFile(file: File): Promise<UploadResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        file_id: `mock-${Date.now()}`,
        file_name: file.name,
        message: '文件上传成功，后台解析中',
      });
    }, 1000);
  });
}

// 3. 上传知识库文件（不需要 session_id）
export async function uploadKnowledgeBaseFile(
  file: File,
  referenceNote?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (referenceNote) {
    formData.append('reference_note', referenceNote);
  }

  const response = await fetch(`${API_BASE_URL}/upload/knowledge_base_file`, {
    method: 'POST',
    // 不需要 X-Session-ID header
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `上传知识库文件失败: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}



export async function uploadVoice(sessionId: string, audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  // 注意：后端接口字段名为 "audio"
  formData.append('audio', audioBlob, `voice_${Date.now()}.webm`);

  const response = await fetch(`${API_BASE_URL}/input/voice?session_id=${sessionId}`, {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionId,   // 兼容 deps.get_session_id 从 header 获取
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `语音上传失败: ${response.status}`;
    try {
      const error = await response.json();
      errorMsg = error.detail || error.message || errorMsg;
    } catch {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  const data: VoiceUploadResponse = await response.json();
  return data.text;   // 后端返回 { text: "...", session_id: "..." }
}

// 模拟上传（保留用于开发测试）
export function mockUploadVoice(audioBlob: Blob): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTexts = [
        '我想讲初中物理的欧姆定律',
        '重点是电流与电压的关系',
        '需要设计一个互动小游戏',
        '时长大概45分钟',
        '请帮我生成一个探究式的课件',
      ];
      const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
      resolve(randomText);
    }, 1500);
  });
}