#!/usr/bin/env python3
"""
Prompt++ MCP Server with Closed-Loop Meta-Prompting
Enables Claude Code to self-enhance prompts through MCP prompts
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from pathlib import Path

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp.types import Tool, TextContent, Prompt, PromptMessage, SamplingMessage

from .core import StrategyManager, PromptRefiner

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PromptPlusMCPServer:
    def __init__(self):
        self.server = Server("prompt-plus-mcp")
        self.strategy_manager = None
        self.prompt_refiner = None
        self.setup_handlers()
    
    def initialize_components(self):
        """Initialize core components"""
        try:
            self.strategy_manager = StrategyManager()
            self.prompt_refiner = PromptRefiner(self.strategy_manager)
            logger.info(f"Loaded {len(self.strategy_manager.strategies)} metaprompt strategies")
        except Exception as e:
            logger.error(f"Error initializing components: {e}")
            raise
    
    def setup_handlers(self):
        """Set up MCP protocol handlers"""
        
        @self.server.list_prompts()
        async def handle_list_prompts() -> List[Prompt]:
            """List available prompts for meta-prompting"""
            # Initialize if not already done
            if not self.strategy_manager:
                self.initialize_components()
            
            prompts = []
            
            # Create a prompt for each strategy
            for key, strategy in self.strategy_manager.strategies.items():
                prompts.append(
                    Prompt(
                        name=f"refine_with_{key}",
                        description=f"Refine a prompt using {strategy.name}: {strategy.description}",
                        arguments=[
                            {
                                "name": "user_prompt",
                                "description": "The prompt to refine",
                                "required": True
                            }
                        ]
                    )
                )
            
            # Add auto-selection prompt
            prompts.append(
                Prompt(
                    name="auto_refine",
                    description="Automatically select the best strategy and refine the prompt",
                    arguments=[
                        {
                            "name": "user_prompt",
                            "description": "The prompt to refine",
                            "required": True
                        }
                    ]
                )
            )
            
            # Add comparison prompt
            prompts.append(
                Prompt(
                    name="compare_refinements",
                    description="Compare multiple refinement strategies for a prompt",
                    arguments=[
                        {
                            "name": "user_prompt",
                            "description": "The prompt to refine",
                            "required": True
                        },
                        {
                            "name": "strategies",
                            "description": "Comma-separated list of strategies to compare (optional)",
                            "required": False
                        }
                    ]
                )
            )
            
            # Add two-step workflow prompts
            prompts.append(
                Prompt(
                    name="prepare_refinement",
                    description="Step 1: Analyze user prompt and return metaprompt execution instructions",
                    arguments=[
                        {
                            "name": "user_prompt",
                            "description": "The prompt to prepare for refinement",
                            "required": True
                        }
                    ]
                )
            )
            
            prompts.append(
                Prompt(
                    name="execute_refinement",
                    description="Step 2: Process metaprompt results and return final refined prompt",
                    arguments=[
                        {
                            "name": "metaprompt_results",
                            "description": "The results from executing the metaprompt",
                            "required": True
                        },
                        {
                            "name": "original_prompt",
                            "description": "The original user prompt (for context)",
                            "required": True
                        }
                    ]
                )
            )
            
            return prompts
        
        @self.server.get_prompt()
        async def handle_get_prompt(name: str, arguments: Optional[Dict[str, Any]] = None) -> PromptMessage:
            """Get a specific prompt for meta-prompting"""
            # Initialize if not already done
            if not self.strategy_manager:
                self.initialize_components()
            
            if arguments is None:
                arguments = {}
            
            user_prompt = arguments.get("user_prompt", "[User prompt will be inserted here]")
            
            if name == "auto_refine":
                # Auto-select strategy and create meta-prompt
                auto_result = self.prompt_refiner.auto_select_strategy(user_prompt)
                strategy_key = auto_result["recommended_strategy"]
                strategy = self.strategy_manager.get_strategy(strategy_key)
                
                if not strategy:
                    raise ValueError(f"Strategy '{strategy_key}' not found")
                
                # Create the meta-prompt
                messages = [
                    SamplingMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=f"""You are an expert prompt engineer. Based on the analysis, the '{strategy.name}' strategy is most suitable for this prompt because: {auto_result['reason']}.

