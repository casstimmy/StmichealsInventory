# Location Edit Feature - Quick Start Guide

## What Was Added

### 1. Edit Button
- Located next to the location dropdown selector
- Cyan colored button labeled "Edit Location"
- Disabled when no location is selected

### 2. Edit Modal
- Opens when "Edit Location" button is clicked
- Contains form fields for:
  - **Location Name** (required) - cannot be empty
  - **Address** (optional)
  - **Phone** (optional)
  - **Email** (optional)
  - **Location Code** (optional)

### 3. Save Functionality
- All changes are validated before saving
- Updates immediately appear in the location dropdown
- Success message displays after successful save
- Modal closes automatically

## How to Use

1. **Navigate** to `/setup/location-items` page
2. **Select** a location from the dropdown
3. **Click** "Edit Location" button
4. **Modify** any fields you want to update
5. **Click** "Save Changes" to commit changes
6. **Verify** the modal closes and success message appears

## What Gets Updated

When you edit a location, the following fields can be updated:
- ✅ Location Name
- ✅ Address
- ✅ Phone Number
- ✅ Email Address
- ✅ Location Code

The changes persist in MongoDB and will appear in the dropdown next time you reload.

## API Endpoint

**Endpoint**: `/api/setup/update-location`
**Method**: PUT
**Parameters**: `locationId` (query parameter)

Example:
```
PUT /api/setup/update-location?locationId=507f1f77bcf86cd799439011
Content-Type: application/json

{
  "name": "Main Store",
  "address": "123 Main Street",
  "phone": "+234 123 456 7890",
  "email": "main@store.com",
  "code": "LOC001"
}
```

## Files Created/Modified

- ✅ `pages/setup/location-items.js` - Added edit button, modal UI, and handlers
- ✅ `pages/api/setup/update-location.js` - Created new API endpoint
- ✅ `LOCATION_EDIT_FEATURE.md` - Implementation documentation

## Error Handling

- **No Location Selected**: Edit button remains disabled
- **Empty Name**: Cannot save without location name - error message displays
- **Network Error**: Error message displays and modal stays open for retry
- **Invalid LocationId**: API returns 400 Bad Request error

## Testing Steps

1. Go to `/setup/location-items`
2. Select a location from dropdown
3. Click "Edit Location"
4. Try editing without a name - should show error
5. Fill in location details
6. Click "Save Changes"
7. Verify success message appears
8. Check location dropdown shows updated name

## Notes

- Edit modal is fully responsive - works on mobile and desktop
- Changes are stored in MongoDB and persist across sessions
- Tender and category assignments are NOT affected by location edits
- All location details are optional except the location name
