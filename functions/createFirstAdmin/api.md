# API Information

Function URL: https://api.lumi.new/v1/functions/p384255179950706688/createFirstAdmin

## Description
Crée le premier compte administrateur avec des credentials prédéfinis.

## Request
- Method: POST
- Headers: Content-Type: application/json
- Body: {}

## Response
```json
{
  "success": true,
  "message": "Admin créé avec succès !",
  "credentials": {
    "email": "admin@benado.com",
    "password": "Admin123!"
  }
}
```
