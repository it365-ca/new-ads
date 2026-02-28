import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Enrollment from '../models/Enrollment';
import Note from '../models/Note';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const router = express.Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// ==========================================
// ROUTE PRINCIPALE : GÉNÉRATION DU PDF
// ==========================================
router.post('/generate-pdf', async (req: AuthRequest, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const {
      startYear = currentYear,
      startMonth = 4,
      endYear = currentYear + 1,
      endMonth = 3,
      selectedProgramme = "tous"
    } = req.body;

    // Récupération des données en parallèle (plus rapide)
    const [enrollments, notes] = await Promise.all([
      Enrollment.find({}).lean(),
      Note.find({}).lean()
    ]);

    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0);

    // Initialisation du document PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;

    if (selectedProgramme === "tous") {
      // Page de garde globale
      drawBlueHeader(doc, "Statistiques Complètes - Tous les Programmes", startDate, endDate);
      
      // 1. Générer les stats globales
      await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, "tous", true);
      
      // 2. Générer une page par programme
      const allProgrammes = ["ALT", "OPTION", "PIVOT", "APOSTROPHE", "SAUTS", "Suivis Estivaux"];
      for (const prog of allProgrammes) {
        doc.addPage();
        await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, prog, false);
      }
    } else {
      // Page de garde pour programme unique
      drawBlueHeader(doc, `Statistiques - ${selectedProgramme}`, startDate, endDate);
      await generateStatsForProgramme(doc, enrollments, notes, startDate, endDate, startYear, startMonth, endYear, endMonth, selectedProgramme, true);
    }

    const pdfBase64 = doc.output("datauristring").split(",")[1];

    res.json({
      success: true,
      pdf: pdfBase64,
      filename: `statistiques-${selectedProgramme}-${new Date().toISOString().split("T")[0]}.pdf`,
    });

  } catch (error: any) {
    console.error("Erreur PDF Stats:", error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du rapport' });
  }
});

// ==========================================
// FONCTIONS UTILITAIRES DE DESSIN
// ==========================================

function drawBlueHeader(doc: any, title: string, startDate: Date, endDate: Date) {
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 297, 40, "F");
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, 148.5, 20, { align: "center" });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-CA")} à ${new Date().toLocaleTimeString("fr-CA")}`, 148.5, 28, { align: "center" });
  doc.text(`Période: ${startDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })} - ${endDate.toLocaleDateString("fr-CA", { year: "numeric", month: "long" })}`, 148.5, 35, { align: "center" });
}

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
  let yPos = isFirstPage ? 50 : 20;
  
  if (!isFirstPage) {
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 30, "F");
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Programme: ${programme}`, 148.5, 18, { align: "center" });
    yPos = 40;
  }

  // Filtrage des inscriptions pour la période et le programme
  const enrollmentsInPeriod = enrollments.filter(e => {
    const entryDate = new Date(e.dateEntree || e.createdAt);
    const inPeriod = entryDate >= startDate && entryDate <= endDate;
    return programme === "tous" ? inPeriod : (inPeriod && e.programme === programme);
  });

  const stats = {
    total: enrollmentsInPeriod.length,
    en_attente: enrollmentsInPeriod.filter(e => e.status === "en_attente").length,
    actif: enrollmentsInPeriod.filter(e => e.status === "actif").length,
    ferme: enrollmentsInPeriod.filter(e => e.status === "ferme").length,
    refuse: enrollmentsInPeriod.filter(e => e.status === "refuse").length,
  };

  // Tableau 1: Résumé
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(programme === "tous" ? "Statistiques globales" : `Statistiques - ${programme}`, 15, yPos);
  
  doc.autoTable({
    startY: yPos + 5,
    head: [['Statistique', 'Nombre']],
    body: [
      ['Total étudiants (période)', stats.total.toString()],
      ['En attente', stats.en_attente.toString()],
      ['Actifs', stats.actif.toString()],
      ['Fermés', stats.ferme.toString()],
      ['Refusés', stats.refuse.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55] },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229] } }
  });

  // Tableau 2: Inscriptions mensuelles (Nouvelle page)
  doc.addPage();
  doc.setFontSize(22);
  doc.text("Inscriptions par mois", 148.5, 20, { align: "center" });

  const monthsList: any[] = [];
  let curY = startYear, curM = startMonth;
  while (curY < endYear || (curY === endYear && curM <= endMonth)) {
    const d = new Date(curY, curM - 1, 1);
    monthsList.push({ year: curY, month: curM, label: d.toLocaleDateString("fr-CA", { month: "short" }) });
    curM++; if (curM > 12) { curM = 1; curY++; }
  }

  const monthlyData: Record<string, number> = {};
  enrollmentsInPeriod.forEach(e => {
    const d = new Date(e.dateEntree || e.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthlyData[key] = (monthlyData[key] || 0) + 1;
  });

  doc.autoTable({
    startY: 35,
    head: [['Mois', ...monthsList.map(m => m.label), 'Total']],
    body: [['Inscriptions', ...monthsList.map(m => (monthlyData[`${m.year}-${m.month}`] || 0).toString()), stats.total.toString()]],
    theme: 'grid',
    headStyles: { fillColor: [216, 180, 254] }
  });

  // Tableau 3: Genre & Scolarité
  doc.addPage();
  const genreStats: any = {};
  enrollmentsInPeriod.forEach(e => genreStats[e.genre || 'Non spécifié'] = (genreStats[e.genre || 'Non spécifié'] || 0) + 1);
  
  doc.text("Répartition par Genre", 15, 20);
  doc.autoTable({
    startY: 25,
    head: [['Genre', 'Nombre']],
    body: Object.entries(genreStats).map(([g, c]) => [g, (c as any).toString()]),
    theme: 'striped'
  });

  // Tableau 4: Interventions
  const notesInPeriod = notes.filter(n => {
    const d = new Date(n.dateCreation);
    const inTime = d >= startDate && d <= endDate;
    const enrollment = enrollments.find(e => e._id.toString() === n.enrollmentId);
    const progMatch = programme === "tous" || (enrollment && enrollment.programme === programme);
    return inTime && progMatch;
  });

  const intAvec = notesInPeriod.filter(n => n.categorie === 'Intervention - Avec suivi').length;
  const intSans = notesInPeriod.filter(n => n.categorie === 'Intervention - Sans suivi').length;

  doc.addPage();
  doc.text("Interventions", 15, 20);
  doc.autoTable({
    startY: 25,
    head: [['Type d\'intervention', 'Nombre']],
    body: [
      ['Avec suivi', intAvec.toString()],
      ['Sans suivi', intSans.toString()],
      ['Total', (intAvec + intSans).toString()]
    ],
    theme: 'striped',
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold', textColor: [79, 70, 229] } }
  });
}

export default router;