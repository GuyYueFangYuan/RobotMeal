#!/bin/bash

# RobotMeal GitHub Upload and Deployment Script
# Run this from your local machine first

echo "🚀 Starting RobotMeal deployment process..."

# 1. Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the RobotMeal project directory."
    exit 1
fi

# 2. Add all files to git
echo "📦 Adding files to git..."
git add .

# 3. Commit the changes
echo "💾 Committing changes..."
git commit -m "Update RobotMeal with Apache2 deployment configuration - $(date)"

# 4. Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main

echo "✅ Successfully uploaded to GitHub!"
echo ""
echo "🌐 Next steps:"
echo "1. SSH into your robot control terminal"
echo "2. Navigate to your RobotMeal directory"
echo "3. Run: git pull origin main"
echo "4. Follow the Apache2 deployment guide"
echo ""
echo "📋 Quick commands for robot terminal:"
echo "cd /path/to/robotmeal"
echo "git pull origin main"
echo "sudo a2enmod proxy proxy_http"
echo "sudo cp apache-config.conf /etc/apache2/sites-available/robotmeal.conf"
echo "sudo a2ensite robotmeal.conf"
echo "sudo systemctl restart apache2"
echo "npm start" 