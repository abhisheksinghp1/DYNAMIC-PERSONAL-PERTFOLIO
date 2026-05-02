import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Cursor from './components/Cursor'
import HomePage    from './pages/HomePage'
import AboutPage   from './pages/AboutPage'
import SkillsPage  from './pages/SkillsPage'
import ProjectsPage from './pages/ProjectsPage'
import ContactPage from './pages/ContactPage'
import VaultPage   from './pages/VaultPage'
import ResumePage  from './pages/ResumePage'
import CertificationsPage from './pages/CertificationsPage'
import { useAdmin } from './context/AdminContext'
import './App.css'

export default function App() {
  const [loading, setLoading] = useState(true)
  const { checking } = useAdmin()

  useEffect(() => {
    // Wait for both the splash screen AND token verification
    const t = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(t)
  }, [])

  // Show loader until splash is done AND token check is complete
  if (loading || checking) return <Loader />

  return (
    <BrowserRouter>
      <Cursor />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(108,99,255,0.3)',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/about"    element={<AboutPage />} />
        <Route path="/skills"   element={<SkillsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/contact"  element={<ContactPage />} />
        <Route path="/vault"    element={<VaultPage />} />
        <Route path="/resume"          element={<ResumePage />} />
        <Route path="/certifications"  element={<CertificationsPage />} />
        <Route path="*"                element={<HomePage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

function Loader() {
  return (
    <div className="loader-screen">
      <div className="loader-content">
        <div className="loader-logo">APS</div>
        <div className="loader-bar">
          <div className="loader-fill" />
        </div>
        <p className="loader-text">Initializing portfolio...</p>
      </div>
    </div>
  )
}
