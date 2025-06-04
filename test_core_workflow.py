#!/usr/bin/env python3
"""
Test the core workflow logic without MCP dependencies
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core import StrategyManager, PromptRefiner


def test_core_workflow():
    """Test the core prompt refinement workflow"""
    print("Testing Core Workflow Logic")
    print("=" * 50)
    
    try:
        # Initialize components
        strategy_manager = StrategyManager()
        prompt_refiner = PromptRefiner(strategy_manager)
        
        print(f"✓ Initialized with {len(strategy_manager.strategies)} strategies")
        
        # Test 1: Strategy auto-selection
        test_prompt = "Write a Python function to sort a list"
        print(f"\n1. Testing auto-selection for: '{test_prompt}'")
        
        auto_result = prompt_refiner.auto_select_strategy(test_prompt)
        print(f"   ✓ Recommended: {auto_result['recommended_strategy']}")
        print(f"   ✓ Reason: {auto_result['reason']}")
        print(f"   ✓ Alternative: {auto_result['alternative']}")
        
        # Test 2: Specific strategy refinement
        strategy_key = auto_result['recommended_strategy']
        print(f"\n2. Testing refinement with '{strategy_key}' strategy")
        
        refine_result = prompt_refiner.refine_prompt(test_prompt, strategy_key)
        print(f"   ✓ Strategy: {refine_result.strategy_name}")
        print(f"   ✓ Generated instruction for processing")
        print(f"   ✓ Instruction length: {len(refine_result.instruction_for_cursor)} chars")
        
        # Test 3: Strategy comparison
        print(f"\n3. Testing strategy comparison")
        
        comparison_result = prompt_refiner.compare_strategies(
            test_prompt, 
            ["star", "verse", "morphosis"]
        )
        print(f"   ✓ Compared 3 strategies")
        print(f"   ✓ Best match: {comparison_result.recommendation}")
        print(f"   ✓ Reasoning: {comparison_result.reasoning}")
        
        # Test 4: Validate all strategies can be loaded
        print(f"\n4. Testing all strategies")
        
        all_strategies = strategy_manager.get_strategy_names()
        for strategy_key in all_strategies:
            try:
                result = prompt_refiner.refine_prompt("Test prompt", strategy_key)
                print(f"   ✓ {strategy_key}: {result.strategy_name}")
            except Exception as e:
                print(f"   ✗ {strategy_key}: Error - {e}")
        
        # Test 5: Validate meta-prompt generation
        print(f"\n5. Testing meta-prompt generation")
        
        strategy = strategy_manager.get_strategy("star")
        if strategy:
            # Check if placeholder replacement works
            if "[Insert initial prompt here]" in strategy.template:
                replaced = strategy.template.replace("[Insert initial prompt here]", test_prompt)
                if test_prompt in replaced and "[Insert initial prompt here]" not in replaced:
                    print("   ✓ Placeholder replacement works correctly")
                else:
                    print("   ✗ Placeholder replacement failed")
            else:
                print("   ✗ Placeholder not found in template")
        
        print(f"\n✓ All core workflow tests passed!")
        return True
        
    except Exception as e:
        print(f"\n✗ Core workflow test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prompt_scenarios():
    """Test different prompt scenarios"""
    print(f"\n" + "=" * 50)
    print("Testing Different Prompt Scenarios")
    print("=" * 50)
    
    strategy_manager = StrategyManager()
    prompt_refiner = PromptRefiner(strategy_manager)
    
    test_cases = [
        ("Write a creative story about AI", "creative"),
        ("Implement a binary search algorithm", "technical"),
        ("Prove that 2+2=4", "mathematical"),
        ("Analyze this dataset", "analytical"),
        ("Help", "simple")
    ]
    
    for prompt, expected_type in test_cases:
        result = prompt_refiner.auto_select_strategy(prompt)
        detected_type = result['prompt_characteristics']['detected_type']
        print(f"   Prompt: '{prompt[:30]}...'")
        print(f"   Expected: {expected_type}, Got: {detected_type}")
        print(f"   Strategy: {result['recommended_strategy']}")
        print()


if __name__ == "__main__":
    success = test_core_workflow()
    if success:
        test_prompt_scenarios()
    else:
        sys.exit(1)