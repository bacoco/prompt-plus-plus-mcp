#!/bin/bash

echo "================================================"
echo "🧪 Running Complete MCP UI Test Suite"
echo "================================================"
echo ""

# Check if services are running
echo "🔍 Checking services..."
echo -n "MCP Bridge: "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running - please start with: cd UI && npm start"
    exit 1
fi

echo -n "React UI: "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "⚠️  Not running (optional for API tests)"
fi

echo ""
echo "================================================"
echo "📋 Test Suite 1: Basic Integration Tests"
echo "================================================"
/Users/loic/prompt-plus-plus-mcp/UI/test/curl-tests.sh
RESULT1=$?

echo ""
echo "================================================"
echo "🤖 Test Suite 2: Claude Integration Tests"
echo "================================================"
/Users/loic/prompt-plus-plus-mcp/UI/test/claude-test.js
RESULT2=$?

echo ""
echo "================================================"
echo "🎨 Test Suite 3: UI Data Loading Tests"
echo "================================================"
/Users/loic/prompt-plus-plus-mcp/UI/test/ui-data-test.js
RESULT3=$?

echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"

TOTAL_FAILED=0

if [ $RESULT1 -eq 0 ]; then
    echo "✅ Basic Integration Tests: PASSED"
else
    echo "❌ Basic Integration Tests: FAILED"
    ((TOTAL_FAILED++))
fi

if [ $RESULT2 -eq 0 ]; then
    echo "✅ Claude Integration Tests: PASSED"
else
    echo "❌ Claude Integration Tests: FAILED"
    ((TOTAL_FAILED++))
fi

if [ $RESULT3 -eq 0 ]; then
    echo "✅ UI Data Loading Tests: PASSED"
else
    echo "❌ UI Data Loading Tests: FAILED"
    ((TOTAL_FAILED++))
fi

echo ""
echo "================================================"
if [ $TOTAL_FAILED -eq 0 ]; then
    echo "✅ ALL TEST SUITES PASSED!"
    echo "================================================"
    exit 0
else
    echo "❌ $TOTAL_FAILED TEST SUITE(S) FAILED"
    echo "================================================"
    exit 1
fi