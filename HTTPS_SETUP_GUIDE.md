# HTTPS Setup Guide for RobotMeal

## Overview
This guide will help you convert your RobotMeal application from HTTP to HTTPS using Let's Encrypt free SSL certificates.

## Prerequisites

Before starting, ensure you have:
1. ✅ Domain name pointing to your server (`homeye.sdsu.edu`)
2. ✅ Server with root/sudo access
3. ✅ Apache2 installed and running
4. ✅ Ports 80 and 443 open in firewall
5. ✅ RobotMeal application deployed and working

## Step-by-Step Setup

### Step 1: Deploy Updated Files
First, deploy the updated configuration files to your server:

```bash
# On your local machine
git add .
git commit -m "Add HTTPS configuration"
git push origin main

# On your robot server
git pull origin main
```

### Step 2: Run HTTPS Setup Script
On your robot server, run the automated setup:

```bash
# SSH into your robot server
ssh username@your-robot-server

# Navigate to RobotMeal directory
cd /path/to/robotmeal

# Make script executable
chmod +x setup-https.sh

# Run the setup (requires sudo)
sudo ./setup-https.sh
```

**Important**: Before running the script, edit `setup-https.sh` and replace `your-email@example.com` with your actual email address.

### Step 3: Verify Setup
After the script completes, verify everything is working:

```bash
# Check SSL certificate
sudo certbot certificates

# Test HTTPS access
curl -I https://homeye.sdsu.edu/robotmeal/

# Test HTTP to HTTPS redirect
curl -I http://homeye.sdsu.edu/robotmeal/
```

## What the Setup Does

### 1. Apache Configuration Changes
- **HTTP VirtualHost**: Now redirects all HTTP traffic to HTTPS
- **HTTPS VirtualHost**: Handles SSL termination and proxies to your Node.js app
- **Security Headers**: Added HSTS, X-Frame-Options, and other security headers

### 2. SSL Certificate Management
- **Let's Encrypt**: Free, trusted SSL certificates
- **Auto-renewal**: Certificates automatically renew every 60 days
- **Domain validation**: Uses HTTP-01 challenge method

### 3. Security Enhancements
- **HSTS**: Forces browsers to use HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing

## Manual Setup (Alternative)

If the automated script doesn't work, you can set up HTTPS manually:

### 1. Install Certbot
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-apache
```

### 2. Enable Apache Modules
```bash
sudo a2enmod ssl
sudo a2enmod headers
sudo systemctl reload apache2
```

### 3. Get SSL Certificate
```bash
sudo certbot --apache -d homeye.sdsu.edu
```

### 4. Test and Reload
```bash
sudo apache2ctl configtest
sudo systemctl restart apache2
```

## Troubleshooting

### Common Issues

1. **Certificate not obtained**
   - Check domain DNS is pointing to server
   - Ensure ports 80/443 are open
   - Verify Apache is running

2. **Apache configuration errors**
   ```bash
   sudo apache2ctl configtest
   sudo systemctl status apache2
   ```

3. **SSL module not loaded**
   ```bash
   sudo a2enmod ssl
   sudo systemctl reload apache2
   ```

4. **Certificate expired**
   ```bash
   sudo certbot renew
   sudo systemctl reload apache2
   ```

### Testing Commands

```bash
# Test SSL certificate
openssl s_client -connect homeye.sdsu.edu:443 -servername homeye.sdsu.edu

# Check certificate expiration
sudo certbot certificates

# Test HTTPS response
curl -I https://homeye.sdsu.edu/robotmeal/

# Test redirect
curl -I http://homeye.sdsu.edu/robotmeal/
```

## Security Best Practices

1. **Keep certificates updated**: Let's Encrypt auto-renews every 60 days
2. **Monitor logs**: Check Apache error logs for SSL issues
3. **Regular updates**: Keep Apache and certbot updated
4. **Backup configuration**: Keep backups of your Apache config

## Verification Checklist

After setup, verify these items:

- [ ] `https://homeye.sdsu.edu/robotmeal/` loads correctly
- [ ] `http://homeye.sdsu.edu/robotmeal/` redirects to HTTPS
- [ ] SSL certificate is valid and trusted
- [ ] Admin panel works over HTTPS
- [ ] API endpoints work over HTTPS
- [ ] No mixed content warnings in browser
- [ ] Certificate auto-renewal is configured

## Support

If you encounter issues:
1. Check Apache error logs: `sudo tail -f /var/log/apache2/robotmeal_ssl_error.log`
2. Verify certificate status: `sudo certbot certificates`
3. Test Apache configuration: `sudo apache2ctl configtest`

Your RobotMeal application should now be securely accessible via HTTPS! 