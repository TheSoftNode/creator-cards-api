#!/bin/bash

# Test script for Creator Cards API
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000"

echo "======================================"
echo "Creator Cards API - Test Suite"
echo "======================================"
echo ""

# Test Case 1: Create a public card
echo "Test 1: Creating a public card..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [{"title": "YouTube", "url": "https://youtube.com/@georgecooks"}],
    "service_rates": {
      "currency": "NGN",
      "rates": [{"name": "IG Story Post", "description": "One story mention", "amount": 5000000}]
    },
    "status": "published"
  }'
echo -e "\n"

# Test Case 2: Auto-generate slug
echo "Test 2: Creating card with auto-generated slug..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ada Designs Things",
    "creator_reference": "crt_a1b2c3d4e5f6g7h8",
    "status": "published"
  }'
echo -e "\n"

# Test Case 3: Create private card
echo "Test 3: Creating a private card..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VIP Rate Card",
    "creator_reference": "crt_x9y8z7w6v5u4t3s2",
    "status": "published",
    "access_type": "private",
    "access_code": "A1B2C3"
  }'
echo -e "\n"

# Test Case 4: Retrieve public card
echo "Test 4: Retrieving public card..."
curl $BASE_URL/creator-cards/george-cooks
echo -e "\n"

# Test Case 5: Retrieve private card with correct code
echo "Test 5: Retrieving private card with access code..."
curl "$BASE_URL/creator-cards/vip-rate-card?access_code=A1B2C3"
echo -e "\n"

# Test Case 6: Delete a card
echo "Test 6: Deleting a card..."
curl -X DELETE $BASE_URL/creator-cards/ada-designs-things \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_a1b2c3d4e5f6g7h8"}'
echo -e "\n"

# Test Case 7: Duplicate slug error
echo "Test 7: Testing duplicate slug error..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Another George",
    "slug": "george-cooks",
    "creator_reference": "crt_m1n2b3v4c5x6z7l8",
    "status": "published"
  }'
echo -e "\n"

# Test Case 8: Missing access_code on private
echo "Test 8: Testing missing access_code error..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Secret Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "private"
  }'
echo -e "\n"

# Test Case 9: access_code on public card
echo "Test 9: Testing access_code on public card error..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Public Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "public",
    "access_code": "A1B2C3"
  }'
echo -e "\n"

# Test Case 10: Non-existent card
echo "Test 10: Retrieving non-existent card..."
curl $BASE_URL/creator-cards/does-not-exist-123
echo -e "\n"

# Test Case 11: Private card without access code
echo "Test 11: Accessing private card without code..."
curl $BASE_URL/creator-cards/vip-rate-card
echo -e "\n"

# Test Case 12: Private card with wrong code
echo "Test 12: Accessing private card with wrong code..."
curl "$BASE_URL/creator-cards/vip-rate-card?access_code=WRONG1"
echo -e "\n"

# Test Case 13: Deleted card
echo "Test 13: Retrieving deleted card..."
curl $BASE_URL/creator-cards/ada-designs-things
echo -e "\n"

# Test Case 14: Create draft card
echo "Test 14: Creating a draft card..."
curl -X POST $BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Draft Card",
    "slug": "my-draft-card",
    "creator_reference": "crt_draft123456789a",
    "status": "draft"
  }'
echo -e "\n"

# Test Case 15: Try to retrieve draft card
echo "Test 15: Retrieving draft card (should fail with NF02)..."
curl $BASE_URL/creator-cards/my-draft-card
echo -e "\n"

echo "======================================"
echo "Test Suite Complete!"
echo "======================================"