Apply the following meta-prompt template to refine the user's prompt. Process it completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
{strategy.template.replace("[Insert initial prompt here]", user_prompt)}

Remember to return your response in valid JSON format."""
                        )
                    )
                ]
                
                return PromptMessage(messages=messages)
            
            elif name.startswith("refine_with_"):
                # Extract strategy key
                strategy_key = name.replace("refine_with_", "")
                strategy = self.strategy_manager.get_strategy(strategy_key)
                
                if not strategy:
                    raise ValueError(f"Strategy '{strategy_key}' not found")
                
                # Create the meta-prompt
                messages = [
                    SamplingMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=f"""You are an expert prompt engineer. Apply the '{strategy.name}' meta-prompt template to refine the following user prompt.

{strategy.description}

Process the meta-prompt completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
{strategy.template.replace("[Insert initial prompt here]", user_prompt)}

Remember to return your response in valid JSON format."""
                        )
                    )
                ]
                
                return PromptMessage(messages=messages)
            
            elif name == "compare_refinements":
                # Compare multiple strategies
                strategies_str = arguments.get("strategies", "")
                if strategies_str:
                    strategy_keys = [s.strip() for s in strategies_str.split(",")]
                else:
                    # Auto-select top 3
                    auto_result = self.prompt_refiner.auto_select_strategy(user_prompt)
                    strategy_keys = [
                        auto_result["recommended_strategy"],
                        auto_result["alternative"],
                        "physics"  # Default third option
                    ]
                
                # Create comparison prompts
                comparison_text = "You are an expert prompt engineer. Compare the following refinement strategies for the given prompt:\n\n"
                comparison_text += f"Original prompt: {user_prompt}\n\n"
                
                for key in strategy_keys[:3]:  # Limit to 3 for readability
                    strategy = self.strategy_manager.get_strategy(key)
                    if strategy:
                        comparison_text += f"**Strategy: {strategy.name}**\n"
                        comparison_text += f"Description: {strategy.description}\n"
                        comparison_text += f"Approach: Apply this template and evaluate effectiveness\n\n"
                
                comparison_text += """Analyze each strategy and return a JSON response with:
1. comparisons: Object with each strategy's strengths, weaknesses, and suitability score (0-100)
2. recommendation: The best strategy key
3. reasoning: Why this strategy is best for this specific prompt
4. sample_refinement: A brief example of how the recommended strategy would enhance the prompt

Return your response in valid JSON format."""
                
                messages = [
                    SamplingMessage(
                        role="user",
                        content=TextContent(type="text", text=comparison_text)
                    )
                ]
                
                return PromptMessage(messages=messages)
            
            elif name == "prepare_refinement":
                # Step 1: Analyze prompt and return metaprompt execution instructions
                auto_result = self.prompt_refiner.auto_select_strategy(user_prompt)
                strategy_key = auto_result["recommended_strategy"]
                strategy = self.strategy_manager.get_strategy(strategy_key)
                
                if not strategy:
                    raise ValueError(f"Strategy '{strategy_key}' not found")
                
                # Create the metaprompt template with user's prompt
                metaprompt_template = strategy.template.replace("[Insert initial prompt here]", user_prompt)
                
                # Return instructions for executing the metaprompt
                messages = [
                    SamplingMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=f"""STEP 1 COMPLETE: Metaprompt preparation for prompt refinement.

**Analysis Results:**
- Selected Strategy: {strategy.name}
- Reason: {auto_result['reason']}
- Alternative: {auto_result['alternative_name']}

**Instructions for Next Step:**
Execute the following metaprompt and return the results to the `execute_refinement` prompt:

---
{metaprompt_template}
---

**Expected Output:** Process this metaprompt completely and provide your detailed analysis and refined prompt. Then call the `execute_refinement` prompt with your results to get the final refined prompt.

