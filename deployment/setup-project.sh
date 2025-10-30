#!/bin/bash
# Script untuk setup project dari GitHub
# Jalankan: bash setup-project.sh

set -e

echo "📥 Setting up EUDR Platform project..."

# Navigate to project directory
cd /root/sustainit-jyn/sustainit-jyn

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p uploads/public
mkdir -p uploads/private
chmod -R 755 uploads

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_vzlCGi4Ls8fB@ep-silent-morning-afgiwp5c.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING_32_CHARS_OR_MORE
PORT=5000

# Storage lokal
UPLOAD_DIR=/root/sustainit-jyn/sustainit-jyn/uploads
PUBLIC_OBJECT_SEARCH_PATHS=/uploads/public
PRIVATE_OBJECT_DIR=/uploads/private
EOF
    echo "⚠️  PENTING: Edit file .env dan ganti SESSION_SECRET dengan string random!"
else
    echo "✅ .env file already exists"
fi

echo "✅ Project setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Change SESSION_SECRET to a random string"
echo "3. Run: bash deploy-app.sh"
