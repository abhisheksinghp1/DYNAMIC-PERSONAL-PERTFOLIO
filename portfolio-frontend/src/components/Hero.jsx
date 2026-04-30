import React from 'react'
import { TypeAnimation } from 'react-type-animation'
import { motion } from 'framer-motion'
import { Link } from 'react-scroll'
import { personalInfo } from '../data/portfolio'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="home">
      {/* Animated background grid */}
      <div className="hero-grid" aria-hidden="true" />

      {/* Floating orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div className="hero-inner container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Status badge */}
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="badge-dot" />
            Available for opportunities
          </motion.div>

          {/* Name */}
          <motion.h1
            className="hero-name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Hi, I'm <span className="name-highlight">{personalInfo.name}</span>
          </motion.h1>

          {/* Typewriter */}
          <motion.div
            className="hero-typewriter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="type-prefix">$ </span>
            <TypeAnimation
              sequence={personalInfo.taglines.flatMap(t => [t, 2000])}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              className="type-text"
            />
            <span className="type-cursor">_</span>
          </motion.div>

          {/* Bio */}
          <motion.p
            className="hero-bio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {personalInfo.bio}
          </motion.p>

          {/* Graduation badge */}
          <motion.div
            className="hero-edu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            🎓 {personalInfo.graduation}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="projects" smooth duration={600} offset={-80}>
              <button className="btn-primary">
                View Projects <span>→</span>
              </button>
            </Link>
            <Link to="contact" smooth duration={600} offset={-80}>
              <button className="btn-outline">
                Get In Touch
              </button>
            </Link>
          </motion.div>

          {/* Social links */}
          <motion.div
            className="hero-socials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <a href={personalInfo.github} target="_blank" rel="noreferrer" data-hover>
              GitHub
            </a>
            <span className="social-divider" />
            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" data-hover>
              LinkedIn
            </a>
            <span className="social-divider" />
            <a href={personalInfo.instagram} target="_blank" rel="noreferrer" data-hover>
              Instagram
            </a>
          </motion.div>
        </motion.div>

        {/* Right — code card */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
        >
          <CodeCard />
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="scroll-hint"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
        <span>Scroll</span>
      </motion.div>
    </section>
  )
}

function CodeCard() {
  return (
    <div className="code-card">
      <div className="code-card-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="code-filename">developer.py</span>
      </div>
      <pre className="code-body">
        <code>
{``}<span className="c-keyword">class</span>{` `}<span className="c-class">Developer</span>{`:\n`}
{`    `}<span className="c-keyword">def</span>{` `}<span className="c-fn">__init__</span>{`(self):\n`}
{`        self.`}<span className="c-var">name</span>{` = `}<span className="c-str">"Abhishek"</span>{`\n`}
{`        self.`}<span className="c-var">role</span>{` = `}<span className="c-str">"Full Stack Dev"</span>{`\n`}
{`        self.`}<span className="c-var">stack</span>{` = [\n`}
{`            `}<span className="c-str">"Python"</span>{`, `}<span className="c-str">"FastAPI"</span>{`,\n`}
{`            `}<span className="c-str">"Django"</span>{`, `}<span className="c-str">"Docker"</span>{`,\n`}
{`            `}<span className="c-str">"Kubernetes"</span>{`,\n`}
{`        ]\n`}
{`\n`}
{`    `}<span className="c-keyword">def</span>{` `}<span className="c-fn">build</span>{`(self):\n`}
{`        `}<span className="c-keyword">return</span>{` `}<span className="c-str">"Amazing things 🚀"</span>
        </code>
      </pre>
      <div className="code-card-footer">
        <span className="code-status">● Python 3.12</span>
        <span className="code-status">UTF-8</span>
      </div>
    </div>
  )
}
