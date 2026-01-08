# API Response Standards

All API responses should follow a consistent JSON format to ensure predictability for the frontend and third-party integrations.

## Success Response
HTTP Status Codes: `200 OK`, `201 Created`

```json
{
  "success": true,
  "data": {
    // Response payload
    "id": "123",
    "status": "processed"
  },
  "meta": {
    // Pagination or metadata (optional)
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

## Error Response
HTTP Status Codes: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "resource_not_found",
    "message": "The requested invoice could not be found.",
    "details": {
      // Optional field for validation errors or stack traces (dev only)
      "field": "invoice_id",
      "issue": "Invalid format"
    }
  }
}
```

## Standard Error Codes
- `invalid_input`: Validation failed.
- `unauthorized`: Missing or invalid authentication token.
- `forbidden`: User does not have permission.
- `not_found`: Resource does not exist.
- `internal_error`: Server-side exception.
- `service_unavailable`: External service (e.g., Vertex AI) down.
