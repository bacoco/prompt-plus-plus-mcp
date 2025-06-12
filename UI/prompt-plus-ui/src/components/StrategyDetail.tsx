import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Play, X, Maximize2, Minimize2, Code, Eye } from 'lucide-react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { PromptVisualizer } from './PromptVisualizer';
import type { Strategy } from '../services/api';

interface StrategyDetailProps {
  strategy: Strategy | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyDetail: React.FC<StrategyDetailProps> = ({ strategy, isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!strategy) return null;

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const promptContent = typeof strategy.content === 'object' ? 
    JSON.stringify(strategy.content, null, 2) : 
    strategy.content;

  const parsedContent = typeof strategy.content === 'object' ? strategy.content : {};

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className={isFullscreen ? "max-w-full h-screen m-0" : "max-w-5xl"}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{strategy.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{strategy.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                {strategy.category}
              </span>
              {strategy.usageCount && (
                <span className="text-sm text-gray-500">
                  Used {strategy.usageCount} times
                </span>
              )}
              {strategy.successRate && (
                <span className="text-sm text-gray-500">
                  {(strategy.successRate * 100).toFixed(0)}% success rate
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'visual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('visual')}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Visual
              </Button>
              <Button
                variant={viewMode === 'json' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('json')}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                JSON
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {viewMode === 'visual' ? (
            <PromptVisualizer content={parsedContent} />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Full Strategy JSON</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(promptContent, 'json')}
                >
                  {copiedSection === 'json' ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '500px' }}>
                <Editor
                  defaultLanguage="json"
                  value={promptContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                  }}
                />
              </div>
            </div>
          )}

          {/* Try in Testing Lab Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              // This would navigate to testing lab with this strategy
              window.location.hash = '#testing';
              onClose();
            }}>
              <Play className="h-4 w-4 mr-2" />
              Try in Testing Lab
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};