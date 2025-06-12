import React from 'react';
import { 
  Filter, 
  X, 
  Zap, 
  Variable, 
  FileText,
  Brain,
  Target,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface StrategyFiltersProps {
  strategies: any[];
  filters: {
    category: string;
    hasSystem: boolean | null;
    hasVariables: boolean | null;
    hasExamples: boolean | null;
    complexity: string | null;
    minSuccessRate: number | null;
  };
  onFilterChange: (filters: any) => void;
  className?: string;
}

export const StrategyFilters: React.FC<StrategyFiltersProps> = ({
  strategies,
  filters,
  onFilterChange,
  className
}) => {
  const categories = ['all', ...Array.from(new Set(strategies.map(s => s.category)))];
  
  const updateFilter = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      category: 'all',
      hasSystem: null,
      hasVariables: null,
      hasExamples: null,
      complexity: null,
      minSuccessRate: null
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'category' && value !== null
  ).length + (filters.category !== 'all' ? 1 : 0);

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={filters.category === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('category', category)}
              className="text-xs"
            >
              {category === 'all' ? 'All Categories' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Filters */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Content Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={filters.hasSystem === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('hasSystem', filters.hasSystem === true ? null : true)}
            className="justify-start gap-2 text-xs"
          >
            <Brain className="h-3 w-3" />
            Has System
          </Button>
          <Button
            variant={filters.hasVariables === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('hasVariables', filters.hasVariables === true ? null : true)}
            className="justify-start gap-2 text-xs"
          >
            <Variable className="h-3 w-3" />
            Has Variables
          </Button>
          <Button
            variant={filters.hasExamples === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('hasExamples', filters.hasExamples === true ? null : true)}
            className="justify-start gap-2 text-xs"
          >
            <FileText className="h-3 w-3" />
            Has Examples
          </Button>
        </div>
      </div>

      {/* Complexity Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Complexity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['Low', 'Medium', 'High'].map(level => (
            <Button
              key={level}
              variant={filters.complexity === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('complexity', filters.complexity === level ? null : level)}
              className="text-xs"
            >
              <Zap className={cn(
                "h-3 w-3 mr-1",
                level === 'Low' && 'text-green-500',
                level === 'Medium' && 'text-yellow-500',
                level === 'High' && 'text-red-500'
              )} />
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Success Rate Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Success Rate
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[70, 80, 90].map(rate => (
            <Button
              key={rate}
              variant={filters.minSuccessRate === rate ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('minSuccessRate', filters.minSuccessRate === rate ? null : rate)}
              className="text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {rate}%+
            </Button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className="pt-2 border-t">
        <p className="text-xs text-gray-500">
          Showing {strategies.filter(s => {
            if (filters.category !== 'all' && s.category !== filters.category) return false;
            if (filters.hasSystem === true && !s.content?.system) return false;
            if (filters.hasVariables === true && (!s.content?.variables || Object.keys(s.content.variables).length === 0)) return false;
            if (filters.hasExamples === true && !s.content?.examples) return false;
            if (filters.complexity) {
              const promptLength = s.content?.prompt?.length || 0;
              const complexity = promptLength > 1000 ? 'High' : promptLength > 500 ? 'Medium' : 'Low';
              if (complexity !== filters.complexity) return false;
            }
            if (filters.minSuccessRate && (!s.successRate || s.successRate * 100 < filters.minSuccessRate)) return false;
            return true;
          }).length} of {strategies.length} strategies
        </p>
      </div>
    </Card>
  );
};