# ✨ NEW FEATURES - Indefinite Periods & Increments

## 🆕 Features Added (January 10, 2026)

### 1. Indefinite Promotion Periods
**What**: Promotions can now run indefinitely without an expiration date

**How to Use**:
- Open promotion form
- Check "♾️ Indefinite (Never Expires)" checkbox
- Start Date becomes required, End Date becomes optional
- End Date input is disabled when Indefinite is checked

**Benefits**:
- Create permanent discounts
- Loyalty programs that run year-round
- Default pricing adjustments
- No need to manually re-enable expired promotions

**When to Use**:
```
✓ Loyalty programs (always active)
✓ Employee discounts (ongoing)
✓ Permanent price reductions
✓ VIP standing discounts
✓ Wholesale pricing
```

**Database Storage**:
```javascript
{
  indefinite: true,      // Flag indicating indefinite period
  startDate: Date,       // When it starts
  endDate: null,         // Not used when indefinite
}
```

---

### 2. Price Increments (Markups)
**What**: Instead of just discounts, you can now increase prices with increments/markups

**How to Use**:
- Open promotion form
- See new "Price Adjustment Settings" section
- Toggle between:
  - 🔽 **Discount** - Reduce price (original behavior)
  - 🔼 **Increment** - Increase price (new feature)
- Select Type (Percentage or Fixed Amount)
- Enter Value
- Save promotion

**Examples**:

**Discount (Original)**:
```
Product: ₦5000
Discount: -10% or -500₦
Final Price: ₦4500
```

**Increment (New)**:
```
Product: ₦5000
Increment: +10% or +500₦
Final Price: ₦5500
```

**Use Cases for Increments**:
```
✓ Service charges (delivery, installation, setup)
✓ Premium options (express shipping, warranty)
✓ Bulk buyer surcharges (where applicable)
✓ Seasonal price increases
✓ Custom product pricing
✓ Rush order fees
```

**Database Storage**:
```javascript
{
  valueType: "DISCOUNT",    // "DISCOUNT" or "INCREMENT"
  discountType: "PERCENTAGE", // "PERCENTAGE" or "FIXED"
  discountValue: 10,         // Can be for either discount or increment
}
```

---

## 📊 Form UI Updates

### Price Adjustment Section
```
┌─────────────────────────────────────────────┐
│ Price Adjustment Settings                   │
├─────────────────────────────────────────────┤
│ ☑ 🔽 Discount (Reduce Price)               │
│ ☐ 🔼 Increment (Increase Price)            │
├─────────────────────────────────────────────┤
│ Type * │ Percentage (%)                    │
│ Value * │ 10 (Discount)                    │
│ Max Uses │ [leave blank for unlimited]     │
└─────────────────────────────────────────────┘
```

### Promotion Period Section
```
┌─────────────────────────────────────────────┐
│ Promotion Period *                          │
├─────────────────────────────────────────────┤
│ ☐ ♾️ Indefinite (Never Expires)            │
├─────────────────────────────────────────────┤
│ Start Date * │ 2026-01-10 [datetime]       │
│ End Date *   │ 2026-03-10 [datetime]       │
│              (Optional if Indefinite)      │
└─────────────────────────────────────────────┘
```

---

## 🎯 Promotion Card Display

### Discount Example
```
┌────────────────────────────────────┐
│ Winter Sale                  Active│
│ 10% off winter collection   -10%   │
│ 🔽 Discount                        │
├────────────────────────────────────┤
│ Types: REGULAR, VIP                │
│ Applies: ALL_PRODUCTS              │
│ Period: 1/10/2026 - ♾️ Never expires
│ Used: 0/Unlimited                  │
├────────────────────────────────────┤
│ ✓ Display Above Price              │
│ Priority: 0 | Max Uses: Unlimited  │
├────────────────────────────────────┤
│  [Edit]           [Delete]         │
└────────────────────────────────────┘
```

