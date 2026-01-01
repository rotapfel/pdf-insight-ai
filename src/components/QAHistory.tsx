import { useState } from 'react';
import { History, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { QARecord } from '@/lib/types';
import { format } from 'date-fns';

interface QAHistoryProps {
  history: QARecord[];
}

export function QAHistory({ history }: QAHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          提问历史
          {history.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {history.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            提问历史记录
          </DialogTitle>
        </DialogHeader>
        
        {history.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            暂无提问记录
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                      <p className="font-medium text-primary">{record.question}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`Q: ${record.question}\n\nA: ${record.answer}`, record.id)}
                      className="shrink-0"
                    >
                      {copiedId === record.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                    {record.answer}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
