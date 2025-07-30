#!/bin/bash

# RobotMeal Apache2 Deployment Script
# Run this script as root or with sudo

echo "🚀 Setting up RobotMeal with Apache2..."

# 1. Install required Apache2 modules
echo "📦 Installing Apache2 proxy modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl

# 2. Create Apache2 configuration
echo "⚙️  Creating Apache2 configuration..."
sudo cp apache-config.conf /etc/apache2/sites-available/robotmeal.conf

# 3. Enable the site
echo "🔗 Enabling the site..."
sudo a2ensite robotmeal.conf

# 4. Create systemd service
echo "🔧 Creating systemd service..."
sudo cp systemd-service.conf /etc/systemd/system/robotmeal.service

# 5. Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /path/to/your/robotmeal/directory
sudo chmod 755 /path/to/your/robotmeal/directory

# 6. Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /path/to/your/robotmeal/directory
sudo -u www-data npm install

# 7. Start and enable the service
echo "🚀 Starting RobotMeal service..."
sudo systemctl daemon-reload
sudo systemctl enable robotmeal.service
sudo systemctl start robotmeal.service

# 8. Restart Apache2
echo "🔄 Restarting Apache2..."
sudo systemctl restart apache2

# 9. Check status
echo "📊 Checking service status..."
sudo systemctl status robotmeal.service

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at: https://homeye.sdsu.edu/robotmeal/"
echo "🔧 To check logs: sudo journalctl -u robotmeal.service -f"
echo "🔧 To restart: sudo systemctl restart robotmeal.service" 