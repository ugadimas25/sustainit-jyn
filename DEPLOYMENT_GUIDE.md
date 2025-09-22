
# KPN EUDR Platform - Deployment Guide

This guide provides step-by-step instructions for deploying the KPN EUDR Platform on your own private server infrastructure.

## 📋 Server Requirements

### Minimum Specifications
- **OS**: Ubuntu 20.04 LTS or CentOS 8+
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 50 GB SSD minimum
- **Network**: 1 Gbps connection with static IP

### Recommended Specifications (Production)
- **CPU**: 4+ cores, 3.0 GHz
- **RAM**: 16 GB or more
- **Storage**: 100+ GB NVMe SSD
- **Network**: Load balancer with SSL termination

## 🛠️ System Preparation

### 1. Update System Packages

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install Required Software

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14
sudo apt-get install -y postgresql-14 postgresql-contrib-14 postgresql-14-postgis-3

# Install Git and build tools
sudo apt-get install -y git build-essential

# Install Nginx (optional, for reverse proxy)
sudo apt-get install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Configure PostgreSQL

```bash
# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create application database
sudo -u postgres createuser --interactive eudr_user
sudo -u postgres createdb eudr_platform -O eudr_user

# Enable PostGIS extension
sudo -u postgres psql eudr_platform -c "CREATE EXTENSION postgis;"
sudo -u postgres psql eudr_platform -c "CREATE EXTENSION postgis_topology;"

# Set password for database user
sudo -u postgres psql -c "ALTER USER eudr_user PASSWORD 'your_secure_password';"
```

### 4. Configure Firewall

```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Application port
sudo ufw enable

# CentOS/RHEL Firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

## 📦 Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/eudr-platform
sudo chown $USER:$USER /opt/eudr-platform

# Clone repository
cd /opt/eudr-platform
git clone <your-repository-url> .

# Install dependencies
npm install
```

### 2. Environment Configuration

Create production environment file:

```bash
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://eudr_user:your_secure_password@localhost:5432/eudr_platform"

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL="service-account@your-project.iam.gserviceaccount.com"
PUBLIC_OBJECT_SEARCH_PATHS="/your-bucket/public,/your-bucket/shared"
PRIVATE_OBJECT_DIR="/your-bucket/private"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-api-key"

# Session Configuration
SESSION_SECRET="$(openssl rand -base64 32)"

# Application Configuration
NODE_ENV="production"
PORT=5000
HOST="0.0.0.0"

# External API Configuration
GFW_API_KEY="your-gfw-api-key"
WDPA_API_KEY="your-wdpa-api-key"

# Security Configuration
CORS_ORIGIN="https://yourdomain.com"
COOKIE_DOMAIN="yourdomain.com"
SECURE_COOKIES="true"
EOF

# Secure environment file
chmod 600 .env
```

### 3. Build Application

```bash
# Build frontend and backend
npm run build

# Run database migrations
npm run db:push
```

### 4. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

#### Option B: Self-Signed Certificate (Development)

```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/certs/eudr

# Generate private key and certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/eudr/privkey.pem \
    -out /etc/ssl/certs/eudr/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 5. Nginx Configuration

Create Nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/eudr-platform << EOF
upstream eudr_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client upload limit (for GeoJSON files)
    client_max_body_size 100M;

    # Proxy configuration
    location / {
        proxy_pass http://eudr_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }

    # Static file serving with caching
    location /attached_assets/ {
        alias /opt/eudr-platform/attached_assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API specific configuration
    location /api/ {
        proxy_pass http://eudr_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable site and test configuration
sudo ln -s /etc/nginx/sites-available/eudr-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. PM2 Process Management

Create PM2 ecosystem file:

```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'eudr-platform',
    script: 'dist/index.js',
    cwd: '/opt/eudr-platform',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    error_file: '/var/log/eudr-platform/error.log',
    out_file: '/var/log/eudr-platform/out.log',
    log_file: '/var/log/eudr-platform/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/eudr-platform
sudo chown $USER:$USER /var/log/eudr-platform

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔍 Health Monitoring

### 1. System Monitoring Script

