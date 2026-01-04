# Testing Guide for NZBN Organisation Parts API

This document provides guidance on testing the NZBN Organisation Parts backend implementation.

## Table of Contents

- [Unit Tests](#unit-tests)
- [Manual Testing](#manual-testing)
- [Integration Testing](#integration-testing)

## Unit Tests

Run the unit tests using Jest:

```bash
cd backend
npm test -- organisations
```

Or run all tests:

```bash
npm test
```

### Test Files

- `organisations.service.spec.ts` - Tests for the service layer
- `organisations.controller.spec.ts` - Tests for the controller layer
- `guards/oauth-token.guard.spec.ts` - Tests for the OAuth token guard

## Manual Testing

### Prerequisites

1. Start the backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Obtain an OAuth token from the NZBN API (three-legged OAuth flow)
   - You'll need to complete the OAuth authorization flow with NZBN
   - Store the access token for use in API calls

3. Set environment variables (if different from defaults):
   ```bash
   NZBN_API_URL=https://api.business.govt.nz/sandbox
   ```

### Testing with cURL

#### 1. Create Organisation Part (POST)

```bash
curl -X POST http://localhost:3001/nzbn/organisations/1234567890123/organisation-parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN_HERE" \
  -d '{
    "termsAndConditionsAccepted": true,
    "organisationPart": {
      "name": "Test Organisation Part",
      "function": "FUNCTION",
      "organisationPartStatus": "ACTIVE",
      "addresses": [
        {
          "address1": "123 Test Street",
          "postCode": "1010",
          "countryCode": "NZ",
          "addressType": "POSTAL"
        }
      ]
    }
  }'
```

#### 2. Update Organisation Part (PUT)

```bash
curl -X PUT http://localhost:3001/nzbn/organisations/1234567890123/organisation-parts/OPN123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN_HERE" \
  -d '{
    "name": "Updated Organisation Part Name",
    "organisationPartStatus": "ACTIVE"
  }'
```

#### 3. Delete Organisation Part (DELETE)

```bash
curl -X DELETE http://localhost:3001/nzbn/organisations/1234567890123/organisation-parts/OPN123 \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN_HERE"
```

### Testing with Postman

1. **Create a new Collection**: "NZBN Organisation Parts"

2. **Set Collection Variables**:
   - `base_url`: `http://localhost:3001`
   - `oauth_token`: `YOUR_OAUTH_TOKEN_HERE`
   - `nzbn`: `1234567890123` (example NZBN)
   - `opn`: `OPN123` (example OPN)

3. **Create Request - POST Create Organisation Part**:
   - Method: `POST`
   - URL: `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer {{oauth_token}}`
   - Body (raw JSON):
     ```json
     {
       "termsAndConditionsAccepted": true,
       "organisationPart": {
         "name": "Test Organisation Part",
         "function": "FUNCTION",
         "organisationPartStatus": "ACTIVE"
       }
     }
     ```

4. **Create Request - PUT Update Organisation Part**:
   - Method: `PUT`
   - URL: `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts/{{opn}}`
   - Headers: Same as POST
   - Body (raw JSON):
     ```json
     {
       "name": "Updated Name",
       "organisationPartStatus": "ACTIVE"
     }
     ```

5. **Create Request - DELETE Organisation Part**:
   - Method: `DELETE`
   - URL: `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts/{{opn}}`
   - Headers:
     - `Authorization: Bearer {{oauth_token}}`

### Expected Responses

#### Success Response (POST/PUT)

```json
{
  "opn": "OPN123456789",
  "parentNzbn": "1234567890123",
  "name": "Test Organisation Part",
  "function": "FUNCTION",
  "organisationPartStatus": "ACTIVE",
  ...
}
```

#### Success Response (DELETE)

Status Code: `204 No Content`
No response body.

#### Error Response (Missing/Invalid Token)

Status Code: `401 Unauthorized`
```json
{
  "statusCode": 401,
  "message": "Missing or invalid Authorization header. Expected: Bearer <token>"
}
```

#### Error Response (NZBN API Error)

Status Code: `400 Bad Request` (or appropriate status from NZBN API)
```json
{
  "statusCode": 400,
  "message": "Failed to create organisation part with NZBN API",
  "error": {
    "errorCode": "VALIDATION_ERROR",
    "errorDescription": "Invalid input"
  }
}
```

## Integration Testing

For integration testing with the actual NZBN sandbox API:

1. **Obtain OAuth Credentials**:
   - Register your application with NZBN
   - Complete OAuth 2.0 three-legged authorization flow
   - Obtain access token

2. **Set Up Test Environment**:
   ```bash
   export NZBN_API_URL=https://api.business.govt.nz/sandbox
   export OAUTH_TOKEN=your_token_here
   ```

3. **Run Integration Tests** (if you create them):
   ```bash
   npm run test:e2e
   ```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that the Authorization header is present
   - Ensure the token format is correct: `Bearer <token>`
   - Verify the OAuth token is valid and not expired

2. **502 Bad Gateway**
   - Check that `NZBN_API_URL` is correctly configured
   - Verify network connectivity to the NZBN API
   - Check backend logs for detailed error messages

3. **400 Bad Request**
   - Validate request body against the DTOs
   - Check NZBN API documentation for required fields
   - Review error response for specific validation errors

### Debugging

Enable debug logging:

```bash
export LOG_LEVEL=debug
npm run start:dev
```

Check backend logs in `backend/logs/` directory for detailed request/response information.

## Notes

- The OAuth token is passed through to the NZBN API - this implementation does not validate the token
- The NZBN API will validate the token and return appropriate errors if invalid
- All requests require a valid OAuth token in the Authorization header
- The implementation acts as a proxy, forwarding requests to the NZBN API with the provided token