### Increment Example
```
┌────────────────────────────────────┐
│ Express Shipping              Active│
│ +₦500 for next-day delivery  +₦500 │
│ 🔼 Increment                       │
├────────────────────────────────────┤
│ Types: VIP, BULK_BUYER             │
│ Applies: ONE_PRODUCT               │
│ Period: 1/10/2026 - ♾️ Never expires
│ Used: 45/Unlimited                 │
├────────────────────────────────────┤
│ ✓ Display Above Price              │
│ Priority: 1 | Max Uses: Unlimited  │
├────────────────────────────────────┤
│  [Edit]           [Delete]         │
└────────────────────────────────────┘
```

---

## 🔧 API Changes

### POST /api/promotions

**New Fields in Request Body**:
```javascript
{
  name: "Express Shipping",
  // ... existing fields ...
  
  valueType: "INCREMENT",        // NEW - "DISCOUNT" or "INCREMENT"
  discountType: "FIXED",
  discountValue: 500,
  
  indefinite: true,              // NEW - Never expires
  startDate: "2026-01-10T00:00:00Z",
  endDate: null,                 // Ignored when indefinite=true
  
  // ... rest of fields ...
}
```

**Response Includes**:
```javascript
{
  success: true,
  promotion: {
    _id: "...",
    name: "Express Shipping",
    valueType: "INCREMENT",
    indefinite: true,
    startDate: "2026-01-10T00:00:00Z",
    endDate: null,
    // ... all other fields ...
  }
}
```

### PUT /api/promotions/[id]
Same request body format as POST for updates.

---

## 📝 Database Schema Updates

### New Fields in Promotion Model

```javascript
valueType: {
  type: String,
  enum: ["DISCOUNT", "INCREMENT"],
  default: "DISCOUNT",
}

indefinite: {
  type: Boolean,
  default: false,
}
```

### Updated Fields

```javascript
endDate: {
  type: Date,
  // Now optional (was required before)
}
```

### Example Document

```javascript
{
  _id: ObjectId(...),
  name: "VIP Loyalty Program",
  description: "Permanent VIP discount",
  targetCustomerTypes: ["VIP"],
  valueType: "DISCOUNT",        // NEW
  discountType: "PERCENTAGE",
  discountValue: 10,
  applicationType: "ALL_PRODUCTS",
  products: [],
  categories: [],
  startDate: ISODate("2026-01-10T00:00:00Z"),
  endDate: null,                 // null when indefinite
  indefinite: true,              // NEW
  active: true,
  displayAbovePrice: true,
  priority: 0,
  timesUsed: 0,
  maxUses: null,
  createdAt: ISODate(...),
  updatedAt: ISODate(...),
}
```

---

## 🚀 POS Integration Updates

### Calculate Price with Increments

```javascript
// Old way (discounts only)
if (promotion.discountType === "PERCENTAGE") {
  discount = (price * promotion.discountValue) / 100;
}
finalPrice = price - discount;

// NEW way (handles both)
let adjustment = 0;

if (promotion.discountType === "PERCENTAGE") {
  adjustment = (price * promotion.discountValue) / 100;
} else {
  adjustment = promotion.discountValue;
}

if (promotion.valueType === "DISCOUNT") {
  finalPrice = price - adjustment;
} else {
  finalPrice = price + adjustment;  // Increment adds to price
}
```

### Check if Promotion is Active

```javascript
// For indefinite promotions, no end date check needed
function isPromotionActive(promo) {
  const now = new Date();
  
  // Check start date
  if (new Date(promo.startDate) > now) {
    return false;
  }
  
  // Check end date only if not indefinite
  if (!promo.indefinite && new Date(promo.endDate) < now) {
    return false;
  }
  
  // Check active flag
  return promo.active === true;
}
```

### Display Promotion Information

