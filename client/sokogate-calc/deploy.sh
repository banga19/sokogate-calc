#!/bin/bash
#
# Sokogate Calculator - Quick Deploy Script
# This script automates building, tagging, and pushing the Docker image.
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="sokogate-calculator"
DEFAULT_TAG="latest"
VERSION="1.0.0"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"  # Default to Docker Hub
USERNAME="${DOCKER_USERNAME}"
TAG="${1:-$DEFAULT_TAG}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Sokogate Calculator - Docker Deploy${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

if [ -z "$USERNAME" ]; then
    echo -e "${YELLOW}⚠️  DOCKER_USERNAME not set. Using local build only.${NC}"
    SKIP_PUSH=true
else
    SKIP_PUSH=false
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Build image
echo -e "${YELLOW}[2/6] Building Docker image...${NC}"

docker build \
    --target runtime \
    -t "${IMAGE_NAME}:${TAG}" \
    -t "${IMAGE_NAME}:${VERSION}" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Run tests
echo -e "${YELLOW}[3/6] Running container tests...${NC}"

# Start container in background
CONTAINER_ID=$(docker run -d \
    -e BASE_PATH=/Calculate \
    -e NODE_ENV=production \
    -p 3000:3000 \
    "${IMAGE_NAME}:${TAG}" )

echo "Container started: ${CONTAINER_ID}"

# Wait for startup
echo -n "Waiting for app to start"
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3000/Calculate/health || echo "failed")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed:${NC}"
    echo "$HEALTH_RESPONSE"
fi

# Test main page
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/Calculate)
if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Main page returns 200${NC}"
else
    echo -e "${RED}❌ Main page returned ${STATUS_CODE}${NC}"
fi

# Stop container
docker stop "$CONTAINER_ID" > /dev/null
docker rm "$CONTAINER_ID" > /dev/null

echo ""

# Push to registry
if [ "$SKIP_PUSH" = false ]; then
    echo -e "${YELLOW}[4/6] Pushing to Docker registry...${NC}"

    # Login
    echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$USERNAME" --password-stdin

    # Tag with registry
    docker tag "${IMAGE_NAME}:${TAG}" "${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${TAG}"
    docker tag "${IMAGE_NAME}:${VERSION}" "${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${VERSION}"

    # Push
    docker push "${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${TAG}"
    docker push "${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${VERSION}"

    echo -e "${GREEN}✅ Pushed to ${REGISTRY}/${USERNAME}/${IMAGE_NAME}${NC}"
    echo ""
else
    echo -e "${YELLOW}[4/6] Skipping push (no registry credentials)${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Image:          ${IMAGE_NAME}:${TAG}"
echo "Version:        ${VERSION}"
echo "Registry:       ${REGISTRY}/${USERNAME}/${IMAGE_NAME}"
echo "BASE_PATH:      /Calculate"
echo "Port:           3000"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. SSH to cPanel server"
echo "2. Pull image: docker pull ${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${TAG}"
echo "3. Run: docker run -d -p 3000:3000 -e BASE_PATH=/Calculate ${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${TAG}"
echo ""
echo -e "${GREEN}✅ Deployment script complete!${NC}"
