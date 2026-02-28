# API Information - generateAttendancePDF

Function URL: https://api.lumi.new/v1/functions/p384255179950706688/generateAttendancePDF

## Description
Génère un PDF complet de la feuille de présence d'un étudiant incluant:
- En-tête personnalisé (nom, programme, période)
- Statistiques de présence (jours présents, absents, taux)
- Historique des absences avec motifs et commentaires
- Feuille de présence détaillée jour par jour

## Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your-api-key>"
}
```

## Request Body
```json
{
  "enrollmentId": "string (required)"
}
```

## Response
```json
{
  "success": true,
  "pdf": "base64_encoded_pdf_data",
  "filename": "feuille-presence-Prenom-Nom-2025-01-15.pdf"
}
```

## Usage Example (cURL)
```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/generateAttendancePDF" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"enrollmentId": "enrollment_id_here"}'
```

## Frontend Integration Example
```typescript
const handleExportPDF = async () => {
  try {
    const result = await lumi.functions.invoke('generateAttendancePDF', {
      method: 'POST',
      body: { enrollmentId: enrollment._id }
    })
    
    // Télécharger le PDF
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${result.pdf}`
    link.download = result.filename
    link.click()
    
    toast.success('PDF généré avec succès!')
  } catch (error) {
    toast.error('Erreur lors de la génération du PDF')
  }
}
```
