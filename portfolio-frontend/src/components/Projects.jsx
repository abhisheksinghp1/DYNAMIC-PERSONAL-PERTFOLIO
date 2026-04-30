import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useProjects } from '../context/ProjectsContext'
import { useAdmin } from '../context/AdminContext'
import './Projects.css'

const COLORS = ['#6c63ff','#43e97b','#ff6584','#f7971e','#a18cd1','#38b2ac','#ed64a6']
const ICONS  = ['🚀','⚡','🏗️','📊','🔐','🌐','🤖','🛡️','📦','🔧']

const emptyForm = {
  title: '', description: '', tech: '', github: '', live: '',
  color: '#6c63ff', icon: '🚀',
}

export default function Projects() {
  const [ref, inView]              = useInView({ triggerOnce: true, threshold: 0.1 })
  const { projects, addProject, removeProject, resetProjects } = useProjects()
  const { isAdmin }                = useAdmin()   // ← only difference

  const [active, setActive]        = useState(null)
  const [showAdd, setShowAdd]      = useState(false)
  const [confirmId, setConfirmId]  = useState(null)
  const [form, setForm]            = useState(emptyForm)
  const [formErrors, setFormErrors]= useState({})

  /* ── form helpers ─────────────────────────────────────────────────── */
  const handleFormChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (formErrors[name]) setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  const validateForm = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.tech.trim())        e.tech        = 'At least one tech tag is required'
    return e
  }

  const handleAdd = e => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    addProject({
      title:       form.title.trim(),
      description: form.description.trim(),
      tech:        form.tech.split(',').map(t => t.trim()).filter(Boolean),
      github:      form.github.trim() || '#',
      live:        form.live.trim()   || '#',
      color:       form.color,
      icon:        form.icon,
    })
    setForm(emptyForm)
    setFormErrors({})
    setShowAdd(false)
  }

  const handleDelete = id => {
    removeProject(id)
    setConfirmId(null)
    if (active?.id === id) setActive(null)
  }

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <section className="section" id="projects" ref={ref}>
      <div className="container">

        {/* Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">My Work</span>
          <h2 className="section-title">Featured <span>Projects</span></h2>
          <p className="section-subtitle">
            Real-world applications built with modern tech stacks.
          </p>
        </motion.div>

        {/* ── Admin toolbar — hidden from normal users ─────────────── */}
        <AnimatePresence>
          {isAdmin && (
            <motion.div
              className="projects-toolbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="projects-count admin-badge">
                🔐 Admin — {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
              <div className="toolbar-actions">
                <button
                  className="btn-outline btn-sm"
                  onClick={resetProjects}
                  title="Reset to defaults"
                >
                  ↺ Reset
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => setShowAdd(true)}
                >
                  + Add Project
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="projects-grid">
          <AnimatePresence mode="popLayout">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                className="project-card glow-card"
                layout
                initial={{ opacity: 0, scale: 0.85, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: -20, transition: { duration: 0.25 } }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                data-hover
              >
                <div className="project-accent" style={{ background: project.color }} />

                <div className="project-card-inner">
                  <div className="project-icon-row">
                    <span className="project-icon">{project.icon}</span>
                    <div className="project-links">
                      <a href={project.github} onClick={e => e.stopPropagation()} className="project-link">⌥ Code</a>
                      <a href={project.live}   onClick={e => e.stopPropagation()} className="project-link">↗ Live</a>
                    </div>
                  </div>

                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-desc">{project.description}</p>

                  <div className="project-tech-list">
                    {project.tech.map(t => (
                      <span key={t} className="tech-badge">{t}</span>
                    ))}
                  </div>

                  <div className="project-stats">
                    <span>⭐ {project.stats?.stars ?? 0}</span>
                    <span>🍴 {project.stats?.forks ?? 0}</span>

                    {/* View details — always visible */}
                    <button
                      className="project-more"
                      onClick={() => setActive(project)}
                    >
                      View details →
                    </button>

                    {/* Delete — admin only */}
                    {isAdmin && (
                      <button
                        className="project-delete"
                        onClick={e => { e.stopPropagation(); setConfirmId(project.id) }}
                        title="Remove project"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state — only shown to admin so visitors never see it */}
          {projects.length === 0 && isAdmin && (
            <motion.div
              className="projects-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span>📭</span>
              <p>No projects yet. Add your first one!</p>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                + Add Project
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-accent" style={{ background: active.color }} />
              <button className="modal-close" onClick={() => setActive(null)}>✕</button>
              <div className="modal-icon">{active.icon}</div>
              <h2 className="modal-title">{active.title}</h2>
              <p className="modal-desc">{active.description}</p>
              <div className="modal-tech">
                {active.tech.map(t => <span key={t} className="tech-badge">{t}</span>)}
              </div>
              <div className="modal-actions">
                <a href={active.github} className="btn-primary">View Code</a>
                <a href={active.live}   className="btn-outline">Live Demo</a>

                {/* Remove button — admin only */}
                {isAdmin && (
                  <button
                    className="btn-danger"
                    onClick={() => { setActive(null); setConfirmId(active.id) }}
                  >
                    🗑 Remove
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add project modal — only reachable by admin ───────────────── */}
      <AnimatePresence>
        {showAdd && isAdmin && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="modal-card add-modal"
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-accent" style={{ background: form.color }} />
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>

              <div className="add-modal-header">
                <span className="add-modal-icon">{form.icon}</span>
                <h2>Add New Project</h2>
              </div>

              <form className="add-form" onSubmit={handleAdd} noValidate>
                <div className="add-form-field">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {ICONS.map(ic => (
                      <button
                        key={ic} type="button"
                        className={`icon-btn ${form.icon === ic ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      >{ic}</button>
                    ))}
                  </div>
                </div>

                <div className="add-form-field">
                  <label>Accent Color</label>
                  <div className="color-picker">
                    {COLORS.map(c => (
                      <button
                        key={c} type="button"
                        className={`color-btn ${form.color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                      />
                    ))}
                  </div>
                </div>

                <div className={`add-form-field ${formErrors.title ? 'has-error' : ''}`}>
                  <label>Project Title *</label>
                  <input name="title" placeholder="e.g. MyApp — A cool project" value={form.title} onChange={handleFormChange} />
                  {formErrors.title && <span className="field-error">{formErrors.title}</span>}
                </div>

                <div className={`add-form-field ${formErrors.description ? 'has-error' : ''}`}>
                  <label>Description *</label>
                  <textarea name="description" rows={3} placeholder="What does this project do?" value={form.description} onChange={handleFormChange} />
                  {formErrors.description && <span className="field-error">{formErrors.description}</span>}
                </div>

                <div className={`add-form-field ${formErrors.tech ? 'has-error' : ''}`}>
                  <label>Tech Stack * <span className="label-hint">(comma separated)</span></label>
                  <input name="tech" placeholder="Python, FastAPI, Docker" value={form.tech} onChange={handleFormChange} />
                  {formErrors.tech && <span className="field-error">{formErrors.tech}</span>}
                </div>

                <div className="add-form-row">
                  <div className="add-form-field">
                    <label>GitHub URL</label>
                    <input name="github" placeholder="https://github.com/..." value={form.github} onChange={handleFormChange} />
                  </div>
                  <div className="add-form-field">
                    <label>Live URL</label>
                    <input name="live" placeholder="https://..." value={form.live} onChange={handleFormChange} />
                  </div>
                </div>

                <div className="add-form-actions">
                  <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">✓ Add Project</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm — admin only ───────────────────────────────── */}
      <AnimatePresence>
        {confirmId && isAdmin && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="modal-card confirm-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🗑️</div>
              <h3>Remove Project?</h3>
              <p>This will remove the project from your portfolio. You can reset to defaults anytime.</p>
              <div className="confirm-actions">
                <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(confirmId)}>Yes, Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
