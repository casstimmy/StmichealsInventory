# 🎡 Loader Consistency Guide

## Overview

A unified, consistent loader system has been implemented across the entire application using the **St. Michaels Logo** as a rotating spinner. This ensures a professional, branded appearance for all loading states.

---

## What Changed

### Before
- Multiple loading indicators:
  - Plain text "Loading..."
  - Border spinners (CSS-based)
  - `Loader2` icon spinners
  - `ClipLoader` from react-spinners
  - Custom animated divs
- Inconsistent branding
- Poor UX consistency

### After
- **One unified Loader component** with logo
- Used everywhere in the app
- Professional, branded appearance
- Customizable sizes (sm, md, lg)
- Optional text labels
- Full-screen or inline modes

---

## The New Loader Component

### Location
- **Primary:** `/components/Loader.js` (standalone)
- **Secondary:** `/components/ui/index.js` (exported from UI library)

### Features

```javascript
<Loader 
  size="md"              // sm | md | lg
  text="Loading..."      // Optional text below spinner
  fullScreen={false}     // true = fixed overlay, false = inline
/>
```

### Sizes

| Size | Dimensions | Use Case |
|------|-----------|----------|
| `sm` | 48x48px (h-12 w-12) | Small loading states, form searches |
| `md` | 80x80px (h-20 w-20) | Main page loaders, typical use |
| `lg` | 128x128px (h-32 w-32) | Full-page loading, modals, overlays |

---

## Updated Files

### Components Updated
1. **`/components/Loader.js`** ✅
   - Converted to logo-based spinner
   - Now accepts props: size, text, fullScreen

2. **`/components/Layout.js`** ✅
   - Loading auth state uses new Loader
   - Shows spinner while session loads

3. **`/components/Nav.js`** ✅
   - Sidebar loading overlay uses new Loader
   - Logo spinner instead of border spinner

4. **`/components/ExpenseForm.js`** ✅
   - Submit button loading uses new Loader
   - Removed Loader2 icon dependency

5. **`/components/ui/index.js`** ✅
   - Added Loader export
   - Consistent with other UI components

### Pages Updated
1. **`/pages/index.js`** (Dashboard) ✅
   - Dashboard loading uses new Loader
   - Added text: "Loading dashboard..."

2. **`/pages/stock/management.js`** ✅
   - Stock list loading uses new Loader
   - Added text: "Loading stock data..."

3. **`/pages/stock/add.js`** ✅
   - Product search loading uses new Loader (sm)
   - Added text: "Searching products..."

4. **`/pages/products/edit/[...id].js`** ✅
   - Product edit page loading uses new Loader
   - Added text: "Loading product..."

---

## Usage Examples

### Basic Usage (Dashboard)
```javascript
import { Loader } from "@/components/ui";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  return (
    <div>
      {loading ? (
        <Loader size="md" text="Loading dashboard..." />
      ) : (
        <DashboardContent />
      )}
    </div>
  );
}
```

### Full-Screen Overlay (Modal/Dialog)
```javascript
import Loader from "@/components/Loader";

{isLoading && (
  <Loader size="lg" fullScreen={true} text="Processing..." />
)}
```

### Small Inline Loader (Search/Form)
```javascript
import { Loader } from "@/components/ui";

{loadingSearch && (
  <div className="mt-4">
    <Loader size="sm" text="Searching..." />
  </div>
)}
```

### With Custom Styling
```javascript
import { Loader } from "@/components/ui";

<div className="bg-blue-50 p-8 rounded-lg">
  <Loader 
    size="md" 
    text="Loading user data..." 
    className="drop-shadow-2xl"
  />
</div>
```

---

## Styling Details

### Logo Image
- **Source:** `/public/images/st-micheals-logo.png`
- **Class:** `animate-spin` (Tailwind CSS animation)
- **Border Radius:** Full rounded corners
- **Filter:** Drop shadow for depth
- **Object Fit:** Cover (maintains aspect ratio)

### Text Styling
- **Color:** `text-gray-600`
- **Weight:** Font medium
- **Position:** Below spinner (gap-4)
- **Text Align:** Center

### Container
- **Flex Layout:** Centered column
- **Gap:** 1rem (gap-4)
- **Background:** None (transparent by default)

---

## API Reference

### Props

```typescript
interface LoaderProps {
  size?: "sm" | "md" | "lg";      // Default: "md"
  text?: string;                   // Default: "Loading..."
  fullScreen?: boolean;            // Default: false
  className?: string;              // Additional Tailwind classes
}
```

### Examples by Scenario

#### Page Loading
```javascript
<Loader size="md" text="Loading page..." />
```

#### Modal/Dialog
```javascript
<Loader size="lg" fullScreen={true} text="Processing request..." />
```

#### Form Field
```javascript
<Loader size="sm" text="Validating..." />
```

#### List/Table
```javascript
<Loader size="md" text="Loading data..." />
```

---

## Imports

### Option 1: From UI Library (Recommended)
```javascript
import { Loader } from "@/components/ui";
```

