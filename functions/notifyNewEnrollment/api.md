# API Information - Notification Email Inscription

## Function URL

```
https://api.lumi.new/v1/functions/p384255179950706688/notifyNewEnrollment
```

## Description

Envoie une notification email via SMTP (iRedMail) lorsqu'une nouvelle inscription est soumise au système Benado.

## Headers

```json
{
  "Content-Type": "application/json"
}
```

## Request Body

```json
{
  "enrollment": {
    "nom": "Dupont",
    "prenom": "Jean",
    "dateNaissance": "2010-05-15",
    "age": "13",
    "programme": "APOSTROPHE : Difficultés d'adaptation (13-14 ans, 8 semaines)",
    "dateEntree": "2025-01-15",
    "ecoleReferente": "Jacques-Leber",
    "parent1Nom": "Dupont",
    "parent1Email": "parent@example.com",
    "parent1Tel": "(450)555-1234",
    "motifReference": "Difficultés comportementales récurrentes..."
  }
}
```

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Notification email envoyée avec succès"
}
```

### Error (500)

```json
{
  "error": "Service configuration error: Missing SMTP credentials"
}
```

## Environment Variables

```env
SMTP_HOST=smtp.benado.app
SMTP_PORT=587
SMTP_USER=bonjour@it-365.ca
SMTP_PASSWORD=***
SMTP_FROM=Formulaire Benado
```

## Usage Example (cURL)

```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/notifyNewEnrollment" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment": {
      "nom": "Dupont",
      "prenom": "Jean",
      "dateNaissance": "2010-05-15",
      "age": "13",
      "programme": "APOSTROPHE",
      "dateEntree": "2025-01-15",
      "ecoleReferente": "Jacques-Leber",
      "parent1Nom": "Dupont",
      "parent1Email": "parent@example.com",
      "parent1Tel": "(450)555-1234",
      "motifReference": "Difficultés comportementales"
    }
  }'
```

## Email Format

L'email envoyé contient :
- Alerte d'action requise
- Informations complètes de l'élève
- Programme et dates
- Coordonnées du parent/tuteur
- Motif de référence
- Design HTML responsive et professionnel
