import React, { useState, useEffect } from "react"
import { SampleProgrammeChart } from "./SampleProgrammeChart"
import { MonthlyEnrollmentChart } from "./MonthlyEnrollmentChart"
import { StatusConversionChart } from "./StatusConversionChart"
import { GenreMonthlyStats } from "./GenreMonthlyStats"
import { DegreMonthlyStats } from "./DegreMonthlyStats"
import { EcoleMonthlyStats } from "./EcoleMonthlyStats"
import { VilleMonthlyStats } from "./VilleMonthlyStats"
import { OrigineMonthlyStats } from "./OrigineMonthlyStats"
import { ProgrammeMonthlyStats } from "./ProgrammeMonthlyStats"
import { DemeurAvecMonthlyStats } from "./DemeurAvecMonthlyStats"
import { InterventionsSuiviMonthlyStats } from "./InterventionsSuiviMonthlyStats"
import { InterventionsSansSuiviMonthlyStats } from "./InterventionsSansSuiviMonthlyStats"
import { InterventionsParProgrammeStats } from "./InterventionsParProgrammeStats"
import { useEnrollments } from "../hooks/useEnrollments"
import { useNavigate } from "react-router-dom"
import { apiClient } from "../lib/api-client"
import toast from "react-hot-toast"
import { WeatherWidget } from "./WeatherWidget"
import { NotificationBell } from "./NotificationBell"
import { SupportButton } from "./SupportButton"
import { useCustomAuth } from "../hooks/useCustomAuth"
import { StudentPrintModal } from "./StudentPrintModal"
import { useAllNotes } from "../hooks/useAllNotes"

interface StatsSamplePageProps {
  onNavigate?: (tab: string) => void
}

