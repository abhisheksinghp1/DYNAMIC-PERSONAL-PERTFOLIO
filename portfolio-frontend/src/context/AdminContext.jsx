import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AdminContext = createContext()
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AdminProvider({ children }) {
  // Read token from localStorage immediately — no flash of logged-out state
  const [token, setToken]       = useState(() => localStorage.getItem('admin_token') || null)
  const [verified, setVerified] = useState(false)   // true once we've checked with backend
  const [checking, setChecking] = useState(true)    // true while verifying on mount

  // ── Verify token with backend on every page load ──────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')

    if (!savedToken) {
      setToken(null)
      setVerified(false)
      setChecking(false)
      return
    }

    // Ping /api/auth/me to confirm token is still valid
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(res => {
        if (res.ok) {
          setToken(savedToken)
          setVerified(true)
        } else {
          // Token invalid or expired — clear it
          localStorage.removeItem('admin_token')
          setToken(null)
          setVerified(false)
        }
      })
      .catch(() => {
        // Backend offline — keep token so admin stays logged in
        // when backend comes back online
        setToken(savedToken)
        setVerified(true)
      })
      .finally(() => {
        setChecking(false)
      })
  }, [])

  const isAdmin = Boolean(token) && verified

  // ── Authenticated fetch ───────────────────────────────────────────
  const authFetch = useCallback(async (path, options = {}) => {
    return fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }, [token])

  // ── Login ─────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Login failed')
    }
    const data = await res.json()
    setToken(data.access_token)
    setVerified(true)
    localStorage.setItem('admin_token', data.access_token)
    return data
  }

  // ── Logout ────────────────────────────────────────────────────────
  const logout = () => {
    setToken(null)
    setVerified(false)
    localStorage.removeItem('admin_token')
  }

  return (
    <AdminContext.Provider value={{
      isAdmin,
      token,
      checking,   // true while verifying on mount — use to avoid flash
      login,
      logout,
      authFetch,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
