# Promotion System - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INVENTORY ADMIN APP                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐                  ┌──────────────────────┐ │
│  │  ADMIN INTERFACE     │                  │  CUSTOMER SEGMENT    │ │
│  ├──────────────────────┤                  ├──────────────────────┤ │
│  │ Promotions Mgmt      │                  │ • REGULAR            │ │
│  │ Page                 │                  │ • VIP                │ │
│  │                      │                  │ • NEW                │ │
│  │ • Create/Edit/Delete │                  │ • INACTIVE           │ │
│  │ • Set Targeting      │                  │ • BULK_BUYER         │ │
│  │ • Display Settings   │                  └──────────────────────┘ │
│  │ • Priority Config    │                                            │
│  └──────────┬───────────┘                                            │
│             │                                                        │
│             │ Submits form data                                     │
│             ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         PROMOTION API ENDPOINTS                             │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ POST /api/promotions (Create)                               │  │
│  │ PUT /api/promotions/[id] (Update)                           │  │
│  │ DELETE /api/promotions/[id] (Delete)                        │  │
│  │ GET /api/promotions (List all)                              │  │
│  │ GET /api/promotions/applicable (Query by type/product)      │  │
│  └──────────┬──────────────────────────────────────────────────┘  │
│             │                                                       │
│             │ CRUD Operations                                      │
│             ▼                                                       │
│  ┌────────────────────────────┐                                    │
│  │   MONGODB COLLECTION       │                                    │
│  ├────────────────────────────┤                                    │
│  │ Promotion Schema:          │                                    │
│  │                            │                                    │
│  │ {                          │                                    │
│  │   _id: ObjectId            │                                    │
│  │   name: string             │                                    │
│  │   description: string      │                                    │
│  │   targetCustomerTypes: []  │                                    │
│  │   discountType: string     │                                    │
│  │   discountValue: number    │                                    │
│  │   applicationType: string  │                                    │
│  │   products: [ObjectId]     │                                    │
│  │   categories: [ObjectId]   │                                    │
│  │   startDate: Date          │                                    │
│  │   endDate: Date            │                                    │
│  │   active: boolean          │                                    │
│  │   displayAbovePrice: bool  │ NEW                               │
│  │   priority: number         │ NEW                               │
│  │   timesUsed: number        │                                    │
│  │   maxUses: number          │                                    │
│  │   createdAt: Date          │                                    │
│  │   updatedAt: Date          │                                    │
│  │ }                          │                                    │
│  └────────────────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## POS System Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           POS CHECKOUT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Customer Selection                                              │
│     ┌──────────────────────┐                                        │
│     │ Customer Details     │                                        │
│     │ ID: 12345            │                                        │
│     │ Type: VIP            │ ◄─────── Get from Customer DB          │
│     └──────────────────────┘                                        │
│                                                                      │
│  2. Product Selection                                               │
│     ┌──────────────────────┐                                        │
│     │ Product Details      │                                        │
│     │ ID: 67890            │                                        │
│     │ Price: ₦5000         │ ◄─────── Get from Product DB           │
│     │ Category: Electronics│                                        │
│     └──────────────────────┘                                        │
│                                                                      │
│  3. Query Applicable Promotions                                     │
│     │                                                               │
│     ├─► GET /api/promotions/applicable                             │
│     │   ?customerType=VIP&productId=67890                          │
│     │                                                               │
│     └─► Returns:                                                    │
│         [                                                           │
│           {                                                         │
│             name: "VIP Discount",                                  │
│             discountValue: 10,                                     │
│             discountType: "PERCENTAGE",                            │
│             priority: 0,                    ◄─ NEW FIELD           │
│             displayAbovePrice: true,        ◄─ NEW FIELD           │
│           },                                                        │
│           {                                                         │
│             name: "Holiday Sale",                                  │
│             discountValue: 15,                                     │
│             discountType: "PERCENTAGE",                            │
│             priority: 1,                                           │
│             displayAbovePrice: true,                               │
│           },                                                        │
│         ]                                                           │
│                                                                      │
│  4. Process Promotions by Priority                                  │
│     │                                                               │
│     ├─► Sort by priority: 0 (VIP) comes before 1 (Holiday)        │
│     │                                                               │
│     ├─► Filter displayAbovePrice = true                            │
│     │   (Both qualify, will show VIP since priority 0)             │
│     │                                                               │
│     └─► Apply first applicable promotion                           │
│                                                                      │
│  5. Display in POS                                                  │
│     ┌────────────────────────────────────────────┐                │
│     │ Product: Samsung TV                        │                │
│     │ ┌──────────────────────────────────────┐  │                │
│     │ │ 🎁 VIP DISCOUNT - 10% OFF            │  │ ◄─ BADGE      │
│     │ └──────────────────────────────────────┘  │                │
│     │                                            │                │
│     │ Original Price:  ₦5000 ~~~~~~~~~~          │                │
│     │ Final Price:     ₦4500 ✓                   │                │
│     │ Savings:        -₦500                      │                │
│     │                                            │                │
│     │ Priority Applied: VIP (0)                  │                │
│     └────────────────────────────────────────────┘                │
│                                                                      │
│  6. Add to Cart & Process Payment                                   │
│     ┌──────────────────────┐                                       │
│     │ Cart Item            │                                       │
│     │ Product: TV          │                                       │
│     │ Unit Price: ₦4500    │ ◄─ After Discount                    │
│     │ Quantity: 1          │                                       │
│     │ Discount Applied: VIP│ ◄─ Track which promotion              │
│     │ Total: ₦4500         │                                       │
│     └──────────────────────┘                                       │
│                                                                      │
│  7. Record Promotion Usage (After Payment)                          │
│     │                                                               │
│     └─► PUT /api/promotions/[promotionId]                         │
│         { timesUsed: currentValue + 1 }                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Promotion Priority & Display Logic

