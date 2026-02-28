import React from "react"
import toast from "react-hot-toast"

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  value: string
  setValue: (value: string) => void
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({ textareaRef, value, setValue }) => {
  const applyFormatting = (format: string, formatValue?: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let formattedText = ""
    let newCursorPos = start

    // Vérifier si du texte est sélectionné
    if (start === end && format !== "bullet" && format !== "number") {
      toast.error("Veuillez sélectionner du texte d'abord")
      return
    }

    // Extraire le texte pur (sans balises HTML) pour éviter l'imbrication incorrecte
    const stripHTML = (html: string): string => {
      const tmp = document.createElement("div")
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ""
    }
    
    const cleanText = stripHTML(selectedText)

    switch (format) {
      case "bold":
        formattedText = `<strong>${cleanText}</strong>`
        newCursorPos = start + 8
        break
      case "italic":
        formattedText = `<em>${cleanText}</em>`
        newCursorPos = start + 4
        break
      case "underline":
        formattedText = `<u>${cleanText}</u>`
        newCursorPos = start + 3
        break
      case "h1":
        formattedText = `<h1 style="font-size:24px;font-weight:bold;margin:10px 0">${cleanText}</h1>`
        newCursorPos = start + 61
        break
      case "h2":
        formattedText = `<h2 style="font-size:20px;font-weight:bold;margin:8px 0">${cleanText}</h2>`
        newCursorPos = start + 59
        break
      case "h3":
        formattedText = `<h3 style="font-size:18px;font-weight:bold;margin:6px 0">${cleanText}</h3>`
        newCursorPos = start + 59
        break
      case "bullet":
        formattedText = `<ul style="margin-left:20px;list-style-type:disc"><li>${cleanText || "Élément de liste"}</li></ul>`
        newCursorPos = start + 55
        break
      case "number":
        formattedText = `<ol style="margin-left:20px"><li>${cleanText || "Élément numéroté"}</li></ol>`
        newCursorPos = start + 37
        break
      case "quote":
        formattedText = `<blockquote style="border-left:4px solid #4F46E5;padding-left:16px;margin:12px 0;color:#666;font-style:italic">${cleanText}</blockquote>`
        newCursorPos = start + 115
        break
      case "code":
        formattedText = `<code style="background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;color:#e53e3e">${cleanText}</code>`
        newCursorPos = start + 106
        break
      case "highlight":
        formattedText = `<mark style="background-color:#fef08a;padding:2px 4px">${cleanText}</mark>`
        newCursorPos = start + 56
        break
      case "strikethrough":
        formattedText = `<s>${cleanText}</s>`
        newCursorPos = start + 3
        break
      case "link":
        const url = prompt("Entrez l'URL:")
        if (url) {
          formattedText = `<a href="${url}" target="_blank" style="color:#4F46E5;text-decoration:underline">${cleanText}</a>`
          newCursorPos = start + `<a href="${url}" target="_blank" style="color:#4F46E5;text-decoration:underline">`.length
        } else {
          return
        }
        break
      case "textColor":
        formattedText = `<span style="color:${formatValue}">${cleanText}</span>`
        newCursorPos = start + `<span style="color:${formatValue}">`.length
        break
      case "bgColor":
        formattedText = `<span style="background-color:${formatValue}">${cleanText}</span>`
        newCursorPos = start + `<span style="background-color:${formatValue}">`.length
        break
      case "fontFamily":
        formattedText = `<span style="font-family:${formatValue}">${cleanText}</span>`
        newCursorPos = start + `<span style="font-family:${formatValue}">`.length
        break
      case "fontSize":
        formattedText = `<span style="font-size:${formatValue}">${cleanText}</span>`
        newCursorPos = start + `<span style="font-size:${formatValue}">`.length
        break
      default:
        return
    }

    const newText = value.substring(0, start) + formattedText + value.substring(end)
    setValue(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos + cleanText.length)
    }, 0)
  }

  const handleColorChange = (type: "textColor" | "bgColor") => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    if (start === end) {
      toast.error("Veuillez sélectionner du texte d'abord")
      return
    }
    
    // Créer un input temporaire pour choisir la couleur
    const colorInput = document.createElement("input")
    colorInput.type = "color"
    colorInput.style.position = "absolute"
    colorInput.style.opacity = "0"
    document.body.appendChild(colorInput)
    
    colorInput.addEventListener("change", () => {
      applyFormatting(type, colorInput.value)
      document.body.removeChild(colorInput)
    })
    
    colorInput.click()
  }
  
  const handleSelectChange = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    if (start === end) {
      toast.error("Veuillez sélectionner du texte d'abord")
      return
    }
    
    applyFormatting(format)
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-t-lg">
      <select
        onChange={(e) => {
          if (e.target.value) {
            handleSelectChange(e.target.value)
            e.target.value = ""
          }
        }}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
        title="Style">
        <option value="">🔻 Normal</option>
        <option value="h1">Titre 1</option>
        <option value="h2">Titre 2</option>
        <option value="h3">Titre 3</option>
      </select>
      
      <button
        type="button"
        onClick={() => applyFormatting("bold")}
        className="px-3 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Gras">
        B
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("italic")}
        className="px-3 py-1 text-sm italic bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Italique">
        I
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("underline")}
        className="px-3 py-1 text-sm underline bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Souligné">
        U
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      <button
        type="button"
        onClick={() => handleColorChange("textColor")}
        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center cursor-pointer"
        title="Couleur texte">
        🎨
      </button>
      <button
        type="button"
        onClick={() => handleColorChange("bgColor")}
        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center cursor-pointer"
        title="Couleur fond">
        🖍️
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      <select 
        onChange={(e) => {
          if (e.target.value && e.target.value !== "🔻 Police") {
            const textarea = textareaRef.current
            if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
              applyFormatting("fontFamily", e.target.value)
            } else {
              toast.error("Veuillez sélectionner du texte d'abord")
            }
            e.target.value = ""
          }
        }}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" 
        title="Police">
        <option>🔻 Police</option>
        <option value="Arial">Arial</option>
        <option value="'Times New Roman'">Times New Roman</option>
        <option value="'Courier New'">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>
      
      <select 
        onChange={(e) => {
          if (e.target.value && e.target.value !== "🔻 Taille") {
            const textarea = textareaRef.current
            if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
              applyFormatting("fontSize", e.target.value)
            } else {
              toast.error("Veuillez sélectionner du texte d'abord")
            }
            e.target.value = ""
          }
        }}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" 
        title="Taille">
        <option>🔻 Taille</option>
        <option value="10px">10px</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
      </select>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      <button
        type="button"
        onClick={() => applyFormatting("bullet")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Liste à puces">
        • Liste
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("number")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Liste numérotée">
        1. Numérotée
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("quote")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Citation">
        ❝ Citation
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      
      <button
        type="button"
        onClick={() => applyFormatting("code")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Code">
        &lt;/&gt; Code
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("highlight")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Surligner">
        🖍️ Surligné
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("strikethrough")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Barré">
        <span style={{ textDecoration: "line-through" }}>S</span>
      </button>
      <button
        type="button"
        onClick={() => applyFormatting("link")}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        title="Lien hypertexte">
        🔗 Lien
      </button>
    </div>
  )
}
