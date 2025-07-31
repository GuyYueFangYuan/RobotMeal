# RobotMeal Deployment Workflow

## Overview
This guide explains the proper workflow to deploy your RobotMeal application from your local machine to your robot control terminal via GitHub.

## HTTPS Setup (One-time setup)

Before deploying, you need to set up HTTPS for secure access:

### Step 1: Set up HTTPS on Robot Terminal
```bash
# SSH into your robot control terminal
ssh username@your-robot-server

# Navigate to your RobotMeal directory
cd /path/to/robotmeal/directory

# Make the HTTPS setup script executable
chmod +x setup-https.sh

# Run the HTTPS setup (requires sudo)
sudo ./setup-https.sh
```

**Important**: Before running the script:
1. Make sure your domain `homeye.sdsu.edu` is pointing to your server
2. Ensure ports 80 and 443 are open in your firewall
3. Replace `your-email@example.com` in the script with your actual email

### Step 2: Verify HTTPS Setup
After running the script, test your HTTPS setup:
```bash
# Test HTTPS access
curl -I https://homeye.sdsu.edu/robotmeal/

# Check certificate status
sudo certbot certificates
```

## Workflow Steps

### Step 1: Local Machine (Your Computer)
**Goal**: Upload updated files to GitHub

1. **Make sure you're in the RobotMeal directory**
   ```bash
   cd /path/to/your/robotmeal/directory
   ```

2. **Check what files have changed**
   ```bash
   git status
   ```

3. **Add all new files to git**
   ```bash
   git add .
   ```

4. **Commit the changes**
   ```bash
   git commit -m "Update RobotMeal with Apache2 deployment configuration"
   ```

5. **Push to GitHub**
   ```bash
   git push origin main
   ```

**Or use the automated script:**
```bash
chmod +x deploy-to-github.sh
./deploy-to-github.sh
```

### Step 2: Robot Control Terminal
**Goal**: Pull files from GitHub and deploy

1. **SSH into your robot control terminal**
   ```bash
   ssh username@your-robot-server
   ```

2. **Navigate to your RobotMeal directory**
   ```bash
   cd /path/to/robotmeal/directory
   ```

3. **Pull the latest changes from GitHub**
   ```bash
   git pull origin main
   ```

4. **Run the deployment script**
   ```bash
   chmod +x deploy-to-robot.sh
   ./deploy-to-robot.sh
   ```

## Manual Deployment (Alternative)

If you prefer to run commands manually on the robot terminal:

### 1. Pull from GitHub
```bash
cd /path/to/robotmeal
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Apache2
```bash
# Enable proxy modules
sudo a2enmod proxy
sudo a2enmod proxy_http

# Copy configuration
sudo cp apache-config.conf /etc/apache2/sites-available/robotmeal.conf

# Enable the site
sudo a2ensite robotmeal.conf

# Restart Apache2
sudo systemctl restart apache2
```

### 4. Start the Server
```bash
# Stop any existing processes
pkill -f "node server.js"

# Start the server
npm start
```

## File Transfer Methods

### Method 1: Git (Recommended)
- ✅ Version control
- ✅ Easy rollback
- ✅ Track changes
- ✅ Professional workflow

### Method 2: Direct File Transfer
If you can't use git, you can transfer files directly:

```bash
# From your local machine
scp -r /path/to/robotmeal/* username@robot-server:/path/to/robotmeal/
```

### Method 3: Manual Upload
Upload individual files through your server's file manager or FTP.

## Verification Steps

After deployment, verify everything is working:

### 1. Check Server Status
```bash
# Check if Node.js is running
ps aux | grep "node server.js"

# Check if Apache2 is running
sudo systemctl status apache2
```

### 2. Test the Website
```bash
# Test HTTPS API
curl -I https://homeye.sdsu.edu/robotmeal/api/meals

# Test HTTPS main page
curl -I https://homeye.sdsu.edu/robotmeal/

# Test HTTP to HTTPS redirect
curl -I http://homeye.sdsu.edu/robotmeal/
```

### 3. Check Logs
```bash
# Apache2 logs
sudo tail -f /var/log/apache2/robotmeal_error.log

# Node.js logs (if running in foreground)
# Check the terminal where you ran npm start
```

## Troubleshooting

### Common Issues

1. **Git pull fails**
   ```bash
   # Check if you have local changes
   git status
   
   # Stash local changes if needed
   git stash
   git pull origin main
   git stash pop
   ```

2. **Permission denied**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy-to-robot.sh
   ```

3. **Port already in use**
   ```bash
   # Check what's using port 5001
   sudo netstat -tlnp | grep :5001
   
   # Kill the process if needed
   sudo pkill -f "node server.js"
   ```

4. **Apache2 configuration error**
   ```bash
   # Check Apache2 syntax
   sudo apache2ctl configtest
   
   # Check Apache2 status
   sudo systemctl status apache2
   ```

5. **HTTPS/SSL issues**
   ```bash
   # Check SSL certificate status
   sudo certbot certificates
   
   # Test SSL configuration
   sudo apache2ctl -S
   
   # Check SSL module is loaded
   sudo apache2ctl -M | grep ssl
   
   # Renew certificate if needed
   sudo certbot renew --dry-run
   ```

## Quick Reference

### Local Machine Commands
```bash
git add .
git commit -m "Update message"
git push origin main
```

### Robot Terminal Commands
```bash
git pull origin main
chmod +x deploy-to-robot.sh
./deploy-to-robot.sh
```

### Emergency Restart
```bash
# On robot terminal
pkill -f "node server.js"
npm start
sudo systemctl restart apache2
```

## Success Indicators

✅ **GitHub**: Files uploaded successfully  
✅ **Robot Terminal**: `git pull` completed without errors  
✅ **Apache2**: `sudo systemctl status apache2` shows "active"  
✅ **Node.js**: `ps aux | grep "node server.js"` shows running process  
✅ **HTTPS**: SSL certificate is valid and working  
✅ **Website**: `https://homeye.sdsu.edu/robotmeal/` loads correctly  
✅ **Admin**: `https://homeye.sdsu.edu/robotmeal/admin.html` accessible  
✅ **Redirect**: HTTP automatically redirects to HTTPS  

Your RobotMeal application should now be fully deployed and accessible at the SDSU address! 