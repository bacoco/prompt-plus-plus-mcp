"""Manages metaprompt strategies for Prompt++ MCP server."""

import json
from pathlib import Path
from typing import Dict, List, Optional
from .models import StrategyInfo


class StrategyManager:
    """Manages loading and accessing metaprompt strategies."""
    
    def __init__(self, strategies_dir: Optional[Path] = None):
        """Initialize the strategy manager.
        
        Args:
            strategies_dir: Directory containing strategy JSON files. 
                          Defaults to 'metaprompts' in project root.
        """
        if strategies_dir is None:
            # Find the project root by looking for package.json
            current_path = Path(__file__).resolve()
            while current_path.parent != current_path:
                if (current_path / "package.json").exists():
                    strategies_dir = current_path / "metaprompts"
                    break
                current_path = current_path.parent
            else:
                strategies_dir = Path("metaprompts")
        
        self.strategies_dir = Path(strategies_dir)
        self.strategies: Dict[str, StrategyInfo] = {}
        self.load_strategies()
    
    def load_strategies(self) -> None:
        """Load all strategy JSON files from the strategies directory."""
        if not self.strategies_dir.exists():
            raise FileNotFoundError(f"Strategies directory not found: {self.strategies_dir}")
        
        for json_file in sorted(self.strategies_dir.glob("*.json")):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    key = json_file.stem
                    self.strategies[key] = StrategyInfo(
                        key=key,
                        name=data.get('name', key),
                        description=data.get('description', ''),
                        examples=data.get('examples', []),
                        template=data.get('template', '')
                    )
            except Exception as e:
                print(f"Error loading strategy {json_file}: {e}")
    
    def get_strategy(self, key: str) -> Optional[StrategyInfo]:
        """Get a specific strategy by key."""
        return self.strategies.get(key)
    
    def list_strategies(self) -> Dict[str, Dict[str, str]]:
        """List all available strategies."""
        return {
            key: {
                "name": strategy.name,
                "description": strategy.description
            }
            for key, strategy in self.strategies.items()
        }
    
    def get_strategy_names(self) -> List[str]:
        """Get list of strategy keys."""
        return list(self.strategies.keys())
    
    def get_strategy_examples(self) -> List[List[str]]:
        """Get all examples from all strategies."""
        examples = []
        for key, strategy in self.strategies.items():
            for example in strategy.examples:
                examples.append([example, key])
        return examples
    
    def generate_router_prompt(self) -> str:
        """Generate the metaprompt router template."""
        router_template = """
You are an AI Prompt Selection Assistant. Your task is to analyze the user's query and recommend the most appropriate metaprompt from the following list based on the nature of the request. Provide your response in a structured JSON format.

**Metaprompt List:**
"""
        
        for i, (key, strategy) in enumerate(self.strategies.items(), 1):
            method_template = f"""
{i}. **{key}**
- **Name**: {strategy.name}
- **Description**: {strategy.description}
- **Sample**: {', '.join(f'"{example}"' for example in strategy.examples[:2])}
"""
            router_template += method_template
        
        router_template += """
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
"""
        
        return router_template