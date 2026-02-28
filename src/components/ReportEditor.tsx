import React, { useState, useEffect, useRef } from "react"
import { useReports } from "../hooks/useReports"
import { useNotes } from "../hooks/useNotes"
import { useAuth } from "../hooks/useAuth"
import { useGlobalModal } from "../contexts/GlobalModalContext"

interface ReportEditorProps {
  enrollmentId: string
  enrollmentName?: string
  isVirtual?: boolean
  onClose: () => void
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  enrollmentId,
  enrollmentName,
  isVirtual = false,
  onClose
}) => {
  const { user } = useAuth()
  const { reports, templates, createReport, updateReport, deleteReport, createTemplate } = useReports(enrollmentId)
  const { notes } = useNotes(enrollmentId)
  const { showModal } = useGlobalModal()
  
  const [mode, setMode] = useState<"list" | "edit" | "template">("list")
  const [currentReport, setCurrentReport] = useState<any>(null)
  const [titre, setTitre] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [contenu, setContenu] = useState("")
  const [showToolbar, setShowToolbar] = useState(true)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [fontSize, setFontSize] = useState("14px")
  const [fontFamily, setFontFamily] = useState("Arial")
  const [highlightColor, setHighlightColor] = useState("#ffff00")
  const [textColor, setTextColor] = useState("#000000")
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false)
  
  const editorRef = useRef<HTMLDivElement>(null)

  const insertDefaultHeader = () => {
    const header = `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #6366f1; font-size: 28px;">Benado</h1>
        <p style="margin: 5px 0; color: #666;">Formulaire d'inscription et gestion des étudiants</p>
        <p style="margin: 5px 0; font-size: 14px; color: #999;">Date: ${new Date().toLocaleDateString('fr-CA')}</p>
      </div>
    `
    if (editorRef.current) {
      editorRef.current.innerHTML = header + editorRef.current.innerHTML
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertNotesResume = () => {
    if (!notes || notes.length === 0) {
      showModal("Aucune note disponible", "Il n'y a aucune note pour cet étudiant.", "info")
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

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setContenu(editorRef.current.innerHTML)
    }
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    execCommand("fontSize", "7")
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = size
      range.surroundContents(span)
    }
  }

  const changeFontFamily = (font: string) => {
    setFontFamily(font)
    execCommand("fontName", font)
  }

  const insertPageBreak = () => {
    const pageBreak = '<div style="page-break-after: always; margin: 20px 0; border-top: 2px dashed #ccc; padding-top: 20px;"></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += pageBreak
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertSection = () => {
    const section = '<div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #6366f1;"><h3 style="margin-top:0;">Nouvelle section</h3><p>Contenu de la section...</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += section
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertImage = () => {
    const url = prompt("URL de l'image:")
    if (url) {
      const draggable = isDraggingEnabled ? 'draggable="true" ondragstart="event.dataTransfer.setData(\'text/html\', this.outerHTML)"' : ''
      const img = `<img src="${url}" ${draggable} style="max-width: 100%; height: auto; margin: 10px 0; cursor: ${isDraggingEnabled ? 'move' : 'default'};" />`
      if (editorRef.current) {
        editorRef.current.innerHTML += img
        setContenu(editorRef.current.innerHTML)
      }
    }
  }

  const insertLogo = () => {
    const url = prompt("URL du logo:")
    if (url) {
      const position = prompt("Position (top-left, top-right, center):", "top-right")
      let positionStyle = ""
      switch(position) {
        case "top-left": positionStyle = "position: absolute; top: 20px; left: 20px;"; break
        case "top-right": positionStyle = "position: absolute; top: 20px; right: 20px;"; break
        case "center": positionStyle = "display: block; margin: 0 auto;"; break
        default: positionStyle = "position: absolute; top: 20px; right: 20px;"
      }
      const logo = `<div style="${positionStyle} z-index: 10;"><img src="${url}" style="max-width: 150px; height: auto;" /></div>`
      if (editorRef.current) {
        editorRef.current.innerHTML = logo + editorRef.current.innerHTML
        setContenu(editorRef.current.innerHTML)
      }
    }
  }

  const insertBackgroundImage = () => {
    const url = prompt("URL de l'image de fond:")
    if (url) {
      const opacity = prompt("Opacité (0.1 à 1):", "0.1")
      const bgDiv = `<div style="background-image: url('${url}'); background-size: cover; background-position: center; opacity: ${opacity}; padding: 30px; border-radius: 8px; margin: 20px 0;"><p style="opacity: 1; position: relative; z-index: 2;">Contenu avec fond...</p></div>`
      if (editorRef.current) {
        editorRef.current.innerHTML += bgDiv
        setContenu(editorRef.current.innerHTML)
      }
    }
  }

  const insertShape = () => {
    const shape = prompt("Type de forme (rectangle, circle, line):", "rectangle")
    let shapeHTML = ""
    switch(shape) {
      case "rectangle":
        shapeHTML = '<div style="width: 200px; height: 100px; background-color: #e0e7ff; border: 2px solid #6366f1; margin: 10px 0; padding: 10px;"><p>Rectangle</p></div>'
        break
      case "circle":
        shapeHTML = '<div style="width: 100px; height: 100px; background-color: #fce7f3; border: 2px solid #db2777; border-radius: 50%; margin: 10px 0; display: flex; align-items: center; justify-content: center;"><p>Cercle</p></div>'
        break
      case "line":
        shapeHTML = '<hr style="border: none; border-top: 3px solid #6366f1; margin: 20px 0;" />'
        break
      default:
        shapeHTML = '<div style="width: 200px; height: 100px; background-color: #e0e7ff; border: 2px solid #6366f1; margin: 10px 0;"></div>'
    }
    if (editorRef.current) {
      editorRef.current.innerHTML += shapeHTML
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertTextBox = () => {
    const textBox = '<div style="border: 2px dashed #6366f1; padding: 20px; margin: 15px 0; background: #f9fafb; min-height: 80px;" contenteditable="true"><p>Zone de texte éditable... Cliquez pour modifier.</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += textBox
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertWatermark = () => {
    const text = prompt("Texte du filigrane:", "CONFIDENTIEL")
    if (text) {
      const watermark = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(100, 100, 100, 0.1); font-weight: bold; z-index: 0; pointer-events: none;">${text}</div>`
      if (editorRef.current) {
        editorRef.current.innerHTML = watermark + editorRef.current.innerHTML
        setContenu(editorRef.current.innerHTML)
      }
    }
  }

  const insertBorder = () => {
    const borderDiv = '<div style="border: 3px solid #6366f1; padding: 20px; margin: 15px 0; border-radius: 8px;"><p>Contenu encadré...</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += borderDiv
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertTable = () => {
    const rows = prompt("Nombre de lignes:", "3")
    const cols = prompt("Nombre de colonnes:", "3")
    
    if (!rows || !cols) return
    
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 20px 0;">'
    
    for (let i = 0; i < parseInt(rows); i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < parseInt(cols); j++) {
        tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>'
      }
      tableHTML += '</tr>'
    }
    
    tableHTML += '</table>'
    
    if (editorRef.current) {
      editorRef.current.innerHTML += tableHTML
      setContenu(editorRef.current.innerHTML)
    }
  }

  const insertColumns = () => {
    const columnsHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div style="border: 1px solid #ddd; padding: 15px;">
          <p>Colonne 1</p>
        </div>
        <div style="border: 1px solid #ddd; padding: 15px;">
          <p>Colonne 2</p>
        </div>
      </div>
    `
    
    if (editorRef.current) {
      editorRef.current.innerHTML += columnsHTML
      setContenu(editorRef.current.innerHTML)
    }
  }

  const handleSave = async () => {
    if (!titre.trim()) {
      showModal("Erreur", "Veuillez entrer un titre pour le rapport.", "error")
      return
    }

    try {
      const reportData = {
        enrollmentId,
        titre,
        contenu,
        typeTemplate: selectedTemplate ? "standard" : "personnalise" as any,
        templateId: selectedTemplate || undefined,
        metadata: {
          auteurNom: user?.email || "",
          dateDebut: new Date().toISOString(),
          dateFin: new Date().toISOString()
        }
      }

      if (currentReport) {
        await updateReport(currentReport._id, reportData)
        showModal("Succès", "Rapport mis à jour avec succès.", "success")
      } else {
        await createReport(reportData)
        showModal("Succès", "Rapport créé avec succès.", "success")
      }

      if (saveAsTemplate && templateName.trim()) {
        await createTemplate({
          nom: templateName,
          description: templateDescription,
          contenuHTML: contenu,
          hasLogo: contenu.includes("<img"),
          hasHeader: contenu.includes("border-bottom"),
          isPublic: false
        })
        showModal("Succès", "Template sauvegardé avec succès.", "success")
      }

      setMode("list")
      resetForm()
    } catch (error) {
      console.error("Failed to save report:", error)
      showModal("Erreur", "Impossible de sauvegarder le rapport.", "error")
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      await deleteReport(reportId)
      showModal("Succès", "Rapport supprimé avec succès.", "success")
    } catch (error) {
      console.error("Failed to delete report:", error)
      showModal("Erreur", "Impossible de supprimer le rapport.", "error")
    }
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t._id === templateId)
    if (template && editorRef.current) {
      editorRef.current.innerHTML = template.contenuHTML
      setContenu(template.contenuHTML)
      setSelectedTemplate(templateId)
    }
  }

  const editReport = (report: any) => {
    setCurrentReport(report)
    setTitre(report.titre)
    setContenu(report.contenu)
    setMode("edit")
  }

  const resetForm = () => {
    setCurrentReport(null)
    setTitre("")
    setContenu("")
    setSelectedTemplate("")
    setTemplateName("")
    setTemplateDescription("")
    setSaveAsTemplate(false)
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  useEffect(() => {
    if (mode === "edit" && editorRef.current) {
      editorRef.current.innerHTML = contenu
    }
  }, [mode])

  if (mode === "list") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">📄 Rapports - {enrollmentName || "Étudiant"}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
              ×
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="mb-6">
              <button
                onClick={() => {
                  resetForm()
                  setMode("edit")
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ➕ Créer un nouveau rapport
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Aucun rapport pour cet étudiant</p>
                <p className="text-sm mt-2">Créez votre premier rapport pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{report.titre}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Créé le {new Date(report.createdAt).toLocaleDateString('fr-CA')}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: report.contenu }} />
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => editReport(report)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(report._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          🗑️ Supprimer
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
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {currentReport ? "✏️ Modifier le rapport" : "📝 Créer un rapport"}
          </h2>
          <button
            onClick={() => {
              setMode("list")
              resetForm()
            }}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Titre et Template */}
          <div className="mb-4 space-y-4">
            <div>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Utiliser un template (optionnel)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">-- Aucun template --</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barre d'outils */}
          {showToolbar && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Police et taille */}
                <select
                  value={fontFamily}
                  onChange={(e) => changeFontFamily(e.target.value)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  title="Police"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Cambria">Cambria</option>
                  <option value="Garamond">Garamond</option>
                  <option value="Palatino">Palatino</option>
                  <option value="Book Antiqua">Book Antiqua</option>
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => changeFontSize(e.target.value)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  title="Taille"
                >
                  <option value="8px">8</option>
                  <option value="9px">9</option>
                  <option value="10px">10</option>
                  <option value="11px">11</option>
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="18px">18</option>
                  <option value="20px">20</option>
                  <option value="22px">22</option>
                  <option value="24px">24</option>
                  <option value="28px">28</option>
                  <option value="32px">32</option>
                  <option value="36px">36</option>
                  <option value="48px">48</option>
                  <option value="72px">72</option>
                </select>
                <div className="w-px h-6 bg-gray-300" />
                
                {/* Formatage de base */}
                <button onClick={() => execCommand("bold")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Gras">
                  <strong>B</strong>
                </button>
                <button onClick={() => execCommand("italic")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Italique">
                  <em>I</em>
                </button>
                <button onClick={() => execCommand("underline")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Souligné">
                  <u>U</u>
                </button>
                <button onClick={() => execCommand("strikeThrough")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Barré">
                  <s>S</s>
                </button>
                <button onClick={() => execCommand("subscript")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Indice">
                  X<sub>2</sub>
                </button>
                <button onClick={() => execCommand("superscript")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Exposant">
                  X<sup>2</sup>
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Titres */}
                <button onClick={() => execCommand("formatBlock", "<h1>")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Titre 1">
                  H1
                </button>
                <button onClick={() => execCommand("formatBlock", "<h2>")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Titre 2">
                  H2
                </button>
                <button onClick={() => execCommand("formatBlock", "<h3>")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Titre 3">
                  H3
                </button>
                <button onClick={() => execCommand("formatBlock", "<p>")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Paragraphe">
                  P
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Listes */}
                <button onClick={() => execCommand("insertUnorderedList")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Liste à puces">
                  • Liste
                </button>
                <button onClick={() => execCommand("insertOrderedList")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Liste numérotée">
                  1. Liste
                </button>
                <button onClick={() => execCommand("indent")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Augmenter retrait">
                  →
                </button>
                <button onClick={() => execCommand("outdent")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Réduire retrait">
                  ←
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Alignement */}
                <button onClick={() => execCommand("justifyLeft")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Aligner à gauche">
                  ⬅️
                </button>
                <button onClick={() => execCommand("justifyCenter")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Centrer">
                  ↔️
                </button>
                <button onClick={() => execCommand("justifyRight")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Aligner à droite">
                  ➡️
                </button>
                <button onClick={() => execCommand("justifyFull")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Justifier">
                  ⬌
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Couleurs */}
                <div className="flex items-center gap-1">
                  <label className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Couleur du texte">
                    <span className="text-sm font-bold" style={{color: textColor}}>A</span>
                    <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); execCommand("foreColor", e.target.value); }} className="w-0 h-0 opacity-0" />
                  </label>
                  <label className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Surlignage">
                    <span className="text-sm" style={{backgroundColor: highlightColor}}>🖍️</span>
                    <input type="color" value={highlightColor} onChange={(e) => { setHighlightColor(e.target.value); execCommand("hiliteColor", e.target.value); }} className="w-0 h-0 opacity-0" />
                  </label>
                </div>
                <div className="w-px bg-gray-300" />
                
                {/* Actions */}
                <button onClick={() => execCommand("undo")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Annuler">
                  ↶
                </button>
                <button onClick={() => execCommand("redo")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Refaire">
                  ↷
                </button>
                <button onClick={() => execCommand("removeFormat")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Effacer le formatage">
                  🧹
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Insertion Avancée */}
                <button onClick={insertTable} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Tableau">
                  📊
                </button>
                <button onClick={insertColumns} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Colonnes">
                  📑
                </button>
                <button onClick={() => execCommand("insertHorizontalRule")} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Ligne">
                  ─
                </button>
                <button onClick={insertShape} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Formes">
                  ◼️
                </button>
                <button onClick={insertTextBox} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Zone de texte">
                  📝
                </button>
                <button onClick={insertBorder} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Encadrement">
                  🔲
                </button>
                <div className="w-px bg-gray-300" />
                
                {/* Éléments Spéciaux */}
                <button onClick={insertDefaultHeader} className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700" title="En-tête">
                  📋
                </button>
                <button onClick={insertNotesResume} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" title="Notes">
                  📝
                </button>
                <button onClick={insertImage} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" title="Image">
                  🖼️
                </button>
                <button onClick={insertLogo} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" title="Logo">
                  🏷️
                </button>
                <button onClick={insertBackgroundImage} className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700" title="Fond">
                  🎨
                </button>
                <button onClick={insertWatermark} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700" title="Filigrane">
                  💧
                </button>
                <button onClick={insertSection} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700" title="Section">
                  📄
                </button>
                <button onClick={insertPageBreak} className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700" title="Saut de page">
                  📃
                </button>
                <div className="w-px h-6 bg-gray-300" />
                
                {/* Mode Déplacement */}
                <label className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded cursor-pointer" title="Activer le déplacement des éléments">
                  <input type="checkbox" checked={isDraggingEnabled} onChange={(e) => setIsDraggingEnabled(e.target.checked)} className="rounded" />
                  <span className="text-sm font-semibold text-yellow-800">📍 Déplacer</span>
                </label>
              </div>
            </div>
          )}

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
                lineHeight: "1.6",
                textAlign: "left",
                direction: "ltr"
              }}
              suppressContentEditableWarning
            />
          </div>

          {/* Options de sauvegarde */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Sauvegarder comme template réutilisable
              </span>
            </label>

            {saveAsTemplate && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nom du template"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => {
              setMode("list")
              resetForm()
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors"
          >
            {currentReport ? "Mettre à jour" : "Créer le rapport"}
          </button>
        </div>
      </div>
    </div>
  )
}
