import { createClient } from "npm:@lumi.new/sdk@0.3.3"
import { jsPDF } from "npm:jspdf@2.5.2"
import "npm:jspdf-autotable@3.8.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    const authorization = req.headers.get("Authorization")
    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header" }, 401)
    }

    const projectId = "p384255179950706688"
    const apiBaseUrl = "https://api.lumi.new"

    const lumi = createClient({
      projectId,
      apiBaseUrl,
      authOrigin: "",
      authorization,
    })

    // Récupérer les paramètres du body
    const body = await req.json().catch(() => ({}))
    const currentYear = new Date().getFullYear()
    const startYear = body.startYear || currentYear
    const startMonth = body.startMonth || 4
    const startDay = body.startDay || 1
    const endYear = body.endYear || currentYear + 1
    const endMonth = body.endMonth || 3
    const endDay = body.endDay || 31
    const selectedProgramme = body.selectedProgramme || "tous"

    const enrollmentsResult = await lumi.entities.enrollments.list()
    const notesResult = await lumi.entities.notes.list()

    const enrollments = enrollmentsResult.list
    const notes = notesResult.list

    // Créer le PDF en mode paysage
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any
    let yPos = 20

    const startDate = new Date(startYear, startMonth - 1, 1)
    const endDate = new Date(endYear, endMonth, 0)
    
    // Si "tous" est sélectionné, on génère un PDF complet avec les stats de tous les programmes
    if (selectedProgramme === "tous") {
      // En-tête pour stats complètes
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, 297, 40, "F")
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text("Statistiques Completes - Tous les Programmes", 148.5, 20, { align: "center" })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Genere le ${new Date().toLocaleDateString("fr-CA")} a ${new Date().toLocaleTimeString("fr-CA")}`, 148.5, 28, { align: "center" })
      doc.text(`Periode: ${startDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })} - ${endDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })}`, 148.5, 35, { align: "center" })
      
      // Générer d'abord les stats globales (tous programmes confondus)
      await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, "tous", true)
      
      // Ensuite générer les stats pour chaque programme individuellement
      const allProgrammes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
      for (const prog of allProgrammes) {
        doc.addPage()
        await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, prog, false)
      }
    } else {
      // Génération pour un seul programme
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, 297, 40, "F")
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`Statistiques - ${selectedProgramme}`, 148.5, 20, { align: "center" })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Genere le ${new Date().toLocaleDateString("fr-CA")} a ${new Date().toLocaleTimeString("fr-CA")}`, 148.5, 28, { align: "center" })
      doc.text(`Periode: ${startDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })} - ${endDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })}`, 148.5, 35, { align: "center" })
      
      await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, selectedProgramme, true)
    }

    const pdfBase64 = doc.output("datauristring").split(",")[1]

    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfBase64,
        filename: selectedProgramme === "tous" 
          ? `statistiques-completes-${new Date().toISOString().split("T")[0]}.pdf`
          : `statistiques-${selectedProgramme}-${new Date().toISOString().split("T")[0]}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error generating PDF:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: errorMessage, details: error }, 500)
  }
}

// Fonction helper pour générer les stats d'un programme
async function generateStatsForProgramme(
  doc: any, 
  enrollments: any[], 
  notes: any[], 
  startDate: Date, 
  endDate: Date, 
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  programme: string,
  isFirstPage: boolean
) {
  let yPos = isFirstPage ? 50 : 20
  
  // Si ce n'est pas la première page, ajouter un en-tête de section
  if (!isFirstPage) {
    doc.setFillColor(79, 70, 229)
    doc.rect(0, 0, 297, 30, "F")
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`Programme: ${programme}`, 148.5, 18, { align: "center" })
    yPos = 40
  }

  // Filtrer les enrollments selon le programme
  const enrollmentsInPeriod = enrollments.filter(e => {
    const entryDate = new Date(e.dateEntree || e.createdAt)
    const inPeriod = entryDate >= startDate && entryDate <= endDate
    return programme === "tous" ? inPeriod : (inPeriod && e.programme === programme)
  })

  const stats = {
    total: enrollmentsInPeriod.length,
    en_attente: enrollmentsInPeriod.filter(e => e.status === "en_attente").length,
    actif: enrollmentsInPeriod.filter(e => e.status === "actif").length,
    ferme: enrollmentsInPeriod.filter(e => e.status === "ferme").length,
    refuse: enrollmentsInPeriod.filter(e => e.status === "refuse").length,
  }

  // Statistiques globales
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55) // gray-900
  const titleText = programme === "tous" ? "Statistiques globales (Tous programmes)" : `Statistiques - ${programme}`
  doc.text(titleText, 15, yPos)
  yPos += 10
  
  doc.autoTable({
    startY: yPos,
    head: [['Statistique', 'Nombre']],
    body: [
      ['Total etudiants (periode)', stats.total.toString()],
      ['En attente', stats.en_attente.toString()],
      ['Actifs', stats.actif.toString()],
      ['Fermes', stats.ferme.toString()],
      ['Refuses', stats.refuse.toString()],
    ],
      theme: 'striped',
      headStyles: { 
        fillColor: [229, 231, 235], // gray-200
        textColor: [31, 41, 55], // gray-900
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: { 
        fontSize: 11,
        cellPadding: 6,
        font: 'helvetica'
      },
      columnStyles: {
        0: { cellWidth: 200, fontStyle: 'normal', textColor: [55, 65, 81] },
        1: { cellWidth: 60, halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229], fontSize: 13 }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // gray-50
      }
    })

    yPos = doc.lastAutoTable.finalY + 20

    // ===== STATISTIQUES MENSUELLES =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text("Nombre d'inscriptions par mois", 148.5, yPos, { align: "center" })
    yPos += 15

    const monthsList: { year: number; month: number; label: string }[] = []
    let currentYearLoop = startYear
    let currentMonthLoop = startMonth
    while (currentYearLoop < endYear || (currentYearLoop === endYear && currentMonthLoop <= endMonth)) {
      const date = new Date(currentYearLoop, currentMonthLoop - 1, 1)
      const label = date.toLocaleDateString("fr-CA", { month: "short" }).replace(".", "")
      monthsList.push({ year: currentYearLoop, month: currentMonthLoop, label })
      currentMonthLoop++
      if (currentMonthLoop > 12) {
        currentMonthLoop = 1
        currentYearLoop++
      }
    }

    const monthlyEnrollments: Record<string, number> = {}
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      const inPeriod = entryDate >= startDate && entryDate <= endDate
      if (inPeriod && (programme === "tous" || e.programme === programme)) {
        monthlyEnrollments[key] = (monthlyEnrollments[key] || 0) + 1
      }
    })

    const monthlyHeaders = ['Mois', ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total']
    const monthlyBody = [['Inscriptions', ...monthsList.map(m => {
      const key = `${m.year}-${m.month}`
      return (monthlyEnrollments[key] || 0).toString()
    }), Object.values(monthlyEnrollments).reduce((sum, val) => sum + val, 0).toString()]]

    doc.autoTable({
      startY: yPos,
      head: [monthlyHeaders],
      body: monthlyBody,
      theme: 'grid',
      headStyles: { 
        fillColor: [216, 180, 254], // purple-300
        textColor: [31, 41, 55],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        halign: 'center',
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 45, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR PROGRAMME =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(99, 102, 241) // indigo-500
    doc.text("Nombre d'inscriptions par programmes", 148.5, yPos, { align: "center" })
    yPos += 15

    const allProgrammes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"]
    const programmesByMonth: Record<string, Record<string, number>> = {}
    
    allProgrammes.forEach(prog => {
      programmesByMonth[prog] = {}
    })

    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      const inPeriod = entryDate >= startDate && entryDate <= endDate
      if (inPeriod && (programme === "tous" || e.programme === programme)) {
        if (!programmesByMonth[e.programme]) programmesByMonth[e.programme] = {}
        programmesByMonth[e.programme][key] = (programmesByMonth[e.programme][key] || 0) + 1
      }
    })

    const programmeRows = allProgrammes.map(prog => {
      const row = [prog]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = programmesByMonth[prog]?.[key] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const grandTotal = allProgrammes.reduce((sum, p) => {
        return sum + monthsList.reduce((mSum, m) => {
          const k = `${m.year}-${m.month}`
          return mSum + (programmesByMonth[p]?.[k] || 0)
        }, 0)
      }, 0)
      const percentage = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const programmeTotalsRow = ['Total']
    let programmeGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      allProgrammes.forEach(prog => {
        monthTotal += programmesByMonth[prog]?.[key] || 0
      })
      programmeTotalsRow.push(monthTotal.toString())
      programmeGrandTotal += monthTotal
    })
    programmeTotalsRow.push(programmeGrandTotal.toString())
    programmeTotalsRow.push('100%')

    programmeRows.push(programmeTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Programme`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: programmeRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [147, 197, 253], // blue-300
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR ECOLE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(34, 197, 94) // green-500
    doc.text("Statistiques par ecole (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const ecolesByMonth: Record<string, Record<string, number>> = {}
    const allEcoles = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!ecolesByMonth[key]) ecolesByMonth[key] = {}
      ecolesByMonth[key][e.ecoleReferente] = (ecolesByMonth[key][e.ecoleReferente] || 0) + 1
      allEcoles.add(e.ecoleReferente)
    })

    const ecolesArray = Array.from(allEcoles).sort()
    
    // Calculer le grand total d'abord
    let ecoleGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      ecolesArray.forEach(ecole => {
        ecoleGrandTotal += ecolesByMonth[key]?.[ecole] || 0
      })
    })
    
    const ecoleRows = ecolesArray.map(ecole => {
      const row = [ecole]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = ecolesByMonth[key]?.[ecole] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = ecoleGrandTotal > 0 ? ((rowTotal / ecoleGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const ecoleTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      ecolesArray.forEach(ecole => {
        monthTotal += ecolesByMonth[key]?.[ecole] || 0
      })
      ecoleTotalsRow.push(monthTotal.toString())
    })
    ecoleTotalsRow.push(ecoleGrandTotal.toString())
    ecoleTotalsRow.push('100%')
    ecoleRows.push(ecoleTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Ecole`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: ecoleRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [134, 239, 172], // green-300
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR VILLE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(234, 88, 12) // orange-600
    doc.text("Statistiques par ville (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const villesByMonth: Record<string, Record<string, number>> = {}
    const allVilles = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!villesByMonth[key]) villesByMonth[key] = {}
      villesByMonth[key][e.ville] = (villesByMonth[key][e.ville] || 0) + 1
      allVilles.add(e.ville)
    })

    const villesArray = Array.from(allVilles).sort()
    
    // Calculer le grand total d'abord
    let villeGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      villesArray.forEach(ville => {
        villeGrandTotal += villesByMonth[key]?.[ville] || 0
      })
    })
    
    const villeRows = villesArray.map(ville => {
      const row = [ville]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = villesByMonth[key]?.[ville] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = villeGrandTotal > 0 ? ((rowTotal / villeGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const villeTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      villesArray.forEach(ville => {
        monthTotal += villesByMonth[key]?.[ville] || 0
      })
      villeTotalsRow.push(monthTotal.toString())
    })
    villeTotalsRow.push(villeGrandTotal.toString())
    villeTotalsRow.push('100%')
    villeRows.push(villeTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Ville`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: villeRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [254, 215, 170], // orange-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR DEGRE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(168, 85, 247) // purple-500
    doc.text("Statistiques par degre scolaire (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const degresByMonth: Record<string, Record<string, number>> = {}
    const allDegres = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!degresByMonth[key]) degresByMonth[key] = {}
      degresByMonth[key][e.degreScolaire] = (degresByMonth[key][e.degreScolaire] || 0) + 1
      allDegres.add(e.degreScolaire)
    })

    const degresArray = Array.from(allDegres).sort()
    
    // Calculer le grand total d'abord
    let degreGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      degresArray.forEach(degre => {
        degreGrandTotal += degresByMonth[key]?.[degre] || 0
      })
    })
    
    const degreRows = degresArray.map(degre => {
      const row = [degre]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = degresByMonth[key]?.[degre] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = degreGrandTotal > 0 ? ((rowTotal / degreGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const degreTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      degresArray.forEach(degre => {
        monthTotal += degresByMonth[key]?.[degre] || 0
      })
      degreTotalsRow.push(monthTotal.toString())
    })
    degreTotalsRow.push(degreGrandTotal.toString())
    degreTotalsRow.push('100%')
    degreRows.push(degreTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Degre`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: degreRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [221, 214, 254], // purple-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR GENRE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(236, 72, 153) // pink-500
    doc.text("Statistiques par genre (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const genresByMonth: Record<string, Record<string, number>> = {}
    const allGenres = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!genresByMonth[key]) genresByMonth[key] = {}
      genresByMonth[key][e.genre] = (genresByMonth[key][e.genre] || 0) + 1
      allGenres.add(e.genre)
    })

    const genresArray = Array.from(allGenres).sort()
    
    // Calculer le grand total d'abord
    let genreGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      genresArray.forEach(genre => {
        genreGrandTotal += genresByMonth[key]?.[genre] || 0
      })
    })
    
    const genreRows = genresArray.map(genre => {
      const row = [genre]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = genresByMonth[key]?.[genre] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = genreGrandTotal > 0 ? ((rowTotal / genreGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const genreTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      genresArray.forEach(genre => {
        monthTotal += genresByMonth[key]?.[genre] || 0
      })
      genreTotalsRow.push(monthTotal.toString())
    })
    genreTotalsRow.push(genreGrandTotal.toString())
    genreTotalsRow.push('100%')
    genreRows.push(genreTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Genre`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: genreRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [252, 231, 243], // pink-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES PAR AGE ET GENRE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // orange-500
    doc.text("Statistiques par age et genre", 148.5, yPos, { align: "center" })
    yPos += 15

    // Créer la structure de données pour âge et genre
    const ageGenreStats: Record<number, Record<string, number>> = {}
    for (let age = 5; age <= 25; age++) {
      ageGenreStats[age] = { "Masculin": 0, "Féminin": 0, "Autres": 0 }
    }

    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const age = e.age
      if (age >= 5 && age <= 25) {
        const genre = e.genre || "Autres"
        ageGenreStats[age][genre] = (ageGenreStats[age][genre] || 0) + 1
      }
    })

    // Calculer les totaux par genre et par âge
    const genres = ["Masculin", "Féminin", "Autres"]
    const agesTotals: Record<number, number> = {}
    const genreTotals: Record<string, number> = { "Masculin": 0, "Féminin": 0, "Autres": 0 }
    let grandTotal = 0

    for (let age = 5; age <= 25; age++) {
      agesTotals[age] = 0
      genres.forEach(genre => {
        const count = ageGenreStats[age][genre]
        agesTotals[age] += count
        genreTotals[genre] += count
        grandTotal += count
      })
    }

    // Créer les lignes du tableau (genres en vertical, âges en horizontal)
    const ageGenreRows = []
    
    // Ligne pour chaque genre
    genres.forEach(genre => {
      const row = [genre]
      let genreTotal = 0
      for (let age = 5; age <= 25; age++) {
        const count = ageGenreStats[age][genre]
        row.push(count.toString())
        genreTotal += count
      }
      row.push(genreTotal.toString())
      const percentage = grandTotal > 0 ? ((genreTotal / grandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      ageGenreRows.push(row)
    })

    // Ligne de totaux
    const totalRow = ["Total"]
    for (let age = 5; age <= 25; age++) {
      totalRow.push(agesTotals[age].toString())
    }
    totalRow.push(grandTotal.toString())
    const totalPercentage = grandTotal > 0 ? "100.0" : "0.0"
    totalRow.push(`${totalPercentage}%`)
    ageGenreRows.push(totalRow)

    // En-tête avec les âges
    const ageHeaders = ["Genre"]
    for (let age = 5; age <= 25; age++) {
      ageHeaders.push(`${age} ans`)
    }
    ageHeaders.push("Total")
    ageHeaders.push("%")

    doc.autoTable({
      startY: yPos,
      head: [ageHeaders],
      body: ageGenreRows,
      theme: "grid",
      headStyles: { 
        fillColor: [253, 186, 116], // orange-300
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center"
      },
      styles: { 
        fontSize: 7,
        halign: "center",
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "left", fontStyle: "bold", fillColor: [249, 250, 251] }
      },
      didParseCell: function(data: any) {
        // Style pour la ligne Total
        if (data.row.index === ageGenreRows.length - 1) {
          data.cell.styles.fillColor = [253, 186, 116] // orange-300
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.fontSize = 9
          data.cell.styles.textColor = [249, 115, 22] // orange-500
        }
      }
    })

    // ===== STATISTIQUES DEMEURE AVEC =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(14, 165, 233) // sky-500
    doc.text("Statistiques par demeure avec (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const demeurAvecByMonth: Record<string, Record<string, number>> = {}
    const allDemeurAvec = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!demeurAvecByMonth[key]) demeurAvecByMonth[key] = {}
      demeurAvecByMonth[key][e.demeurAvec] = (demeurAvecByMonth[key][e.demeurAvec] || 0) + 1
      allDemeurAvec.add(e.demeurAvec)
    })

    const demeurAvecArray = Array.from(allDemeurAvec).sort()
    
    // Calculer le grand total d'abord
    let demeurAvecGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      demeurAvecArray.forEach(demeur => {
        demeurAvecGrandTotal += demeurAvecByMonth[key]?.[demeur] || 0
      })
    })
    
    const demeurAvecRows = demeurAvecArray.map(demeur => {
      const row = [demeur]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = demeurAvecByMonth[key]?.[demeur] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = demeurAvecGrandTotal > 0 ? ((rowTotal / demeurAvecGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const demeurAvecTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      demeurAvecArray.forEach(demeur => {
        monthTotal += demeurAvecByMonth[key]?.[demeur] || 0
      })
      demeurAvecTotalsRow.push(monthTotal.toString())
    })
    demeurAvecTotalsRow.push(demeurAvecGrandTotal.toString())
    demeurAvecTotalsRow.push('100%')
    demeurAvecRows.push(demeurAvecTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Demeure avec`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: demeurAvecRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [186, 230, 253], // sky-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== STATISTIQUES ORIGINE =====
    doc.addPage()
    yPos = 20
    doc.setFontSize(22)
    doc.setTextColor(251, 146, 60) // orange-400
    doc.text("Statistiques par origine (mensuel)", 148.5, yPos, { align: "center" })
    yPos += 15

    const origineByMonth: Record<string, Record<string, number>> = {}
    const allOrigines = new Set<string>()
    enrollments.filter(e => e.status === "actif" || e.status === "ferme").forEach(e => {
      const entryDate = new Date(e.dateEntree || e.createdAt)
      const year = entryDate.getFullYear()
      const month = entryDate.getMonth() + 1
      const key = `${year}-${month}`
      if (!origineByMonth[key]) origineByMonth[key] = {}
      origineByMonth[key][e.origine] = (origineByMonth[key][e.origine] || 0) + 1
      allOrigines.add(e.origine)
    })

    const originesArray = Array.from(allOrigines).sort()
    
    // Calculer le grand total d'abord
    let origineGrandTotal = 0
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      originesArray.forEach(origine => {
        origineGrandTotal += origineByMonth[key]?.[origine] || 0
      })
    })
    
    const origineRows = originesArray.map(origine => {
      const row = [origine]
      let rowTotal = 0
      monthsList.forEach(m => {
        const key = `${m.year}-${m.month}`
        const count = origineByMonth[key]?.[origine] || 0
        row.push(count.toString())
        rowTotal += count
      })
      row.push(rowTotal.toString())
      const percentage = origineGrandTotal > 0 ? ((rowTotal / origineGrandTotal) * 100).toFixed(1) : "0.0"
      row.push(`${percentage}%`)
      return row
    })

    const origineTotalsRow = ['Total']
    monthsList.forEach(m => {
      const key = `${m.year}-${m.month}`
      let monthTotal = 0
      originesArray.forEach(origine => {
        monthTotal += origineByMonth[key]?.[origine] || 0
      })
      origineTotalsRow.push(monthTotal.toString())
    })
    origineTotalsRow.push(origineGrandTotal.toString())
    origineTotalsRow.push('100%')
    origineRows.push(origineTotalsRow)

    doc.autoTable({
      startY: yPos,
      head: [[`Origine`, ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total', '%']],
      body: origineRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [254, 215, 170], // orange-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      }
    })

    // ===== INTERVENTIONS - NOTES AVEC SUIVI =====
    doc.addPage()
    yPos = 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 83, 45) // green-900
    doc.text("Interventions - Notes avec suivi", 148.5, yPos, { align: "center" })
    yPos += 10

    // Calculer stats mensuelles avec suivi
    const interventionTypesSuivi = [
      "Contact scolaire", "Rencontre scolaire", "Nombre scolaire",
      "Contact jeune", "Rencontre jeune", "Nombre jeune",
      "Contact parent", "Rencontre parent", "Nombre parent",
      "Contact autre", "Rencontre autre", "Nombre autre",
      "Organisme communautaire", "Protection jeunesse", "CISSSMO",
      "Ecole aux adultes", "Milieu de stage", "Policier preventionniste",
      "Ressource psychologique"
    ]
    
    const interventionKeysSuivi = [
      "contactScolaire", "rencontreScolaire", "nombreScolaire",
      "contactJeune", "rencontreJeune", "nombreJeune",
      "contactParent", "rencontreParent", "nombreParent",
      "contactAutre", "rencontreAutre", "nombreAutre",
      "organismeCommunautaire", "protectionJeunesse", "cisssmo",
      "ecoleAuxAdultes", "milieuStage", "policierPreventionniste",
      "ressourcePsychologique"
    ]

    const interventionStatsSuivi: Record<string, Record<string, number>> = {}
    interventionKeysSuivi.forEach(key => {
      interventionStatsSuivi[key] = {}
      monthsList.forEach(m => {
        const monthKey = `${m.year}-${m.month}`
        interventionStatsSuivi[key][monthKey] = 0
      })
    })

    notes.filter(n => n.suivi === true).forEach(note => {
      const noteDate = new Date(note.dateCreation || note.createdAt)
      const year = noteDate.getFullYear()
      const month = noteDate.getMonth() + 1
      const key = `${year}-${month}`
      
      if (noteDate >= startDate && noteDate <= endDate) {
        interventionKeysSuivi.forEach((field, index) => {
          const value = (note as any)[field] || 0
          interventionStatsSuivi[field][key] = (interventionStatsSuivi[field][key] || 0) + value
        })
      }
    })

    const interventionRowsSuivi = interventionTypesSuivi.map((type, idx) => {
      const key = interventionKeysSuivi[idx]
      const row = [type]
      let rowTotal = 0
      monthsList.forEach(m => {
        const monthKey = `${m.year}-${m.month}`
        const val = interventionStatsSuivi[key][monthKey] || 0
        row.push(val.toString())
        rowTotal += val
      })
      row.push(rowTotal.toString())
      return row
    })

    // Calculer les sous-totaux par catégorie (sans ligne Total mensuel)
    const totalScolaireSuivi = parseInt(interventionRowsSuivi[0][interventionRowsSuivi[0].length - 1]) + 
                                parseInt(interventionRowsSuivi[1][interventionRowsSuivi[1].length - 1]) + 
                                parseInt(interventionRowsSuivi[2][interventionRowsSuivi[2].length - 1])
    const totalJeuneSuivi = parseInt(interventionRowsSuivi[3][interventionRowsSuivi[3].length - 1]) + 
                            parseInt(interventionRowsSuivi[4][interventionRowsSuivi[4].length - 1]) + 
                            parseInt(interventionRowsSuivi[5][interventionRowsSuivi[5].length - 1])
    const totalParentSuivi = parseInt(interventionRowsSuivi[6][interventionRowsSuivi[6].length - 1]) + 
                             parseInt(interventionRowsSuivi[7][interventionRowsSuivi[7].length - 1]) + 
                             parseInt(interventionRowsSuivi[8][interventionRowsSuivi[8].length - 1])
    const totalOrganismesSuivi = parseInt(interventionRowsSuivi[12][interventionRowsSuivi[12].length - 1]) + 
                                  parseInt(interventionRowsSuivi[13][interventionRowsSuivi[13].length - 1]) + 
                                  parseInt(interventionRowsSuivi[14][interventionRowsSuivi[14].length - 1]) +
                                  parseInt(interventionRowsSuivi[15][interventionRowsSuivi[15].length - 1]) + 
                                  parseInt(interventionRowsSuivi[16][interventionRowsSuivi[16].length - 1]) + 
                                  parseInt(interventionRowsSuivi[17][interventionRowsSuivi[17].length - 1]) + 
                                  parseInt(interventionRowsSuivi[18][interventionRowsSuivi[18].length - 1])

    // Insérer les lignes de totaux après chaque catégorie
    const totalScolaireRowSuivi = ['Total Contacts Scolaires', ...Array(monthsList.length).fill(''), totalScolaireSuivi.toString()]
    const totalJeuneRowSuivi = ['Total Contacts Jeunes', ...Array(monthsList.length).fill(''), totalJeuneSuivi.toString()]
    const totalParentRowSuivi = ['Total Contacts Parents', ...Array(monthsList.length).fill(''), totalParentSuivi.toString()]
    const totalOrganismesRowSuivi = ['Total Organismes Externes', ...Array(monthsList.length).fill(''), totalOrganismesSuivi.toString()]
    
    // Insérer les totaux aux bonnes positions
    interventionRowsSuivi.splice(3, 0, totalScolaireRowSuivi)
    interventionRowsSuivi.splice(7, 0, totalJeuneRowSuivi)
    interventionRowsSuivi.splice(11, 0, totalParentRowSuivi)
    interventionRowsSuivi.push(totalOrganismesRowSuivi)

    doc.autoTable({
      startY: yPos,
      head: [['Type d\'intervention', ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total']],
      body: interventionRowsSuivi,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 252, 231], // green-100
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      },
      didParseCell: function(data: any) {
        // Style pour les lignes de totaux (positions 3, 7, 11, et dernière)
        const totalRowIndexes = [3, 7, 11, data.table.body.length - 1]
        if (totalRowIndexes.includes(data.row.index)) {
          data.cell.styles.fillColor = [220, 252, 231] // green-100
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 9
          data.cell.styles.textColor = [22, 163, 74] // green-600
        }
      }
    })

    // ===== INTERVENTIONS - NOTES SANS SUIVI =====
    yPos = doc.lastAutoTable.finalY + 15

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(234, 88, 12) // orange-600
    doc.text("Interventions - Notes sans suivi", 148.5, yPos, { align: "center" })
    yPos += 10

    // Calculer stats mensuelles sans suivi
    const interventionTypesSansSuivi = [
      "Contact scolaire", "Rencontre scolaire", "Nombre scolaire",
      "Contact jeune", "Rencontre jeune", "Nombre jeune",
      "Contact parent", "Rencontre parent", "Nombre parent",
      "Contact autre", "Rencontre autre", "Nombre autre",
      "Organisme communautaire", "Protection jeunesse", "CISSSMO",
      "Ecole aux adultes", "Milieu de stage", "Policier preventionniste",
      "Ressource psychologique"
    ]
    
    const interventionKeysSansSuivi = [
      "contactScolaire", "rencontreScolaire", "nombreScolaire",
      "contactJeune", "rencontreJeune", "nombreJeune",
      "contactParent", "rencontreParent", "nombreParent",
      "contactAutre", "rencontreAutre", "nombreAutre",
      "organismeCommunautaire", "protectionJeunesse", "cisssmo",
      "ecoleAuxAdultes", "milieuStage", "policierPreventionniste",
      "ressourcePsychologique"
    ]

    const interventionStatsSansSuivi: Record<string, Record<string, number>> = {}
    interventionKeysSansSuivi.forEach(key => {
      interventionStatsSansSuivi[key] = {}
      monthsList.forEach(m => {
        const monthKey = `${m.year}-${m.month}`
        interventionStatsSansSuivi[key][monthKey] = 0
      })
    })

    notes.filter(n => n.suivi === false).forEach(note => {
      const noteDate = new Date(note.dateCreation || note.createdAt)
      const year = noteDate.getFullYear()
      const month = noteDate.getMonth() + 1
      const key = `${year}-${month}`
      
      if (noteDate >= startDate && noteDate <= endDate) {
        interventionKeysSansSuivi.forEach((field, index) => {
          const value = (note as any)[field] || 0
          interventionStatsSansSuivi[field][key] = (interventionStatsSansSuivi[field][key] || 0) + value
        })
      }
    })

    const interventionRowsSansSuivi = interventionTypesSansSuivi.map((type, idx) => {
      const key = interventionKeysSansSuivi[idx]
      const row = [type]
      let rowTotal = 0
      monthsList.forEach(m => {
        const monthKey = `${m.year}-${m.month}`
        const val = interventionStatsSansSuivi[key][monthKey] || 0
        row.push(val.toString())
        rowTotal += val
      })
      row.push(rowTotal.toString())
      return row
    })

    // Calculer les sous-totaux par catégorie (sans ligne Total mensuel)
    const totalScolaireSansSuivi = parseInt(interventionRowsSansSuivi[0][interventionRowsSansSuivi[0].length - 1]) + 
                                    parseInt(interventionRowsSansSuivi[1][interventionRowsSansSuivi[1].length - 1]) + 
                                    parseInt(interventionRowsSansSuivi[2][interventionRowsSansSuivi[2].length - 1])
    const totalJeuneSansSuivi = parseInt(interventionRowsSansSuivi[3][interventionRowsSansSuivi[3].length - 1]) + 
                                parseInt(interventionRowsSansSuivi[4][interventionRowsSansSuivi[4].length - 1]) + 
                                parseInt(interventionRowsSansSuivi[5][interventionRowsSansSuivi[5].length - 1])
    const totalParentSansSuivi = parseInt(interventionRowsSansSuivi[6][interventionRowsSansSuivi[6].length - 1]) + 
                                 parseInt(interventionRowsSansSuivi[7][interventionRowsSansSuivi[7].length - 1]) + 
                                 parseInt(interventionRowsSansSuivi[8][interventionRowsSansSuivi[8].length - 1])
    const totalOrganismesSansSuivi = parseInt(interventionRowsSansSuivi[12][interventionRowsSansSuivi[12].length - 1]) + 
                                      parseInt(interventionRowsSansSuivi[13][interventionRowsSansSuivi[13].length - 1]) + 
                                      parseInt(interventionRowsSansSuivi[14][interventionRowsSansSuivi[14].length - 1]) +
                                      parseInt(interventionRowsSansSuivi[15][interventionRowsSansSuivi[15].length - 1]) + 
                                      parseInt(interventionRowsSansSuivi[16][interventionRowsSansSuivi[16].length - 1]) + 
                                      parseInt(interventionRowsSansSuivi[17][interventionRowsSansSuivi[17].length - 1]) + 
                                      parseInt(interventionRowsSansSuivi[18][interventionRowsSansSuivi[18].length - 1])

    // Insérer les lignes de totaux après chaque catégorie
    const totalScolaireRowSansSuivi = ['Total Contacts Scolaires', ...Array(monthsList.length).fill(''), totalScolaireSansSuivi.toString()]
    const totalJeuneRowSansSuivi = ['Total Contacts Jeunes', ...Array(monthsList.length).fill(''), totalJeuneSansSuivi.toString()]
    const totalParentRowSansSuivi = ['Total Contacts Parents', ...Array(monthsList.length).fill(''), totalParentSansSuivi.toString()]
    const totalOrganismesRowSansSuivi = ['Total Organismes Externes', ...Array(monthsList.length).fill(''), totalOrganismesSansSuivi.toString()]
    
    // Insérer les totaux aux bonnes positions
    interventionRowsSansSuivi.splice(3, 0, totalScolaireRowSansSuivi)
    interventionRowsSansSuivi.splice(7, 0, totalJeuneRowSansSuivi)
    interventionRowsSansSuivi.splice(11, 0, totalParentRowSansSuivi)
    interventionRowsSansSuivi.push(totalOrganismesRowSansSuivi)

    doc.autoTable({
      startY: yPos,
      head: [['Type d\'intervention', ...monthsList.map(m => m.label.charAt(0).toUpperCase() + m.label.slice(1)), 'Total']],
      body: interventionRowsSansSuivi,
      theme: 'grid',
      headStyles: { 
        fillColor: [254, 215, 170], // orange-200
        textColor: [31, 41, 55],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [249, 250, 251] }
      },
      didParseCell: function(data: any) {
        // Style pour les lignes de totaux (positions 3, 7, 11, et dernière)
        const totalRowIndexes = [3, 7, 11, data.table.body.length - 1]
        if (totalRowIndexes.includes(data.row.index)) {
          data.cell.styles.fillColor = [254, 215, 170] // orange-200
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 9
          data.cell.styles.textColor = [234, 88, 12] // orange-600
        }
      }
    })
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(handler)
