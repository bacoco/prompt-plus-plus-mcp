#!/usr/bin/env python3
"""
Test the Prompt++ MCP server's prompt functionality
"""

import asyncio
import json
from src.server import PromptPlusMCPServer


async def test_prompts():
    """Test the MCP server prompt functionality"""
    # Create server instance
    server = PromptPlusMCPServer()
    server.initialize_components()
    
    print("Prompt++ MCP Server - Prompt Testing")
    print("=" * 50)
    print()
    
    # Test 1: List all prompts
    print("1. Available MCP Prompts:")
    prompts = await server.server.list_prompts()
    for prompt in prompts[:5]:  # Show first 5
        print(f"   - {prompt.name}: {prompt.description[:60]}...")
    print(f"   ... and {len(prompts) - 5} more prompts")
    
    # Test 2: Test auto_refine prompt
    test_user_prompt = "Write a function to sort a list"
    print(f"\n2. Testing auto_refine with: '{test_user_prompt}'")
    
    try:
        prompt_message = await server.server.get_prompt(
            "auto_refine", 
            {"user_prompt": test_user_prompt}
        )
        print("   ✓ Generated meta-prompt for automatic strategy selection")
        print(f"   Strategy analysis included in prompt")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 3: Test specific strategy prompt
    print(f"\n3. Testing refine_with_verse (technical strategy)")
    
    try:
        prompt_message = await server.server.get_prompt(
            "refine_with_verse", 
            {"user_prompt": test_user_prompt}
        )
        print("   ✓ Generated meta-prompt using Verse strategy")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Test comparison prompt
    print(f"\n4. Testing compare_refinements")
    
    try:
        prompt_message = await server.server.get_prompt(
            "compare_refinements", 
            {
                "user_prompt": test_user_prompt,
                "strategies": "star,verse,morphosis"
            }
        )
        print("   ✓ Generated comparison prompt for multiple strategies")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 5: List strategies tool
    print(f"\n5. Testing list_strategies tool")
    result = await server.list_strategies()
    if "strategies" in result:
        print("   ✓ Successfully listed all strategies")
        print(f"   Total strategies: {len(result['strategies'])}")
    
    print("\n" + "=" * 50)
    print("Closed-Loop Workflow:")
    print("1. User provides prompt to refine")
    print("2. Claude uses MCP prompt (e.g., auto_refine)")
    print("3. MCP server returns meta-prompt")
    print("4. Claude processes internally and returns refined result")
    print("5. No manual copying or external APIs needed!")


if __name__ == "__main__":
    asyncio.run(test_prompts())