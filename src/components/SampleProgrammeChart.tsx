import React, { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

interface SampleProgrammeChartProps {
  enrollments: any[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  selectedProgramme: string
}

const COLORS = [
  "#6366F1", // Indigo - OPTION
  "#10B981", // Green - ALT
  "#F59E0B", // Orange - Suivis Estivaux
  "#EF4444", // Red - SAUTS
  "#8B5CF6", // Purple - APOSTROPHE
  "#EC4899"  // Pink - PIVOT
]

const PROGRAM_ORDER = ["OPTION", "ALT", "Suivis Estivaux", "SAUTS", "APOSTROPHE", "PIVOT"]

export const SampleProgrammeChart: React.FC<SampleProgrammeChartProps> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth,
  selectedProgramme
}) => {
  const chartData = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    const stats: Record<string, number> = {}
    
    let filtered = enrollments.filter(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      return entryDate >= startDate && entryDate <= endDate && e.prenom !== "" && (e.status === "actif" || e.status === "ferme")
    })
    
    if (selectedProgramme !== "tous") {
      filtered = filtered.filter(e => e.programme === selectedProgramme)
    }
    
    filtered.forEach(e => {
      stats[e.programme] = (stats[e.programme] || 0) + 1
    })
    
    const data = PROGRAM_ORDER
      .filter(prog => stats[prog] > 0)
      .map((prog, index) => ({
        name: prog,
        value: stats[prog],
        color: COLORS[index % COLORS.length],
        percentage: ((stats[prog] / filtered.length) * 100).toFixed(0)
      }))
    
    const total = filtered.length
    
    return { data, total }
  }, [enrollments, startYear, startMonth, endYear, endMonth, selectedProgramme])

  const renderCustomLabel = (entry: any) => {
    return `${entry.name} ${entry.percentage}%`
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🎯</span>
        <h2 className="text-2xl font-bold text-gray-900">Répartition par programme</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique circulaire */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}>
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Légende avec détails */}
        <div className="flex flex-col justify-center space-y-4">
          {chartData.data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-semibold text-gray-900">{entry.name}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{entry.value}</div>
                <div className="text-sm text-gray-500">{entry.percentage}%</div>
              </div>
            </div>
          ))}
          
          {/* Total */}
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
            <div className="text-center">
              <div className="text-sm text-indigo-600 font-medium uppercase tracking-wide mb-1">
                Total des inscriptions
              </div>
              <div className="text-4xl font-bold text-indigo-900">
                {chartData.total}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}