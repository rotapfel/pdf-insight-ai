import { useState } from 'react';
import { Sparkles, MessageCircle, Loader2, AlertCircle, Copy, Check, Settings, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { summarizeText, askQuestion, getChunkingInfo } from '@/lib/llm';
import { loadLLMConfig, hasValidAPIKey } from '@/lib/storage';
import { QAHistory } from '@/components/QAHistory';
import { SummaryHistory } from '@/components/SummaryHistory';
import { MaximizeWrapper } from '@/components/MaximizeWrapper';
import type { SummaryLength, QARecord } from '@/lib/types';
import { format } from 'date-fns';

interface LLMOperationsProps {
  extractedText: string;
  qaHistory: QARecord[];
  documentName?: string;
  onSummaryComplete?: (summary: string) => void;
  onQAComplete?: (question: string, answer: string) => void;
}

const DEMO_QUESTIONS = [
  '这篇文档的核心结论是什么？',
  '列出关键概念及定义',
  '归纳主要理论框架或实验的流程/步骤',
  '可能的应用有哪些',
  '有哪些思想启发',
  '可能的扩展有哪些',
];

export function LLMOperations({ extractedText, qaHistory, documentName, onSummaryComplete, onQAComplete }: LLMOperationsProps) {
  const { toast } = useToast();
  
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [chunkProgress, setChunkProgress] = useState<string | null>(null);
  
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  
  const config = loadLLMConfig();
  const hasAPIKey = hasValidAPIKey();
  const chunkingInfo = getChunkingInfo(extractedText.length);

  const handleSummarize = async () => {
    if (!hasAPIKey) {
      toast({
        title: '未配置 API Key',
        description: '请先在设置页面配置 LLM API',
        variant: 'destructive',
      });
      return;
    }

    setIsSummarizing(true);
    setSummary(null);
    setChunkProgress(null);

    try {
      const result = await summarizeText(
        extractedText,
        config,
        summaryLength,
        (current, total) => {
          setChunkProgress(`处理中：${current}/${total} 块`);
        }
      );
      
      setSummary(result.content);
      onSummaryComplete?.(result.content);
      toast({
        title: '总结完成',
        description: '已成功生成文档总结',
      });
    } catch (error: any) {
      toast({
        title: '总结失败',
        description: error.message || '请检查网络连接和 API 配置',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
      setChunkProgress(null);
    }
  };

  const handleAsk = async (q?: string) => {
    const questionToAsk = q || question.trim();
    if (!questionToAsk) return;
    
    if (!hasAPIKey) {
      toast({
        title: '未配置 API Key',
        description: '请先在设置页面配置 LLM API',
        variant: 'destructive',
      });
      return;
    }

    setIsAsking(true);
    setAnswer(null);
    setQuestion(questionToAsk);

    try {
      const result = await askQuestion(extractedText, questionToAsk, config);
      setAnswer(result.content);
      onQAComplete?.(questionToAsk, result.content);
    } catch (error: any) {
      toast({
        title: '问答失败',
        description: error.message || '请检查网络连接和 API 配置',
        variant: 'destructive',
      });
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'summary' | 'answer') => {
    await navigator.clipboard.writeText(text);
    if (type === 'summary') {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  const exportToMarkdown = () => {
    let content = `# ${documentName || 'PDF文档'} - 文档分析报告\n\n`;
    content += `导出时间: ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    if (summary) {
      content += `## 文档总结\n\n${summary}\n\n`;
    }
    
    if (qaHistory.length > 0) {
      content += `## 问答历史\n\n`;
      qaHistory.forEach((record, index) => {
        content += `### 问题 ${index + 1}\n\n`;
        content += `**Q:** ${record.question}\n\n`;
        content += `**A:** ${record.answer}\n\n`;
        content += `---\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName || 'document'}-report-${format(new Date(), 'yyyyMMdd-HHmm')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasAPIKey) {
    return (
      <Card variant="outlined" className="border-warning/50">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">未配置 API Key</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              需要配置 LLM API 才能使用总结和问答功能
            </p>
          </div>
          <Button asChild>
            <Link to="/settings" className="gap-2">
              <Settings className="h-4 w-4" />
              前往设置
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      {(summary || qaHistory.length > 0) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToMarkdown}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            导出 MD
          </Button>
        </div>
      )}

      {chunkingInfo.needsChunking && (
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          ⚡ {chunkingInfo.message}
        </div>
      )}

      {/* Summarize Section */}
      <MaximizeWrapper title="文档总结">
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                文档总结
              </CardTitle>
              <SummaryHistory />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">总结长度：</span>
              {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                <Button
                  key={len}
                  variant={summaryLength === len ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSummaryLength(len)}
                  disabled={isSummarizing}
                >
                  {len === 'short' ? '简短' : len === 'medium' ? '适中' : '详细'}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="w-full gap-2"
              variant="hero"
              size="lg"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {chunkProgress || '生成总结中...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  生成总结
                </>
              )}
            </Button>

            {summary && (
              <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-success">总结结果</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(summary, 'summary')}
                    className="h-8 gap-1.5"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </MaximizeWrapper>

      {/* Q&A Section */}
      <MaximizeWrapper title="文档问答">
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                文档问答
              </CardTitle>
              <QAHistory history={qaHistory} documentName={documentName} summary={summary || undefined} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {DEMO_QUESTIONS.map((q, i) => (
                <Button
                  key={i}
                  variant="soft"
                  size="sm"
                  onClick={() => handleAsk(q)}
                  disabled={isAsking}
                >
                  {q}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="输入你的问题..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isAsking}
              />
            </div>
            
            <Button
              onClick={() => handleAsk()}
              disabled={isAsking || !question.trim()}
              className="w-full gap-2"
              variant="hero"
              size="lg"
            >
              {isAsking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  思考中...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  提问
                </>
              )}
            </Button>

            {answer && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-primary">回答</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(answer, 'answer')}
                    className="h-8 gap-1.5"
                  >
                    {copiedAnswer ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </MaximizeWrapper>
    </div>
  );
}
