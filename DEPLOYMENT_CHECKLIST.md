# Deployment Checklist for Operator Backstage Control

## Essential Files to Transfer

### ✅ Core Application Files
- [ ] `server.js` - Main server file
- [ ] `package.json` - Dependencies and scripts
- [ ] `package-lock.json` - Locked dependency versions
- [ ] `data.json` - Database file with meals, orders, and operator credentials

### ✅ Frontend Files
- [ ] `index.html` - Main customer ordering page
- [ ] `script.js` - Customer ordering functionality
- [ ] `style.css` - Styling for all pages

### ✅ Admin/Operator Files
- [ ] `admin.html` - Operator backstage control page
- [ ] `admin.js` - Operator backstage functionality

### ✅ Supporting Files
- [ ] `node_modules/` folder (or run `npm install` on new server)
- [ ] `test-server.js` - Testing script (optional)
- [ ] `TROUBLESHOOTING.md` - This guide

## Server Setup Steps

### 1. File Transfer
```bash
# Transfer all files to your new server
# Make sure to include ALL files listed above
```

### 2. Install Dependencies
```bash
# On your new server, run:
npm install
```

### 3. Verify File Permissions
```bash
# Make sure data.json is writable
chmod 644 data.json
chmod 755 server.js
```

### 4. Start the Server
```bash
npm start
# Should see: "Server running on http://localhost:3000"
```

## Common Transfer Issues

### Issue: Missing admin.html
- **Symptom**: Can't access operator backstage
- **Solution**: Make sure `admin.html` is transferred

### Issue: Missing admin.js
- **Symptom**: Login page appears but nothing happens after login
- **Solution**: Ensure `admin.js` is in the same directory as `admin.html`

### Issue: Missing data.json
- **Symptom**: Server crashes or can't find operator credentials
- **Solution**: Transfer `data.json` with correct structure

### Issue: Wrong file paths
- **Symptom**: 404 errors for admin files
- **Solution**: Make sure all files are in the same directory

### Issue: Port conflicts
- **Symptom**: Server won't start
- **Solution**: Change port in `server.js` if needed

## Verification Steps

### 1. Check Server is Running
```bash
curl http://localhost:3000/api/meals
# Should return JSON array of meals
```

### 2. Test Admin Access
- Open: `http://your-server:3000/admin.html`
- Login with: Robotarm / 123456789
- Should see orders and meals management

### 3. Check File Structure
Your server directory should look like this:
```
server-directory/
├── server.js
├── package.json
├── package-lock.json
├── data.json
├── index.html
├── script.js
├── style.css
├── admin.html          ← CRITICAL for operator control
├── admin.js           ← CRITICAL for operator control
├── node_modules/
└── (other files)
```

## Quick Fix Commands

If operator backstage isn't working:

```bash
# 1. Stop server (Ctrl+C)
# 2. Verify files exist
ls -la admin.html admin.js

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Restart server
npm start

# 5. Test admin access
curl http://localhost:3000/admin.html
```

## Data.json Structure Check

Make sure your `data.json` contains:
```json
{
  "meals": [...],
  "orders": [],
  "operator": {
    "username": "Robotarm",
    "password": "123456789"
  }
}
```

## Final Test

1. Start server: `npm start`
2. Open browser: `http://your-server:3000/admin.html`
3. Login: Robotarm / 123456789
4. Should see: Orders list and Meals management table

If this doesn't work, check the browser console (F12) for error messages. 