import { Link, useLocation } from 'react-router-dom';
import { FileText, Settings, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/workspace', label: 'Workspace', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            PDF Extractor
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <div className="ml-2 border-l border-border pl-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
