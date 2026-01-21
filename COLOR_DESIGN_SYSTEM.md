# Color & Design System Reference Guide

## Quick Reference

### Primary Colors
```
Cyan-600:   #0891B2  → Primary actions, buttons, links, table headers
Cyan-700:   #0E7490  → Hover states, active states
Cyan-50:    #ECFDF5  → Light backgrounds for related content
Cyan-100:   #CFFAFE  → Badges, tags, highlights
Cyan-200:   #A5F3FC  → Borders, subtle accents
```

### Backgrounds
```
White:      #FFFFFF → Card/container backgrounds
Gray-50:    #F9FAFB → Page background (entire viewport)
Gray-100:   #F3F4F6 → Inactive buttons, subtle contrast
Gray-200:   #E5E7EB → Borders, dividers
Gray-800:   #1F2937 → Text, high contrast
Gray-900:   #111827 → Headings, primary text
```

### Status Colors
```
Green-600:  #10B981 → Success, positive, add actions
Red-500:    #EF4444 → Error, danger, delete
Amber-600:  #F59E0B → Warning, caution
Blue-600:   #3B82F6 → Info, neutral
Orange-600: #F97316 → Secondary emphasis
```

### Text Colors
```
Gray-900:   #111827 → Primary text, headings
Gray-700:   #374151 → Secondary text, body
Gray-600:   #4B5563 → Tertiary text, labels
Gray-500:   #6B7280 → Muted text, helpers
Gray-400:   #9CA3AF → Disabled text, placeholders
```

---

## Component Patterns

### Buttons

**Primary (Most Common)**
```jsx
<button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-6 rounded-lg transition">
  Action
</button>
```

**Secondary**
```jsx
<button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 px-6 rounded-lg transition">
  Cancel
</button>
```

**Success/Add**
```jsx
<button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition">
  + Add Item
</button>
```

**Danger/Delete**
```jsx
<button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg transition">
  Delete
</button>
```

**Outline**
```jsx
<button className="border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-bold py-2.5 px-6 rounded-lg transition">
  Outline Action
</button>
```

---

### Form Elements

**Input Field**
```jsx
<input 
  type="text"
  placeholder="Enter value"
  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
/>
```

**Select Field**
```jsx
<select className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

**Textarea**
```jsx
<textarea
  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
  rows="4"
/>
```

**Form Label**
```jsx
<label className="block text-sm font-semibold text-gray-700 mb-1.5">
  Field Label
</label>
```

---

### Tables

**Header Row**
```jsx
<thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
  <tr>
    <th className="px-6 py-3 text-left font-bold">Column 1</th>
    <th className="px-6 py-3 text-left font-bold">Column 2</th>
  </tr>
</thead>
```

**Body Rows (with alternating colors)**
```jsx
<tbody>
  {data.map((item, idx) => (
    <tr key={item.id} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
      <td className="px-6 py-3 text-gray-900">{item.name}</td>
      <td className="px-6 py-3 text-gray-700">{item.value}</td>
    </tr>
  ))}
</tbody>
```

---

### Cards

**Standard Card**
```jsx
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-700">Card content here...</p>
</div>
```

**Status Card (with left border)**
```jsx
<div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-cyan-600">
  <p className="text-sm font-semibold text-gray-600">Label</p>
  <p className="text-3xl font-bold text-gray-900 mt-2">Value</p>
</div>
```

**Colored Status Card**
```jsx
<div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
  <span className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded-full text-xs font-bold">
    Badge Text
  </span>
</div>
```

---

### Badges & Tags

**Cyan Badge (Primary)**
```jsx
<span className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-bold">
  Cyan
</span>
```

**Green Badge (Success)**
```jsx
<span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
  Success
</span>
```

**Red Badge (Error)**
```jsx
<span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
  Error
</span>
```

**Amber Badge (Warning)**
```jsx
<span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
  Warning
</span>
```

---

### Alerts & Messages

**Success Message**
```jsx
<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
  <p className="font-semibold">Success!</p>
  <p className="text-sm mt-1">Your changes have been saved.</p>
</div>
```

**Error Message**
```jsx
<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
  <p className="font-semibold">Error</p>
  <p className="text-sm mt-1">Something went wrong. Please try again.</p>
</div>
```

**Warning Message**
```jsx
<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
  <p className="font-semibold">Warning</p>
  <p className="text-sm mt-1">Please review before proceeding.</p>
</div>
```

**Info Message**
```jsx
<div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
  <p className="font-semibold">Information</p>
  <p className="text-sm mt-1">This is for your information.</p>
</div>
```

---

### Modals

**Modal Container**
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
  <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Modal Title</h3>
    <div className="mb-6">
      {/* Modal content */}
    </div>
    <div className="flex gap-2">
      <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg">
        Confirm
      </button>
      <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg">
        Cancel
      </button>
    </div>
  </div>
</div>
```

---

