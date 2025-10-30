# 🔄 Update Domain dari sustain.it ke sustainit.id

Panduan cepat untuk update konfigurasi server dari app.sustain.it ke app.sustainit.id

## ✅ Prerequisites

- [x] DNS record sudah dibuat di Hostinger untuk app.sustainit.id → 43.157.224.241
- [x] Akses SSH ke server Tencent Lighthouse

## 📋 Langkah Update

### Step 1: SSH ke Server

```bash
ssh root@43.157.224.241
```

### Step 2: Backup Konfigurasi Lama (Opsional)

```bash
cd /root/deployment
cp /etc/nginx/sites-available/app.sustain.it /root/deployment/backup-nginx-old.conf 2>/dev/null || echo "No old config found"
```

### Step 3: Pull Latest Configuration dari GitHub

```bash
cd /root/sustainit-jyn/sustainit-jyn
git pull origin main
```

### Step 4: Update Nginx Configuration

```bash
cd /root/sustainit-jyn/sustainit-jyn/deployment
chmod +x update-domain.sh
bash update-domain.sh
```

Script ini akan:
- ✅ Hapus konfigurasi lama (app.sustain.it)
- ✅ Install konfigurasi baru (app.sustainit.id)
- ✅ Reload Nginx

### Step 5: Test DNS Propagation

```bash
# Test dari server
ping app.sustainit.id

# Test DNS resolution
nslookup app.sustainit.id

# Expected output: 43.157.224.241
```

**Kalau belum resolve:** Tunggu 5-15 menit untuk DNS propagation.

### Step 6: Test HTTP Access

```bash
# Test dari server
curl http://app.sustainit.id

# Expected: HTML response dari aplikasi
```

**Kalau berhasil:** Anda akan melihat HTML aplikasi!

### Step 7: Install SSL Certificate

**⚠️ PENTING:** Hanya jalankan setelah DNS sudah propagate!

```bash
cd /root/sustainit-jyn/sustainit-jyn/deployment
bash setup-ssl.sh
```

Script ini akan:
- ✅ Install certbot
- ✅ Generate SSL certificate dari Let's Encrypt
- ✅ Auto-configure HTTPS redirect
- ✅ Setup auto-renewal

## ✅ Verification

Setelah semua selesai:

### Test dari Browser

1. **HTTP:** http://app.sustainit.id (akan auto-redirect ke HTTPS)
2. **HTTPS:** https://app.sustainit.id ✅

### Test dari Server

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check SSL
sudo certbot certificates
```

## 🎉 Success Indicators

✅ **DNS resolves:** `ping app.sustainit.id` menunjukkan 43.157.224.241  
✅ **HTTP works:** `curl http://app.sustainit.id` mengembalikan HTML  
✅ **HTTPS works:** Browser bisa akses https://app.sustainit.id dengan padlock hijau  
✅ **PM2 running:** `pm2 status` menunjukkan eudr-app online  

## 🆘 Troubleshooting

### DNS Belum Propagate

**Problem:** `ping app.sustainit.id` masih timeout atau IP salah

**Solution:**
1. Cek DNS record di Hostinger (pastikan app → 43.157.224.241)
2. Tunggu 15-30 menit
3. Clear DNS cache di komputer Anda:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
4. Test dari handphone pakai data seluler (biasanya lebih cepat)

### Nginx Error

**Problem:** Nginx failed to reload

**Solution:**
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSL Installation Failed

**Problem:** Certbot error saat install SSL

**Solution:**
1. Pastikan DNS sudah 100% propagate: `host app.sustainit.id`
2. Pastikan port 80 dan 443 terbuka di firewall
3. Check Nginx listening on port 80: `sudo netstat -tulpn | grep :80`
4. Retry: `bash setup-ssl.sh`

### Aplikasi Tidak Bisa Diakses

**Problem:** Browser timeout atau connection refused

**Solution:**
```bash
# Check PM2
pm2 status
pm2 logs eudr-app

# Restart app jika perlu
pm2 restart eudr-app

# Check port 5000
sudo netstat -tulpn | grep :5000
```

## 📞 Quick Commands Reference

```bash
# Restart aplikasi
pm2 restart eudr-app

# Reload Nginx
sudo systemctl reload nginx

# View logs
pm2 logs eudr-app
sudo tail -f /var/log/nginx/error.log

# Test DNS
nslookup app.sustainit.id
dig app.sustainit.id

# Test HTTP
curl http://app.sustainit.id
curl -I http://app.sustainit.id

# Check SSL
sudo certbot certificates
sudo certbot renew --dry-run
```

## 🎯 Summary

**Before:** app.sustain.it (domain salah)  
**After:** app.sustainit.id (domain benar) ✅

**Estimasi waktu total:** 15-30 menit (termasuk DNS propagation)

**Login Credentials (tidak berubah):**
- Super Admin: `super_admin` / `password123`
- Creator: `creator_user` / `password123`
- Approver: `approver_user` / `password123`

---

**Update selesai!** Aplikasi sekarang live di **https://app.sustainit.id** 🚀
