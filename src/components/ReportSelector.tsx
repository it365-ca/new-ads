import React, { useState, useRef } from "react"
import { useReports } from "../hooks/useReports"
import { useNotes } from "../hooks/useNotes"
import { useModal } from "../contexts/ModalContext"

interface ReportSelectorProps {
  enrollmentId: string
  enrollmentName?: string
  isVirtual?: boolean
  onClose: () => void
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({
  enrollmentId,
  enrollmentName,
  isVirtual = false,
  onClose
}) => {
  const { reports, templates, createReport, deleteReport } = useReports(enrollmentId)
  const { notes } = useNotes(enrollmentId)
  const { showModal } = useModal()
  
  const [mode, setMode] = useState<"select" | "edit">("select")
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [titre, setTitre] = useState("")
  const [contenu, setContenu] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)

  const handleCreateFromTemplate = (template: any) => {
    setSelectedTemplate(template)
    setTitre("")
    setContenu(template.contenuHTML)
    setMode("edit")
  }

  const handleCreateBlank = () => {
    setSelectedTemplate(null)
    setTitre("")
    setContenu("")
    setMode("edit")
  }

  const insertNotesResume = () => {
    if (!notes || notes.length === 0) {
      showModal("info", "Il n'y a aucune note pour cet étudiant.", "Aucune note disponible")
      return
    }
    
    let notesHTML = `
      <div style="margin: 20px 0;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Résumé des notes</h2>
        <div style="margin-top: 20px;">
    `
    
    notes.forEach((note, index) => {
      const date = new Date(note.dateCreation).toLocaleDateString('fr-CA')
      notesHTML += `
        <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #6366f1;">
          <div style="font-weight: bold; color: #333;">Note ${index + 1} - ${date}</div>
          <div style="margin-top: 5px; color: #666;">${note.note || ""}</div>
          ${note.auteurNom ? `<div style="margin-top: 5px; font-size: 12px; color: #999;">Par: ${note.auteurNom}</div>` : ""}
        </div>
      `
    })
    
    notesHTML += `</div></div>`
    
    if (editorRef.current) {
      editorRef.current.innerHTML += notesHTML
      setContenu(editorRef.current.innerHTML)
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setTitre("")
    setContenu("")
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setContenu(editorRef.current.innerHTML)
    }
  }

  const handleSave = async () => {
    if (!titre.trim()) {
      showModal("error", "Veuillez entrer un titre pour le rapport.", "Erreur")
      return
    }

    try {
      await createReport({
        enrollmentId,
        titre,
        contenu,
        typeTemplate: selectedTemplate ? "standard" : "personnalise",
        templateId: selectedTemplate?._id,
        metadata: {
          auteurNom: enrollmentName || "",
          dateDebut: new Date().toISOString(),
          dateFin: new Date().toISOString()
        }
      })

      showModal("success", "Rapport créé avec succès.", "Succès")
      setMode("select")
      resetForm()
    } catch (error) {
      console.error("Failed to save report:", error)
      showModal("error", "Impossible de sauvegarder le rapport.", "Erreur")
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Supprimer ce rapport ?")) return
    
    try {
      await deleteReport(reportId)
      showModal("success", "Rapport supprimé avec succès.", "Succès")
    } catch (error) {
      console.error("Failed to delete report:", error)
      showModal("error", "Impossible de supprimer le rapport.", "Erreur")
    }
  }

  if (mode === "select") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">📄 Rapports - {enrollmentName || "Étudiant"}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
              ×
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Section Créer un rapport */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Créer un nouveau rapport</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <button
                  onClick={handleCreateBlank}
                  className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg hover:shadow-lg transition-all text-left"
                >
                  <div className="text-4xl mb-2">📝</div>
                  <h4 className="font-bold text-gray-900 mb-1">Rapport vierge</h4>
                  <p className="text-sm text-gray-600">Créer un rapport personnalisé à partir de zéro</p>
                </button>

                {templates.length > 0 && templates.map((template) => (
                  <button
                    key={template._id}
                    onClick={() => handleCreateFromTemplate(template)}
                    className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-lg transition-all text-left"
                  >
                    <div className="text-4xl mb-2">📋</div>
                    <h4 className="font-bold text-gray-900 mb-1">{template.nom}</h4>
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                  </button>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">💡 Aucun template disponible</p>
                  <p className="text-sm text-gray-500 mt-1">Créez des templates dans la section Administration</p>
                </div>
              )}
            </div>

            {/* Section Rapports existants */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📁 Rapports existants</h3>
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-lg text-gray-500">Aucun rapport pour cet étudiant</p>
                  <p className="text-sm text-gray-400 mt-2">Créez votre premier rapport ci-dessus</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800">{report.titre}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Créé le {new Date(report.createdAt).toLocaleDateString('fr-CA')}
                          </p>
                          <div className="text-sm text-gray-600 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: report.contenu }} />
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              // Ouvrir le rapport en lecture seule ou pour modification
                              const newWindow = window.open("", "_blank")
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>${report.titre}</title>
                                      <style>
                                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
                                      </style>
                                    </head>
                                    <body>
                                      <h1 style="text-align: center; color: #6366f1;">${report.titre}</h1>
                                      <p style="text-align: center; color: #999; font-size: 12px; margin-bottom: 30px;">
                                        ${new Date(report.createdAt).toLocaleDateString('fr-CA')}
                                      </p>
                                      ${report.contenu}
                                    </body>
                                  </html>
                                `)
                                newWindow.document.close()
                              }
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            👁️ Voir
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mode édition
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">📝 Créer un rapport</h2>
          <button
            onClick={() => {
              setMode("select")
              resetForm()
            }}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Titre */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre du rapport *
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Ex: Rapport mensuel de suivi"
            />
          </div>

          {/* Barre d'outils simplifiée */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => execCommand("bold")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">
                <strong>B</strong>
              </button>
              <button onClick={() => execCommand("italic")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">
                <em>I</em>
              </button>
              <button onClick={() => execCommand("underline")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">
                <u>U</u>
              </button>
              <div className="w-px bg-gray-300" />
              <button onClick={insertNotesResume} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                📝 Insérer résumé des notes
              </button>
            </div>
          </div>

          {/* Éditeur */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => setContenu(e.currentTarget.innerHTML)}
              className="min-h-[400px] p-6 bg-white focus:outline-none"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                lineHeight: "1.6"
              }}
              dangerouslySetInnerHTML={{ __html: contenu }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => {
              setMode("select")
              resetForm()
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors"
          >
            💾 Sauvegarder le rapport
          </button>
        </div>
      </div>
    </div>
  )
}