### Page Layout

**Page Container**
```jsx
<div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

**Page Header**
```jsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
  <p className="text-gray-600 mt-2">Subtitle or description</p>
</div>
```

**Two-Column Grid**
```jsx
<div className="grid md:grid-cols-2 gap-8">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

**Three-Column Grid**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

---

### Loading States

**Spinner**
```jsx
<div className="inline-block animate-spin h-12 w-12 text-cyan-600">
  {/* SVG spinner */}
</div>
```

**Loading Container**
```jsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="text-center">
    <div className="inline-block animate-spin h-12 w-12 text-cyan-600 mb-4">
      {/* SVG */}
    </div>
    <p className="text-gray-600 font-medium">Loading...</p>
  </div>
</div>
```

---

## Spacing System

```
Padding:    p-4, p-6, p-8 (standard)
Margin:     mb-4, mb-6, mb-8 (section spacing)
Gap:        gap-4, gap-5, gap-6 (between items)
Table:      px-6 py-3 or px-6 py-4 (cells)
Forms:      space-y-4, space-y-5 (field spacing)
```

---

## Shadow System

```
Subtle:     shadow-md (light borders)
Elevated:   shadow-lg (most common for cards)
Top Level:  shadow-xl (modals, overlays)
None:       No shadow (flat elements)
```

---

## Border Radius

```
All elements:  rounded-lg (8px)
Never use:     rounded-sm, rounded-xl inconsistently
Charts:        Border radius on corners only
Badges:        rounded-full (circular)
```

---

## Typography Scale

```
H1 (Page Title):     text-3xl, font-bold, text-gray-900
H2 (Section Title):  text-2xl, font-bold, text-gray-900
H3 (Card Title):     text-xl, font-bold, text-gray-900
H4 (Label):          text-lg, font-semibold, text-gray-900
Body:                text-base, font-normal, text-gray-700
Small:               text-sm, font-normal, text-gray-600
Tiny:                text-xs, font-semibold, text-gray-500
```

---

## Responsive Breakpoints

```
Mobile:     < 640px   (no prefix)
Tablet:     ≥ 640px   (sm: prefix)
Desktop:    ≥ 1024px  (lg: prefix)
XL:         ≥ 1280px  (xl: prefix)
```

**Usage**:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Single column mobile, 2 columns tablet, 3 columns desktop */}
</div>
```

---

## Common Patterns

### Filter/Search Bar
```jsx
<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
  <div className="flex flex-col sm:flex-row gap-4">
    <input 
      type="search"
      placeholder="Search..."
      className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500"
    />
    <select className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500">
      <option>All</option>
    </select>
    <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-2.5 rounded-lg">
      Search
    </button>
  </div>
</div>
```

### Summary Stats
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Status cards with border-l-4 */}
</div>
```

### Data Table
```jsx
<div className="bg-white rounded-lg shadow-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
      {/* Headers */}
    </thead>
    <tbody>
      {/* Rows with alternating bg */}
    </tbody>
  </table>
</div>
```

---

## Do's and Don'ts

### ✅ DO:
- Use cyan-600 for primary actions
- Set page background to gray-50
- Apply shadow-lg to cards
- Use gradient table headers
- Add focus rings to inputs
- Include proper spacing between elements
- Use semantic colors for status
- Keep consistent button styling
- Add hover states to interactive elements

### ❌ DON'T:
- Mix blue/indigo with cyan
- Use gray-100 for page backgrounds
- Apply multiple shadow levels inconsistently
- Forget to add focus states
- Mix button styles on same page
- Use different roundness values
- Forget accessibility (color contrast)
- Use inline styles instead of Tailwind classes
- Forget responsive design

---

## Accessibility

### Color Contrast Ratios
- **AAA Compliant** (4.5:1 ratio)
  - Cyan-600 on white: ✅ 4.5:1
  - Gray-900 on white: ✅ 8.6:1
  - Gray-600 on white: ✅ 7.1:1

- **Not Compliant** (avoid)
  - Gray-500 on white: 4.5:1 (borderline)
  - Light colors on light backgrounds

### Interactive Elements
- All buttons should have visible focus states
- Form labels should be associated with inputs
- Color should not be the only indicator (use text/icons too)
- Status changes should be announced clearly

---

## Testing Checklist

Before submitting, verify:

- [ ] Colors match the palette
- [ ] Text contrast is sufficient (AA minimum)
- [ ] Spacing is consistent (p-6, gap-4, mb-8)
- [ ] Buttons have hover and focus states
- [ ] Tables have gradient headers
- [ ] Cards have proper shadows
- [ ] Page background is gray-50
- [ ] Responsive design works on mobile
- [ ] No inline styles (use Tailwind)
- [ ] Icons align properly with text
- [ ] Forms are properly labeled
- [ ] Empty states are user-friendly

---

**Last Updated**: Today
**Version**: 1.0
**Format**: Markdown Guide
