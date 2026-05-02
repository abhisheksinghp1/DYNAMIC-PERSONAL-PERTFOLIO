import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useAdmin } from '../context/AdminContext'
import AdminLogin from '../pages/AdminLogin'
import ResumePanel from './ResumePanel'
import ChangePassword from './ChangePassword'
import './Navbar.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const links = [
  { label: 'Home',            path: '/' },
  { label: 'About',           path: '/about' },
  { label: 'Skills',          path: '/skills' },
  { label: 'Projects',        path: '/projects' },
  { label: 'Certifications',  path: '/certifications' },
  { label: 'Resume',          path: '/resume' },
  { label: 'Contact',         path: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [showLogin, setShowLogin]       = useState(false)
  const [showResume, setShowResume]     = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const { dark, toggle }            = useTheme()
  const { isAdmin, logout }         = useAdmin()
  const navigate                    = useNavigate()

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

          {/* Logo */}
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-bracket">&lt;</span>APS<span className="logo-bracket">/&gt;</span>
          </div>

          {/* Nav links */}
          <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {links.map(link => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {/* Dark/Light toggle */}
            <button
              className="theme-toggle"
              onClick={(e) => toggle(e)}
              aria-label="Toggle dark mode"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="toggle-track">
                <span className={`toggle-thumb ${dark ? 'dark' : 'light'}`}>
                  {dark ? '🌙' : '☀️'}
                </span>
              </span>
            </button>

            {/* Admin: resume manager */}
            {isAdmin && (
              <button className="admin-resume-btn" onClick={() => setShowResume(true)} title="Manage Resume">
                📄 Resume
              </button>
            )}

            {/* Admin: document vault link */}
            {isAdmin && (
              <button
                className="admin-vault-btn"
                onClick={() => navigate('/vault')}
                title="Private Document Vault"
              >
                🔐 Vault
              </button>
            )}

            {/* Admin login / logout */}
            {isAdmin ? (
              <>
                <button
                  className="admin-changepw-btn"
                  onClick={() => setShowChangePw(true)}
                  title="Change Password"
                >
                  🔑
                </button>
                <button className="admin-logout-btn" onClick={logout} title="Logout admin">
                  🔓 Logout
                </button>
              </>
            ) : (
              <button className="admin-login-btn" onClick={() => setShowLogin(true)} title="Admin login">
                🔐
              </button>
            )}

            {/* Hire Me */}
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

        {/* Admin banner */}
        {isAdmin && (
          <div className="admin-banner">
            🔐 Admin Mode — edit skills, projects &amp; upload resume
          </div>
        )}
      </nav>

      <AnimatePresence>
        {showLogin    && <AdminLogin     onClose={() => setShowLogin(false)}    />}
        {showResume   && <ResumePanel    onClose={() => setShowResume(false)}   />}
        {showChangePw && <ChangePassword onClose={() => setShowChangePw(false)} />}
      </AnimatePresence>
    </>
  )
}
