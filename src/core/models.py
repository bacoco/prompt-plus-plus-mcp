"""Data models for Prompt++ MCP server."""

from typing import Optional, Dict, Any, Union, List
from pydantic import BaseModel, Field


class StrategyInfo(BaseModel):
    """Information about a metaprompt strategy."""
    key: str
    name: str
    description: str
    examples: List[str] = Field(default_factory=list)
    template: str


class RefineResult(BaseModel):
    """Result of prompt refinement."""
    strategy_key: str
    strategy_name: str
    strategy_description: str
    initial_prompt_evaluation: str
    refined_prompt: str
    explanation_of_refinements: str
    instruction_for_cursor: Optional[str] = None


class StrategyRecommendation(BaseModel):
    """Recommendation for metaprompt strategy selection."""
    user_query: str
    recommended_metaprompt: Dict[str, str]
    alternative_recommendation: Optional[Dict[str, str]] = None


class ComparisonResult(BaseModel):
    """Result of strategy comparison."""
    prompt: str
    comparisons: Dict[str, Dict[str, Any]]
    recommendation: str
    reasoning: str