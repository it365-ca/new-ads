# API: Update Intervenants Prénom

## Description
Met à jour automatiquement les intervenants existants pour séparer le nom complet en prénom et nom.

## Endpoint
```
POST /functions/updateIntervenantsPrenom
```

## Authentification
Requiert un token d'authentification Lumi valide dans le header `Authorization`.

## Request
```json
POST /functions/updateIntervenantsPrenom
Headers:
  Authorization: Bearer <token>
```

## Response Success
```json
{
  "success": true,
  "message": "5 intervenants mis à jour",
  "updates": [
    {
      "id": "693162c42a05c171332d314d",
      "ancien": "Marc François Auger",
      "nouveau": {
        "prenom": "Marc",
        "nom": "François Auger"
      }
    }
  ]
}
```

## Logique de séparation
- **1 mot**: nom = mot, prenom = mot
- **2 mots**: prenom = premier mot, nom = deuxième mot
- **3+ mots**: prenom = premier mot, nom = tous les mots suivants

## Exemples
- "Marc François Auger" → Prénom: "Marc", Nom: "François Auger"
- "Mélanie Côté" → Prénom: "Mélanie", Nom: "Côté"
- "Roxanne Brosseau" → Prénom: "Roxanne", Nom: "Brosseau"
- "Josée Lacoursère" → Prénom: "Josée", Nom: "Lacoursère"
