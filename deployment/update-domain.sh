#!/bin/bash
# Script untuk update domain dari app.sustain.it ke app.sustainit.id
# Jalankan: bash update-domain.sh

set -e

echo "🔄 Updating domain configuration from app.sustain.it to app.sustainit.id..."

# Remove old Nginx configuration
echo "🗑️ Removing old Nginx configuration..."
sudo rm -f /etc/nginx/sites-enabled/app.sustain.it
sudo rm -f /etc/nginx/sites-available/app.sustain.it

# Run new Nginx setup with correct domain
echo "📝 Setting up Nginx for app.sustainit.id..."
bash setup-nginx.sh

echo ""
echo "✅ Domain configuration updated successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Pastikan DNS record sudah dibuat (app.sustainit.id → 43.157.224.241)"
echo "2. Test: curl http://app.sustainit.id"
echo "3. Test: ping app.sustainit.id"
echo "4. Kalau DNS sudah propagate, install SSL: bash setup-ssl.sh"
echo ""
echo "🌐 Aplikasi sekarang akan diakses via: http://app.sustainit.id"
