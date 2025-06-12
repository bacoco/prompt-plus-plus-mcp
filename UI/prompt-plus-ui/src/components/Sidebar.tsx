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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r z-50 transition-transform duration-300',
          'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Prompt++</h1>
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
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      activeView === item.id
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
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

          <div className="p-4 border-t">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Pro Tip</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Select a strategy in the Explorer to use it in the Testing Lab
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
};