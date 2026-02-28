import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useCustomAuth } from "../hooks/useCustomAuth"
import { lumi } from "../lib/lumi"

export function CustomLoginPage() {
  const navigate = useNavigate()
  const { signIn, requestPasswordReset } = useCustomAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [adminData, setAdminData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setErrorModal({ show: true, message: "Veuillez remplir tous les champs" })
      return
    }

    setIsLoading(true)
    const result = await signIn(email, password)
    setIsLoading(false)

    if (!result.success) {
      setErrorModal({ show: true, message: result.error || "Erreur de connexion" })
    } else {
      if (result.mustChangePassword) {
        toast.success("Veuillez changer votre mot de passe temporaire")
        // Passer userId et email pour la page de changement de mot de passe
        navigate("/complete-registration", { 
          state: { 
            userId: result.user?.userId, 
            email: result.user?.email 
          } 
        })
      } else {
        toast.success("Connexion réussie !")
        window.location.href = "/"
      }
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetEmail) {
      setErrorModal({ show: true, message: "Veuillez entrer votre email" })
      return
    }

    setIsLoading(true)
    const result = await requestPasswordReset(resetEmail)
    setIsLoading(false)

    if (result.success) {
      toast.success(result.message || "Email envoyé !")
      setShowForgotPassword(false)
      setResetEmail("")
    } else {
      setErrorModal({ show: true, message: result.error || "Erreur" })
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminData.nom || !adminData.prenom || !adminData.email || !adminData.password) {
      setErrorModal({ show: true, message: "Veuillez remplir tous les champs" })
      return
    }

    if (adminData.password !== adminData.confirmPassword) {
      setErrorModal({ show: true, message: "Les mots de passe ne correspondent pas" })
      return
    }

    if (adminData.password.length < 8) {
      setErrorModal({ show: true, message: "Le mot de passe doit contenir au moins 8 caractères" })
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading("Création du compte admin...")

    try {
      console.log("🚀 Appel registerIntervenant avec:", {
        nom: adminData.nom,
        prenom: adminData.prenom,
        email: adminData.email,
        hasPassword: Boolean(adminData.password)
      })

      const response = await lumi.functions.invoke("registerIntervenant", {
        method: "POST",
        body: {
          nom: adminData.nom,
          prenom: adminData.prenom,
          email: adminData.email,
          password: adminData.password,
          permissions: {
            accessNotes: true,
            accessStats: true,
            modifierEtudiants: true,
            supprimerEtudiants: true,
            accessMessagerie: true,
            accessTickets: true
          }
        }
      })

      console.log("📩 Réponse reçue:", response)

      if (response?.success) {
        toast.success("✅ Compte admin créé ! Vous pouvez maintenant vous connecter", { id: loadingToast, duration: 5000 })
        setShowCreateAdmin(false)
        setAdminData({ nom: "", prenom: "", email: "", password: "", confirmPassword: "" })
      } else {
        toast.error(response?.error || "Erreur lors de la création", { id: loadingToast })
      }
    } catch (error: any) {
      console.error("❌ Erreur complète:", error)
      console.error("❌ Message:", error?.message)
      console.error("❌ Stack:", error?.stack)
      toast.error(`Erreur: ${error?.message || "Erreur inconnue"}`, { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Logo */}
        <div className="w-40 h-40 flex items-center justify-center mx-auto mb-6">
          <img 
            src="https://static.lumi.new/8e/8e5f2a40e2bc63b9928e6d01978f5ebb.webp" 
            alt="Logo Benado" 
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Gestion des inscriptions Benado
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Connectez-vous pour accéder au système de gestion
        </p>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Mot de passe oublié ?
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateAdmin(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all shadow-md text-sm">
                🔧 Créer le premier compte admin
              </button>
            </div>
          </form>
        ) : showCreateAdmin ? (
          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={adminData.nom}
                  onChange={(e) => setAdminData({...adminData, nom: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={adminData.prenom}
                  onChange={(e) => setAdminData({...adminData, prenom: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Prénom"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={adminData.confirmPassword}
                onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Création en cours..." : "✅ Créer le compte admin"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreateAdmin(false)
                setAdminData({ nom: "", prenom: "", email: "", password: "", confirmPassword: "" })
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium">
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setResetEmail("")
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium">
              ← Retour à la connexion
            </button>
          </form>
        )}
      </div>

      {/* Modal d'erreur */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Erreur de connexion
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  {errorModal.message}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