```bash
cat > /opt/eudr-platform/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for EUDR Platform
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/eudr-platform/health.log"

echo "[$TIMESTAMP] Starting health check..." >> $LOG_FILE

# Check application process
if pm2 list | grep -q "eudr-platform.*online"; then
    echo "[$TIMESTAMP] ✓ Application process running" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ Application process not running" >> $LOG_FILE
    pm2 restart eudr-platform
fi

# Check database connectivity
if PGPASSWORD=your_secure_password psql -h localhost -U eudr_user -d eudr_platform -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✓ Database connectivity OK" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ Database connectivity failed" >> $LOG_FILE
fi

# Check application response
if curl -f -s -o /dev/null http://localhost:5000/api/health; then
    echo "[$TIMESTAMP] ✓ Application responding" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ✗ Application not responding" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df /opt/eudr-platform | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "[$TIMESTAMP] ✓ Disk space OK ($DISK_USAGE%)" >> $LOG_FILE
else
    echo "[$TIMESTAMP] ⚠ Disk space warning ($DISK_USAGE%)" >> $LOG_FILE
fi

echo "[$TIMESTAMP] Health check completed" >> $LOG_FILE
EOF

chmod +x /opt/eudr-platform/health-check.sh

# Add to crontab for regular monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/eudr-platform/health-check.sh") | crontab -
```

### 2. Log Rotation

```bash
sudo tee /etc/logrotate.d/eudr-platform << EOF
/var/log/eudr-platform/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reload eudr-platform
    endscript
}
EOF
```

## 🔄 Backup Strategy

### 1. Database Backup

```bash
cat > /opt/eudr-platform/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/eudr-platform/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="eudr_platform"
DB_USER="eudr_user"

mkdir -p $BACKUP_DIR

# Create database backup
PGPASSWORD=your_secure_password pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$TIMESTAMP.sql.gz"
EOF

chmod +x /opt/eudr-platform/backup-db.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/eudr-platform/backup-db.sh") | crontab -
```

### 2. File System Backup

```bash
cat > /opt/eudr-platform/backup-files.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/eudr-platform/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup attached assets
tar -czf $BACKUP_DIR/assets_backup_$TIMESTAMP.tar.gz attached_assets/

# Backup configuration
tar -czf $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz .env ecosystem.config.js

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*_backup_*.tar.gz" -mtime +7 -delete

echo "File backup completed: $TIMESTAMP"
EOF

chmod +x /opt/eudr-platform/backup-files.sh

# Schedule weekly file backups
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/eudr-platform/backup-files.sh") | crontab -
```

## 🚀 Performance Optimization

### 1. Database Optimization

```sql
-- Connect to database and run these optimizations
\c eudr_platform

-- Create performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_geom ON plots USING GIST (coordinates);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp ON events (timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_status ON suppliers (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_supplier ON eudr_assessments (supplier_id);

-- Update table statistics
ANALYZE;

-- Configure PostgreSQL for better performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Restart PostgreSQL to apply changes
-- sudo systemctl restart postgresql
```

### 2. Application Optimization

```bash
# Add Node.js optimization flags to PM2 config
# Edit ecosystem.config.js and update node_args:
node_args: '--max-old-space-size=2048 --optimize-for-size'
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Application won't start**:
   ```bash
   # Check logs
   pm2 logs eudr-platform
   
   # Check environment variables
   cat .env
   
   # Test database connection
   npm run check
   ```

2. **Database connection errors**:
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   PGPASSWORD=your_password psql -h localhost -U eudr_user -d eudr_platform -c "SELECT version();"
   ```

3. **File upload issues**:
   ```bash
   # Check disk space
   df -h
   
   # Check directory permissions
   ls -la attached_assets/
   
   # Check Nginx upload limits
   sudo nginx -t
   ```

4. **SSL certificate issues**:
   ```bash
   # Check certificate expiry
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew
   ```

### Performance Monitoring

```bash
# Monitor application performance
pm2 monit

# Check system resources
htop

# Monitor database performance
sudo -u postgres psql eudr_platform -c "SELECT * FROM pg_stat_activity;"

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## 📄 Maintenance Tasks

### Weekly Tasks
- Review application logs for errors
- Check disk space and clean old files
- Verify backup integrity
- Update system packages

### Monthly Tasks
- Rotate application logs
- Review database performance
- Update SSL certificates if needed
- Security patch assessment

### Quarterly Tasks
- Full system backup
- Performance optimization review
- Security audit
- Capacity planning review

---

This deployment guide provides a comprehensive setup for running the KPN EUDR Platform on your private infrastructure. For additional support or specific deployment scenarios, refer to the main system documentation or contact the development team.
