# Styling System - Quick Reference

## Files Created

### 1. `/styles/theme.js`
- **Purpose**: Centralized theme configuration
- **Contains**: Colors, spacing, typography, component class names
- **Usage**: Import theme colors and styles consistently across the app

### 2. `/components/ui/index.js`
- **Purpose**: Reusable UI components library
- **Components**: Button, Input, Card, Badge, Alert, Select, Table, StatCard, Loader, PageHeader, Section
- **Usage**: Import from `@/components/ui` and use instead of custom styling

### 3. `/tailwind.config.js` (Updated)
- **Enhanced with**: Extended color palette, spacing, border radius, box shadows
- **Now supports**: Primary and secondary color variations

### 4. `/STYLING_GUIDE.md`
- **Purpose**: Comprehensive styling documentation
- **Contains**: Color usage, typography, components, patterns, dos & don'ts

---

## Quick Color Reference

```
Primary (Blue):     #2563eb (actions, links)
Secondary (Sky):    #06b6d4 (alternatives)
Success (Green):    #10b981 (confirmations)
Warning (Yellow):   #f59e0b (cautions)
Danger (Red):       #ef4444 (destructive)
Info (Blue):        #0ea5e9 (informational)
Gray-50 to 900:     Various grays for text/bg/borders
```

---

## Quick Component Reference

### Buttons
```javascript
<Button variant="primary">Save</Button>
<Button variant="secondary">Add</Button>
<Button variant="success">Confirm</Button>
<Button variant="danger">Delete</Button>
<Button variant="outline">Cancel</Button>
```

### Forms
```javascript
<Input label="Name" placeholder="Enter name" />
<Select label="Category" options={options} value={val} onChange={setVal} />
```

### Cards
```javascript
<Card>
  <CardHeader>Title</CardHeader>
  <p>Content</p>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Tables
```javascript
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

### Badges & Alerts
```javascript
<Badge variant="success">Active</Badge>
<Alert type="success">Success message</Alert>
```

---

## Spacing Standards

| Use Case | Class | Value |
|----------|-------|-------|
| Page padding | `p-8` | 2rem |
| Card padding | `p-6` | 1.5rem |
| Section spacing | `mb-10` | 2.5rem |
| Element gap | `gap-4` | 1rem |
| Form fields | `mb-6` | 1.5rem |

---

## Color Classes by Use

### Text
```
Headers:     text-gray-900 (dark text)
Body:        text-gray-700 (readable)
Muted:       text-gray-500 (secondary)
Labels:      text-gray-700 (medium)
```

### Backgrounds
```
Page:        bg-gray-50 (light background)
Cards:       bg-white (white content)
Success:     bg-green-50 (success area)
Error:       bg-red-50 (error area)
```

### Borders
```
Default:     border-gray-300
Focus:       border-transparent + ring-2 ring-blue-500
Error:       border-red-500
```

---

## Implementation Pattern

### Old Way (DON'T)
```javascript
<div style={{padding: "24px", backgroundColor: "#ffffff", marginBottom: "20px"}}>
  <h1 style={{fontSize: "24px", fontWeight: "bold"}}>Title</h1>
  <button style={{backgroundColor: "#2563eb", color: "white", padding: "8px 16px"}}>
    Click
  </button>
</div>
```

### New Way (DO)
```javascript
import { PageHeader, Button, Card } from "@/components/ui";

<Card>
  <PageHeader title="Title" />
  <Button variant="primary">Click</Button>
</Card>
```

---

## Responsive Design

All components automatically support:
- Mobile-first design (default: mobile)
- Tablet (md: 640px+)
- Desktop (lg: 1024px+)

Example:
```javascript
// Shows 1 col on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Items */}
</div>
```

---

## Benefits of This System

✅ **Consistency** - All pages look and feel the same  
✅ **Maintainability** - Change theme once, applies everywhere  
✅ **Reusability** - Pre-built components for common UI patterns  
✅ **Scalability** - Easy to add new components to the library  
✅ **Performance** - No inline styles, optimized CSS  
✅ **Accessibility** - Built-in focus states and semantic HTML  
✅ **Responsive** - Mobile-first, works on all devices  

---

## Next Steps

1. **Use the new components** in existing pages
2. **Follow the spacing standards** for consistency
3. **Use theme colors** instead of custom colors
4. **Reference the STYLING_GUIDE.md** for detailed patterns
5. **Add new components** to `/components/ui` as needed

---

## Example: Complete Page

```javascript
import Layout from "@/components/Layout";
import { PageHeader, Section, SectionTitle, Button, Card, Input, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, StatCard } from "@/components/ui";

export default function Example() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <PageHeader 
          title="Dashboard"
          description="Overview of your business"
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Sales" value="₦1.2M" />
          <StatCard label="Orders" value="234" />
          <StatCard label="Customers" value="456" />
          <StatCard label="Growth" value="+12%" />
        </div>

        {/* Form Section */}
        <Section>
          <SectionTitle>Add New Item</SectionTitle>
          <Card>
            <div className="space-y-6">
              <Input label="Item Name" placeholder="Enter name" />
              <Input label="Price" type="number" placeholder="0.00" />
            </div>
            <div className="flex gap-4 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>
          </Card>
        </Section>

        {/* Table Section */}
        <Section>
          <SectionTitle>Recent Items</SectionTitle>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Rows here */}
            </TableBody>
          </Table>
        </Section>
      </div>
    </Layout>
  );
}
```

---

**All styling is now consistent, maintainable, and easy to use!**
