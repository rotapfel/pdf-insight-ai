import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ExtractionProgress } from '@/lib/types';

interface TextPreviewProps {
  text: string;
  pageCount: number;
  charCount: number;
  progress?: ExtractionProgress;
}

export function TextPreview({ text, pageCount, charCount, progress }: TextPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const highlightedText = useMemo(() => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-warning/30 text-foreground rounded px-0.5">$1</mark>');
  }, [text, searchQuery]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (text.match(regex) || []).length;
  }, [text, searchQuery]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText = isExpanded ? highlightedText : highlightedText.slice(0, 1000);

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            提取结果
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制全文
              </>
            )}
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{pageCount} 页</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span>{charCount.toLocaleString()} 字符</span>
          {progress?.status === 'extracting' && (
            <>
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span className="text-primary animate-pulse-subtle">
                {progress.message}
              </span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="在文本中搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {matchCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {matchCount} 处匹配
            </span>
          )}
        </div>

        {/* Text Preview */}
        <div 
          className={cn(
            "rounded-lg bg-muted/50 p-4 font-mono text-sm leading-relaxed",
            !isExpanded && "max-h-64 overflow-hidden relative"
          )}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: displayText }}
            className="whitespace-pre-wrap break-words"
          />
          {!isExpanded && text.length > 1000 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/50 to-transparent" />
          )}
        </div>

        {text.length > 1000 && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                展开全文
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
