import React from 'react';
import { 
  Brain, 
  Sparkles, 
  Code2, 
  Layers, 
  Target,
  ChevronRight,
  Eye,
  Variable,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import type { Strategy } from '../services/api';

interface StrategyCardProps {
  strategy: Strategy;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: (e: React.MouseEvent) => void;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Core Strategies': <Layers className="h-5 w-5" />,
    'Advanced Thinking': <Brain className="h-5 w-5" />,
    'Software Development': <Code2 className="h-5 w-5" />,
    'Ai Core Principles': <Target className="h-5 w-5" />,
    'Vibe Coding Rules': <Sparkles className="h-5 w-5" />
  };
  return icons[category] || <Layers className="h-5 w-5" />;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Core Strategies': 'from-blue-500 to-blue-600',
    'Advanced Thinking': 'from-purple-500 to-purple-600',
    'Software Development': 'from-green-500 to-green-600',
    'Ai Core Principles': 'from-orange-500 to-orange-600',
    'Vibe Coding Rules': 'from-pink-500 to-pink-600'
  };
  return colors[category] || 'from-gray-500 to-gray-600';
};

export const StrategyCard: React.FC<StrategyCardProps> = ({ 
  strategy, 
  isSelected, 
  onSelect, 
  onViewDetails 
}) => {
  const categoryColor = getCategoryColor(strategy.category);
  const hasVariables = strategy.content?.variables && Object.keys(strategy.content.variables).length > 0;
  const complexity = strategy.content?.prompt?.length > 1000 ? 'High' : 
                    strategy.content?.prompt?.length > 500 ? 'Medium' : 'Low';

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden',
        isSelected && 'ring-2 ring-blue-500 shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Category Banner */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
        categoryColor
      )} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'p-2 rounded-lg bg-gradient-to-br text-white',
                categoryColor
              )}>
                {getCategoryIcon(strategy.category)}
              </div>
              <CardTitle className="text-lg line-clamp-1">{strategy.name}</CardTitle>
            </div>
            <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
              {strategy.category}
            </CardDescription>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onViewDetails}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-5 w-5 text-gray-400 mt-1.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {strategy.description}
        </p>

        {/* Visual Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Zap className="h-3 w-3" />
            <span>{complexity}</span>
          </div>
          {hasVariables && (
            <div className="flex items-center gap-1 text-gray-500">
              <Variable className="h-3 w-3" />
              <span>{Object.keys(strategy.content.variables).length} vars</span>
            </div>
          )}
          {strategy.usageCount && (
            <div className="flex items-center gap-1 text-gray-500">
              <Target className="h-3 w-3" />
              <span>{strategy.usageCount} uses</span>
            </div>
          )}
        </div>

        {/* Success Rate Indicator */}
        {strategy.successRate && (
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Success Rate</span>
              <span className="font-medium">{(strategy.successRate * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  strategy.successRate > 0.9 ? 'bg-green-500' :
                  strategy.successRate > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${strategy.successRate * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Preview Tags */}
        <div className="flex flex-wrap gap-1">
          {strategy.content?.system && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
              System
            </span>
          )}
          {strategy.content?.prompt && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
              Prompt
            </span>
          )}
          {strategy.content?.examples && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
              Examples
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};