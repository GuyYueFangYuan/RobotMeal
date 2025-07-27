# Troubleshooting Guide for Operator Backstage Control

## Issue: Login page appears but nothing happens after clicking login

### Step 1: Check if the server is running
1. Open terminal/command prompt in your project directory
2. Run: `npm start`
3. You should see: "Server running on http://localhost:3000"

### Step 2: Test server endpoints
1. Install dependencies: `npm install`
2. Run the test script: `node test-server.js`
3. Check the output for any errors

### Step 3: Check browser console
1. Open admin.html in your browser
2. Right-click and select "Inspect" or press F12
3. Go to the "Console" tab
4. Try to login and check for any error messages
5. Look for the debug messages we added (they start with "Attempting login...")

### Step 4: Verify data.json file
Make sure your data.json file exists and has the correct structure:
```json
{
  "meals": [
    {
      "id": 1,
      "name": "Seafood Fried Rice",
      "servings": 50
    }
  ],
  "orders": [],
  "operator": {
    "username": "Robotarm",
    "password": "123456789"
  }
}
```

### Step 5: Check file permissions
Make sure all files have proper read/write permissions:
- data.json
- server.js
- admin.js
- admin.html

### Step 6: Common issues and solutions

#### Issue: "Cannot find module" errors
- Run: `npm install` to install missing dependencies

#### Issue: "Port already in use"
- Change the port in server.js from 3000 to another number (e.g., 3001)
- Update the test-server.js URL accordingly

#### Issue: CORS errors in browser console
- Make sure the server is running on the same domain as the admin page
- Check that the fetch URLs in admin.js match your server URL

#### Issue: "Unauthorized" errors
- Check that the username/password in data.json match what you're entering
- Default credentials: username="Robotarm", password="123456789"

### Step 7: Manual testing
1. Open your browser to: http://localhost:3000/admin.html
2. Try logging in with: Robotarm / 123456789
3. Check the browser console for debug messages
4. If successful, you should see the admin interface with orders and meals sections

### Step 8: If still not working
1. Check the server console for any error messages
2. Make sure all files are in the same directory
3. Try restarting the server
4. Clear browser cache and try again

## File Structure
Your project should have these files:
```
project-folder/
├── server.js
├── admin.js
├── admin.html
├── data.json
├── style.css
├── package.json
├── test-server.js
└── TROUBLESHOOTING.md
``` 