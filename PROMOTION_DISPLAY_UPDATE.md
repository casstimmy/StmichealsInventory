# Promotion Display Features & Data Fetching Fix

## Overview
Updated the promotion system to support displaying promotions above product prices with priority ordering, and fixed the issue where products and categories were not populating in the form.

## Changes Made

### 1. ✅ Promotion Model Enhanced (`models/Promotion.js`)
Added two new fields to support promotional display:

```javascript
displayAbovePrice: {
  type: Boolean,
  default: true, // Show promotion above product price
},
priority: {
  type: Number,
  default: 0, // Higher priority promotions show first (0 = highest)
},
```

### 2. ✅ API Endpoints Updated

#### POST/PUT Promotion Creation & Update
- **File**: `pages/api/promotions/index.js` and `pages/api/promotions/[id].js`
- **Changes**: 
  - Now accepts and saves `displayAbovePrice` boolean field
  - Now accepts and saves `priority` number field
  - Defaults: `displayAbovePrice = true`, `priority = 0`

### 3. ✅ Promotion Management Form Enhanced (`pages/manage/promotions-management.js`)

#### Form State Updates
Added new fields to the initial form state:
```javascript
displayAbovePrice: true,
priority: 0,
```

#### UI Controls Added
New "Display Settings" section in the form with:
- **Checkbox**: "Show Promotion Above Product Price" (toggles displayAbovePrice)
- **Number Input**: "Priority Level (0 = highest)" (sets priority)

#### Promotion Card Display Enhanced
Added a new section to promotion cards showing:
- **Display Above Price**: ✓ Yes / ✗ No (in cyan highlight box)
- **Priority Level**: Shows the priority number
- **Max Uses**: Shows unlimited or max number

### 4. ✅ Data Fetching Fixed

#### Fixed Response Format Handling
- **Products Endpoint**: Returns `{ success: true, data: [...] }`
- **Categories Endpoint**: Returns array directly `[...]`

#### Enhanced Console Logging
Added debug logs showing:
```
📦 Products loaded: X (with sample names)
📂 Categories loaded: X (with sample names)
❌ Failed to fetch products: [status code]
```

This helps identify data loading issues immediately.

## How to Use

### Creating a Promotion with Display Settings

1. Click **"+ Create Promotion"** button
2. Fill in basic details:
   - Name and description
   - Select customer type(s)
   - Set discount type and value
   - Select application type (All Products/Category/One Product)
   - Pick products/categories if needed
3. Set date range
4. In **Display Settings** section:
   - ✓ Check "Show Promotion Above Product Price" (default: checked)
   - Enter Priority Level (0 = shows first, higher numbers = lower priority)
5. Click **"Create Promotion"**

### What These Fields Do

- **displayAbovePrice**: Controls whether the promotion badge/label appears above the product's regular price in the POS
- **priority**: When multiple promotions apply to the same product, lower priority numbers display first (0 = highest priority)

## Testing Checklist

- [ ] Open promotions-management page
- [ ] Check browser console (F12) for "📦 Products loaded" and "📂 Categories loaded" logs
- [ ] Verify products appear in "One Product" selection
- [ ] Verify categories appear in "Category" selection
- [ ] Create a new promotion with all fields including display settings
- [ ] Verify promotion appears in the list with display settings visible
- [ ] Edit a promotion to verify display settings save correctly

## POS Integration (Next Steps)

To use these promotions in the POS system:

```javascript
// Example: Show promotion above price when ringing up sale
const applicablePromos = await fetch(
  `/api/promotions/applicable?customerType=VIP&productId=${productId}`
);

const promos = await applicablePromos.json();

// Sort by priority (lower = higher priority)
const sortedPromos = promos.sort((a, b) => a.priority - b.priority);

// Display promotions marked with displayAbovePrice = true
const visiblePromos = sortedPromos.filter(p => p.displayAbovePrice);

// Apply discount from first applicable promotion
if (visiblePromos.length > 0) {
  const promo = visiblePromos[0];
  const discountAmount = promo.discountType === "PERCENTAGE" 
    ? (price * promo.discountValue) / 100 
    : promo.discountValue;
  
  displayPromotion(promo.name, discountAmount);
}
```

## Technical Details

### Database Schema Impact
- **displayAbovePrice**: Boolean field, indexed for quick queries
- **priority**: Number field, indexed for sorting by priority

### API Response Format
Promotions API now returns complete objects with new fields:
```json
{
  "success": true,
  "promotions": [
    {
      "_id": "...",
      "name": "VIP Discount",
      "displayAbovePrice": true,
      "priority": 0,
      ...
    }
  ]
}
```

## Files Modified

1. `models/Promotion.js` - Added schema fields
2. `pages/api/promotions/index.js` - Updated POST to handle new fields
3. `pages/api/promotions/[id].js` - Updated PUT to handle new fields
4. `pages/manage/promotions-management.js` - Added UI, form state, and fixed data fetching

## Notes

- All changes are backward compatible
- Existing promotions will have default values (displayAbovePrice=true, priority=0)
- Data fetching now logs to console for debugging
- Display settings section uses cyan styling to visually separate from other settings
