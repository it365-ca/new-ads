import { useState, useEffect } from "react"
import { lumi } from "../lib/lumi"

interface User {
  userId: string
  email: string
  userName: string
  userRole: "ADMIN" | "USER"
  createdTime: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(lumi.auth.user)
  const [isAuthenticated, setIsAuthenticated] = useState(lumi.auth.isAuthenticated)

  useEffect(() => {
    const unsubscribe = lumi.auth.onAuthChange(({ isAuthenticated, user }) => {
      setUser(user)
      setIsAuthenticated(isAuthenticated)
    })
    return unsubscribe
  }, [])

  const signIn = async () => {
    try {
      await lumi.auth.signIn()
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const signOut = () => {
    lumi.auth.signOut()
  }

  return {
    user,
    isAuthenticated,
    signIn,
    signOut
  }
}
