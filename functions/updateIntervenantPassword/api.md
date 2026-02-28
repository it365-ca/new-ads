# API Information

Function URL
https://api.lumi.new/v1/functions/p384255179950706688/updateIntervenantPassword
POST JSON payloads to this endpoint.

Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your-api-key>"
}
- Content-Type: required
- Authorization: bearer token

Request Body
{
  "intervenantId": "string (required)",
  "newPassword": "string (required, min 8 chars)",
  "isTemporary": "boolean (optional, default false)"
}

Response
{
  "success": true,
  "message": "Mot de passe mis à jour avec succès"
}

Error Responses
- 400: Missing parameters or invalid password
- 500: Server error

Usage Example (cURL)
```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/updateIntervenantPassword" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -d '{
    "intervenantId": "693da8bbd8920d2588b7ce8f",
    "newPassword": "NewSecurePass123!",
    "isTemporary": false
  }'
```
