# Stock Management System - Complete Implementation Guide

## Overview
This document provides a comprehensive guide to the stock management system in the Inventory Admin App, including all recent fixes and improvements.

---

## System Architecture

### Core Components

#### 1. Stock Add Page (`/pages/stock/add.js`)
**Purpose:** Record new stock movements between locations

**Key Features:**
- Product search with autocomplete
- Inline quantity editing with +/- buttons
- Form validation before submission
- Real-time total cost calculation
- Loading state during submission

**User Flow:**
1. Select source location (or "Vendor" for new stock)
2. Select destination location
3. Select responsible staff member
4. Select reason (Restock, Transfer, Return)
5. Search and add products
6. Set quantities for each product
7. Click "ADD TO STOCK" to submit

**Form State Variables:**
```javascript
fromLocation      // Source location ID
toLocation        // Destination location ID
staff             // Staff member ID
reason            // Movement reason
addedProducts     // Array of selected products with quantities
searchTerm        // Product search input
quantityInput     // Quantity value for new additions
```

---

#### 2. Stock Movement API (`/pages/api/stock-movement/stock-movement.js`)
**Purpose:** Process and save stock movements, update product quantities

**Request Format:**
```javascript
{
  transRef: string,           // Transaction reference (timestamp)
  fromLocationId: string,     // Source location MongoDB ID
  toLocationId: string,       // Destination location MongoDB ID
  staffId: string,            // Staff member MongoDB ID (optional)
  reason: string,             // "Restock" | "Transfer" | "Return"
  status: string,             // "Received" | "Pending"
  totalCostPrice: number,     // Total calculated cost
  barcode: string,            // Barcode/reference ID
  dateSent: ISO8601,          // Send timestamp
  dateReceived: ISO8601,      // Receive timestamp
  products: [
    { id: string, quantity: number },  // Product MongoDB ID and qty
    ...
  ]
}
```

**Response Format (Success - 201):**
```javascript
{
  success: true,
  message: "Stock movement saved successfully",
  data: {
    movementId: string,        // StockMovement MongoDB ID
    transRef: string,          // Reference number
    totalCostPrice: number     // Total cost
  }
}
```

**Response Format (Error):**
```javascript
{
  message: string,            // Error description
  product?: object,           // Offending product (if validation error)
  error?: string              // Detailed error (development mode only)
}
```

**Validation:**
- All required fields must be present
- FromLocationId and ToLocationId must be valid
- Reason must be one of: "Restock", "Transfer", "Return"
- Products array must contain at least one item
- Each product must have valid MongoDB ID and quantity >= 1
- Products must exist in database

**Quantity Updates:**
- **Restock:** Stock quantity += quantity
- **Transfer:** Stock quantity -= quantity (from source)
- **Return:** Stock quantity -= quantity (from source)

---

#### 3. Stock Management Dashboard (`/pages/stock/management.js`)
**Purpose:** Display stock overview and analytics

**Key Metrics:**
- **Total Stock:** Sum of all product quantities
- **Total Incoming:** Count of pending stock movements
- **Total Outgoing:** Count of pending orders
- **Low Stock Count:** Products below minimum threshold

**Features:**
- Product search with real-time filtering
- Stock status indicators (In Stock, Low Stock, Out of Stock)
- Editable minimum stock levels
- Cost analysis per product

---

### Database Models

