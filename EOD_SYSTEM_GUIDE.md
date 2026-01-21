# End of Day (EOD) System - Complete Integration Guide

## System Overview

The End of Day system provides comprehensive till management, reconciliation, and reporting capabilities for your POS system. It tracks cash flow, validates transactions, and generates detailed analytics.

## Architecture

### 1. Database Models

#### Till Model (`models/Till.js`)
Tracks individual till sessions:
- **storeId**: Reference to Store
- **locationId**: Reference to Location
- **staffId**: Reference to Staff member operating the till
- **staffName**: Name of staff for quick reference
- **status**: OPEN, CLOSED, or SUSPENDED
- **openingBalance**: Cash at till opening
- **closingBalance**: Cash counted at closing
- **openedAt**: Timestamp when till opened
- **closedAt**: Timestamp when till closed
- **device**: Device identifier (POS Terminal, Mobile, etc.)
- **notes**: Additional notes about the till session

#### EndOfDayReport Model (`models/EndOfDayReport.js`)
Records reconciliation data:
- **storeId**: Store reference
- **locationId**: Location reference
- **tillId**: Till reference (links to Till model)
- **staffId & staffName**: Staff who opened till
- **closedBy**: Manager who closed/verified
- **openingBalance**: Starting cash
- **physicalCount**: Cash counted at closing
- **expectedClosingBalance**: Calculated from sales
- **variance**: Difference between physical and expected
- **variancePercentage**: Percentage variance
- **totalSales**: Sum of all transactions
- **transactionCount**: Number of transactions processed
- **tenderBreakdown**: Map of payment methods and amounts
- **status**: RECONCILED or VARIANCE_NOTED
- **date**: Date of till operation

### 2. API Endpoints

#### POST `/api/reporting/end-of-day-create`
Creates or closes end-of-day reports.

**Till Opening (action: "create")**
```json
{
  "action": "create",
  "storeId": "ObjectId",
  "locationId": "ObjectId",
  "staffId": "ObjectId",
  "staffName": "John Doe",
  "openingBalance": 50000
}
```

Response:
```json
{
  "success": true,
  "message": "Till opened successfully",
  "report": {
    "_id": "ObjectId",
    "storeId": "ObjectId",
    "locationId": "ObjectId",
    "staffId": "ObjectId",
    "openingBalance": 50000,
    "status": "OPEN",
    "openedAt": "2024-01-15T08:00:00Z"
  }
}
```

**Till Closing (action: "close")**
```json
{
  "action": "close",
  "storeId": "ObjectId",
  "locationId": "ObjectId",
  "physicalCount": 125000,
  "closingNotes": "All correct",
  "closedBy": "ManagerObjectId"
}
```

Response:
```json
{
  "success": true,
  "message": "Till closed and reconciled successfully",
  "summary": {
    "openingBalance": 50000,
    "totalSales": 75000,
    "transactionCount": 45,
    "expectedClosingBalance": 125000,
    "physicalCount": 125000,
    "variance": 0,
    "status": "RECONCILED",
    "tenderBreakdown": {
      "CASH": 50000,
      "CARD": 25000
    }
  }
}
```

#### GET `/api/reporting/end-of-day-summary`
Retrieves analytics and summaries.

**Query Parameters:**
- `period`: "day" | "week" | "month" | "year" (default: "month")
- `locationId`: Filter by location (optional)
- `storeId`: Filter by store (optional)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

Response:
```json
{
  "success": true,
  "summary": {
    "totals": {
      "reports": 25,
      "sales": 1500000,
      "transactions": 890,
      "variance": 5000,
      "averageVariancePercentage": 0.33
    },
    "status": {
      "reconciled": 24,
      "varianceNoted": 1
    },
    "byLocation": [
      {
        "locationId": "ObjectId",
        "name": "Main Store",
        "reports": 10,
        "totalSales": 600000,
        "variance": 2000
      }
    ],
    "byStaff": [
      {
        "staffId": "ObjectId",
        "name": "John Doe",
        "reports": 12,
        "totalSales": 400000,
        "variance": 1500
      }
    ],
    "tenderBreakdown": {
      "CASH": 800000,
      "CARD": 650000,
      "TRANSFER": 50000
    },
    "dailyData": [
      {
        "date": "2024-01-15",
        "sales": 60000,
        "reports": 2,
        "variance": 500
      }
    ]
  }
}
```

