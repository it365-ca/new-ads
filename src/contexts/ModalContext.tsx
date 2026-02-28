import React, { createContext, useContext, useState, useCallback } from "react"
import { GlobalModal, ModalType } from "../components/GlobalModal"

interface ModalState {
  show: boolean
  type: ModalType
  title?: string
  message: string
  autoClose?: boolean
  autoCloseDelay?: number
  onConfirm?: () => void
  onCancel?: () => void
}

interface ModalContextType {
  showModal: (type: ModalType, message: string, title?: string, autoClose?: boolean, autoCloseDelay?: number) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  loading: (message: string, title?: string) => void
  confirm: (message: string, title?: string, onConfirm?: () => void, onCancel?: () => void) => void
  hideModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    type: "info",
    message: "",
    autoClose: true,
    autoCloseDelay: 3000
  })

  const showModal = useCallback((
    type: ModalType,
    message: string,
    title?: string,
    autoClose: boolean = true,
    autoCloseDelay: number = 3000
  ) => {
    setModalState({
      show: true,
      type,
      message,
      title,
      autoClose,
      autoCloseDelay
    })
  }, [])

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, show: false }))
  }, [])

  const success = useCallback((message: string, title?: string) => {
    showModal("success", message, title)
  }, [showModal])

  const error = useCallback((message: string, title?: string) => {
    showModal("error", message, title)
  }, [showModal])

  const warning = useCallback((message: string, title?: string) => {
    showModal("warning", message, title)
  }, [showModal])

  const info = useCallback((message: string, title?: string) => {
    showModal("info", message, title)
  }, [showModal])

  const loading = useCallback((message: string, title?: string) => {
    showModal("loading", message, title, false)
  }, [showModal])

  const confirm = useCallback((message: string, title?: string, onConfirm?: () => void, onCancel?: () => void) => {
    setModalState({
      show: true,
      type: "warning",
      message,
      title,
      autoClose: false,
      onConfirm,
      onCancel
    })
  }, [])

  return (
    <ModalContext.Provider value={{ showModal, success, error, warning, info, loading, confirm, hideModal }}>
      {children}
      <GlobalModal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        autoClose={modalState.autoClose}
        autoCloseDelay={modalState.autoCloseDelay}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
