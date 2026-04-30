import React, { createContext, useContext, useState, useEffect } from 'react'
import { projects as defaultProjects } from '../data/portfolio'

const ProjectsContext = createContext()

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('projects')
      return saved ? JSON.parse(saved) : defaultProjects
    } catch {
      return defaultProjects
    }
  })

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects))
  }, [projects])

  const addProject = (project) => {
    const newProject = {
      ...project,
      id: Date.now(),
      stats: { stars: 0, forks: 0 },
    }
    setProjects(prev => [newProject, ...prev])
  }

  const removeProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const resetProjects = () => {
    setProjects(defaultProjects)
    localStorage.removeItem('projects')
  }

  return (
    <ProjectsContext.Provider value={{ projects, addProject, removeProject, resetProjects }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
