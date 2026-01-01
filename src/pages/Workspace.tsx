import { useState, useCallback } from 'react';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { PDFUpload } from '@/components/PDFUpload';
import { TextPreview } from '@/components/TextPreview';
import { LLMOperations } from '@/components/LLMOperations';
import { DocumentHistory } from '@/components/DocumentHistory';
import { MaximizeWrapper } from '@/components/MaximizeWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { saveDocument, loadDocuments } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import type { ExtractionProgress, PDFDocument, QARecord } from '@/lib/types';

export default function Workspace() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageCount, setPageCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [qaHistory, setQAHistory] = useState<QARecord[]>([]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setExtractedText('');
    setError(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
    setCurrentDocId(null);
    setQAHistory([]);
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setExtractedText('');
    setPageCount(0);
    setCharCount(0);
    setError(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
    setCurrentDocId(null);
    setQAHistory([]);
  }, []);

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractTextFromPDF(file, setProgress);
      
      if (!result.text.trim()) {
        throw new Error('PDF 中没有提取到文本内容。可能是扫描版 PDF 或加密文件。');
      }

      setExtractedText(result.text);
      setPageCount(result.pageCount);
      setCharCount(result.charCount);

      // Save to history
      const docId = crypto.randomUUID();
      const doc: PDFDocument = {
        id: docId,
        filename: file.name,
        uploadedAt: new Date(),
        extractedText: result.text,
        textCharCount: result.charCount,
        pageCount: result.pageCount,
        qaHistory: [],
      };
      saveDocument(doc);
      setCurrentDocId(docId);

      toast({
        title: '提取成功',
        description: `成功从 ${result.pageCount} 页中提取 ${result.charCount.toLocaleString()} 字符`,
      });
    } catch (err: any) {
      const errorMessage = err.message || '提取过程中发生未知错误';
      setError(errorMessage);
      setProgress({ current: 0, total: 0, status: 'error', message: errorMessage });
      toast({
        title: '提取失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSummaryComplete = (summary: string) => {
    if (!currentDocId) return;
    
    const docs = loadDocuments();
    const docIndex = docs.findIndex(d => d.id === currentDocId);
    if (docIndex >= 0) {
      docs[docIndex].lastSummary = summary;
      localStorage.setItem('pdf-extractor-documents', JSON.stringify(docs));
    }
  };

  const handleQAComplete = (question: string, answer: string) => {
    const newRecord: QARecord = {
      id: crypto.randomUUID(),
      question,
      answer,
      createdAt: new Date(),
    };
    
    const newHistory = [newRecord, ...qaHistory];
    setQAHistory(newHistory);

    if (!currentDocId) return;
    
    const docs = loadDocuments();
    const docIndex = docs.findIndex(d => d.id === currentDocId);
    if (docIndex >= 0) {
      docs[docIndex].qaHistory = newHistory;
      localStorage.setItem('pdf-extractor-documents', JSON.stringify(docs));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">工作区</h1>
          <p className="mt-2 text-muted-foreground">
            上传 PDF 文件，提取文本内容，使用 AI 进行总结和问答
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Upload & Extract */}
          <div className="space-y-6">
            <PDFUpload
              onFileSelect={handleFileSelect}
              currentFile={file}
              onClear={handleClearFile}
              disabled={isExtracting}
            />

            {file && !extractedText && (
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                variant="hero"
                size="lg"
                className="w-full gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress.message || '正在提取...'}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    提取文本
                  </>
                )}
              </Button>
            )}

            {error && (
              <Card variant="outlined" className="border-destructive/50">
                <CardContent className="flex items-start gap-3 py-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">提取失败</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {extractedText && (
              <MaximizeWrapper title="提取文本预览">
                <TextPreview
                  text={extractedText}
                  pageCount={pageCount}
                  charCount={charCount}
                  progress={progress}
                />
              </MaximizeWrapper>
            )}
          </div>

          {/* Right Column: LLM Operations */}
          <div>
            {extractedText ? (
              <LLMOperations
                extractedText={extractedText}
                qaHistory={qaHistory}
                onSummaryComplete={handleSummaryComplete}
                onQAComplete={handleQAComplete}
              />
            ) : (
              <Card variant="outlined" className="h-64 flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>上传并提取 PDF 后即可使用 AI 功能</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Document History */}
        <div className="mt-8">
          <DocumentHistory />
        </div>
      </main>
    </div>
  );
}
