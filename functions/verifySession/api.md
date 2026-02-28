# Verify Session API

**Endpoint**: `POST /functions/v1/verifySession`

**Purpose**: Vérifier la validité d'une session

**Request Body**:
```json
{
  "sessionToken": "uuid-session-token"
}
```

**Response**:
```json
{
  "valid": true,
  "user": {
    "userId": "...",
    "email": "...",
    "nom": "...",
    "prenom": "...",
    "permissions": {}
  }
}
```