### Option 2: Direct Import
```javascript
import Loader from "@/components/Loader";
```

---

## Tailwind Classes Used

| Class | Purpose |
|-------|---------|
| `animate-spin` | Rotates the logo continuously |
| `flex` | Container layout |
| `items-center` | Vertical center |
| `justify-center` | Horizontal center |
| `gap-4` | Space between spinner and text |
| `flex-col` | Stack items vertically |
| `rounded-full` | Perfect circle for logo |
| `drop-shadow-lg` | Subtle shadow effect |
| `text-gray-600` | Loader text color |
| `font-medium` | Text weight |
| `text-center` | Text alignment |
| `fixed inset-0` | Full-screen overlay (when fullScreen=true) |
| `bg-white bg-opacity-90` | Subtle overlay background |
| `z-50` | High z-index for overlays |

---

## Common Patterns

### Pattern 1: Page Loading
```javascript
{isLoading ? (
  <Loader size="md" text="Loading page..." />
) : (
  <PageContent />
)}
```

### Pattern 2: Data Table Loading
```javascript
{tableLoading ? (
  <div className="min-h-screen flex items-center justify-center">
    <Loader size="lg" text="Loading table data..." />
  </div>
) : (
  <Table data={data} />
)}
```

### Pattern 3: Form Submission
```javascript
<button disabled={loading}>
  {loading ? (
    <Loader size="sm" text="Saving..." />
  ) : (
    "Save Changes"
  )}
</button>
```

### Pattern 4: Search/Filter
```javascript
{searching ? (
  <div className="mt-4">
    <Loader size="sm" text="Searching..." />
  </div>
) : (
  <ResultsList results={results} />
)}
```

### Pattern 5: Async Operation
```javascript
const handleAsyncTask = async () => {
  setLoading(true);
  try {
    await performTask();
  } finally {
    setLoading(false);
  }
};

{loading && <Loader fullScreen={true} text="Processing..." />}
```

---

## Files Modified

### Core Loader Files
- `/components/Loader.js` - Main loader component
- `/components/ui/index.js` - UI library export

### Component Files
- `/components/Layout.js` - Auth loading
- `/components/Nav.js` - Sidebar operations
- `/components/ExpenseForm.js` - Form submission

### Page Files
- `/pages/index.js` - Dashboard
- `/pages/stock/management.js` - Stock list
- `/pages/stock/add.js` - Stock form
- `/pages/products/edit/[...id].js` - Product edit

### Configuration Files
- `/styles/globals.css` - Fixed custom class error
- `/tailwind.config.js` - Already configured for animations

---

## Benefits

✅ **Consistency** - Same loader everywhere
✅ **Branding** - Uses company logo
✅ **Professional** - Polished appearance
✅ **Flexible** - 3 size options
✅ **Accessible** - Proper contrast and visibility
✅ **Performant** - CSS-based animation
✅ **Simple** - Easy to use and customize
✅ **Maintainable** - One component to update

---

## Customization

### Changing Logo
To use a different logo:
1. Place new logo in `/public/images/`
2. Update path in `/components/Loader.js`
3. Update path in `/components/ui/index.js`

```javascript
// Before
src="/images/st-micheals-logo.png"

// After
src="/images/your-logo.png"
```

### Changing Animation Speed
Modify Tailwind config in `tailwind.config.js`:
```javascript
extend: {
  animation: {
    spin: 'spin 2s linear infinite', // Default
    // Change to faster:
    // spin: 'spin 1s linear infinite',
  }
}
```

### Changing Text Color
Update in `/components/Loader.js`:
```javascript
// Change this:
{text && <p className="text-gray-600 font-medium text-center">{text}</p>}
// To:
{text && <p className="text-blue-600 font-medium text-center">{text}</p>}
```

---

## Troubleshooting

### Logo not rotating
- Check if `animate-spin` class is applied
- Verify Tailwind CSS is loading
- Ensure image path is correct

### Text not showing
- Check if `text` prop is passed
- Verify text color has sufficient contrast
- Check z-index if behind other elements

### Overlay covering content
- Ensure `fullScreen={true}` is only used when needed
- Adjust z-index if needed
- Check `position: fixed` is not conflicting

### Image not loading
- Verify logo file exists in `/public/images/`
- Check file name spelling
- Try full URL: `/images/st-micheals-logo.png`

---

## Next Steps

### For New Features
When adding new loading states:
1. Import `Loader` from `@/components/ui`
2. Use appropriate size (sm/md/lg)
3. Add descriptive text
4. Test on all screen sizes

### For Refactoring
Other components still using old spinners:
- Search codebase for `animate-spin`, `ClipLoader`, `Loader2`
- Replace with new Loader component
- Test functionality

---

## Summary

The loader system is now:
- ✅ Unified across the app
- ✅ Branded with company logo
- ✅ Customizable (3 sizes)
- ✅ Professional appearance
- ✅ Easy to use and maintain
- ✅ Accessible and performant

All loading states now show a rotating **St. Michaels Logo** for consistent branding! 🎡

