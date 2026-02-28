import React from "react"

export type ModalType = "success" | "error" | "warning" | "info" | "loading"

interface GlobalModalProps {
  show: boolean
  type: ModalType
  title?: string
  message: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  onConfirm?: () => void
  onCancel?: () => void
}

export function GlobalModal({
  show,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
  onConfirm,
  onCancel
}: GlobalModalProps) {
  React.useEffect(() => {
    if (show && autoClose && type !== "loading") {
      const timer = setTimeout(() => {
        onClose?.()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [show, autoClose, autoCloseDelay, onClose, type])

  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case "error":
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case "warning":
        return (
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case "loading":
        return (
          <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
      default:
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case "success": return "Succès"
      case "error": return "Erreur"
      case "warning": return "Attention"
      case "loading": return "Chargement..."
      default: return "Information"
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success": return "bg-green-50"
      case "error": return "bg-red-50"
      case "warning": return "bg-yellow-50"
      case "loading": return "bg-blue-50"
      default: return "bg-blue-50"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${getBgColor()}`}>
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {getTitle()}
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              {message}
            </div>
          </div>
        </div>
        {type !== "loading" && (
          <div className="mt-4">
            {onConfirm || onCancel ? (
              <div className="flex gap-3">
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      onCancel()
                      onClose?.()
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors">
                    Annuler
                  </button>
                )}
                {onConfirm && (
                  <button
                    type="button"
                    onClick={() => {
                      onConfirm()
                      onClose?.()
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Confirmer
                  </button>
                )}
              </div>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Fermer
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
