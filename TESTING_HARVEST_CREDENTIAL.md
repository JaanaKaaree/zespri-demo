# Testing Harvest Collection Credential

This guide explains how to test the creation of harvest collection credentials through both the UI and API.

## Prerequisites

1. **Environment Setup**
   - Ensure all environment variables are configured (see `ENV_CONFIGURATION.md`)
   - Backend and frontend servers are running
   - Redis is running (if using Redis for sessions)

2. **Required Environment Variables**
   ```bash
   # Backend (.env)
   MATTR_API_URL=https://api.mattr.global
   MATTR_CLIENT_ID=your-client-id
   MATTR_CLIENT_SECRET=your-client-secret
   MATTR_COLLECTION_CREDENTIAL_TEMPLATE_ID=your-template-id
   JWT_SECRET=your-jwt-secret
   ```

3. **Start Services**
   ```bash
   # Terminal 1: Start Redis (if using Docker)
   docker-compose up -d redis

   # Terminal 2: Start Backend
   cd backend
   npm run start:dev

   # Terminal 3: Start Frontend
   cd frontend
   npm run dev
   ```

## Testing via UI

### Step 1: Login

1. Navigate to `http://localhost:3000`
2. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `password123`

### Step 2: Navigate to Collection Credentials

1. Go to `http://localhost:3000/issuance/collection`
2. You should see the Collection Credentials page with an empty list (or existing credentials)

### Step 3: Create a Collection Credential

1. Click **"Create Collection Credential"** button
2. Fill in the form:

   **Organisation & Orchard:**
   - Enter NZBN (13 digits): `9429000000123`
   - Click "Load Organisation Parts"
   - Select an organisation part from the dropdown
   - This will auto-populate NZBN and Orchard ID

   **Bin and Row Identifiers:**
   - Bin Identifier: `BIN-20250110-001`
   - Row Identifier: `9429000001001-ROW-AA`

   **Harvest Dates:**
   - Harvest Start Datetime: Select a date/time (e.g., `2025-12-23 07:35`)
   - Harvest End Datetime: Optional, can be set later (e.g., `2025-12-23 09:35`)

   **Picker Information:**
   - Picker ID: `483472834`
   - Picker Name: `John Doe`

   **Recipient (Optional):**
   - Recipient DID: (optional)
   - Recipient Email: (optional)

3. Click **"Create Credential"**

### Step 4: Verify Creation

1. You should see a success message
2. The credential should appear in the list
3. Collection ID should be auto-generated in format: `COL-YYYYMMDD-XXXXXX`
4. Status should be `pending`

### Step 5: View Credential Details

1. Click **"View"** on a credential
2. Verify all fields are displayed correctly
3. You can update the harvest end datetime if not set

### Step 6: Issue Credential

1. From the detail page, click **"Issue Credential"** (if status is pending)
2. Status should change to `issued`

## Testing via API (Postman/curl)

### Step 1: Get Authentication Token

```bash
# Login to get JWT token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "email": "admin@example.com"
    },
    "sessionId": "session-id-here"
  }
}
```

Save the `access_token` for subsequent requests.

### Step 2: Create Collection Credential

```bash
curl -X POST http://localhost:3001/issuance/collection/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "binIdentifier": "BIN-20250110-001",
    "rowIdentifier": "9429000001001-ROW-AA",
    "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
    "harvestEndDatetime": "2025-12-23T09:35:00+11:00",
    "pickerId": "483472834",
    "pickerName": "John Doe",
    "nzbn": "9429000000123",
    "orchardId": "9429000001001",
    "recipientEmail": "recipient@example.com"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "id": "cred-1234567890",
    "collectionId": "COL-20251223-000001",
    "binIdentifier": "BIN-20250110-001",
    "rowIdentifier": "9429000001001-ROW-AA",
    "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
    "harvestEndDatetime": "2025-12-23T09:35:00+11:00",
    "pickerId": "483472834",
    "pickerName": "John Doe",
    "nzbn": "9429000000123",
    "orchardId": "9429000001001",
    "status": "pending",
    "credentialId": "cred-id-1234567890",
    "issuanceUrl": "https://api.mattr.global/credentials/1234567890",
    "createdAt": "2025-12-23T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  }
}
```