```
┌──────────────────────────────────────────────────────────────┐
│  MULTIPLE PROMOTIONS APPLY TO SAME PRODUCT                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Available Promotions:                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. VIP Discount        - Priority: 0  - Display: true  │ │
│  │ 2. Loyalty Program     - Priority: 2  - Display: true  │ │
│  │ 3. Clearance Sale      - Priority: 1  - Display: true  │ │
│  │ 4. Staff Discount      - Priority: 5  - Display: false │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 1: Sort by Priority (ascending)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. VIP Discount        - Priority: 0  [HIGHEST]        │ │
│  │ 2. Clearance Sale      - Priority: 1                   │ │
│  │ 3. Loyalty Program     - Priority: 2                   │ │
│  │ 4. Staff Discount      - Priority: 5  [LOWEST]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 2: Filter by displayAbovePrice = true                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. VIP Discount        - Display: true   [SHOW]        │ │
│  │ 2. Clearance Sale      - Display: true   [SHOW]        │ │
│  │ 3. Loyalty Program     - Display: true   [SHOW]        │ │
│  │ 4. Staff Discount      - Display: false  [HIDE]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 3: Apply First Valid Promotion                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✓ VIP Discount (10%) - Applied at Priority 0          │ │
│  │                                                         │ │
│  │ Original: ₦5000                                         │ │
│  │ After VIP Discount: ₦4500                              │ │
│  │                                                         │ │
│  │ (Clearance Sale would give better discount but VIP    │ │
│  │  takes precedence due to priority 0 < 1)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 4: Display to Customer                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ╔══════════════════════════════════════════════════╗  │ │
│  │ ║ Product: Samsung 65\" TV                           ║  │ │
│  │ ║ 🎁 VIP DISCOUNT - 10% OFF                         ║  │ │
│  │ ║                                                  ║  │ │
│  │ ║ Was: ₦5000                                        ║  │ │
│  │ ║ Now: ₦4500 (Save ₦500)                           ║  │ │
│  │ ╚══════════════════════════════════════════════════╝  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Notes:                                                      │
│  • Only ONE promotion applies per product                   │
│  • Highest priority (lowest number) wins                    │
│  • displayAbovePrice controls visibility                    │
│  • Staff Discount hidden but could be applied if enabled    │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow - Create Promotion

```
Admin Form Input
       │
       ▼
┌─────────────────────────────────┐
│  Form Data (promotions-         │
│  management.js)                 │
│                                 │
│  {                              │
│    name: "VIP Discount",        │
│    description: "10% off",      │
│    targetCustomerTypes: ["VIP"],│
│    discountType: "PERCENTAGE",  │
│    discountValue: 10,           │
│    applicationType: "ALL_PRODUCTS",
│    startDate: "2026-01-10",     │
│    endDate: "2026-03-10",       │
│    active: true,                │
│    displayAbovePrice: true,     │
│    priority: 0,                 │
│    maxUses: 1000,               │
│  }                              │
└────────────┬────────────────────┘
             │
             │ POST /api/promotions
             ▼
