# Promotion System - Quick Reference Card

## 🎯 At a Glance

| Feature | Details |
|---------|---------|
| **Purpose** | Target discounts by customer type with priority ordering |
| **Status** | ✅ Complete & Ready to Use |
| **Admin Page** | `http://localhost:3000/manage/promotions-management` |
| **API Base** | `/api/promotions` |

---

## 📋 Promotion Fields

### Required Fields
```
✓ name              string - Promotion name
✓ targetCustomerTypes array - Customer segments (REGULAR, VIP, NEW, INACTIVE, BULK_BUYER)
✓ discountValue     number - Amount or percentage to discount
✓ startDate         date   - When promotion starts
✓ endDate           date   - When promotion ends
```

### Optional Fields
```
○ description              string - Promotion details
○ discountType            string - "PERCENTAGE" or "FIXED" (default: PERCENTAGE)
○ applicationType         string - "ALL_PRODUCTS", "ONE_PRODUCT", or "CATEGORY"
○ products                array  - Product IDs (if ONE_PRODUCT)
○ categories              array  - Category IDs (if CATEGORY)
○ active                  bool   - Enable/disable (default: true)
○ displayAbovePrice       bool   - Show above price (default: true) [NEW]
○ priority                number - Sort order (0=highest) [NEW]
○ maxUses                 number - Usage limit (none if omitted)
```

---

## 🔧 Common Tasks

### Create Promotion
```bash
POST /api/promotions

Body:
{
  "name": "VIP Discount",
  "targetCustomerTypes": ["VIP"],
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "applicationType": "ALL_PRODUCTS",
  "startDate": "2026-01-10T00:00:00Z",
  "endDate": "2026-03-10T00:00:00Z",
  "active": true,
  "displayAbovePrice": true,
  "priority": 0
}
```

### Get All Promotions
```bash
GET /api/promotions

Response:
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

### Get Applicable Promotions
```bash
GET /api/promotions/applicable?customerType=VIP&productId=12345

OR

GET /api/promotions/applicable?customerType=VIP&categoryId=67890

Response:
[
  {
    "_id": "...",
    "name": "VIP Discount",
    "discountValue": 10,
    "discountType": "PERCENTAGE",
    "displayAbovePrice": true,
    "priority": 0,
    ...
  }
]
```

### Update Promotion
```bash
PUT /api/promotions/[promotionId]

Body: (any fields to update)
{
  "discountValue": 15,
  "priority": 1,
  "displayAbovePrice": false
}
```

### Delete Promotion
```bash
DELETE /api/promotions/[promotionId]
```

---

## 💡 Tips & Tricks

### Setting Priority
- **0** = VIP/Premium (highest priority)
- **1** = Seasonal/Special offers
- **2** = Loyalty programs
- **3** = Clearance/General sales
- **5+** = Low priority (silent discounts)

### Using displayAbovePrice
- **true** = Show badge above price (recommended)
- **false** = Apply silently (for surprise bonuses or back-end tracking)

### Customer Type Strategy
```
REGULAR      → No discount or small % (5-10%)
VIP          → Best discounts (10-20%)
NEW          → Welcome discount (5-15%) to build loyalty
INACTIVE     → Win-back discount (10-20%)
BULK_BUYER   → Volume discounts (3-5% per tier)
```

### Combining Types
Multiple customer types can qualify for same promotion:
```javascript
targetCustomerTypes: ["REGULAR", "NEW"] // Both get this discount
```

### Date Range Examples
```javascript
// Today only
startDate: new Date().toISOString()
endDate: new Date(Date.now() + 86400000).toISOString() // +1 day

// This month
startDate: "2026-01-01T00:00:00Z"
endDate: "2026-01-31T23:59:59Z"

// One week
startDate: new Date().toISOString()
endDate: new Date(Date.now() + 604800000).toISOString() // +7 days
```

---

## 🚀 POS Integration Quick Start

```javascript
// 1. Get customer and product info
const customer = getSelectedCustomer(); // Has customer.type
const product = getSelectedProduct();   // Has product._id

// 2. Query applicable promotions
const res = await fetch(
  `/api/promotions/applicable?customerType=${customer.type}&productId=${product._id}`
);
const promos = await res.json();

// 3. Sort by priority (lower = higher)
const sorted = promos.sort((a, b) => a.priority - b.priority);

// 4. Apply first valid promotion
if (sorted.length > 0) {
  const promo = sorted[0];
  
  // Calculate discount
  const discount = promo.discountType === "PERCENTAGE"
    ? (product.price * promo.discountValue) / 100
    : promo.discountValue;
  
  // Display if flagged
  if (promo.displayAbovePrice) {
    showPromoBadge(promo.name, discount);
  }
  
  // Calculate final price
  const finalPrice = product.price - discount;
  
  // Add to cart with promo tracking
  addToCart({
    ...product,
    unitPrice: finalPrice,
    appliedPromotion: promo._id
  });
}
```

---

## 📊 Priority Decision Tree

```
Multiple Promotions Apply?
│
├─ NO → Use the promotion
│
└─ YES
   │
   ├─ Sort by priority (ascending)
   │
   ├─ Filter by displayAbovePrice=true
   │
   ├─ Check customer qualifies
   │
   ├─ Verify not expired
   │
   └─ Check usage not exceeded
      │
      └─ Apply first matching promotion
