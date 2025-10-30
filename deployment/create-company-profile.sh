#!/bin/bash
# Script untuk membuat company profile sederhana di sustain.it
# Jalankan: bash create-company-profile.sh

set -e

echo "🌐 Creating company profile for sustain.it..."

# Create directory for company profile
sudo mkdir -p /var/www/sustain.it

# Create simple landing page
echo "📝 Creating landing page..."
sudo tee /var/www/sustain.it/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sustain IT - EUDR Compliance Solutions</title>
    <meta name="description" content="Professional EUDR compliance monitoring platform for supply chain traceability and deforestation risk management.">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 600px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            color: #667eea;
        }
        p {
            font-size: 1.1em;
            margin-bottom: 30px;
            color: #666;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1em;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .cta-button:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .features {
            margin-top: 40px;
            text-align: left;
        }
        .feature {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
        }
        .feature:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
            font-size: 1.2em;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sustain IT</h1>
        <p>Professional EUDR Compliance Monitoring Platform</p>
        <p>End-to-end supply chain traceability and deforestation risk management solution.</p>
        
        <a href="https://app.sustain.it" class="cta-button">Access Platform →</a>
        
        <div class="features">
            <div class="feature">Real-time deforestation monitoring</div>
            <div class="feature">Supply chain traceability (EPCIS 2.0)</div>
            <div class="feature">Legal compliance management</div>
            <div class="feature">Risk assessment & analytics</div>
            <div class="feature">Due Diligence Statement (DDS) reports</div>
        </div>
        
        <div class="footer">
            <p>Contact: info@sustain.it</p>
        </div>
    </div>
</body>
</html>
EOF

# Create Nginx configuration for sustain.it
echo "📝 Creating Nginx configuration for sustain.it..."
sudo tee /etc/nginx/sites-available/sustain.it > /dev/null << 'EOF'
server {
    listen 80;
    server_name sustain.it www.sustain.it;
    
    root /var/www/sustain.it;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/sustain.it /etc/nginx/sites-enabled/

# Test and reload Nginx
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Company profile created successfully!"
echo ""
echo "Next steps:"
echo "1. Configure DNS A Record di Hostinger:"
echo "   - Hostname: @"
echo "   - Type: A"
echo "   - Points to: $(curl -s ifconfig.me)"
echo ""
echo "2. Optional - Setup SSL for sustain.it:"
echo "   sudo certbot --nginx -d sustain.it -d www.sustain.it"