**Original Prompt (for reference):** {user_prompt}"""
                        )
                    )
                ]
                
                return PromptMessage(messages=messages)
            
            elif name == "execute_refinement":
                # Step 2: Process metaprompt results and return final refined prompt
                metaprompt_results = arguments.get("metaprompt_results", "")
                original_prompt = arguments.get("original_prompt", user_prompt)
                
                if not metaprompt_results:
                    raise ValueError("metaprompt_results is required for execute_refinement")
                
                messages = [
                    SamplingMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=f"""STEP 2: Final refinement processing.

**Task:** Extract the refined prompt from the metaprompt execution results and format it as the final output.

**Original Prompt:** {original_prompt}

**Metaprompt Execution Results:**
{metaprompt_results}

**Your Task:** 
1. Analyze the metaprompt execution results above
2. Extract the key improvements and refined prompt
3. Return a clean, final refined prompt that incorporates all the enhancements
4. Provide a brief summary of the key improvements made

**Format your response as:**
```
REFINED PROMPT:
[The final, polished prompt ready for use]

IMPROVEMENTS SUMMARY:
[Brief summary of key enhancements made]
```"""
                        )
                    )
                ]
                
                return PromptMessage(messages=messages)
            
            else:
                raise ValueError(f"Unknown prompt: {name}")
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            """List available tools"""
            # Initialize if not already done
            if not self.strategy_manager:
                self.initialize_components()
            
            return [
                Tool(
                    name="list_strategies",
                    description="List all available metaprompt strategies with descriptions",
                    inputSchema={
                        "type": "object",
                        "properties": {}
                    }
                ),
                Tool(
                    name="get_strategy_details",
                    description="Get detailed information about a specific strategy",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "strategy": {
                                "type": "string",
                                "enum": self.strategy_manager.get_strategy_names() if self.strategy_manager else [],
                                "description": "The strategy to get details for"
                            }
                        },
                        "required": ["strategy"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
            """Handle tool calls"""
            try:
                # Initialize if not already done
                if not self.strategy_manager:
                    self.initialize_components()
                
                if name == "list_strategies":
                    result = await self.list_strategies()
                elif name == "get_strategy_details":
                    result = await self.get_strategy_details(arguments["strategy"])
                else:
                    result = {"error": f"Unknown tool: {name}"}
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error handling tool {name}: {str(e)}")
                return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]
    
    async def list_strategies(self) -> Dict[str, Any]:
        """List all available strategies"""
        try:
            strategies_info = {}
            for key, strategy in self.strategy_manager.strategies.items():
                strategies_info[key] = {
                    "name": strategy.name,
                    "description": strategy.description,
                    "prompt_name": f"refine_with_{key}",
                    "examples": strategy.examples[:2] if strategy.examples else []
                }
            
            return {
                "strategies": strategies_info,
                "usage": "Use the prompt name (e.g., 'refine_with_star') to refine prompts with that strategy",
                "auto_refine": "Use 'auto_refine' prompt to automatically select the best strategy"
            }
        except Exception as e:
            logger.error(f"Error in list_strategies: {e}")
            return {"error": str(e)}
    
    async def get_strategy_details(self, strategy_key: str) -> Dict[str, Any]:
        """Get detailed information about a strategy"""
        try:
            strategy = self.strategy_manager.get_strategy(strategy_key)
            if not strategy:
                return {"error": f"Strategy '{strategy_key}' not found"}
            
            return {
                "key": strategy_key,
                "name": strategy.name,
                "description": strategy.description,
                "examples": strategy.examples,
                "prompt_name": f"refine_with_{strategy_key}",
                "template_preview": strategy.template[:200] + "..." if len(strategy.template) > 200 else strategy.template
            }
        except Exception as e:
            logger.error(f"Error in get_strategy_details: {e}")
            return {"error": str(e)}
    
    async def run(self):
        """Run the MCP server"""
        # Initialize components
        self.initialize_components()
        
        # Run the server using stdio transport
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            init_options = InitializationOptions(
                server_name="prompt-plus-mcp",
                server_version="1.0.0",
                capabilities=self.server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            )
            
            await self.server.run(
                read_stream=read_stream,
                write_stream=write_stream,
                initialization_options=init_options
            )


def main():
    """Main entry point"""
    server = PromptPlusMCPServer()
    asyncio.run(server.run())


if __name__ == "__main__":
    main()