import React, { useState, useMemo } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useAllNotes } from "../hooks/useAllNotes"
import { EnrollmentDetails } from "./EnrollmentDetails"
import { EnrollmentForm } from "./EnrollmentForm"
import { StickyNotesBoard } from "./StickyNotesBoard"
import { lumi } from "../lib/lumi"
import toast from "react-hot-toast"
import { formatDate } from "../utils/dateFormat"

interface EnrollmentDashboardProps {
  openFormTrigger?: boolean
  onFormOpenComplete?: () => void
  onInitiateTransfer?: (virtualProfile: any) => void
}

export function EnrollmentDashboard({ openFormTrigger, onFormOpenComplete, onInitiateTransfer }: EnrollmentDashboardProps) {
  const { enrollments, loading, error, refreshEnrollments } = useEnrollments()
  const { notes: allNotes, fetchAllNotes } = useAllNotes()
  
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null)
  const [activeFilter, setActiveFilter] = useState<"tous" | "en_attente" | "actif" | "ferme" | "refuse">("tous")
  const [searchQuery, setSearchQuery] = useState("")
  const [showVirtualProfiles, setShowVirtualProfiles] = useState(false)
  const [showNotesBoard, setShowNotesBoard] = useState(false)
  const [showStatusView, setShowStatusView] = useState<"en_attente" | "actif" | "ferme" | null>(null)
  const [showCreateVirtualModal, setShowCreateVirtualModal] = useState(false)
  const [newVirtualTitle, setNewVirtualTitle] = useState("")
  const [newVirtualProgramme, setNewVirtualProgramme] = useState("")
  const [newVirtualSchool, setNewVirtualSchool] = useState("")

  React.useEffect(() => {
    if (openFormTrigger) {
      setShowForm(true)
      onFormOpenComplete?.()
    }
  }, [openFormTrigger, onFormOpenComplete])

  // ... keep existing code for filtering, stats, etc.
  
  if (showNotesBoard) {
    console.log("❌ Bloqué par showNotesBoard")
    return (
      <StickyNotesBoard
        notes={allNotes}
        enrollments={enrollments}
        onBack={() => setShowNotesBoard(false)}
        onRefresh={fetchAllNotes}
      />
    )
  }

  // ... keep existing code for rest of component
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* ... keep existing JSX */}
    </div>
  )
}
