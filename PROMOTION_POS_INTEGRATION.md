# POS Integration - Applying Promotions with Priority & Display

## Overview
This guide shows how to integrate the new promotion system (with display settings and priority) into your POS sales interface.

## Key Concepts

### displayAbovePrice
- **Purpose**: Controls whether the promotion badge/label appears ABOVE the product's regular price
- **Value**: Boolean (true/false)
- **Default**: true (show promotion)
- **Use Case**: When true, show the discount prominently; when false, apply silently in backend

### priority
- **Purpose**: Determines which promotion displays/applies when multiple apply to same product
- **Value**: Number (0 = highest priority, higher numbers = lower priority)
- **Default**: 0
- **Use Case**: If VIP discount (priority 0) and seasonal sale (priority 1) both apply, VIP shows first

## Implementation Example

### 1. Fetch Applicable Promotions

```javascript
// At POS checkout, when user selects product and customer

async function getApplicablePromotions(customerId, productId) {
  try {
    // Get customer type from database
    const customerRes = await fetch(`/api/customers/${customerId}`);
    const customer = await customerRes.json();
    
    // Get applicable promotions
    const promoRes = await fetch(
      `/api/promotions/applicable?` +
      `customerType=${customer.type}&productId=${productId}`
    );
    
    const promotions = await promoRes.json();
    return promotions; // Returns array of applicable promotions
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return [];
  }
}
```

### 2. Sort and Filter by Priority

```javascript
// Sort promotions by priority (lower = higher priority)
// Filter by displayAbovePrice setting

function getSortedPromotions(promotions, displayMode = 'visible') {
  // Sort by priority (ascending - lower number = higher priority)
  const sorted = [...promotions].sort((a, b) => 
    (a.priority || 0) - (b.priority || 0)
  );
  
  if (displayMode === 'visible') {
    // Only return promotions marked to display above price
    return sorted.filter(p => p.displayAbovePrice !== false);
  }
  
  return sorted; // Return all promotions
}
```

### 3. Display Promotion in POS

```javascript
// In your POS product card component

function ProductWithPromotion({ product, promotion }) {
  if (!promotion) {
    return (
      <div className="product-card">
        <h3>{product.name}</h3>
        <div className="text-2xl font-bold">₦{product.price}</div>
      </div>
    );
  }

  const discountAmount = promotion.discountType === "PERCENTAGE"
    ? (product.price * promotion.discountValue) / 100
    : promotion.discountValue;
  
  const finalPrice = product.price - discountAmount;

  return (
    <div className="product-card border-2 border-cyan-500">
      <h3>{product.name}</h3>
      
      {/* Promotion Badge - Displayed Above Price */}
      <div className="bg-cyan-500 text-white px-3 py-1 rounded mb-2 inline-block">
        <span className="font-bold">
          {promotion.discountType === "PERCENTAGE" 
            ? `${promotion.discountValue}% OFF` 
            : `₦${promotion.discountValue} OFF`}
        </span>
        <span className="text-xs ml-2">({promotion.name})</span>
      </div>

      {/* Original Price - Strikethrough */}
      <div className="text-gray-500 line-through mb-2">
        ₦{product.price}
      </div>

      {/* Final Price - Highlighted */}
      <div className="text-3xl font-bold text-green-600">
        ₦{finalPrice.toFixed(2)}
      </div>

      {/* Priority Info (Admin use) */}
      <div className="text-xs text-gray-400 mt-2">
        Priority: {promotion.priority || 0}
      </div>
    </div>
  );
}
```

### 4. Apply Discount to Cart Item

```javascript
// In checkout/cart processing

async function addToCart(product, customer, quantity = 1) {
  // Fetch promotions for this product and customer
  const promotions = await getApplicablePromotions(customer._id, product._id);
  
  // Get highest priority promotion to apply
  const sorted = getSortedPromotions(promotions, 'all');
  const activePromotion = sorted.length > 0 ? sorted[0] : null;
  
  // Calculate price
  let unitPrice = product.price;
  let discountApplied = null;

  if (activePromotion) {
    const discountAmount = activePromotion.discountType === "PERCENTAGE"
      ? (product.price * activePromotion.discountValue) / 100
      : activePromotion.discountValue;
    
    unitPrice = Math.max(0, product.price - discountAmount);
    discountApplied = {
      promotionId: activePromotion._id,
      promotionName: activePromotion.name,
      discountAmount,
      discountPercentage: activePromotion.discountType === "PERCENTAGE" 
        ? activePromotion.discountValue 
        : null,
    };
  }

  // Add to cart
  const cartItem = {
    productId: product._id,
    productName: product.name,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    discount: discountApplied,
  };

  return cartItem;
}
```

