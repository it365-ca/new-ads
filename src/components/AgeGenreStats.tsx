import React, { useMemo } from "react"
import { useThemeContext } from "../contexts/ThemeContext"

interface Enrollment {
  _id: string
  programme: string
  genre: string
  dateNaissance: string
  dateEntree: string
  createdAt: string
  status: string
}

interface Props {
  enrollments: Enrollment[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

export const AgeGenreStats: React.FC<Props> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const { getTableHeaderClass, getTableTotalClass } = useThemeContext()
  
  // Calculer les statistiques d'âge par genre
  const stats = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)

    // Structure: { genre: { age: count } }
    const ageByGenre: Record<string, Record<number, number>> = {
      "Masculin": {},
      "Féminin": {},
      "Autre": {}
    }

    // Créer les âges de 8 à 18 ans
    const allAges = new Set<number>()
    for (let age = 8; age <= 18; age++) {
      allAges.add(age)
    }

    enrollments.forEach(e => {
      // Filtre par statut actif et fermé uniquement (exclure "en_attente" et "refuse")
      if (e.status !== "actif" && e.status !== "ferme") {
        return
      }
      
      // Filtre par programme
      if (selectedProgramme !== "tous" && e.programme !== selectedProgramme) {
        return
      }
      
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        const dateNaissance = new Date(e.dateNaissance)
        const dateEntree = new Date(e.dateEntree)
        
        // Calculer l'âge à la date d'entrée
        const ageAtEntry = dateEntree.getFullYear() - dateNaissance.getFullYear() - 
          (dateEntree.getMonth() < dateNaissance.getMonth() || 
           (dateEntree.getMonth() === dateNaissance.getMonth() && dateEntree.getDate() < dateNaissance.getDate()) ? 1 : 0)

        // Mapping des genres
        let genreKey = "Autre"
        const genreLower = (e.genre || "").toLowerCase()
        if (genreLower.includes("masculin") || genreLower === "m" || genreLower === "homme" || genreLower === "garçon") {
          genreKey = "Masculin"
        } else if (genreLower.includes("féminin") || genreLower === "f" || genreLower === "femme" || genreLower === "fille") {
          genreKey = "Féminin"
        }

        if (!ageByGenre[genreKey]) {
          ageByGenre[genreKey] = {}
        }
        ageByGenre[genreKey][ageAtEntry] = (ageByGenre[genreKey][ageAtEntry] || 0) + 1
      }
    })

    // Trier les âges du plus petit au plus grand (8 à 18 ans)
    const sortedAges = Array.from(allAges).sort((a, b) => a - b)

    // Calculer les totaux par genre
    const genreTotals: Record<string, number> = {}
    Object.keys(ageByGenre).forEach(genre => {
      genreTotals[genre] = Object.values(ageByGenre[genre]).reduce((sum, val) => sum + val, 0)
    })

    // Calculer les totaux par âge
    const ageTotals: Record<number, number> = {}
    sortedAges.forEach(age => {
      let total = 0
      Object.keys(ageByGenre).forEach(genre => {
        total += ageByGenre[genre][age] || 0
      })
      ageTotals[age] = total
    })

    // Calculer le grand total
    const grandTotal = Object.values(genreTotals).reduce((sum, val) => sum + val, 0)

    return { ageByGenre, sortedAges, genreTotals, ageTotals, grandTotal }
  }, [enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  // Ordre d'affichage des genres
  const genreOrder = ["Masculin", "Féminin", "Autre"]

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        👥 Âge des participants par genre {selectedProgramme !== "tous" && `(${selectedProgramme})`}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={getTableHeaderClass()}>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Genre</th>
              {stats.sortedAges.map(age => (
                <th key={age} className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 min-w-[60px]">
                  {age} ans
                </th>
              ))}
              <th className={`border border-gray-300 px-4 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>Total</th>
              <th className={`border border-gray-300 px-4 py-2 text-center font-bold text-gray-900 ${getTableTotalClass()}`}>%</th>
            </tr>
          </thead>
          <tbody>
            {genreOrder.map((genre, idx) => {
              const total = stats.genreTotals[genre] || 0
              const percentage = stats.grandTotal > 0 ? ((total / stats.grandTotal) * 100).toFixed(1) : "0.0"
              
              return (
                <tr key={genre} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{genre}</td>
                  {stats.sortedAges.map(age => {
                    const count = stats.ageByGenre[genre]?.[age] || 0
                    return (
                      <td key={age} className="border border-gray-300 px-3 py-2 text-center text-gray-700">
                        {count > 0 ? count : "0"}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-900 bg-gray-100">
                    {total}
                  </td>
                  <td className={`border border-gray-300 px-4 py-2 text-center font-bold ${getTableHeaderClass()}`}>
                    {percentage}%
                  </td>
                </tr>
              )
            })}
            <tr className={`${getTableTotalClass()} font-bold`}>
              <td className="border border-gray-300 px-4 py-2 text-gray-900">Total</td>
              {stats.sortedAges.map(age => (
                <td key={age} className="border border-gray-300 px-3 py-2 text-center text-gray-900">
                  {stats.ageTotals[age] || 0}
                </td>
              ))}
              <td className={`border border-gray-300 px-4 py-2 text-center text-gray-900 ${getTableTotalClass()}`}>
                {stats.grandTotal}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center text-gray-900">
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
