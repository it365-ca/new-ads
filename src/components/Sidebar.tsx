import React, { useState } from "react"
import {ChevronLeft, ChevronRight, Home, Users, Calendar, UserCheck, Settings, ClipboardList, UserPlus, BarChart3, FileText} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userRole?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userRole }) => {
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Home, roles: ["admin", "intervenant", "etudiant"] },
    { id: "presence", label: "Feuille de présence", icon: UserCheck, roles: ["admin", "intervenant"] },
    { id: "planification", label: "Planification", icon: ClipboardList, roles: ["admin", "intervenant"] },
    { id: "calendrier", label: "Calendrier", icon: Calendar, roles: ["admin", "intervenant"] },
    { id: "stats", label: "Statistiques", icon: BarChart3, roles: ["admin", "intervenant"] },
    { id: "support", label: "Support", icon: FileText, roles: ["admin", "intervenant", "etudiant"] },
    { id: "admin", label: "Administration", icon: Settings, roles: ["admin"] },
  ]

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(userRole || "etudiant")
  )

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-24 ${isOpen ? "left-80" : "left-0"} z-50 bg-white text-indigo-600 p-2 rounded-r-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200`}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-800 text-white shadow-2xl transition-all duration-500 ease-in-out z-40 ${
          isOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with Logo */}
          <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 border-b border-white/10">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl mb-4 transform hover:rotate-6 transition-transform duration-300">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Benado</h1>
            <p className="text-sm text-purple-200 font-medium">Gestion Scolaire</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full h-32 flex flex-col items-center justify-center px-4 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-br from-white/30 to-white/10 shadow-xl scale-105 border border-white/20"
                      : "hover:bg-white/10 hover:scale-105"
                  }`}
                >
                  <div className={`p-3 rounded-2xl transition-all duration-300 mb-2 ${
                    isActive
                      ? "bg-white/40 shadow-lg"
                      : "bg-white/5 group-hover:bg-white/15"
                  }`}>
                    <Icon size={28} className={isActive ? "text-white" : "text-purple-200"} />
                  </div>
                  <span className={`text-sm font-medium text-center transition-all duration-300 leading-tight ${
                    isActive
                      ? "text-white font-bold"
                      : "text-purple-100 group-hover:text-white"
                  }`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <span className="text-white font-medium">Système actif</span>
              </div>
              <div className="text-xs text-purple-200">
                Version 2.0.0
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
