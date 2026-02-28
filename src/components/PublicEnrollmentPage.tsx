import React from "react"
import { Toaster } from "react-hot-toast"
import { EnrollmentForm } from "./EnrollmentForm"

export const PublicEnrollmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header Benado */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <img 
            src="https://lumi.new/lumi.ing/logo.png" 
            alt="Benado Logo" 
            className="h-16"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Formulaire d'inscription</h1>
            <p className="text-sm text-gray-600">Programme Benado - Centre de services scolaire des Grandes-Seigneuries</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <EnrollmentForm onSuccess={() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }} />

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">© 2024 Programme Benado - Tous droits réservés</p>
          <p className="text-xs text-gray-400 mt-2">Centre de services scolaire des Grandes-Seigneuries</p>
        </div>
      </footer>
    </div>
  )
}
