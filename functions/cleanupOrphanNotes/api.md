# API: cleanupOrphanNotes

## Description
Supprime définitivement toutes les notes orphelines (notes dont l'enrollmentId ne correspond plus à un étudiant existant).

## Endpoint
`POST https://api.lumi.new/v1/functions/p384255179950706688/cleanupOrphanNotes`

## Méthode HTTP
POST

## Paramètres
Aucun

## Réponse
```json
{
  "success": true,
  "message": "Deleted 14 orphan notes",
  "deletedIds": ["id1", "id2", ...]
}
```

## Usage
Fonction utilitaire à appeler une seule fois pour nettoyer la base de données.
