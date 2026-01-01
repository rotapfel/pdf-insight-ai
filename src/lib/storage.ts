import { LLMConfig, PDFDocument, DEFAULT_LLM_CONFIG } from './types';

const LLM_CONFIG_KEY = 'pdf-extractor-llm-config';
const DOCUMENTS_KEY = 'pdf-extractor-documents';

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save LLM config');
  }
}

export function loadLLMConfig(): LLMConfig {
  try {
    const stored = localStorage.getItem(LLM_CONFIG_KEY);
    if (stored) {
      const parsed = { ...DEFAULT_LLM_CONFIG, ...JSON.parse(stored) };
      // Ensure models array exists for backward compatibility
      if (!parsed.models || parsed.models.length === 0) {
        parsed.models = parsed.model ? [parsed.model] : DEFAULT_LLM_CONFIG.models;
      }
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load LLM config');
  }
  return DEFAULT_LLM_CONFIG;
}

export function clearLLMConfig(): void {
  try {
    localStorage.removeItem(LLM_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear LLM config');
  }
}

export function hasValidAPIKey(): boolean {
  const config = loadLLMConfig();
  return Boolean(config.apiKey && config.apiKey.trim().length > 0);
}

export function saveDocument(doc: PDFDocument): void {
  try {
    const docs = loadDocuments();
    const existingIndex = docs.findIndex(d => d.id === doc.id);
    if (existingIndex >= 0) {
      docs[existingIndex] = doc;
    } else {
      docs.unshift(doc);
    }
    // Keep only last 10 documents
    const trimmed = docs.slice(0, 10);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save document');
  }
}

export function loadDocuments(): PDFDocument[] {
  try {
    const stored = localStorage.getItem(DOCUMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load documents');
  }
  return [];
}

export function clearDocuments(): void {
  try {
    localStorage.removeItem(DOCUMENTS_KEY);
  } catch (error) {
    console.error('Failed to clear documents');
  }
}
