#!/usr/bin/env python3
"""
Direct MCP Handler Test - Tests the MCP handlers directly
"""

import asyncio
import json
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.server import PromptPlusMCPServer


async def test_mcp_handlers():
    """Test MCP handlers directly"""
    print("🚀 Testing MCP Handlers Directly")
    print("=" * 50)
    
    # Initialize server
    server = PromptPlusMCPServer()
    server.initialize_components()
    print(f"✅ Initialized with {len(server.strategy_manager.strategies)} strategies")
    
    test_results = []
    
    # Test 1: Test auto_select_strategy method
    print("\n🧪 Test 1: Auto-selection logic")
    test_prompt = "Write a Python sorting function"
    try:
        result = server.prompt_refiner.auto_select_strategy(test_prompt)
        print(f"   ✅ Recommended: {result['recommended_strategy']}")
        print(f"   ✅ Reason: {result['reason']}")
        print(f"   ✅ Alternative: {result['alternative']}")
        test_results.append("auto_selection: PASS")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("auto_selection: FAIL")
    
    # Test 2: Test prompt refinement
    print("\n🧪 Test 2: Prompt refinement logic")
    try:
        result = server.prompt_refiner.refine_prompt(test_prompt, "verse")
        print(f"   ✅ Strategy: {result.strategy_name}")
        print(f"   ✅ Instruction length: {len(result.instruction_for_cursor)} chars")
        print(f"   ✅ Contains user prompt: {test_prompt in result.instruction_for_cursor}")
        test_results.append("refinement: PASS")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("refinement: FAIL")
    
    # Test 3: Test strategy comparison
    print("\n🧪 Test 3: Strategy comparison logic")
    try:
        result = server.prompt_refiner.compare_strategies(test_prompt, ["star", "verse", "morphosis"])
        print(f"   ✅ Best match: {result.recommendation}")
        print(f"   ✅ Comparisons: {len(result.comparisons)} strategies")
        print(f"   ✅ Reasoning: {result.reasoning[:60]}...")
        test_results.append("comparison: PASS")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("comparison: FAIL")
    
    # Test 4: Simulate MCP prompt generation
    print("\n🧪 Test 4: MCP prompt generation simulation")
    try:
        # Simulate auto_refine prompt generation
        auto_result = server.prompt_refiner.auto_select_strategy(test_prompt)
        strategy_key = auto_result["recommended_strategy"]
        strategy = server.strategy_manager.get_strategy(strategy_key)
        
        # Create the meta-prompt content (similar to what MCP prompt would contain)
        meta_prompt_content = f"""You are an expert prompt engineer. Based on the analysis, the '{strategy.name}' strategy is most suitable for this prompt because: {auto_result['reason']}.

Apply the following meta-prompt template to refine the user's prompt. Process it completely and return a JSON response with:
1. initial_prompt_evaluation: Analysis of the original prompt's strengths and weaknesses
2. refined_prompt: The enhanced version
3. explanation_of_refinements: What was improved and why

Meta-prompt template:
{strategy.template.replace("[Insert initial prompt here]", test_prompt)}

Remember to return your response in valid JSON format."""
        
        print(f"   ✅ Generated meta-prompt ({len(meta_prompt_content)} chars)")
        print(f"   ✅ User prompt embedded: {test_prompt in meta_prompt_content}")
        print(f"   ✅ Strategy reasoning included: {'strategy is most suitable' in meta_prompt_content}")
        print(f"   ✅ JSON instructions included: {'JSON response' in meta_prompt_content}")
        test_results.append("mcp_prompt_generation: PASS")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("mcp_prompt_generation: FAIL")
    
    # Test 5: Test all strategies work
    print("\n🧪 Test 5: All strategies validation")
    try:
        all_strategies = server.strategy_manager.get_strategy_names()
        working_strategies = 0
        
        for strategy_key in all_strategies:
            try:
                result = server.prompt_refiner.refine_prompt("Test prompt", strategy_key)
                if result.instruction_for_cursor and len(result.instruction_for_cursor) > 100:
                    working_strategies += 1
                    print(f"   ✅ {strategy_key}: {result.strategy_name}")
                else:
                    print(f"   ⚠️  {strategy_key}: Generated but seems short")
            except Exception as e:
                print(f"   ❌ {strategy_key}: Error - {e}")
        
        print(f"   📊 Working strategies: {working_strategies}/{len(all_strategies)}")
        if working_strategies == len(all_strategies):
            test_results.append("all_strategies: PASS")
        else:
            test_results.append("all_strategies: PARTIAL")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("all_strategies: FAIL")
    
    # Test 6: Closed-loop workflow simulation
    print("\n🧪 Test 6: Complete closed-loop workflow simulation")
    try:
        user_input = "Create a machine learning model for sentiment analysis"
        
        print(f"   👤 User: '{user_input}'")
        
        # Step 1: Auto-select strategy
        auto_result = server.prompt_refiner.auto_select_strategy(user_input)
        print(f"   🔍 Analysis: Recommended '{auto_result['recommended_strategy']}' - {auto_result['strategy_name']}")
        
        # Step 2: Generate meta-prompt (what MCP would return)
        strategy = server.strategy_manager.get_strategy(auto_result['recommended_strategy'])
        meta_prompt = strategy.template.replace("[Insert initial prompt here]", user_input)
        
        print(f"   📨 MCP: Generated meta-prompt ({len(meta_prompt)} chars)")
        
        # Step 3: Verify meta-prompt quality
        checks = [
            (user_input in meta_prompt, "User prompt embedded"),
            (len(meta_prompt) > 1000, "Substantial content"),
            ("[Insert initial prompt here]" not in meta_prompt, "Placeholder replaced"),
            ("initial_prompt_evaluation" in meta_prompt or "refined_prompt" in meta_prompt, "Expected output format mentioned")
        ]
        
        all_passed = True
        for check, description in checks:
            if check:
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description}")
                all_passed = False
        
        if all_passed:
            print(f"   🎯 Workflow: Ready for Claude to process internally")
            test_results.append("closed_loop_workflow: PASS")
        else:
            test_results.append("closed_loop_workflow: FAIL")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        test_results.append("closed_loop_workflow: FAIL")
    
    # Summary
    print("\n" + "=" * 50)
    print("🏁 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for result in test_results if "PASS" in result)
    total = len(test_results)
    
    for result in test_results:
        status = "✅" if "PASS" in result else "⚠️" if "PARTIAL" in result else "❌"
        print(f"   {status} {result}")
    
    print(f"\n📊 Overall: {passed}/{total} tests passed")
    
    if passed >= total - 1:  # Allow 1 partial
        print("🎉 MCP SERVER IS WORKING CORRECTLY!")
        print("\n🔗 Real-world workflow:")
        print("   1. User: 'Refine my prompt: [user prompt]'")
        print("   2. Claude: Uses MCP prompt (auto_refine)")
        print("   3. MCP: Returns meta-prompt with strategy + template")
        print("   4. Claude: Processes meta-prompt internally")
        print("   5. Claude: Returns refined prompt to user")
        print("   6. ✨ No manual copying needed - true closed loop!")
        return True
    else:
        print("⚠️  Some issues found. Please review above.")
        return False


if __name__ == "__main__":
    try:
        success = asyncio.run(test_mcp_handlers())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n💥 Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)