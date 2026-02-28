import React, { useState, useRef, useEffect } from "react"
import { useReports } from "../hooks/useReports"
import { useCustomAuth } from "../hooks/useCustomAuth"
import { useModal } from "../contexts/ModalContext"
import { lumi } from "../lib/lumi"
import mammoth from "mammoth"

export const ReportTemplateManagement: React.FC = () => {
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useReports()
  const { user } = useCustomAuth()
  const modal = useModal()
  
  const [mode, setMode] = useState<"list" | "edit">("list")
  const [currentTemplate, setCurrentTemplate] = useState<any>(null)
  
  // États du formulaire
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [contenuHTML, setContenuHTML] = useState("")
  
  // États de la barre d'outils
  const [fontSize, setFontSize] = useState("14px")
  const [fontFamily, setFontFamily] = useState("Arial")
  const [highlightColor, setHighlightColor] = useState("#ffff00")
  const [textColor, setTextColor] = useState("#000000")
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false)
  
  const [isDeleting, setIsDeleting] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // =========================================================================
  // 1. FONCTION SPÉCIALE : GÉNÉRER LE TEMPLATE "SAUTS" (PDF)
  // =========================================================================
  const generateSautsTemplate = async () => {
    if (!user) {
        console.error('❌ User not authenticated')
        modal.error("Vous devez être connecté pour générer un template.", "Erreur Auth");
        return;
    }
    console.log('✅ User authenticated:', user)

    const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm(
            "Voulez-vous générer automatiquement le modèle 'Bilan SAUTS' (basé sur le PDF) ?",
            "Génération Automatique",
            () => resolve(true),
            () => resolve(false)
        )
    })
    if (!confirmed) return

    // HTML reconstruit fidèlement au PDF
    const htmlContent = `
    <div style="font-family: 'Arial', sans-serif; color: #333; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; background: white;">
      
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 1px;">Synthèse du séjour</h1>
        <h2 style="color: #475569; margin: 5px 0; font-size: 18px; font-weight: bold;">PROGRAMME « SAUTS »</h2>
      </div>

      <div style="margin-bottom: 20px; padding: 10px; background-color: #f1f5f9; border-radius: 6px; font-size: 15px;">
        <strong>Nom du participant :</strong> <span style="display: inline-block; width: 60%; border-bottom: 1px solid #64748b;">&nbsp;</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        
        <div>
          <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
            <h3 style="background-color: #e0f2fe; padding: 6px; border-left: 5px solid #0284c7; margin-top: 0; color: #0369a1; font-size: 15px; font-weight: bold;">Comportements prosociaux</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 10px 0;">
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> S'intègre aisément au groupe</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Démontre des compétences de résolution de conflits</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Crée des liens aisément avec l'adulte</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Participe dans les activités de groupe</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Est empathique face aux autres</li>
            </ul>
          </div>

          <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
            <h3 style="background-color: #e0f2fe; padding: 6px; border-left: 5px solid #0284c7; margin-top: 0; color: #0369a1; font-size: 15px; font-weight: bold;">Compétences organisationnelles</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 10px 0;">
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Gère bien son temps dans les activités</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Maintient un bon rythme de travail</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Se mobilise facilement</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Comprend et respecte les consignes</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Bonne organisation générale</li>
            </ul>
          </div>
        </div>

        <div>
          <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
            <h3 style="background-color: #fce7f3; padding: 6px; border-left: 5px solid #db2777; margin-top: 0; color: #be185d; font-size: 15px; font-weight: bold;">Gestion des émotions / stress</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 10px 0;">
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Affiche une bonne capacité d'introspection</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Utilise des stratégies en situation de stress</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Demande de l'aide au besoin</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Est réceptif(ve) aux interventions</li>
            </ul>
          </div>

          <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
            <h3 style="background-color: #fce7f3; padding: 6px; border-left: 5px solid #db2777; margin-top: 0; color: #be185d; font-size: 15px; font-weight: bold;">Entrée au secondaire</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 10px 0;">
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Exprime son excitation</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Se dit très anxieux(se)</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Nomme son indifférence</li>
              <li style="margin-bottom: 6px; display: flex; align-items: start;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Mentionne aucun intérêt</li>
              <li style="margin-bottom: 6px; display: flex; align-items: center;"><input type="checkbox" style="margin-top: 4px; margin-right: 8px;" /> Autres: <span style="border-bottom: 1px dotted #000; flex-grow: 1; margin-left: 5px;">&nbsp;</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
        <h3 style="margin-top: 0; font-size: 16px; color: #334155;">Pistes d'accompagnement / d'observation :</h3>
        <div style="border: 1px solid #94a3b8; min-height: 120px; border-radius: 4px; padding: 10px; background-color: #fff;">
          <br><br><br>
        </div>
      </div>

      <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <strong>Date :</strong> <span style="display: inline-block; width: 120px; border-bottom: 1px solid #000;">${new Date().toLocaleDateString('fr-CA')}</span>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; font-weight: bold; font-size: 14px;">Intervenantes sociales, Benado</div>
        </div>
      </div>
    </div>
    `

    try {
        await createTemplate({
            nom: "Bilan SAUTS (Officiel)",
            description: "Synthèse du séjour - Formulaire standardisé",
            contenuHTML: htmlContent,
            hasLogo: true,
            hasHeader: false, // On a mis l'en-tête directement dans le HTML
            isPublic: true
        })
        modal.success("Le template 'Bilan SAUTS' a été créé avec succès !", "Succès")
        await fetchTemplates() // Rafraîchir la liste
    } catch (e: any) {
        console.error(e)
        modal.error("Erreur lors de la création : " + e.message, "Erreur")
    }
  }

  // =========================================================================
  // 2. FONCTIONS DE L'ÉDITEUR RICHE (BARRE D'OUTILS WORD)
  // =========================================================================
  
  const insertDefaultHeader = () => {
    const header = `<div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;"><h1 style="margin: 0; color: #6366f1; font-size: 28px;">Benado</h1><p style="margin: 5px 0; color: #666;">Gestion des étudiants</p><p style="margin: 5px 0; font-size: 14px; color: #999;">Date: ${new Date().toLocaleDateString('fr-CA')}</p></div>`
    if (editorRef.current) { 
        editorRef.current.innerHTML = header + editorRef.current.innerHTML; 
        setContenuHTML(editorRef.current.innerHTML); 
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    execCommand("fontSize", "7") // Astuce pour créer la balise <font>
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      // On essaye d'entourer la sélection d'un span avec la bonne taille
      try {
          // Note : Cette méthode est simple, pour un éditeur pro il faudrait parser le HTML
          // Mais pour ce besoin, le execCommand fait souvent l'affaire.
          // Le span permet de forcer le style CSS exact.
          const span = document.createElement("span")
          span.style.fontSize = size
          // range.surroundContents(span) // Peut échouer si la sélection croise des balises
      } catch (e) {
          console.warn("Impossible d'appliquer le style précis, utilisation par défaut")
      }
    }
  }

  const changeFontFamily = (font: string) => {
    setFontFamily(font)
    execCommand("fontName", font)
  }

  const insertPageBreak = () => {
    const pageBreak = '<div style="page-break-after: always; margin: 20px 0; border-top: 2px dashed #ccc; padding-top: 20px; color: #999; text-align: center; font-size: 12px;">--- SAUT DE PAGE ---</div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += pageBreak
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  const insertSection = () => {
    const section = '<div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #6366f1;"><h3 style="margin-top:0;">Nouvelle section</h3><p>Contenu de la section...</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += section
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  const insertImage = () => {
    const url = prompt("URL de l'image:")
    if (url) {
      const draggable = isDraggingEnabled ? 'draggable="true"' : ''
      const img = `<img src="${url}" ${draggable} style="max-width: 100%; height: auto; margin: 10px 0; cursor: ${isDraggingEnabled ? 'move' : 'default'};" />`
      if (editorRef.current) {
        editorRef.current.innerHTML += img
        setContenuHTML(editorRef.current.innerHTML)
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
        setContenuHTML(editorRef.current.innerHTML)
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
        setContenuHTML(editorRef.current.innerHTML)
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
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  const insertTextBox = () => {
    const textBox = '<div style="border: 2px dashed #6366f1; padding: 20px; margin: 15px 0; background: #f9fafb; min-height: 80px;" contenteditable="true"><p>Zone de texte éditable...</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += textBox
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  const insertWatermark = () => {
    const text = prompt("Texte du filigrane:", "CONFIDENTIEL")
    if (text) {
      const watermark = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(100, 100, 100, 0.1); font-weight: bold; z-index: 0; pointer-events: none;">${text}</div>`
      if (editorRef.current) {
        editorRef.current.innerHTML = watermark + editorRef.current.innerHTML
        setContenuHTML(editorRef.current.innerHTML)
      }
    }
  }

  const insertBorder = () => {
    const borderDiv = '<div style="border: 3px solid #6366f1; padding: 20px; margin: 15px 0; border-radius: 8px;"><p>Contenu encadré...</p></div>'
    if (editorRef.current) {
      editorRef.current.innerHTML += borderDiv
      setContenuHTML(editorRef.current.innerHTML)
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
      setContenuHTML(editorRef.current.innerHTML)
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
      setContenuHTML(editorRef.current.innerHTML)
    }
  }

  // =========================================================================
  // IMPORT DOCUMENT WORD (.docx) - CRÉATION AUTOMATIQUE DE TEMPLATE
  // =========================================================================
  const importWordDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.docx')) {
      modal.error("Veuillez sélectionner un fichier Word (.docx)", "Format invalide")
      return
    }

    if (!user) {
      modal.error("Vous devez être connecté pour importer un document.", "Erreur Auth")
      return
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const htmlContent = result.value
      
      // Nettoyer et améliorer le HTML
      const cleanedHTML = htmlContent
        .replace(/<p><\/p>/g, '<br>') // Remplacer paragraphes vides par <br>
        .replace(/<p>/g, '<p style="margin: 10px 0; line-height: 1.6;">') // Ajouter espacement
        .replace(/<h1>/g, '<h1 style="margin: 15px 0; font-size: 24px; font-weight: bold;">')
        .replace(/<h2>/g, '<h2 style="margin: 12px 0; font-size: 20px; font-weight: bold;">')
        .replace(/<h3>/g, '<h3 style="margin: 10px 0; font-size: 18px; font-weight: bold;">')
        .replace(/<ul>/g, '<ul style="margin: 10px 0; padding-left: 20px;">')
        .replace(/<ol>/g, '<ol style="margin: 10px 0; padding-left: 20px;">')
        .replace(/<li>/g, '<li style="margin: 5px 0;">')
      
      // Envelopper le contenu dans un conteneur stylisé
      const styledHTML = `<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;">${cleanedHTML}</div>`
      
      // Créer automatiquement le template
      const templateName = file.name.replace('.docx', '')
      
      modal.info(`Création du template "${templateName}" en cours...`, "Import Word")
      
      await createTemplate({
        nom: templateName,
        description: `Template importé depuis ${file.name} le ${new Date().toLocaleDateString('fr-CA')}`,
        contenuHTML: styledHTML,
        hasLogo: styledHTML.includes('<img'),
        hasHeader: styledHTML.includes('<h1') || styledHTML.includes('border-bottom'),
        isPublic: true
      })
      
      modal.success(`Template "${templateName}" créé avec succès ! Vous pouvez maintenant le modifier.`, "Import réussi")
      await fetchTemplates()
      
      // Afficher les messages/avertissements de conversion
      if (result.messages && result.messages.length > 0) {
        console.log('📋 Messages de conversion Word:', result.messages)
      }
    } catch (error: any) {
      console.error('❌ Erreur import Word:', error)
      modal.error(`Erreur lors de l'import : ${error.message}`, "Erreur")
    }
    
    // Réinitialiser l'input
    event.target.value = ''
  }

  // =========================================================================
  // 3. GESTION DES DONNÉES (SAUVEGARDER, SUPPRIMER)
  // =========================================================================

  const handleSave = async () => {
    if (!nom.trim()) {
      modal.error("Veuillez entrer un nom pour le template.", "Erreur")
      return
    }

    if (!user) {
      console.error('❌ User not authenticated')
      modal.error("Vous devez être connecté pour sauvegarder un template.", "Erreur Auth")
      return
    }

    try {
      // On s'assure de prendre le contenu actuel de la div éditable
      const currentContent = editorRef.current?.innerHTML || contenuHTML

      console.log('🔍 Données du template à sauvegarder:', {
        nom,
        description,
        contentLength: currentContent.length,
        hasLogo: currentContent.includes("<img"),
        hasHeader: currentContent.includes("border-bottom"),
        isUpdate: !!currentTemplate
      })

      const templateData = {
        nom,
        description,
        contenuHTML: currentContent,
        hasLogo: currentContent.includes("<img"),
        hasHeader: currentContent.includes("border-bottom"),
        isPublic: true
      }

      if (currentTemplate) {
        // Vérification de sécurité
        if (user && currentTemplate.creator !== user.userId) {
           modal.error("Vous ne pouvez modifier que vos propres templates.", "Accès refusé")
           return
        }
        console.log('📝 Mise à jour du template:', currentTemplate._id)
        await updateTemplate(currentTemplate._id, templateData)
        modal.success("Template mis à jour avec succès.", "Succès")
      } else {
        console.log('✨ Création d\'un nouveau template')
        await createTemplate(templateData)
        modal.success("Template créé avec succès.", "Succès")
      }

      setMode("list")
      resetForm()
      await fetchTemplates()
    } catch (error: any) {
      console.error("❌ Erreur complète lors de la sauvegarde:", error)
      console.error("❌ Message d'erreur:", error?.message)
      console.error("❌ Stack trace:", error?.stack)
      const errorMsg = error?.message || error?.toString() || "Erreur inconnue"
      modal.error(`Impossible de sauvegarder: ${errorMsg}`, "Erreur")
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!templateId) {
      console.error('❌ ID du template manquant')
      modal.error("ID du template manquant", "Erreur")
      return
    }
    
    console.log('🔍 Tentative de suppression du template:', templateId)
    
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm(
        "Êtes-vous sûr de vouloir supprimer ce template ?",
        "Confirmation",
        () => resolve(true),
        () => resolve(false)
      )
    })
    
    if (!confirmed) {
      console.log('❌ Suppression annulée par l\'utilisateur')
      return
    }
    
    setIsDeleting(true)
    try {
      console.log('⏳ Appel de deleteTemplate avec ID:', templateId)
      await deleteTemplate(templateId)
      console.log('✅ deleteTemplate terminé avec succès')
      modal.success("Template supprimé avec succès.", "Succès")
      await fetchTemplates() // Rafraîchir la liste
    } catch (error: any) {
      console.error("❌ Failed to delete template - Erreur complète:", {
        error,
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      })
      
      const errorMsg = error?.message || error?.toString() || 'Erreur inconnue'
      
      if (errorMsg.includes('permission') || errorMsg.includes('403') || errorMsg.includes('PERMISSION')) {
          modal.error(`Vous n'avez pas la permission de supprimer ce template: ${errorMsg}`, "Erreur Permission")
      } else {
          modal.error(`Erreur lors de la suppression: ${errorMsg}`, "Erreur")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteMyTemplates = async () => {
    if (!user) return
    const myTemplates = templates.filter(t => t.creator === user.userId)
    if (myTemplates.length === 0) {
        modal.info("Vous n'avez aucun template à supprimer.", "Info")
        return
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm(
        `Êtes-vous sûr de vouloir supprimer VOS ${myTemplates.length} templates ?`,
        "Nettoyage",
        () => resolve(true),
        () => resolve(false)
      )
    })
    if (!confirmed) return
    
    setIsDeleting(true)
    let deletedCount = 0
    for (const template of myTemplates) {
      if (template._id) {
          try { await deleteTemplate(template._id); deletedCount++; } catch (e) {}
      }
    }
    modal.success(`${deletedCount} templates supprimés.`, "Succès")
    await fetchTemplates()
    setIsDeleting(false)
  }

  const editTemplate = (template: any) => {
    setCurrentTemplate(template)
    setNom(template.nom)
    setDescription(template.description || "")
    setContenuHTML(template.contenuHTML)
    setMode("edit")
    
    // Délai pour laisser le HTML se charger dans le DOM
    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = template.contenuHTML
        }
    }, 100)
  }

  const resetForm = () => {
    setCurrentTemplate(null)
    setNom("")
    setDescription("")
    setContenuHTML("")
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  const isOwner = (templateCreatorId: string) => {
      return user && user.userId === templateCreatorId
  }

  // =========================================================================
  // 4. RENDU VISUEL (LISTE ET ÉDITEUR)
  // =========================================================================

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800 font-semibold"
            >
              ← Retour
            </button>
            <h2 className="text-2xl font-bold text-gray-900">📄 Templates de rapports</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
             {/* BOUTON MAGIQUE SAUTS */}
            <button
              onClick={generateSautsTemplate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
            >
              🚀 Générer Bilan SAUTS
            </button>

            <button
              onClick={() => {
                resetForm()
                setMode("edit")
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ Créer vide
            </button>
            
            <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2">
              📄 Importer Word
              <input
                type="file"
                accept=".docx"
                onChange={importWordDocument}
                className="hidden"
              />
            </label>
            
            {templates.some(t => user && t.creator === user.userId) && (
              <button
                onClick={deleteMyTemplates}
                disabled={isDeleting}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? "..." : "🧹 Nettoyer"}
              </button>
            )}
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-lg text-gray-500">Aucun template de rapport</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const userIsOwner = isOwner(template.creator)
              return (
                <div key={template._id} className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow ${userIsOwner ? 'border-gray-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{template.nom}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => editTemplate(template)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            {userIsOwner ? "✏️ Modifier" : "👁️ Voir"}
                        </button>
                        {userIsOwner && (
                            <button
                                onClick={() => handleDelete(template._id)}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                                🗑️ Supprimer
                            </button>
                        )}
                    </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // MODE ÉDITION (AVEC TOUTE LA BARRE D'OUTILS)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentTemplate ? "✏️ Modifier le template" : "📝 Créer un template"}
        </h2>
        <button
          onClick={() => {
            setMode("list")
            resetForm()
          }}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Nom et description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du template *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500"
              placeholder="Ex: Rapport mensuel standard"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500"
              placeholder="Décrire l'usage de ce template..."
              rows={2}
            />
          </div>
        </div>

        {/* ================= BARRE D'OUTILS COMPLÈTE ================= */}
        <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 sticky top-0 z-10">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Police et taille */}
            <select value={fontFamily} onChange={(e) => changeFontFamily(e.target.value)} className="px-2 py-1 bg-white border rounded">
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Calibri">Calibri</option>
              <option value="Cambria">Cambria</option>
              <option value="Georgia">Georgia</option>
              <option value="Garamond">Garamond</option>
              <option value="Palatino">Palatino</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
            <select value={fontSize} onChange={(e) => changeFontSize(e.target.value)} className="px-2 py-1 bg-white border rounded">
              <option value="8px">8</option>
              <option value="10px">10</option>
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="28px">28</option>
              <option value="36px">36</option>
              <option value="48px">48</option>
              <option value="72px">72</option>
            </select>
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Formatage de base */}
            <button onClick={() => execCommand("bold")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Gras"><strong>B</strong></button>
            <button onClick={() => execCommand("italic")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Italique"><em>I</em></button>
            <button onClick={() => execCommand("underline")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Souligné"><u>U</u></button>
            <button onClick={() => execCommand("strikeThrough")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Barré"><s>S</s></button>
            <button onClick={() => execCommand("subscript")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Indice">X<sub>2</sub></button>
            <button onClick={() => execCommand("superscript")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Exposant">X<sup>2</sup></button>
            
            {/* Alignement */}
            <button onClick={() => execCommand("justifyLeft")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">⬅️</button>
            <button onClick={() => execCommand("justifyCenter")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">↔️</button>
            <button onClick={() => execCommand("justifyRight")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">➡️</button>
            <button onClick={() => execCommand("justifyFull")} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">⬌</button>
            
            <div className="w-px h-6 bg-gray-300" />

            {/* Couleurs */}
            <label className="px-2 py-1 bg-white border rounded hover:bg-gray-50 cursor-pointer" title="Texte">
              <span className="text-sm font-bold" style={{color: textColor}}>A</span>
              <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); execCommand("foreColor", e.target.value); }} className="w-0 h-0 opacity-0" />
            </label>
            <label className="px-2 py-1 bg-white border rounded hover:bg-gray-50 cursor-pointer" title="Surlignage">
              <span className="text-sm" style={{backgroundColor: highlightColor}}>🖍️</span>
              <input type="color" value={highlightColor} onChange={(e) => { setHighlightColor(e.target.value); execCommand("hiliteColor", e.target.value); }} className="w-0 h-0 opacity-0" />
            </label>
            
            <div className="w-px h-6 bg-gray-300" />

            {/* Insertion */}
            <button onClick={insertTable} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Tableau">📊</button>
            <button onClick={insertColumns} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Colonnes">📑</button>
            <button onClick={insertShape} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Formes">◼️</button>
            <button onClick={insertTextBox} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Zone texte">📝</button>
            <button onClick={insertBorder} className="px-3 py-1 bg-white border rounded hover:bg-gray-50" title="Encadrement">🔲</button>
            <button onClick={() => execCommand("insertUnorderedList")} className="px-3 py-1 bg-white border rounded" title="Liste">•</button>
            <button onClick={() => execCommand("insertHorizontalRule")} className="px-3 py-1 bg-white border rounded" title="Ligne">─</button>
            
            <div className="w-px h-6 bg-gray-300" />

            {/* Outils Avancés */}
            <label className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 cursor-pointer" title="Importer Word">
              📤
              <input type="file" accept=".docx" onChange={importWordDocument} className="hidden" />
            </label>
            <button onClick={insertDefaultHeader} className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700" title="En-tête">📋</button>
            <button onClick={insertImage} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" title="Image">🖼️</button>
            <button onClick={insertLogo} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" title="Logo">🏷️</button>
            <button onClick={insertBackgroundImage} className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700" title="Fond">🎨</button>
            <button onClick={insertWatermark} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700" title="Filigrane">💧</button>
            <button onClick={insertSection} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700" title="Section">📄</button>
            <button onClick={insertPageBreak} className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700" title="Saut Page">📃</button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Mode Déplacement */}
            <label className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded cursor-pointer" title="Activer déplacement">
              <input type="checkbox" checked={isDraggingEnabled} onChange={(e) => setIsDraggingEnabled(e.target.checked)} className="rounded" />
              <span className="text-sm font-semibold text-yellow-800">📍</span>
            </label>
          </div>
        </div>

        {/* Éditeur */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => setContenuHTML(e.currentTarget.innerHTML)}
            className="min-h-[600px] p-8 bg-white focus:outline-none"
            style={{ fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "1.6" }}
            suppressContentEditableWarning
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={() => { setMode("list"); resetForm() }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Annuler</button>
          <button onClick={handleSave} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold">
            {currentTemplate ? "Mettre à jour" : "Créer le template"}
          </button>
        </div>
      </div>
    </div>
  )
}
