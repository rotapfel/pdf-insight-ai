import { useState, ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MaximizeWrapperProps {
  children: ReactNode;
  title: string;
  className?: string;
}

export function MaximizeWrapper({ children, title, className }: MaximizeWrapperProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <>
      <div className={cn("relative group", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMaximized(true)}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          title="最大化"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        {children}
      </div>

      <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between pr-8">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
