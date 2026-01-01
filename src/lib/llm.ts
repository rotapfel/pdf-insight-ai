import { LLMConfig, LLMResponse, SummaryLength } from './types';

const CHUNK_SIZE = 50000; // ~50k characters per chunk
const MAX_CHUNKS_FOR_QA = 3;

// Prompts
const SUMMARY_SYSTEM_PROMPT = `你是一个专业的文档总结助手。你只能基于用户提供的 extractedText 进行总结，绝对不能引入任何外部知识或信息。

你的输出必须包含：
1. **核心要点**：以清晰的要点列表形式总结文档的主要内容
2. **关键结论**：提炼文档中最重要的结论或发现
3. **文档结构**（可选）：如果文档有明显的章节结构，简要列出

如果文档内容不清晰或无法理解，请如实说明。`;

const QA_SYSTEM_PROMPT = `你是一个专业的文档问答助手。你只能基于用户提供的 extractedText 回答问题，绝对不能引入任何外部知识或信息。

重要规则：
1. 如果问题的答案在文档中有明确内容，请详细回答
2. 如果文档中没有足够信息回答这个问题，请明确回答："文档中没有足够信息回答这个问题"
3. 当无法回答时，请建议用户应该在文档中查找什么关键词或章节

请用中文回答。`;

const LENGTH_INSTRUCTIONS: Record<SummaryLength, string> = {
  short: '请用100-200字进行简洁总结。',
  medium: '请用300-500字进行适中长度的总结。',
  long: '请用800-1200字进行详细总结。',
};

function chunkText(text: string, chunkSize: number = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at a paragraph or sentence
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', end);
      const lastSentence = text.lastIndexOf('。', end);
      const lastPeriod = text.lastIndexOf('.', end);
      
      if (lastParagraph > start + chunkSize / 2) {
        end = lastParagraph;
      } else if (lastSentence > start + chunkSize / 2) {
        end = lastSentence + 1;
      } else if (lastPeriod > start + chunkSize / 2) {
        end = lastPeriod + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  
  return chunks;
}

function selectRelevantChunks(chunks: string[], question: string, maxChunks: number): string[] {
  // Simple keyword-based relevance scoring
  const keywords = question
    .toLowerCase()
    .replace(/[？?。，,！!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1);
  
  const scored = chunks.map((chunk, index) => {
    const lowerChunk = chunk.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      const matches = (lowerChunk.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    }
    
    return { chunk, score, index };
  });
  
  // Sort by score descending, then by original order
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });
  
  return scored.slice(0, maxChunks).map(s => s.chunk);
}

async function callOpenAICompatible(
  config: LLMConfig,
  messages: { role: string; content: string }[]
): Promise<LLMResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout * 1000);

  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/v1/chat/completions`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('认证失败：请检查 API Key 是否正确');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁：已触发速率限制，请稍后重试');
      } else if (response.status === 404) {
        throw new Error(`模型不存在：${config.model}，请在设置中选择有效的模型`);
      } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        throw new Error('服务暂时不可用，请稍后重试');
      }
      
      throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API 返回了空响应');
    }

    return {
      content,
      tokenUsage: data.usage ? {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
      } : undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`请求超时：超过 ${config.timeout} 秒未响应`);
    }
    
    throw error;
  }
}

export async function summarizeText(
  text: string,
  config: LLMConfig,
  length: SummaryLength = 'medium',
  onChunkProgress?: (current: number, total: number) => void
): Promise<LLMResponse> {
  const chunks = chunkText(text);
  const needsChunking = chunks.length > 1;
  
  if (!needsChunking) {
    const messages = [
      { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: `${LENGTH_INSTRUCTIONS[length]}\n\nextractedText:\n${text}` },
    ];
    
    return callOpenAICompatible(config, messages);
  }
  
  // Multi-chunk summarization
  const chunkSummaries: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    onChunkProgress?.(i + 1, chunks.length);
    
    const messages = [
      { role: 'system', content: '你是一个文档总结助手。请简洁总结以下文档片段的要点。只基于提供的内容，不引入外部知识。' },
      { role: 'user', content: `这是文档的第 ${i + 1}/${chunks.length} 部分，请总结：\n\n${chunks[i]}` },
    ];
    
    const result = await callOpenAICompatible(config, messages);
    chunkSummaries.push(result.content);
  }
  
  // Final merge
  const mergeMessages = [
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: `${LENGTH_INSTRUCTIONS[length]}\n\n以下是文档各部分的摘要，请合并成一个完整的总结：\n\n${chunkSummaries.join('\n\n---\n\n')}` },
  ];
  
  return callOpenAICompatible(config, mergeMessages);
}

export async function askQuestion(
  text: string,
  question: string,
  config: LLMConfig
): Promise<LLMResponse> {
  const chunks = chunkText(text);
  let contextText = text;
  
  if (chunks.length > 1) {
    const relevantChunks = selectRelevantChunks(chunks, question, MAX_CHUNKS_FOR_QA);
    contextText = relevantChunks.join('\n\n---\n\n');
  }
  
  const messages = [
    { role: 'system', content: QA_SYSTEM_PROMPT },
    { role: 'user', content: `问题：${question}\n\nextractedText:\n${contextText}` },
  ];
  
  return callOpenAICompatible(config, messages);
}

export async function testConnection(config: LLMConfig): Promise<{ success: boolean; message: string }> {
  try {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "OK" if you can read this.' },
    ];
    
    await callOpenAICompatible(
      { ...config, timeout: 15, maxTokens: 10 },
      messages
    );
    
    return { success: true, message: '连接成功！API 配置正确。' };
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' };
  }
}

export function getChunkingInfo(textLength: number): { needsChunking: boolean; chunks: number; message: string } {
  const chunks = Math.ceil(textLength / CHUNK_SIZE);
  const needsChunking = chunks > 1;
  
  if (!needsChunking) {
    return { needsChunking: false, chunks: 1, message: '' };
  }
  
  return {
    needsChunking: true,
    chunks,
    message: `文本较长（${(textLength / 1000).toFixed(1)}k 字符），将分 ${chunks} 块处理`,
  };
}
