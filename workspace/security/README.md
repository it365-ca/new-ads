# Configuration des Permissions MongoDB

## Description

Ce dossier contient les fichiers de configuration des permissions pour les collections MongoDB utilisées dans l'application Benado.

## Pourquoi NO_RESTRICTIONS?

L'application Benado utilise actuellement un système d'authentification personnalisé (backend Express avec JWT) au lieu du système d'authentification Lumi intégré.

Pour permettre l'accès aux collections MongoDB via le SDK Lumi sans utiliser le système d'authentification Lumi, toutes les collections doivent avoir la permission `NO_RESTRICTIONS`.

## Collections Configurées

- `programmes.json` - Gestion des programmes éducatifs
- `students.json` - Profils des étudiants
- `notes.json` - Notes de suivi et interventions
- `enrollments.json` - Inscriptions aux programmes
- `intervenants.json` - Intervenants et administrateurs
- `appointments.json` - Rendez-vous
- `documents.json` - Documents attachés aux dossiers
- `tickets.json` - Tickets de support

## Structure de Fichier

Chaque fichier contient une configuration simple :

```json
{
  "permission": "NO_RESTRICTIONS"
}
```

## Migration Future

Si l'application migre vers le système d'authentification Lumi intégré (`lumi.auth.*`), ces fichiers devront être supprimés ou mis à jour pour utiliser les permissions basées sur les rôles utilisateur.
