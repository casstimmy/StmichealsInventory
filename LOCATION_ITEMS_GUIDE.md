# Location Tenders & Categories - Setup Guide

## Overview
Attach specific tenders and categories to individual store locations. This allows you to control which payment methods and product categories are available at each location.

---

## Features

✅ **Assign Tenders to Locations**
- Select which payment tenders are available at each location
- Multiple tenders per location
- Real-time updates

✅ **Assign Categories to Locations**
- Control which product categories exist at each location
- Different locations can have different category selections
- Checkbox-based easy selection

✅ **Multi-Location Support**
- Manage multiple locations from one interface
- Switch between locations easily
- See summary of current selections

---

## How to Use

### 1. Access the Page
Navigate to: **`/setup/location-items`**

### 2. Select a Location
1. Use the "Select Location" dropdown at the top
2. Choose the store location you want to manage
3. All current tenders and categories for that location will load

### 3. Manage Tenders
For each tender:
- ✅ Check the checkbox to **enable** it for this location
- ❌ Uncheck the checkbox to **disable** it for this location
- Changes save automatically
- See tender name, classification, and color

### 4. Manage Categories
For each category:
- ✅ Check the checkbox to **enable** it for this location
- ❌ Uncheck the checkbox to **disable** it for this location
- Changes save automatically
- See category name

### 5. View Summary
At the bottom of the page, see:
- Total enabled tenders
- Total enabled categories

---

## Database Structure

### Store Model (Updated)
```javascript
{
  locations: [
    {
      name: String,
      address: String,
      tenders: [ObjectId],        // References to Tender docs
      categories: [ObjectId],      // References to Category docs
    }
  ]
}
```

### API Endpoints

#### GET /api/setup/location-items?locationId=[id]
Get all tenders and categories for a location

**Response:**
```json
{
  "success": true,
  "location": {
    "_id": "ObjectId",
    "name": "Main Store",
    "tenders": [
      { "_id": "...", "name": "CASH", ... }
    ],
    "categories": [
      { "_id": "...", "name": "Electronics", ... }
    ]
  }
}
```

#### PUT /api/setup/location-items?locationId=[id]
Replace all tenders/categories for a location

**Request:**
```json
{
  "tenderIds": ["id1", "id2"],
  "categoryIds": ["id1", "id2"]
}
```

#### POST /api/setup/location-items?locationId=[id]
Add a single tender or category to a location

**Request:**
```json
{
  "tenderId": "id"  // OR
  "categoryId": "id"
}
```

#### DELETE /api/setup/location-items?locationId=[id]
Remove a tender or category from a location

**Request:**
```json
{
  "tenderId": "id"  // OR
  "categoryId": "id"
}
```

---

## Example Scenarios

### Scenario 1: Different Tenders per Location
```
Main Store:
✅ CASH
✅ ACCESS POS
✅ ZENITH POS
❌ Cheque

Branch Store:
✅ CASH
✅ CHEQUE
❌ ACCESS POS
❌ ZENITH POS
```

### Scenario 2: Different Categories per Location
```
Main Store:
✅ Electronics
✅ Furniture
✅ Clothing
❌ Food

Outlet Store:
✅ Electronics
✅ Clothing
❌ Furniture
❌ Food
```

---

## Technical Details

### Real-Time Updates
- Changes save immediately when you check/uncheck
- No "Save" button needed
- Success message appears when updated
- Automatic refresh prevents stale data

### Validation
- Location ID must be valid MongoDB ObjectId
- Tender IDs must be valid MongoDB ObjectIds
- Category IDs must be valid MongoDB ObjectIds
- Error messages guide you if something is wrong

### Relationships
- Tenders are populated with full details (name, color, classification)
- Categories are populated with full details (name, properties)
- Many-to-many relationship: multiple locations can have same tenders/categories
- One location can have multiple tenders/categories

---

## File Structure

```
pages/
├── setup/
│   └── location-items.js      # Main management page
└── api/
    └── setup/
        └── location-items.js  # API endpoints

models/
└── Store.js                   # Updated with tenders/categories
```

---

## Troubleshooting

### Tenders/Categories Not Showing?
1. Ensure tenders and categories exist in the system
2. Check browser console for errors (F12)
3. Refresh the page
4. Check Network tab to see API responses

### Changes Not Saving?
1. Check if location ID is valid
2. Look for error messages in the UI
3. Check Network tab for API error details
4. Verify MongoDB connection in `.env`

### Location Not Appearing?
1. Ensure location exists in store
2. Check if location is active (isActive: true)
3. Verify location has a name
4. Refresh the page

---

## Benefits

✨ **Flexibility**: Different locations, different offerings
✨ **Control**: Granular control per location
✨ **Scalability**: Easy to add new locations
✨ **Simplicity**: Simple checkbox interface
✨ **Real-Time**: Changes apply immediately
✨ **Organization**: Grouped by location and type

---

## Next Steps

After setting up location tenders and categories:

1. **POS System**: Update POS to fetch available tenders/categories from API
2. **Ordering System**: Filter products by location's enabled categories
3. **Checkout**: Show only enabled tenders for selected location
4. **Analytics**: Track usage per location and tender type

---

## Integration Example

Get available tenders for a location:
```javascript
const locationId = "123...";
const res = await fetch(`/api/setup/location-items?locationId=${locationId}`);
const data = await res.json();

const tenders = data.location.tenders;
// Use in POS, checkout, or ordering interface
```

Add a tender to a location:
```javascript
const res = await fetch(`/api/setup/location-items?locationId=${locationId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tenderId: "tender-id" })
});
```

---

## Status

✅ **Ready to Use**
- API endpoints tested
- Frontend fully functional
- Database schema updated
- Real-time updates working

---

**Page URL**: `/setup/location-items`
**Created**: January 8, 2026
**Status**: ✅ Production Ready