### Step 3: Get Collection Credential

```bash
curl -X GET http://localhost:3001/issuance/collection/cred-1234567890 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 4: List Collection Credentials

```bash
# List all credentials
curl -X GET http://localhost:3001/issuance/collection \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter by status
curl -X GET "http://localhost:3001/issuance/collection?status=pending" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter by NZBN
curl -X GET "http://localhost:3001/issuance/collection?nzbn=9429000000123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 5: Update Collection Credential

```bash
curl -X PUT http://localhost:3001/issuance/collection/cred-1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "harvestEndDatetime": "2025-12-23T10:35:00+11:00"
  }'
```

### Step 6: Issue Collection Credential

```bash
curl -X POST http://localhost:3001/issuance/collection/cred-1234567890/issue \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing with Postman

### Collection Setup

1. **Create a new Postman Collection**: "Harvest Collection Credentials"

2. **Set Collection Variables:**
   - `base_url`: `http://localhost:3001`
   - `token`: (will be set after login)

3. **Create Requests:**

   **Login Request:**
   - Method: `POST`
   - URL: `{{base_url}}/auth/login`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```
   - Tests (to save token):
     ```javascript
     if (pm.response.code === 201) {
       const jsonData = pm.response.json();
       pm.collectionVariables.set("token", jsonData.data.access_token);
     }
     ```

   **Create Collection Credential:**
   - Method: `POST`
   - URL: `{{base_url}}/issuance/collection/create`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Content-Type`: `application/json`
   - Body (raw JSON):
     ```json
     {
       "binIdentifier": "BIN-20250110-001",
       "rowIdentifier": "9429000001001-ROW-AA",
       "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
       "harvestEndDatetime": "2025-12-23T09:35:00+11:00",
       "pickerId": "483472834",
       "pickerName": "John Doe",
       "nzbn": "9429000000123",
       "orchardId": "9429000001001"
     }
     ```

   **Get Collection Credential:**
   - Method: `GET`
   - URL: `{{base_url}}/issuance/collection/:id`
   - Headers: `Authorization: Bearer {{token}}`

   **List Collection Credentials:**
   - Method: `GET`
   - URL: `{{base_url}}/issuance/collection`
   - Headers: `Authorization: Bearer {{token}}`

   **Issue Credential:**
   - Method: `POST`
   - URL: `{{base_url}}/issuance/collection/:id/issue`
   - Headers: `Authorization: Bearer {{token}}`

## Sample Test Data

### Valid Test Cases

**Test Case 1: Complete Credential**
```json
{
  "binIdentifier": "BIN-20250110-001",
  "rowIdentifier": "9429000001001-ROW-AA",
  "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
  "harvestEndDatetime": "2025-12-23T09:35:00+11:00",
  "pickerId": "483472834",
  "pickerName": "John Doe",
  "nzbn": "9429000000123",
  "orchardId": "9429000001001"
}
```

**Test Case 2: Without End Datetime (can be added later)**
```json
{
  "binIdentifier": "BIN-20250110-002",
  "rowIdentifier": "9429000001001-ROW-BB",
  "harvestStartDatetime": "2025-12-23T08:00:00+11:00",
  "pickerId": "483472835",
  "pickerName": "Jane Smith",
  "nzbn": "9429000000123",
  "orchardId": "9429000001001"
}
```

**Test Case 3: With Recipient**
```json
{
  "binIdentifier": "BIN-20250110-003",
  "rowIdentifier": "9429000001001-ROW-CC",
  "harvestStartDatetime": "2025-12-23T09:00:00+11:00",
  "harvestEndDatetime": "2025-12-23T11:00:00+11:00",
  "pickerId": "483472836",
  "pickerName": "Bob Johnson",
  "nzbn": "9429000000123",
  "orchardId": "9429000001001",
  "recipientEmail": "recipient@example.com"
}
```

### Invalid Test Cases (Should Fail)

