# System Fixes Applied - January 6, 2026

## Issues Fixed

### 1. ✅ JSON Serialization Error in Login Page
**Error**: `Error serializing `.staffList[0].email` returned from `getServerSideProps` - undefined cannot be serialized`

**Root Cause**: Staff members without emails were being serialized with `email: undefined`, which Next.js cannot serialize to JSON

**Solution Applied** (`pages/login.js`):
```javascript
// BEFORE:
email: undefined, // ❌ Cannot be serialized

// AFTER:
email: null, // ✅ Can be serialized to JSON
```

**Files Updated**:
- `pages/login.js` - getServerSideProps now returns `null` instead of `undefined` for missing emails

---

### 2. ✅ Add Location Form Input Deselect Issue
**Problem**: When typing in the location form, input fields were losing focus/being deselected

**Root Cause**: State updates and component re-renders were causing input blur

**Solution Applied** (`pages/setup/setup.js`):
- Added explicit event handling with `preventDefault()` and `stopPropagation()`
- Created wrapper function `handleAddLocation` to prevent re-renders
- Ensures form inputs maintain focus during user input

**Files Updated**:
- `pages/setup/setup.js` - Added proper event handling and state management

---

### 3. ✅ Location Data Type Consistency
**Problem**: Reporting and stock movement APIs were trying to filter by ObjectId for locations, but transactions now store locations as strings

**Root Cause**: Location type was changed from ObjectId to String in Transaction model, but other APIs weren't updated

**Solution Applied** (`pages/api/reporting/reporting-data.js`):
```javascript
// BEFORE:
// Complex logic trying to map location names to ObjectIds
stores.forEach(store => {
  store.locations.forEach(loc => {
    locationMap[loc._id.toString()] = loc.name;
  });
});

// AFTER:
// Direct string comparison - locations stored as strings
if (location !== "All") {
  queryFilter.location = location;
}
```

**Files Updated**:
- `pages/api/reporting/reporting-data.js` - Simplified location filtering to use string comparison

---

## System-Wide Location Implementation

### Current Location Data Flow:
```
Login Page:
  ↓
User selects location (string name) from dropdown
  ↓
Transaction Creation:
  - Physical locations: Stores as string (e.g., "Main Store")
  - Online orders: Stores as "online"
  ↓
Dashboard/Reporting:
  - Filters by string location name directly
  - No ObjectId conversion needed
```

### Location Sources:
1. **Store Setup** (`pages/setup/setup.js`):
   - Locations defined with: name, address, phone, email, code
   - Stored in Store model as LocationSchema array

2. **Login Page** (`pages/login.js`):
   - Gets locations from Store.locations array
   - Returns location names as strings: `["Main Store", "Branch A", "Online"]`

3. **Transactions** (`Transaction.js` model):
   - Stores location as String type
   - Values: location name or "online"

4. **Reporting** (`pages/api/reporting/reporting-data.js`):
   - Filters by location string
   - No ObjectId mapping needed

---

## Remaining Issues to Address

### ⚠️ StockMovement Model
**Status**: Needs update (not yet fixed)

Current issue: Model still references locations by ObjectId
```javascript
fromLocationId: { 
  type: Schema.Types.ObjectId,  // ⚠️ Should be String
  ref: "Store.locations",
},
```

**Recommended Fix**:
```javascript
fromLocationId: { 
  type: String,  // Change to String to match Transaction pattern
  // ref: "Store.locations", // Remove ref (not a separate model)
},
```

### ⚠️ Expense Model
**Status**: Uses locationId as ObjectId

Currently:
```javascript
locationId: Schema.Types.ObjectId,  // ⚠️ Should verify usage
```

**Action**: Check if Expense locationId is used in reporting/filters and update if needed

### ⚠️ Stock Movement API
**Status**: Partially updated

File `pages/api/stock-movement/get.js` has complex location mapping logic that should be simplified once StockMovement model is updated to use string locations.

---

## Verification Checklist

- [x] Login page loads without serialization errors
- [x] Staff list with mixed email/no-email users works
- [x] Location dropdown populated correctly
- [x] Add location form allows text input without deselecting
- [x] Save location button works properly
- [ ] Stock movement creates with string locations
- [ ] Reporting filters work with string locations
- [ ] Expense records handle locations correctly

---

## Files Modified in This Session

1. **pages/login.js**
   - Changed `email: undefined` → `email: null` in getServerSideProps

2. **pages/setup/setup.js**
   - Fixed add location form input deselect
   - Added proper event handling
   - Added loading state and message display

3. **pages/api/reporting/reporting-data.js**
   - Removed ObjectId location mapping
   - Simplified location filtering to string comparison
   - Cleaned up unused store/location lookup code

---

## Next Steps

1. **Update StockMovement Model** - Change location fields from ObjectId to String
2. **Update Stock Movement API** - Simplify location mapping logic
3. **Verify Expense Model** - Check locationId usage and update if needed
4. **Test All Flows** - Ensure locations work correctly across:
   - Login → Location selection
   - Transaction creation → Location storage
   - Dashboard filtering → Location filtering
   - Reporting → Location-based reports
   - Stock movement → Location transfers

---

**Status**: 3/6 issues fixed, 3 pending
**Session**: January 6, 2026
