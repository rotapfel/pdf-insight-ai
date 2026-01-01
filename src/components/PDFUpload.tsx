import { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  currentFile?: File | null;
  onClear?: () => void;
  disabled?: boolean;
}

export function PDFUpload({ onFileSelect, currentFile, onClear, disabled }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.includes('pdf')) {
      setError('只支持 PDF 文件');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('文件过大，最大支持 50MB');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  if (currentFile) {
    return (
      <Card variant="outlined" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                {currentFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          {onClear && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClear}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled}
        />
        
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          isDragOver ? "bg-primary/20" : "bg-muted"
        )}>
          <Upload className={cn(
            "h-6 w-6 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        
        <div className="text-center">
          <p className="font-medium text-foreground">
            {isDragOver ? '释放以上传' : '拖拽 PDF 文件到此处'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            或点击选择文件（最大 50MB）
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
