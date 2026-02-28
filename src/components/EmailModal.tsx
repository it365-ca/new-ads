import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { lumi } from "../lib/lumi";
import { useAuth } from "../hooks/useAuth"; // Utilisation du bon hook d'auth
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Props {
  enrollmentId: string;
  studentName: string;
  availableEmails: { label: string; email: string }[];
  onClose: () => void;
  onSuccessCreateNote: (sujet: string, corps: string, destinataire: string, expediteur: string) => Promise<void>;
}

export const EmailModal: React.FC<Props> = ({ 
  enrollmentId, 
  studentName, 
  availableEmails, 
  onClose,
  onSuccessCreateNote 
}) => {
  const { user } = useAuth();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  
  // On stocke le NOM pour l'affichage et l'EMAIL pour l'envoi
  const [selectedSenderName, setSelectedSenderName] = useState(""); 
  const [selectedSenderEmail, setSelectedSenderEmail] = useState(""); 

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Charger les intervenants au démarrage
  useEffect(() => {
    const fetchIntervenants = async () => {
      try {
        const result = await lumi.entities.intervenants.list();
        setIntervenants(result.list || []);
        
        // Tenter de présélectionner l'utilisateur connecté
        if (user) {
            const currentUserFullname = `${user.prenom || ''} ${user.nom || ''}`.trim();
            const found = (result.list || []).find((i: any) => 
                i.email === user.email || `${i.prenom} ${i.nom}`.trim() === currentUserFullname
            );
            
            if (found) {
                setSelectedSenderName(`${found.prenom} ${found.nom}`);
                setSelectedSenderEmail(found.email);
            } else {
                // Fallback si l'utilisateur n'est pas dans la liste
                setSelectedSenderName(currentUserFullname || "Intervenant");
                setSelectedSenderEmail(user.email || "");
            }
        }
      } catch (error) {
        console.error("Erreur chargement intervenants:", error);
      }
    };
    fetchIntervenants();
  }, [user]);

  // Quand on change l'intervenant dans la liste déroulante
  const handleSenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const email = e.target.value; // La valeur de l'option est l'email directement
      setSelectedSenderEmail(email);
      
      // Retrouver le nom associé pour l'affichage
      const found = intervenants.find(i => i.email === email);
      if (found) {
          setSelectedSenderName(`${found.prenom} ${found.nom}`);
      } else {
          setSelectedSenderName("Intervenant");
      }
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSend = async () => {
    // 1. Validation
    if (!subject.trim() || !body.trim() || selectedEmails.length === 0 || !selectedSenderEmail) {
      toast.error("Veuillez remplir le sujet, le message, choisir un expéditeur et au moins un destinataire.");
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem('benado_session_token');
      if (!token) throw new Error("Session expirée.");

      // 2. Ajout de la signature automatique dans le corps du message
      const signature = `
        <br/><br/>
        <div style="border-top: 1px solid #ccc; padding-top: 10px; color: #555; font-size: 0.9em;">
          <strong>Envoyé par :</strong> ${selectedSenderName}<br/>
          <em>${selectedSenderEmail}</em>
        </div>
      `;
      
      const finalBody = body + signature;

      // 3. Envoi via l'API (Reply-To = Email de l'intervenant)
      const response = await fetch(`https://api.lumi.new/v1/functions/p384255179950706688/sendStudentEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enrollmentId,
          to: selectedEmails.join(', '),
          replyTo: selectedSenderEmail, // C'est ici que la magie opère pour la réponse
          senderName: selectedSenderName, // Le parent verra ce NOM
          subject: `[${studentName}] ${subject}`,
          body: finalBody // On envoie le corps AVEC la signature
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      // 4. Création de la note dans le dossier du jeune
      await onSuccessCreateNote(subject, finalBody, selectedEmails.join(', '), selectedSenderName);

      toast.success("✅ Courriel envoyé avec succès !");
      onClose();

    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        
        {/* Header simple */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-800">✉️ Envoyer un courriel</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Sélection de l'expéditeur (De la part de...) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">De la part de (Signature automatique)</label>
            <select 
              value={selectedSenderEmail} 
              onChange={handleSenderChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-900 font-medium"
              disabled={isSending}
            >
              <option value="">-- Sélectionner l'intervenant --</option>
              {intervenants.map((int) => (
                <option key={int._id} value={int.email}>
                  {int.prenom} {int.nom}
                </option>
              ))}
            </select>
            {selectedSenderName && (
                <p className="text-xs text-gray-500 mt-1">
                    Signature ajoutée : "Envoyé par : {selectedSenderName}"
                </p>
            )}
          </div>

          {/* Sélection des destinataires */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinataires</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-gray-50">
                {availableEmails.map((contact, idx) => (
                <label key={idx} className="flex items-center gap-3 p-1 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                    type="checkbox"
                    checked={selectedEmails.includes(contact.email)}
                    onChange={() => toggleEmail(contact.email)}
                    disabled={isSending}
                    className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-800">
                    {contact.label} <span className="text-gray-500 text-xs">({contact.email})</span>
                    </span>
                </label>
                ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Sujet du message..."
              disabled={isSending}
            />
            <p className="text-xs text-gray-400 mt-1">Le préfixe "[{studentName}]" sera ajouté automatiquement.</p>
          </div>

          {/* Message avec Quill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <ReactQuill
              value={body}
              onChange={setBody}
              theme="snow"
              className="bg-white h-64 mb-10" 
              modules={{
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                ]
              }}
            />
          </div>
        </div>

        {/* Footer simple */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg mt-8">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            disabled={isSending}
          >
            Annuler
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSending ? 'Envoi...' : '📤 Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};