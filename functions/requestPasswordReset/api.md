# Request Password Reset API

**Endpoint**: `POST /functions/v1/requestPasswordReset`

**Purpose**: Demander un lien de réinitialisation de mot de passe

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Un email de réinitialisation a été envoyé"
}
```
