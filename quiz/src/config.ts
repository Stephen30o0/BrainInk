// This file centralizes our API configuration
const isProduction = process.env.NODE_ENV === 'production';
const API_PREFIX = isProduction ? '' : 'http://localhost:3001';

export const API_ENDPOINTS = {
  // For production, these will be relative URLs that point to Next.js API routes
  // For development, they'll point to the local backend server
  CHAT: isProduction ? '/api/kana/chat' : `${API_PREFIX}/api/kana/chat`,
  ANALYZE_IMAGE: isProduction ? '/api/kana/analyze-image' : `${API_PREFIX}/api/kana/analyze-image`,
  GENERATE_AND_EXPLAIN: isProduction ? '/api/kana/generate-and-explain' : `${API_PREFIX}/api/kana/generate-and-explain`,
  UPLOAD_NOTE: isProduction ? '/api/kana/upload-note' : `${API_PREFIX}/api/kana/upload-note`,
  CLEAR_NOTE_CONTEXT: isProduction ? '/api/kana/clear-note-context' : `${API_PREFIX}/api/kana/clear-note-context`,
  PDF_PROXY: isProduction ? '/api/kana/pdf-proxy' : `${API_PREFIX}/api/kana/pdf-proxy`
} as const;