#### GET `/api/reporting/end-of-day`
Fetches all EOD reports with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)
- `locationId`: Filter by location
- `startDate`, `endDate`: Date range filter

#### GET `/api/reporting/end-of-day-[reportId]`
Fetches detailed information for a specific report.

### 3. Frontend Components

#### Page: `/reporting/end-of-day-report`
Main reporting dashboard with:
- **Summary Cards**: Total reports, sales, transactions, reconciled count
- **Daily Sales Trend Chart**: Line chart showing sales and transaction count over time
- **Tender Breakdown Chart**: Pie chart showing payment method distribution
- **Sales by Location Chart**: Bar chart comparing location performance
- **Top Staff Performance Table**: Sorted by sales with variance metrics
- **Recent Reports Table**: Last 20 EOD records with full details

**Features:**
- Period filter: Day, Week, Month, Year
- Location filter with real-time data refresh
- All amounts formatted in Nigerian Naira (₦)
- Status badges: ✅ Reconciled (green) or ⚠️ Variance (yellow)
- Variance highlighting: Green for positive, Red for negative
- Responsive grid layout

#### Hook: `src/hooks/useLocationTenders`
Fetches location-specific tenders for POS integration.

```javascript
const { tenders, loading, error } = useLocationTenders(locationId);
```

Returns:
```json
{
  "tenders": [
    {
      "id": "ObjectId",
      "name": "Cash",
      "description": "Cash payment",
      "classification": "CASH",
      "buttonColor": "#10B981",
      "tillOrder": 1
    }
  ],
  "loading": false,
  "error": null
}
```

## Workflow

### Daily Till Operations

#### Morning - Till Opening
1. Staff member logs in to POS
2. Staff clicks "Open Till" button
3. System calls `POST /api/reporting/end-of-day-create` with action: "create"
4. Staff enters opening balance (cash counted)
5. Till status becomes OPEN
6. Ready to process transactions

#### During Day - Transactions
1. Each sale creates a Transaction record
2. Transaction includes:
   - `location`: Location ID string
   - `tenderType`: Payment method (CASH, CARD, TRANSFER, CHEQUE, OTHER)
   - `total`: Transaction amount
   - `staffId`: Staff member who processed
   - `timestamp`: When transaction occurred
3. Transactions stored with proper ObjectId references

#### Evening - Till Closing
1. Manager/Supervisor clicks "Close Till"
2. Staff physically counts cash in till
3. System calls `POST /api/reporting/end-of-day-create` with action: "close"
4. Staff enters physical count
5. System automatically:
   - Fetches all transactions for location since opening
   - Calculates totalSales = sum of transaction amounts
   - Builds tenderBreakdown from transaction tenderTypes
   - Calculates expectedClosingBalance = openingBalance + totalSales
   - Calculates variance = physicalCount - expectedClosingBalance
   - Sets status to RECONCILED if variance < 1, else VARIANCE_NOTED
6. Manager verifies and confirms
7. EndOfDayReport created with all reconciliation data

### Reporting & Analytics

#### Real-Time Dashboard
- Access `/reporting/end-of-day-report`
- View aggregated data by period, location, and staff
- Analyze tender distribution
- Track reconciliation status
- Identify variance patterns

#### Analytics Aggregation
1. System fetches all closed EOD reports for period
2. Aggregates by location, staff, and tender type
3. Generates daily timeline data
4. Calculates summary statistics
5. Returns comprehensive analytics object

## Integration Points

### 1. Location-Tender Assignment
- File: `pages/api/setup/location-items.js`
- Ensures each location has configured tenders
- Validates ObjectId conversions
- Used by PaymentModal to display correct tenders

### 2. POS Transaction Creation
- File: `pages/api/transactions/...` (create endpoint)
- Must include `location` and `tenderType` fields
- Validates location exists
- Stores with proper references
- Tied to open till via location

### 3. Reporting Dashboard
- File: `pages/reporting/reporting.js`
- Added link to End of Day Reports
- Button: "📊 End of Day Reports"
- Links to `/reporting/end-of-day-report`

### 4. Navigation Menu
- File: `components/Nav.js`
- Added "End of Day Reports" menu item
- Under Reporting submenu
- Quick access from sidebar

## Data Flow Diagram

