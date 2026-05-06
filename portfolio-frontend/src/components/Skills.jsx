import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './Skills.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const COLORS = ['#6c63ff','#43e97b','#ff6584','#f7971e','#a18cd1','#38b2ac','#ed64a6','#667eea']
const ICONS  = ['⚙️','🚀','🗄️','🌐','🤖','🛡️','📦','🔧','💡','🎯']

/* ── tiny inline form ─────────────────────────────────────────────────── */
function InlineInput({ placeholder, onSave, onCancel, defaultValue = '', type = 'text' }) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className="inline-input-row">
      <input
        autoFocus
        type={type}
        value={val}
        placeholder={placeholder}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel() }}
        className="inline-input"
      />
      <button className="inline-save" onClick={() => onSave(val)}>✓</button>
      <button className="inline-cancel" onClick={onCancel}>✕</button>
    </div>
  )
}

/* ── skill row ────────────────────────────────────────────────────────── */
function SkillRow({ skill, color, catId, onUpdated, onDeleted, isAdmin, authFetch, inView, delay }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(skill.name)
  const [editLevel, setEditLevel] = useState(skill.level)

  const saveEdit = async () => {
    const res = await authFetch(`/api/skills/${skill.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, level: Number(editLevel), sort_order: skill.sort_order }),
    })
    if (res.ok) { onUpdated(); setEditing(false); toast.success('Skill updated') }
    else toast.error('Failed to update skill')
  }

  const del = async () => {
    if (!confirm(`Remove "${skill.name}"?`)) return
    const res = await authFetch(`/api/skills/${skill.id}`, { method: 'DELETE' })
    if (res.ok) { onDeleted(); toast.success('Skill removed') }
    else toast.error('Failed to remove skill')
  }

  return (
    <motion.div
      className="skill-item"
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay }}
    >
      {editing ? (
        <div className="skill-edit-row">
          <input
            className="inline-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Skill name"
          />
          <input
            className="inline-input level-input"
            type="number"
            min={1} max={100}
            value={editLevel}
            onChange={e => setEditLevel(e.target.value)}
          />
          <button className="inline-save" onClick={saveEdit}>✓</button>
          <button className="inline-cancel" onClick={() => setEditing(false)}>✕</button>
        </div>
      ) : (
        <>
          <div className="skill-meta">
            <span className="skill-name">{skill.name}</span>
            <div className="skill-meta-right">
              <span className="skill-pct">{skill.level}%</span>
              {isAdmin && (
                <div className="skill-admin-btns">
                  <button className="skill-edit-btn" onClick={() => setEditing(true)} title="Edit skill">✏️</button>
                  <button className="skill-del-btn"  onClick={del} title="Delete skill">🗑️</button>
                </div>
              )}
            </div>
          </div>
          <div className="skill-bar-track">
            <motion.div
              className="skill-bar-fill"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={inView ? { width: `${skill.level}%` } : {}}
              transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}

/* ── category card ────────────────────────────────────────────────────── */
function CategoryCard({ cat, onRefresh, isAdmin, authFetch, inView, gi }) {
  const [expanded, setExpanded]   = useState(true)
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(80)
  const [editingCat, setEditingCat] = useState(false)
  const [catForm, setCatForm] = useState({ name: cat.name, icon: cat.icon, color: cat.color })

  const addSkill = async () => {
    if (!newSkillName.trim()) return
    const res = await authFetch(`/api/skills/categories/${cat.id}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSkillName.trim(), level: Number(newSkillLevel), sort_order: cat.skills.length }),
    })
    if (res.ok) {
      onRefresh()
      setNewSkillName('')
      setNewSkillLevel(80)
      setAddingSkill(false)
      toast.success(`"${newSkillName}" added!`)
    } else toast.error('Failed to add skill')
  }

  const saveCat = async () => {
    const res = await authFetch(`/api/skills/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...catForm, sort_order: cat.sort_order }),
    })
    if (res.ok) { onRefresh(); setEditingCat(false); toast.success('Category updated') }
    else toast.error('Failed to update category')
  }

  const deleteCat = async () => {
    if (!confirm(`Delete category "${cat.name}" and all its skills?`)) return
    const res = await authFetch(`/api/skills/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) { onRefresh(); toast.success('Category deleted') }
    else toast.error('Failed to delete category')
  }

  return (
    <motion.div
      className="skill-group glow-card"
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: gi * 0.15 }}
    >
      {/* Category header */}
      <div className="skill-group-header" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div className="skill-group-left">
          <span className="skill-group-icon">{cat.icon}</span>
          {editingCat ? (
            <div className="cat-edit-form" onClick={e => e.stopPropagation()}>
              <input
                className="inline-input"
                value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
              />
              <div className="cat-icon-row">
                {ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-btn-sm ${catForm.icon === ic ? 'selected' : ''}`}
                    onClick={() => setCatForm(f => ({ ...f, icon: ic }))}
                  >{ic}</button>
                ))}
              </div>
              <div className="cat-color-row">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-btn-sm ${catForm.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setCatForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
              <div className="inline-input-row">
                <button className="inline-save" onClick={saveCat}>✓ Save</button>
                <button className="inline-cancel" onClick={() => setEditingCat(false)}>✕</button>
              </div>
            </div>
          ) : (
            <h3 className="skill-group-title" style={{ color: cat.color }}>{cat.name}</h3>
          )}
        </div>

        <div className="skill-group-right">
          <span className="skill-count">{cat.skills.length} skills</span>
          {isAdmin && !editingCat && (
            <div className="cat-admin-btns" onClick={e => e.stopPropagation()}>
              <button className="skill-edit-btn" onClick={() => setEditingCat(true)} title="Edit category">✏️</button>
              <button className="skill-del-btn"  onClick={deleteCat}                title="Delete category">🗑</button>
            </div>
          )}
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Skills list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="skill-items">
              <AnimatePresence>
                {cat.skills.map((skill, si) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    color={cat.color}
                    catId={cat.id}
                    onUpdated={onRefresh}
                    onDeleted={onRefresh}
                    isAdmin={isAdmin}
                    authFetch={authFetch}
                    inView={inView}
                    delay={gi * 0.15 + si * 0.08 + 0.3}
                  />
                ))}
              </AnimatePresence>

              {/* Add skill row */}
              {isAdmin && (
                <div className="add-skill-area">
                  {addingSkill ? (
                    <div className="add-skill-form">
                      <input
                        autoFocus
                        className="inline-input"
                        placeholder="Skill name (e.g. Redis)"
                        value={newSkillName}
                        onChange={e => setNewSkillName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                      />
                      <input
                        className="inline-input level-input"
                        type="number"
                        min={1} max={100}
                        value={newSkillLevel}
                        onChange={e => setNewSkillLevel(e.target.value)}
                        placeholder="Level %"
                      />
                      <button className="inline-save" onClick={addSkill}>✓ Add</button>
                      <button className="inline-cancel" onClick={() => setAddingSkill(false)}>✕</button>
                    </div>
                  ) : (
                    <button className="add-skill-btn" onClick={() => setAddingSkill(true)}>
                      + Add Skill
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Main Skills component ────────────────────────────────────────────── */
export default function Skills() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const { isAdmin, authFetch } = useAdmin()
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [addingCat, setAddingCat]   = useState(false)
  const [catForm, setCatForm]       = useState({ name: '', icon: '⚙️', color: '#6c63ff' })

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/skills/`)
      if (res.ok) setCategories(await res.json())
    } catch { /* backend not running — silently ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  const addCategory = async () => {
    if (!catForm.name.trim()) return
    const res = await authFetch('/api/skills/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...catForm, sort_order: categories.length }),
    })
    if (res.ok) {
      fetchSkills()
      setCatForm({ name: '', icon: '⚙️', color: '#6c63ff' })
      setAddingCat(false)
      toast.success('Category added!')
    } else toast.error('Failed to add category')
  }

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

        {/* Admin toolbar */}
        {isAdmin && (
          <motion.div
            className="skills-toolbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="admin-badge">🔐 Admin Mode</span>
            <button className="btn-primary btn-sm" onClick={() => setAddingCat(true)}>
              + Add Category
            </button>
          </motion.div>
        )}

        {/* Add category form */}
        <AnimatePresence>
          {addingCat && (
            <motion.div
              className="add-cat-form glow-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h4>New Category</h4>
              <div className="add-cat-row">
                <input
                  autoFocus
                  className="inline-input"
                  placeholder="Category name"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
              </div>
              <div className="cat-icon-row">
                {ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-btn-sm ${catForm.icon === ic ? 'selected' : ''}`}
                    onClick={() => setCatForm(f => ({ ...f, icon: ic }))}
                  >{ic}</button>
                ))}
              </div>
              <div className="cat-color-row">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-btn-sm ${catForm.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setCatForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
              <div className="inline-input-row" style={{ marginTop: 12 }}>
                <button className="btn-primary btn-sm" onClick={addCategory}>✓ Create</button>
                <button className="btn-outline btn-sm" onClick={() => setAddingCat(false)}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories grid */}
        {loading ? (
          <div className="skills-loading">Loading skills…</div>
        ) : (
          <div className="skills-grid">
            <AnimatePresence>
              {categories.map((cat, gi) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  onRefresh={fetchSkills}
                  isAdmin={isAdmin}
                  authFetch={authFetch}
                  inView={inView}
                  gi={gi}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
