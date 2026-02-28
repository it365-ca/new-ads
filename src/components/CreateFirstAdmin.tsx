import React, { useState } from "react"
import toast from "react-hot-toast"
import { lumi } from "../lib/lumi"
import { useNavigate } from "react-router-dom"

export function CreateFirstAdmin() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [adminData, setAdminData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminData.nom || !adminData.prenom || !adminData.email || !adminData.password) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    if (adminData.password !== adminData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (adminData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading("Création du compte admin...")

    try {
      // Vérifier si l'email existe déjà
      const existingIntervenants = await lumi.entities.intervenants.list({
        filter: { email: adminData.email },
        limit: 1
      })

      if (existingIntervenants.list && existingIntervenants.list.length > 0) {
        toast.error("Cet email est déjà utilisé", { id: loadingToast })
        return
      }

      // Générer un salt aléatoire
      const salt = crypto.randomUUID()
      
      // Hasher le mot de passe avec SHA-256
      const encoder = new TextEncoder()
      const data = encoder.encode(adminData.password + salt)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

      // Créer directement l'intervenant admin (sans passer par Deno function)
      const newAdmin = await lumi.entities.intervenants.create({
        nom: adminData.nom,
        prenom: adminData.prenom,
        email: adminData.email,
        userId: crypto.randomUUID(),
        telephone: "",
        specialite: "Administrateur",
        actif: true,
        dateAjout: new Date().toISOString(),
        passwordHash,
        salt,
        permissions: {
          accessNotes: true,
          accessStats: true,
          modifierEtudiants: true,
          supprimerEtudiants: true,
          accessMessagerie: true,
          accessTickets: true
        }
      })

      if (newAdmin) {
        toast.success("✅ Compte admin créé ! Redirection vers la connexion...", { id: loadingToast, duration: 3000 })
        setTimeout(() => navigate("/login"), 2000)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la création du compte", { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-2 border-green-200">
        {/* Logo */}
        <div className="w-40 h-40 flex items-center justify-center mx-auto mb-6">
          <img 
            src="https://static.lumi.new/8e/8e5f2a40e2bc63b9928e6d01978f5ebb.webp" 
            alt="Logo Benado" 
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          🔧 Créer le Premier Admin
        </h1>
        <p className="text-gray-600 mb-8 text-center text-sm">
          Cette page permet de créer le premier compte administrateur avec toutes les permissions
        </p>

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={adminData.nom}
                onChange={(e) => setAdminData({...adminData, nom: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Dupont"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={adminData.prenom}
                onChange={(e) => setAdminData({...adminData, prenom: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Jean"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={adminData.email}
              onChange={(e) => setAdminData({...adminData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="admin@benado.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe * (minimum 8 caractères)
            </label>
            <input
              type="password"
              value={adminData.password}
              onChange={(e) => setAdminData({...adminData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              value={adminData.confirmPassword}
              onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
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
            onClick={() => navigate("/login")}
            className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium">
            ← Retour à la connexion
          </button>
        </form>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-gray-600">
            ℹ️ <strong>Note :</strong> Ce compte aura toutes les permissions administrateur (accès notes, stats, gestion étudiants, messagerie, tickets).
          </p>
        </div>
      </div>
    </div>
  )
}
