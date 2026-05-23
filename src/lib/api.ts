import axios from 'axios';
import { toast } from 'sonner';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_BASE_URL = BASE;

export const api = axios.create({ baseURL: BASE });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err?.message || 'Request failed';
    toast.error(msg);
    return Promise.reject(err);
  }
);

export interface Conversation {
  id: string;
  title?: string | null;
  status?: 'active' | 'cancelled' | 'completed';
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  tokens?: number;
  latency_ms?: number;
  metadata?: {
    images?: { url: string; mimeType: string }[];
  } | null;
  // local-only (not stored in DB, used for optimistic UI before upload completes)
  localImages?: ImageAttachment[];
}

export interface ImageAttachment {
  id: string;          // uuid for react key
  mimeType: string;
  data: string;        // base64 data URL (includes the "data:...;base64," prefix)
  name: string;
}

export interface InferenceLog {
  id: string;
  conversation_id: string;
  model: string;
  provider: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  status: 'success' | 'error';
  created_at: string;
}

export interface AnalyticsSummary {
  total_inferences?: number;
  avg_latency_ms?: number;
  total_tokens?: number;
  error_rate?: number;
}

export const getConversations = () => api.get<{data: Conversation[]}>(`/api/conversations?_t=${Date.now()}`).then(r => r.data);
export const createConversation = () => api.post<{data: Conversation}>('/api/conversations').then(r => r.data);
export const deleteConversation = (id: string) => api.delete(`/api/conversations/${id}`).then(r => r.data);
export const getMessages = (id: string) => api.get<{data: Message[]}>(`/api/conversations/${id}/messages?_t=${Date.now()}`).then(r => r.data);
export const sendMessage = (
  id: string,
  content: string,
  images?: ImageAttachment[],
  signal?: AbortSignal
) => {
  // Strip "data:image/...;base64," prefix before sending to backend
  const imageParts = (images || []).map(img => ({
    mimeType: img.mimeType,
    data: img.data.replace(/^data:[^;]+;base64,/, '')
  }));
  return api.post<{data: Message}>(
    `/api/conversations/${id}/messages`,
    { role: 'user', content, images: imageParts.length > 0 ? imageParts : undefined },
    { signal }
  ).then(r => r.data);
};

export const getAnalyticsSummary = () => api.get<{data: AnalyticsSummary}>('/api/analytics/summary').then(r => r.data);
export const getLogs = (limit = 200) => api.get<{data: InferenceLog[]}>(`/api/logs?limit=${limit}`).then(r => r.data);
