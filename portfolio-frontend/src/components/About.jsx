import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import CountUp from 'react-countup'
import { personalInfo, stats } from '../data/portfolio'
import './About.css'

export default function About() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section className="section" id="about" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">About Me</span>
          <h2 className="section-title">Who I <span>Am</span></h2>
          <p className="section-subtitle">
            A developer who writes clean code and ships real products.
          </p>
        </motion.div>

        <div className="about-grid">
          {/* Left — text */}
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="about-card glow-card">
              <div className="about-avatar">
                <div className="avatar-ring">
                  <div className="avatar-inner">APS</div>
                </div>
                <div className="avatar-status">
                  <span className="badge-dot" />
                  Open to work
                </div>
              </div>

              <h3 className="about-name">{personalInfo.name}</h3>
              <p className="about-role">{personalInfo.title}</p>

              <p className="about-bio">{personalInfo.bio}</p>

              <div className="about-details">
                <div className="detail-item">
                  <span className="detail-icon">🎓</span>
                  <div>
                    <span className="detail-label">Education</span>
                    <span className="detail-value">{personalInfo.graduation}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <div>
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{personalInfo.location}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">✉️</span>
                  <div>
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{personalInfo.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — stats */}
          <motion.div
            className="about-stats-col"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="stats-grid">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="stat-card glow-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="stat-number">
                    {inView && (
                      <CountUp
                        end={s.value}
                        duration={2.5}
                        delay={0.5 + i * 0.1}
                      />
                    )}
                    <span className="stat-suffix">{s.suffix}</span>
                  </div>
                  <div className="stat-label">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="about-quote glow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
            >
              <span className="quote-mark">"</span>
              <p>First, solve the problem. Then, write the code.</p>
              <span className="quote-author">— John Johnson</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
