import React, { useState, useEffect } from "react"
import { useEnrollments } from "../hooks/useEnrollments"
import { useNotes } from "../hooks/useNotes"
import { useDocuments } from "../hooks/useDocuments"
import { useAuth } from "../hooks/useAuth"
import { useAttendances } from "../hooks/useAttendances"
import { CalendarView } from "./CalendarView"
import { AddressAutocomplete } from "./AddressAutocomplete"
import toast from "react-hot-toast"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { useThemeContext } from "../contexts/ThemeContext"
import { formatDate, formatDateTime } from "../utils/dateFormat"

interface Props {
  enrollmentId: string
  onBack: () => void
  onDelete?: () => void
  onTransferClick?: () => void
}

type ViewType = "dashboard" | "fiche" | "notes" | "documents" | "presences"

export const EnrollmentDetails: React.FC<Props> = ({ enrollmentId, onBack, onDelete, onTransferClick }) => {
  // ... keep existing code
}