import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import About from '../components/About'
import AboutCards from '../components/AboutCards'
import './AboutPage.css'

export default function AboutPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <main className="about-page">
      {/* Static about section (bio, stats, quote) */}
      <About />

      {/* Dynamic cards section */}
      <section className="section about-cards-wrapper" ref={ref}>
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">My Story</span>
            <h2 className="section-title">More About <span>Me</span></h2>
            <p className="section-subtitle">
              Drag to reorder (admin) · Click to read more
            </p>
          </motion.div>

          <AboutCards />
        </div>
      </section>
    </main>
  )
}
