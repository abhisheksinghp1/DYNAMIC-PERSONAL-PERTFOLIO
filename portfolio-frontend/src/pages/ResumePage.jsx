import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './ResumePage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

/* ── Upload zone ─────────────────────────────────────────────────────── */
function UploadZone({ accept, label, hint, onUpload, uploading }) {
  const ref = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && ref.current.click()}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onUpload(e.target.files[0])}
      />
      <div className="upload-zone-icon">{uploading ? '⏳' : '⬆️'}</div>
      <p className="upload-zone-label">{uploading ? 'Uploading…' : label}</p>
      <p className="upload-zone-hint">{hint}</p>
    </div>
  )
}

/* ── Resume Images section ───────────────────────────────────────────── */
function ResumeImages({ isAdmin, authFetch }) {
  const [images, setImages]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/resume-media/images`)
      if (res.ok) setImages(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const handleUpload = async (file) => {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('media_type', 'image')
    try {
      const res = await authFetch('/api/resume-media/upload', { method: 'POST', body: form })
      if (res.ok) { toast.success('Resume image uploaded!'); fetch_() }
      else { const e = await res.json(); toast.error(e.detail || 'Upload failed') }
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/resume-media/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Image deleted'); setImages(i => i.filter(x => x.id !== id)) }
    else toast.error('Delete failed')
    setConfirmId(null)
  }

  return (
    <div className="resume-section">
      <div className="resume-section-header">
        <div className="resume-section-title">
          <span className="resume-section-icon">🖼️</span>
          <div>
            <h3>Resume Images</h3>
            <p>Photos of your resume / CV</p>
          </div>
        </div>
      </div>

      {/* Upload zone — admin only */}
      {isAdmin && (
        <UploadZone
          accept=".jpg,.jpeg,.png,.webp"
          label="Click or drag to upload resume image"
          hint="JPG, PNG, WebP — max 20 MB"
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      {/* Images grid */}
      {loading ? (
        <div className="media-loading">Loading…</div>
      ) : images.length === 0 ? (
        <div className="media-empty">
          <span>🖼️</span>
          <p>{isAdmin ? 'No resume images yet. Upload one above.' : 'No resume images available.'}</p>
        </div>
      ) : (
        <div className="images-grid">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                className="image-card glow-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="image-thumb" onClick={() => setLightbox(img)}>
                  <img src={`${API}${img.url}`} alt={img.original_name} />
                  <div className="image-overlay">
                    <span>🔍 View</span>
                  </div>
                </div>
                <div className="image-meta">
                  <span className="image-name">{img.original_name}</span>
                  <span className="image-info">{formatSize(img.size_bytes)} · {formatDate(img.uploaded_at)}</span>
                </div>
                {isAdmin && (
                  <button
                    className="media-delete-btn"
                    onClick={() => setConfirmId(img.id)}
                    title="Delete"
                  >🗑</button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={`${API}${lightbox.url}`}
              alt={lightbox.original_name}
              className="lightbox-img"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            />
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="confirm-card"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <div>🗑️</div>
              <h3>Delete this image?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-btns">
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

/* ── Video Resume section ────────────────────────────────────────────── */
function VideoResumes({ isAdmin, authFetch }) {
  const [videos, setVideos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/resume-media/videos`)
      if (res.ok) setVideos(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const handleUpload = async (file) => {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('media_type', 'video')
    try {
      const res = await authFetch('/api/resume-media/upload', { method: 'POST', body: form })
      if (res.ok) { toast.success('Video resume uploaded!'); fetch_() }
      else { const e = await res.json(); toast.error(e.detail || 'Upload failed') }
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/resume-media/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Video deleted'); setVideos(v => v.filter(x => x.id !== id)) }
    else toast.error('Delete failed')
    setConfirmId(null)
  }

  return (
    <div className="resume-section">
      <div className="resume-section-header">
        <div className="resume-section-title">
          <span className="resume-section-icon">🎬</span>
          <div>
            <h3>Video Resume</h3>
            <p>Your CV in video format</p>
          </div>
        </div>
      </div>

      {/* Upload zone — admin only */}
      {isAdmin && (
        <UploadZone
          accept=".mp4,.webm,.ogg,.mov"
          label="Click or drag to upload video resume"
          hint="MP4, WebM, MOV — max 200 MB"
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      {/* Videos list */}
      {loading ? (
        <div className="media-loading">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="media-empty">
          <span>🎬</span>
          <p>{isAdmin ? 'No video resume yet. Upload one above.' : 'No video resume available.'}</p>
        </div>
      ) : (
        <div className="videos-list">
          <AnimatePresence>
            {videos.map((vid, i) => (
              <motion.div
                key={vid.id}
                className="video-card glow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.08 }}
              >
                <video
                  src={`${API}${vid.url}`}
                  controls
                  className="video-player"
                  preload="metadata"
                />
                <div className="video-meta">
                  <span className="video-name">{vid.original_name}</span>
                  <span className="video-info">{formatSize(vid.size_bytes)} · {formatDate(vid.uploaded_at)}</span>
                  {isAdmin && (
                    <button
                      className="media-delete-btn"
                      onClick={() => setConfirmId(vid.id)}
                      title="Delete"
                    >🗑 Delete</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="confirm-card"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <div>🗑️</div>
              <h3>Delete this video?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-btns">
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

/* ── Main Resume Page ────────────────────────────────────────────────── */
export default function ResumePage() {
  const { isAdmin, authFetch } = useAdmin()

  return (
    <main className="resume-page">
      <div className="container">
        {/* Page header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">My Resume</span>
          <h2 className="section-title">Resume & <span>Video CV</span></h2>
          <p className="section-subtitle">
            View my resume image or watch my video introduction.
          </p>
          {isAdmin && (
            <div className="admin-badge" style={{ marginTop: 12 }}>
              🔐 Admin Mode — upload, view and delete resume content
            </div>
          )}
        </motion.div>

        {/* Two sections */}
        <div className="resume-sections">
          <ResumeImages isAdmin={isAdmin} authFetch={authFetch} />
          <VideoResumes isAdmin={isAdmin} authFetch={authFetch} />
        </div>
      </div>
    </main>
  )
}