### 5. Display Cart with Promotions

```javascript
// Cart summary with applied promotions

function CartSummary({ items }) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDiscounts = items.reduce((sum, item) => {
    return sum + (item.discount?.discountAmount || 0) * item.quantity;
  }, 0);
  const total = subtotal + totalDiscounts; // Already included in totalPrice

  return (
    <div className="cart-summary border rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">Cart Summary</h3>
      
      {/* Items */}
      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <div>
              <div>{item.productName} x{item.quantity}</div>
              {item.discount && (
                <div className="text-cyan-600 text-xs">
                  ✓ {item.discount.promotionName}
                  {item.discount.discountPercentage && ` (${item.discount.discountPercentage}%)`}
                </div>
              )}
            </div>
            <div>₦{item.totalPrice.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal (before discount):</span>
          <span>₦{(subtotal + totalDiscounts).toFixed(2)}</span>
        </div>
        
        {totalDiscounts > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Total Discounts:</span>
            <span>-₦{totalDiscounts.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total:</span>
          <span>₦{subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
```

### 6. Update Promotion Usage After Sale

```javascript
// After successful payment/transaction

async function recordPromotionUsage(promotionIds) {
  try {
    // Increment timesUsed counter for each promotion
    for (const promoId of promotionIds) {
      await fetch(`/api/promotions/${promoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timesUsed: { $inc: 1 }, // Increment by 1
        }),
      });
    }
  } catch (error) {
    console.error('Failed to record promotion usage:', error);
  }
}
```

## Advanced: Category-Based Promotions

### Show All Promotions for Product Category

```javascript
async function getPromotionsForCategory(customerId, categoryId) {
  try {
    const customerRes = await fetch(`/api/customers/${customerId}`);
    const customer = await customerRes.json();
    
    // Get category promotions
    const promoRes = await fetch(
      `/api/promotions/applicable?` +
      `customerType=${customer.type}&categoryId=${categoryId}`
    );
    
    const promotions = await promoRes.json();
    return getSortedPromotions(promotions);
  } catch (error) {
    console.error('Failed to fetch category promotions:', error);
    return [];
  }
}

// Use in product list
function CategoryProductList({ category, customer }) {
  const [categoryPromos, setCategoryPromos] = useState([]);

  useEffect(() => {
    getPromotionsForCategory(customer._id, category._id)
      .then(setCategoryPromos);
  }, [customer._id, category._id]);

  return (
    <div>
      {/* Show category-level promotion if available */}
      {categoryPromos.length > 0 && categoryPromos[0].displayAbovePrice && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
          <strong className="text-blue-900">
            {categoryPromos[0].name}: {categoryPromos[0].discountValue}
            {categoryPromos[0].discountType === "PERCENTAGE" ? "% OFF" : "₦ OFF"}
          </strong>
          <p className="text-sm text-blue-800">{categoryPromos[0].description}</p>
        </div>
      )}

      {/* Products in category */}
      <div className="grid grid-cols-2 gap-4">
        {/* Product list */}
      </div>
    </div>
  );
}
```

## Database Notes

The promotion system stores the following key fields:

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  targetCustomerTypes: ["VIP", "REGULAR", ...],
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: Number,
  applicationType: "ONE_PRODUCT" | "ALL_PRODUCTS" | "CATEGORY",
  products: [ObjectId], // For ONE_PRODUCT
  categories: [ObjectId], // For CATEGORY
  startDate: Date,
  endDate: Date,
  active: Boolean,
  displayAbovePrice: Boolean, // NEW - Show above price
  priority: Number, // NEW - Sort order (0 = highest)
  timesUsed: Number,
  maxUses: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

## Performance Optimization

### Cache Promotions
```javascript
// Cache active promotions to reduce API calls
let promotionCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getPromotions() {
  const now = Date.now();
  
  if (promotionCache && (now - cacheTime) < CACHE_DURATION) {
    return promotionCache;
  }

  const res = await fetch('/api/promotions');
  const data = await res.json();
  
  promotionCache = data.promotions.filter(p => p.active);
  cacheTime = now;
  
  return promotionCache;
}
```

## Summary

The promotion system provides:
- ✅ Customer type targeting
- ✅ Flexible scope (product/category/all)
- ✅ Priority-based application
- ✅ Display control (show above price or not)
- ✅ Usage tracking
- ✅ Date-based activation

Use priority and displayAbovePrice to create a smooth UX where the most important promotions are highlighted first.
