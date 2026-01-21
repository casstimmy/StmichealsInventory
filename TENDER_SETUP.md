# Tender Management Setup

## Overview
The tender management system allows you to create, read, update, and delete payment tender types in your POS system. All data is stored in MongoDB.

## Database Model
**File**: `models/Tender.js`

Fields:
- `name` (String, required, unique) - Tender name (e.g., "CASH", "ACCESS POS")
- `description` (String) - Description of the tender
- `buttonColor` (String) - Hex color code for the POS button
- `tillOrder` (Number) - Display order on the till
- `classification` (String) - Type: "Cash", "Card", or "Other"
- `active` (Boolean) - Whether the tender is active
- `createdAt` & `updatedAt` - Timestamps

## API Endpoints

### 1. GET /api/setup/tenders
Retrieves all tenders from the database sorted by till order.

**Response**:
```json
{
  "success": true,
  "tenders": [
    {
      "_id": "ObjectId",
      "name": "CASH",
      "description": "Cash payment",
      "buttonColor": "#E5E7EB",
      "tillOrder": 3,
      "classification": "Cash",
      "active": true,
      "createdAt": "2026-01-08T...",
      "updatedAt": "2026-01-08T..."
    }
  ]
}
```

### 2. POST /api/setup/tenders
Creates a new tender.

**Request Body**:
```json
{
  "name": "NEW TENDER",
  "description": "Description here",
  "buttonColor": "#FF69B4",
  "tillOrder": 6,
  "classification": "Card"
}
```

**Response**: Returns the created tender with MongoDB _id

### 3. PUT /api/setup/tenders/[id]
Updates an existing tender.

**Request Body**: Same as POST

**Response**: Returns updated tender

### 4. DELETE /api/setup/tenders/[id]
Deletes a tender.

**Response**: Returns the deleted tender

### 5. POST /api/setup/seed-tenders
Seeds the database with default tenders (only if database is empty).

**Default Tenders Created**:
1. ACCESS ONLINE TRANSFER - Pink (#FF69B4) - Other
2. ACCESS POS - Green (#22C55E) - Card
3. CASH - Gray (#E5E7EB) - Cash
4. HYDROGEN POS - Lime (#A3E635) - Other
5. ZENITH POS - Red (#EF4444) - Card

## Frontend Pages

### 1. /setup/pos-tenders
Main tender management page with full CRUD functionality.

**Features**:
- View all tenders in a table
- Add new tender (+ ADD TENDER TYPE button)
- Edit existing tender (EDIT button)
- Delete tender (DELETE button)
- Assign tenders to devices/locations

**On Load**:
- Automatically seeds tenders if database is empty
- Fetches all tenders from API
- Fetches store locations

### 2. /setup/init-tenders
Initialization page to manually seed tenders.

**Use When**:
- Database is empty and you need to create default tenders
- You want to manually trigger the seeding process

## Initial Setup Steps

1. **Visit the Tender Initialization Page**:
   - Navigate to `/setup/init-tenders`
   - Click "INITIALIZE TENDERS" button

2. **Or Access Directly**:
   - Navigate to `/setup/pos-tenders`
   - Page will auto-seed tenders on first load if database is empty

3. **Manage Tenders**:
   - View all tenders in the Active Tender Types table
   - Click EDIT to modify any tender
   - Click DELETE to remove a tender
   - Click + ADD TENDER TYPE to create new tenders

## File Structure

```
pages/
├── setup/
│   ├── pos-tenders.js           # Main tender management page
│   └── init-tenders.js          # Initialization page
└── api/
    └── setup/
        ├── tenders.js           # GET/POST endpoints
        ├── seed-tenders.js      # Seeding endpoint
        └── tenders/
            └── [id].js          # GET/PUT/DELETE endpoints

models/
└── Tender.js                    # MongoDB model
```

## Example Usage

### Create a Tender
```javascript
const response = await fetch('/api/setup/tenders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'MOBILE TRANSFER',
    description: 'Mobile money transfer',
    buttonColor: '#0066FF',
    tillOrder: 6,
    classification: 'Other'
  })
});
```

### Update a Tender
```javascript
const response = await fetch('/api/setup/tenders/[id]', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'UPDATED TENDER',
    description: 'Updated description',
    buttonColor: '#0066FF',
    tillOrder: 6,
    classification: 'Card'
  })
});
```

### Delete a Tender
```javascript
const response = await fetch('/api/setup/tenders/[id]', {
  method: 'DELETE'
});
```

## Validation Rules

- **Tender Name**: Required and must be unique
- **Button Color**: Valid hex color code
- **Till Order**: Positive number
- **Classification**: Must be "Cash", "Card", or "Other"
- **Active**: Boolean value

## Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

Common errors:
- 400: Bad request (validation failed)
- 404: Tender not found
- 500: Server error

## Database Indexing

The Tender model includes:
- `unique: true` on name field to prevent duplicates
- Auto-sorted queries by `tillOrder` for consistent ordering

## Notes

- All tender operations are logged to console
- Timestamps are automatically maintained
- Duplicate tender names are prevented at database level
- Tender color picker uses standard HTML5 color input
