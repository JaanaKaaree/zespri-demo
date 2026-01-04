# Organisation Parts Management - Screen Flow

This document describes the screen flow for managing organisation parts.

## Navigation Flow

```
Dashboard
  └─ Quick Actions
      └─ "Manage Organisation Parts" link
          └─ /nzbn/organisations
              └─ NZBN Selection Screen
                  └─ Enter NZBN → Continue
                      └─ /nzbn/organisations/[nzbn]/parts
                          └─ Organisation Parts List Screen
                              ├─ Create → Organisation Part Form
                              ├─ Edit → Organisation Part Form
                              └─ Delete → Confirmation → Refresh List
```

## Screen Descriptions

### 1. Dashboard (Updated)
**Path:** `/dashboard`

- Added "Manage Organisation Parts" link in Quick Actions section
- Links to `/nzbn/organisations`

### 2. NZBN Selection Screen
**Path:** `/nzbn/organisations`
**Component:** `app/nzbn/organisations/page.tsx`

**Features:**
- Input field for 13-digit NZBN number
- Validation: Must be exactly 13 digits
- "Continue" button to proceed
- "Cancel" button to go back to dashboard
- Error message display for invalid NZBN

**User Flow:**
1. User enters NZBN number
2. Clicks "Continue"
3. If valid, navigates to `/nzbn/organisations/[nzbn]/parts`

### 3. Organisation Parts List Screen
**Path:** `/nzbn/organisations/[nzbn]/parts`
**Component:** `app/nzbn/organisations/[nzbn]/parts/page.tsx`
**List Component:** `components/organisations/OrganisationPartList.tsx`

**Features:**
- Displays all organisation parts for the selected NZBN
- Shows: Name, OPN, Status, Type, Address count, Phone count, Purposes
- "Create Organisation Part" button
- "Edit" button for each part
- "Delete" button for each part (with confirmation)
- "Back to NZBN Selection" button
- Empty state message when no parts exist

**User Flow:**
1. User sees list of organisation parts (or empty state)
2. Can click "Create Organisation Part" to add new
3. Can click "Edit" on any part to modify
4. Can click "Delete" on any part (confirmation dialog)
5. Can click "Back" to return to NZBN selection

### 4. Organisation Part Form
**Component:** `components/organisations/OrganisationPartForm.tsx`

**Features:**
- Used for both Create and Edit modes
- Form fields:
  - Name (required)
  - Function (dropdown: Function, Physical Location, Digital Location)
  - Status (dropdown: Active, Inactive)
  - Privacy (dropdown: Public, Shared, Private)
  - GST Number (optional)
  - Payment Bank Account Number (optional)
- Note about additional fields (addresses, phones, etc.) being added later
- "Create/Update" button
- "Cancel" button

**User Flow:**
1. User fills in form fields
2. Clicks "Create/Update Organisation Part"
3. Form submits (currently mocked - will connect to API)
4. Returns to list view
5. Can click "Cancel" to return to list without saving

## State Management

Currently using React useState for local state. Future integration will:
- Fetch organisation parts from backend API
- Create/Update/Delete via backend API
- Handle loading and error states properly

## Next Steps (Backend Integration)

1. Create API client for organisation parts endpoints
2. Replace mock data with actual API calls
3. Handle OAuth token in API requests
4. Add proper error handling and user feedback
5. Implement loading states during API calls
6. Add success messages after operations
