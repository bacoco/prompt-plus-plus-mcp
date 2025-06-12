import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  BarChart,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { mcpApi } from '../services/api';
import { cn } from '../lib/utils';
import { OutputComparison } from './OutputComparison';
import type { Strategy } from '../services/api';

export const PromptRefiner: React.FC = () => {
  // Dynamic data from MCP
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [refinementMethods, setRefinementMethods] = useState<Array<{id: string, label: string}>>([]);
  const [promptExamples, setPromptExamples] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // State matching the Gradio app
  const [promptText, setPromptText] = useState('');
  const [metaPromptChoice, setMetaPromptChoice] = useState('arpe');
  const [applyModel, setApplyModel] = useState(''); // Will be set after models load
  const [metaPromptAnalysis, setMetaPromptAnalysis] = useState('');
  const [promptEvaluation, setPromptEvaluation] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [explanationOfRefinements, setExplanationOfRefinements] = useState('');
  const [fullResponseJson, setFullResponseJson] = useState<any>(null);
  const [originalOutput, setOriginalOutput] = useState('');
  const [refinedOutput, setRefinedOutput] = useState('');
  const [originalOutput1, setOriginalOutput1] = useState('');
  const [refinedOutput1, setRefinedOutput1] = useState('');
  
  // UI state
  const [showExamples, setShowExamples] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  // Button states: 'highlight', 'waiting', 'completed', 'active'
  const [automaticButtonState, setAutomaticButtonState] = useState('highlight');
  const [refineButtonState, setRefineButtonState] = useState('waiting');
  const [applyButtonState, setApplyButtonState] = useState('waiting');

  // Load strategies and extract data on mount
  useEffect(() => {
    loadStrategiesData();
  }, []);

  const loadStrategiesData = async () => {
    try {
      setLoadingData(true);
      const strategiesData = await mcpApi.getStrategies();
      setStrategies(strategiesData);
      
      // Extract refinement methods from core_strategies category
      const coreStrategies = strategiesData.filter(s => s.category === 'core_strategies');
      const methods = coreStrategies.map(s => ({
        id: s.id,
        label: s.name
      }));
      setRefinementMethods(methods);
      
      // Set default metaprompt choice
      if (methods.length > 0 && !metaPromptChoice) {
        setMetaPromptChoice(methods[0].id);
      }
      
      // Extract example prompts from strategies that have examples
      const examples: string[] = [];
      strategiesData.forEach(strategy => {
        if (strategy.content?.examples && Array.isArray(strategy.content.examples)) {
          strategy.content.examples.forEach((ex: any) => {
            if (typeof ex === 'string' && !examples.includes(ex)) {
              examples.push(ex);
            } else if (ex.prompt && !examples.includes(ex.prompt)) {
              examples.push(ex.prompt);
            }
          });
        }
      });
      
      // If no examples found, use some defaults
      if (examples.length === 0) {
        examples.push(
          "Write a Python function to calculate the factorial of a number",
          "Explain quantum computing to a 10-year-old",
          "Create a marketing strategy for a new eco-friendly product",
          "Design a REST API for a task management system",
          "Write a haiku about artificial intelligence"
        );
      }
      
      setPromptExamples(examples.slice(0, 5)); // Limit to 5 examples
      
      // For models, we'll use a placeholder message since they should come from MCP
      const defaultModels = [
        "meta-llama/Meta-Llama-3-70B-Instruct",
        "meta-llama/Llama-3.1-70B-Instruct",
        "meta-llama/Llama-3.2-3B-Instruct",
        "microsoft/Phi-3.5-mini-instruct"
      ];
      setModels(defaultModels);
      setApplyModel(defaultModels[defaultModels.length - 1]);
      
    } catch (error) {
      console.error('Failed to load strategies:', error);
      // Set some defaults on error
      setRefinementMethods([{ id: 'arpe', label: 'ARPE Framework' }]);
      setPromptExamples(["Write a simple example prompt"]);
      setModels(["No models available"]);
    } finally {
      setLoadingData(false);
    }
  };

  // Clear outputs when prompt changes (matching Gradio behavior)
  useEffect(() => {
    if (promptText !== undefined) {
      // Clear all outputs
      setMetaPromptAnalysis('');
      setPromptEvaluation('');
      setRefinedPrompt('');
      setExplanationOfRefinements('');
      setOriginalOutput('');
      setRefinedOutput('');
      setOriginalOutput1('');
      setRefinedOutput1('');
      setFullResponseJson(null);
      
      // Reset button states
      setAutomaticButtonState('highlight');
      setRefineButtonState('waiting');
      setApplyButtonState('waiting');
    }
  }, [promptText]);

  // Automatic metaprompt selection (matching prompt_refiner.py)
  const handleAutomaticMetaprompt = async () => {
    if (!promptText.trim()) {
      setMetaPromptAnalysis('Please enter a prompt to analyze.');
      return;
    }
    
    setIsAnalyzing(true);
    setAutomaticButtonState('active');
    
    try {
      // Clear subsequent outputs
      setPromptEvaluation('');
      setRefinedPrompt('');
      setExplanationOfRefinements('');
      setOriginalOutput('');
      setRefinedOutput('');
      setOriginalOutput1('');
      setRefinedOutput1('');
      
      // Call the automatic metaprompt selection
      const result = await mcpApi.automaticMetaprompt(promptText);
      
      setMetaPromptAnalysis(result.analysis);
      setMetaPromptChoice(result.recommendedKey);
      
      // Update button states
      setAutomaticButtonState('completed');
      setRefineButtonState('highlight');
      setApplyButtonState('waiting');
    } catch (error) {
      console.error('Analysis error:', error);
      setMetaPromptAnalysis(`Error in automatic metaprompt: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Refine prompt (matching prompt_refiner.py)
  const handleRefinePrompt = async () => {
    if (!promptText.trim()) {
      setPromptEvaluation('No prompt provided.');
      setRefinedPrompt('');
      setExplanationOfRefinements('');
      setFullResponseJson({});
      return;
    }
    
    setIsRefining(true);
    setRefineButtonState('active');
    
    try {
      // Clear model outputs
      setOriginalOutput('');
      setRefinedOutput('');
      setOriginalOutput1('');
      setRefinedOutput1('');
      
      const result = await mcpApi.refinePromptWithStrategy(promptText, metaPromptChoice);
      
      setPromptEvaluation(result.initialPromptEvaluation);
      setRefinedPrompt(result.refinedPrompt);
      setExplanationOfRefinements(result.explanationOfRefinements);
      setFullResponseJson(result.fullResponse);
      
      // Update button states
      setAutomaticButtonState('completed');
      setRefineButtonState('completed');
      setApplyButtonState('highlight');
    } catch (error) {
      console.error('Refinement error:', error);
      const errorMsg = `Error in refine_prompt: ${error}`;
      setPromptEvaluation(errorMsg);
      setRefinedPrompt('');
      setExplanationOfRefinements('');
      setFullResponseJson({});
    } finally {
      setIsRefining(false);
    }
  };

  // Apply prompts to model (matching app.py)
  const handleApplyPrompts = async () => {
    if (!promptText || !refinedPrompt) {
      const msg = 'Please provide both original and refined prompts.';
      setOriginalOutput(msg);
      setRefinedOutput(msg);
      setOriginalOutput1(msg);
      setRefinedOutput1(msg);
      return;
    }
    
    if (!applyModel) {
      const msg = 'Please select a model.';
      setOriginalOutput(msg);
      setRefinedOutput(msg);
      setOriginalOutput1(msg);
      setRefinedOutput1(msg);
      return;
    }
    
    setIsApplying(true);
    setApplyButtonState('active');
    
    try {
      // Apply both prompts
      const [originalResult, refinedResult] = await Promise.all([
        mcpApi.applyPrompt(promptText, applyModel),
        mcpApi.applyPrompt(refinedPrompt, applyModel)
      ]);
      
      // Set outputs for all tabs (matching Gradio's behavior)
      setOriginalOutput(originalResult);
      setRefinedOutput(refinedResult);
      setOriginalOutput1(originalResult); // For comparison tab
      setRefinedOutput1(refinedResult);   // For comparison tab
      
      // Update button states
      setApplyButtonState('completed');
    } catch (error) {
      console.error('Apply error:', error);
      const errorMsg = `Error in apply_prompts: ${error}`;
      setOriginalOutput(errorMsg);
      setRefinedOutput(errorMsg);
      setOriginalOutput1(errorMsg);
      setRefinedOutput1(errorMsg);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(refinedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleClick = (example: string) => {
    setPromptText(example);
    setShowExamples(false);
  };

  // Get button class based on state
  const getButtonClass = (state: string) => {
    switch (state) {
      case 'highlight':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'waiting':
        return 'bg-gray-300 hover:bg-gray-400 text-gray-600';
      case 'active':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      default:
        return '';
    }
  };

  if (loadingData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading strategies from MCP server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Container with Glass Effect */}
        <div className="text-center space-y-2 p-8 glass rounded-3xl mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent glass-shimmer">
            PROMPT++
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Automating Prompt Engineering by Refining your Prompts
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Learn how to generate an improved version of your prompts.
          </p>
        </div>

        {/* Input Container */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type your prompt (or leave empty to see metaprompt)"
              className="w-full h-32 p-4 glass-input resize-none"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-2"
            >
              Prompt Examples
              {showExamples ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showExamples && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {promptExamples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-3 glass rounded-xl glass-hover transition-all text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleAutomaticMetaprompt}
              disabled={isAnalyzing}
              className={cn("w-full", getButtonClass(automaticButtonState))}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Automatic Choice for Refinement Method'
              )}
            </Button>
            
            {metaPromptAnalysis && (
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: metaPromptAnalysis.replace(/\n/g, '<br>') }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Container */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">Choose Meta Prompt</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {refinementMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setMetaPromptChoice(method.id)}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all glass-hover",
                    metaPromptChoice === method.id
                      ? "liquid-button bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "glass"
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefinePrompt}
              disabled={isRefining}
              className={cn("w-full liquid-button py-3 font-semibold", getButtonClass(refineButtonState))}
            >
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refining...
                </>
              ) : (
                'Refine Prompt'
              )}
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Metaprompt Explanation
              {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showExplanation && (
              <div className="p-4 glass rounded-xl glass-shimmer">
                <p className="text-sm">
                  Metaprompts are structured templates that guide the refinement process. Each method has specific strengths and use cases.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Container */}
        {(promptEvaluation || refinedPrompt || explanationOfRefinements) && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              {promptEvaluation && (
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: promptEvaluation.replace(/\n/g, '<br>') }} />
                </div>
              )}
              
              {refinedPrompt && (
                <>
                  <h3 className="text-lg font-semibold">Refined Prompt</h3>
                  <div className="relative">
                    <div className="glass rounded-xl p-4">
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {refinedPrompt}
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="absolute top-2 right-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
              
              {explanationOfRefinements && (
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: explanationOfRefinements.replace(/\n/g, '<br>') }} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Model Container */}
        {refinedPrompt && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-4">
                <select
                  value={applyModel}
                  onChange={(e) => setApplyModel(e.target.value)}
                  className="flex-1 p-2 border rounded-lg"
                >
                  {models.length === 0 ? (
                    <option value="">No models configured - check MCP server</option>
                  ) : (
                    models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))
                  )}
                </select>
                
                <Button 
                  onClick={handleApplyPrompts}
                  disabled={isApplying}
                  className={cn(getButtonClass(applyButtonState))}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Prompts'
                  )}
                </Button>
              </div>

              <h3 className="text-lg font-semibold">Prompts on Chosen Model</h3>
              
              {/* Tab content would go here - simplified for now */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-center text-blue-600">Original Prompt Output</h4>
                  <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-white dark:bg-gray-900">
                    <pre className="text-sm whitespace-pre-wrap">{originalOutput || 'Output will appear here'}</pre>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-center text-blue-600">Refined Prompt Output</h4>
                  <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-white dark:bg-gray-900">
                    <pre className="text-sm whitespace-pre-wrap">{refinedOutput || 'Output will appear here'}</pre>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullResponse(!showFullResponse)}
                className="flex items-center gap-2"
              >
                Full Response JSON
                {showFullResponse ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showFullResponse && fullResponseJson && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
                  <pre className="text-xs font-mono">{JSON.stringify(fullResponseJson, null, 2)}</pre>
                </div>
              )}

              {/* Output Comparison Graphs */}
              {originalOutput && refinedOutput && (
                <OutputComparison 
                  originalOutput={originalOutput}
                  refinedOutput={refinedOutput}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-x-4 pb-6">
          <span>Use via API 🔌</span>
          <span>•</span>
          <span>Construit avec Gradio 😊</span>
        </div>
      </div>
    </div>
  );
};