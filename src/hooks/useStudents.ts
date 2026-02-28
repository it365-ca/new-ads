import { useState, useEffect, useCallback } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

export interface Student {
  _id: string
  firstName: string
  lastName: string
  email: string
  studentId: string
  dateOfBirth: string
  major: string
  enrollmentYear: number
  status: "active" | "graduated" | "suspended" | "withdrawn"
  gpa: number
  phoneNumber?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchStudents = useCallback(async (options?: {
    filter?: Record<string, any>
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  }) => {
    setLoading(true)
    try {
      const { list, total } = await lumi.entities.students.list(options || {})
      setStudents(list as Student[])
      setTotal(total)
    } catch (error) {
      console.error("Erreur lors de la récupération des étudiants:", error)
      toast.error("Échec du chargement des étudiants")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const createStudent = async (data: Omit<Student, "_id" | "createdAt" | "updatedAt">) => {
    try {
      const newStudent = await lumi.entities.students.create({
        ...data,
        creator: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      toast.success("Étudiant créé avec succès")
      await fetchStudents()
      return newStudent
    } catch (error) {
      console.error("Erreur lors de la création:", error)
      toast.error("Échec de la création de l'étudiant")
      throw error
    }
  }

  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      const updated = await lumi.entities.students.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      })
      toast.success("Étudiant mis à jour avec succès")
      await fetchStudents()
      return updated
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast.error("Échec de la mise à jour")
      throw error
    }
  }

  const deleteStudent = async (id: string) => {
    try {
      await lumi.entities.students.delete(id)
      toast.success("Étudiant supprimé avec succès")
      await fetchStudents()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Échec de la suppression")
      throw error
    }
  }

  return {
    students,
    total,
    loading,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent
  }
}
