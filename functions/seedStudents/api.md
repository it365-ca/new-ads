# Seed Students Function

Crée 19 étudiants fictifs pour tester les statistiques.

## Endpoint
`POST /functions/v1/seedStudents`

## Authentication
Requiert un header `Authorization` avec un token valide.

## Request
Aucun paramètre requis.

## Response
```json
{
  "success": true,
  "message": "19 étudiants créés avec succès",
  "students": [...]
}
```

## Données générées
- **Programmes**: ALT, OPTION, PIVOT, APOSTROPHE, SAUTS, Suivis Estivaux (répartis équitablement)
- **Villes**: Montreal, Laval, Longueuil, Terrebonne, Brossard, Saint-Jean-sur-Richelieu
- **Écoles**: 6 écoles secondaires différentes
- **Origines**: Canadienne, Haïtienne, Arabe, Africaine, Asiatique du Sud-Est, Latino-Américaine
- **Genres**: Masculin, Féminin (alternés)
- **Âges**: 12-17 ans (aléatoires)
- **Dates d'entrée**: Réparties sur 2024 (différents mois)

## Usage
Appeler cette fonction une seule fois pour générer les données de test.
