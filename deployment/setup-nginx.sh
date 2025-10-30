#!/bin/bash
# Script untuk setup Nginx reverse proxy
# Jalankan: bash setup-nginx.sh

set -e

echo "🌐 Setting up Nginx for app.sustain.it..."

# Create Nginx configuration for app.sustain.it
echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/app.sustain.it > /dev/null << 'EOF'
server {
    listen 80;
    server_name app.sustain.it;

    # Client max body size (for file uploads)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static files directly
    location /uploads/ {
        alias /root/sustainit-jyn/sustainit-jyn/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
echo "✅ Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/app.sustain.it /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Nginx configured successfully!"
echo ""
echo "Next steps:"
echo "1. Configure DNS A Record di Hostinger:"
echo "   - Hostname: app"
echo "   - Type: A"
echo "   - Points to: $(curl -s ifconfig.me)"
echo "   - TTL: 14400"
echo ""
echo "2. Wait 5-10 minutes for DNS propagation"
echo "3. Test: curl http://app.sustain.it"
echo "4. Install SSL: bash setup-ssl.sh"
