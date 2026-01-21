# MongoDB Connection Error - SOLUTION

## Problem

Your API endpoints are failing with:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

## Root Cause

**MongoDB is not running or not accessible on `localhost:27017`**

The application tries to connect to MongoDB but fails because:
- Local MongoDB service is not running, OR
- MongoDB is not installed on your system, OR  
- The MONGODB_URI in `.env` points to a MongoDB instance that's not available

## Solutions

### Option 1: Use MongoDB Atlas (Cloud) - Recommended ⭐

**Easiest option - no local installation needed**

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free
   - Create a cluster (free tier available)

2. **Get Connection String**
   - In Atlas dashboard, click "Connect"
   - Choose "Drivers"
   - Copy the connection string
   - It will look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

3. **Update `.env.local`**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/inventory-admin
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

5. **Try Again**
   - The 500 errors should be gone
   - API calls should work

---

### Option 2: Install MongoDB Locally

**For Windows users:**

1. **Download MongoDB Community Edition**
   - Visit: https://www.mongodb.com/try/download/community
   - Download Windows MSI installer
   - Run the installer and follow setup wizard

2. **Start MongoDB Service**
   ```bash
   # In PowerShell (Run as Administrator)
   Start-Service MongoDB
   ```

   Or check Services:
   - Open Services (services.msc)
   - Find "MongoDB Server"
   - Right-click → Start

3. **Verify Connection**
   ```bash
   mongosh
   # You should see a MongoDB shell prompt
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

---

### Option 3: Use Docker

**If you have Docker installed:**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

This starts a MongoDB container that listens on port 27017.

---

## What to Do Now

### Immediate Steps:

1. **Choose an option** (I recommend Option 1 - MongoDB Atlas)

2. **Update `.env.local`** with the correct MONGODB_URI

3. **Restart dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   # Then:
   npm run dev
   ```

4. **Test the app**:
   - Visit http://localhost:3000
   - Try to register/login
   - Check if API calls work (no more 500 errors)

---

## Current Environment Variables

Check your `.env.local`:

```env
JWT_SECRET=zW4pj5YQWzMv1DlO/kB6hz5IHpQ2p8Aa8k42FDtqNH8=
MONGODB_URI=mongodb+srv://helloayoola:eaJ9IhnyRCeJysdJ@cluster0.rzusisv.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
EMAIL_USER=hello.ayoola@gmail.com
EMAIL_PASS=ptdx pngp gfoq ajmy
SALARY_MAIL_TO=hello.ayoola@gmail.com
```

⚠️ **IMPORTANT**: I see you already have a MongoDB Atlas URI in `.env`! 

That connection string should work. The issue might be:
- MongoDB Atlas IP whitelist doesn't include your current IP
- Credentials are wrong
- MongoDB Atlas server is down

---

## Fix MongoDB Atlas Access

1. **Go to MongoDB Atlas Dashboard**
   - https://cloud.mongodb.com

2. **Click on your cluster**

3. **Go to "Network Access"**
   - Look for your current IP address
   - If not in whitelist, click "Add IP Address"
   - Add `0.0.0.0/0` to allow all IPs (for development only)

4. **Go to "Database Access"**
   - Check if user `helloayoola` exists
   - If not, create a new user with that username
   - Make sure password matches in connection string

5. **Test Connection**
   ```bash
   mongosh "mongodb+srv://helloayoola:<password>@cluster0.rzusisv.mongodb.net/test"
   ```

---

## How API Works Now

```
Client (Browser)
  ↓ (with JWT token via apiClient)
API Endpoint
  ↓ (validates token with authMiddleware)
MongoDB
  ↓
Returns data
```

**Important**: The API endpoints need MongoDB to work. Without it, all API calls return 500 errors.

---

## Troubleshooting Checklist

- [ ] **MongoDB is running/accessible**
  - Verify with: `mongosh` or MongoDB Compass
  
- [ ] **MONGODB_URI is correct in `.env.local`**
  - Test the connection string
  - Make sure username/password are correct
  
- [ ] **Dev server is restarted**
  - Stop and run `npm run dev` again
  
- [ ] **Network access allowed** (if using Atlas)
  - IP whitelist includes your current IP
  - User credentials are correct

---

## After MongoDB is Fixed

Once MongoDB is working:
1. ✅ 500 errors will go away
2. ✅ API calls will succeed
3. ✅ Dashboard will load with data
4. ✅ User registration/login will work

---

## Need Help?

The most reliable option is **MongoDB Atlas** (Option 1) because:
- No local installation needed
- Free tier is generous  
- Cloud-hosted, always available
- Already configured in your `.env`

Just make sure:
1. Atlas account is active
2. IP whitelist allows your computer
3. Username/password are correct

**Try connecting to MongoDB Atlas first!** If that doesn't work, we can debug further.

