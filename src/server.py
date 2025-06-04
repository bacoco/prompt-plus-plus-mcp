#!/usr/bin/env python3
"""
Prompt++ MCP Server
Enhances prompts using various metaprompt strategies
"""

import asyncio
import json
import logging
from typing import Any, Dict, List

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PromptPlusMCPServer:
    def __init__(self):
        self.server = Server("prompt-plus-mcp")
        self.metaprompts = {}  # Will be loaded from meta_prompt.txt
        self.setup_handlers()
        
    def setup_handlers(self):
        """Set up MCP protocol handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            return [
                Tool(
                    name="refine_prompt",
                    description="Refine a prompt using a specific metaprompt strategy",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "prompt": {
                                "type": "string",
                                "description": "The prompt to refine"
                            },
                            "strategy": {
                                "type": "string",
                                "enum": list(self.metaprompts.keys()),
                                "description": "The metaprompt strategy to use"
                            }
                        },
                        "required": ["prompt", "strategy"]
                    }
                ),                Tool(
                    name="auto_select_strategy",
                    description="Automatically select the best metaprompt strategy for a given prompt",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "prompt": {
                                "type": "string",
                                "description": "The prompt to analyze"
                            }
                        },
                        "required": ["prompt"]
                    }
                ),
                Tool(
                    name="list_strategies",
                    description="List all available metaprompt strategies with descriptions",
                    inputSchema={
                        "type": "object",
                        "properties": {}
                    }
                ),
                Tool(
                    name="compare_strategies",
                    description="Compare multiple strategies for a given prompt",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "prompt": {
                                "type": "string",
                                "description": "The prompt to refine"
                            },
                            "strategies": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of strategies to compare (optional, uses all if not provided)"
                            }
                        },
                        "required": ["prompt"]
                    }
                )
            ]        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
            try:
                if name == "refine_prompt":
                    result = await self.refine_prompt(
                        arguments["prompt"],
                        arguments["strategy"]
                    )
                elif name == "auto_select_strategy":
                    result = await self.auto_select_strategy(arguments["prompt"])
                elif name == "list_strategies":
                    result = await self.list_strategies()
                elif name == "compare_strategies":
                    result = await self.compare_strategies(
                        arguments["prompt"],
                        arguments.get("strategies", list(self.metaprompts.keys()))
                    )
                else:
                    result = f"Unknown tool: {name}"
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error handling tool {name}: {str(e)}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def refine_prompt(self, prompt: str, strategy: str) -> Dict[str, Any]:
        """Refine a prompt using the specified strategy"""
        if strategy not in self.metaprompts:
            return {"error": f"Unknown strategy: {strategy}"}
        
        metaprompt = self.metaprompts[strategy]
        template = metaprompt["template"]
        
        # Replace placeholder with actual prompt
        filled_template = template.replace("[Insert initial prompt here]", prompt)
        
        # Return structured response for Cursor to process
        return {
            "strategy_used": strategy,
            "strategy_name": metaprompt["name"],
            "strategy_description": metaprompt["description"],
            "instruction_for_cursor": filled_template,
            "expected_json_format": {
                "initial_prompt_evaluation": "Evaluation with strengths and weaknesses",
                "refined_prompt": "The refined version of the prompt",
                "explanation_of_refinements": "Detailed explanation of improvements"
            },
            "usage_hint": "Copy the instruction_for_cursor to Cursor and ask it to process this metaprompt"
        }    
    async def auto_select_strategy(self, prompt: str) -> Dict[str, Any]:
        """Automatically select the best strategy for a prompt"""
        # This is a simplified version - in production, you'd want more sophisticated analysis
        
        # Analyze prompt characteristics
        prompt_lower = prompt.lower()
        word_count = len(prompt.split())
        
        # Simple heuristics for strategy selection
        if any(keyword in prompt_lower for keyword in ["story", "creative", "narrative"]):
            recommended = "star"  # Comprehensive for creative tasks
        elif any(keyword in prompt_lower for keyword in ["code", "technical", "implement"]):
            recommended = "verse"  # Good for technical prompts
        elif any(keyword in prompt_lower for keyword in ["math", "proof", "theorem"]):
            recommended = "math"  # Specialized for mathematical content
        elif word_count < 10:
            recommended = "morphosis"  # Simple approach for short prompts
        elif any(keyword in prompt_lower for keyword in ["analyze", "compare", "evaluate"]):
            recommended = "physics"  # Balanced approach for analysis
        else:
            recommended = "star"  # Default to comprehensive
        
        return {
            "recommended_strategy": recommended,
            "strategy_name": self.metaprompts[recommended]["name"],
            "reason": f"Based on prompt analysis, '{recommended}' strategy is recommended",
            "alternative": "verse" if recommended != "verse" else "star",
            "prompt_characteristics": {
                "word_count": word_count,
                "detected_type": "creative" if "story" in prompt_lower else "technical" if "code" in prompt_lower else "general"
            }
        }    
    async def list_strategies(self) -> Dict[str, Any]:
        """List all available strategies"""
        strategies = {}
        for key, meta in self.metaprompts.items():
            strategies[key] = {
                "name": meta["name"],
                "description": meta["description"],
                "examples": meta.get("examples", [])
            }
        return {"strategies": strategies}
    
    async def compare_strategies(self, prompt: str, strategies: List[str]) -> Dict[str, Any]:
        """Compare multiple strategies for a prompt"""
        comparisons = {}
        
        for strategy in strategies:
            if strategy in self.metaprompts:
                metaprompt = self.metaprompts[strategy]
                comparisons[strategy] = {
                    "name": metaprompt["name"],
                    "description": metaprompt["description"],
                    "suitability": self._assess_suitability(prompt, strategy),
                    "complexity": self._assess_complexity(metaprompt["template"])
                }
        
        return {
            "prompt": prompt,
            "comparisons": comparisons,
            "recommendation": max(comparisons.items(), 
                                key=lambda x: x[1]["suitability"])[0]
        }    
    def _assess_suitability(self, prompt: str, strategy: str) -> int:
        """Assess how suitable a strategy is for a prompt (0-100)"""
        # Simplified scoring - in production, use more sophisticated analysis
        base_score = 50
        
        if strategy == "star" and len(prompt.split()) > 20:
            base_score += 20
        elif strategy == "morphosis" and len(prompt.split()) < 10:
            base_score += 30
        elif strategy == "math" and any(word in prompt.lower() for word in ["math", "proof", "equation"]):
            base_score += 40
            
        return min(base_score, 100)
    
    def _assess_complexity(self, template: str) -> str:
        """Assess the complexity of a metaprompt template"""
        length = len(template)
        if length < 1000:
            return "low"
        elif length < 3000:
            return "medium"
        else:
            return "high"
    
    def load_metaprompts(self, filepath: str = "meta_prompt.txt"):
        """Load metaprompts from file"""
        try:
            with open(filepath, 'r') as f:
                content = f.read()
                # Extract JSON from the file
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                json_content = content[json_start:json_end]
                self.metaprompts = json.loads(json_content)
                logger.info(f"Loaded {len(self.metaprompts)} metaprompt strategies")
        except Exception as e:
            logger.error(f"Error loading metaprompts: {e}")
            # Fallback to a simple default
            self.metaprompts = {
                "simple": {
                    "name": "Simple Refinement",
                    "description": "Basic prompt improvement",
                    "template": "Improve this prompt: [Insert initial prompt here]",
                    "examples": []
                }
            }    
    async def run(self):
        """Run the MCP server"""
        self.load_metaprompts()
        
        # Run the server using stdin/stdout streams
        async with self.server.run(
            stdin=asyncio.StreamReader(),
            stdout=asyncio.StreamWriter(),
            InitializationOptions(
                server_name="prompt-plus-mcp",
                server_version="1.0.0",
                capabilities=self.server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        ) as _:
            await asyncio.Future()  # Run forever

def main():
    """Main entry point"""
    server = PromptPlusMCPServer()
    asyncio.run(server.run())

if __name__ == "__main__":
    main()
