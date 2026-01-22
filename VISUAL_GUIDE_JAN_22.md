# Navigation & Login/Registration Redesign - Visual Overview

## 1. Navigation Architecture

### Desktop Collapsed State
```
┌─────────────────────────────────────────────────────────────────┐
│                    Fixed Navbar (100% width)                    │
├──────┬──────────────────────────────────────────────────────────┤
│  20px│                                                           │
│ Icon │                   Content Area (100%)                    │
│ Btns │                                                           │
│  80px│                                                           │
└──────┴──────────────────────────────────────────────────────────┘
```

### Desktop Expanded State
```
┌─────────────────────────────────────────────────────────────────┐
│                    Fixed Navbar (100% width)                    │
├──────┬──────────────────┬─────────────────────────────────────┤
│      │    Submenu       │                                     │
│ Icon │    Panel         │   Content Area                      │
│ Btns │   (224px)        │   (Remaining Width)                │
│      │                  │                                     │
│ 80px │   - Home         │                                     │
│      │   - Setup        │                                     │
│      │   - Manage       │                                     │
│      │   - Stock        │                                     │
│      │   - Reporting    │                                     │
│      │   - Expenses     │                                     │
│      │   - Till         │                                     │
│      │   - Support      │                                     │
└──────┴──────────────────┴─────────────────────────────────────┘
```

### Mobile State
```
┌──────────────────────────────────┐
│      Fixed Navbar (100%)         │
│  Title          [☰ Menu Button]  │
├──────────────────────────────────┤
│                                  │
│       Content Area (100%)        │
│                                  │
│                                  │
│                                  │
│                                  │
│                    ┌──────────┐  │
│                    │ ☰ Menu   │  │
│                    │ Floating │  │
│                    │ Button   │  │
│                    └──────────┘  │
└──────────────────────────────────┘

When Menu Clicked:
┌──────────────────────────────────┐
│      Fixed Navbar (100%)         │
│  Title          [✕ Close Button] │
├──────────────────────────────────┤
│ ► Setup                          │
│ ► Manage                         │
│ ► Stock                          │
│ ► Reporting                      │
│ ► Expenses                       │
│ ► Till                           │
│ ► Support                        │
│                                  │
│ (Full screen overlay)            │
└──────────────────────────────────┘
```

---

## 2. Login Page Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DESKTOP VIEW (2 Column)                                    │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   LEFT SECTION      │    │  RIGHT SECTION      │        │
│  │                     │    │                     │        │
│  │  [Company Logo]     │    │  Staff Login        │        │
│  │    (128x128)        │    │                     │        │
│  │                     │    │  User: [Select ▼]   │        │
│  │  Company Name       │    │                     │        │
│  │  (e.g., St's       │    │  Location:          │        │
│  │   Michael Hub)      │    │  [Select ▼]         │        │
│  │                     │    │                     │        │
│  │  Efficient          │    │  Password:          │        │
│  │  inventory          │    │  ●●●●               │        │
│  │  management         │    │                     │        │
│  │  system for your    │    │  [1][2][3]          │        │
│  │  business.          │    │  [4][5][6]          │        │
│  │                     │    │  [7][8][9]          │        │
│  │  [Register Link →]  │    │  [C][0][←]          │        │
│  │                     │    │                     │        │
│  │                     │    │  [Log In Button]    │        │
│  │                     │    │                     │        │
│  │                     │    │  Already have       │        │
│  │                     │    │  account? Sign in   │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│   MOBILE VIEW (Stacked)         │
│                                 │
│  [Company Logo] (96x96)         │
│                                 │
│  Staff Login                    │
│                                 │
│  User: [Select ▼]              │
│                                 │
│  Location: [Select ▼]          │
│                                 │
│  Password: ●●●●                │
│                                 │
│  [1][2][3]                      │
│  [4][5][6]                      │
│  [7][8][9]                      │
│  [C][0][←]                      │
│                                 │
│  [Log In Button]                │
│                                 │
│  Already have account?          │
│  Sign in here                   │
│                                 │
└─────────────────────────────────┘
```

---

## 3. Registration Page Design

```
┌─────────────────────────────────┐
│   Registration Page             │
│                                 │
│  [Company Logo] (96x96)         │
│                                 │
│  Join St's Michael Hub          │
│                                 │
│  Join our inventory system      │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Full Name               │   │
│  │ [________________]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email Address           │   │
│  │ [________________]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ PIN (4 Digits)          │   │
│  │ [●●●●]                  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Confirm PIN             │   │
│  │ [●●●●]                  │   │
│  └─────────────────────────┘   │
│                                 │
│  [Create Account Button]        │
│                                 │
│  Already have account?          │
│  Sign in here                   │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Logo Caching Flow

