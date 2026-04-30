import React, { createContext, useContext, useState, useCallback } from 'react'

const AdminContext = createContext()
const API = 'http://localhost:8000'

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null)

  const isAdmin = Boolean(token)

  // Authenticated fetch — automatically attaches Bearer token
  const authFetch = useCallback(async (path, options = {}) => {
    return fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }, [token])

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
    localStorage.setItem('admin_token', data.access_token)
    return data
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('admin_token')
  }

  return (
    <AdminContext.Provider value={{ isAdmin, token, login, logout, authFetch }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
