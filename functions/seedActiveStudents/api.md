# API seedActiveStudents

## Description
Fonction Deno pour générer 20 étudiants fictifs en statut "actif" sans envoi d'emails de notification.

## Endpoint
POST https://api.lumi.new/v1/functions/p384255179950706688/seedActiveStudents

## Authentication
Requiert un header Authorization avec le token utilisateur Lumi.

## Request Body
```json
{}
```

## Response
```json
{
  "success": true,
  "message": "20 etudiants actifs crees avec succes (pas d'emails envoyes)",
  "count": 20,
  "details": {
    "villes": 19,
    "ecoles": 19,
    "programmes": 6,
    "origines": 11,
    "genres": 3
  }
}
```

## Comportement
- Crée 20 étudiants fictifs en 2 lots de 10
- Statut: "actif" (pas "en_attente")
- Dates d'entrée: entre 1er avril 2024 et 31 mars 2025
- Âges: 9 à 17 ans
- Diversité: villes, écoles, programmes, origines variés
- Pas d'envoi d'emails de notification
