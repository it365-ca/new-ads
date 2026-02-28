import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"
import { useAuth } from "./useAuth"

interface PermissionStatus {
  isAuthorized: boolean
  isLoading: boolean
  intervenant: any | null
  errorMessage: string | null
}

export function useIntervenantPermissions() {
  const { user, isAuthenticated } = useAuth()
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    isAuthorized: false,
    isLoading: true,
    intervenant: null,
    errorMessage: null
  })

  useEffect(() => {
    const checkPermissions = async () => {
      // Si pas connecté, pas autorisé
      if (!isAuthenticated || !user) {
        setPermissionStatus({
          isAuthorized: false,
          isLoading: false,
          intervenant: null,
          errorMessage: "Vous devez être connecté"
        })
        return
      }

      // Si ADMIN, toujours autorisé
      if (user.userRole === "ADMIN") {
        setPermissionStatus({
          isAuthorized: true,
          isLoading: false,
          intervenant: null,
          errorMessage: null
        })
        return
      }

      // Pour les USER (Intervenants), vérifier dans la base de données
      try {
        setPermissionStatus(prev => ({ ...prev, isLoading: true }))

        // 1. Chercher par userId d'abord
        let result = await lumi.entities.intervenants.list({
          filter: {
            userId: user.userId
          }
        })

        let intervenantList = result?.list || []

        // 2. Si aucun résultat, chercher par email pour auto-association
        if (intervenantList.length === 0) {
          result = await lumi.entities.intervenants.list({
            filter: {
              email: user.email,
              actif: true
            }
          })

          intervenantList = result?.list || []

          // Si trouvé par email, associer le userId automatiquement
          if (intervenantList.length > 0) {
            const intervenant = intervenantList[0]
            await lumi.entities.intervenants.update(intervenant._id, {
              userId: user.userId
            })
            console.log("✅ Compte intervenant associé automatiquement")
          }
        }

        if (intervenantList.length === 0) {
          setPermissionStatus({
            isAuthorized: false,
            isLoading: false,
            intervenant: null,
            errorMessage: "Vous n'êtes pas enregistré comme intervenant. Contactez un administrateur."
          })
          return
        }

        const intervenant = intervenantList[0]

        // Vérifier si l'intervenant est actif
        if (!intervenant.actif) {
          setPermissionStatus({
            isAuthorized: false,
            isLoading: false,
            intervenant,
            errorMessage: "Votre compte intervenant est désactivé. Contactez un administrateur."
          })
          return
        }

        // Tout est OK - retourner l'intervenant complet avec toutes ses propriétés
        setPermissionStatus({
          isAuthorized: true,
          isLoading: false,
          intervenant,
          errorMessage: null
        })

      } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error)
        setPermissionStatus({
          isAuthorized: false,
          isLoading: false,
          intervenant: null,
          errorMessage: "Erreur lors de la vérification des permissions"
        })
      }
    }

    checkPermissions()
  }, [user, isAuthenticated])

  return permissionStatus
}
