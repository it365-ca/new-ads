import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import { lumi } from "../lib/lumi"

export function CompleteRegistrationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const userId = location.state?.userId
  const email = location.state?.email

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (!userId || !email) {
    // Si pas de données, rediriger vers login
    React.useEffect(() => {
      navigate("/login")
    }, [])
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)

    try {
      // Appeler la fonction pour mettre à jour le mot de passe
      const response = await lumi.functions.invoke("updateIntervenantPassword", {
        method: "POST",
        body: {
          intervenantId: userId,
          password: newPassword,
          isTemporary: false // Désactiver mustChangePassword
        }
      })

      if (response?.success) {
        toast.success("Mot de passe modifié avec succès ! Reconnexion...")
        
        // Attendre 1 seconde puis rediriger vers login
        setTimeout(() => {
          navigate("/login")
        }, 1500)
      } else {
        toast.error(response?.error || "Erreur lors de la modification")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la modification du mot de passe")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="w-40 h-40 flex items-center justify-center mx-auto mb-6">
          <img 
            src="https://static.lumi.new/8e/8e5f2a40e2bc63b9928e6d01978f5ebb.webp" 
            alt="Logo Benado" 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Changement de mot de passe requis
          </h1>
          <p className="text-gray-600">
            Votre administrateur a défini un mot de passe temporaire. Veuillez choisir un nouveau mot de passe sécurisé.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Connecté en tant que : <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Enregistrement..." : "Confirmer le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </div>
  )
}
