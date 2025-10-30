#!/bin/bash
# Script untuk setup SSL dengan Let's Encrypt
# PENTING: Jalankan SETELAH DNS sudah propagate!
# Jalankan: bash setup-ssl.sh

set -e

echo "🔒 Setting up SSL for app.sustain.it..."

# Check if DNS is resolving
echo "🔍 Checking DNS resolution..."
if ! host app.sustain.it > /dev/null 2>&1; then
    echo "❌ ERROR: DNS untuk app.sustain.it belum resolve!"
    echo "Tunggu beberapa menit dan coba lagi."
    exit 1
fi

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d app.sustain.it --non-interactive --agree-tos --email admin@sustain.it --redirect

# Test auto-renewal
echo "🔄 Testing auto-renewal..."
sudo certbot renew --dry-run

echo "✅ SSL configured successfully!"
echo ""
echo "Your site is now available at: https://app.sustain.it"
echo ""
echo "SSL certificates will auto-renew every 90 days."
