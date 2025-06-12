import React, { useEffect, useState } from 'react';
import { Search, Grid, List, ChevronRight, Eye, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { mcpApi } from '../services/api';
import type { Strategy } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { StrategyDetail } from './StrategyDetail';
import { StrategyCard } from './StrategyCard';
import { StrategyFilters } from './StrategyFilters';

export const StrategyExplorer: React.FC = () => {
  const { 
    strategies, 
    selectedStrategy, 
    setStrategies, 
    setSelectedStrategy,
    setStrategiesLoading,
    setStrategiesError 
  } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    hasSystem: null as boolean | null,
    hasVariables: null as boolean | null,
    hasExamples: null as boolean | null,
    complexity: null as string | null,
  });
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [detailStrategy, setDetailStrategy] = useState<Strategy | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    filterStrategies();
  }, [strategies, searchQuery, filters]);

  const loadStrategies = async () => {
    try {
      setStrategiesLoading(true);
      const data = await mcpApi.getStrategies();
      setStrategies(data);
    } catch (error) {
      setStrategiesError('Failed to load strategies');
      console.error('Error loading strategies:', error);
    } finally {
      setStrategiesLoading(false);
    }
  };

  const filterStrategies = () => {
    let filtered = strategies;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(s => s.category === filters.category);
    }
    
    if (filters.hasSystem === true) {
      filtered = filtered.filter(s => s.content?.system);
    }
    
    if (filters.hasVariables === true) {
      filtered = filtered.filter(s => s.content?.variables && Object.keys(s.content.variables).length > 0);
    }
    
    if (filters.hasExamples === true) {
      filtered = filtered.filter(s => s.content?.examples);
    }
    
    if (filters.complexity) {
      filtered = filtered.filter(s => {
        const promptLength = s.content?.prompt?.length || 0;
        const complexity = promptLength > 1000 ? 'High' : promptLength > 500 ? 'Medium' : 'Low';
        return complexity === filters.complexity;
      });
    }
    

    setFilteredStrategies(filtered);
  };

  const handleStrategyClick = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleViewDetails = (strategy: Strategy, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailStrategy(strategy);
    setShowDetail(true);
  };


  const StrategyListItem: React.FC<{ strategy: Strategy }> = ({ strategy }) => (
    <div
      className={cn(
        'flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b group',
        selectedStrategy?.id === strategy.id && 'bg-blue-50 dark:bg-blue-900'
      )}
      onClick={() => handleStrategyClick(strategy)}
    >
      <div className="flex-1">
        <h4 className="font-medium">{strategy.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {strategy.description}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {strategy.category}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => handleViewDetails(strategy, e)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="h-full flex">
      {/* Filters Sidebar */}
      <div className={cn(
        "border-r bg-gray-50 dark:bg-gray-900 transition-all duration-300",
        showFilters ? "w-80" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 h-full overflow-y-auto">
          <StrategyFilters
            strategies={strategies}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold mb-4">Strategy Explorer</h2>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search strategies..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <div className="w-px bg-gray-300 dark:bg-gray-700" />
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStrategies.map(strategy => (
                <StrategyCard 
                  key={strategy.id} 
                  strategy={strategy}
                  isSelected={selectedStrategy?.id === strategy.id}
                  onSelect={() => handleStrategyClick(strategy)}
                  onViewDetails={(e) => handleViewDetails(strategy, e)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-0 bg-white dark:bg-gray-900 rounded-lg overflow-hidden border">
              {filteredStrategies.map(strategy => (
                <StrategyListItem key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}

          {filteredStrategies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No strategies found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Detail Modal */}
      <StrategyDetail
        strategy={detailStrategy}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setDetailStrategy(null);
        }}
      />
    </div>
  );
};