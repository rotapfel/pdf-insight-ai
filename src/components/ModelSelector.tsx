import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loadLLMConfig, saveLLMConfig } from '@/lib/storage';
import type { LLMConfig, OutputLanguage } from '@/lib/types';

interface ModelSelectorProps {
  onConfigChange?: (config: LLMConfig) => void;
}

export function ModelSelector({ onConfigChange }: ModelSelectorProps) {
  const [config, setConfig] = useState<LLMConfig>(() => loadLLMConfig());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setConfig(loadLLMConfig());
  }, []);

  const handleModelChange = (model: string) => {
    const newConfig = { ...config, model };
    setConfig(newConfig);
    saveLLMConfig(newConfig);
    onConfigChange?.(newConfig);
    setOpen(false);
  };

  const handleLanguageChange = (lang: OutputLanguage) => {
    const newConfig = { ...config, outputLanguage: lang };
    setConfig(newConfig);
    saveLLMConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const models = config.models || [config.model];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Model Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">模型：</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between min-w-[180px] font-mono text-sm"
            >
              {config.model || "选择模型"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandInput placeholder="搜索模型..." />
              <CommandList>
                <CommandEmpty>未找到模型</CommandEmpty>
                <CommandGroup>
                  {models.map((model) => (
                    <CommandItem
                      key={model}
                      value={model}
                      onSelect={() => handleModelChange(model)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          config.model === model ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-mono text-sm">{model}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select
          value={config.outputLanguage}
          onValueChange={(v) => handleLanguageChange(v as OutputLanguage)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh">简体中文</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
