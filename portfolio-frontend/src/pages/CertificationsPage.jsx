import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './CertificationsPage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PRESET_COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#f7971e',
  '#a18cd1', '#38b2ac', '#ed64a6', '#667eea',
  '#e53e3e', '#2b6cb0', '#276749', '#744210',
]

const emptyForm = {
  title: '', organization: '', description: '',
  issue_date: '', credential_id: '', card_color: '#6c63ff',
}

/* ── Certificate Card ────────────────────────────────────────────────── */
function CertCard({ cert, isAdmin, authFetch, onDeleted, onUpdated, index }) {
  const [ref, inView]             = useInView({ triggerOnce: true, threshold: 0.1 })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const color = cert.card_color || '#6c63ff'

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = `${API}/api/certifications/${cert.id}/pdf`
    a.download = `${cert.title}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async () => {
    const res = await authFetch(`/api/certifications/${cert.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Certificate deleted'); onDeleted(cert.id) }
    else toast.error('Failed to delete')
    setConfirmDelete(false)
  }

  const handleUploadPdf = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await authFetch(`/api/certifications/${cert.id}/pdf`, { method: 'POST', body: form })
    if (res.ok) { toast.success('PDF uploaded ✅'); onUpdated() }
    else { const err = await res.json(); toast.error(err.detail || 'PDF upload failed') }
    setUploading(false)
  }

  const handleUploadImg = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await authFetch(`/api/certifications/${cert.id}/image`, { method: 'POST', body: form })
    if (res.ok) { toast.success('Image uploaded ✅'); onUpdated() }
    else toast.error('Image upload failed')
    setUploading(false)
  }

  const handleColorChange = async (newColor) => {
    const res = await authFetch(`/api/certifications/${cert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_color: newColor }),
    })
    if (res.ok) { onUpdated(); setShowColorPicker(false) }
    else toast.error('Failed to update color')
  }

  return (
    <motion.div
      ref={ref}
      className="cert-card"
      style={{ '--cert-color': color, borderTopColor: color }}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      layout
    >
      {/* Top color accent bar */}
      <div className="cert-accent-bar" style={{ background: color }} />

      {/* Certificate image — fixed aspect ratio, no cropping */}
      <div className="cert-img-wrap">
        {cert.has_image ? (
          <img
            src={`${API}/api/certifications/${cert.id}/image`}
            alt={cert.title}
            className="cert-img"
          />
        ) : (
          <div className="cert-img-placeholder" style={{ background: `${color}18` }}>
            <span>🏆</span>
          </div>
        )}

        {/* Admin image upload */}
        {isAdmin && (
          <label className="cert-img-upload-btn" title="Upload image">
            <input type="file" accept=".jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }} disabled={uploading} onChange={handleUploadImg} />
            {cert.has_image ? '🔄' : '📷'}
          </label>
        )}

        {/* ✓ Verified badge — bottom right of image */}
        {cert.has_pdf && (
          <div className="cert-verified-badge" style={{ background: color }}>
            ✓ Verified
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="cert-body">
        <div className="cert-org" style={{ color }}>
          <span>🏢</span> {cert.organization}
        </div>
        <h3 className="cert-title">{cert.title}</h3>

        {cert.description && (
          <p className="cert-desc">{cert.description}</p>
        )}

        <div className="cert-meta">
          {cert.issue_date && (
            <span className="cert-meta-item">📅 {cert.issue_date}</span>
          )}
          {cert.credential_id && (
            <span className="cert-meta-item">🔑 {cert.credential_id}</span>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="cert-footer">
        {cert.has_pdf ? (
          <button className="cert-btn download" style={{ borderColor: `${color}55`, color }}
            onClick={handleDownload}>
            ⬇️ Download PDF
          </button>
        ) : isAdmin ? (
          <label className="cert-btn upload-pdf" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            <input type="file" accept=".pdf,application/pdf"
              style={{ display: 'none' }} disabled={uploading} onChange={handleUploadPdf} />
            {uploading ? '⏳ Uploading…' : '📎 Upload PDF'}
          </label>
        ) : (
          <span className="cert-no-pdf">No PDF available</span>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="cert-admin-btns">
            {/* Color picker */}
            <div className="cert-color-wrap">
              <button
                className="cert-btn color-btn"
                onClick={() => setShowColorPicker(v => !v)}
                title="Change card color"
                style={{ background: color }}
              />
              {showColorPicker && (
                <div className="cert-color-picker">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${c === color ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => handleColorChange(c)}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={e => handleColorChange(e.target.value)}
                    className="color-custom-input"
                    title="Custom color"
                  />
                </div>
              )}
            </div>

            {/* Delete */}
            <button className="cert-btn delete" onClick={() => setConfirmDelete(true)} title="Delete">
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div className="cert-confirm-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(false)}>
            <motion.div className="cert-confirm-card"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}>
              <div>🗑️</div>
              <h3>Delete Certificate?</h3>
              <p>This will also delete the PDF and image. Cannot be undone.</p>
              <div className="cert-confirm-btns">
                <button className="btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Add Certificate Modal ───────────────────────────────────────────── */
function AddCertModal({ onClose, onAdded, authFetch }) {
  const [form, setForm]       = useState(emptyForm)
  const [pdfFile, setPdfFile] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.title.trim())        e.title        = 'Title is required'
    if (!form.organization.trim()) e.organization = 'Organization is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (pdfFile) fd.append('pdf_file', pdfFile)
    if (imgFile) fd.append('img_file', imgFile)
    try {
      const res = await authFetch('/api/certifications/', { method: 'POST', body: fd })
      if (res.ok) {
        toast.success('Certificate added!')
        onAdded(await res.json())
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Failed to add certificate')
      }
    } catch { toast.error('Network error') }
    setSaving(false)
  }

  return (
    <motion.div className="cert-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="cert-modal"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}>
        <div className="cert-modal-accent" style={{ background: form.card_color }} />
        <button className="cert-modal-close" onClick={onClose}>✕</button>
        <div className="cert-modal-icon">🏆</div>
        <h2>Add Certificate</h2>

        <form onSubmit={handleSubmit} className="cert-form" noValidate>
          <div className={`cert-form-field ${errors.title ? 'has-error' : ''}`}>
            <label>Certificate Title *</label>
            <input autoFocus placeholder="e.g. AWS Certified Developer"
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })) }} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className={`cert-form-field ${errors.organization ? 'has-error' : ''}`}>
            <label>Organization *</label>
            <input placeholder="e.g. Amazon Web Services"
              value={form.organization}
              onChange={e => { setForm(f => ({ ...f, organization: e.target.value })); setErrors(er => ({ ...er, organization: '' })) }} />
            {errors.organization && <span className="field-error">{errors.organization}</span>}
          </div>

          <div className="cert-form-row">
            <div className="cert-form-field">
              <label>Issue Date</label>
              <input type="month" value={form.issue_date}
                onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div className="cert-form-field">
              <label>Credential ID</label>
              <input placeholder="e.g. ABC-12345" value={form.credential_id}
                onChange={e => setForm(f => ({ ...f, credential_id: e.target.value }))} />
            </div>
          </div>

          <div className="cert-form-field">
            <label>Description</label>
            <textarea rows={3} placeholder="Brief description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Card color picker */}
          <div className="cert-form-field">
            <label>Card Color</label>
            <div className="cert-form-colors">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button"
                  className={`color-swatch ${form.card_color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, card_color: c }))} />
              ))}
              <input type="color" value={form.card_color}
                onChange={e => setForm(f => ({ ...f, card_color: e.target.value }))}
                className="color-custom-input" title="Custom color" />
            </div>
          </div>

          <div className="cert-form-row">
            <div className="cert-form-field">
              <label>Certificate PDF</label>
              <label className="cert-file-label">
                <input type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => setPdfFile(e.target.files[0] || null)} />
                {pdfFile ? `📄 ${pdfFile.name}` : '📎 Choose PDF'}
              </label>
            </div>
            <div className="cert-form-field">
              <label>Certificate Image</label>
              <label className="cert-file-label">
                <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                  onChange={e => setImgFile(e.target.files[0] || null)} />
                {imgFile ? `🖼️ ${imgFile.name}` : '📷 Choose Image'}
              </label>
            </div>
          </div>

          <div className="cert-form-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : '✓ Add Certificate'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function CertificationsPage() {
  const { isAdmin, authFetch } = useAdmin()
  const [certs, setCerts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [ref, inView]           = useInView({ triggerOnce: true, threshold: 0.1 })

  const fetchCerts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/certifications/`)
      if (res.ok) setCerts(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCerts() }, [fetchCerts])

  return (
    <main className="cert-page">
      <div className="container">
        <motion.div ref={ref} className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}>
          <span className="section-tag">Achievements</span>
          <h2 className="section-title">My <span>Certifications</span></h2>
          <p className="section-subtitle">Professional certifications and credentials I've earned.</p>
        </motion.div>

        {isAdmin && (
          <motion.div className="cert-toolbar"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="admin-badge">🔐 Admin — {certs.length} certificate{certs.length !== 1 ? 's' : ''}</span>
            <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Certificate</button>
          </motion.div>
        )}

        {loading && <div className="cert-loading">Loading certificates…</div>}

        {!loading && certs.length === 0 && (
          <motion.div className="cert-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>🏆</span>
            <p>{isAdmin ? 'No certificates yet. Add your first one!' : 'No certificates available yet.'}</p>
            {isAdmin && <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Certificate</button>}
          </motion.div>
        )}

        {!loading && certs.length > 0 && (
          <div className="cert-grid">
            <AnimatePresence mode="popLayout">
              {certs.map((cert, i) => (
                <CertCard key={cert.id} cert={cert} index={i}
                  isAdmin={isAdmin} authFetch={authFetch}
                  onDeleted={id => setCerts(prev => prev.filter(c => c.id !== id))}
                  onUpdated={fetchCerts} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddCertModal
            onClose={() => setShowAdd(false)}
            onAdded={cert => setCerts(prev => [cert, ...prev])}
            authFetch={authFetch} />
        )}
      </AnimatePresence>
    </main>
  )
}
