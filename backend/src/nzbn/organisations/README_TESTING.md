# How to Test the NZBN Organisation Parts API

This guide explains how to test the NZBN Organisation Parts backend implementation.

## Quick Start - Manual Testing

### 1. Start the Backend Server

```bash
cd backend
npm run start:dev
```

The server will start on `http://localhost:3001` (or the port specified in your `.env`).

### 2. Get an OAuth Token

You'll need to obtain an OAuth three-legged token from the NZBN API. This typically involves:

1. Registering your application with NZBN
2. Completing the OAuth 2.0 three-legged authorization flow
3. Obtaining an access token

**Note:** The implementation acts as a proxy - it forwards the OAuth token to the NZBN API without validating it.

### 3. Test the Endpoints

#### Option A: Using cURL

**Create Organisation Part (POST):**
```bash
curl -X POST http://localhost:3001/nzbn/organisations/YOUR_NZBN/organisation-parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  -d '{
    "termsAndConditionsAccepted": true,
    "organisationPart": {
      "name": "Test Organisation Part",
      "function": "FUNCTION",
      "organisationPartStatus": "ACTIVE"
    }
  }'
```

**Update Organisation Part (PUT):**
```bash
curl -X PUT http://localhost:3001/nzbn/organisations/YOUR_NZBN/organisation-parts/YOUR_OPN \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  -d '{
    "name": "Updated Name",
    "organisationPartStatus": "ACTIVE"
  }'
```

**Delete Organisation Part (DELETE):**
```bash
curl -X DELETE http://localhost:3001/nzbn/organisations/YOUR_NZBN/organisation-parts/YOUR_OPN \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN"
```

#### Option B: Using Postman

1. Create a new collection: "NZBN Organisation Parts"
2. Add variables:
   - `base_url`: `http://localhost:3001`
   - `oauth_token`: `YOUR_OAUTH_TOKEN`
   - `nzbn`: `YOUR_NZBN_NUMBER`
   - `opn`: `YOUR_OPN_NUMBER`

3. Create three requests:
   - **POST** `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts`
   - **PUT** `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts/{{opn}}`
   - **DELETE** `{{base_url}}/nzbn/organisations/{{nzbn}}/organisation-parts/{{opn}}`

4. For each request, add header:
   - `Authorization: Bearer {{oauth_token}}`
   - `Content-Type: application/json` (for POST/PUT)

### Expected Responses

**Success (POST/PUT):**
- Status: `200 OK` or `201 Created`
- Body: Organisation part object with details

**Success (DELETE):**
- Status: `204 No Content`
- No body

**Error - Missing Token:**
- Status: `401 Unauthorized`
- Message: "Missing or invalid Authorization header. Expected: Bearer <token>"

**Error - NZBN API Error:**
- Status: `400`, `401`, `403`, `404`, or `500` (as returned by NZBN API)
- Body: Error details from NZBN API

## Unit Testing

To run unit tests, you'll need to install test dependencies first:

```bash
cd backend
npm install --save-dev @nestjs/testing @types/jest jest ts-jest
```

Then run tests:

```bash
# Run all tests
npm test

# Run only organisation tests
npm test -- organisations

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

Test files are located in:
- `organisations.service.spec.ts`
- `organisations.controller.spec.ts`
- `guards/oauth-token.guard.spec.ts`

## Configuration

Make sure your `.env` file (or environment variables) includes:

```env
NZBN_API_URL=https://api.business.govt.nz/sandbox
```

If not set, it defaults to `https://api.business.govt.nz/sandbox`.

## Debugging

Enable debug logging:

```bash
export LOG_LEVEL=debug
npm run start:dev
```

Check logs in `backend/logs/` for detailed request/response information.

## Troubleshooting

**401 Unauthorized:**
- Ensure `Authorization: Bearer <token>` header is present
- Verify token format (must start with "Bearer ")
- Check that token is valid (not expired)

**502 Bad Gateway:**
- Check `NZBN_API_URL` configuration
- Verify network connectivity
- Check backend logs for detailed errors

**400 Bad Request:**
- Validate request body structure
- Check required fields in DTOs
- Review error response for validation details

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nzbn/organisations/:nzbn/organisation-parts` | Create organisation part |
| PUT | `/nzbn/organisations/:nzbn/organisation-parts/:opn` | Update organisation part |
| DELETE | `/nzbn/organisations/:nzbn/organisation-parts/:opn` | Delete organisation part |

All endpoints require:
- `Authorization: Bearer <oauth-token>` header
- Valid OAuth token from NZBN API
