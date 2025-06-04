"""Core prompt refinement logic for Prompt++ MCP server."""

import json
import re
from typing import Tuple, Dict, Any, Optional
from .models import RefineResult, ComparisonResult
from .strategy_manager import StrategyManager


class PromptRefiner:
    """Core class for refining prompts using metaprompt strategies."""
    
    def __init__(self, strategy_manager: StrategyManager):
        """Initialize the prompt refiner.
        
        Args:
            strategy_manager: Manager for metaprompt strategies.
        """
        self.strategy_manager = strategy_manager
    
    def refine_prompt(self, prompt: str, strategy_key: str) -> RefineResult:
        """Refine a prompt using a specific strategy.
        
        Args:
            prompt: The prompt to refine.
            strategy_key: The key of the strategy to use.
            
        Returns:
            RefineResult with the refined prompt instruction.
        """
        strategy = self.strategy_manager.get_strategy(strategy_key)
        if not strategy:
            raise ValueError(f"Strategy '{strategy_key}' not found")
        
        # Prepare the metaprompt
        metaprompt = strategy.template.replace("[Insert initial prompt here]", prompt)
        
        # Return instruction for external processing
        instruction = f"""
Please process the following metaprompt and return a JSON response with the following structure:
```json
{{
  "initial_prompt_evaluation": "Your evaluation of the initial prompt, highlighting its strengths and weaknesses",
  "refined_prompt": "The improved, refined version of the original prompt",
  "explanation_of_refinements": "Detailed explanation of the changes made and why they improve the prompt"
}}
```

Here is the metaprompt to process:

{metaprompt}
"""
        return RefineResult(
            strategy_key=strategy_key,
            strategy_name=strategy.name,
            strategy_description=strategy.description,
            initial_prompt_evaluation="",
            refined_prompt="",
            explanation_of_refinements="",
            instruction_for_cursor=instruction
        )
    
    def auto_select_strategy(self, prompt: str) -> Dict[str, Any]:
        """Automatically select the best strategy for a prompt using heuristics.
        
        Args:
            prompt: The prompt to analyze.
            
        Returns:
            Dictionary with the recommended strategy.
        """
        prompt_lower = prompt.lower()
        word_count = len(prompt.split())
        
        # Simple heuristics for strategy selection
        if any(keyword in prompt_lower for keyword in ["story", "creative", "narrative", "fiction"]):
            recommended_key = "star"
            reason = "Comprehensive approach ideal for creative and narrative tasks"
        elif any(keyword in prompt_lower for keyword in ["code", "programming", "technical", "implement", "function"]):
            recommended_key = "verse"
            reason = "Structured approach excellent for technical and coding tasks"
        elif any(keyword in prompt_lower for keyword in ["math", "proof", "equation", "theorem", "formula"]):
            recommended_key = "math"
            reason = "Specialized approach for mathematical and formal reasoning"
        elif any(keyword in prompt_lower for keyword in ["analyze", "compare", "evaluate", "scientific"]):
            recommended_key = "physics"
            reason = "Balanced analytical approach for scientific analysis"
        elif any(keyword in prompt_lower for keyword in ["optimize", "improve", "enhance", "refine"]):
            recommended_key = "bolism"
            reason = "Optimization-focused approach for improvement tasks"
        elif word_count < 15:
            recommended_key = "morphosis"
            reason = "Simple and efficient approach for short prompts"
        elif word_count > 50:
            recommended_key = "star"
            reason = "Comprehensive approach for complex, detailed prompts"
        else:
            recommended_key = "done"
            reason = "Well-rounded approach with role-playing and advanced techniques"
        
        strategy = self.strategy_manager.get_strategy(recommended_key)
        
        # Determine alternative
        alternatives = {
            "star": "verse",
            "verse": "physics",
            "math": "arpe",
            "physics": "verse",
            "morphosis": "phor",
            "done": "star",
            "bolism": "touille",
            "arpe": "math",
            "phor": "morphosis",
            "touille": "done"
        }
        
        alternative_key = alternatives.get(recommended_key, "star")
        alternative_strategy = self.strategy_manager.get_strategy(alternative_key)
        
        return {
            "user_query": prompt,
            "recommended_strategy": recommended_key,
            "strategy_name": strategy.name if strategy else recommended_key,
            "reason": reason,
            "alternative": alternative_key,
            "alternative_name": alternative_strategy.name if alternative_strategy else alternative_key,
            "prompt_characteristics": {
                "word_count": word_count,
                "detected_type": self._detect_prompt_type(prompt_lower)
            }
        }
    
    def compare_strategies(self, prompt: str, strategy_keys: Optional[list] = None) -> ComparisonResult:
        """Compare multiple strategies for a prompt.
        
        Args:
            prompt: The prompt to analyze.
            strategy_keys: List of strategy keys to compare. If None, compares top 3.
            
        Returns:
            ComparisonResult with comparison data.
        """
        if strategy_keys is None:
            # Auto-select top 3 strategies
            auto_selection = self.auto_select_strategy(prompt)
            strategy_keys = [
                auto_selection["recommended_strategy"],
                auto_selection["alternative"],
                "physics"  # Default third option
            ]
            # Ensure uniqueness
            strategy_keys = list(dict.fromkeys(strategy_keys))[:3]
        
        comparisons = {}
        for key in strategy_keys:
            strategy = self.strategy_manager.get_strategy(key)
            if strategy:
                # Score based on prompt characteristics
                score = self._score_strategy_fit(prompt, strategy)
                comparisons[key] = {
                    "name": strategy.name,
                    "suitability": score["suitability"],
                    "complexity": score["complexity"],
                    "strengths": score["strengths"]
                }
        
        # Determine best match
        best_key = max(comparisons.keys(), key=lambda k: comparisons[k]["suitability"])
        
        return ComparisonResult(
            prompt=prompt,
            comparisons=comparisons,
            recommendation=best_key,
            reasoning=f"Based on the analysis, '{comparisons[best_key]['name']}' is the best fit due to its {', '.join(comparisons[best_key]['strengths'])}"
        )
    
    def _detect_prompt_type(self, prompt_lower: str) -> str:
        """Detect the type of prompt based on keywords."""
        if any(word in prompt_lower for word in ["story", "creative", "narrative"]):
            return "creative"
        elif any(word in prompt_lower for word in ["code", "programming", "technical"]):
            return "technical"
        elif any(word in prompt_lower for word in ["math", "proof", "equation"]):
            return "mathematical"
        elif any(word in prompt_lower for word in ["analyze", "scientific", "research"]):
            return "analytical"
        else:
            return "general"
    
    def _score_strategy_fit(self, prompt: str, strategy) -> Dict[str, Any]:
        """Score how well a strategy fits a prompt."""
        prompt_lower = prompt.lower()
        
        # Basic scoring heuristics
        suitability = 50  # Base score
        complexity = 50
        strengths = []
        
        # Check for keywords that match strategy strengths
        if "creative" in strategy.description.lower() or "story" in strategy.description.lower():
            if any(word in prompt_lower for word in ["story", "creative", "narrative", "fiction"]):
                suitability += 20
                strengths.append("creative focus")
        
        if "technical" in strategy.description.lower() or "code" in strategy.description.lower():
            if any(word in prompt_lower for word in ["code", "technical", "programming", "algorithm"]):
                suitability += 20
                strengths.append("technical expertise")
        
        if "math" in strategy.description.lower():
            if any(word in prompt_lower for word in ["math", "equation", "proof", "theorem"]):
                suitability += 30
                strengths.append("mathematical reasoning")
        
        if "scientific" in strategy.description.lower():
            if any(word in prompt_lower for word in ["scientific", "research", "hypothesis", "experiment"]):
                suitability += 20
                strengths.append("scientific approach")
        
        if "comprehensive" in strategy.description.lower() or "multi-stage" in strategy.description.lower():
            if len(prompt.split()) > 30:
                suitability += 15
                strengths.append("handles complex prompts")
        
        if "simple" in strategy.description.lower() or "quick" in strategy.description.lower():
            if len(prompt.split()) < 20:
                suitability += 15
                strengths.append("efficient for simple tasks")
        
        # Complexity scoring
        if len(prompt.split()) > 50:
            complexity = 80
        elif len(prompt.split()) < 20:
            complexity = 30
        else:
            complexity = 50
        
        # Ensure suitability stays within bounds
        suitability = min(100, suitability)
        
        if not strengths:
            strengths = ["general purpose"]
        
        return {
            "suitability": suitability,
            "complexity": complexity,
            "strengths": strengths
        }