import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Trash2, Loader2, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { loadLLMConfig, saveLLMConfig, clearLLMConfig } from '@/lib/storage';
import { testConnection } from '@/lib/llm';
import { PROVIDER_PRESETS, DEFAULT_LLM_CONFIG } from '@/lib/types';
import type { LLMConfig, OutputLanguage } from '@/lib/types';

const PROVIDERS = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'custom', label: 'Custom OpenAI-compatible' },
];

const MODEL_PRESETS: Record<string, string[]> = {
  'openai-compatible': ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  'gemini': ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
  'anthropic': ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
  'custom': [],
};

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [headersText, setHeadersText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = loadLLMConfig();
    setConfig(saved);
    if (saved.headers) {
      setHeadersText(JSON.stringify(saved.headers, null, 2));
    }
  }, []);

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider] || {};
    setConfig(prev => ({
      ...prev,
      provider: provider as LLMConfig['provider'],
      baseUrl: preset.baseUrl || prev.baseUrl,
      model: preset.model || '',
    }));
    setHasChanges(true);
    setTestResult(null);
  };

  const handleChange = <K extends keyof LLMConfig>(key: K, value: LLMConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setTestResult(null);
  };

  const handleHeadersChange = (text: string) => {
    setHeadersText(text);
    setHasChanges(true);
    try {
      const parsed = text.trim() ? JSON.parse(text) : undefined;
      setConfig(prev => ({ ...prev, headers: parsed }));
    } catch {
      // Invalid JSON, will be caught on save
    }
  };

  const handleSave = () => {
    // Validate headers JSON
    if (headersText.trim()) {
      try {
        JSON.parse(headersText);
      } catch {
        toast({
          title: '保存失败',
          description: 'Optional Headers 必须是有效的 JSON 格式',
          variant: 'destructive',
        });
        return;
      }
    }

    saveLLMConfig(config);
    setHasChanges(false);
    toast({
      title: '保存成功',
      description: '配置已保存到本地存储',
    });
    // Navigate back to workspace after saving
    navigate('/workspace');
  };

  const handleClear = () => {
    clearLLMConfig();
    setConfig(DEFAULT_LLM_CONFIG);
    setHeadersText('');
    setTestResult(null);
    setHasChanges(false);
    toast({
      title: '已清除',
      description: '所有配置已从本地存储中删除',
    });
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      toast({
        title: '无法测试',
        description: '请先填写 API Key',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(config);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || '测试失败',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const modelPresets = MODEL_PRESETS[config.provider] || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            设置
          </h1>
          <p className="mt-2 text-muted-foreground">
            配置 LLM API 连接参数，所有设置仅保存在浏览器本地
          </p>
        </div>

        <div className="space-y-6">
          {/* Provider & Model */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>API 提供商</CardTitle>
              <CardDescription>选择 LLM 服务提供商和模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>提供商</Label>
                <Select 
                  value={config.provider} 
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>模型</Label>
                {modelPresets.length > 0 ? (
                  <Select
                    value={config.model}
                    onValueChange={(v) => handleChange('model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelPresets.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={config.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="输入模型名称"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>API Base URL</Label>
                <Input
                  value={config.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com"
                />
                <p className="text-xs text-muted-foreground">
                  例如：https://api.openai.com 或您的代理地址
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Key */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>认证</CardTitle>
              <CardDescription>API Key 将安全存储在浏览器本地</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Optional Headers (JSON)</Label>
                <Textarea
                  value={headersText}
                  onChange={(e) => handleHeadersChange(e.target.value)}
                  placeholder='{"x-custom-header": "value"}'
                  className="font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  可选：添加自定义请求头，必须是有效的 JSON 格式
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Output Language */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>输出语言</CardTitle>
              <CardDescription>设置文档总结和问答的输出语言</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>语言</Label>
                <Select 
                  value={config.outputLanguage} 
                  onValueChange={(v) => handleChange('outputLanguage', v as OutputLanguage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择输出语言" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">简体中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>参数配置</CardTitle>
              <CardDescription>调整 API 调用的参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>超时时间（秒）</Label>
                  <span className="text-sm text-muted-foreground">{config.timeout}s</span>
                </div>
                <Slider
                  value={[config.timeout]}
                  onValueChange={([v]) => handleChange('timeout', v)}
                  min={10}
                  max={300}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature]}
                  onValueChange={([v]) => handleChange('temperature', v)}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
                </div>
                <Slider
                  value={[config.maxTokens]}
                  onValueChange={([v]) => handleChange('maxTokens', v)}
                  min={256}
                  max={16384}
                  step={256}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card variant={testResult ? (testResult.success ? 'default' : 'outlined') : 'default'} 
                className={testResult && !testResult.success ? 'border-destructive/50' : ''}>
            <CardContent className="py-6">
              <Button
                onClick={handleTest}
                disabled={isTesting || !config.apiKey.trim()}
                variant="outline"
                className="w-full gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </Button>

              {testResult && (
                <div className={`mt-4 flex items-center gap-2 text-sm ${
                  testResult.success ? 'text-success' : 'text-destructive'
                }`}>
                  {testResult.success ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              variant="hero"
              size="lg"
              className="flex-1 gap-2"
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4" />
              保存配置
            </Button>
            <Button
              onClick={handleClear}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              清除
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            所有配置仅存储在浏览器 localStorage 中，清除浏览器数据会删除这些设置
          </p>
        </div>
      </main>
    </div>
  );
}
