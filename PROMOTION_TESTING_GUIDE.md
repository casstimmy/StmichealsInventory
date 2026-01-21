# Promotion System - Quick Test Guide

## Step 1: Test Data Fetching
1. Open your app: http://localhost:3000
2. Navigate to **Manage → Customer Promotions**
3. Open browser Developer Console (Press F12)
4. Look for these console logs:
   - ✓ `📦 Products loaded: X` (should show a number > 0)
   - ✓ `📂 Categories loaded: X` (should show a number > 0)

**If you see 0 or errors:**
- Check Network tab to see actual API responses
- Verify products and categories exist in your database

---

## Step 2: Test Form Display
1. Click **"+ Create Promotion"** button
2. Verify the form shows these sections:
   - Basic Information (Name, Description)
   - Customer Type Targeting (checkboxes for REGULAR, VIP, NEW, INACTIVE, BULK_BUYER)
   - Discount Settings (Type and Value)
   - Application Type (One Product, All Products, Category)
   - Product/Category Selection (should be populated with fetched data)
   - Promotion Period (Start and End dates)
   - **Display Settings** (NEW - should show: "Show Promotion Above Price" checkbox and "Priority Level" number input)
   - Active Status
   - Submit/Cancel buttons

---

## Step 3: Test Promotion Creation
1. Fill in the form:
   - **Name**: "VIP Summer Sale"
   - **Description**: "10% discount for VIP customers"
   - **Customer Type**: Check "VIP"
   - **Discount Type**: PERCENTAGE
   - **Discount Value**: 10
   - **Application Type**: ALL_PRODUCTS
   - **Start Date**: Today
   - **End Date**: 30 days from today
   - **Display Above Price**: ✓ (checked)
   - **Priority Level**: 0
   - **Active**: ✓ (checked)

2. Click **"Create Promotion"**
3. Verify success message appears

---

## Step 4: Verify Promotion Display
1. Scroll down to see the promotion in the list
2. Verify the card shows:
   - Promotion name and description
   - Discount percentage/amount
   - Active status badge
   - Customer types (VIP)
   - Application type (ALL_PRODUCTS)
   - Period dates
   - **NEW Display Settings Box** (cyan background) showing:
     - "Display Above Price: ✓ Yes"
     - "Priority Level: 0"
     - "Max Uses: Unlimited"

---

## Step 5: Test Promotion Editing
1. Click **"Edit"** on the promotion
2. Verify form pre-populates with all data including:
   - Display Above Price checkbox state
   - Priority Level value
3. Change Priority Level to 5
4. Uncheck "Display Above Price"
5. Click **"Update Promotion"**
6. Verify changes appear in the card

---

## Step 6: Test Form Reset
1. Click **"+ Create Promotion"** again
2. Verify Display Settings reset to:
   - Display Above Price: ✓ (checked)
   - Priority Level: 0

---

## Troubleshooting

### Products/Categories Not Showing
**Console Check**:
```javascript
// In browser console, run:
fetch('/api/products').then(r => r.json()).then(d => console.log(d))
fetch('/api/categories').then(r => r.json()).then(d => console.log(d))
```

**Expected Output**:
- Products: `{ success: true, data: [...] }`
- Categories: `[...]` (array)

### Form Fields Missing
- Clear browser cache (Ctrl+Shift+Del)
- Refresh page
- Check browser console for JavaScript errors

### Promotion Not Saving
- Check browser Network tab for API errors
- Verify all required fields are filled
- Check MongoDB connection is working

---

## Expected Behavior Summary

| Feature | Expected Result |
|---------|-----------------|
| Products Load | "📦 Products loaded: X" in console |
| Categories Load | "📂 Categories loaded: X" in console |
| Form Display | All sections visible including Display Settings |
| Create Promotion | Success message, card appears in list |
| Edit Promotion | Form pre-fills, changes save |
| Display Settings | Checkbox and number input work correctly |
| Form Reset | Displays defaults (checked=true, priority=0) |

---

## Notes
- Display Above Price: Controls if promotion shows above product price in POS
- Priority Level: Lower numbers = higher priority (0 = shows first)
- These settings are optional but recommended for good UX
