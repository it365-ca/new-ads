import React, { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { useCustomAuth } from "./hooks/useCustomAuth"
import { CustomLoginPage } from "./components/CustomLoginPage"
import { ResetPasswordPage } from "./components/ResetPasswordPage"
import { CompleteRegistrationPage } from "./components/CompleteRegistrationPage"
import { CreateFirstAdmin } from "./components/CreateFirstAdmin"
import { EnrollmentDashboard } from "./components/EnrollmentDashboard"
import { PublicEnrollmentPage } from "./components/PublicEnrollmentPage"
import { StatsSamplePage } from "./components/StatsSamplePage"
import { IntervenantsManagement } from "./components/IntervenantsManagement"
import { SupportButton } from "./components/SupportButton"
import { AdminTicketsDashboard } from "./components/AdminTicketsDashboard"
import { ChatInterface } from "./components/ChatInterface"
import { NotificationBell } from "./components/NotificationBell"
import { AuditTrailModal } from "./components/AuditTrailModal"
import { ThemeCustomizer } from "./components/ThemeCustomizer"
import { DailyAttendanceSheet } from "./components/DailyAttendanceSheet"
import { CreateTestStudent } from "./pages/CreateTestStudent"
import { useThemeContext } from "./contexts/ThemeContext"
import { lumi } from "./lib/lumi"
import { useEnrollments } from "./hooks/useEnrollments"

type TabType = "dashboard" | "presence" | "administration" | "tickets" | "chat" | "support"

function MainApp() {
  const navigate = useNavigate()
  const { user, isAuthenticated, signOut, isLoading: authLoading } = useCustomAuth()
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [openNewStudentForm, setOpenNewStudentForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isSeeding, setIsSeeding] = useState(false)
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false)
  const themeContext = useThemeContext()
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const { enrollments } = useEnrollments()
  
  // États pour le modal de prévisualisation du transfert
  const [showTransferPreview, setShowTransferPreview] = useState(false)
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false)
  const [selectedVirtualProfile, setSelectedVirtualProfile] = useState<any>(null)
  const [transferPreviewData, setTransferPreviewData] = useState<{
    virtualProfile: any
    targetStudent: any
    notesToTransfer: any[]
    documentsToTransfer: any[]
    fieldsToMerge: { field: string; virtualValue: any; currentValue: any }[]
  } | null>(null)

  // ... keep existing code

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: { style: { background: "#10b981" } },
          error: { style: { background: "#ef4444" } }
        }}
      />

      <Routes>
        {/* ... keep existing routes */}
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  )
}

export default App