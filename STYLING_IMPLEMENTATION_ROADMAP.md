# Styling System - Implementation Roadmap

## Overview
This document provides specific recommendations for updating existing pages to use the new consistent styling system.

---

## Priority Pages for Update

### Priority 1: Stock Management Pages (High Impact)
- `/pages/stock/add.js` - Stock movement form
- `/pages/stock/management.js` - Stock dashboard
- `/pages/stock/movement/[id].js` - Stock detail view

**Changes needed:**
1. Replace custom button styles with Button component
2. Replace custom input styling with Input component
3. Use Card component for form sections
4. Use Table component for product tables
5. Use StatCard for dashboard metrics

---

### Priority 2: Core Layout & Navigation
- `/components/Layout.js` - Main layout wrapper
- `/components/Nav.js` - Navigation sidebar
- `/components/NavBar.js` - Top navigation bar

**Changes needed:**
1. Standardize header and footer styling
2. Use consistent color scheme (primary/secondary)
3. Standardize spacing and padding
4. Update hover states and transitions

---

### Priority 3: Forms & Modals
- `/components/ProductForm.js` - Product form
- `/components/ExpenseForm.js` - Expense form
- `/components/HeroSetup.js` - Hero setup form

**Changes needed:**
1. Use Input component for all form fields
2. Use Select component for dropdowns
3. Use Button component for form actions
4. Use Card component for form container
5. Add consistent validation styling

---

### Priority 4: Other Pages
- Product management pages
- Expense pages
- Reports pages
- Settings pages

**Standard changes:**
1. Use PageHeader for page titles
2. Use Section/SectionTitle for content sections
3. Use consistent card styling
4. Use theme colors throughout

---

## Step-by-Step Update Guide

### Step 1: Import UI Components
```javascript
// At the top of your file, add:
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardFooter,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Alert,
  StatCard,
  PageHeader,
  Section,
  SectionTitle,
  Loader,
} from "@/components/ui";
```

### Step 2: Replace Custom Buttons
```javascript
// BEFORE
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Save
</button>

// AFTER
<Button variant="primary">Save</Button>
```

### Step 3: Replace Custom Inputs
```javascript
// BEFORE
<input
  className="border px-4 py-2 rounded"
  placeholder="Enter name"
/>

// AFTER
<Input label="Name" placeholder="Enter name" />
```

### Step 4: Replace Custom Forms
```javascript
// BEFORE
<div className="p-4 border rounded bg-white">
  <h3 className="text-lg font-bold mb-4">Form Title</h3>
  {/* form fields */}
  <div className="flex gap-2 mt-4">
    <button>Cancel</button>
    <button>Save</button>
  </div>
</div>

// AFTER
<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">Form Title</h3>
  </CardHeader>
  {/* form fields */}
  <CardFooter>
    <div className="flex gap-4 justify-end">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  </CardFooter>
</Card>
```

### Step 5: Replace Custom Tables
```javascript
// BEFORE
<table className="w-full border">
  <thead className="bg-gray-100">
    <tr>
      <th className="p-2">Column 1</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="p-2">Data</td>
    </tr>
  </tbody>
</table>

// AFTER
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Column 1</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Step 6: Update Page Structure
```javascript
// BEFORE
<div className="p-8">
  <h1 className="text-3xl font-bold mb-4">Page Title</h1>
  <p className="text-gray-600 mb-8">Description</p>
  
  <div className="mb-10">
    <h2 className="text-2xl font-semibold mb-4">Section 1</h2>
    {/* content */}
  </div>
</div>

// AFTER
<div className="min-h-screen bg-gray-50 p-8">
  <PageHeader 
    title="Page Title"
    description="Description"
  />
  
  <Section>
    <SectionTitle>Section 1</SectionTitle>
    {/* content */}
  </Section>
</div>
```

---

## Color Scheme Standardization

### Current Inconsistencies
- Some pages use `bg-blue-600`, others use `bg-sky-500`
- Some use `text-gray-700`, others use `text-gray-600`
- Border colors vary across pages
- Focus states are inconsistent

### Solution
Replace all custom color combinations with theme colors:

**Buttons:**
```javascript
// Primary actions
<Button variant="primary">  // bg-blue-600

// Secondary actions
<Button variant="secondary">  // bg-sky-500

// Positive/Confirmations
<Button variant="success">  // bg-green-600

// Destructive
<Button variant="danger">  // bg-red-600

// Alternatives
<Button variant="outline">  // border + text
```

**Text Colors:**
```
// Headings
text-gray-900

// Body text
text-gray-700

// Secondary/muted
text-gray-600 or text-gray-500

// Links
text-blue-600 hover:text-blue-700
```

**Backgrounds:**
```
// Page background
bg-gray-50

// Cards/content
bg-white

