// This constant will be dynamically generated from MCP strategies
// The actual metaprompt router template will be built at runtime
interface StrategyParam {
  id: string;
  name: string;
  description: string;
  category?: string;
  content?: any;
}

export const getMetapromptRouterTemplate = (strategies: Array<StrategyParam>) => {
  const coreStrategies = strategies.filter(s => s.category === 'core_strategies');
  
  const metapromptList = coreStrategies.map((strategy, index) => {
    const examples = strategy.content?.examples || [];
    const samplePrompts = examples
      .slice(0, 2)
      .map((ex: any) => typeof ex === 'string' ? ex : ex.prompt)
      .filter(Boolean)
      .map((prompt: string) => `"${prompt}"`)
      .join(", ") || '"No specific examples available"';
    
    return `${index + 1}. **${strategy.id}**
- **Name**: ${strategy.name}
- **Description**: ${strategy.description}
- **Sample**: ${samplePrompts}`;
  }).join('\n\n');
  
  return `
You are an AI Prompt Selection Assistant. Your task is to analyze the user's query and recommend the most appropriate metaprompt from the available methods. Each method has specific strengths and use cases.

**Metaprompt List:**
${metapromptList}

For this given user query:
[Insert initial prompt here]

Analyze the query and provide your recommendation in the following JSON format enclosed in <json> tags:

<json>
{
"user_query": "The original query from the user",
"recommended_metaprompt": {
    "key": "Key of the recommended metaprompt",
    "name": "Name of the recommended metaprompt",
    "description": "Brief description of the metaprompt's purpose",
    "explanation": "Detailed explanation of why this metaprompt is the best fit for this specific query, including how it addresses the query's unique requirements and challenges",
    "similar_sample": "If available, a sample use case from the list that's most similar to the user's query",
    "customized_sample": "A new sample specifically tailored to the user's query using this metaprompt approach"
},
"alternative_recommendation": {
    "key": "Key of the second-best metaprompt option",
    "name": "Name of the second-best metaprompt option",
    "explanation": "Brief explanation of why this could be an alternative choice and what specific benefits it might offer for this query"
}
}
</json>
`;
};

// Legacy export for backward compatibility - will be empty string
export const metapromptRouter = '';