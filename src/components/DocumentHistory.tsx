import { useState } from 'react';
import { FileText, Clock, MessageCircle, Sparkles, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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

interface DocumentHistoryProps {
  onLoadDocument?: (doc: PDFDocument) => void;
}

export function DocumentHistory({ onLoadDocument }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<PDFDocument[]>(() => loadDocuments());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleClearAll = () => {
    clearDocuments();
    setDocuments([]);
  };

  const refreshDocuments = () => {
    setDocuments(loadDocuments());
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
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {documents.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const qaCount = doc.qaHistory?.length || 0;
              
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                      className="shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border pt-3">
                      {doc.lastSummary && (
                        <div className="rounded-md bg-success/5 border border-success/20 p-3">
                          <h5 className="text-sm font-medium text-success mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            总结
                          </h5>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {doc.lastSummary}
                          </p>
                        </div>
                      )}
                      
                      {doc.qaHistory && doc.qaHistory.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-primary flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />
                            问答记录
                          </h5>
                          {doc.qaHistory.slice(0, 3).map((qa) => (
                            <div key={qa.id} className="rounded-md bg-primary/5 border border-primary/20 p-3">
                              <p className="text-sm font-medium mb-1">Q: {qa.question}</p>
                              <p className="text-sm text-muted-foreground line-clamp-3">A: {qa.answer}</p>
                            </div>
                          ))}
                          {doc.qaHistory.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              还有 {doc.qaHistory.length - 3} 条问答记录
                            </p>
                          )}
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
    </Card>
  );
}
