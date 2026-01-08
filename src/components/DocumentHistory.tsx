import { useState } from 'react';
import { FileText, Clock, MessageCircle, Sparkles, ChevronDown, ChevronUp, Trash2, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadDocuments, clearDocuments } from '@/lib/storage';
import type { PDFDocument } from '@/lib/types';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DocumentHistoryProps {
  onLoadDocument?: (doc: PDFDocument) => void;
}

export function DocumentHistory({ onLoadDocument }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<PDFDocument[]>(() => loadDocuments());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedQaIds, setExpandedQaIds] = useState<Set<string>>(new Set());
  const [maximizedDoc, setMaximizedDoc] = useState<PDFDocument | null>(null);

  const toggleQaExpanded = (qaId: string) => {
    setExpandedQaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qaId)) {
        newSet.delete(qaId);
      } else {
        newSet.add(qaId);
      }
      return newSet;
    });
  };

  const handleClearAll = () => {
    clearDocuments();
    setDocuments([]);
  };

  const refreshDocuments = () => {
    setDocuments(loadDocuments());
  };

  const downloadMarkdown = (doc: PDFDocument) => {
    let content = `# ${doc.filename}\n\n`;
    content += `- **上传时间**: ${format(new Date(doc.uploadedAt), 'yyyy-MM-dd HH:mm')}\n`;
    content += `- **页数**: ${doc.pageCount}\n`;
    content += `- **字符数**: ${doc.textCharCount.toLocaleString()}\n\n`;

    if (doc.lastSummary) {
      content += `## 总结\n\n${doc.lastSummary}\n\n`;
    }

    if (doc.qaHistory && doc.qaHistory.length > 0) {
      content += `## 问答记录\n\n`;
      doc.qaHistory.forEach((qa, index) => {
        content += `### Q${doc.qaHistory!.length - index}: ${qa.question}\n\n`;
        content += `**时间**: ${format(new Date(qa.createdAt), 'yyyy-MM-dd HH:mm')}\n\n`;
        content += `${qa.answer}\n\n---\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.filename.replace(/\.pdf$/i, '')}_历史记录.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            处理历史
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshDocuments}>
              刷新
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  清空
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清空历史？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将删除所有处理历史记录，包括总结和问答记录。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>确认清空</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 p-4">
            {documents.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const qaCount = doc.qaHistory?.length || 0;
              
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30"
                >
                  {/* Document name on separate first line - auto-adjust font and wrap */}
                  <div className="mb-2">
                    <p 
                      className="font-medium leading-relaxed"
                      style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        fontSize: doc.filename.length > 50 ? '0.875rem' : '1rem'
                      }}
                    >
                      {doc.filename}
                    </p>
                  </div>
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{format(new Date(doc.uploadedAt), 'yyyy-MM-dd HH:mm')}</span>
                          <span>{doc.pageCount} 页</span>
                          <span>{doc.textCharCount.toLocaleString()} 字符</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {doc.lastSummary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                              <Sparkles className="h-3 w-3" />
                              已总结
                            </span>
                          )}
                          {qaCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              <MessageCircle className="h-3 w-3" />
                              {qaCount} 问答
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadMarkdown(doc)}
                        className="h-8 w-8 p-0"
                        title="下载 Markdown"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMaximizedDoc(doc)}
                        className="h-8 w-8 p-0"
                        title="最大化"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border pt-3">
                      {doc.lastSummary && (
                        <div className="rounded-md bg-success/5 border border-success/20 p-3">
                          <h5 className="text-sm font-medium text-success mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            总结
                          </h5>
                          <ScrollArea className="h-[200px]">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap pr-3">
                              {doc.lastSummary}
                            </p>
                          </ScrollArea>
                        </div>
                      )}
                      
                      {doc.qaHistory && doc.qaHistory.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-primary flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />
                            问答记录
                          </h5>
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-2 pr-3">
                              {doc.qaHistory.map((qa) => {
                                const isQaExpanded = expandedQaIds.has(qa.id);
                                return (
                                  <div key={qa.id} className="rounded-md bg-primary/5 border border-primary/20 p-3">
                                    <div 
                                      className="flex items-start justify-between gap-2 cursor-pointer"
                                      onClick={() => toggleQaExpanded(qa.id)}
                                    >
                                      <p className="text-sm font-medium flex-1">Q: {qa.question}</p>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                                        {isQaExpanded ? (
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                    {isQaExpanded && (
                                      <div className="mt-2 pt-2 border-t border-primary/10">
                                        <ScrollArea className="h-[150px]">
                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap pr-3">A: {qa.answer}</p>
                                        </ScrollArea>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Maximized Document Dialog */}
      <Dialog open={!!maximizedDoc} onOpenChange={(open) => !open && setMaximizedDoc(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="truncate">{maximizedDoc?.filename}</span>
            </DialogTitle>
          </DialogHeader>
          {maximizedDoc && (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Document Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>{format(new Date(maximizedDoc.uploadedAt), 'yyyy-MM-dd HH:mm')}</span>
                  <span>{maximizedDoc.pageCount} 页</span>
                  <span>{maximizedDoc.textCharCount.toLocaleString()} 字符</span>
                </div>

                {/* Summary Section */}
                {maximizedDoc.lastSummary && (
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                    <h3 className="text-base font-medium text-success mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      总结
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {maximizedDoc.lastSummary}
                    </p>
                  </div>
                )}

                {/* Q&A Section */}
                {maximizedDoc.qaHistory && maximizedDoc.qaHistory.length > 0 && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <h3 className="text-base font-medium text-primary mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      问答记录 ({maximizedDoc.qaHistory.length})
                    </h3>
                    <div className="space-y-4">
                      {maximizedDoc.qaHistory.map((qa, index) => (
                        <div key={qa.id} className="rounded-md bg-background border border-border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              Q{maximizedDoc.qaHistory!.length - index}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(qa.createdAt), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-2">{qa.question}</p>
                          <div className="pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {qa.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
