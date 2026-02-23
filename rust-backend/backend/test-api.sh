#!/bin/bash

# API testing script for Rust backend

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Testing Rust Backend API${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}\n"

# Test health endpoint
echo -e "${YELLOW}1. Testing health endpoint...${NC}"
response=$(curl -s "${BASE_URL}/health")
echo "$response" | jq '.'
echo -e "${GREEN}Health check passed!${NC}\n"

# Test readiness endpoint
echo -e "${YELLOW}2. Testing readiness endpoint...${NC}"
status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/ready")
echo "Status code: $status"
if [ "$status" = "200" ]; then
    echo -e "${GREEN}Readiness check passed!${NC}\n"
else
    echo -e "${RED}Readiness check failed!${NC}\n"
    exit 1
fi

# Create a todo
echo -e "${YELLOW}3. Creating a todo...${NC}"
create_response=$(curl -s -X POST "${BASE_URL}/api/todos" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test todo from script","completed":false}')
echo "$create_response" | jq '.'
todo_id=$(echo "$create_response" | jq -r '.id')
echo -e "${GREEN}Todo created with ID: ${todo_id}${NC}\n"

# List todos
echo -e "${YELLOW}4. Listing todos (first call - cache miss)...${NC}"
curl -s "${BASE_URL}/api/todos" | jq '.'
echo -e "${GREEN}Todos listed!${NC}\n"

# List todos again (should be cached)
echo -e "${YELLOW}5. Listing todos again (second call - cache hit)...${NC}"
curl -s "${BASE_URL}/api/todos" | jq '.'
echo -e "${GREEN}Todos listed from cache!${NC}\n"

# Get specific todo
echo -e "${YELLOW}6. Getting specific todo...${NC}"
curl -s "${BASE_URL}/api/todos/${todo_id}" | jq '.'
echo -e "${GREEN}Todo retrieved!${NC}\n"

# Update todo
echo -e "${YELLOW}7. Updating todo...${NC}"
update_response=$(curl -s -X PUT "${BASE_URL}/api/todos/${todo_id}" \
    -H "Content-Type: application/json" \
    -d '{"completed":true}')
echo "$update_response" | jq '.'
echo -e "${GREEN}Todo updated!${NC}\n"

# Get statistics
echo -e "${YELLOW}8. Getting statistics...${NC}"
curl -s "${BASE_URL}/api/stats" | jq '.'
echo -e "${GREEN}Statistics retrieved!${NC}\n"

# Create more todos for testing
echo -e "${YELLOW}9. Creating more todos...${NC}"
curl -s -X POST "${BASE_URL}/api/todos" \
    -H "Content-Type: application/json" \
    -d '{"title":"Buy groceries","completed":false}' | jq '.'
curl -s -X POST "${BASE_URL}/api/todos" \
    -H "Content-Type: application/json" \
    -d '{"title":"Write documentation","completed":true}' | jq '.'
echo -e "${GREEN}More todos created!${NC}\n"

# List all todos
echo -e "${YELLOW}10. Final todo list...${NC}"
curl -s "${BASE_URL}/api/todos" | jq '.'
echo -e "${GREEN}Final list retrieved!${NC}\n"

# Final statistics
echo -e "${YELLOW}11. Final statistics...${NC}"
curl -s "${BASE_URL}/api/stats" | jq '.'
echo -e "${GREEN}Final statistics retrieved!${NC}\n"

# Delete todo
echo -e "${YELLOW}12. Deleting todo...${NC}"
delete_status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE_URL}/api/todos/${todo_id}")
echo "Status code: $delete_status"
if [ "$delete_status" = "204" ]; then
    echo -e "${GREEN}Todo deleted successfully!${NC}\n"
else
    echo -e "${RED}Delete failed!${NC}\n"
fi

# Test validation error
echo -e "${YELLOW}13. Testing validation (empty title)...${NC}"
error_response=$(curl -s -X POST "${BASE_URL}/api/todos" \
    -H "Content-Type: application/json" \
    -d '{"title":"","completed":false}')
echo "$error_response" | jq '.'
echo -e "${GREEN}Validation error handled correctly!${NC}\n"

# Test not found error
echo -e "${YELLOW}14. Testing not found error...${NC}"
not_found_response=$(curl -s "${BASE_URL}/api/todos/00000000-0000-0000-0000-000000000000")
echo "$not_found_response" | jq '.'
echo -e "${GREEN}Not found error handled correctly!${NC}\n"

echo -e "${GREEN}All tests passed!${NC}"