// Hover states
hover:bg-gray-50

// Alerts
success:  bg-green-50
warning:  bg-yellow-50
danger:   bg-red-50
info:     bg-blue-50
```

---

## Spacing Standardization

### Current Issues
- Padding: `p-4`, `p-6`, `p-8` (inconsistent)
- Margins: various `m-x` values (inconsistent)
- Gaps: `gap-2`, `gap-4`, `gap-6` (inconsistent)

### Standard Values
```javascript
// Page/container: p-8 (2rem)
<div className="p-8">

// Cards: p-6 (1.5rem)
<div className="p-6">

// Small sections: p-4 (1rem)
<div className="p-4">

// Margins between sections: mb-10 (2.5rem)
<div className="mb-10">

// Element spacing: gap-4 (1rem)
<div className="gap-4">

// Tight spacing: gap-2 (0.5rem)
<div className="gap-2">
```

---

## Typography Standardization

### Page Titles
```javascript
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>

// Or use component:
<PageHeader title="Page Title" description="Optional description" />
```

### Section Titles
```javascript
<h2 className="text-2xl font-semibold text-gray-900">Section Title</h2>

// Or use component:
<SectionTitle>Section Title</SectionTitle>
```

### Body Text
```javascript
<p className="text-base text-gray-700">Regular paragraph</p>
```

### Labels
```javascript
<label className="block text-sm font-medium text-gray-700">Label Text</label>
```

---

## Responsive Design Updates

### Add Mobile Support
All components should work on mobile without extra code. Add responsive classes:

```javascript
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// Responsive text size
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Hidden on mobile
<div className="hidden md:block">Desktop only</div>
```

---

## Component-Specific Updates

### StatCard (Dashboard Metrics)
**Before:**
```javascript
<div className="bg-blue-50 border rounded p-4">
  <p className="text-sm">Label</p>
  <p className="text-2xl font-bold">Value</p>
</div>
```

**After:**
```javascript
<StatCard label="Label" value="Value" />

// With highlight (red background):
<StatCard label="Low Stock" value="5" highlight />
```

### Loading Spinner
**Before:**
```javascript
<div>
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>
```

**After:**
```javascript
<Loader size="md" />

// Sizes: 'sm', 'md', 'lg'
```

### Badges
**Before:**
```javascript
<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
  Active
</span>
```

**After:**
```javascript
<Badge variant="success">Active</Badge>

// Variants: 'success', 'warning', 'danger', 'info', 'gray'
```

### Alerts
**Before:**
```javascript
<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
  <p>Error message</p>
</div>
```

**After:**
```javascript
<Alert type="danger">Error message</Alert>

// Types: 'success', 'warning', 'danger', 'info'
```

---

## Testing Checklist

After updating a page:
- [ ] All buttons use Button component with proper variants
- [ ] All inputs use Input component with labels
- [ ] All forms use Card/CardHeader/CardFooter
- [ ] All tables use Table component
- [ ] Color scheme is consistent (primary/secondary/gray/semantic)
- [ ] Spacing follows standard values (p-8, mb-10, gap-4)
- [ ] Typography uses heading/body/label standards
- [ ] Page is responsive (test on mobile)
- [ ] No inline styles (style={})
- [ ] No custom className combinations

---

## Common Patterns

### Form Layout
```javascript
<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">Form Title</h3>
  </CardHeader>
  <div className="space-y-6">
    <Input label="Field 1" placeholder="Enter value" />
    <Input label="Field 2" placeholder="Enter value" />
    <Select label="Category" options={categories} />
  </div>
  <CardFooter>
    <div className="flex gap-4 justify-end">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Submit</Button>
    </div>
  </CardFooter>
</Card>
```

### Dashboard Layout
```javascript
<div className="min-h-screen bg-gray-50 p-8">
  <PageHeader title="Dashboard" />
  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    <StatCard label="Metric 1" value="1,234" />
    <StatCard label="Metric 2" value="567" />
    <StatCard label="Metric 3" value="89" />
    <StatCard label="Alert" value="5" highlight />
  </div>
  
  <Section>
    <SectionTitle>Data Table</SectionTitle>
    <Table>{/* table content */}</Table>
  </Section>
</div>
```

---

## Migration Timeline

**Week 1:** Priority 1 pages (stock management)  
**Week 2:** Priority 2 pages (layout & nav)  
**Week 3:** Priority 3 pages (forms)  
**Week 4:** Priority 4 pages (remaining)  

---

## Need Help?

1. **Color Reference:** See STYLING_GUIDE.md → Color Palette
2. **Component Usage:** See /components/ui/index.js for examples
3. **Layout Patterns:** See STYLING_GUIDE.md → Common Patterns
4. **Full Guide:** Read STYLING_GUIDE.md completely

---

**The styling system is now complete and ready for implementation!**
