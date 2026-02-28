import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"

export interface Course {
  _id: string
  courseName: string
  courseCode: string
  credits: number
  semester: "Fall" | "Spring" | "Summer"
  instructor: string
  description?: string
  maxStudents?: number
  createdAt: string
  updatedAt: string
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCourses = async (options?: {
    filter?: Record<string, any>
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  }) => {
    setLoading(true)
    try {
      const { list, total } = await lumi.entities.courses.list(options || {})
      setCourses(list as Course[])
      setTotal(total)
    } catch (error) {
      console.error("Erreur lors de la récupération des cours:", error)
      toast.error("Échec du chargement des cours")
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async (data: Omit<Course, "_id" | "createdAt" | "updatedAt">) => {
    try {
      const newCourse = await lumi.entities.courses.create({
        ...data,
        creator: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      toast.success("Cours créé avec succès")
      await fetchCourses()
      return newCourse
    } catch (error) {
      console.error("Erreur lors de la création:", error)
      toast.error("Échec de la création du cours")
      throw error
    }
  }

  const updateCourse = async (id: string, data: Partial<Course>) => {
    try {
      const updated = await lumi.entities.courses.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      })
      toast.success("Cours mis à jour avec succès")
      await fetchCourses()
      return updated
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast.error("Échec de la mise à jour")
      throw error
    }
  }

  const deleteCourse = async (id: string) => {
    try {
      await lumi.entities.courses.delete(id)
      toast.success("Cours supprimé avec succès")
      await fetchCourses()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Échec de la suppression")
      throw error
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  return {
    courses,
    total,
    loading,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse
  }
}