```
POS Transaction
    ↓
Store in Transactions collection
    ↓ (with location, tenderType, total)
Till Closing Request
    ↓
end-of-day-create API (action: "close")
    ↓
Query transactions for location + date range
    ↓
Aggregate sales and tender breakdown
    ↓
Calculate variance (physical vs expected)
    ↓
Create EndOfDayReport
    ↓
Business Intelligence Dashboard
    ↓
View by period, location, staff, tender type
```

## Best Practices

### 1. Till Management
- Always record opening balance with physical count
- Close till daily to track discrepancies
- Use unique device identifiers for till tracking
- Keep detailed closing notes for variance investigation

### 2. Transaction Recording
- Ensure tenderType is always set (5 classifications)
- Validate location ID before transaction
- Store amounts consistently (no rounding errors)
- Include transaction timestamp for audit trail

### 3. Reconciliation
- Acceptable variance threshold: < 1 unit of currency
- Investigate variances > threshold immediately
- Document reasons for large variances
- Use variance reports to identify patterns

### 4. Security & Audit
- Only managers can close tills (closedBy field)
- All operations timestamped
- Location-specific data isolated
- Transaction immutability maintained

## Troubleshooting

### Issue: Till doesn't close
**Solution:**
- Check location exists in Store.locations array
- Verify at least one transaction exists for period
- Check transaction.location matches till location
- Ensure transaction.tenderType is set correctly

### Issue: Variance calculation incorrect
**Solution:**
- Verify opening balance was recorded
- Check physical count is accurate number
- Ensure all transactions captured
- Look at tenderBreakdown to manually verify

### Issue: No reports appearing in dashboard
**Solution:**
- Check EndOfDayReport documents exist in MongoDB
- Verify date filter matches report dates
- Check locationId filter if applied
- Ensure reports have status = RECONCILED or VARIANCE_NOTED

### Issue: Charts not rendering
**Solution:**
- Check Chart.js dependency installed
- Verify API returns proper summary format
- Check browser console for JavaScript errors
- Ensure data includes dailyData array

## Testing Checklist

- [ ] Till opens with opening balance recorded
- [ ] Transactions created with location and tenderType
- [ ] Till closes with physical count
- [ ] Reconciliation calculates correctly
- [ ] Variance identified and status set properly
- [ ] Dashboard displays reports
- [ ] Charts render with correct data
- [ ] Filters work (period, location)
- [ ] Staff performance table sorts by sales
- [ ] Currency displays as Nigerian Naira (₦)
- [ ] Status badges show correct color
- [ ] Recent reports table shows 20 latest

## Files Involved

**Models:**
- `models/Till.js` - Till session tracking
- `models/EndOfDayReport.js` - Reconciliation records
- `models/Transactions.js` - Transaction records
- `models/Store.js` - Store and location config
- `models/Staff.js` - Staff information

**API Endpoints:**
- `pages/api/reporting/end-of-day-create.js` - Create/close operations
- `pages/api/reporting/end-of-day-summary.js` - Analytics and aggregation
- `pages/api/reporting/end-of-day.js` - Fetch reports list
- `pages/api/reporting/end-of-day-[reportId].js` - Individual report detail
- `pages/api/setup/location-items.js` - Location tender management

**Frontend Pages:**
- `pages/reporting/end-of-day-report.js` - Main reporting dashboard
- `pages/reporting/reporting.js` - Dashboard with EOD link
- `pages/reporting/index.js` - Index with navigation links

**Components:**
- `components/Nav.js` - Navigation with EOD menu item

**Hooks:**
- `src/hooks/useLocationTenders.js` - Location tender fetching for POS

## Next Steps

1. **Till Management Page**: Create dedicated page for till operations (open/close)
2. **Till History**: Show staff their till history and performance
3. **Alerts**: Real-time alerts for large variances
4. **Approval Workflow**: Require manager approval for closed tills
5. **Export Reports**: CSV/PDF export of reconciliation data
6. **Tender Audit**: Track tender-specific reconciliation
7. **Mobile Support**: Responsive till closing on mobile devices
8. **API Integration**: Connect to accounting system

## Support

For issues or questions about the End of Day system, refer to:
- API documentation: Check individual endpoint files
- Database schema: Review model files
- Frontend logic: Check page and hook files
- Reporting logic: Review API summary and aggregation functions
