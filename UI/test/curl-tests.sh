#!/bin/bash

echo -e "\n🧪 Running Integration Tests with curl\n"

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected="$5"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url")
    else
        response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if echo "$response" | grep -q "$expected"; then
        echo "✅ PASSED"
        ((PASSED++))
    else
        echo "❌ FAILED"
        echo "  Response: $response"
        ((FAILED++))
    fi
}

# Run tests
test_endpoint "Health Check" "GET" "$BASE_URL/health" "" '"status":"ok"'

test_endpoint "Get Strategies" "GET" "$BASE_URL/strategies" "" '"category"'

test_endpoint "Search Strategies" "GET" "$BASE_URL/strategies/search?q=code" "" '"name"'

test_endpoint "Get Metrics" "GET" "$BASE_URL/metrics" "" '"totalStrategies"'

test_endpoint "Refine with Strategy" "POST" "$BASE_URL/refine-with-strategy" \
    '{"prompt":"Write a REST API","strategy":"star"}' \
    '"refinedPrompt"'

test_endpoint "Auto Metaprompt" "POST" "$BASE_URL/automatic-metaprompt" \
    '{"prompt":"Create a user auth system"}' \
    'metaprompt'

# Summary
echo -e "\n📊 Results: $PASSED passed, $FAILED failed\n"

if [ $FAILED -gt 0 ]; then
    exit 1
else
    echo "✅ All tests passed!"
    exit 0
fi