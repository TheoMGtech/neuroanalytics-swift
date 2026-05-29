#!/bin/bash

# Exit on error
set -e

echo "=== Setting up NeuroAnalytics Local Environment ==="

# Copy .env if not exists
if [ ! -f .env ]; then
  echo "Creating .env from template..."
  cp .env.example .env
else
  echo ".env file already exists."
fi

# Build and start services
echo "Building and starting Docker containers..."
docker compose up -d --build

echo "=== Setup complete! ==="
echo "Backend docs: http://localhost:8000/api/docs"
echo "Frontend: http://localhost:3000"
