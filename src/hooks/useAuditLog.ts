import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

export interface AuditLog {
  _id: string
  entityType: "enrollment" | "note" | "ticket" | "intervenant" | "message" | "conversation"
  entityId: string
  action: "create" | "update" | "delete" | "status_change" | "restore"
  userId: string
  userName: string
  userEmail: string
  timestamp: string
  changes?: {
    before?: any
    after?: any
  }
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
}

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = async (filter?: { entityType?: string; entityId?: string; userId?: string }) => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.auditLogs.list({
        filter: filter || {},
        sort: { timestamp: -1 },
        limit: 100
      })
      setLogs(list as AuditLog[])
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const createLog = async (data: Omit<AuditLog, "_id">) => {
    try {
      await lumi.entities.auditLogs.create(data)
      await fetchLogs()
    } catch (error) {
      console.error("Failed to create audit log:", error)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return {
    logs,
    loading,
    fetchLogs,
    createLog
  }
}
