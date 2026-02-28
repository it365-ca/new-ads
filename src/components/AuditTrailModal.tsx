import React, { useState, useEffect } from "react"
import { useAuditLog } from "../hooks/useAuditLog"
import { useThemeContext } from "../contexts/ThemeContext"

interface AuditTrailModalProps {
  entityId?: string
  entityType?: string
  isOpen: boolean
  onClose: () => void
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ entityId, entityType, isOpen, onClose }) => {
  const { logs, loading, fetchLogs } = useAuditLog()
  const { getCardClass } = useThemeContext()
  const [filter, setFilter] = useState<"all" | "create" | "update" | "delete" | "status_change">("all")

  useEffect(() => {
    if (isOpen) {
      fetchLogs(entityId ? { entityId } : entityType ? { entityType } : {})
    }
  }, [isOpen, entityId, entityType])

  if (!isOpen) return null

  const filteredLogs = filter === "all" ? logs : logs.filter(log => log.action === filter)

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return "➕"
      case "update": return "✏️"
      case "delete": return "🗑️"
      case "status_change": return "🔄"
      case "restore": return "♻️"
      default: return "📝"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800"
      case "update": return "bg-blue-100 text-blue-800"
      case "delete": return "bg-red-100 text-red-800"
      case "status_change": return "bg-purple-100 text-purple-800"
      case "restore": return "bg-teal-100 text-teal-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "enrollment": return "👤"
      case "note": return "📝"
      case "ticket": return "🎫"
      case "intervenant": return "👥"
      case "message": return "💬"
      case "conversation": return "💭"
      default: return "📄"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
        <div className={`${getCardClass()} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">📜 Historique des modifications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {entityId ? `Modifications pour cette entité uniquement` : "Toutes les modifications"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-900 text-2xl">
                ✕
              </button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                📊 Toutes ({logs.length})
              </button>
              <button
                onClick={() => setFilter("create")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "create"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                ➕ Créations
              </button>
              <button
                onClick={() => setFilter("update")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "update"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                ✏️ Modifications
              </button>
              <button
                onClick={() => setFilter("status_change")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "status_change"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                🔄 Changements statut
              </button>
              <button
                onClick={() => setFilter("delete")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "delete"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                🗑️ Suppressions
              </button>
            </div>
          </div>

          {/* Liste des logs */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-3">📭</div>
                <p>Aucune modification enregistrée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      {/* Icône action */}
                      <div className={`px-3 py-2 rounded-lg ${getActionColor(log.action)} font-semibold flex-shrink-0`}>
                        {getActionIcon(log.action)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              {getEntityIcon(log.entityType)}
                              <span className="capitalize">{log.action}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-indigo-600">{log.entityType}</span>
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Par <strong>{log.userName}</strong> ({log.userEmail})
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">
                              {formatDate(log.timestamp)}
                            </p>
                          </div>
                        </div>

                        {/* Détails des changements */}
                        {log.changes && (log.changes.before || log.changes.after) && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                              🔍 Voir les détails des modifications
                            </summary>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                              {log.changes.before && (
                                <div className="bg-red-50 border border-red-200 rounded p-2">
                                  <p className="font-semibold text-red-800 mb-1">❌ Avant :</p>
                                  <pre className="text-red-700 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(log.changes.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.changes.after && (
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <p className="font-semibold text-green-800 mb-1">✅ Après :</p>
                                  <pre className="text-green-700 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(log.changes.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm text-gray-600">
              {filteredLogs.length} enregistrement{filteredLogs.length !== 1 ? "s" : ""} affiché{filteredLogs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
