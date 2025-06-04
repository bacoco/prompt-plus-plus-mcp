#!/usr/bin/env python3
"""
Real MCP Server Test - Tests the actual closed-loop workflow
"""

import asyncio
import json
import subprocess
import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.server import PromptPlusMCPServer


class MCPServerTester:
    def __init__(self):
        self.server = PromptPlusMCPServer()
        self.test_results = []
    
    async def setup(self):
        """Initialize the MCP server"""
        print("🔧 Setting up MCP Server...")
        self.server.initialize_components()
        print(f"✅ Loaded {len(self.server.strategy_manager.strategies)} strategies")
        return True
    
    async def test_prompt_listing(self):
        """Test listing all available prompts"""
        print("\n🧪 Testing: List all MCP prompts")
        
        try:
            # Call the handler directly
            prompts = await self.server.setup_handlers.__wrapped__(self.server).__next__()
            
            # Should have 10 strategy prompts + 2 special prompts
            expected_count = 12  # 10 strategies + auto_refine + compare_refinements
            actual_count = len(prompts)
            
            print(f"   📊 Found {actual_count} prompts (expected {expected_count})")
            
            # Check specific prompts exist
            prompt_names = [p.name for p in prompts]
            required_prompts = [
                "auto_refine",
                "compare_refinements", 
                "refine_with_star",
                "refine_with_verse",
                "refine_with_morphosis"
            ]
            
            for required in required_prompts:
                if required in prompt_names:
                    print(f"   ✅ {required}")
                else:
                    print(f"   ❌ {required} - MISSING")
                    return False
            
            self.test_results.append({"test": "prompt_listing", "status": "PASS", "count": actual_count})
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "prompt_listing", "status": "FAIL", "error": str(e)})
            return False
    
    async def test_auto_refine_prompt(self):
        """Test the auto_refine prompt workflow"""
        print("\n🧪 Testing: Auto-refine workflow")
        
        test_prompt = "Write a Python function to sort a list of numbers"
        
        try:
            # Get the auto_refine prompt
            prompt_message = await self.server.server.get_prompt(
                "auto_refine", 
                {"user_prompt": test_prompt}
            )
            
            # Verify we got a PromptMessage
            if not hasattr(prompt_message, 'messages'):
                print(f"   ❌ Expected PromptMessage, got {type(prompt_message)}")
                return False
            
            # Check the message content
            content = prompt_message.messages[0].content
            print(f"   📝 Generated meta-prompt ({len(content)} chars)")
            
            # Verify the user prompt is embedded
            if test_prompt not in content:
                print(f"   ❌ User prompt not found in meta-prompt")
                return False
            
            # Verify strategy selection reasoning is included
            if "strategy is most suitable" not in content:
                print(f"   ❌ Strategy reasoning not found")
                return False
            
            # Verify JSON format instructions are included
            if "JSON response" not in content:
                print(f"   ❌ JSON format instructions not found")
                return False
            
            print(f"   ✅ Auto-refine meta-prompt generated successfully")
            print(f"   ✅ User prompt embedded correctly")
            print(f"   ✅ Strategy reasoning included")
            print(f"   ✅ JSON format instructions included")
            
            self.test_results.append({"test": "auto_refine", "status": "PASS", "content_length": len(content)})
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "auto_refine", "status": "FAIL", "error": str(e)})
            return False
    
    async def test_specific_strategy_prompt(self):
        """Test a specific strategy prompt"""
        print("\n🧪 Testing: Specific strategy (verse) workflow")
        
        test_prompt = "Implement a binary search algorithm in Python"
        
        try:
            # Get the verse strategy prompt
            prompt_message = await self.server.server.get_prompt(
                "refine_with_verse", 
                {"user_prompt": test_prompt}
            )
            
            content = prompt_message.messages[0].content
            print(f"   📝 Generated verse meta-prompt ({len(content)} chars)")
            
            # Verify content structure
            if test_prompt not in content:
                print(f"   ❌ User prompt not embedded")
                return False
            
            if "Verse Prompt" not in content:
                print(f"   ❌ Strategy name not found")
                return False
            
            if "Apply the" not in content and "meta-prompt template" not in content:
                print(f"   ❌ Meta-prompt instructions not found")
                return False
            
            print(f"   ✅ Verse strategy meta-prompt generated successfully")
            print(f"   ✅ Strategy-specific instructions included")
            
            self.test_results.append({"test": "specific_strategy", "status": "PASS", "strategy": "verse"})
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "specific_strategy", "status": "FAIL", "error": str(e)})
            return False
    
    async def test_comparison_prompt(self):
        """Test the comparison prompt workflow"""
        print("\n🧪 Testing: Strategy comparison workflow")
        
        test_prompt = "Create a machine learning model for text classification"
        
        try:
            # Get the comparison prompt
            prompt_message = await self.server.server.get_prompt(
                "compare_refinements", 
                {
                    "user_prompt": test_prompt,
                    "strategies": "star,verse,physics"
                }
            )
            
            content = prompt_message.messages[0].content
            print(f"   📝 Generated comparison meta-prompt ({len(content)} chars)")
            
            # Verify content structure
            if test_prompt not in content:
                print(f"   ❌ User prompt not embedded")
                return False
            
            strategies_mentioned = ["ECHO Prompt", "Verse Prompt", "Physics Prompt"]
            for strategy in strategies_mentioned:
                if strategy not in content:
                    print(f"   ❌ Strategy '{strategy}' not found in comparison")
                    return False
            
            if "JSON response" not in content:
                print(f"   ❌ JSON format instructions not found")
                return False
            
            print(f"   ✅ Comparison meta-prompt generated successfully")
            print(f"   ✅ All requested strategies included")
            print(f"   ✅ Comparison instructions provided")
            
            self.test_results.append({"test": "comparison", "status": "PASS", "strategies": ["star", "verse", "physics"]})
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "comparison", "status": "FAIL", "error": str(e)})
            return False
    
    async def test_tools_functionality(self):
        """Test the MCP tools"""
        print("\n🧪 Testing: MCP tools functionality")
        
        try:
            # Test list_strategies tool
            tools = await self.server.server.list_tools()
            tool_names = [t.name for t in tools]
            
            if "list_strategies" not in tool_names:
                print(f"   ❌ list_strategies tool not found")
                return False
            
            if "get_strategy_details" not in tool_names:
                print(f"   ❌ get_strategy_details tool not found")
                return False
            
            print(f"   ✅ Found {len(tools)} tools")
            
            # Test list_strategies functionality
            result = await self.server.list_strategies()
            if "strategies" not in result:
                print(f"   ❌ list_strategies result malformed")
                return False
            
            strategies_count = len(result["strategies"])
            print(f"   ✅ list_strategies returned {strategies_count} strategies")
            
            self.test_results.append({"test": "tools", "status": "PASS", "tools_count": len(tools)})
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "tools", "status": "FAIL", "error": str(e)})
            return False
    
    async def test_error_handling(self):
        """Test error handling"""
        print("\n🧪 Testing: Error handling")
        
        try:
            # Test unknown prompt
            try:
                await self.server.server.get_prompt("unknown_prompt", {"user_prompt": "test"})
                print(f"   ❌ Should have raised error for unknown prompt")
                return False
            except ValueError as e:
                print(f"   ✅ Correctly handled unknown prompt error")
            
            # Test missing strategy
            try:
                await self.server.server.get_prompt("refine_with_nonexistent", {"user_prompt": "test"})
                print(f"   ❌ Should have raised error for missing strategy")
                return False
            except ValueError as e:
                print(f"   ✅ Correctly handled missing strategy error")
            
            self.test_results.append({"test": "error_handling", "status": "PASS"})
            return True
            
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            self.test_results.append({"test": "error_handling", "status": "FAIL", "error": str(e)})
            return False
    
    async def simulate_closed_loop_workflow(self):
        """Simulate the complete closed-loop workflow that Claude would perform"""
        print("\n🔄 Testing: Complete Closed-Loop Workflow Simulation")
        
        user_prompt = "Write a function to calculate fibonacci numbers"
        
        try:
            # Step 1: User wants to refine a prompt
            print(f"   👤 User: 'Refine this prompt: {user_prompt}'")
            
            # Step 2: Claude uses auto_refine MCP prompt
            print(f"   🤖 Claude: Using auto_refine MCP prompt...")
            prompt_message = await self.server.server.get_prompt(
                "auto_refine", 
                {"user_prompt": user_prompt}
            )
            
            meta_prompt = prompt_message.messages[0].content
            print(f"   📨 MCP Server: Returns meta-prompt ({len(meta_prompt)} chars)")
            
            # Step 3: Claude would process this internally and return results
            # For testing, we verify the meta-prompt contains what Claude needs
            
            required_elements = [
                user_prompt,  # Original prompt embedded
                "JSON response",  # Format instructions
                "initial_prompt_evaluation",  # Required response field
                "refined_prompt",  # Required response field
                "explanation_of_refinements",  # Required response field
                "strategy is most suitable"  # Strategy reasoning
            ]
            
            for element in required_elements:
                if element not in meta_prompt:
                    print(f"   ❌ Missing required element: {element}")
                    return False
            
            print(f"   ✅ Meta-prompt contains all required elements")
            print(f"   ✅ Closed-loop workflow structure verified")
            print(f"   🎯 In real usage: Claude processes meta-prompt internally")
            print(f"   🎯 In real usage: Claude returns refined prompt to user")
            
            self.test_results.append({
                "test": "closed_loop_simulation", 
                "status": "PASS", 
                "user_prompt": user_prompt,
                "meta_prompt_length": len(meta_prompt)
            })
            return True
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.test_results.append({"test": "closed_loop_simulation", "status": "FAIL", "error": str(e)})
            return False
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive MCP Server Tests")
        print("=" * 60)
        
        # Initialize
        if not await self.setup():
            print("❌ Setup failed")
            return False
        
        # Run all tests
        tests = [
            self.test_prompt_listing(),
            self.test_auto_refine_prompt(),
            self.test_specific_strategy_prompt(),
            self.test_comparison_prompt(),
            self.test_tools_functionality(),
            self.test_error_handling(),
            self.simulate_closed_loop_workflow()
        ]
        
        results = await asyncio.gather(*tests, return_exceptions=True)
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in results if r is True)
        total = len(results)
        
        for i, result in enumerate(results):
            test_name = self.test_results[i]["test"] if i < len(self.test_results) else f"test_{i}"
            status = "✅ PASS" if result is True else "❌ FAIL"
            print(f"   {status} {test_name}")
        
        print(f"\n📊 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! MCP Server is working correctly.")
            print("\n✨ Ready for production use with Claude Code!")
        else:
            print("⚠️  Some tests failed. Please review the issues above.")
        
        return passed == total


async def main():
    """Main test runner"""
    tester = MCPServerTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🔗 To use with Claude Code:")
        print("   1. Configure MCP server in Claude Code settings")
        print("   2. Use prompts like 'auto_refine' with your prompts")
        print("   3. Claude will process meta-prompts internally")
        print("   4. Get enhanced prompts back automatically!")
    
    return success


if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)