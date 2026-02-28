# API Information

Function URL: https://api.lumi.new/v1/functions/p384255179950706688/generateStatsPDF

## Description
Génère un fichier PDF contenant toutes les statistiques du système Benado, incluant les statistiques globales, par programme, par école et les interventions séparées (notes avec suivi et notes sans suivi).

## Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your-api-key>"
}
```

## Request Body
```json
{}
```
Aucun paramètre requis - la fonction récupère automatiquement toutes les données.

## Response
```json
{
  "success": true,
  "pdf": "base64-encoded-pdf-string",
  "filename": "statistiques-benado-2024-01-15.pdf"
}
```

## Usage Example (cURL)
```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/generateStatsPDF" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -d '{}'
```

## Usage Example (JavaScript)
```javascript
const result = await lumi.functions.invoke("generateStatsPDF", {
  method: "POST",
  body: {}
})

// Télécharger le PDF
const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], { type: "application/pdf" })
const url = URL.createObjectURL(blob)
const link = document.createElement("a")
link.href = url
link.download = result.filename
link.click()
```
