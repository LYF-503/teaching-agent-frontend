// src/api/client.ts

const BASE_URL = 'http://localhost:8000/v1';

// 通用的请求函数
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('API Error:', error);
    throw new Error(`请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data;
}