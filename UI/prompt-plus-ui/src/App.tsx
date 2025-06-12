import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StrategyExplorer } from './components/StrategyExplorer';
import { PromptTestingLab } from './components/PromptTestingLab';
import { PromptRefiner } from './components/PromptRefiner';
// import { TestComponent } from './components/TestComponent';

function App() {
  const { activeView, sidebarOpen } = useStore();
  
  console.log('App rendering, activeView:', activeView, 'sidebarOpen:', sidebarOpen);

  const renderView = () => {
    switch (activeView) {
      case 'refiner':
        return <PromptRefiner />;
      case 'dashboard':
        return <Dashboard />;
      case 'explorer':
        return <StrategyExplorer />;
      case 'testing':
        return <PromptTestingLab />;
      case 'creator':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Strategy Creator - Coming Soon</p>
          </div>
        );
      case 'collections':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Collections Manager - Coming Soon</p>
          </div>
        );
      case 'performance':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Performance Monitor - Coming Soon</p>
          </div>
        );
      default:
        return <PromptRefiner />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <main 
        className="lg:ml-64 h-full transition-all duration-300 overflow-hidden flex flex-col"
      >
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App