```
User visits login/register page
│
├─ Server-Side Rendering
│  └─ fetch /api/setup/get
│     └─ Get logo from database
│        └─ Pass as prop to component
│
└─ Client-Side Rendering
   │
   ├─ Check localStorage
   │  ├─ Logo found & valid (< 24h)
   │  │  └─ Display cached logo ✓ (FAST)
   │  │
   │  └─ Logo not found or expired
   │     └─ Fetch from /api/setup/get
   │        └─ Store in localStorage
   │        └─ Display logo ✓
   │
   └─ Fallback
      └─ No logo available
         └─ Show without logo

Next visit: Uses cached logo (no API call)
```

**Cache Duration**: 24 hours
**Storage**: Browser localStorage
**Fallback**: Graceful degradation if cache unavailable

---

## 5. Color Scheme

### Primary Colors
- **Background**: `bg-gray-50` (Light gray)
- **Navbar**: `bg-white` (White)
- **Sidebar**: `bg-gradient-to-b from-gray-50 to-gray-100`
- **Active States**: `bg-gradient-to-r from-blue-600 to-blue-700`
- **Hover States**: `bg-blue-50` or `hover:bg-blue-300`

### Text Colors
- **Primary Text**: `text-gray-700` / `text-gray-800`
- **Active Text**: `text-white` / `text-blue-600`
- **Secondary Text**: `text-gray-600`
- **Headings**: `text-blue-700` / `text-blue-800`

---

## 6. Responsive Breakpoints

| Size | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Navbar | 100% | 100% | 100% |
| Sidebar | 80px | Hidden | Hidden |
| Submenu | Visible | Hidden | Hidden |
| Content | Flex | 100% | 100% |
| Menu Button | No | No | Floating |
| Login Layout | 2 Col | Stack | Stack |

**Breakpoint**: 768px (md)

---

## 7. File Structure

```
components/
├─ Layout.js        (App shell with fixed navbar)
├─ Nav.js           (Sidebar + submenu panels)
├─ NavBar.js        (Top navigation bar)
└─ ...

pages/
├─ login.js         (Login page with logo)
├─ register.js      (Registration page with logo)
└─ ...

lib/
├─ logoCache.js     (Logo caching utility)
├─ api-client.js
├─ mongodb.js
└─ ...

models/
├─ Store.js         (Contains logo field)
├─ Staff.js
├─ User.js
└─ ...

public/
└─ (Static assets)
```

---

## 8. Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Fixed Navbar | ✅ | Always 100% width, never moves |
| Responsive Sidebar | ✅ | 80px icon section, hidden on mobile |
| Submenu Panels | ✅ | Appear adjacent to sidebar on click |
| Company Logo | ✅ | Fetched from database, displayed on login/register |
| Logo Caching | ✅ | 24-hour localStorage cache for fast loads |
| Mobile Menu | ✅ | Floating hamburger button, full-screen overlay |
| Auto-close Menu | ✅ | Menu closes on route change |
| Color Consistency | ✅ | All pages use gray-50 background |
| Responsive Design | ✅ | Works on all device sizes |

---

**Visual Guide Created**: January 22, 2026
**Status**: ✅ Complete & Functional
