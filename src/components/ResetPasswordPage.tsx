import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import { useCustomAuth } from "../hooks/useCustomAuth"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useCustomAuth()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      toast.error("Lien invalide")
      navigate("/")
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, navigate])

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
    const result = await resetPassword(token, newPassword)
    setIsLoading(false)

    if (result.success) {
      toast.success("Mot de passe réinitialisé avec succès !")
      setTimeout(() => navigate("/"), 2000)
    } else {
      toast.error(result.error || "Erreur lors de la réinitialisation")
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Choisissez un nouveau mot de passe sécurisé
        </p>

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
            {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  )
}