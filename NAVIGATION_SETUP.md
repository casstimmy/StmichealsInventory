# Navigation Setup - Tender Pages Integration

## Changes Made

### 1. Sidebar Navigation (components/Nav.js)
Added two new links to the Setup submenu:
- **Location Tenders** → `/setup/location-items`
- **Init Tenders** → `/setup/init-tenders`

The Setup menu now includes:
- Company Details
- Hero-Promo Setup
- Receipts
- POS Tenders
- **Location Tenders** (NEW)
- **Init Tenders** (NEW)

### 2. Dropdown Menu on Each Tender Page
Added a "TENDER PAGES" dropdown menu on all three tender management pages:
- `/setup/pos-tenders`
- `/setup/location-items`
- `/setup/init-tenders`

The dropdown provides quick navigation between all tender pages:
```
TENDER PAGES ▼
├── POS Tenders
├── Location Tenders
└── Init Tenders
```

## How to Access

### Via Sidebar
1. Click the **Setup** icon in the left sidebar
2. The submenu expands showing all Setup pages
3. Click on:
   - **POS Tenders** - Manage tender types
   - **Location Tenders** - Assign tenders to locations
   - **Init Tenders** - Initialize default tenders

### Via Dropdown Menu
On any tender page, use the **TENDER PAGES** dropdown button to quickly jump to another tender page.

## Files Modified
1. `components/Nav.js` - Added 2 new links to Setup submenu
2. `pages/setup/pos-tenders.js` - Added dropdown menu below header
3. `pages/setup/location-items.js` - Added dropdown menu below header
4. `pages/setup/init-tenders.js` - Added dropdown menu and improved layout

## Styling
- Dropdown button: Cyan border with hover effect
- Dropdown menu: White background with hover highlighting
- Matches existing cyan/blue theme of POS system

## User Experience
- **From Sidebar**: Complete access to all tender pages in one place
- **From Dropdown**: Quick navigation between tender pages without using sidebar
- **Active Indication**: Sidebar shows which menu section is active
- **Responsive**: Works on all screen sizes
