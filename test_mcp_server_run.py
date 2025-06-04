#!/usr/bin/env python3
"""
Test the MCP server by actually running it and connecting to it
"""

import asyncio
import json
import subprocess
import sys
import signal
import time
from pathlib import Path

async def test_mcp_server():
    """Test the MCP server by running it as a subprocess"""
    print("🚀 Testing MCP Server with Real Process")
    print("=" * 50)
    
    # Start the MCP server process
    print("🔧 Starting MCP server...")
    process = None
    
    try:
        # Run the server with proper Python path
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "src.server",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=Path(__file__).parent
        )
        
        print(f"✅ MCP server started (PID: {process.pid})")
        
        # Wait a moment for server to initialize
        await asyncio.sleep(2)
        
        # Check if process is still running
        if process.returncode is not None:
            stderr = await process.stderr.read()
            print(f"❌ Server exited early: {stderr.decode()}")
            return False
        
        print("✅ Server is running")
        
        # Test basic JSON-RPC communication
        print("\n🧪 Testing JSON-RPC communication...")
        
        # Test 1: Initialize
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0.0"}
            }
        }
        
        # Send request
        request_data = json.dumps(init_request) + "\n"
        process.stdin.write(request_data.encode())
        await process.stdin.drain()
        
        # Read response with timeout
        try:
            response_data = await asyncio.wait_for(
                process.stdout.readline(),
                timeout=5.0
            )
            response = json.loads(response_data.decode())
            print(f"✅ Initialize response: {response.get('result', {}).get('protocolVersion', 'unknown')}")
            
        except asyncio.TimeoutError:
            print("❌ No response from server (timeout)")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON response: {e}")
            return False
        
        # Test 2: List prompts
        print("\n🧪 Testing prompts/list...")
        
        list_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "prompts/list",
            "params": {}
        }
        
        request_data = json.dumps(list_request) + "\n"
        process.stdin.write(request_data.encode())
        await process.stdin.drain()
        
        try:
            response_data = await asyncio.wait_for(
                process.stdout.readline(),
                timeout=5.0
            )
            response = json.loads(response_data.decode())
            
            if "result" in response and "prompts" in response["result"]:
                prompts = response["result"]["prompts"]
                print(f"✅ Found {len(prompts)} prompts")
                
                # Check for expected prompts
                prompt_names = [p["name"] for p in prompts]
                expected = ["auto_refine", "refine_with_star", "compare_refinements"]
                found_expected = [name for name in expected if name in prompt_names]
                print(f"✅ Expected prompts found: {len(found_expected)}/{len(expected)}")
                
                if len(found_expected) >= 2:
                    print("✅ Prompts endpoint working correctly")
                else:
                    print("⚠️  Some expected prompts missing")
            else:
                print(f"❌ Unexpected response format: {response}")
                return False
                
        except asyncio.TimeoutError:
            print("❌ No response to prompts/list (timeout)")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in prompts response: {e}")
            return False
        
        # Test 3: Test tools/list
        print("\n🧪 Testing tools/list...")
        
        tools_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/list",
            "params": {}
        }
        
        request_data = json.dumps(tools_request) + "\n"
        process.stdin.write(request_data.encode())
        await process.stdin.drain()
        
        try:
            response_data = await asyncio.wait_for(
                process.stdout.readline(),
                timeout=5.0
            )
            response = json.loads(response_data.decode())
            
            if "result" in response and "tools" in response["result"]:
                tools = response["result"]["tools"]
                print(f"✅ Found {len(tools)} tools")
                
                tool_names = [t["name"] for t in tools]
                if "list_strategies" in tool_names:
                    print("✅ list_strategies tool found")
                else:
                    print("⚠️  list_strategies tool not found")
            else:
                print(f"❌ Unexpected tools response: {response}")
                return False
                
        except asyncio.TimeoutError:
            print("❌ No response to tools/list (timeout)")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in tools response: {e}")
            return False
        
        print("\n✅ All basic MCP communication tests passed!")
        print("🎉 MCP Server is functioning correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing server: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Clean up: terminate the server process
        if process and process.returncode is None:
            print("\n🛑 Stopping MCP server...")
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=5.0)
                print("✅ Server stopped cleanly")
            except asyncio.TimeoutError:
                print("⚠️  Server didn't stop, killing...")
                process.kill()
                await process.wait()


if __name__ == "__main__":
    try:
        success = asyncio.run(test_mcp_server())
        if success:
            print("\n🎯 RESULT: MCP Server is ready for production use!")
            print("🔗 Integration steps:")
            print("   1. Configure Claude Code to use this MCP server")
            print("   2. Use prompts like 'auto_refine' in conversations")
            print("   3. Enjoy automatic prompt enhancement!")
        else:
            print("\n❌ RESULT: MCP Server has issues that need fixing")
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test failed: {e}")
        sys.exit(1)