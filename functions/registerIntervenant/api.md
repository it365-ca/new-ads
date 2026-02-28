# Register Intervenant API

**Endpoint**: `POST /functions/v1/registerIntervenant`

**Purpose**: Créer un nouvel intervenant avec mot de passe hashé

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "nom": "Doe",
  "prenom": "John",
  "telephone": "514-555-0100",
  "specialite": "Psychologie"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Intervenant créé avec succès",
  "userId": "..."
}
```
