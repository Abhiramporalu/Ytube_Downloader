#!/usr/bin/env bash

# Exit on error
set -e

echo "Starting build process..."

echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Installing backend dependencies..."
cd ../backend
npm ci

echo "Downloading Linux yt-dlp binary..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp
chmod a+rx yt-dlp

echo "Build complete!"
