import React, { useState, useEffect, useRef } from "react"

const GEOAPIFY_API_KEY = "66324bf11d2040b6b878430bb728c2b5"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onVilleChange?: (ville: string) => void
  onCodePostalChange?: (codePostal: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

interface GeoapifyResult {
  formatted: string
  city?: string
  postcode?: string
  address_line1?: string
  address_line2?: string
  state?: string
  street?: string
  housenumber?: string
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onVilleChange,
  onCodePostalChange,
  placeholder = "Entrez l'adresse...",
  className = "",
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue)
    
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (inputValue.length >= 3) {
      setIsLoading(true)
      abortControllerRef.current = new AbortController()
      
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(inputValue)}&filter=countrycode:ca&limit=10&format=json&apiKey=${GEOAPIFY_API_KEY}`,
          { signal: abortControllerRef.current.signal }
        )
        
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          setSuggestions(data.results)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Erreur lors de la recherche d'adresse:", error)
          setSuggestions([])
          setShowSuggestions(false)
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setActiveSuggestionIndex(-1)
  }

  const handleSuggestionClick = (suggestion: GeoapifyResult) => {
    const fullAddress = suggestion.formatted || suggestion.address_line1 || ""
    onChange(fullAddress)
    
    // Extraire et mettre à jour la ville et le code postal
    if (onVilleChange && suggestion.city) {
      onVilleChange(suggestion.city)
    }
    if (onCodePostalChange && suggestion.postcode) {
      onCodePostalChange(suggestion.postcode)
    }
    
    setShowSuggestions(false)
    setSuggestions([])
    setActiveSuggestionIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[activeSuggestionIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === activeSuggestionIndex ? "bg-indigo-100" : ""
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">📍</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 font-medium">
                    {suggestion.housenumber && suggestion.street ? 
                      `${suggestion.housenumber} ${suggestion.street}` : 
                      suggestion.address_line1 || suggestion.formatted
                    }
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{suggestion.city}</span>
                    {suggestion.state && <span>• {suggestion.state}</span>}
                    {suggestion.postcode && <span>• {suggestion.postcode}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