#### StockMovement
```javascript
{
  transRef: String,              // Transaction reference
  fromLocationId: String,        // Source location
  toLocationId: String,          // Destination location
  staffId: ObjectId,             // Responsible staff (optional)
  reason: String,                // Restock, Transfer, Return
  status: String,                // Received, Pending
  totalCostPrice: Number,        // Total cost of movement
  barcode: String,               // Movement barcode
  dateSent: Date,                // When sent
  dateReceived: Date,            // When received
  products: [
    { productId: ObjectId, quantity: Number }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### Product
```javascript
{
  name: String,
  barcode: String,
  category: String,
  costPrice: Number,             // Purchase cost
  salePriceIncTax: Number,       // Sale price
  quantity: Number,              // Current stock quantity
  minStock: Number,              // Minimum threshold
  maxStock: Number,              // Maximum threshold
  description: String,
  sku: String,
  images: [String],
  ...other fields
}
```

---

## Recent Fixes & Improvements

### Fix 1: Dropdown Value Binding
**Issue:** Form selections (locations, staff) were storing display text instead of IDs
**Solution:** Updated Dropdown component to use `value={opt._id}` attribute
**Impact:** API now receives correct IDs instead of names

### Fix 2: API Validation Enhancement
**Issue:** Vague error messages made debugging difficult
**Solution:** Added detailed, specific validation with helpful error messages
**Impact:** Users and developers get clear feedback on what went wrong

### Fix 3: Comprehensive Error Logging
**Issue:** No visibility into submission flow during debugging
**Solution:** Added emoji-prefixed console logs throughout submission
**Impact:** Easy debugging with clear visualization of request/response flow

### Fix 4: Status Code Improvements
**Issue:** API was returning 200 for resource creation (semantically incorrect)
**Solution:** Changed successful POST to return 201 (Created)
**Impact:** Better adherence to HTTP standards

### Fix 5: Product Quantity Calculation
**Issue:** Total cost price calculation could be inconsistent
**Solution:** Validated calculation both frontend and backend
**Impact:** Accurate cost tracking across the system

---

## Debugging Guide

### Issue: "Add to Stock" Button Doesn't Respond

**Step 1: Check Console Logs**
Open Developer Tools (F12) → Console tab

Look for logs in this order:
```
📤 Sending payload:         # Frontend sent data
📥 Response status: 201     # API accepted it (201 = success)
✅ Stock movement saved     # Confirmation
```

**Step 2: If Status is Not 201**
Check the error response:
```
📥 Response body: {
  message: "Missing required fields: fromLocationId, toLocationId, reason"
}
```

This tells you exactly what's wrong.

**Step 3: Verify Form Data**
Before clicking submit, verify:
- [ ] "From Location" is selected (not blank)
- [ ] "To Location" is selected (not blank)
- [ ] "Staff Member" is selected (not blank)
- [ ] "Reason" is selected (not blank)
- [ ] At least one product is added to the table

**Step 4: Check Console for Dropdown Issue**
If you see IDs in console but they're numbers or strings, check if dropdown is properly setting value:
```javascript
<option value={opt._id}>  // ✅ Correct
<option>                  // ❌ Wrong (missing value attribute)
```

### Issue: Products Show But Can't Add Them

**Check:**
- Is product search finding results? (Check API response in Network tab)
- Does clicking product select it? (Check selectedProduct state)
- Can you set quantity before adding? (Check quantityInput value)

**Common Causes:**
1. Product not in database
2. Search term too short (requires >= 2 characters)
3. API search endpoint broken

### Issue: Stock Quantities Not Updating After Submission

**Check:**
- Did you see "✅ Stock movement saved" in console?
- Did it redirect to /stock/movement?
- Check database: `db.products.find({_id: ObjectId(...)}, {quantity: 1})`

**If quantities not updated:**
1. Check if backend bulkWrite succeeded
2. Verify Product IDs are valid ObjectIds
3. Check for MongoDB errors in server logs

---

## API Endpoints Reference

### GET /api/setup/get
**Purpose:** Fetch store configuration and locations
**Response:** 
```javascript
{
  store: {
    name: string,
    locations: [
      { name: string, id?: string }
    ],
    ...
  }
}
```

### GET /api/staff
**Purpose:** Fetch list of staff members
**Response:** Array of staff objects with `_id` and `name`

### GET /api/products?search=
**Purpose:** Search products by name/barcode
**Response:** Array of product objects

### POST /api/stock-movement/stock-movement
**Purpose:** Save new stock movement
**See:** API documentation above

### GET /api/stock-movement/get
**Purpose:** Fetch all stock movements with populated products
**Response:** Array of movements with full product details

---

## Best Practices

### For Frontend
1. Always validate form completeness before submit
2. Provide visual feedback during async operations
3. Clear form data only after successful response
4. Use descriptive error messages for users
5. Check console logs during development

### For Backend
1. Validate all inputs from frontend
2. Return specific error codes (400, 404, 500)
3. Include helpful error messages
4. Log important operations for debugging
5. Use transactions for multi-step operations

### For Database
1. Always index frequently searched fields
2. Validate data on insert (schema validation)
3. Use references (ObjectId) for relationships
4. Keep audit trail of stock movements
5. Regular backups

---

## Common Workflows

### Workflow 1: New Stock Purchase (Restock)
1. From: "Vendor" → To: "Main Store"
2. Reason: "Restock"
3. Staff: Select responsible person
4. Add all purchased products
5. Submit

**Result:** Product quantities increase, movement recorded

### Workflow 2: Transfer Between Locations
1. From: "Warehouse" → To: "Branch 1"
2. Reason: "Transfer"
3. Staff: Select driver/delivery person
4. Add products to transfer
5. Submit

**Result:** Quantity decreases at source, increases at destination

### Workflow 3: Return Damaged Goods
1. From: "Main Store" → To: "Returns Center"
2. Reason: "Return"
3. Staff: Select staff who processed return
4. Add returned products
5. Submit

**Result:** Quantity decreases from selling location

---

## Performance Considerations

1. **Product Search:** Debounced 500ms to reduce API calls
2. **Bulk Updates:** Uses MongoDB bulkWrite for efficiency
3. **Dropdown Loading:** Fetched once on component mount
4. **Table Rendering:** Uses key={product._id} for optimal React rendering

---

## Security Notes

1. All endpoints require authentication (NextAuth)
2. User session verified before data access
3. Input validation on both frontend and backend
4. No sensitive data in error messages (production)
5. MongoDB ObjectId validation prevents injection

---

## Future Enhancements

- [ ] Approve/Reject workflow for stock movements
- [ ] Email notifications on status changes
- [ ] Barcode scanning support
- [ ] Bulk import via CSV
- [ ] Stock movement history reports
- [ ] Automated low stock alerts
- [ ] Stock forecast based on sales trends
- [ ] Multi-currency support

---

## Support & Troubleshooting

For issues not covered here:

1. **Check browser console** for error messages
2. **Check server logs** for backend errors
3. **Review MongoDB collections** for data integrity
4. **Test API endpoints directly** with Postman/curl
5. **Enable development mode** to see detailed errors

---

**Last Updated:** 2024
**Status:** Complete with all fixes applied
