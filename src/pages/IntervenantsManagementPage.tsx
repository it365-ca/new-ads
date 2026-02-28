import React from "react"
import { useNavigate } from "react-router-dom"
import { IntervenantsManagement } from "../components/IntervenantsManagement"

export const IntervenantsManagementPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium text-gray-700">
                <span>←</span>
                <span>Retour</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>👥</span>
                  Gestion des Intervenants
                </h1>
                <p className="text-sm text-gray-600 mt-1">Ajouter, modifier ou supprimer des utilisateurs et gérer leurs permissions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <IntervenantsManagement />
      </main>
    </div>
  )
}
