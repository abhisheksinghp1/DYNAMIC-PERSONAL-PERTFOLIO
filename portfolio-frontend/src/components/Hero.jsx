import React, { useState, useEffect, useRef } from 'react'
import { TypeAnimation } from 'react-type-animation'
import { motion } from 'framer-motion'
import { Link } from 'react-scroll'
import { personalInfo } from '../data/portfolio'
import ResumeUpload from './ResumeUpload'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './Hero.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
            <ResumeUpload />
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

        {/* Right — original developer.py code card (restored) */}
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

/* ── Original developer.py code card — admin-editable ───────────────── */
function CodeCard() {
  const { isAdmin, authFetch } = useAdmin()
  const [card, setCard]         = useState({ filename: 'developer.py', content: '' })
  const [editing, setEditing]   = useState(false)
  const [editForm, setEditForm] = useState({ filename: '', content: '' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    fetch(`${API}/api/code-card/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCard(data) })
      .catch(() => {})
  }, [])

  const openEdit = () => {
    setEditForm({ filename: card.filename, content: card.content })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/code-card/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const data = await res.json()
        setCard({ filename: data.filename, content: data.content })
        setEditing(false)
        toast.success('Code card updated!')
      } else {
        toast.error('Failed to save')
      }
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  // Parse content into syntax-highlighted lines
  const renderCode = (content) => {
    return content.split('\n').map((line, i) => {
      const highlighted = line
        .replace(/\b(class|def|return|self)\b/g, '<span class="c-keyword">$1</span>')
        .replace(/("[^"]*")/g, '<span class="c-str">$1</span>')
        .replace(/\b(Developer|__init__|build)\b/g, (m) =>
          m === 'Developer' ? `<span class="c-class">${m}</span>` : `<span class="c-fn">${m}</span>`
        )
        .replace(/\b(name|role|stack)\b/g, '<span class="c-var">$1</span>')
      return (
        <div key={i} dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
      )
    })
  }

  return (
    <>
      <div className="code-card">
        <div className="code-card-header">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
          <span className="code-filename">{card.filename}</span>
          {/* Admin edit button */}
          {isAdmin && (
            <button
              className="code-card-edit-btn"
              onClick={openEdit}
              title="Edit code card"
            >✏️</button>
          )}
        </div>
        <pre className="code-body">
          <code>{renderCode(card.content)}</code>
        </pre>
        <div className="code-card-footer">
          <span className="code-status">● Python 3.12</span>
          <span className="code-status">UTF-8</span>
        </div>
      </div>

      {/* Edit modal — admin only */}
      {editing && (
        <div className="code-edit-overlay" onClick={() => setEditing(false)}>
          <div className="code-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="code-edit-header">
              <h3>✏️ Edit Code Card</h3>
              <button className="code-edit-close" onClick={() => setEditing(false)}>✕</button>
            </div>

            <div className="code-edit-field">
              <label>Filename</label>
              <input
                value={editForm.filename}
                onChange={e => setEditForm(f => ({ ...f, filename: e.target.value }))}
                placeholder="developer.py"
              />
            </div>

            <div className="code-edit-field">
              <label>Code Content</label>
              <textarea
                value={editForm.content}
                onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                rows={14}
                spellCheck={false}
                className="code-edit-textarea"
                placeholder="Write your code here..."
              />
            </div>

            <div className="code-edit-actions">
              <button className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Hero Media Card — kept for use in HomePage below Hero ───────────── */
export function HeroVideoCard() {
  const { isAdmin, authFetch } = useAdmin()
  const [items, setItems]       = useState([])
  const [index, setIndex]       = useState(0)
  const [uploading, setUploading] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const fileRef  = useRef()
  const videoRef = useRef()
  const timerRef = useRef()

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/hero-video/items`)
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchItems() }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!items.length) return
    const current = items[index]
    if (current?.media_type === 'image') {
      timerRef.current = setTimeout(() => {
        setIndex(i => (i + 1) % items.length)
      }, 4000)
    }
    return () => clearTimeout(timerRef.current)
  }, [index, items])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [index])

  const handleVideoEnded = () => {} // videos loop — never advance on end

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await authFetch('/api/hero-video/upload', { method: 'POST', body: form })
        if (res.ok) toast.success(`"${file.name}" added`)
        else { const err = await res.json(); toast.error(err.detail || 'Upload failed') }
      } catch { toast.error('Upload failed') }
    }
    setUploading(false)
    fileRef.current.value = ''
    fetchItems()
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/hero-video/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed'); setConfirmId(null); setIndex(0); fetchItems() }
    else toast.error('Failed to remove')
  }

  const current = items[index]
  const isVideo = current?.media_type === 'video'

  if (items.length === 0 && !isAdmin) return null

  return (
    <div className="hero-video-card">
      <div className="code-card-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="code-filename">
          {current ? (isVideo ? 'intro.mp4' : 'photo.jpg') : 'hero_media'}
        </span>
        {items.length > 1 && (
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {index + 1}/{items.length}
          </span>
        )}
      </div>

      <div className="hero-video-body">
        {current ? (
          isVideo ? (
            <video key={current.id} ref={videoRef} src={`${API}${current.url}`}
              className="hero-video-player" autoPlay muted playsInline loop />
          ) : (
            <img key={current.id} src={`${API}${current.url}`} alt={`Slide ${index + 1}`}
              className="hero-video-player" style={{ objectFit: 'cover' }} />
          )
        ) : (
          <div className="hero-video-placeholder">
            <span>📤</span>
            <p>Upload photos or videos</p>
          </div>
        )}

        {isAdmin && current && (
          <button className="hero-slide-delete" onClick={() => setConfirmId(current.id)}>🗑</button>
        )}

        {items.length > 1 && (
          <div className="hero-slide-dots">
            {items.map((item, i) => (
              <button key={i}
                className={`hero-slide-dot ${i === index ? 'active' : ''} ${item.media_type === 'video' ? 'video' : ''}`}
                onClick={() => setIndex(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="code-card-footer">
        {isAdmin ? (
          <div className="hero-video-admin">
            <input ref={fileRef} type="file" multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg,.mov"
              style={{ display: 'none' }} onChange={handleUpload} />
            <button className="hero-video-btn upload"
              onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? '⏳' : '⬆️'} Add Photo/Video
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <span className="code-status">
            {current ? (isVideo ? '▶ Video' : '🖼 Photo') : '● Media'}
          </span>
        )}
      </div>

      {confirmId && (
        <div className="hero-confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="hero-confirm-card" onClick={e => e.stopPropagation()}>
            <div>🗑️</div>
            <h3>Remove this item?</h3>
            <p>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmId)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