┌─────────────────────────────────┐
│  API Handler                    │
│  (pages/api/promotions/         │
│   index.js)                     │
│                                 │
│  1. Validate data               │
│  2. Create Promotion.create()   │
│  3. Save to MongoDB             │
└────────────┬────────────────────┘
             │
             │ Success Response
             ▼
┌─────────────────────────────────┐
│  MongoDB Document               │
│                                 │
│  _id: ObjectId(...)             │
│  name: "VIP Discount",          │
│  description: "10% off",        │
│  targetCustomerTypes: ["VIP"],  │
│  discountType: "PERCENTAGE",    │
│  discountValue: 10,             │
│  applicationType: "ALL_PRODUCTS",
│  startDate: 2026-01-10T00:00:00Z
│  endDate: 2026-03-10T00:00:00Z  │
│  active: true,                  │
│  displayAbovePrice: true,       │
│  priority: 0,                   │
│  timesUsed: 0,                  │
│  maxUses: 1000,                 │
│  createdAt: 2026-01-10T10:30:00 │
│  updatedAt: 2026-01-10T10:30:00 │
└────────────┬────────────────────┘
             │
             │ Fetch latest promotions
             ▼
┌─────────────────────────────────┐
│  Admin UI Update                │
│  (Show in promotions list)       │
│                                 │
│  ✓ Promotion Card displays:     │
│    - Name & Description         │
│    - Discount (10%)             │
│    - Customer Types (VIP)       │
│    - Application Type           │
│    - Display Settings           │
│      Display Above: ✓ Yes       │
│      Priority: 0                │
│    - Edit/Delete Buttons        │
└─────────────────────────────────┘
```

## File Organization

```
inventory-admin-app/
├── models/
│   ├── Promotion.js          ◄── Schema with new fields
│   ├── Customer.js
│   ├── Product.js
│   └── Category.js
│
├── pages/
│   ├── api/
│   │   └── promotions/
│   │       ├── index.js      ◄── GET/POST (create)
│   │       ├── [id].js       ◄── PUT/DELETE (update)
│   │       └── applicable.js ◄── GET (query)
│   │
│   └── manage/
│       └── promotions-management.js  ◄── Admin UI
│
└── documentation/
    ├── PROMOTION_SYSTEM_COMPLETE.md
    ├── PROMOTION_DISPLAY_UPDATE.md
    ├── PROMOTION_TESTING_GUIDE.md
    ├── PROMOTION_POS_INTEGRATION.md
    └── PROMOTION_SYSTEM_ARCHITECTURE.md (THIS FILE)
```

---

## Key Concepts Summary

### displayAbovePrice
- **What**: Boolean flag controlling visibility in POS
- **Default**: true (show the promotion)
- **When true**: Promotion badge appears above product price
- **When false**: Discount applies silently in backend
- **Use case**: Hide sensitive discounts while still applying them

### priority
- **What**: Number field for sorting multiple promotions
- **Default**: 0 (highest priority)
- **Lower = Higher Priority**: 0 beats 1, 1 beats 2, etc.
- **When multiple apply**: Use priority to choose which displays
- **Use case**: VIP discount (0) > Loyalty (1) > Seasonal (2)

### applicationType
- **ONE_PRODUCT**: Applies to specific product(s)
- **ALL_PRODUCTS**: Applies to all products in store
- **CATEGORY**: Applies to specific category/categories

### targetCustomerTypes
Filters promotion to specific customer segments:
- **REGULAR**: Standard customers
- **VIP**: Premium/loyal customers
- **NEW**: New customers (incentivize first purchase)
- **INACTIVE**: Lapsed customers (re-engagement)
- **BULK_BUYER**: Wholesale/large orders

---

This architecture allows for:
✓ Targeted promotions by customer type
✓ Flexible product/category targeting
✓ Priority-based conflict resolution
✓ Visibility control via displayAbovePrice
✓ Usage tracking for analytics
✓ Easy POS integration
