import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Toggle with a circular ripple animation from the toggle button
  const toggle = useCallback((e) => {
    // If browser supports View Transitions API — use it for a smooth morph
    if (document.startViewTransition) {
      // Get click origin for the ripple
      const x = e?.clientX ?? window.innerWidth / 2
      const y = e?.clientY ?? window.innerHeight / 2
      const radius = Math.hypot(
        Math.max(x, window.innerWidth  - x),
        Math.max(y, window.innerHeight - y)
      )

      document.documentElement.style.setProperty('--ripple-x', `${x}px`)
      document.documentElement.style.setProperty('--ripple-y', `${y}px`)
      document.documentElement.style.setProperty('--ripple-r', `${radius}px`)

      document.startViewTransition(() => {
        setDark(d => !d)
      })
    } else {
      // Fallback: CSS transition handles it (see index.css)
      setDark(d => !d)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
