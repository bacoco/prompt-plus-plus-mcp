import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Copy, Save, RefreshCw, Settings, Eye } from 'lucide-react';
import { useStore } from '../store/useStore';
import { mcpApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { StrategyDetail } from './StrategyDetail';

export const PromptTestingLab: React.FC = () => {
  const {
    currentPrompt,
    selectedStrategy,
    refinementHistory,
    isRefining,
    setCurrentPrompt,
    addRefinementResult,
    setIsRefining,
  } = useStore();

  const [inputPrompt, setInputPrompt] = useState(currentPrompt);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [autoRefine, setAutoRefine] = useState(false);
  const [refinementDebounce, setRefinementDebounce] = useState<NodeJS.Timeout | null>(null);
  const [showStrategyDetail, setShowStrategyDetail] = useState(false);

  useEffect(() => {
    if (autoRefine && inputPrompt && selectedStrategy) {
      if (refinementDebounce) clearTimeout(refinementDebounce);
      const timeout = setTimeout(() => {
        handleRefine();
      }, 1000);
      setRefinementDebounce(timeout);
    }
  }, [inputPrompt, autoRefine, selectedStrategy]);

  const handleRefine = async () => {
    if (!inputPrompt.trim()) return;

    try {
      setIsRefining(true);
      const result = await mcpApi.refinePrompt(
        inputPrompt,
        selectedStrategy?.id
      );
      
      setRefinedPrompt(result.refinedPrompt);
      addRefinementResult(result);
      setCurrentPrompt(inputPrompt);
    } catch (error) {
      console.error('Refinement error:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSave = () => {
    if (refinedPrompt) {
      setInputPrompt(refinedPrompt);
      setCurrentPrompt(refinedPrompt);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Prompt Testing Lab</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Test and refine your prompts with AI assistance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefine(!autoRefine)}
              className={cn(autoRefine && 'bg-blue-50 border-blue-500')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-refine: {autoRefine ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Show Diff: {showDiff ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {selectedStrategy && (
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">Active Strategy:</span> {selectedStrategy.name}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStrategyDetail(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        <div className="flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Original Prompt</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(inputPrompt)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={inputPrompt}
                onChange={(value) => setInputPrompt(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleRefine}
            disabled={isRefining || !inputPrompt.trim()}
            className="w-full"
          >
            {isRefining ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Refine Prompt
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Refined Prompt</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(refinedPrompt)}
                    disabled={!refinedPrompt}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!refinedPrompt}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={refinedPrompt}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </CardContent>
          </Card>

          {refinementHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Strategy:</span>
                    <span className="font-medium">{refinementHistory[refinementHistory.length - 1].strategy}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence:</span>
                    <span className={cn('font-medium', getConfidenceColor(refinementHistory[refinementHistory.length - 1].confidence))}>
                      {(refinementHistory[refinementHistory.length - 1].confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Response Time:</span>
                    <span className="font-medium">{refinementHistory[refinementHistory.length - 1].refinementTime}ms</span>
                  </div>
                  {refinementHistory[refinementHistory.length - 1].suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Suggestions:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {refinementHistory[refinementHistory.length - 1].suggestions.map((suggestion, i) => (
                          <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Strategy Detail Modal */}
      <StrategyDetail
        strategy={selectedStrategy}
        isOpen={showStrategyDetail}
        onClose={() => setShowStrategyDetail(false)}
      />
    </div>
  );
};