import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface Email {
  _id: string
  enrollmentId: string
  to: string
  subject: string
  body: string
  sentBy: string
  sentByEmail: string
  sentAt: string
  status: "sent" | "failed"
  errorMessage?: string
  creator: string
  createdAt: string
  updatedAt: string
}

export const useEmails = (enrollmentId?: string) => {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEmails = async () => {
    if (!enrollmentId) return
    
    setLoading(true)
    try {
      console.log('📧 [useEmails] Fetching emails for enrollmentId:', enrollmentId)
      const response = await lumi.entities.emails.list({
        filter: { enrollmentId },
        sort: { sentAt: -1 }
      })
      
      const list = Array.isArray(response) ? response : (response?.list || [])
      console.log('✅ [useEmails] Fetched emails:', list.length)
      setEmails(list)
    } catch (error) {
      console.error("❌ [useEmails] Failed to fetch emails:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async (
    enrollmentId: string,
    to: string,
    subject: string,
    body: string,
    sentBy: string,
    sentByEmail: string
  ) => {
    try {
      console.log('📧 [useEmails] Sending email...')
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('benado_session_token')
      if (!token) {
        throw new Error('Session non authentifiée')
      }
      
      // Appel direct avec fetch au lieu de lumi.functions.invoke
      const response = await fetch(`https://api.lumi.new/v1/functions/p384255179950706688/sendStudentEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enrollmentId,
          to,
          subject,
          body,
          sentBy,
          sentByEmail
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [useEmails] Email sent:', result)
      
      // Refresh email list
      await fetchEmails()
      
      return result
    } catch (error: any) {
      console.error('❌ [useEmails] Failed to send email:', error)
      throw error
    }
  }

  useEffect(() => {
    if (enrollmentId) {
      fetchEmails()
    }
  }, [enrollmentId])

  return {
    emails,
    loading,
    fetchEmails,
    sendEmail
  }
}
