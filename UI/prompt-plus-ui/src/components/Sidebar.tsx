import React from 'react';
import { 
  Home, 
  Search, 
  TestTube, 
  PlusCircle, 
  FolderOpen, 
  BarChart3, 
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface NavItem {
  id: 'refiner' | 'dashboard' | 'explorer' | 'testing' | 'creator' | 'collections' | 'performance';
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'refiner', label: 'Prompt Refiner', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { id: 'explorer', label: 'Strategy Explorer', icon: <Search className="h-5 w-5" /> },
  { id: 'testing', label: 'Testing Lab', icon: <TestTube className="h-5 w-5" /> },
  { id: 'creator', label: 'Strategy Creator', icon: <PlusCircle className="h-5 w-5" /> },
  { id: 'collections', label: 'Collections', icon: <FolderOpen className="h-5 w-5" /> },
  { id: 'performance', label: 'Performance', icon: <BarChart3 className="h-5 w-5" /> },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, activeView, setSidebarOpen, setActiveView } = useStore();

  return (
    <>
      {/* Mobile overlay with glass effect */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 glass-modal-backdrop z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Glass Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full glass z-50 transition-all duration-300',
          'w-64 m-4 rounded-2xl glass-glow',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="glass-shimmer">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Prompt++</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">MCP UI</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveView(item.id);
                      setSidebarOpen(false); // Close on mobile after selection
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300',
                      'glass-nav-item glass-hover',
                      activeView === item.id
                        ? 'glass-glow text-blue-600 dark:text-blue-400 font-semibold active'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4">
            <div className="glass rounded-xl p-4 glass-shimmer">
              <p className="text-sm font-medium mb-1 text-purple-600 dark:text-purple-400">Pro Tip</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Select a strategy in the Explorer to use it in the Testing Lab
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button with glass effect */}
      <button
        className="fixed top-6 left-6 z-30 lg:hidden liquid-button p-3"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
};