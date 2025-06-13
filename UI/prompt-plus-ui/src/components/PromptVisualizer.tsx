import React, { useState } from 'react';
import { 
  Code2, 
  FileText, 
  Variable, 
  Layers, 
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Tag,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface PromptVisualizerProps {
  content: any;
  className?: string;
}

export const PromptVisualizer: React.FC<PromptVisualizerProps> = ({ content, className }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['prompt']));
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderVariables = (variables: Record<string, any>) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Variable className="h-4 w-4 text-purple-500" />
              <code className="text-sm font-mono text-purple-600 dark:text-purple-400">
                {`{{${key}}}`}
              </code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderExamples = (examples: any) => {
    if (!examples) return null;

    // If examples is an array
    if (Array.isArray(examples)) {
      return (
        <div className="space-y-4">
          {examples.map((example, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              {example.input && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Input:</h4>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {typeof example.input === 'string' ? example.input : JSON.stringify(example.input, null, 2)}
                  </pre>
                </div>
              )}
              {example.output && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Output:</h4>
                  <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {typeof example.output === 'string' ? example.output : JSON.stringify(example.output, null, 2)}
                  </pre>
                </div>
              )}
              {!example.input && !example.output && (
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                  {typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      );
    }

    // If examples is an object with specific structure
    if (typeof examples === 'object' && (examples.input || examples.output)) {
      return renderExamples([examples]);
    }

    // Default: render as formatted text
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
          {typeof examples === 'string' ? examples : JSON.stringify(examples, null, 2)}
        </pre>
      </div>
    );
  };

  const renderPromptSection = (text: string | any) => {
    // Convert to string if it's not already
    const textStr = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    
    // Highlight variables, keywords, and structure
    const highlightedText = textStr
      .split('\n')
      .map((line, i) => {
        // Highlight variables {{variable}}
        let processedLine = line.replace(
          /\{\{(\w+)\}\}/g,
          '<span class="text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1 rounded">{{$1}}</span>'
        );
        
        // Highlight markdown headers
        processedLine = processedLine.replace(
          /^(#{1,6})\s+(.+)$/,
          (match, hashes, content) => `<span class="text-blue-600 dark:text-blue-400 font-bold">${hashes} ${content}</span>`
        );
        
        // Highlight lists
        processedLine = processedLine.replace(
          /^(\s*[-*+])\s+(.+)$/,
          (match, bullet, content) => `<span class="text-gray-400">${bullet}</span> ${content}`
        );
        
        // Highlight code blocks
        processedLine = processedLine.replace(
          /`([^`]+)`/g,
          '<code class="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1 rounded font-mono text-sm">$1</code>'
        );

        return (
          <div key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      });

    return <div className="space-y-1">{highlightedText}</div>;
  };

  const sections = [
    {
      key: 'prompt',
      title: 'Prompt Template',
      icon: <FileText className="h-5 w-5" />,
      color: 'green',
      content: content.prompt || content.template, // Also check for 'template' field
      description: 'Main prompt structure and instructions'
    },
    {
      key: 'system',
      title: 'System Instructions',
      icon: <Brain className="h-5 w-5" />,
      color: 'blue',
      content: content.system,
      description: 'Core behavior and personality settings'
    },
    {
      key: 'variables',
      title: 'Template Variables',
      icon: <Variable className="h-5 w-5" />,
      color: 'purple',
      content: content.variables,
      description: 'Dynamic placeholders for customization',
      isVariables: true
    },
    {
      key: 'examples',
      title: 'Examples',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'yellow',
      content: content.examples,
      description: 'Sample inputs and outputs'
    },
    {
      key: 'metadata',
      title: 'Metadata',
      icon: <Tag className="h-5 w-5" />,
      color: 'gray',
      content: {
        name: content.name,
        description: content.description,
        category: content.category,
        tags: content.tags,
        version: content.version
      },
      description: 'Strategy information and tags',
      isMetadata: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-500'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-500'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-500'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'text-yellow-500'
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-500'
      }
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {sections.map((section) => {
        if (!section.content || (typeof section.content === 'object' && Object.keys(section.content).length === 0)) {
          return null;
        }

        const colorClasses = getColorClasses(section.color);
        const isExpanded = expandedSections.has(section.key);

        return (
          <div
            key={section.key}
            className={cn(
              "rounded-lg border transition-all",
              colorClasses.border,
              isExpanded ? "shadow-md" : "shadow-sm"
            )}
          >
            <div
              className={cn(
                "px-4 py-3 cursor-pointer flex items-center justify-between",
                colorClasses.bg,
                "hover:opacity-90 transition-opacity"
              )}
              onClick={() => toggleSection(section.key)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex-shrink-0", colorClasses.icon)}>
                  {section.icon}
                </div>
                <div>
                  <h3 className={cn("font-semibold", colorClasses.text)}>
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!section.isVariables && !section.isMetadata && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(section.content, section.key);
                    }}
                  >
                    {copiedSection === section.key ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 bg-white dark:bg-gray-900 border-t">
                {section.isVariables ? (
                  renderVariables(section.content)
                ) : section.isMetadata ? (
                  <div className="space-y-2">
                    {Object.entries(section.content).filter(([_, v]) => v).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-500 capitalize">
                          {key}:
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : section.key === 'examples' ? (
                  renderExamples(section.content)
                ) : (
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {renderPromptSection(section.content)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
          <p className="text-xs text-gray-500">Complexity</p>
          <p className="font-semibold">
            {content.prompt?.length > 1000 ? 'High' : content.prompt?.length > 500 ? 'Medium' : 'Low'}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <Variable className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-xs text-gray-500">Variables</p>
          <p className="font-semibold">
            {content.variables ? Object.keys(content.variables).length : 0}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <Layers className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-xs text-gray-500">Sections</p>
          <p className="font-semibold">
            {Object.keys(content).filter(k => content[k]).length}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
          <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-semibold text-sm">
            {content.type || 'Template'}
          </p>
        </div>
      </div>
    </div>
  );
};