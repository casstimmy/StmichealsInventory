# Styling System - Comprehensive Guide

## Overview
This document outlines the consistent styling system for the Inventory Admin App. All pages, components, and UI elements should follow these guidelines.

---

## Color Palette

### Primary Color (Blue)
Used for primary actions, links, and important elements.
```
Primary-600: #2563eb (buttons, links, active states)
Primary-500: #3b82f6 (lighter version)
Primary-700: #1d4ed8 (hover state)
```

### Secondary Color (Sky/Cyan)
Used for secondary actions and accent elements.
```
Secondary-500: #06b6d4 (secondary buttons)
Secondary-600: #0891b2 (hover state)
```

### Gray Scale
For text, backgrounds, and borders.
```
Gray-50:  #f9fafb   (lightest backgrounds)
Gray-100: #f3f4f6   (page background)
Gray-200: #e5e7eb   (borders)
Gray-700: #374151   (body text)
Gray-900: #111827   (dark text, headers)
```

### Semantic Colors
For status and feedback.
```
Success: #10b981 (positive actions, confirmations)
Warning: #f59e0b (cautions, alerts)
Danger:  #ef4444 (destructive actions, errors)
Info:    #0ea5e9 (informational messages)
```

---

## Typography

### Headings
```javascript
// Page title
<h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>

// Section title
<h2 className="text-2xl font-semibold text-gray-900">Products</h2>

// Subsection
<h3 className="text-xl font-semibold text-gray-800">Details</h3>
```

### Body Text
```javascript
// Regular text
<p className="text-base text-gray-700">Regular paragraph</p>

// Small text (labels, help text)
<p className="text-sm text-gray-600">Helper text</p>

// Extra small (captions)
<p className="text-xs text-gray-500">Caption text</p>
```

### Labels & Form Text
```javascript
<label className="block text-sm font-medium text-gray-700">Field Label</label>
```

---

## Spacing

### Padding & Margins
```javascript
// Page/Container
<div className="p-8">  // 2rem padding

// Cards
<div className="p-6">  // 1.5rem padding

// Sections
<div className="mb-10">  // 2.5rem margin bottom

// Small spacing
<div className="gap-2">  // 0.5rem gap
```

**Consistent Values:**
- Page padding: `p-8` (2rem)
- Card padding: `p-6` (1.5rem)
- Section spacing: `mb-10` (2.5rem)
- Element spacing: `gap-4` (1rem) or `gap-2` (0.5rem)

---

## Components

### Button Styles

#### Primary Button (Main Actions)
```javascript
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
  Save
</button>

// Or using the Button component:
<Button variant="primary">Save</Button>
```

#### Secondary Button (Alternative Actions)
```javascript
<button className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition">
  Add
</button>

<Button variant="secondary">Add</Button>
```

#### Success Button (Positive Actions)
```javascript
<button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
  Confirm
</button>

<Button variant="success">Confirm</Button>
```

#### Danger Button (Destructive Actions)
```javascript
<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
  Delete
</button>

<Button variant="danger">Delete</Button>
```

#### Outline Button (Secondary Option)
```javascript
<button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
  Cancel
</button>

<Button variant="outline">Cancel</Button>
```

---

### Form Elements

#### Input Fields
```javascript
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text"
/>
```

#### Select/Dropdown
```javascript
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Select option</option>
</select>
```

#### Form Group (Label + Input)
```javascript
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    type="email"
  />
</div>
```

---

### Cards

#### Basic Card
```javascript
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p className="text-gray-700">Card content here</p>
</div>
```

#### Card with Header & Footer
```javascript
<div className="bg-white rounded-lg shadow-md">
  <div className="border-b border-gray-200 pb-4 px-6 py-4">
    <h3 className="text-xl font-semibold">Card Title</h3>
  </div>
  <div className="p-6">
    <p className="text-gray-700">Card content</p>
  </div>
  <div className="border-t border-gray-200 pt-4 px-6 py-4 flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save</Button>
  </div>
</div>
```

---

### Tables

#### Table Structure
```javascript
<div className="overflow-x-auto bg-white rounded-lg shadow">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
          Column Name
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-700">Cell value</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Badges

#### Success Badge
```javascript
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

#### Warning Badge
```javascript
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pending
</span>
```

#### Danger Badge
```javascript
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Inactive
</span>
```

---

### Alerts

#### Success Alert
```javascript
<div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
  <p className="font-semibold">Success!</p>
  <p className="text-sm">Operation completed successfully</p>
</div>
```