export const StatsSamplePage: React.FC<StatsSamplePageProps> = ({ onNavigate }) => {
  const { enrollments } = useEnrollments()
  const { notes } = useAllNotes()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [startYear, setStartYear] = React.useState(currentYear)
  const [startMonth, setStartMonth] = React.useState(4)
  const [startDay, setStartDay] = React.useState(1)
  const [endYear, setEndYear] = React.useState(currentYear + 1)
  const [endMonth, setEndMonth] = React.useState(3)
  const [endDay, setEndDay] = React.useState(31)
  const [selectedProgramme, setSelectedProgramme] = React.useState("tous")
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false)
  const [showPrintModal, setShowPrintModal] = React.useState(false)
  


  const handleShowCompleteStats = () => {
    const statsSection = document.getElementById('complete-stats-section')
    if (statsSection) {
      statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.success('Affichage des statistiques complètes')
    }
  }

  // Filtrer uniquement les étudiants actifs et fermés (exclure les profils virtuels et les statuts attente/refusé)
  const filteredEnrollments = enrollments.filter(e => 
    e.prenom !== "" && (e.status === "actif" || e.status === "ferme")
  )

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const projectId = "p384255179950706688"
      const functionUrl = `https://api.lumi.new/v1/functions/${projectId}/generateStatsPDF`
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('benado_session_token')}`
        },
        body: JSON.stringify({
          startYear,
          startMonth,
          startDay,
          endYear,
          endMonth,
          endDay,
          selectedProgramme
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.pdf) {
        // Convertir le base64 en blob et télécharger
        const byteCharacters = atob(data.pdf)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.filename || 'statistiques.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success('PDF généré avec succès !')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
    } catch (error: any) {
      console.error('Erreur génération PDF:', error)
      toast.error(error.message || 'Erreur lors de la génération du PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <StudentPrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} />
      
      <div className="max-w-7xl mx-auto">
        {/* Filtres interactifs - Design sobre */}
        <div className="mb-6">
          {/* Filtre par programme */}
          <div className="mb-5">
            <h3 className="text-gray-800 font-semibold text-base mb-3">
              Filtrer par programme
            </h3>
            <div className="flex flex-wrap gap-3">
              {["tous", "ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"].map((prog) => (
                <button
                  key={prog}
                  onClick={() => setSelectedProgramme(prog === "tous" ? "tous" : prog)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedProgramme === (prog === "tous" ? "tous" : prog)
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
                  }`}>
                  {prog === "tous" ? "Tous" : prog}
                </button>
              ))}
            </div>
          </div>

          {/* Période personnalisée */}
          <div className="mb-5">
            <h3 className="text-gray-800 font-semibold text-base mb-3">
              Période personnalisée
            </h3>
            <div className="flex gap-6">
              {/* Date de début */}
              <div>
                <p className="text-gray-700 mb-3 font-medium">Date de début</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={startDay}
                    onChange={(e) => setStartDay(Number(e.target.value))}
                    min="1"
                    max="31"
                    className="w-20 px-3 py-2 rounded-lg text-center font-semibold border border-gray-300"
                    placeholder="Jour"
                  />
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    className="w-32 px-4 py-2 rounded-lg font-semibold border border-gray-300">
                    {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    min="1900"
                    max="2100"
                    className="w-24 px-3 py-2 rounded-lg text-center font-semibold border border-gray-300"
                    placeholder="Année"
                  />
                </div>
              </div>

              {/* Date de fin */}
              <div>
                <p className="text-gray-700 mb-3 font-medium">Date de fin</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={endDay}
                    onChange={(e) => setEndDay(Number(e.target.value))}
                    min="1"
                    max="31"
                    className="w-20 px-3 py-2 rounded-lg text-center font-semibold border border-gray-300"
                    placeholder="Jour"
                  />
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                    className="w-32 px-4 py-2 rounded-lg font-semibold border border-gray-300">
                    {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    min="1900"
                    max="2100"
                    className="w-24 px-3 py-2 rounded-lg text-center font-semibold border border-gray-300"
                    placeholder="Année"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Barre du bas: Période + Boutons + Programme */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Période sélectionnée */}
            <div className="text-gray-800">
              <p className="text-sm text-gray-600 mb-1">PÉRIODE SÉLECTIONNÉE</p>
              <p className="font-bold text-lg">
                {startDay} {["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][startMonth - 1]} {startYear} → {endDay} {["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][endMonth - 1]} {endYear}
              </p>
            </div>

            {/* Boutons centraux */}
            <div className="flex gap-3">
              <button 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingPDF ? 'Génération...' : 'Générer le PDF'}
              </button>

              <button 
                onClick={handleShowCompleteStats}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-md">
                Stats Complètes
              </button>
            </div>

            {/* Programme choisi */}
            <div className="text-gray-800 text-right">
              <p className="text-sm text-gray-600 mb-1">PROGRAMME CHOISI</p>
              <p className="font-bold text-lg">{selectedProgramme === "tous" ? "Tous les programmes" : selectedProgramme}</p>
            </div>
          </div>
        </div>

        {/* Graphique principal */}
        <SampleProgrammeChart
          enrollments={filteredEnrollments}
          startYear={startYear}
          startMonth={startMonth}
          endYear={endYear}
          endMonth={endMonth}
          selectedProgramme={selectedProgramme}
        />



        {/* Graphiques additionnels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Évolution mensuelle */}
          <MonthlyEnrollmentChart
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
          />

          {/* Taux de conversion */}
          <StatusConversionChart
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
          />
        </div>

        {/* Statistiques détaillées par catégorie */}
        <div id="complete-stats-section" className="space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Statistiques mensuelles détaillées</h2>
          
          <GenreMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <DegreMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <EcoleMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <VilleMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <OrigineMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <ProgrammeMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <DemeurAvecMonthlyStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            startDay={1}
            endYear={endYear}
            endMonth={endMonth}
            endDay={31}
            selectedProgramme={selectedProgramme}
          />
          
          <InterventionsSuiviMonthlyStats
            notes={notes}
            enrollments={enrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <InterventionsSansSuiviMonthlyStats
            notes={notes}
            enrollments={enrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
          
          <InterventionsParProgrammeStats
            enrollments={filteredEnrollments}
            startYear={startYear}
            startMonth={startMonth}
            endYear={endYear}
            endMonth={endMonth}
            selectedProgramme={selectedProgramme}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-lg px-6 py-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Période: <span className="font-semibold text-indigo-600">Avril {startYear} - Mars {endYear}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
