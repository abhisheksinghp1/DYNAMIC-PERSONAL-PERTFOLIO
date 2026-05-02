/**
 * ProjectsContext — API-backed, persists to SQLite via FastAPI.
 * Falls back to static portfolio.js data if backend is offline.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { projects as defaultProjects } from '../data/portfolio'
import { useAdmin } from './AdminContext'

const ProjectsContext = createContext()
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const { authFetch, isAdmin }  = useAdmin()

  // ── Fetch from DB on mount ──────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/projects/`)
      if (res.ok) {
        const data = await res.json()
        // Parse tech field if it comes as a JSON string
        setProjects(data.map(p => ({
          ...p,
          tech: Array.isArray(p.tech) ? p.tech : JSON.parse(p.tech || '[]'),
          stats: { stars: p.stars ?? 0, forks: p.forks ?? 0 },
        })))
      } else {
        setProjects(defaultProjects)
      }
    } catch {
      // Backend offline — use static defaults
      setProjects(defaultProjects)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // ── Add project (saves to DB) ───────────────────────────────────────
  const addProject = async (project) => {
    try {
      const res = await authFetch('/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       project.title,
          description: project.description,
          tech:        project.tech,
          github:      project.github || '#',
          live:        project.live   || '#',
          color:       project.color  || '#6c63ff',
          icon:        project.icon   || '🚀',
          stars:       0,
          forks:       0,
        }),
      })
      if (res.ok) {
        await fetchProjects()
        return true
      }
    } catch { /* ignore */ }
    // Fallback: add locally if API fails
    setProjects(prev => [{
      ...project,
      id: Date.now(),
      stats: { stars: 0, forks: 0 },
    }, ...prev])
    return false
  }

  // ── Remove project (deletes from DB) ───────────────────────────────
  const removeProject = async (id) => {
    try {
      const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id))
        return true
      }
    } catch { /* ignore */ }
    // Fallback: remove locally
    setProjects(prev => prev.filter(p => p.id !== id))
    return false
  }

  // ── Reset to defaults ───────────────────────────────────────────────
  const resetProjects = async () => {
    await fetchProjects()
  }

  return (
    <ProjectsContext.Provider value={{
      projects, loading, addProject, removeProject, resetProjects, fetchProjects
    }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
