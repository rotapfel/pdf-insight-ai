import { useState } from 'react';
import { History, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadDocuments } from '@/lib/storage';
import { format } from 'date-fns';

export function SummaryHistory() {
  const [isMaximized, setIsMaximized] = useState(false);
  const documents = loadDocuments().filter(
    doc => doc.summaryHistory && doc.summaryHistory.length > 0
  );

  if (documents.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="h-4 w-4" />
          总结历史
        </Button>
      </DialogTrigger>
      <DialogContent className={isMaximized ? "max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh]" : "max-w-2xl max-h-[80vh]"}>
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            总结历史
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-8 w-8 p-0"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </DialogHeader>
        <ScrollArea className={isMaximized ? "h-[calc(95vh-100px)]" : "h-[60vh]"}>
          <div className="space-y-6 pr-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-3">
                  <p className="font-medium text-sm break-words leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {doc.filename}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    上传于 {format(new Date(doc.uploadedAt), 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
                <div className="space-y-3">
                  {doc.summaryHistory?.map((record, index) => (
                    <div key={record.id} className="rounded-md bg-success/5 border border-success/20 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-success">
                          总结 #{doc.summaryHistory!.length - index}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm')}
                        </span>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pr-3">
                          {record.content}
                        </p>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
