# Login Custom API

**Endpoint**: `POST /functions/v1/loginCustom`

**Purpose**: Connexion avec email/password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Response**:
```json
{
  "success": true,
  "sessionToken": "...",
  "user": {
    "userId": "...",
    "email": "...",
    "nom": "...",
    "prenom": "...",
    "permissions": {}
  }
}
```
