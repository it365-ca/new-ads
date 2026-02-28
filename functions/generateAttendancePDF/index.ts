import { createClient } from "@lumi.new/sdk"
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
    const enrollmentId = body.enrollmentId

    if (!enrollmentId) {
      return jsonResponse({ error: "Missing enrollmentId" }, 400)
    }

    // Récupérer l'enrollment
    const enrollment = await lumi.entities.enrollments.get(enrollmentId)
    if (!enrollment) {
      return jsonResponse({ error: "Enrollment not found" }, 404)
    }

    // Récupérer les présences
    const attendancesResult = await lumi.entities.attendances.list({
      filter: { enrollmentId }
    })
    const attendances = attendancesResult.list

    // Calculer les jours ouvrables
    const getWeekdays = (startDate: string, endDate: string): string[] => {
      const weekdays: string[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const day = date.getDay()
        if (day >= 1 && day <= 5) {
          weekdays.push(new Date(date).toISOString().split('T')[0])
        }
      }
      return weekdays
    }

    const weekdays = getWeekdays(enrollment.dateEntree, enrollment.dateFin)
    const presentDays = attendances.filter(a => a.status === "present").length
    const absentDays = attendances.filter(a => a.status === "absent").length
    const percentage = weekdays.length > 0 ? Math.round((presentDays / weekdays.length) * 100) : 0

    // Créer le PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any

    // En-tête avec gradient
    doc.setFillColor(99, 102, 241) // indigo-500
    doc.rect(0, 0, 210, 50, "F")
    
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text("📅 Feuille de Présence", 105, 20, { align: "center" })
    
    doc.setFontSize(16)
    doc.text(`${enrollment.prenom} ${enrollment.nom}`, 105, 32, { align: "center" })
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Programme: ${enrollment.programme}`, 105, 40, { align: "center" })
    doc.text(`Période: ${new Date(enrollment.dateEntree).toLocaleDateString("fr-CA")} - ${new Date(enrollment.dateFin).toLocaleDateString("fr-CA")}`, 105, 46, { align: "center" })

    let yPos = 60

    // Statistiques
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text("📊 Statistiques de présence", 15, yPos)
    yPos += 10

    const statsData = [
      ['Jours présents', presentDays.toString(), '✅'],
      ['Jours absents', absentDays.toString(), '❌'],
      ['Jours ouvrables totaux', weekdays.length.toString(), '📅'],
      ['Taux de présence', `${percentage}%`, percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴']
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Statistique', 'Valeur', 'Statut']],
      body: statsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [229, 231, 235],
        textColor: [31, 41, 55],
        fontSize: 12,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 11,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center', fontSize: 13, fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'center', fontSize: 14 }
      }
    })

    yPos = doc.lastAutoTable.finalY + 15

    // Historique des absences
    const absences = attendances.filter(a => a.status === "absent")
    if (absences.length > 0) {
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38) // red-600
      doc.text(`📋 Historique des absences (${absences.length})`, 15, yPos)
      yPos += 10

      const absencesData = absences.map(a => [
        new Date(a.date).toLocaleDateString("fr-CA"),
        a.motifAbsence || "Non spécifié",
        a.commentaire || "-"
      ])

      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Motif', 'Commentaire']],
        body: absencesData,
        theme: 'grid',
        headStyles: { 
          fillColor: [254, 226, 226], // red-100
          textColor: [31, 41, 55],
          fontSize: 11,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 95 }
        }
      })

      yPos = doc.lastAutoTable.finalY + 15
    }

    // Feuille de présence détaillée
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text("📅 Feuille de présence détaillée", 15, yPos)
    yPos += 10

    const detailedData = weekdays.map(dateStr => {
      const attendance = attendances.find(a => a.date.split('T')[0] === dateStr)
      const dayOfWeek = new Date(dateStr).toLocaleDateString("fr-CA", { weekday: "long" })
      const displayDate = new Date(dateStr).toLocaleDateString("fr-CA")
      
      let status = "Non marqué"
      let statusIcon = "⚪"
      
      if (attendance?.status === "present") {
        status = "Présent"
        statusIcon = "✅"
      } else if (attendance?.status === "absent") {
        status = "Absent"
        statusIcon = "❌"
      }

      return [
        displayDate,
        dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
        statusIcon + " " + status
      ]
    })

    // Diviser en pages si nécessaire
    const pageSize = 25
    for (let i = 0; i < detailedData.length; i += pageSize) {
      if (i > 0) {
        doc.addPage()
        yPos = 20
      }

      const pageData = detailedData.slice(i, i + pageSize)

      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Jour', 'Statut']],
        body: pageData,
        theme: 'striped',
        headStyles: { 
          fillColor: [229, 231, 235],
          textColor: [31, 41, 55],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 40, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 70, halign: 'center' }
        }
      })

      yPos = doc.lastAutoTable.finalY + 10
    }

    // Footer sur toutes les pages
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128) // gray-500
      doc.text(`Page ${i} sur ${pageCount}`, 105, 287, { align: "center" })
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-CA")} à ${new Date().toLocaleTimeString("fr-CA")}`, 105, 292, { align: "center" })
    }

    const pdfBase64 = doc.output("datauristring").split(",")[1]

    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfBase64,
        filename: `feuille-presence-${enrollment.prenom}-${enrollment.nom}-${new Date().toISOString().split("T")[0]}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error generating attendance PDF:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: errorMessage, details: error }, 500)
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(handler)
