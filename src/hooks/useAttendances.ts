import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface Attendance {
  _id: string
  enrollmentId: string
  date: string
  status: "present" | "absent" | "non_marque"
  notes?: string
  motifAbsence?: string
  commentaire?: string
  creator: string
  createdAt: string
  updatedAt: string
}

export const useAttendances = (enrollmentId?: string) => {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttendances = async (filter?: any) => {
    if (!enrollmentId) return
    setLoading(true)
    try {
      const { list } = await lumi.entities.attendances.list({
        filter: { enrollmentId, ...filter },
        sort: { date: 1 }
      })
      setAttendances(list as Attendance[])
    } catch (error) {
      console.error("Failed to fetch attendances:", error)
    } finally {
      setLoading(false)
    }
  }

  const createAttendance = async (data: Omit<Attendance, "_id" | "creator" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newAttendance = await lumi.entities.attendances.create({
      ...data,
      creator: "user",
      createdAt: now,
      updatedAt: now
    })
    setAttendances(prev => [...prev, newAttendance as Attendance].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ))
    return newAttendance
  }

  const updateAttendance = async (id: string, data: Partial<Attendance>) => {
    const updated = await lumi.entities.attendances.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    setAttendances(prev => prev.map(att => 
      att._id === id ? { ...att, ...updated } as Attendance : att
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    return updated
  }

  const deleteAttendance = async (id: string) => {
    await lumi.entities.attendances.delete(id)
    setAttendances(prev => prev.filter(att => att._id !== id))
  }

  useEffect(() => {
    if (enrollmentId) {
      fetchAttendances()
    }
  }, [enrollmentId])

  return {
    attendances,
    loading,
    fetchAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance
  }
}
