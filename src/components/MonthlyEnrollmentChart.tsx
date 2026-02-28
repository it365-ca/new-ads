import React, { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MonthlyEnrollmentChartProps {
  enrollments: any[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
}

export const MonthlyEnrollmentChart: React.FC<MonthlyEnrollmentChartProps> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth
}) => {
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { actif: number; ferme: number; total: number }> = {}
    
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    // Initialiser tous les mois de la période
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { actif: 0, ferme: 0, total: 0 }
    }
    
    // Compter les inscriptions par mois
    enrollments.forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      if (entryDate >= startDate && entryDate <= endDate) {
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`
        if (monthlyData[key]) {
          if (e.status === "actif") {
            monthlyData[key].actif++
          } else if (e.status === "ferme") {
            monthlyData[key].ferme++
          }
          monthlyData[key].total++
        }
      }
    })
    
    return Object.entries(monthlyData).map(([key, data]) => ({
      mois: key,
      Actifs: data.actif,
      Fermés: data.ferme,
      Total: data.total
    }))
  }, [enrollments, startYear, startMonth, endYear, endMonth])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📈</span>
        <h2 className="text-2xl font-bold text-gray-900">Évolution mensuelle</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="mois" 
            tick={{ fill: "#6B7280", fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#FFFFFF", 
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Bar dataKey="Actifs" fill="#10B981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Fermés" fill="#6B7280" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}