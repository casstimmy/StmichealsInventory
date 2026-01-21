# Tender Management - Quick Reference Guide

## 🚀 Quick Start

### Access Tender Management
- **URL**: `http://localhost:3002/setup/pos-tenders`
- **Auto-initializes**: Yes (creates default tenders on first load)

### Initialize Manually (if needed)
- **URL**: `http://localhost:3002/setup/init-tenders`
- Click "INITIALIZE TENDERS" button

---

## 📋 CRUD Operations

### CREATE - Add New Tender
```
1. Click "+ ADD TENDER TYPE" button
2. Fill form:
   ├─ Tender Name* (required, unique)
   ├─ Description (optional)
   ├─ Button Color (pick from palette or hex code)
   ├─ Till Order (1-999)
   └─ Classification (Cash / Card / Other)
3. Click "SAVE"
4. Success message appears
```

### READ - View All Tenders
```
Active Tender Types Table shows:
├─ EDIT link (clickable)
├─ NAME
├─ DESCRIPTION
├─ BUTTON COLOUR (color preview)
├─ TILL ORDER
├─ CLASSIFICATION
└─ DELETE button
```

### UPDATE - Edit Tender
```
1. Click "EDIT" button on any tender row
2. Modal opens with tender data
3. Modify fields as needed
4. Click "SAVE"
5. Tender updates in database
6. Table refreshes automatically
```

### DELETE - Remove Tender
```
1. Click "DELETE" button on any tender row
2. Confirm dialog appears: "Are you sure?"
3. Click "OK" to confirm
4. Tender removed from database
5. Table refreshes automatically
```

---

## 🛠️ API Endpoints Reference

### Get All Tenders
```
GET /api/setup/tenders

Response:
{
  "success": true,
  "tenders": [
    {
      "_id": "ObjectId",
      "name": "CASH",
      "description": "...",
      "buttonColor": "#E5E7EB",
      "tillOrder": 3,
      "classification": "Cash"
    }
  ]
}
```

### Create Tender
```
POST /api/setup/tenders

Body:
{
  "name": "NEW TENDER",
  "description": "Description",
  "buttonColor": "#0066FF",
  "tillOrder": 6,
  "classification": "Card"
}
```

### Update Tender
```
PUT /api/setup/tenders/[MONGODB_ID]

Body: (same as CREATE)
```

### Delete Tender
```
DELETE /api/setup/tenders/[MONGODB_ID]
```

### Seed Default Tenders
```
POST /api/setup/seed-tenders

Response: Creates 5 default tenders if none exist
```

---

## 🎨 Color Guide

Standard colors used:
- **Access Online**: `#FF69B4` (Pink)
- **Access POS**: `#22C55E` (Green)
- **Cash**: `#E5E7EB` (Gray)
- **Hydrogen**: `#A3E635` (Lime)
- **Zenith**: `#EF4444` (Red)

Custom colors: Use color picker in form

---

## ✅ Validation Rules

| Field | Rules |
|-------|-------|
| Name | Required, unique, alphanumeric + spaces |
| Description | Optional, max 500 chars |
| Button Color | Valid hex color (#RRGGBB) |
| Till Order | Number 1-999 |
| Classification | Cash, Card, or Other |

---

## 🔄 Status Messages

### Success Messages
- ✅ "Tender added successfully!"
- ✅ "Tender updated successfully!"
- ✅ "Tender deleted successfully!"

### Error Messages
- ❌ "Tender name is required"
- ❌ "A tender with this name already exists"
- ❌ "Failed to load tenders"
- ❌ "Failed to save tender"

---

## 📊 Device Assignment Section

Located below the Tender Types table:

```
Assign Tenders to Devices
├─ LOCATIONS column (expandable)
├─ Tender columns (ACCESS, CASH, etc.)
└─ Number input for each combination

Actions:
├─ EXPAND ALL (expand all locations)
└─ SAVE CHANGES (persist assignments)
```

---

## 🔧 Troubleshooting

### Tenders Not Loading
1. Check MongoDB connection
2. Verify `.env` has `MONGODB_URI`
3. Refresh page
4. Check browser console (F12)

### Cannot Create Tender
1. Verify all required fields filled
2. Check tender name is unique
3. Look for validation error message
4. Check API response in Network tab

### Auto-Initialize Not Working
1. Check if tenders already exist
2. Manually visit `/setup/init-tenders`
3. Click "INITIALIZE TENDERS"
4. Redirect to pos-tenders page

### Color Not Showing
1. Verify hex color format (#RRGGBB)
2. Use color picker instead of typing
3. Refresh page after saving

---

## 📁 File Structure

```
Tender System Files:

Models:
└─ models/Tender.js

API Endpoints:
├─ pages/api/setup/tenders.js (GET, POST)
├─ pages/api/setup/tenders/[id].js (GET, PUT, DELETE)
└─ pages/api/setup/seed-tenders.js (POST)

Pages:
├─ pages/setup/pos-tenders.js (Main management)
└─ pages/setup/init-tenders.js (Initialization)

Documentation:
├─ TENDER_SETUP.md
└─ TENDER_IMPLEMENTATION_SUMMARY.md
```

---

## 🎯 Common Tasks

### Add New Payment Method
1. Go to `/setup/pos-tenders`
2. Click "+ ADD TENDER TYPE"
3. Enter name (e.g., "FLUTTER WAVE")
4. Select classification
5. Pick button color
6. Save

### Change Tender Order
1. Click EDIT on tender
2. Modify "Till Order" value
3. Save
4. Tenders reorder in table

### Assign Tender to Multiple Devices
1. Find location in device assignment table
2. Enter number for each tender
3. Click "SAVE CHANGES"
4. Assignments persisted

### Disable Tender (Soft Delete)
Edit tender and set active: false (if UI supports it)

### Export Tender List
1. Open DevTools (F12)
2. Go to Network tab
3. Call: `fetch('/api/setup/tenders').then(r => r.json()).then(d => console.log(d))`
4. Copy response data

---

## 💾 Data Persistence

All changes are saved to MongoDB:
- ✅ Real-time persistence
- ✅ No manual save needed
- ✅ Auto-validates before saving
- ✅ Returns confirmation message

---

## 🔐 Security Notes

- Unique constraint prevents duplicate names
- Input validation on server and client
- ObjectId validation for updates/deletes
- Error details hidden in production
- Proper HTTP status codes returned

---

**Last Updated**: January 8, 2026
**Status**: ✅ Ready to Use
