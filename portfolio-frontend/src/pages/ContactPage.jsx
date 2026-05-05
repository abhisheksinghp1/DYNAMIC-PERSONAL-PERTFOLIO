import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Contact from '../components/Contact'
import ContactLinks from '../components/ContactLinks'

export default function ContactPage() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <main style={{ paddingTop: '80px', minHeight: '100vh' }}>

      {/* Dynamic contact links section */}
      <section className="section" ref={ref} style={{ background: 'var(--bg-secondary)', paddingBottom: '40px' }}>
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Reach Out</span>
            <h2 className="section-title">Contact & <span>Social Links</span></h2>
            <p className="section-subtitle">
              Find me on social media or drop a message below.
            </p>
          </motion.div>

          <ContactLinks />
        </div>
      </section>

      {/* Contact form (send message) */}
      <Contact />
    </main>
  )
}
