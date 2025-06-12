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
  // Format category name for matching
  const formattedCategory = category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Map both formatted and raw category names
  const icons: Record<string, React.ReactNode> = {
    'Core Strategies': <Layers className="h-5 w-5" />,
    'core_strategies': <Layers className="h-5 w-5" />,
    'Advanced Thinking': <Brain className="h-5 w-5" />,
    'advanced_thinking': <Brain className="h-5 w-5" />,
    'Software Development': <Code2 className="h-5 w-5" />,
    'software_development': <Code2 className="h-5 w-5" />,
    'Ai Core Principles': <Target className="h-5 w-5" />,
    'ai_core_principles': <Target className="h-5 w-5" />,
    'Vibe Coding Rules': <Sparkles className="h-5 w-5" />,
    'vibe_coding_rules': <Sparkles className="h-5 w-5" />
  };
  return icons[category] || icons[formattedCategory] || <Layers className="h-5 w-5" />;
};

const getCategoryColor = (category: string) => {
  // Format category name for matching
  const formattedCategory = category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Map both formatted and raw category names
  const colors: Record<string, string> = {
    'Core Strategies': 'from-blue-500 to-blue-600',
    'core_strategies': 'from-blue-500 to-blue-600',
    'Advanced Thinking': 'from-purple-500 to-purple-600',
    'advanced_thinking': 'from-purple-500 to-purple-600',
    'Software Development': 'from-green-500 to-green-600',
    'software_development': 'from-green-500 to-green-600',
    'Ai Core Principles': 'from-orange-500 to-orange-600',
    'ai_core_principles': 'from-orange-500 to-orange-600',
    'Vibe Coding Rules': 'from-pink-500 to-pink-600',
    'vibe_coding_rules': 'from-pink-500 to-pink-600'
  };
  return colors[category] || colors[formattedCategory] || generateDynamicColor(category);
};

// Generate consistent colors for unknown categories
const generateDynamicColor = (category: string) => {
  const colorPairs = [
    'from-indigo-500 to-indigo-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-teal-500 to-teal-600',
    'from-gray-500 to-gray-600'
  ];
  
  // Generate a consistent index based on category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) - hash) + category.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colorPairs[Math.abs(hash) % colorPairs.length];
};

// Format category name for display
const formatCategoryName = (category: string) => {
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
              {formatCategoryName(strategy.category)}
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
        </div>

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