#!/bin/bash

# Test script to verify Round update endpoint accepts null/empty values
# Usage: ./test-round-update.sh <round_id>

ROUND_ID=${1:-1}
BASE_URL="http://app.virtualracingleagues.localhost"

echo "Testing Round Update Endpoint"
echo "=============================="
echo ""

# Test 1: Clear a single field by sending empty string
echo "Test 1: Clearing 'name' field with empty string"
echo "Request: {\"name\": \"\"}"
curl -X PUT \
  "${BASE_URL}/api/rounds/${ROUND_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: your-csrf-token-here" \
  -b "cookies.txt" \
  -d '{"name": ""}' \
  -v 2>&1 | grep -A 10 "< HTTP"

echo ""
echo ""

# Test 2: Clear multiple fields
echo "Test 2: Clearing multiple fields with empty strings"
echo "Request: {\"name\": \"\", \"track_layout\": \"\", \"technical_notes\": \"\"}"
curl -X PUT \
  "${BASE_URL}/api/rounds/${ROUND_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: your-csrf-token-here" \
  -b "cookies.txt" \
  -d '{"name": "", "track_layout": "", "technical_notes": ""}' \
  -v 2>&1 | grep -A 10 "< HTTP"

echo ""
echo ""

# Test 3: Update with null values
echo "Test 3: Sending null values directly"
echo "Request: {\"name\": null, \"track_layout\": null}"
curl -X PUT \
  "${BASE_URL}/api/rounds/${ROUND_ID}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-XSRF-TOKEN: your-csrf-token-here" \
  -b "cookies.txt" \
  -d '{"name": null, "track_layout": null}' \
  -v 2>&1 | grep -A 10 "< HTTP"

echo ""
echo ""
echo "Check Laravel logs for debug output:"
echo "tail -f /var/www/storage/logs/laravel.log | grep 'RoundController::update'"
