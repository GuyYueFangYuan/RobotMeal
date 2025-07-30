# Apache2 Deployment Guide for RobotMeal

## Problem
Your Node.js application was working before the update, but now it's not working on `https://homeye.sdsu.edu/robotmeal/` after updating.

## Root Cause
The update changed your server configuration (port 5001) but didn't update the Apache2 configuration to match.

## Solution Options

### Option 1: Apache2 Reverse Proxy (Recommended)

This keeps your Node.js server running on port 5001 and uses Apache2 to proxy requests.

#### Step 1: Enable Apache2 Proxy Modules
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

#### Step 2: Create Apache2 Configuration
Create `/etc/apache2/sites-available/robotmeal.conf`:
```apache
<VirtualHost *:80>
    ServerName homeye.sdsu.edu
    
    # Proxy configuration for /robotmeal/ path
    ProxyPreserveHost On
    ProxyPass /robotmeal/ http://localhost:5001/
    ProxyPassReverse /robotmeal/ http://localhost:5001/
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/robotmeal_error.log
    CustomLog ${APACHE_LOG_DIR}/robotmeal_access.log combined
</VirtualHost>
```

#### Step 3: Enable the Site
```bash
sudo a2ensite robotmeal.conf
sudo systemctl reload apache2
```

#### Step 4: Start Your Node.js Server
```bash
cd /path/to/your/robotmeal/directory
npm start
```

### Option 2: Direct Node.js on Port 80

Run your Node.js application directly on port 80 (requires root privileges).

#### Step 1: Use Production Server
```bash
# Copy the production server file
cp server-production.js server.js
```

#### Step 2: Run with Root Privileges
```bash
sudo node server.js
```

### Option 3: Process Manager (PM2)

Use PM2 to manage your Node.js application.

#### Step 1: Install PM2
```bash
npm install -g pm2
```

#### Step 2: Create PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'robotmeal',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

#### Step 3: Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Quick Fix Commands

### If you want to use the reverse proxy approach:
```bash
# 1. Stop any running Node.js processes
pkill -f "node server.js"

# 2. Enable Apache2 proxy modules
sudo a2enmod proxy proxy_http

# 3. Create the proxy configuration
sudo tee /etc/apache2/sites-available/robotmeal.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName homeye.sdsu.edu
    ProxyPreserveHost On
    ProxyPass /robotmeal/ http://localhost:5001/
    ProxyPassReverse /robotmeal/ http://localhost:5001/
    ErrorLog ${APACHE_LOG_DIR}/robotmeal_error.log
    CustomLog ${APACHE_LOG_DIR}/robotmeal_access.log combined
</VirtualHost>
EOF

# 4. Enable the site
sudo a2ensite robotmeal.conf

# 5. Restart Apache2
sudo systemctl restart apache2

# 6. Start your Node.js server
cd /path/to/your/robotmeal/directory
npm start
```

### If you want to run directly on port 80:
```bash
# 1. Stop Apache2 (if it's using port 80)
sudo systemctl stop apache2

# 2. Use the production server
cp server-production.js server.js

# 3. Run with root privileges
sudo node server.js
```

## Testing Your Deployment

### Test the API
```bash
curl https://homeye.sdsu.edu/robotmeal/api/meals
```

### Test the Main Page
```bash
curl https://homeye.sdsu.edu/robotmeal/
```

### Test Admin Access
Open in browser: `https://homeye.sdsu.edu/robotmeal/admin.html`

## Troubleshooting

### Check Apache2 Status
```bash
sudo systemctl status apache2
sudo tail -f /var/log/apache2/robotmeal_error.log
```

### Check Node.js Server
```bash
# If using PM2
pm2 status
pm2 logs robotmeal

# If running directly
ps aux | grep "node server.js"
```

### Check Port Usage
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5001
```

### Common Issues

1. **Port 80 already in use**: Stop Apache2 or use reverse proxy
2. **Permission denied**: Run with sudo or fix file permissions
3. **CORS errors**: Check the CORS configuration in server.js
4. **Module not found**: Run `npm install` in your project directory

## Recommended Approach

For your SDSU server, I recommend **Option 1 (Apache2 Reverse Proxy)** because:

1. ✅ Keeps Apache2 running (other services might depend on it)
2. ✅ No need for root privileges to run Node.js
3. ✅ Better security and process management
4. ✅ Easier to maintain and debug

## Final Steps

1. Choose your preferred option
2. Run the corresponding commands
3. Test your website at `https://homeye.sdsu.edu/robotmeal/`
4. Test admin access at `https://homeye.sdsu.edu/robotmeal/admin.html`

Your website should now be working correctly! 