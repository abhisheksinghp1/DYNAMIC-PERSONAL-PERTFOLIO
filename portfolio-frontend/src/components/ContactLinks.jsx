import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './ContactLinks.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ICONS = ['✉️','📞','🐙','💼','📸','🐦','📍','🌐','💬','📱','🔗','🎯','📺','🎵','💻']
const TYPES = [
  { value: 'email',  label: 'Email' },
  { value: 'phone',  label: 'Phone' },
  { value: 'social', label: 'Social Media' },
  { value: 'link',   label: 'Website Link' },
  { value: 'info',   label: 'Info (no link)' },
]

const TYPE_COLORS = {
  email:  '#6c63ff',
  phone:  '#43e97b',
  social: '#ff6584',
  link:   '#f7971e',
  info:   '#a18cd1',
}

const emptyForm = { label: '', value: '', url: '', icon: '🔗', type: 'link' }

/* ── Single link card ────────────────────────────────────────────────── */
function LinkCard({ link, isAdmin, onEdit, onDelete }) {
  const color = TYPE_COLORS[link.type] || '#6c63ff'
  const isClickable = link.url && link.url.trim() !== ''

  const content = (
    <motion.div
      className="contact-link-card glow-card"
      style={{ '--link-color': color }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="link-accent" style={{ background: color }} />
      <div className="link-body">
        <motion.span
          className="link-icon"
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.2, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
        >
          {link.icon}
        </motion.span>
        <div className="link-info">
          <span className="link-label">{link.label}</span>
          <span className="link-value">{link.value}</span>
        </div>
        {isClickable && <span className="link-arrow">→</span>}
      </div>

      {isAdmin && (
        <div className="link-admin-btns" onClick={e => e.preventDefault()}>
          <button className="card-btn edit"   onClick={() => onEdit(link)}    title="Edit">✏️</button>
          <button className="card-btn delete" onClick={() => onDelete(link.id)} title="Delete">🗑</button>
          <span className="drag-handle" title="Drag to reorder">⠿</span>
        </div>
      )}
    </motion.div>
  )

  if (isClickable && !isAdmin) {
    return (
      <a href={link.url} target="_blank" rel="noreferrer" className="link-card-anchor">
        {content}
      </a>
    )
  }
  return content
}

/* ── Add / Edit modal ────────────────────────────────────────────────── */
function LinkFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.label.trim() || !form.value.trim()) {
      toast.error('Label and value are required')
      return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <motion.div
      className="link-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="link-modal"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="link-modal-accent" style={{ background: TYPE_COLORS[form.type] || '#6c63ff' }} />
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-preview-icon">{form.icon}</div>
        <h3>{initial ? 'Edit Contact Link' : 'Add Contact Link'}</h3>

        <form onSubmit={handleSubmit} className="link-form">
          {/* Type */}
          <div className="form-field">
            <label>Type</label>
            <div className="type-picker">
              {TYPES.map(t => (
                <button
                  key={t.value} type="button"
                  className={`type-btn ${form.type === t.value ? 'selected' : ''}`}
                  style={form.type === t.value ? { borderColor: TYPE_COLORS[t.value], color: TYPE_COLORS[t.value] } : {}}
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker-row">
              {ICONS.map(ic => (
                <button
                  key={ic} type="button"
                  className={`emoji-btn ${form.icon === ic ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                >{ic}</button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div className="form-field">
            <label>Label * <span className="hint">(e.g. Instagram, Email)</span></label>
            <input
              autoFocus
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Instagram"
            />
          </div>

          {/* Value */}
          <div className="form-field">
            <label>Display Value * <span className="hint">(shown to users)</span></label>
            <input
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="e.g. @abhisheksinghp1"
            />
          </div>

          {/* URL */}
          <div className="form-field">
            <label>URL <span className="hint">(optional — makes it clickable)</span></label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : initial ? '✓ Save Changes' : '✓ Add Link'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Main ContactLinks component ─────────────────────────────────────── */
export default function ContactLinks() {
  const { isAdmin, authFetch } = useAdmin()
  const [links, setLinks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editLink, setEditLink] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/contact-links/`)
      if (res.ok) setLinks(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const handleReorder = async (newLinks) => {
    setLinks(newLinks)
    if (!isAdmin) return
    const items = newLinks.map((l, i) => ({ id: l.id, sort_order: i + 1 }))
    try {
      await authFetch('/api/contact-links/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
    } catch { /* silent */ }
  }

  const handleAdd = async (form) => {
    const res = await authFetch('/api/contact-links/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Link added!'); setShowForm(false); fetchLinks() }
    else toast.error('Failed to add link')
  }

  const handleEdit = async (form) => {
    const res = await authFetch(`/api/contact-links/${editLink.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Link updated!'); setEditLink(null); fetchLinks() }
    else toast.error('Failed to update link')
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/contact-links/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Link deleted'); setLinks(l => l.filter(x => x.id !== id)) }
    else toast.error('Failed to delete link')
    setConfirmId(null)
  }

  if (loading) return <div className="links-loading">Loading contact info…</div>

  return (
    <div className="contact-links-section">
      {/* Admin toolbar */}
      {isAdmin && (
        <motion.div
          className="links-toolbar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="admin-badge">🔐 Admin — drag to reorder</span>
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Add Link
          </button>
        </motion.div>
      )}

      {/* Links grid */}
      {isAdmin ? (
        <Reorder.Group
          axis="y"
          values={links}
          onReorder={handleReorder}
          className="links-grid"
          as="div"
        >
          <AnimatePresence>
            {links.map(link => (
              <Reorder.Item
                key={link.id}
                value={link}
                className="reorder-item"
                whileDrag={{ scale: 1.03, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', zIndex: 10 }}
              >
                <LinkCard
                  link={link}
                  isAdmin={isAdmin}
                  onEdit={setEditLink}
                  onDelete={setConfirmId}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className="links-grid">
          <AnimatePresence>
            {links.map((link, i) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <LinkCard link={link} isAdmin={false} onEdit={() => {}} onDelete={() => {}} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showForm && <LinkFormModal initial={null} onSave={handleAdd} onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editLink && <LinkFormModal initial={editLink} onSave={handleEdit} onClose={() => setEditLink(null)} />}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="link-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="link-modal confirm-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-emoji">🗑️</div>
              <h3>Delete this link?</h3>
              <p>This cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(confirmId)}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
