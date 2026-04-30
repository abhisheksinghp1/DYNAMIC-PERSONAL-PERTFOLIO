import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { skills } from '../data/portfolio'
import './Skills.css'

export default function Skills() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section className="section skills-section" id="skills" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Tech Stack</span>
          <h2 className="section-title">Skills & <span>Expertise</span></h2>
          <p className="section-subtitle">
            Technologies I use to build scalable, production-ready systems.
          </p>
        </motion.div>

        <div className="skills-grid">
          {skills.map((group, gi) => (
            <motion.div
              key={group.category}
              className="skill-group glow-card"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: gi * 0.15 }}
            >
              <div className="skill-group-header">
                <span className="skill-group-icon">{group.icon}</span>
                <h3 className="skill-group-title" style={{ color: group.color }}>
                  {group.category}
                </h3>
              </div>

              <div className="skill-items">
                {group.items.map((skill, si) => (
                  <div key={skill.name} className="skill-item">
                    <div className="skill-meta">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-pct">{skill.level}%</span>
                    </div>
                    <div className="skill-bar-track">
                      <motion.div
                        className="skill-bar-fill"
                        style={{ background: group.color }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${skill.level}%` } : {}}
                        transition={{
                          duration: 1.2,
                          delay: gi * 0.15 + si * 0.1 + 0.3,
                          ease: 'easeOut',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
