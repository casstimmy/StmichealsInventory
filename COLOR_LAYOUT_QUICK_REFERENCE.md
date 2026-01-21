# 🎨 Color & Layout Quick Reference Guide

## One-Minute Setup for New Pages

### Copy This Template
```jsx
export default function NewPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Your content here */}
        </div>
      </div>
    </Layout>
  );
}
```

---

## Chart Color Quick Reference

### ✅ Do This
```javascript
// Line Charts
const data = {
  borderColor: "#06B6D4",  // Cyan for primary metric
  backgroundColor: "rgba(6, 182, 212, 0.1)"
}

// Bar Charts
const data = {
  backgroundColor: "#06B6D4"  // Cyan for all single-series
}

// Multi-Series Pie/Doughnut
const colors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"
]
```

### ❌ Don't Do This
```javascript
// ❌ Purple line charts
borderColor: "#9333ea"

// ❌ Blue bar charts
backgroundColor: "#2563eb"

// ❌ Orange/Red for primary metric
borderColor: "#f97316" or "#dc2626"

// ❌ Random colors
backgroundColor: ["#random", "#colors", ...]
```

---

## Color Meanings

| Color | Hex | Use Case | Tailwind |
|-------|-----|----------|----------|
| **Cyan** | #06B6D4 | Primary metric, main action | cyan-600 |
| **Gray** | #9CA3AF | Secondary metric, baseline | gray-400 |
| **Green** | #10b981 | Success, positive, growth | emerald-600 |
| **Blue** | #3b82f6 | Information, neutral | blue-500 |
| **Orange** | #f97316 | Warning, attention needed | orange-500 |
| **Red** | #ef4444 | Error, critical, danger | red-500 |
| **Purple** | #8b5cf6 | Analytical, special | violet-600 |
| **Pink** | #ec4899 | Highlight, accent | pink-600 |

---

## Standard Components

### Button (Primary Action)
```jsx
<button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition">
  ADD NEW
</button>
```

### Card
```jsx
<div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
  {/* Content */}
</div>
```

### Header (Table, Section)
```jsx
<thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
  {/* Header content */}
</thead>
```

### Status Badge
```jsx
// Success
<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
  Completed
</span>

// Warning
<span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
  Pending
</span>

// Error
<span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
  Failed
</span>
```

### Form Input (Focus)
```jsx
<input
  type="text"
  className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
/>
```

---

## Common Mistakes to Avoid

1. **Using different shades of cyan**
   - ❌ #0891B2 (old)
   - ✅ #06B6D4 (standard)

2. **Random colors in multi-series charts**
   - ❌ Pick any 5 colors
   - ✅ Use the approved 8-color palette in order

3. **Blue for primary charts**
   - ❌ #2563eb or #3b82f6 for main metric
   - ✅ #06B6D4 for main metric (only use blue in multi-series)

4. **White background instead of gray**
   - ❌ `bg-white` for page background
   - ✅ `bg-gray-50` for page background (use white for cards)

5. **Inconsistent padding**
   - ❌ p-4, p-8, or different values
   - ✅ Always p-6 for standard containers

---

## Copy-Paste Examples

### Line Chart
```javascript
import { Line } from "react-chartjs-2";

<Line
  data={{
    labels: data.dates || [],
    datasets: [{
      label: "Sales (₦)",
      data: data.sales || [],
      borderColor: "#06B6D4",
      backgroundColor: "rgba(6, 182, 212, 0.1)",
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "#06B6D4",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
    }]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" }
    },
    scales: { y: { beginAtZero: true } }
  }}
/>
```

### Bar Chart
```javascript
import { Bar } from "react-chartjs-2";

<Bar
  data={{
    labels: categories.map(c => c.name),
    datasets: [{
      label: "Sales (₦)",
      data: categories.map(c => c.value),
      backgroundColor: "#06B6D4",
      borderRadius: 8,
      borderSkipped: false,
    }]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }}
/>
```

### Pie Chart
```javascript
import { Pie } from "react-chartjs-2";

<Pie
  data={{
    labels: items.map(i => i.name),
    datasets: [{
      data: items.map(i => i.value),
      backgroundColor: [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
        "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"
      ],
      borderColor: "#fff",
      borderWidth: 2,
    }]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right", labels: { padding: 20 } }
    }
  }}
/>
```

---

## Checklist for New Pages

- [ ] Using Layout wrapper
- [ ] Background is bg-gray-50 (not white)
- [ ] Container is max-w-7xl mx-auto
- [ ] Padding is p-6
- [ ] Cards are bg-white with shadow-lg
- [ ] Primary buttons are cyan-600
- [ ] Charts use #06B6D4 for primary color
- [ ] Multi-series charts use approved palette
- [ ] Focus states use focus:ring-cyan-600
- [ ] Headers use gradient from cyan-600 to cyan-700

---

## Help & Support

**Question**: Where do I find the exact hex codes?  
**Answer**: In this file - Cyan: #06B6D4, Secondary: #9CA3AF, See color table above

**Question**: Can I use a different shade of cyan?  
**Answer**: No - use #06B6D4 consistently. Old code had #0891B2, please update when you see it.

**Question**: What if my chart needs more than 8 colors?  
**Answer**: Rethink the visualization - too many colors makes charts unreadable. Use filters or split into multiple charts.

**Question**: Is the palette locked or can I suggest changes?  
**Answer**: Discuss with design team before making changes. Current palette is approved and standardized across the app.

**Question**: Should I use Tailwind classes or hex codes?  
**Answer**: Use Tailwind classes in HTML/JSX (bg-cyan-600). Use hex codes in JS objects for chart.js (backgroundColor: "#06B6D4")

---

**Last Updated**: January 5, 2026  
**Status**: ✅ APPROVED FOR USE  
**Maintained By**: Design & Frontend Teams
