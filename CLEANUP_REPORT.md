# Fichiers non utilisés identifiés

## Fichiers BACKUP (7 fichiers)
Ces fichiers sont des sauvegardes obsolètes qui peuvent être supprimés en toute sécurité :

1. `src/App.BACKUP-2025-01-25.tsx` - Ancienne version de App.tsx
2. `src/components/EnrollmentDashboard.BACKUP-2025-01-24.tsx` - Sauvegarde du 24 janvier
3. `src/components/EnrollmentDashboard.BACKUP-2025-01-25.tsx` - Sauvegarde du 25 janvier
4. `src/components/EnrollmentDashboard.BACKUP-2025-01-26.tsx` - Sauvegarde du 26 janvier
5. `src/components/EnrollmentDashboard.BACKUP-FINAL.tsx` - Version finale backup
6. `src/components/EnrollmentDashboard.BACKUP-LATEST.tsx` - Dernière version backup
7. `src/components/EnrollmentDetails.BACKUP-2025-01-25.tsx` - Sauvegarde du 25 janvier

## Instructions de suppression

### Option 1 : Script automatique
```bash
bash cleanup-unused-files.sh
```

### Option 2 : Suppression manuelle
```bash
rm src/App.BACKUP-2025-01-25.tsx
rm src/components/EnrollmentDashboard.BACKUP-2025-01-24.tsx
rm src/components/EnrollmentDashboard.BACKUP-2025-01-25.tsx
rm src/components/EnrollmentDashboard.BACKUP-2025-01-26.tsx
rm src/components/EnrollmentDashboard.BACKUP-FINAL.tsx
rm src/components/EnrollmentDashboard.BACKUP-LATEST.tsx
rm src/components/EnrollmentDetails.BACKUP-2025-01-25.tsx
```

## Fichiers potentiellement non utilisés (à vérifier)

Ces fichiers sont listés comme points d'entrée non importés, mais peuvent être utilisés dynamiquement :

- `src/components/AbsenceManagement.tsx` - À vérifier si utilisé
- `src/components/AttendanceStatsDashboard.tsx` - À vérifier si utilisé
- `src/components/CourseList.tsx` - À vérifier si utilisé

⚠️ **Important** : Vérifiez l'utilisation de ces composants dans App.tsx ou via le routing dynamique avant de les supprimer.

## Espace disque récupéré estimé
Environ 50-100 KB après suppression des fichiers BACKUP.