**Test Case 1: Missing Required Field**
```json
{
  "rowIdentifier": "9429000001001-ROW-AA",
  "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
  "pickerId": "483472834",
  "pickerName": "John Doe",
  "nzbn": "9429000000123",
  "orchardId": "9429000001001"
}
```
Expected: 400 Bad Request - "binIdentifier should not be empty"

**Test Case 2: Invalid NZBN Format**
```json
{
  "binIdentifier": "BIN-20250110-001",
  "rowIdentifier": "9429000001001-ROW-AA",
  "harvestStartDatetime": "2025-12-23T07:35:00+11:00",
  "pickerId": "483472834",
  "pickerName": "John Doe",
  "nzbn": "12345",
  "orchardId": "9429000001001"
}
```
Expected: 400 Bad Request - "NZBN must be exactly 13 digits"

**Test Case 3: End Date Before Start Date**
```json
{
  "binIdentifier": "BIN-20250110-001",
  "rowIdentifier": "9429000001001-ROW-AA",
  "harvestStartDatetime": "2025-12-23T09:35:00+11:00",
  "harvestEndDatetime": "2025-12-23T07:35:00+11:00",
  "pickerId": "483472834",
  "pickerName": "John Doe",
  "nzbn": "9429000000123",
  "orchardId": "9429000001001"
}
```
Expected: 400 Bad Request - "Harvest end datetime must be after harvest start datetime"

## Expected Behavior

### Collection ID Generation

- Format: `COL-YYYYMMDD-XXXXXX`
- Example: `COL-20251223-000001`
- Auto-increments per day
- Resets daily

### Status Flow

1. **pending** - Credential created, not yet issued
2. **issued** - Credential issued via MATTR
3. **failed** - Credential issuance failed

### MATTR Integration

- On credential creation, the system:
  1. Generates Collection ID (if not provided)
  2. Validates all required fields
  3. Calls MATTR API to create credential
  4. Stores credential locally
  5. Returns credential with MATTR response

## Troubleshooting

### Issue: "MATTR client credentials not configured"

**Solution:**
- Check that `MATTR_CLIENT_ID` and `MATTR_CLIENT_SECRET` are set in `.env`
- Verify credentials are correct

### Issue: "Failed to obtain MATTR access token"

**Solution:**
- Verify `MATTR_TOKEN_URL` is correct
- Check `MATTR_CLIENT_ID` and `MATTR_CLIENT_SECRET`
- Verify network connectivity to MATTR API
- Check backend logs for detailed error messages

### Issue: "Invalid Collection ID format"

**Solution:**
- Collection ID must match format: `COL-YYYYMMDD-XXXXXX`
- If providing manually, ensure correct format
- Otherwise, let system auto-generate

### Issue: "NZBN OAuth token not found"

**Solution:**
- This is expected if you haven't connected NZBN account
- For testing, you can manually enter NZBN and Orchard ID
- Or complete NZBN OAuth flow first

### Issue: "Credential not found"

**Solution:**
- Verify credential ID is correct
- Check if credential was created successfully
- Note: Credentials are stored in-memory (will be lost on server restart)

### Issue: Validation Errors

**Solution:**
- Check all required fields are provided
- Verify date formats (ISO 8601)
- Ensure NZBN is exactly 13 digits
- Check harvest end datetime is after start datetime

## Debugging Tips

1. **Check Backend Logs:**
   ```bash
   # Backend logs will show:
   # - MATTR token requests
   # - Credential creation attempts
   # - API calls and responses
   ```

2. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Check Console for errors
   - Check Network tab for API calls

3. **Verify MATTR Token:**
   - Check backend logs for "Successfully obtained MATTR access token"
   - Token is cached, so you may not see a request for every API call

4. **Test MATTR Connection:**
   - Verify MATTR API URL is accessible
   - Test OAuth token endpoint separately
   - Check MATTR platform dashboard for API usage

## Next Steps

After successful testing:

1. **Production Setup:**
   - Replace in-memory storage with database
   - Configure production MATTR credentials
   - Set up proper error monitoring
   - Implement credential persistence

2. **Integration Testing:**
   - Test with real MATTR platform
   - Verify credential issuance flow
   - Test credential verification

3. **Performance Testing:**
   - Test with multiple concurrent requests
   - Verify token caching works correctly
   - Test with large datasets
