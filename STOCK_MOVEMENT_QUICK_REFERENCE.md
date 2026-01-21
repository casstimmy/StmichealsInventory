# Stock Movement - Quick Reference Card

## 🚀 Quick Start

### To Add Stock:
1. Go to `/stock/add`
2. Fill all 4 dropdowns (From, To, Staff, Reason)
3. Search & add products
4. Set quantities
5. Click "ADD TO STOCK"
6. Check success message
7. Auto-redirects to movement list

---

## ✅ Validation Checklist

Before clicking "ADD TO STOCK", verify:
- ✓ "From Location" is not "Select..."
- ✓ "To Location" is not "Select..."
- ✓ "Staff Member" is not "Select..."
- ✓ "Reason" is not "Select..."
- ✓ At least 1 product in table
- ✓ All quantities are > 0

---

## 🔍 Debugging in 3 Steps

1. **Open Console** (F12 → Console)
2. **Look for emoji logs:**
   - 📤 = Frontend sending
   - 📥 = Backend response
   - ✅ = Success
   - ❌ = Error
3. **Check response status:**
   - `201` = Success (reload page)
   - `400` = Bad data (check dropdown values)
   - `404` = Product not found
   - `500` = Server error (check backend logs)

---

## 🎯 Response Indicators

| Signal | Meaning | Action |
|--------|---------|--------|
| Console: `📥 Response status: 201` | ✅ Success | Check if page redirected |
| Alert: "Stock movement added successfully!" | ✅ Success | Wait for redirect or refresh |
| Console: `❌ API Error:` | ❌ Error | Read the error message below |
| Alert: "Error saving stock movement:" | ❌ Error | Check dropdown selections |
| Button stuck on "SAVING..." | ⏳ Loading | Wait or check network tab |

---

## 🔧 Common Issues & Solutions

| Problem | Check | Fix |
|---------|-------|-----|
| Button disabled | All dropdowns filled? | Select values in all 4 dropdowns |
| No products found | Typed 2+ chars? | Type longer search term |
| Submit fails silently | Console errors? | Open F12 console and check logs |
| No alert appears | API call made? | Check Network tab for request |
| Can't edit quantity | Clicked "+" button? | Use inline +/- or input field |
| Redirect not happening | Check status code | If 201, page should redirect in 1.5s |

---

## 📊 Form Field Reference

### Dropdowns (All Required)
| Field | Source | Stores | Example |
|-------|--------|--------|---------|
| From Location | `/api/setup/get` | location._id | "Vendor" or "Main Store" |
| To Location | `/api/setup/get` | location._id | "Branch 1" or "Warehouse" |
| Staff | `/api/staff` | staff._id | "John Doe" |
| Reason | Hard-coded | string | "Restock" \| "Transfer" \| "Return" |

### Products Table
| Column | Input | Purpose |
|--------|-------|---------|
| PRODUCT | Auto | Selected product name |
| UNIT COST | Auto | From database |
| UNIT SALE | Auto | From database |
| QUANTITY | Manual | How many to move |
| TOTAL COST | Auto | Qty × Unit Cost |
| REMOVE | Button | Delete from list |

---

## 🔄 Quantity Update Methods

**Method 1: Inline +/- Buttons**
```
[-] [input] [+]  ← Click these
```

**Method 2: Direct Input**
```
Click input field → Type number → Press Enter
```

**Method 3: Combination**
```
Use +/- for 1-2 items, input for large quantities
```

---

## 📡 API Contract

### Request Format
```javascript
POST /api/stock-movement/stock-movement
{
  fromLocationId: "507f1f77bcf86cd799439011",  // ObjectId string
  toLocationId: "507f1f77bcf86cd799439012",   // ObjectId string
  staffId: "507f1f77bcf86cd799439013",        // ObjectId string
  reason: "Restock",                           // or "Transfer"/"Return"
  products: [
    { id: "507f1f77bcf86cd799439014", quantity: 10 }
  ]
}
```

### Success Response
```javascript
Status: 201
{
  success: true,
  message: "Stock movement saved successfully",
  data: {
    movementId: "507f1f77bcf86cd799439099",
    transRef: "1699564800000"
  }
}
```

### Error Response
```javascript
Status: 400
{
  message: "Missing required fields: fromLocationId, toLocationId, reason"
}
```

---

## 🛠️ For Developers

### Key Files
- `/pages/stock/add.js` - Frontend form
- `/pages/api/stock-movement/stock-movement.js` - Backend API
- `/models/StockMovement.js` - Database schema

### Important Functions
```javascript
// Frontend
handleAddToStock()          // Main submit handler
handleProductSelect()       // Select product from search
updateProductQuantity()     // Edit quantity in table
removeProduct()             // Delete from table

// Backend
validateProducts()          // Check format & existence
updateQuantities()          // MongoDB bulkWrite
```

### Testing
```bash
# Test in Postman
POST http://localhost:3000/api/stock-movement/stock-movement
Content-Type: application/json

{
  "fromLocationId": "0",
  "toLocationId": "1",
  "staffId": "507f1f77bcf86cd799439013",
  "reason": "Restock",
  "products": [
    { "id": "507f1f77bcf86cd799439014", "quantity": 5 }
  ]
}
```

---

## 📝 Log Examples

### Successful Submission
```
📤 Sending payload: {fromLocationId: "0", toLocationId: "1", ...}
📥 Response status: 201
📥 Response body: {success: true, message: "Stock movement saved successfully", ...}
✅ Stock movement saved successfully
🔄 Redirecting to /stock/movement
```

### Missing Field Error
```
📤 Sending payload: {fromLocationId: "", toLocationId: "1", ...}
📥 Response status: 400
📥 Response body: {message: "Missing required fields: fromLocationId..."}
❌ API Error: {message: "Missing required fields: fromLocationId..."}
❌ Stock movement error: Error: Missing required fields: fromLocationId...
```

---

## 💡 Pro Tips

1. **Search efficiently:** Type category + first letters (e.g., "phone a10")
2. **Batch updates:** Add all products at once before submitting
3. **Verify quantities:** Check table total cost before submit
4. **Check logs:** Always check console during testing
5. **Test modes:** Fill dropdowns then try submit with empty table (should be blocked)

---

## 🔐 Security Notes

- All data validated on backend
- MongoDB IDs sanitized
- Authentication required (NextAuth)
- No sensitive data in logs (production)
- All fields properly typed

---

## 📞 Troubleshooting Contacts

| Issue | Location |
|-------|----------|
| Frontend bugs | Check `/pages/stock/add.js` |
| API errors | Check `/pages/api/stock-movement/stock-movement.js` |
| Database issues | Check MongoDB connection in `/lib/mongoose.js` |
| Auth issues | Check NextAuth config in `/pages/api/auth/[...nextauth].js` |

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** All fixes applied and tested
