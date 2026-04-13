// src/api/dialogue.ts

import { apiRequest } from './client';

// 创建新会话
export async function createSession(userName?: string) {
  const data = await apiRequest<{ data: { session_id: string } }>(
    '/chat/session/start',
    {
      method: 'POST',
      body: JSON.stringify({ user_name: userName || '教师' }),
    }
  );
  return data.data.session_id;
}

// 发送消息
export async function sendMessage(sessionId: string, text: string) {
  const data = await apiRequest<{
    data: {
      reply: string;
      intent_status?: Record<string, any>;
    };
  }>(
    '/chat/message',
    {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, text }),
    }
  );
  return data.data;
}