#### Error Alert
```javascript
<div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
  <p className="font-semibold">Error!</p>
  <p className="text-sm">Something went wrong</p>
</div>
```

#### Info Alert
```javascript
<div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
  <p className="font-semibold">Note</p>
  <p className="text-sm">Informational message</p>
</div>
```

---

### Loading States

#### Spinner
```javascript
<div className="flex items-center justify-center h-64">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>
```

#### Loading with text
```javascript
<div className="flex flex-col items-center justify-center h-64">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
  <p className="text-gray-600">Loading...</p>
</div>
```

---

## Page Layout

### Standard Page Structure
```javascript
import { PageHeader, Section, SectionTitle, Button } from "@/components/ui";
import Layout from "@/components/Layout";

export default function Page() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <PageHeader 
          title="Page Title"
          description="Brief description of the page"
        />

        <Section>
          <SectionTitle>Section 1</SectionTitle>
          {/* Content here */}
        </Section>

        <Section>
          <SectionTitle>Section 2</SectionTitle>
          {/* Content here */}
        </Section>
      </div>
    </Layout>
  );
}
```

### Grid Layouts
```javascript
// 2 columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Items */}
</div>

// 3 columns
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Items */}
</div>

// 4 columns (stat cards)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Items */}
</div>
```

---

## Responsive Design

### Breakpoints
```
Mobile:  < 640px  (sm breakpoint starts at 640px)
Tablet:  640px-1024px
Desktop: > 1024px (lg breakpoint)
```

### Responsive Classes
```javascript
// Hidden on mobile, shown on tablet+
<div className="hidden md:block">Desktop content</div>

// Different grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Auto-adjusts */}
</div>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>

// Responsive text size
<h1 className="text-2xl md:text-3xl lg:text-4xl">Heading</h1>
```

---

## Component Import Guide

### Using the New UI Components
```javascript
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardFooter,
  Badge,
  Alert,
  Select,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  StatCard,
  Loader,
  PageHeader,
  Section,
  SectionTitle,
} from "@/components/ui";
```

### Example Usage
```javascript
<div>
  <PageHeader title="Products" description="Manage products" />
  
  <Section>
    <SectionTitle>Add New Product</SectionTitle>
    <Card>
      <Input label="Product Name" placeholder="Enter name" />
      <Input label="Price" type="number" placeholder="0.00" />
      <div className="flex gap-4 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </Card>
  </Section>

  <Section>
    <SectionTitle>Products List</SectionTitle>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Price</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Product 1</TableCell>
          <TableCell>₦1,000</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Section>
</div>
```

---

## Common Patterns

### Stat Card Pattern
```javascript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
  <StatCard label="Total Stock" value="1,234 units" />
  <StatCard label="Incoming" value="45 orders" />
  <StatCard label="Outgoing" value="28 orders" />
  <StatCard label="Low Stock" value="8" highlight />
</div>
```

### Search & Filter Pattern
```javascript
<div className="mb-6 max-w-xl">
  <Input
    placeholder="Search by product or category..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
```

### Form Pattern
```javascript
<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">Form Title</h3>
  </CardHeader>
  <div className="space-y-6">
    <Input label="Field 1" placeholder="Enter value" />
    <Input label="Field 2" placeholder="Enter value" />
    <Select label="Option" options={options} />
  </div>
  <CardFooter>
    <div className="flex gap-4 justify-end">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Submit</Button>
    </div>
  </CardFooter>
</Card>
```

---

## Dos and Don'ts

### ✅ DO
- Use consistent spacing (p-6, mb-10, gap-4)
- Use color classes for semantic meaning
- Use reusable components from `/components/ui`
- Follow the responsive design patterns
- Use the theme colors defined in tailwind.config.js

### ❌ DON'T
- Use inline styles (style={{}})
- Create custom className combinations (use components instead)
- Use arbitrary colors (use theme colors)
- Mix styling approaches (all Tailwind)
- Create one-off button styles (use Button component)

---

## Migration Checklist

When updating existing components:
- [ ] Replace inline styles with Tailwind classes
- [ ] Use theme colors (not custom colors)
- [ ] Replace custom buttons with Button component
- [ ] Replace custom inputs with Input component
- [ ] Use consistent spacing values
- [ ] Add responsive classes for mobile
- [ ] Test on mobile and desktop

---

## Questions & Support

For questions about styling:
1. Check this guide first
2. Review the theme.js file for available properties
3. Check components/ui/index.js for component examples
4. Follow existing pages for patterns

All new pages and components should follow this system.
