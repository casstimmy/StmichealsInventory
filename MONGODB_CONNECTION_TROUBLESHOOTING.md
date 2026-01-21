# MongoDB Connection Timeout Issues - Solution Guide

## Problem Analysis
You're experiencing `MongooseError: Operation [collection].find() buffering timed out after 10000ms` errors. This happens when:
1. MongoDB connection cannot be established within the timeout period
2. Connection pooling is not properly configured
3. IP address is not whitelisted in MongoDB Atlas
4. Network connectivity issues to MongoDB Atlas cluster

## Root Causes Identified

### 1. **Suboptimal Connection Configuration** ❌
Your original `lib/mongoose.js`:
- No connection pooling settings
- No server selection timeout configuration
- Simple on/off connection state check
- No retry mechanism

### 2. **Missing Connection Pool Parameters** ❌
- Default pool size may be insufficient
- No keepalive settings
- No compression to reduce network overhead

### 3. **IP Whitelist Issue** ❌
Error message indicates: "Could not connect to any servers in your MongoDB Atlas cluster... make sure your current IP address is on your Atlas cluster's IP whitelist"

## Solutions Implemented

### 1. ✅ Enhanced MongoDB Connection Module
Updated `lib/mongoose.js` with:
- **Connection pooling**: `maxPoolSize: 10`, `minPoolSize: 5`
- **Proper timeouts**: `serverSelectionTimeoutMS: 30000` (30 sec)
- **Socket timeout**: `socketTimeoutMS: 45000` (45 sec)
- **Connection caching**: Prevents reconnections on every request
- **Compression**: `snappy` compression to reduce network load
- **Retry writes**: Automatic retry for write operations

### 2. ✅ Connection URI Format
Your `.env` uses standard MongoDB URI (not `+srv`):
```
mongodb://user:pass@host1:27017,host2:27017,host3:27017/db?replicaSet=...
```
✅ This is **correct** for replica sets and cluster connections.

## Required Actions

### Action 1: MongoDB Atlas IP Whitelist
1. Go to **MongoDB Atlas Console**
2. Navigate to **Network Access** → **IP Whitelist**
3. Add your current IP address:
   - For development: Add your machine's IP
   - For production: Add your server's IP
   - For flexibility: `0.0.0.0/0` (allows all IPs - not recommended for production)
4. Click **Confirm**

### Action 2: Verify Connection String
Check your `.env` file:
```env
MONGODB_URI="mongodb://user:pass@cluster0-shard-00-00.z4yj0gu.mongodb.net:27017,..."
```
Ensure:
- ✅ Username is URL-encoded (special chars like `@` → `%40`)
- ✅ Password is URL-encoded
- ✅ All 3 cluster nodes are included (high availability)
- ✅ `retryWrites=true` and `w=majority` are present

### Action 3: Test Connection
Run in your terminal:
```bash
node -e "
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000
}).then(() => {
  console.log('✅ Connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
"
```

## Configuration Details

### Socket & Server Timeouts
- `serverSelectionTimeoutMS: 30000` - Wait max 30 seconds to find a server
- `socketTimeoutMS: 45000` - Wait max 45 seconds for socket operations
- `connectTimeoutMS: 30000` - Wait max 30 seconds for initial connection

### Connection Pooling
- `maxPoolSize: 10` - Maximum 10 concurrent connections
- `minPoolSize: 5` - Keep at least 5 connections open
- `maxIdleTimeMS: 45000` - Close idle connections after 45 seconds

### Network Optimization
- `compressors: ["snappy"]` - Compress network traffic
- `retryWrites: true` - Auto-retry failed writes
- `w: "majority"` - Wait for majority acknowledgment

## Common Error Messages & Fixes

### Error: "Could not connect to any servers"
**Cause**: IP not whitelisted or wrong credentials
**Fix**: 
- Verify IP in MongoDB Atlas whitelist
- Check username/password in connection string
- Ensure no special characters without URL encoding

### Error: "buffering timed out after 10000ms"
**Cause**: Connection can't be established quickly enough
**Fix**: 
- Increase `serverSelectionTimeoutMS` (done: now 30s)
- Check network connectivity to MongoDB Atlas
- Verify connection pooling is enabled

### Error: "Authentication failed"
**Cause**: Wrong username or password
**Fix**:
- Reset password in MongoDB Atlas
- Verify special characters are URL-encoded
- Check `authSource=admin` is in connection string

## Monitoring & Debugging

### Enable MongoDB Debug Logging
Add to your `.env`:
```env
DEBUG=mongoose:*
```

### Monitor Connection Status
You can add this to a page to check connection status:
```javascript
import mongoose from 'mongoose';
import { mongooseConnect } from '@/lib/mongoose';

export async function getServerSideProps() {
  try {
    await mongooseConnect();
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    console.log('MongoDB status:', states[state]);
  } catch (error) {
    console.error('Connection error:', error.message);
  }
  return { props: {} };
}
```

## Expected Results After Fix

✅ Successful MongoDB operations
✅ No "buffering timed out" errors
✅ All GET requests return 200 status
✅ Fast query execution (< 1 second typically)

## Rollback Instructions

If you need to revert the changes:
```bash
git restore lib/mongoose.js
```

## Additional Resources

- [MongoDB Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)
- [MongoDB Atlas IP Whitelist](https://www.mongodb.com/docs/atlas/security-whitelist/)
- [Replica Set Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/#replica-set-connection-strings)
