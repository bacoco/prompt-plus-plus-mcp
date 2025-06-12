import React from 'react';
import { 
  Brain, 
  FileText, 
  Variable, 
  Sparkles,
  ChevronRight,
  Code2,
  Hash,
  List,
  Quote
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PromptPreviewProps {
  content: any;
  className?: string;
  compact?: boolean;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({ content, className, compact = false }) => {
  if (!content) return null;

  const renderHighlightedText = (text: string | any, maxLength?: number) => {
    if (!text) return null;
    
    // Convert to string if it's not already
    let textStr = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    
    let processedText = textStr;
    if (maxLength && textStr.length > maxLength) {
      processedText = textStr.substring(0, maxLength) + '...';
    }

    // Split into lines for processing
    const lines = processedText.split('\n').slice(0, compact ? 3 : undefined);
    
    return lines.map((line, i) => {
      let element = null;
      
      // Headers
      if (line.match(/^#{1,6}\s+/)) {
        const level = line.match(/^(#{1,6})/)?.[1].length || 1;
        const content = line.replace(/^#{1,6}\s+/, '');
        element = (
          <div key={i} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <Hash className="h-3 w-3" />
            <span className={cn(
              level === 1 && 'text-lg',
              level === 2 && 'text-base',
              level >= 3 && 'text-sm'
            )}>{content}</span>
          </div>
        );
      }
      // Lists
      else if (line.match(/^[\s-]*[-*+]\s+/)) {
        const content = line.replace(/^[\s-]*[-*+]\s+/, '');
        element = (
          <div key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
            <List className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{content}</span>
          </div>
        );
      }
      // Variables
      else if (line.includes('{{')) {
        const parts = line.split(/(\{\{[^}]+\}\})/);
        element = (
          <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
            {parts.map((part, j) => {
              if (part.match(/\{\{[^}]+\}\}/)) {
                return (
                  <span key={j} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    <Variable className="h-3 w-3" />
                    <span className="font-mono text-xs">{part}</span>
                  </span>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </div>
        );
      }
      // Regular text
      else if (line.trim()) {
        element = (
          <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
            {line}
          </div>
        );
      }

      return element;
    });
  };

  const sections = [];

  // System section
  if (content.system) {
    sections.push(
      <div key="system" className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
          <Brain className="h-3.5 w-3.5" />
          <span>System</span>
        </div>
        <div className="pl-5 space-y-1">
          {renderHighlightedText(content.system, compact ? 150 : undefined)}
        </div>
      </div>
    );
  }

  // Prompt section
  if (content.prompt) {
    sections.push(
      <div key="prompt" className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
          <FileText className="h-3.5 w-3.5" />
          <span>Prompt</span>
        </div>
        <div className="pl-5 space-y-1">
          {renderHighlightedText(content.prompt, compact ? 200 : undefined)}
        </div>
      </div>
    );
  }

  // Variables indicator
  if (content.variables && Object.keys(content.variables).length > 0) {
    const varCount = Object.keys(content.variables).length;
    sections.push(
      <div key="variables" className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
        <Variable className="h-3.5 w-3.5" />
        <span>{varCount} variable{varCount !== 1 ? 's' : ''}</span>
        <div className="flex gap-1">
          {Object.keys(content.variables).slice(0, 3).map(key => (
            <span key={key} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-mono">
              {key}
            </span>
          ))}
          {Object.keys(content.variables).length > 3 && (
            <span className="text-xs text-gray-500">+{Object.keys(content.variables).length - 3}</span>
          )}
        </div>
      </div>
    );
  }

  // Examples indicator
  if (content.examples) {
    sections.push(
      <div key="examples" className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Contains examples</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg",
      className
    )}>
      {sections}
    </div>
  );
};