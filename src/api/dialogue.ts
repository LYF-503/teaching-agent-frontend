// src/api/dialogue.ts

import { apiRequest } from './client';
import { API_BASE_URL } from '../config';

// 类型定义
export interface MessageResponse {
  role: string;
  content: string;
  timestamp: string;
}

export interface AllSessionResponse {
  session_id: string;
  content: string;
}

export interface ChatResponse {
  reply: string;
  intent_status: any;
  session_id: string;
}

// 创建新会话
export async function createSession(userName?: string) {
  const data = await apiRequest<{ session_id: string; message: string }>(
    '/dialogue/session/start',
    {
      method: 'POST',
      body: JSON.stringify({ user_name: userName || '教师' }),
    }
  );
  return data.session_id;
}

// 发送消息 - 流式接收
export async function sendMessage(sessionId: string, text: string, onMessage: (content: string) => void) {
  const response = await fetch(`${API_BASE_URL}/dialogue/chat`, {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`请求失败: ${response.status} - ${error}`);
  }

  // 处理 SSE 响应
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应体');
  }

  let fullReply = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = new TextDecoder('utf-8').decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              fullReply += data.content;
              // 流式返回累积的完整内容
              onMessage(fullReply);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }

  return {
    reply: fullReply,
    intent_status: null,
  };
}


// 发送消息 - 普通非流式接口
export async function sendMessageNormal(sessionId: string, text: string) {
  const response = await fetch(`${API_BASE_URL}/dialogue/intent_message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',    // 明确指定内容类型为 JSON
      'X-Session-ID': sessionId,               // 确保 Header 名称与后端一致
    },
    body: JSON.stringify({ text }),          // 发送原始 JSON 对象
  });

  if (!response.ok) {
    let errorDetail = `请求失败: ${response.status}`;
    try {
      const error = await response.json();
      errorDetail = error.detail || error.message || errorDetail;
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  return data as ChatResponse;
}

// 获取对话历史
export async function getHistory(sessionId: string) {
  const data = await apiRequest<MessageResponse[]>(
    '/dialogue/history',
    {
      method: 'GET',
      headers: {
        'X-Session-ID': sessionId,
      },
    }
  );
  return data;
}

// 获取所有会话概览
export async function getAllSessions() {
  const data = await apiRequest<AllSessionResponse[]>(
    '/dialogue/session_history',
    {
      method: 'GET',
    }
  );
  return data;
}