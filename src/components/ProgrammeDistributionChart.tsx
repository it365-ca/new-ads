import React, { useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ProgrammeDistributionChartProps {
  enrollments: any[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export const ProgrammeDistributionChart: React.FC<ProgrammeDistributionChartProps> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth
}) => {
  const chartData = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    const stats: Record<string, number> = {}
    
    enrollments.forEach(e => {
      // Filtre par statut (exclure en_attente)
      if (e.status !== "actif" && e.status !== "ferme") {
        return
      }
      
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        stats[e.programme] = (stats[e.programme] || 0) + 1
      }
    })
    
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [enrollments, startYear, startMonth, endYear, endMonth])

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🎯 Répartition par programme
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique */}
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Légende détaillée */}
        <div className="flex flex-col justify-center">
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1)
              return (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-indigo-700 font-medium">Total des inscriptions</div>
              <div className="text-3xl font-bold text-indigo-900 mt-1">{total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
