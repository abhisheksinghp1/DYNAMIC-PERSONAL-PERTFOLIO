import React from 'react'
import { personalInfo } from '../data/portfolio'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-logo">
          <span className="logo-bracket">&lt;</span>APS<span className="logo-bracket">/&gt;</span>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} {personalInfo.name} · Built with React & ❤️
        </p>
        <div className="footer-links">
          <a href={personalInfo.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={personalInfo.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={`mailto:${personalInfo.email}`}>Email</a>
        </div>
      </div>
    </footer>
  )
}
