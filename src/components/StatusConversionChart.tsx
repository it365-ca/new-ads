import React, { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface StatusConversionChartProps {
  enrollments: any[]
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
}

const STATUS_COLORS = {
  "actif": "#10B981",      // Green
  "ferme": "#6B7280",      // Gray
  "en_attente": "#F59E0B", // Orange
  "refuse": "#EF4444"      // Red
}

const STATUS_LABELS = {
  "actif": "Actifs",
  "ferme": "Fermés",
  "en_attente": "En attente",
  "refuse": "Refusés"
}

export const StatusConversionChart: React.FC<StatusConversionChartProps> = ({
  enrollments,
  startYear,
  startMonth,
  endYear,
  endMonth
}) => {
  const chartData = useMemo(() => {
    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    const statusCount: Record<string, number> = {
      actif: 0,
      ferme: 0,
      en_attente: 0,
      refuse: 0
    }
    
    const filtered = enrollments.filter(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      return entryDate >= startDate && entryDate <= endDate
    })
    
    filtered.forEach(e => {
      if (statusCount[e.status] !== undefined) {
        statusCount[e.status]++
      }
    })
    
    const total = filtered.length
    
    return Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
        value: count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
      }))
  }, [enrollments, startYear, startMonth, endYear, endMonth])

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🎯</span>
        <h2 className="text-2xl font-bold text-gray-900">Répartition par statut</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#FFFFFF", 
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}