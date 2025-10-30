#!/bin/bash
# Script untuk build dan deploy aplikasi dengan PM2
# Jalankan: bash deploy-app.sh

set -e

echo "🚀 Deploying EUDR Platform..."

# Navigate to project directory
cd /root/sustainit-jyn/sustainit-jyn

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies (in case there are new ones)
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Stop existing PM2 process if running
echo "🔄 Stopping existing processes..."
pm2 stop eudr-app 2>/dev/null || true
pm2 delete eudr-app 2>/dev/null || true

# Start application with PM2
echo "▶️  Starting application with PM2..."
pm2 start npm --name "eudr-app" -- run start

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "⚙️  Setting up PM2 auto-start..."
pm2 startup systemd -u root --hp /root

echo "✅ Application deployed successfully!"
echo ""
echo "Application status:"
pm2 status
echo ""
echo "View logs with: pm2 logs eudr-app"
echo "Restart app with: pm2 restart eudr-app"
echo ""
echo "Next steps:"
echo "1. Setup Nginx: bash setup-nginx.sh"
echo "2. Configure DNS di Hostinger"
echo "3. Setup SSL: bash setup-ssl.sh"
