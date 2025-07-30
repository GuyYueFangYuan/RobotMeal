#!/bin/bash

# RobotMeal Robot Terminal Deployment Script
# Run this on your robot control terminal after pulling from GitHub

echo "🤖 Deploying RobotMeal to robot control terminal..."

# 1. Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the RobotMeal project directory."
    exit 1
fi

# 2. Stop any existing Node.js processes
echo "🛑 Stopping existing Node.js processes..."
pkill -f "node server.js" || true

# 3. Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Enable Apache2 proxy modules
echo "⚙️  Enabling Apache2 proxy modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http

# 5. Create Apache2 configuration
echo "🔧 Creating Apache2 configuration..."
sudo cp apache-config.conf /etc/apache2/sites-available/robotmeal.conf

# 6. Enable the site
echo "🔗 Enabling the site..."
sudo a2ensite robotmeal.conf

# 7. Restart Apache2
echo "🔄 Restarting Apache2..."
sudo systemctl restart apache2

# 8. Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data .
sudo chmod 755 .

# 9. Start the Node.js server
echo "🚀 Starting Node.js server..."
npm start &

# 10. Wait a moment and check status
sleep 3
echo "📊 Checking deployment status..."

# Check if server is running
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Node.js server is running"
else
    echo "❌ Node.js server failed to start"
    exit 1
fi

# Check Apache2 status
if sudo systemctl is-active --quiet apache2; then
    echo "✅ Apache2 is running"
else
    echo "❌ Apache2 is not running"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your website should be available at: https://homeye.sdsu.edu/robotmeal/"
echo "🔧 Admin panel: https://homeye.sdsu.edu/robotmeal/admin.html"
echo ""
echo "📋 Useful commands:"
echo "  Check server logs: tail -f /var/log/apache2/robotmeal_error.log"
echo "  Restart server: pkill -f 'node server.js' && npm start"
echo "  Check Apache2: sudo systemctl status apache2" 