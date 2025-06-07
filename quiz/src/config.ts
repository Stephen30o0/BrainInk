// This file centralizes our API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/kana/chat`,
  ANALYZE_IMAGE: `${API_BASE_URL}/api/kana/analyze-image`,
  GENERATE_AND_EXPLAIN: `${API_BASE_URL}/api/kana/generate-and-explain`,
  UPLOAD_NOTE: `${API_BASE_URL}/api/kana/upload-note`,
  CLEAR_NOTE_CONTEXT: `${API_BASE_URL}/api/kana/clear-note-context`,
  PDF_PROXY: `${API_BASE_URL}/api/kana/pdf-proxy`
} as const;