```

---

## ✅ Validation Rules

### Field Validation
```javascript
// Name: Required, 1-200 chars
if (!name || name.length > 200) reject();

// Discount Value: Must be positive
if (discountValue <= 0) reject();

// For PERCENTAGE: 0-100%
if (discountType === "PERCENTAGE" && discountValue > 100) reject();

// Dates: End must be after start
if (new Date(startDate) >= new Date(endDate)) reject();

// Application Type: Must match scope
if (applicationType === "ONE_PRODUCT" && products.length === 0) reject();
if (applicationType === "CATEGORY" && categories.length === 0) reject();

// Customer Types: At least one required
if (!targetCustomerTypes || targetCustomerTypes.length === 0) reject();
```

---

## 🔍 Debugging Tips

### Check Console Logs
When promotions page loads, look for:
```
📦 Products loaded: 45
📂 Categories loaded: 12
```
If these don't appear or show 0:
- Products/categories not fetching
- Check API endpoints are working
- Verify MongoDB has data

### Test API Directly
```javascript
// In browser console
fetch('/api/promotions').then(r => r.json()).then(d => console.table(d.promotions))

fetch('/api/products').then(r => r.json()).then(d => console.log(d))

fetch('/api/categories').then(r => r.json()).then(d => console.table(d))
```

### Check Database
```bash
# In MongoDB
db.promotions.find().pretty()
db.customers.find({"type": "VIP"}).pretty()
```

---

## 📱 Common Use Cases

### Case 1: New Customer Welcome
```javascript
{
  name: "New Customer Welcome",
  targetCustomerTypes: ["NEW"],
  discountType: "PERCENTAGE",
  discountValue: 15,
  applicationType: "ALL_PRODUCTS",
  displayAbovePrice: true,
  priority: 0, // Highest
  startDate: new Date(),
  endDate: new Date(Date.now() + 30*24*60*60*1000) // 30 days
}
```

### Case 2: VIP Exclusive
```javascript
{
  name: "VIP Exclusive Access",
  targetCustomerTypes: ["VIP"],
  discountType: "PERCENTAGE",
  discountValue: 20,
  applicationType: "ONE_PRODUCT",
  products: ["ProductID1", "ProductID2"], // Premium items
  displayAbovePrice: true,
  priority: 0,
  startDate: new Date(),
  endDate: new Date(Date.now() + 90*24*60*60*1000) // 90 days
}
```

### Case 3: Bulk Buyer Volume Discount
```javascript
{
  name: "Bulk Buyer Volume Discount",
  targetCustomerTypes: ["BULK_BUYER"],
  discountType: "PERCENTAGE",
  discountValue: 5,
  applicationType: "CATEGORY",
  categories: ["WholesaleID"],
  displayAbovePrice: false, // Silent discount
  priority: 2, // Medium priority
  startDate: new Date(),
  endDate: new Date(Date.now() + 365*24*60*60*1000) // 1 year
}
```

### Case 4: Re-engagement Campaign
```javascript
{
  name: "Come Back Special",
  targetCustomerTypes: ["INACTIVE"],
  discountType: "FIXED",
  discountValue: 1000, // Fixed ₦1000
  applicationType: "ALL_PRODUCTS",
  displayAbovePrice: true,
  priority: 1, // High but not highest
  maxUses: 100, // Limited to 100 uses
  startDate: new Date(),
  endDate: new Date(Date.now() + 30*24*60*60*1000) // 30 days
}
```

---

## 🎓 Learning Path

**Beginner**: 
1. Read this quick reference
2. Create simple promotion (all products, one customer type)
3. Test via admin interface

**Intermediate**:
1. Create multi-product/category promotions
2. Set different priorities
3. Test displayAbovePrice toggle

**Advanced**:
1. Integrate with POS
2. Implement discount calculations
3. Track promotion effectiveness
4. Build campaign analytics

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| Form not submitting | Check all required fields filled |
| Products not showing | Open console, verify "📦 Products loaded" log |
| Promotions not applying | Verify customer type and date range |
| Wrong discount applied | Check priority sorting (0=highest) |
| Discount showing wrong | Verify discountType (PERCENTAGE vs FIXED) |

---

## 🎉 Summary

**Key Fields**:
- `displayAbovePrice`: Show/hide badge (true/false)
- `priority`: Sort order (0=highest)

**Process**:
1. Admin creates promotion in UI
2. API saves to MongoDB
3. POS queries by customer type
4. Sorts by priority, applies first match
5. Tracks usage after sale

**Status**: ✅ Ready to use!
