// src/api/generate.ts

import { apiRequest } from './client';

// 生成教案请求参数
export interface GenerateLessonPlanRequest {
  topic: string;
  requirements?: string;
  output_filename?: string;
}

// 生成PPT请求参数
export interface GeneratePPTRequest {
  topic: string;
  requirements?: string;
  output_filename?: string;
}

// 生成游戏请求参数
export interface GenerateGameRequest {
  topic: string;
  game_type?: 'quiz' | 'memory' | 'matching';
  requirements?: string;
  output_filename?: string;
}

// 生成结果响应
export interface GenerateResponse {
  file_path: string;
  access_url: string;
}

// 生成教案
export async function generateLessonPlan(
  topic: string,
  requirements?: string,
  output_filename?: string
): Promise<{ success: boolean; message: string; data: GenerateResponse | null }> {
  const response = await apiRequest<{ success: boolean; message: string; data: GenerateResponse | null }>(
    '/generate/lesson-plan/ai',
    {
      method: 'POST',
      body: JSON.stringify({
        topic,
        requirements,
        output_filename,
      }),
    }
  );
  return response;
}

// 生成PPT
export async function generatePPT(
  topic: string,
  requirements?: string,
  output_filename?: string
): Promise<{ success: boolean; message: string; data: GenerateResponse | null }> {
  const response = await apiRequest<{ success: boolean; message: string; data: GenerateResponse | null }>(
    '/generate/ppt/ai',
    {
      method: 'POST',
      body: JSON.stringify({
        topic,
        requirements,
        output_filename,
      }),
    }
  );
  return response;
}

// 生成互动游戏
export async function generateGame(
  topic: string,
  game_type: 'quiz' | 'memory' | 'matching' = 'quiz',
  requirements?: string,
  output_filename?: string
): Promise<{ success: boolean; message: string; data: GenerateResponse | null }> {
  const response = await apiRequest<{ success: boolean; message: string; data: GenerateResponse | null }>(
    '/generate/game/ai',
    {
      method: 'POST',
      body: JSON.stringify({
        topic,
        game_type,
        requirements,
        output_filename,
      }),
    }
  );
  return response;
}
