import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './AboutCards.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const EMOJIS = ['👨‍💻','🎓','⚙️','🚀','🌟','💡','🔥','🎯','🛡️','📦','🌐','🤖','☕','🏆','💻','🎨']
const COLORS = ['#6c63ff','#43e97b','#ff6584','#f7971e','#a18cd1','#38b2ac','#ed64a6','#667eea']

const emptyForm = { title: '', content: '', emoji: '✨', color: '#6c63ff' }

/* ── Single card (view + admin edit) ─────────────────────────────────── */
function AboutCard({ card, isAdmin, onEdit, onDelete, isDragging }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <motion.div
      ref={ref}
      className={`about-card glow-card ${isDragging ? 'dragging' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      style={{ '--card-color': card.color }}
    >
      {/* Color accent top bar */}
      <div className="card-accent" style={{ background: card.color }} />

      <div className="card-body">
        {/* Animated emoji */}
        <motion.div
          className="card-emoji"
          animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.15, 1.1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        >
          {card.emoji}
        </motion.div>

        <h3 className="card-title">{card.title}</h3>
        <p className="card-content">{card.content}</p>

        {/* Admin controls */}
        {isAdmin && (
          <div className="card-admin-btns">
            <button className="card-btn edit" onClick={() => onEdit(card)} title="Edit">✏️</button>
            <button className="card-btn delete" onClick={() => onDelete(card.id)} title="Delete">🗑</button>
            <span className="drag-handle" title="Drag to reorder">⠿</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Add / Edit form modal ───────────────────────────────────────────── */
function CardFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <motion.div
      className="card-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card-modal"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-modal-accent" style={{ background: form.color }} />
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-preview-emoji">{form.emoji}</div>
        <h3>{initial ? 'Edit Card' : 'Add New Card'}</h3>

        <form onSubmit={handleSubmit} className="card-form">
          {/* Emoji picker */}
          <div className="form-field">
            <label>Emoji</label>
            <div className="emoji-picker">
              {EMOJIS.map(em => (
                <button
                  key={em} type="button"
                  className={`emoji-btn ${form.emoji === em ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, emoji: em }))}
                >{em}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="form-field">
            <label>Accent Color</label>
            <div className="color-picker-row">
              {COLORS.map(c => (
                <button
                  key={c} type="button"
                  className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-field">
            <label>Title *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Who I Am"
            />
          </div>

          {/* Content */}
          <div className="form-field">
            <label>Content *</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write something about yourself…"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : initial ? '✓ Save Changes' : '✓ Add Card'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Main AboutCards component ───────────────────────────────────────── */
export default function AboutCards() {
  const { isAdmin, authFetch } = useAdmin()
  const [cards, setCards]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/about/cards`)
      if (res.ok) setCards(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  /* ── Save reorder after drag ──────────────────────────────────────── */
  const handleReorder = async (newCards) => {
    setCards(newCards)
    if (!isAdmin) return
    const items = newCards.map((c, i) => ({ id: c.id, sort_order: i + 1 }))
    try {
      await authFetch('/api/about/cards/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
    } catch { /* silent */ }
  }

  /* ── Add card ─────────────────────────────────────────────────────── */
  const handleAdd = async (form) => {
    const res = await authFetch('/api/about/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Card added!')
      setShowForm(false)
      fetchCards()
    } else toast.error('Failed to add card')
  }

  /* ── Edit card ────────────────────────────────────────────────────── */
  const handleEdit = async (form) => {
    const res = await authFetch(`/api/about/cards/${editCard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Card updated!')
      setEditCard(null)
      fetchCards()
    } else toast.error('Failed to update card')
  }

  /* ── Delete card ──────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    const res = await authFetch(`/api/about/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Card deleted')
      setCards(c => c.filter(card => card.id !== id))
    } else toast.error('Failed to delete card')
    setConfirmId(null)
  }

  if (loading) return <div className="cards-loading">Loading…</div>

  return (
    <div className="about-cards-section">

      {/* Admin toolbar */}
      {isAdmin && (
        <motion.div
          className="cards-toolbar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="admin-badge">🔐 Admin — drag cards to reorder</span>
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Add Card
          </button>
        </motion.div>
      )}

      {/* Cards grid — draggable for admin, static for visitors */}
      {isAdmin ? (
        <Reorder.Group
          axis="y"
          values={cards}
          onReorder={handleReorder}
          className="cards-grid"
          as="div"
        >
          <AnimatePresence>
            {cards.map(card => (
              <Reorder.Item
                key={card.id}
                value={card}
                className="reorder-item"
                whileDrag={{
                  scale: 1.03,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                  zIndex: 10,
                  cursor: 'grabbing',
                }}
              >
                <AboutCard
                  card={card}
                  isAdmin={isAdmin}
                  onEdit={setEditCard}
                  onDelete={setConfirmId}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className="cards-grid">
          <AnimatePresence>
            {cards.map(card => (
              <AboutCard
                key={card.id}
                card={card}
                isAdmin={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add form modal */}
      <AnimatePresence>
        {showForm && (
          <CardFormModal
            initial={null}
            onSave={handleAdd}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit form modal */}
      <AnimatePresence>
        {editCard && (
          <CardFormModal
            initial={editCard}
            onSave={handleEdit}
            onClose={() => setEditCard(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="card-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="card-modal confirm-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-emoji">🗑️</div>
              <h3>Delete this card?</h3>
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
