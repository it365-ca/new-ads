# API - Auto Close Tickets

## Description
Fonction serverless Deno qui ferme automatiquement les tickets résolus après 30 jours.

## Fonctionnalités
- **Tâche cron automatique** : S'exécute tous les jours à 2h UTC
- **Déclenchement manuel** : Peut être appelée via HTTP pour tester ou forcer l'exécution
- **Fermeture conditionnelle** : Ferme uniquement les tickets avec statut "Résolu" datant de plus de 30 jours

## Endpoint

### POST /functions/autoCloseTickets
Déclenche manuellement la fermeture des tickets résolus

**Request:**
```http
POST https://api.lumi.new/v1/functions/<project_id>/autoCloseTickets
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "message": "3 ticket(s) fermé(s) automatiquement",
  "closedCount": 3,
  "totalTickets": 45
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Erreur API: Unauthorized"
}
```

## Logique de fermeture

1. **Récupération** : Charge tous les tickets depuis la base
2. **Filtrage** : Sélectionne les tickets avec `status === "Résolu"`
3. **Vérification temporelle** : Compare `updatedAt` avec la date actuelle - 30 jours
4. **Mise à jour** : Change le statut à "Fermé" pour les tickets éligibles

## Planification Cron

**Expression** : `"0 2 * * *"`
- **Heure** : 02:00 UTC (tous les jours)
- **Fréquence** : Quotidienne
- **Timezone** : UTC

## Variables d'environnement requises

- `LUMI_API_KEY` : Clé API Lumi (auto-fournie)
- `API_BASE_URL` : URL de base de l'API Lumi (auto-fournie)

## Logs

Les logs suivants sont générés :
- `[INFO] Démarrage de la fermeture automatique...`
- `[INFO] X tickets trouvés au total`
- `[INFO] Fermeture du ticket TICKET-XX-XX-XXXX-XXXXX`
- `[SUCCESS] X ticket(s) fermé(s) automatiquement`
- `[ERROR] Erreur lors de la fermeture automatique: ...`

## Test manuel

Pour tester la fonction :
```bash
curl -X POST https://api.lumi.new/v1/functions/<project_id>/autoCloseTickets
```

## Sécurité

- Les tickets fermés ne peuvent plus recevoir de réponses (bloqué dans l'interface)
- La fermeture est irréversible (nécessite intervention admin pour réouvrir)
- Seuls les tickets "Résolu" sont éligibles (les tickets "En cours", "Nouveau", etc. sont ignorés)
