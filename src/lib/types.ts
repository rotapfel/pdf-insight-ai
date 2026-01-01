export type OutputLanguage = 'zh' | 'en';

export interface LLMConfig {
  provider: 'openai-compatible' | 'gemini' | 'anthropic' | 'custom';
  model: string;
  models: string[]; // Array of available models
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
  timeout: number;
  temperature: number;
  maxTokens: number;
  outputLanguage: OutputLanguage;
}

export interface QARecord {
  id: string;
  question: string;
  answer: string;
  createdAt: Date;
}

export interface PDFDocument {
  id: string;
  filename: string;
  uploadedAt: Date;
  extractedText: string;
  textCharCount: number;
  pageCount: number;
  lastSummary?: string;
  qaHistory?: QARecord[];
}

export interface ExtractionProgress {
  current: number;
  total: number;
  status: 'idle' | 'extracting' | 'complete' | 'error';
  message?: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
  };
}

export type SummaryLength = 'short' | 'medium' | 'long';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai-compatible',
  model: 'gpt-4o-mini',
  models: ['gpt-4o-mini'],
  baseUrl: 'https://api.openai.com',
  apiKey: '',
  timeout: 60,
  temperature: 0.7,
  maxTokens: 4096,
  outputLanguage: 'zh',
};

export const PROVIDER_PRESETS: Record<string, Partial<LLMConfig>> = {
  'openai-compatible': {
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini'],
  },
  'gemini': {
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash'],
  },
  'anthropic': {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-haiku-20240307',
    models: ['claude-3-haiku-20240307'],
  },
  'custom': {
    baseUrl: '',
    model: '',
    models: [],
  },
};
