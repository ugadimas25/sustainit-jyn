#!/bin/bash
# Script untuk install dependencies di Tencent Lighthouse
# Jalankan: bash install-dependencies.sh

set -e  # Exit on error

echo "🚀 Installing dependencies for EUDR Platform..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install PM2
echo "⚙️  Installing PM2..."
sudo npm install -g pm2

# Install build essentials
echo "🔧 Installing build tools..."
sudo apt install -y build-essential

echo "✅ All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: bash setup-project.sh"
echo "2. Configure your .env file"
echo "3. Run: bash deploy-app.sh"
