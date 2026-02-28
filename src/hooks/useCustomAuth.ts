import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface CustomUser {
  userId: string
  email: string
  nom: string
  prenom: string
  permissions: {
    accessNotes?: boolean
    accessStats?: boolean
    accessTickets?: boolean
    accessMessagerie?: boolean
    modifierEtudiants?: boolean
  }
}

const API_BASE = "https://api.lumi.new/v1/functions/p384255179950706688"

export function useCustomAuth() {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Vérifier la session au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem("benado_session_token")
      if (sessionToken) {
        await verifySession(sessionToken)
      } else {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const verifySession = async (sessionToken: string) => {
    try {
      console.log("🔍 Vérification session avec token:", sessionToken)
      const response = await fetch(`${API_BASE}/verifySession`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ sessionToken })
      })

      console.log("📡 Réponse verifySession:", response.status)
      const data = await response.json()
      console.log("📦 Données verifySession:", data)

      if (data?.valid) {
        console.log("✅ Session valide, user connecté:", data.user)
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        console.warn("❌ Session invalide:", data?.error)
        localStorage.removeItem("benado_session_token")
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("❌ Erreur vérification session:", error)
      localStorage.removeItem("benado_session_token")
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean, mustChangePassword?: boolean, user?: CustomUser, error?: string }> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 seconde
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔐 Tentative de connexion (${attempt}/${MAX_RETRIES}):`, email)
        
        const response = await fetch(`${API_BASE}/loginCustom`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        })

        console.log("📡 Réponse HTTP:", response.status, response.statusText)

        // Lire les données JSON dans tous les cas pour obtenir le message d'erreur
        const data = await response.json()
        console.log("📦 Données reçues:", data)

        // Retry sur erreur 500 uniquement
        if (response.status === 500 && attempt < MAX_RETRIES) {
          console.warn(`⚠️ Erreur 500, retry dans ${RETRY_DELAY * attempt}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
          continue
        }

        // Si erreur HTTP (401, 403, etc.), retourner le message d'erreur précis du serveur
        if (!response.ok) {
          console.error("❌ Erreur HTTP:", response.status, data)
          return { success: false, error: data?.error || "Erreur de mot de passe ou utilisateur" }
        }

        if (data?.success) {
          localStorage.setItem("benado_session_token", data.sessionToken)
          setUser(data.user)
          setIsAuthenticated(true)
          setIsLoading(false)
          console.log("✅ Connexion réussie")
          return { success: true, mustChangePassword: data.mustChangePassword || false, user: data.user }
        } else {
          console.error("❌ Échec authentification:", data?.error)
          return { success: false, error: data?.error || "Erreur de connexion" }
        }
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Erreur réseau, retry dans ${RETRY_DELAY * attempt}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
          continue
        }
        console.error("❌ Erreur login après 3 tentatives:", error)
        return { success: false, error: "Erreur lors de la connexion" }
      }
    }
    
    return { success: false, error: "Échec après 3 tentatives" }
  }

  const signOut = () => {
    localStorage.removeItem("benado_session_token")
    setUser(null)
    setIsAuthenticated(false)
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean, message?: string, error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/requestPasswordReset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data?.success) {
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data?.error || "Erreur lors de la demande" }
      }
    } catch (error) {
      console.error("Erreur reset request:", error)
      return { success: false, error: "Erreur lors de la demande" }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean, message?: string, error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await response.json()

      if (data?.success) {
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data?.error || "Erreur lors de la réinitialisation" }
      }
    } catch (error) {
      console.error("Erreur reset password:", error)
      return { success: false, error: "Erreur lors de la réinitialisation" }
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword
  }
}
