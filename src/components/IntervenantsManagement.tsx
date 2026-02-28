import React, { useState } from "react"
import { useIntervenants } from "../hooks/useIntervenants"
import toast from "react-hot-toast"
import { formatPhoneNumber } from "../utils/phoneFormat"
import { formatDate } from "../utils/dateFormat"
import { lumi } from "../lib/lumi"

interface IntervenantsManagementProps {
  openFormTrigger?: boolean
  onFormOpenComplete?: () => void
}

export const IntervenantsManagement: React.FC<IntervenantsManagementProps> = ({ 
  openFormTrigger, 
  onFormOpenComplete 
}) => {
  const { intervenants, loading, createIntervenant, updateIntervenant, deleteIntervenant, refreshIntervenants } = useIntervenants()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [roleMode, setRoleMode] = useState<"admin" | "intervenant">("intervenant")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    userId: "",
    telephone: "",
    specialite: "",
    newPassword: "",
    isTemporaryPassword: false,
    initialPassword: "", // Mot de passe initial pour création
    permissions: {
      accessNotes: false,
      accessStats: false,
      modifierEtudiants: false,
      supprimerEtudiants: false,
      accessMessagerie: false,
      accessTickets: false,
      accessFeuillePres: false,
      accessAdministration: false
    }
  })

  // Réagir au trigger externe pour ouvrir le formulaire
  React.useEffect(() => {
    if (openFormTrigger) {
      setShowForm(true)
      onFormOpenComplete?.()
    }
  }, [openFormTrigger, onFormOpenComplete])

  const resetForm = () => {
    setRoleMode("intervenant")
    setFormData({ 
      nom: "", 
      prenom: "",
      email: "", 
      userId: "", 
      telephone: "", 
      specialite: "",
      newPassword: "",
      isTemporaryPassword: false,
      initialPassword: "",
      permissions: {
        accessNotes: false,
        accessStats: false,
        modifierEtudiants: false,
        supprimerEtudiants: false,
        accessMessagerie: false,
        accessTickets: false,
        accessFeuillePres: false,
        accessAdministration: false
      }
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleCreateAdmin = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      userId: "",
      telephone: "",
      specialite: "Administrateur",
      newPassword: "",
      isTemporaryPassword: false,
      initialPassword: "",
      permissions: {
        accessNotes: true,
        accessStats: true,
        modifierEtudiants: true,
        supprimerEtudiants: true,
        accessMessagerie: true,
        accessTickets: true,
        accessFeuillePres: true,
        accessAdministration: true
      }
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
      toast.error("Le nom, le prénom et l'email sont requis")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Email invalide")
      return
    }

    try {
      if (editingId) {
        // Mettre à jour l'intervenant
        await updateIntervenant(editingId, formData)
        
        // Si un nouveau mot de passe est fourni, le mettre à jour
        if (formData.newPassword && formData.newPassword.trim()) {
          try {
            const sessionToken = localStorage.getItem("benado_session_token")
            await lumi.functions.invoke("updateIntervenantPassword", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${sessionToken}`
              },
              body: {
                intervenantId: editingId,
                password: formData.newPassword,
                isTemporary: formData.isTemporaryPassword
              }
            })
            toast.success(formData.isTemporaryPassword 
              ? "Intervenant modifié ! Mot de passe temporaire défini."
              : "Intervenant et mot de passe modifiés avec succès")
          } catch (pwdError) {
            console.error("Erreur mise à jour mot de passe:", pwdError)
            toast.warning("Intervenant modifié mais erreur lors du changement de mot de passe")
          }
        } else {
          toast.success("Intervenant modifié avec succès")
        }
      } else {
        // Si un mot de passe initial est fourni, activer directement le compte
        if (formData.initialPassword && formData.initialPassword.trim()) {
          // Générer un salt
          const salt = crypto.randomUUID()
          // Hash le mot de passe (via fonction Deno)
          const encoder = new TextEncoder()
          const data = encoder.encode(formData.initialPassword + salt)
          const hashBuffer = await crypto.subtle.digest("SHA-256", data)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

          console.log("🔍 CRÉATION avec mot de passe - formData:", { nom: formData.nom, prenom: formData.prenom, email: formData.email })
          
          const newIntervenant = await createIntervenant({
            ...formData,
            salt,
            passwordHash,
            actif: true, // Actif directement car mot de passe défini
            dateAjout: new Date().toISOString()
          }) as any

          console.log("✅ Intervenant créé:", newIntervenant)
          toast.success("✅ Intervenant créé et activé avec mot de passe !")
        } else {
          // Pas de mot de passe initial, créer inactif et envoyer email
          console.log("🔍 CRÉATION sans mot de passe - formData:", { nom: formData.nom, prenom: formData.prenom, email: formData.email })
          
          const newIntervenant = await createIntervenant({
            ...formData,
            actif: false, // Inactif jusqu'à définition du mot de passe
            dateAjout: new Date().toISOString()
          }) as any

          console.log("✅ Intervenant créé:", newIntervenant)

          // Envoyer l'email d'invitation automatiquement
          try {
            const inviteResponse = await lumi.functions.invoke("sendInvitation", {
              method: "POST",
              body: {
                intervenantId: newIntervenant._id,
                email: formData.email,
                nom: formData.nom,
                prenom: formData.prenom
              }
            })

            if (inviteResponse?.success) {
              toast.success("Intervenant créé ! Email d'invitation envoyé à " + formData.email)
            } else {
              toast.warning("Intervenant créé mais erreur d'envoi d'email")
            }
          } catch (emailError) {
            console.error("Erreur envoi invitation:", emailError)
            toast.warning("Intervenant créé mais erreur d'envoi d'email")
          }
        }
      }
      resetForm()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (intervenant: any) => {
    const isAdmin = intervenant.permissions?.accessAdministration && 
                    intervenant.permissions?.accessNotes &&
                    intervenant.permissions?.accessStats &&
                    intervenant.permissions?.modifierEtudiants &&
                    intervenant.permissions?.supprimerEtudiants &&
                    intervenant.permissions?.accessMessagerie &&
                    intervenant.permissions?.accessTickets &&
                    intervenant.permissions?.accessFeuillePres
    
    setRoleMode(isAdmin ? "admin" : "intervenant")
    setFormData({
      nom: intervenant.nom,
      prenom: intervenant.prenom || "",
      email: intervenant.email,
      userId: intervenant.userId,
      telephone: intervenant.telephone || "",
      specialite: intervenant.specialite || "",
      newPassword: "",
      isTemporaryPassword: false,
      initialPassword: "",
      permissions: intervenant.permissions || {
        accessNotes: false,
        accessStats: false,
        modifierEtudiants: false,
        supprimerEtudiants: false,
        accessMessagerie: false,
        accessTickets: false,
        accessFeuillePres: false,
        accessAdministration: false
      }
    })
    setEditingId(intervenant._id)
    setShowForm(true)
  }

  const handleResetPassword = async (intervenantId: string, email: string) => {
    if (!confirm("Envoyer un email de réinitialisation de mot de passe à cet intervenant ?")) return

    try {
      await lumi.functions.invoke("requestPasswordReset", {
        method: "POST",
        body: { email }
      })
      toast.success("Email de réinitialisation envoyé à " + email)
    } catch (error) {
      console.error("Erreur réinitialisation:", error)
      toast.error("Erreur lors de l'envoi de l'email de réinitialisation")
    }
  }

  const handleToggleActif = async (id: string, actif: boolean) => {
    try {
      await updateIntervenant(id, { actif: !actif })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet intervenant ?")) return

    try {
      await deleteIntervenant(id)
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">👥 Gestion des Intervenants</h2>
          <div className="flex gap-3">
            <button
              onClick={handleCreateAdmin}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all shadow-sm font-medium text-sm border border-purple-200">
              <span>🔐</span>
              <span>Créer Admin Complet</span>
            </button>
            <button
              onClick={async () => {
                const email = prompt("Email de l'intervenant à corriger:")
                const newPrenom = prompt("Nouveau prénom:")
                if (email && newPrenom) {
                  try {
                    const result = await lumi.entities.intervenants.list({ filter: { email }, limit: 1 })
                    console.log("Résultat recherche:", result)
                    if (result.list && result.list.length > 0) {
                      const intervenantId = result.list[0]._id
                      console.log("Correction prénom pour ID:", intervenantId, "ancien:", result.list[0].prenom, "nouveau:", newPrenom)
                      await lumi.entities.intervenants.update(intervenantId, { prenom: newPrenom })
                      toast.success(`✅ Prénom corrigé: ${newPrenom}`)
                      await refreshIntervenants()
                    } else {
                      toast.error("Intervenant non trouvé")
                    }
                  } catch (error) {
                    console.error("Erreur correction:", error)
                    toast.error("Erreur lors de la correction")
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all shadow-sm font-medium text-sm border border-blue-200">
              <span>🔧</span>
              <span>Corriger Prénom</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all shadow-sm font-medium text-sm border border-green-200">
              <span>{showForm ? "✖️" : "➕"}</span>
              <span>{showForm ? "Annuler" : "Ajouter un intervenant"}</span>
            </button>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Modifier l'intervenant" : "Nouvel intervenant"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: formatPhoneNumber(e.target.value) })}
                  placeholder="(450)555-5555"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                <input
                  type="text"
                  value={formData.specialite}
                  onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                  placeholder="Ex: Psychologie, Travail social..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Section Mot de Passe Initial (uniquement en création) */}
            {!editingId && (
              <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-3">🔑 Définir un mot de passe maintenant (optionnel)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe initial
                    </label>
                    <input
                      type="password"
                      value={formData.initialPassword}
                      onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                      placeholder="Laisser vide pour envoyer un email d'invitation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.initialPassword ? "✅ Le compte sera activé immédiatement" : "📧 Un email d'invitation sera envoyé"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section Mot de Passe (uniquement en modification) */}
            {editingId && (
              <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 mb-3">🔑 Gestion du mot de passe</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe (optionnel)
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Laisser vide pour ne pas modifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                  </div>
                  {formData.newPassword && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isTemporaryPassword}
                        onChange={(e) => setFormData({ ...formData, isTemporaryPassword: e.target.checked })}
                        className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-700">
                        ⚠️ Mot de passe temporaire (l'intervenant devra le changer à la prochaine connexion)
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Section Permissions */}
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">🔐 Droits d'accès</h4>
              
              {/* Sélecteur de mode */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roleMode"
                      checked={roleMode === "admin"}
                      onChange={() => {
                        setRoleMode("admin")
                        setFormData({
                          ...formData,
                          permissions: {
                            accessNotes: true,
                            accessStats: true,
                            modifierEtudiants: true,
                            supprimerEtudiants: true,
                            accessMessagerie: true,
                            accessTickets: true,
                            accessFeuillePres: true,
                            accessAdministration: true
                          }
                        })
                      }}
                      className="w-4 h-4 text-indigo-600 border-indigo-300 focus:ring-indigo-400"
                    />
                    <span className="text-sm font-medium text-gray-900">⚡ Mode Admin (accès complet)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roleMode"
                      checked={roleMode === "intervenant"}
                      onChange={() => {
                        setRoleMode("intervenant")
                        setFormData({
                          ...formData,
                          permissions: {
                            accessNotes: false,
                            accessStats: false,
                            modifierEtudiants: false,
                            supprimerEtudiants: false,
                            accessMessagerie: false,
                            accessTickets: false,
                            accessFeuillePres: false,
                            accessAdministration: false
                          }
                        })
                      }}
                      className="w-4 h-4 text-indigo-600 border-indigo-300 focus:ring-indigo-400"
                    />
                    <span className="text-sm font-medium text-gray-900">👤 Mode Intervenant (sélection manuelle)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessNotes}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessNotes: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>📝 Accès aux Notes (Sans Suivi)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessStats}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessStats: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>📊 Accès aux Statistiques</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.modifierEtudiants}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, modifierEtudiants: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>✏️ Modifier les étudiants</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.supprimerEtudiants}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, supprimerEtudiants: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>🗑️ Supprimer les étudiants</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessMessagerie}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessMessagerie: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>💬 Accès à la Messagerie</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessTickets}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessTickets: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>🎫 Accès aux Tickets</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessFeuillePres}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessFeuillePres: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>📋 Accès à la Feuille de présence</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.accessAdministration}
                    disabled={roleMode === "admin"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions, accessAdministration: e.target.checked } 
                    })}
                    className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-400 disabled:opacity-50"
                  />
                  <span className={`text-sm ${roleMode === "admin" ? "text-gray-500" : "text-gray-700"}`}>⚙️ Administration</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all shadow-sm font-medium text-sm border border-blue-200">
                <span>{editingId ? "💾" : "✅"}</span>
                <span>{editingId ? "Sauvegarder" : "Ajouter"}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2.5 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-all shadow-sm font-medium text-sm border border-pink-200">
                <span>✖️</span>
                <span>Annuler</span>
              </button>
            </div>
          </form>
        )}

        {/* Liste des intervenants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">Liste des intervenants ({intervenants.length})</h3>
          </div>
          
          {intervenants.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">👥</span>
              <p className="font-medium">Aucun intervenant enregistré</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter un intervenant" pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {intervenants.map((intervenant) => {
                const isAdmin = intervenant.permissions?.accessAdministration
                const activePermissions = [
                  intervenant.permissions?.accessNotes && 'Notes',
                  intervenant.permissions?.accessStats && 'Stats',
                  intervenant.permissions?.modifierEtudiants && 'Modifier',
                  intervenant.permissions?.supprimerEtudiants && 'Supprimer',
                  intervenant.permissions?.accessMessagerie && 'Messagerie',
                  intervenant.permissions?.accessTickets && 'Tickets',
                  intervenant.permissions?.accessFeuillePres && 'Présence'
                ].filter(Boolean)

                return (
                  <div key={intervenant._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                    {/* Header de la carte */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-lg shadow-sm">
                              {intervenant.prenom?.[0]?.toUpperCase()}{intervenant.nom?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                {intervenant.prenom} {intervenant.nom}
                              </h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <span>📧</span>
                                {intervenant.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleActif(intervenant._id, intervenant.actif)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                            intervenant.actif
                              ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                          }`}>
                          {intervenant.actif ? "✓ Actif" : "○ Inactif"}
                        </button>
                      </div>
                    </div>

                    {/* Corps de la carte */}
                    <div className="p-4 space-y-3">
                      {/* Informations */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Spécialité</p>
                          <p className="text-sm text-gray-900 font-medium">{intervenant.specialite || "Non définie"}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Date d'ajout</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {new Date(intervenant.dateAjout).toLocaleDateString("fr-FR", { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Rôle et Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">🔐 Rôle et permissions</span>
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-xs font-bold rounded-full shadow-sm">
                              ADMIN
                            </span>
                          )}
                        </div>
                        {activePermissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {activePermissions.map((perm, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded border border-blue-200 shadow-sm">
                                {perm}
                              </span>
                            ))}
                            {isAdmin && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded border border-purple-200 shadow-sm">
                                Administration
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucune permission attribuée</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(intervenant)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium shadow-sm border border-blue-200">
                        <span>✏️</span>
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleResetPassword(intervenant._id, intervenant.email)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-medium shadow-sm border border-green-200">
                        <span>🔄</span>
                        <span>Réinit. MDP</span>
                      </button>
                      <button
                        onClick={() => handleDelete(intervenant._id)}
                        className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-all text-sm font-medium shadow-sm border border-pink-200"
                        title="Supprimer">
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
