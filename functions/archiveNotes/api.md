# API Information - Archive Notes

## Function URL

```
https://api.lumi.new/v1/functions/p384255179950706688/archiveNotes
```

## Description

Cette fonction Deno effectue deux opérations :

1. **Tâche cron automatique** : S'exécute tous les jours à 2h du matin UTC
   - Archive automatiquement les notes avec `status: "ferme"` datant de plus de 30 jours
   - Change leur statut vers `"supprime"` (corbeille)

2. **Endpoint HTTP** : Permet de déclencher l'archivage manuellement via POST

## Scheduled Task

- **Fréquence** : Quotidienne à 02:00 UTC
- **Logique** : 
  - Recherche les notes avec `status === "ferme"` ET `updatedAt < (aujourd'hui - 30 jours)`
  - Met à jour leur statut vers `"supprime"`
  - Log du nombre de notes archivées

## Manual Trigger

### Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your-api-key>"
}
```

### Request Body

```json
{}
```

Aucun paramètre requis. La fonction exécute la même logique que la tâche cron.

### Response (Success)

```json
{
  "success": true,
  "message": "Successfully archived 5 closed notes",
  "archived": 5
}
```

### Response (No Notes)

```json
{
  "success": true,
  "message": "No notes to archive",
  "archived": 0
}
```

### Response (Error)

```json
{
  "error": "Error message"
}
```

## Usage Example (cURL)

```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/archiveNotes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -d '{}'
```

## Environment Variables

Les variables suivantes sont automatiquement injectées par la plateforme Lumi :

- `PROJECT_ID` : ID du projet
- `API_BASE_URL` : URL de base de l'API Lumi
- `LUMI_API_KEY` : Clé d'API pour l'authentification

## Monitoring

Consultez les logs Deno pour suivre l'exécution :
- `🔄 Starting automatic archiving...` : Début de l'archivage
- `✅ Successfully archived X notes` : Succès
- `❌ Error during archiving` : Erreur (retry automatique via backoffSchedule)
