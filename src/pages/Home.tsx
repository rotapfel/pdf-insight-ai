import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Shield, Zap, Brain, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12 lg:py-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <FileText className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">PDF Extractor</span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            在浏览器中本地解析 PDF，通过 AI 快速总结文档内容、进行智能问答。
            <br />
            <strong className="text-foreground">无需上传文件到服务器</strong>，保护您的隐私。
          </p>
          
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild variant="hero" size="xl">
              <Link to="/workspace" className="gap-2">
                开始使用
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/settings">
                配置 API
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Lock,
              title: '本地处理',
              description: 'PDF 解析完全在浏览器中完成，文件不会离开您的设备',
            },
            {
              icon: Brain,
              title: 'AI 总结',
              description: '智能分析文档内容，生成结构化的要点总结',
            },
            {
              icon: Zap,
              title: '智能问答',
              description: '基于文档内容回答您的问题，快速定位关键信息',
            },
            {
              icon: Shield,
              title: '隐私优先',
              description: 'API Key 仅存储在本地浏览器，不会发送到我们的服务器',
            },
          ].map((feature, index) => (
            <Card 
              key={index} 
              variant="glass"
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Privacy Notice */}
        <section className="mt-24">
          <Card variant="outlined" className="border-primary/20 bg-primary/5">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">隐私说明</h2>
                  <p className="mt-2 text-muted-foreground">
                    <strong>PDF 解析过程</strong>：完全在您的浏览器本地完成，文件内容不会上传到任何服务器。
                    <br />
                    <strong>AI 功能</strong>：当您使用总结或问答功能时，提取的文本（或分块内容）会发送到您配置的 LLM API 服务（如 OpenAI）。请确保您信任该服务提供商。
                    <br />
                    <strong>API Key</strong>：存储在浏览器 localStorage 中，不会发送到我们的服务器。清除浏览器数据会删除保存的配置。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
