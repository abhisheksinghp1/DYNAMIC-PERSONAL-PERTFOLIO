import React, { useState, useEffect } from 'react'
import { Link } from 'react-scroll'
import { useTheme } from '../context/ThemeContext'
import './Navbar.css'

const links = ['Home', 'About', 'Skills', 'Projects', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <div className="nav-logo">
          <span className="logo-bracket">&lt;</span>
          APS
          <span className="logo-bracket">/&gt;</span>
        </div>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <li key={link}>
              <Link
                to={link.toLowerCase()}
                smooth
                duration={600}
                offset={-80}
                spy
                activeClass="active"
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {/* Dark / Light toggle */}
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

          <a href="mailto:aps11102003@gmail.com" className="nav-cta">
            Hire Me
          </a>
        </div>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
