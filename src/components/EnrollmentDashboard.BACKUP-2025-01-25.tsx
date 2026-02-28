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
  const { allNotes, refreshAllNotes } = useAllNotes()
  
  // ... keep existing code
}