// src/api/generate.ts

import { apiRequest } from './client';

// 生成课件请求参数
export interface GenerateRequest {
  session_id: string;
  generate_ppt?: boolean;
  generate_word?: boolean;
  generate_game?: boolean;
}

// 生成课件响应
export interface GenerateResponse {
  task_id: string;
  status_url: string;
}

// 生成状态响应
export interface GenerateStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  preview?: {
    ppt_url?: string;
    word_url?: string;
    game_url?: string;
  };
}

// 触发生成
export async function triggerGenerate(
  sessionId: string,
  options?: { ppt?: boolean; word?: boolean; game?: boolean }
): Promise<GenerateResponse> {
  const data = await apiRequest<{ data: GenerateResponse }>('/generate', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      generate_ppt: options?.ppt ?? true,
      generate_word: options?.word ?? true,
      generate_game: options?.game ?? false,
    }),
  });
  return data.data;
}

// 查询生成状态
export async function getGenerateStatus(taskId: string): Promise<GenerateStatusResponse> {
  const data = await apiRequest<{ data: GenerateStatusResponse }>(
    `/generate/status/${taskId}`
  );
  return data.data;
}

// 模拟生成（开发用）
export function mockGenerate(sessionId: string): Promise<GenerateResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        task_id: `mock-task-${Date.now()}`,
        status_url: `/generate/status/mock-task-${Date.now()}`,
      });
    }, 500);
  });
}

// 模拟生成状态轮询（开发用）
export function mockGetGenerateStatus(taskId: string): Promise<GenerateStatusResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 随机返回不同状态，模拟真实过程
      const random = Math.random();
      if (random < 0.3) {
        resolve({ status: 'processing', progress: Math.floor(Math.random() * 60) + 20 });
      } else if (random < 0.8) {
        resolve({ status: 'processing', progress: Math.floor(Math.random() * 40) + 60 });
      } else {
        resolve({
          status: 'completed',
          progress: 100,
          preview: {
            ppt_url: '/static/exports/mock/output.pptx',
            word_url: '/static/exports/mock/教案.docx',
            game_url: '/static/exports/mock/game.html',
          },
        });
      }
    }, 500);
  });
}