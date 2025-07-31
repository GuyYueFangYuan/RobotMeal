#!/bin/bash

# RobotMeal HTTPS Setup Script
# This script sets up HTTPS using Let's Encrypt certificates

echo "=== RobotMeal HTTPS Setup ==="
echo "This script will set up HTTPS for your RobotMeal application"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (use sudo)"
    exit 1
fi

# Update package list
echo "Updating package list..."
apt update

# Install certbot and Apache2 SSL module
echo "Installing certbot and SSL modules..."
apt install -y certbot python3-certbot-apache
a2enmod ssl
a2enmod headers

# Backup current Apache configuration
echo "Backing up current Apache configuration..."
cp /etc/apache2/sites-available/robotmeal.conf /etc/apache2/sites-available/robotmeal.conf.backup

# Copy new configuration (HTTP only for now)
echo "Installing new Apache configuration (HTTP only)..."
cp apache-config.conf /etc/apache2/sites-available/robotmeal.conf

# Test Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

if [ $? -ne 0 ]; then
    echo "Apache configuration test failed. Please check the configuration."
    exit 1
fi

# Reload Apache to apply changes
echo "Reloading Apache..."
systemctl reload apache2

# Obtain SSL certificate from Let's Encrypt
echo "Obtaining SSL certificate from Let's Encrypt..."
echo "Make sure your domain (homeye.sdsu.edu) is pointing to this server before continuing."
echo "Press Enter to continue..."
read

certbot --apache -d homeye.sdsu.edu --non-interactive --agree-tos --email your-email@example.com

if [ $? -eq 0 ]; then
    echo "SSL certificate obtained successfully!"
    
    # Now enable the HTTPS configuration
    echo "Enabling HTTPS configuration..."
    
    # Create the full HTTPS configuration
    cat > /etc/apache2/sites-available/robotmeal-https.conf << 'EOF'
# HTTPS Configuration for RobotMeal
<VirtualHost *:443>
    ServerName homeye.sdsu.edu
    
    # SSL Configuration for Let's Encrypt
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/homeye.sdsu.edu/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/homeye.sdsu.edu/privkey.pem
    
    # Additional SSL security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    
    # Proxy configuration for /robotmeal/ path
    ProxyPreserveHost On
    ProxyPass /robotmeal/ http://localhost:5001/
    ProxyPassReverse /robotmeal/ http://localhost:5001/
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/robotmeal_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/robotmeal_ssl_access.log combined
</VirtualHost>
EOF

    # Update the HTTP configuration to redirect to HTTPS
    cat > /etc/apache2/sites-available/robotmeal.conf << 'EOF'
# HTTP Configuration with HTTPS redirect
<VirtualHost *:80>
    ServerName homeye.sdsu.edu
    
    # Redirect all HTTP traffic to HTTPS
    Redirect permanent / https://homeye.sdsu.edu/
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/robotmeal_error.log
    CustomLog ${APACHE_LOG_DIR}/robotmeal_access.log combined
</VirtualHost>
EOF

    # Enable the HTTPS site
    a2ensite robotmeal-https.conf
    
    # Test configuration
    apache2ctl configtest
    
    if [ $? -eq 0 ]; then
        # Restart Apache
        echo "Restarting Apache..."
        systemctl restart apache2
        
        # Set up automatic renewal
        echo "Setting up automatic certificate renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        echo ""
        echo "=== HTTPS Setup Complete! ==="
        echo "Your website is now accessible at: https://homeye.sdsu.edu/robotmeal/"
        echo "HTTP traffic will automatically redirect to HTTPS"
        echo ""
        echo "Certificate will auto-renew every 60 days"
        echo ""
        echo "To test the setup, visit:"
        echo "  https://homeye.sdsu.edu/robotmeal/"
        echo "  https://homeye.sdsu.edu/robotmeal/admin.html"
    else
        echo "Apache configuration test failed after enabling HTTPS."
        echo "Reverting to HTTP-only configuration..."
        cp /etc/apache2/sites-available/robotmeal.conf.backup /etc/apache2/sites-available/robotmeal.conf
        systemctl restart apache2
        exit 1
    fi
    
else
    echo "Failed to obtain SSL certificate. Please check:"
    echo "1. Domain DNS is pointing to server"
    echo "2. Port 80 and 443 are open in firewall"
    echo "3. Apache is running correctly"
    exit 1
fi 