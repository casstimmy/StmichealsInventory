# Layout & Chart Color Consistency Audit & Standardization

## Executive Summary
Audit identified inconsistent layout structures and chart colors across 40+ pages. This document tracks the standardization effort.

---

## LAYOUT STANDARDIZATION

### Current State
- Most pages use: `<Layout>`, `<div className="min-h-screen bg-gray-50 p-6">`, `<div className="max-w-7xl mx-auto">`
- Standard pages: pos-tenders.js (✅ reference), reporting.js (✅ fixed)
- Some pages missing proper layout wrapper
- Padding varies: p-4, p-6, p-8 (should be p-6)
- Card styling mostly consistent: `bg-white rounded-lg shadow-lg p-6`

### Standard Layout Template (APPROVED)
```jsx
<Layout>
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Content */}
    </div>
  </div>
</Layout>
```

### Layout Changes Required
- Ensure all pages use Layout wrapper ✅
- Use bg-gray-50 for main background ✅
- Use max-w-7xl for content container ✅
- Use p-6 for padding (not p-4, p-8) ⏳
- Headers: Use h1/h3 with text-gray-900 ✅

---

## CHART COLOR STANDARDIZATION

### Current Inconsistencies Found

**Line Charts** (should be cyan-600):
- reporting.js line 190: `#0891B2` (cyan) ✅ GOOD
- reporting/index.js line 119: `#9333ea` (purple) ❌ WRONG
- sales-report/time-comparisons.js line 331: `#3b82f6` (blue) ❌ WRONG

**Bar Charts** (should be cyan-600):
- reporting.js line 390: `#0891B2` (cyan) ✅ GOOD
- sales-report/locations.js line 125: `#f97316` (orange) ❌ WRONG
- sales-report/categories.js line 410: `#dc2626` (red) ❌ WRONG

**Pie/Doughnut Charts** (should use standard palette):
- sales-report/products.js: `[#ec4899, #f43f5e, #f97316, #f59e0b, #eab308, ...]` (mixed)
- sales-report/locations.js: `[#ea580c, #f97316, #fb923c, ...]` (orange shades)
- sales-report/categories.js: `[#dc2626, #f43f5e, #f97316, #fbbf24, #10b981, #0ea5e9]` ✅ Good variety

**Secondary Colors** (transactions line in multi-series):
- reporting.js line 203: `#F97316` (orange) ✅ GOOD

### Standard Chart Color Palette (APPROVED)

**Primary Line Color**: `#06B6D4` (cyan-600)
- Used for main metrics, sales trends
- HEX: #06B6D4 or #0891B2 (similar cyan)

**Secondary Line Color**: `#F97316` (orange-500)
- Used for transactions, secondary metrics

**Bar Chart Default**: `#06B6D4` (cyan-600)
- All single-series bar charts use cyan

**Multi-Series Colors** (for pie, doughnut, multi-bar):
```
[
  "#3b82f6",  // Blue
  "#10b981",  // Green
  "#f59e0b",  // Amber
  "#ef4444",  // Red
  "#8b5cf6",  // Purple
  "#06b6d4",  // Cyan
  "#ec4899",  // Pink
  "#f97316",  // Orange
]
```

---

## FILES TO UPDATE

### Priority 1: Chart Colors (15 files)
- [ ] pages/reporting/index.js - Fix line chart color (#9333ea → #06B6D4)
- [ ] pages/reporting/sales-report/time-comparisons.js - Fix colors
- [ ] pages/reporting/sales-report/locations.js - Fix bar chart color
- [ ] pages/reporting/sales-report/categories.js - Fix bar chart color
- [ ] pages/reporting/sales-report/products.js - Fix color palette
- [ ] pages/reporting/sales-report/employees.js
- [ ] pages/reporting/sales-report/time-intervals.js
- [ ] pages/reporting/sales-report/held-transactions.js
- [ ] pages/reporting/transaction-report/index.js
- [ ] pages/reporting/transaction-report/completed-transactions.js
- [ ] pages/reporting/completed-Transaction.js
- [ ] pages/expenses/analysis.js
- [ ] pages/expenses/tax-analysis.js
- [ ] pages/expenses/tax-personal.js
- [ ] pages/index.js

### Priority 2: Layout Consistency (5 files)
- [ ] pages/index.js - Check/fix layout
- [ ] pages/manage/* - Check/fix layouts
- [ ] pages/products/new.js - Check/fix layout
- [ ] pages/expenses/* - Check/fix layouts

---

## Status Tracking
- [ ] All chart colors standardized
- [ ] All layouts standardized
- [ ] No compilation errors
- [ ] All pages render correctly