```javascript
function formatPromotionDisplay(promo) {
  let displayText = "";
  
  if (promo.valueType === "DISCOUNT") {
    displayText = `${promo.discountValue}${promo.discountType === "PERCENTAGE" ? "%" : "₦"} OFF`;
  } else {
    displayText = `+${promo.discountValue}${promo.discountType === "PERCENTAGE" ? "%" : "₦"}`;
  }
  
  let periodText = "";
  if (promo.indefinite) {
    periodText = "♾️ Never expires";
  } else {
    periodText = `Until ${new Date(promo.endDate).toLocaleDateString()}`;
  }
  
  return {
    text: displayText,
    period: periodText,
    isDiscount: promo.valueType === "DISCOUNT",
    isIncrement: promo.valueType === "INCREMENT",
  };
}
```

---

## ✅ Testing Checklist

- [ ] Create promotion with indefinite period
- [ ] Verify "End Date" becomes optional when indefinite is checked
- [ ] Verify "End Date" input is disabled when indefinite is checked
- [ ] Edit indefinite promotion and verify period displays "Never expires"
- [ ] Create discount promotion (10% off)
- [ ] Create increment promotion (+500₦ fee)
- [ ] Verify promotion card shows 🔽 for discount, 🔼 for increment
- [ ] Verify card shows "-10%" for discount, "+500₦" for increment
- [ ] Edit promotion to change valueType from DISCOUNT to INCREMENT
- [ ] Verify changes save and display correctly
- [ ] Test with multiple promotions mixed (some indefinite, some not)

---

## 📚 Common Scenarios

### Scenario 1: Permanent VIP Discount
```
Name: VIP Loyalty Program
Customer Types: VIP
Value Type: DISCOUNT
Discount Type: PERCENTAGE
Value: 15
Application: ALL_PRODUCTS
Indefinite: ✓ YES
Active: ✓ YES

Result: VIP customers get permanent 15% off on everything
```

### Scenario 2: Express Shipping Fee
```
Name: Next-Day Shipping
Customer Types: All
Value Type: INCREMENT
Discount Type: FIXED
Value: 500 (₦500)
Application: ALL_PRODUCTS
Indefinite: ✓ YES
Max Uses: Unlimited

Result: Add ₦500 to all orders for next-day shipping
```

### Scenario 3: Seasonal Discount
```
Name: Summer Sale
Customer Types: REGULAR, NEW
Value Type: DISCOUNT
Discount Type: PERCENTAGE
Value: 20
Application: CATEGORY (Beach/Summer)
Indefinite: ☐ NO
Start Date: 2026-06-01
End Date: 2026-08-31

Result: 20% off summer items June-August
```

### Scenario 4: Bulk Buyer Premium Price
```
Name: Wholesale Premium Option
Customer Types: BULK_BUYER
Value Type: INCREMENT
Discount Type: PERCENTAGE
Value: 5
Application: ONE_PRODUCT (Premium service)
Indefinite: ✓ YES

Result: Bulk buyers pay +5% for premium service option
```

---

## 🎉 Summary

You now have:

✅ **Indefinite Promotions**
- Run forever without expiration
- Perfect for loyalty programs
- No manual re-enabling needed
- Clean, simple interface

✅ **Price Increments**
- Add charges/fees/markups
- Toggle between discount and increment
- Same percentage/fixed amount options
- Visual indicators (🔽 discount, 🔼 increment)

✅ **Backward Compatible**
- Existing promotions unaffected
- New fields default to reasonable values
- Old code still works
- Seamless migration

---

## 📞 Migration Notes

**For Existing Promotions**:
- All existing promotions default to: `valueType: "DISCOUNT"` and `indefinite: false`
- No action needed - they continue working as before
- Can edit them to use new features anytime

**For New Code**:
- Always check `valueType` field when calculating prices
- Always check `indefinite` field when checking expiration
- Use helper function: `isPromotionActive(promo)` (see above)

---

## 🔄 Related Features

These work well with:
- [displayAbovePrice](PROMOTION_DISPLAY_UPDATE.md) - Show increments prominently
- [priority](PROMOTION_DISPLAY_UPDATE.md) - Manage multiple increments
- Customer type targeting - Different fees for different customers
- Date range - Limited-time fees

**Example**: Fast shipping increment for BULK_BUYER with highest priority
