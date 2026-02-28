# Reset Password API

**Endpoint**: `POST /functions/v1/resetPassword`

**Purpose**: Réinitialiser le mot de passe avec un token

**Request Body**:
```json
{
  "token": "uuid-token",
  "newPassword": "nouveaumotdepasse123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```
