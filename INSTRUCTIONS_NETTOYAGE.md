# Instructions de nettoyage manuel

## Fichiers BACKUP à supprimer

### Composants
```bash
rm src/components/EnrollmentDashboard.BACKUP-2025-01-26.tsx
rm src/components/StickyNotesBoard.BACKUP-2025-01-26.tsx
rm src/components/EnrollmentDashboard.BACKUP-2025-01-25.tsx
rm src/components/StickyNotesBoard.BACKUP-2025-01-25.tsx
rm src/components/EnrollmentDetails.BACKUP-2025-01-25.tsx
rm src/components/EnrollmentDashboard.BACKUP-2025-01-24.tsx
rm src/components/EnrollmentDashboard.BACKUP-SECURE-2024.tsx
rm src/components/EnrollmentDashboard.BACKUP-LATEST.tsx
rm src/components/EnrollmentDashboard.BACKUP-FINAL.tsx
rm src/components/EnrollmentDashboard.BACKUP.tsx
rm src/components/EnrollmentDetails.BACKUP.tsx
rm src/components/ThemeCustomizer.BACKUP.tsx
```

### Hooks
```bash
rm src/hooks/useAllNotes.BACKUP.ts
rm src/hooks/useNotes.BACKUP.ts
rm src/hooks/useTheme.BACKUP.ts
```

### App
```bash
rm src/App.BACKUP-2025-01-25.tsx
```

### Composants non utilisés (Entry points jamais importés)
```bash
rm src/components/AbsenceManagement.tsx
rm src/components/AttendanceStatsDashboard.tsx
rm src/components/CourseList.tsx
rm src/components/CourseForm.tsx
```

## Commande unique

```bash
cd /srv/project/te/xxx-site && \
rm src/components/EnrollmentDashboard.BACKUP-2025-01-26.tsx \
   src/components/StickyNotesBoard.BACKUP-2025-01-26.tsx \
   src/components/EnrollmentDashboard.BACKUP-2025-01-25.tsx \
   src/components/StickyNotesBoard.BACKUP-2025-01-25.tsx \
   src/components/EnrollmentDetails.BACKUP-2025-01-25.tsx \
   src/components/EnrollmentDashboard.BACKUP-2025-01-24.tsx \
   src/components/EnrollmentDashboard.BACKUP-SECURE-2024.tsx \
   src/components/EnrollmentDashboard.BACKUP-LATEST.tsx \
   src/components/EnrollmentDashboard.BACKUP-FINAL.tsx \
   src/components/EnrollmentDashboard.BACKUP.tsx \
   src/components/EnrollmentDetails.BACKUP.tsx \
   src/components/ThemeCustomizer.BACKUP.tsx \
   src/hooks/useAllNotes.BACKUP.ts \
   src/hooks/useNotes.BACKUP.ts \
   src/hooks/useTheme.BACKUP.ts \
   src/App.BACKUP-2025-01-25.tsx \
   src/components/AbsenceManagement.tsx \
   src/components/AttendanceStatsDashboard.tsx \
   src/components/CourseList.tsx \
   src/components/CourseForm.tsx
```

## Total
- **16 fichiers BACKUP**
- **4 composants obsolètes**
- **20 fichiers au total**
