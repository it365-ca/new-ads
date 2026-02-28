// Base de données locale des villes et codes postaux du Québec (Région Roussillon)
export interface VilleData {
  ville: string
  codesPostaux: string[]
  rues: string[]
}

export const villesQuebec: VilleData[] = [
  {
    ville: "Candiac",
    codesPostaux: ["J5R"],
    rues: ["Boulevard Marie-Victorin", "Boulevard Montcalm", "Rue de Dieppe", "Rue Fourier", "Avenue Lafleur"]
  },
  {
    ville: "Châteauguay",
    codesPostaux: ["J6J", "J6K"],
    rues: ["Boulevard Maple", "Boulevard Salaberry", "Rue Saint-Jean-Baptiste", "Rue Principale", "Avenue Leblanc"]
  },
  {
    ville: "La Prairie",
    codesPostaux: ["J5R"],
    rues: ["Boulevard Taschereau", "Rue Saint-Georges", "Rue Notre-Dame", "Avenue Sainte-Marie", "Rue Victoria"]
  },
  {
    ville: "Mercier",
    codesPostaux: ["J6R"],
    rues: ["Boulevard Saint-Jean-Baptiste", "Rue Principale", "Rue Sainte-Marie", "Montée de la Grande-Ligne", "Rue Hébert"]
  },
  {
    ville: "Napierville",
    codesPostaux: ["J0J"],
    rues: ["Rue Saint-Jacques", "Rue de l'Église", "Rue Principale", "Montée Saint-Cyprien", "Rue Larocque"]
  },
  {
    ville: "Sherrington",
    codesPostaux: ["J0L"],
    rues: ["Rue Principale", "Chemin de l'Église", "Route 202", "Montée Lasalle", "Rue Centrale"]
  },
  {
    ville: "St-Bernard de Lacolle",
    codesPostaux: ["J0J"],
    rues: ["Rue Principale", "Rue de l'Église", "Chemin Odell", "Montée Sainte-Marie", "Route 221"]
  },
  {
    ville: "St-Constant",
    codesPostaux: ["J5A"],
    rues: ["Montée Saint-Régis", "Rue Saint-Pierre", "Boulevard Monchamp", "Rue Sainte-Catherine", "Avenue Brossard"]
  },
  {
    ville: "St-Isidore",
    codesPostaux: ["J0L"],
    rues: ["Rue Principale", "Rang Saint-Régis", "Chemin de l'Église", "Montée Lasalle", "Rue de la Station"]
  },
  {
    ville: "St-Michel",
    codesPostaux: ["J0L"],
    rues: ["Rue Principale", "Rang de la Rivière", "Chemin de l'Église", "Montée Saint-Édouard", "Rue du Parc"]
  },
  {
    ville: "St-Philippe",
    codesPostaux: ["J0L"],
    rues: ["Route Édouard VII", "Rang Saint-Pierre", "Rue Principale", "Montée Saint-Claude", "Chemin de l'Église"]
  },
  {
    ville: "St-Rémi",
    codesPostaux: ["J0L"],
    rues: ["Rue Notre-Dame", "Boulevard Industriel", "Rue Saint-Sauveur", "Rue de la Mairie", "Avenue MacDonald"]
  },
  {
    ville: "Ste-Catherine",
    codesPostaux: ["J5C"],
    rues: ["Boulevard Marie-Victorin", "Rue Brébeuf", "Rue Centrale", "Avenue Saint-Pierre", "Rue Dollard"]
  },
  {
    ville: "Ste-Clotilde",
    codesPostaux: ["J0L"],
    rues: ["Rue Principale", "Rang de l'Église", "Chemin de la Grande-Ligne", "Montée Vipond", "Rue Centrale"]
  },
  {
    ville: "St-Mathieu",
    codesPostaux: ["J0L"],
    rues: ["Chemin de l'Église", "Montée Monette", "Rue Principale", "Rang Sainte-Catherine", "Route 221"]
  },
  {
    ville: "St-Édouard",
    codesPostaux: ["J0L"],
    rues: ["Rue Principale", "Rang Saint-André", "Chemin de l'Église", "Montée Laberge", "Rue du Village"]
  },
  {
    ville: "Hemmingford",
    codesPostaux: ["J0L"],
    rues: ["Rue Frontière", "Route 219", "Chemin Covey Hill", "Rue Principale", "Montée Wilson"]
  },
  {
    ville: "Léry",
    codesPostaux: ["J6N"],
    rues: ["Rue Notre-Dame", "Boulevard Léry", "Rue du Canal", "Avenue Saint-Joseph", "Rue Principale"]
  },
  {
    ville: "Delson",
    codesPostaux: ["J5B"],
    rues: ["Route 132", "Rue Principale", "Boulevard Georges-Gagné", "Rue Champlain", "Avenue Lafleur"]
  }
]

export const searchAddresses = (query: string): string[] => {
  if (!query || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase().trim()
  const suggestions: string[] = []
  
  villesQuebec.forEach(villeData => {
    // Recherche dans les rues
    villeData.rues.forEach(rue => {
      if (rue.toLowerCase().includes(normalizedQuery)) {
        villeData.codesPostaux.forEach(codePostal => {
          suggestions.push(`${rue}, ${villeData.ville}, QC ${codePostal}`)
        })
      }
    })
    
    // Recherche par ville
    if (villeData.ville.toLowerCase().includes(normalizedQuery)) {
      villeData.rues.slice(0, 3).forEach(rue => {
        villeData.codesPostaux.forEach(codePostal => {
          suggestions.push(`${rue}, ${villeData.ville}, QC ${codePostal}`)
        })
      })
    }
  })
  
  return suggestions.slice(0, 5) // Limiter à 5 suggestions
}

export const extractVilleFromAddress = (address: string): string => {
  const match = villesQuebec.find(v => 
    address.toLowerCase().includes(v.ville.toLowerCase())
  )
  return match?.ville || ""
}

export const extractCodePostalFromAddress = (address: string): string => {
  const match = address.match(/[A-Z]\d[A-Z]/i)
  return match ? match[0] : ""
}
