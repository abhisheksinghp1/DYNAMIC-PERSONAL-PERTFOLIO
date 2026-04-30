import React, { useState, useEffect } from 'react'
import { Link } from 'react-scroll'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useAdmin } from '../context/AdminContext'
import AdminLogin from '../pages/AdminLogin'
import ResumePanel from './ResumePanel'
import './Navbar.css'

const API = 'http://localhost:8000'
const links = ['Home', 'About', 'Skills', 'Projects', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [showLogin, setShowLogin]     = useState(false)
  const [showResume, setShowResume]   = useState(false)
  const { dark, toggle }              = useTheme()
  const { isAdmin, logout }           = useAdmin()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleHireMe = async () => {
    try {
      const info = await fetch(`${API}/api/resume/info`).then(r => r.json())
      if (info.uploaded) {
        const a = document.createElement('a')
        a.href = `${API}/api/resume/download`
        a.download = 'Abhishek_Pratap_Singh_Resume.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        window.location.href = 'mailto:aps11102003@gmail.com?subject=Hire Me'
      }
    } catch {
      window.location.href = 'mailto:aps11102003@gmail.com?subject=Hire Me'
    }
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-bracket">&lt;</span>APS<span className="logo-bracket">/&gt;</span>
          </div>

          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {links.map(link => (
              <li key={link}>
                <Link
                  to={link.toLowerCase()}
                  smooth duration={600} offset={-80}
                  spy activeClass="active"
                  onClick={() => setMenuOpen(false)}
                >
                  {link}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {/* Dark/Light toggle */}
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label="Toggle dark mode"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="toggle-track">
                <span className={`toggle-thumb ${dark ? 'dark' : 'light'}`}>
                  {dark ? '🌙' : '☀️'}
                </span>
              </span>
            </button>

            {/* Admin: resume manager button */}
            {isAdmin && (
              <button
                className="admin-resume-btn"
                onClick={() => setShowResume(true)}
                title="Manage Resume"
              >
                📄 Resume
              </button>
            )}

            {/* Admin login / logout */}
            {isAdmin ? (
              <button className="admin-logout-btn" onClick={logout} title="Logout admin">
                🔓 Logout
              </button>
            ) : (
              <button
                className="admin-login-btn"
                onClick={() => setShowLogin(true)}
                title="Admin login"
              >
                🔐
              </button>
            )}

            {/* Hire Me — downloads resume */}
            <button className="nav-cta" onClick={handleHireMe}>
              Hire Me ↓
            </button>
          </div>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Admin mode banner */}
        {isAdmin && (
          <div className="admin-banner">
            🔐 Admin Mode — edit skills, projects &amp; upload resume
          </div>
        )}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showLogin  && <AdminLogin   onClose={() => setShowLogin(false)}  />}
        {showResume && <ResumePanel  onClose={() => setShowResume(false)} />}
      </AnimatePresence>
    </>
  )
}
