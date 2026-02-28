#!/bin/bash

# Script de nettoyage des fichiers non utilisés
# Généré automatiquement - Exécuter avec: bash cleanup-unused-files.sh

echo "🧹 Nettoyage des fichiers BACKUP non utilisés..."

# Fichiers BACKUP à supprimer
FILES_TO_DELETE=(
  "src/App.BACKUP-2025-01-25.tsx"
  "src/components/EnrollmentDashboard.BACKUP-2025-01-24.tsx"
  "src/components/EnrollmentDashboard.BACKUP-2025-01-25.tsx"
  "src/components/EnrollmentDashboard.BACKUP-2025-01-26.tsx"
  "src/components/EnrollmentDashboard.BACKUP-FINAL.tsx"
  "src/components/EnrollmentDashboard.BACKUP-LATEST.tsx"
  "src/components/EnrollmentDetails.BACKUP-2025-01-25.tsx"
)

# Compteur
DELETED=0
FAILED=0

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    if [ $? -eq 0 ]; then
      echo "✅ Supprimé: $file"
      ((DELETED++))
    else
      echo "❌ Échec: $file"
      ((FAILED++))
    fi
  else
    echo "⚠️  Fichier introuvable: $file"
  fi
done

echo ""
echo "📊 Résumé du nettoyage:"
echo "   - Fichiers supprimés: $DELETED"
echo "   - Échecs: $FAILED"
echo ""
echo "✨ Nettoyage terminé!"
