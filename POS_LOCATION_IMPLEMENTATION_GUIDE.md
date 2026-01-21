# Implementation Guide: Location-Based Tenders & Categories in POS

## 📋 Overview
Now that tenders and categories are linked to specific locations, we need to implement this in the Point of Sale (POS) system so that:
- Users select a location when starting a transaction
- Only tenders assigned to that location are available
- Only categories assigned to that location are available
- All product selections are filtered by the selected location

---

## 🎯 Step-by-Step Implementation

### Step 1: Create Location-Based POS Page
**File to Create**: `/pages/pos/index.js` (or update existing POS page)

**Key Features**:
```javascript
// State needed:
const [selectedLocation, setSelectedLocation] = useState("");
const [locationTenders, setLocationTenders] = useState([]);
const [locationCategories, setLocationCategories] = useState([]);
const [allLocations, setAllLocations] = useState([]);

// On component load:
// 1. Fetch all locations from /api/setup/get
// 2. Store locations in state
// 3. Show location selector (dropdown/buttons)

// When location is selected:
// 1. Fetch location-specific tenders from location data
// 2. Fetch location-specific categories from location data
// 3. Update tender buttons to show only assigned tenders
// 4. Update category filter to show only assigned categories
```

### Step 2: Fetch Location-Specific Data
**API Endpoints to Use**:

```javascript
// Get all locations
GET /api/setup/get
Response: {
  store: {
    locations: [
      {
        _id: "location-id",
        name: "Main Store",
        tenders: ["tender-id-1", "tender-id-2"],
        categories: ["cat-id-1", "cat-id-2"]
      }
    ]
  }
}

// Get full tender details
GET /api/setup/tenders
Response: {
  success: true,
  tenders: [
    {
      _id: "tender-id",
      name: "Cash",
      buttonColor: "#FF6B6B",
      classification: "Cash"
    }
  ]
}

// Get full category details
GET /api/categories
Response: [
  {
    _id: "cat-id",
    name: "Beverages",
    properties: []
  }
]
```

### Step 3: Location Selector Component
**UI Layout**:
```
┌─────────────────────────────────────┐
│  SELECT LOCATION                    │
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │Store 1│ │Store 2│ │Store 3│    │
│  └───────┘ └───────┘ └───────┘    │
└─────────────────────────────────────┘
```

**Implementation**:
- Display all locations as buttons or dropdown
- Highlight selected location
- On click, load that location's tenders and categories
- Disable POS functionality until location is selected

### Step 4: Dynamic Tender Display
**Current**: Show all tenders globally

**Updated**: Show only location-assigned tenders
```javascript
const handleLocationSelect = async (locationId) => {
  const location = allLocations.find(l => l._id === locationId);
  
  // Get full tender details for this location
  const assignedTenderDetails = allTenders.filter(t => 
    location.tenders.includes(t._id)
  );
  
  setLocationTenders(assignedTenderDetails);
};
```

### Step 5: Dynamic Category Filter
**Current**: Filter products by all categories

**Updated**: Filter by location-assigned categories only
```javascript
// When filtering products
const filteredByCategory = products.filter(p => 
  locationCategories.some(cat => cat._id === p.category)
);
```

### Step 6: Transaction Recording
**When creating a transaction**, include:
```javascript
const transactionPayload = {
  locationId: selectedLocation,  // ← NEW: Which location made this sale
  tenderId: selectedTender,
  categoryId: selectedCategory,
  products: cartItems,
  amount: totalAmount,
  timestamp: new Date()
};
```

---

## 🔄 Data Flow Diagram

```
POS System Loads
    ↓
Fetch Locations from /api/setup/get
    ↓
Display Location Selector
    ↓
User Selects Location
    ↓
Extract location.tenders[] and location.categories[]
    ↓
Fetch full details from /api/setup/tenders and /api/categories
    ↓
Filter full lists to show only selected location's items
    ↓
Display Tenders (location-specific)
Display Categories (location-specific)
Display Products (filtered by category)
    ↓
User Creates Transaction
    ↓
Save Transaction WITH selectedLocation ID
```

---

## 📝 Implementation Checklist

### Phase 1: Location Selection
- [ ] Create or update POS page
- [ ] Add location state
- [ ] Fetch all locations on page load
- [ ] Display location selector UI
- [ ] Handle location selection

### Phase 2: Data Filtering
- [ ] Extract location.tenders array when location selected
- [ ] Extract location.categories array when location selected
- [ ] Map tender IDs to full tender objects
- [ ] Map category IDs to full category objects
- [ ] Filter products by location-specific categories

### Phase 3: UI Updates
- [ ] Update tender buttons to show location tenders only
- [ ] Update category filter to show location categories only
- [ ] Disable non-assigned options with visual indicator
- [ ] Show location name in header

### Phase 4: Transaction Recording
- [ ] Include locationId in transaction payload
- [ ] Update Transaction model if needed (locationId field)
- [ ] Update transaction API to save locationId
- [ ] Verify transactions show location in reports

### Phase 5: Testing
- [ ] Test location selection
- [ ] Verify tenders update when location changes
- [ ] Verify categories update when location changes
- [ ] Test product filtering by location categories
- [ ] Test complete transaction with location
- [ ] Verify multi-location reporting

---

## 🔌 Database Changes Needed

### Transaction Model Update
If transactions don't already have locationId:
```javascript
// models/Transactions.js
const transactionSchema = new Schema({
  locationId: {
    type: Schema.Types.ObjectId,
    ref: "Store.locations",
    required: true,  // ← NEW
  },
  // ... existing fields
});
```

---

## 🚀 Next Steps to Execute

1. **Identify or Create POS Page**: Find where POS/sales transactions happen
2. **Add Location Selector**: Implement location choice UI
3. **Fetch Location Data**: Use existing APIs to get location tenders/categories
4. **Filter Display**: Show only location-specific tenders and categories
5. **Update Transactions**: Include locationId when saving transactions
6. **Test All Flows**: Multi-location scenarios

---

## 💡 Key Points

- ✅ **Locations Already Have Tenders/Categories**: Use the arrays in location object
- ✅ **APIs Already Exist**: /api/setup/tenders and /api/categories ready to use
- ✅ **No New APIs Needed**: Just filter existing data by location
- ✅ **Tenant-Like System**: Each location operates independently
- ⚠️ **Location Required**: Make location selection mandatory before POS works

---

## 🔗 Related Files

**Already Implemented**:
- `/pages/setup/location-items.js` - Shows how to fetch & manage location tenders/categories
- `/models/Store.js` - Has LocationSchema with tenders[] and categories[]
- `/pages/api/setup/location-items.js` - API for managing location items

**To Create/Update**:
- `/pages/pos/index.js` - Main POS interface (NEEDS UPDATE)
- `/models/Transactions.js` - May need locationId field

---

## ❓ Questions to Answer Before Starting

1. Where is the current POS/Sales interface located?
2. Does Transaction model have locationId field already?
3. Should users switch locations mid-session or select once at start?
4. Should default location be remembered for next session?
5. Should transactions show location in reports/history?

---

Would you like me to implement this in your POS page once you point me to where the sales interface is?
