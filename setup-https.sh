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

# Copy new configuration
echo "Installing new Apache configuration..."
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
    echo "Failed to obtain SSL certificate. Please check:"
    echo "1. Domain DNS is pointing to this server"
    echo "2. Port 80 and 443 are open in firewall"
    echo "3. Apache is running correctly"
    exit 1
fi 