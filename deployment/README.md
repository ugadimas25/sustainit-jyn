# 🚀 Deployment Guide - EUDR Platform ke Tencent Lighthouse

Panduan lengkap deploy aplikasi EUDR ke server Tencent Lighthouse dengan domain app.sustain.it

## 📋 Prerequisites

- ✅ Server Tencent Lighthouse (Ubuntu 20.04/22.04)
- ✅ Node.js 20 sudah terinstall
- ✅ Domain sustain.it di Hostinger
- ✅ Akses SSH ke server
- ✅ Repository GitHub: https://github.com/ugadimas25/sustainit-jyn.git

## 🎯 Deployment Steps

### Step 1: Upload Script ke Server

Upload semua file di folder `deployment/` ke server Tencent Anda.

```bash
# Di komputer lokal, upload ke server:
scp -r deployment/ root@YOUR_SERVER_IP:/root/
```

Atau manual:
1. SSH ke server
2. Buat folder: `mkdir -p /root/deployment`
3. Copy paste isi setiap file script ke server

### Step 2: Install Dependencies

```bash
cd /root/deployment
chmod +x *.sh
bash install-dependencies.sh
```

**Install:**
- Nginx (web server & reverse proxy)
- PM2 (process manager)
- Build tools

### Step 3: Setup Project

```bash
bash setup-project.sh
```

**Membuat:**
- Upload folders
- File .env dengan template

**⚠️ PENTING:** Edit file .env!

```bash
cd /root/sustainit-jyn/sustainit-jyn
nano .env
```

Ganti `SESSION_SECRET` dengan random string (min 32 karakter):
```
SESSION_SECRET=buatRandomString32KarakterAtauLebihYangAmanDanRahasia
```

Save: Ctrl+X, Y, Enter

### Step 4: Deploy Aplikasi

```bash
cd /root/deployment
bash deploy-app.sh
```

**Melakukan:**
- Pull latest code dari GitHub
- Install npm packages
- Build production
- Start dengan PM2

Cek status:
```bash
pm2 status
pm2 logs eudr-app
```

### Step 5: Setup Nginx

```bash
bash setup-nginx.sh
```

**Konfigurasi:**
- Reverse proxy ke port 5000
- Static file serving
- Upload limits

### Step 6: Configure DNS di Hostinger

Login ke Hostinger DNS Management dan tambahkan A Record:

**Untuk app.sustain.it:**
```
Type: A
Hostname: app
Points to: [IP Server Tencent Anda]
TTL: 14400
```

**Untuk sustain.it (opsional):**
```
Type: A
Hostname: @
Points to: [IP Server Tencent Anda]
TTL: 14400
```

**Cek IP Server:**
```bash
curl ifconfig.me
```

**Tunggu 5-10 menit** untuk DNS propagation.

**Test DNS:**
```bash
ping app.sustain.it
```

### Step 7: Setup SSL (HTTPS)

**⚠️ PENTING:** Tunggu DNS propagate dulu!

```bash
cd /root/deployment
bash setup-ssl.sh
```

**Mendapatkan:**
- SSL certificate dari Let's Encrypt
- Auto-renewal setup
- HTTPS redirect

### Step 8: Company Profile (Opsional)

Buat landing page sederhana untuk sustain.it:

```bash
bash create-company-profile.sh
```

## ✅ Verification

Setelah semua selesai, test:

1. **Aplikasi:**
   - http://app.sustain.it (redirect ke https)
   - https://app.sustain.it ✅

2. **Company Profile:**
   - https://sustain.it ✅

3. **PM2 Status:**
```bash
pm2 status
pm2 logs eudr-app
```

## 🔧 Useful Commands

### Update Aplikasi (setelah push ke GitHub)

```bash
cd /root/deployment
bash deploy-app.sh
```

### Restart Aplikasi

```bash
pm2 restart eudr-app
```

### View Logs

```bash
pm2 logs eudr-app
pm2 logs eudr-app --lines 100
```

### Nginx Commands

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

### Database Migration (jika ada perubahan schema)

```bash
cd /root/sustainit-jyn/sustainit-jyn
npm run db:push
pm2 restart eudr-app
```

## 🆘 Troubleshooting

### Aplikasi tidak bisa diakses

```bash
# Cek PM2
pm2 status
pm2 logs eudr-app

# Cek Nginx
sudo nginx -t
sudo systemctl status nginx

# Cek port
sudo netstat -tulpn | grep 5000
```

### SSL Error

```bash
# Cek certificate
sudo certbot certificates

# Renew manual
sudo certbot renew
```

### DNS tidak resolve

```bash
# Test DNS
nslookup app.sustain.it
dig app.sustain.it

# Flush DNS (di komputer)
# Windows: ipconfig /flushdns
# Mac: sudo dscacheutil -flushcache
```

## 📞 Support

Jika ada masalah, cek:
1. PM2 logs: `pm2 logs eudr-app`
2. Nginx error log: `sudo tail -f /var/log/nginx/error.log`
3. Application .env file konfigurasi

## 🎉 Success!

Aplikasi EUDR Anda sekarang live di:
- **Application:** https://app.sustain.it
- **Company Profile:** https://sustain.it

Login credentials:
- Super Admin: `super_admin` / `password123`
- Creator: `creator_user` / `password123`
- Approver: `approver_user` / `password123`

**⚠️ PENTING:** Ganti password default setelah first login!
