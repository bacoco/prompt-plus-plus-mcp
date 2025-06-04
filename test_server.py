#!/usr/bin/env python3
"""
Test the Prompt++ MCP server
"""

import asyncio
import json
from src.server import PromptPlusMCPServer


async def test_server():
    """Test the MCP server functionality"""
    # Create server instance
    server = PromptPlusMCPServer()
    server.initialize_components()
    
    print("Prompt++ MCP Server Test")
    print("=" * 50)
    print()
    
    # Test 1: List all strategies
    print("1. Available Strategies:")
    strategies_result = await server.list_strategies()
    strategies = strategies_result.get("strategies", {})
    for key, info in strategies.items():
        print(f"   - {key}: {info['name']}")
    
    # Test 2: Auto-select strategy
    test_prompt = "Write a story about a robot learning to paint"
    print(f"\n2. Auto-selecting strategy for: '{test_prompt}'")
    auto_result = await server.auto_select_strategy(test_prompt)
    
    if "error" in auto_result:
        print(f"   Error: {auto_result['error']}")
    else:
        print(f"   Recommended: {auto_result['recommended_strategy']} - {auto_result['strategy_name']}")
        print(f"   Reason: {auto_result['reason']}")
        if auto_result.get('alternative'):
            print(f"   Alternative: {auto_result['alternative']} - {auto_result.get('alternative_name', 'N/A')}")
    
    # Test 3: Refine a prompt
    print(f"\n3. Refining prompt with 'morphosis' strategy")
    refine_result = await server.refine_prompt(test_prompt, "morphosis")
    
    if "error" in refine_result:
        print(f"   Error: {refine_result['error']}")
    else:
        print(f"   Strategy: {refine_result['strategy_name']}")
        print(f"   Description: {refine_result['strategy_description']}")
        print("   Instructions have been generated. Copy the 'instruction_for_cursor' to Cursor for processing.")
    
    # Test 4: Compare strategies
    print(f"\n4. Comparing strategies for the prompt")
    compare_result = await server.compare_strategies(
        test_prompt, 
        ["star", "morphosis", "verse"]
    )
    
    if "error" in compare_result:
        print(f"   Error: {compare_result['error']}")
    else:
        print(f"   Best match: {compare_result['recommendation']}")
        for strategy, info in compare_result['comparisons'].items():
            print(f"   - {strategy}: Suitability {info['suitability']}/100, Complexity: {info['complexity']}")
        print(f"   Reasoning: {compare_result['reasoning']}")


if __name__ == "__main__":
    asyncio.run(test_server())