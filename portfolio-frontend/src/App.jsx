import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Cursor from './components/Cursor'
import './App.css'

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(t)
  }, [])

  if (loading) return <Loader />

  return (
    <>
      <Cursor />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13131f',
            color: '#f0f0ff',
            border: '1px solid rgba(108,99,255,0.3)',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
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
