import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './PhotoSlider.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AUTO_INTERVAL = 5000  // 5s — gives videos time to play

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

/* ── Slide content — image or autoplay video ─────────────────────────── */
function SlideMedia({ item, isActive }) {
  const videoRef = useRef()

  // Autoplay video when it becomes the active slide
  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isActive])

  if (item.media_type === 'video') {
    return (
      <video
        ref={videoRef}
        src={`${API}${item.url}`}
        className="slider-img"
        muted
        loop
        playsInline
        preload="metadata"
      />
    )
  }

  return (
    <img
      src={`${API}${item.url}`}
      alt={item.caption || `Slide`}
      className="slider-img"
    />
  )
}

export default function PhotoSlider() {
  const { isAdmin, authFetch } = useAdmin()
  const [items, setItems]       = useState([])
  const [index, setIndex]       = useState(0)
  const [dir, setDir]           = useState(1)
  const [paused, setPaused]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const imgRef  = useRef()
  const vidRef  = useRef()
  const timerRef = useRef()

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/gallery/items`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
        setIndex(0)
      }
    } catch { /* backend offline */ }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Auto-advance — images only, videos loop forever
  useEffect(() => {
    if (items.length <= 1 || paused) return
    const current = items[index]
    if (current?.media_type === 'video') return  // videos loop, never auto-advance
    timerRef.current = setInterval(() => {
      setDir(1)
      setIndex(i => (i + 1) % items.length)
    }, AUTO_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [items, index, paused])

  const goTo = (i) => { setDir(i > index ? 1 : -1); setIndex(i) }
  const prev = () => { setDir(-1); setIndex(i => (i - 1 + items.length) % items.length) }
  const next = () => { setDir(1);  setIndex(i => (i + 1) % items.length) }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('caption', '')
      try {
        const res = await authFetch('/api/gallery/upload', { method: 'POST', body: form })
        if (res.ok) toast.success(`"${file.name}" added`)
        else { const err = await res.json(); toast.error(err.detail || 'Upload failed') }
      } catch { toast.error('Upload failed') }
    }
    setUploading(false)
    if (imgRef.current)  imgRef.current.value = ''
    if (vidRef.current)  vidRef.current.value = ''
    fetchItems()
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed'); setConfirmId(null); fetchItems() }
    else toast.error('Failed to delete')
  }

  // Don't render if empty and not admin
  if (items.length === 0 && !isAdmin) return null

  const current = items[index]

  return (
    <section
      className="photo-slider-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Admin upload bar — no section title shown */}
      {isAdmin && (
        <div className="slider-admin-bar container">
          <span className="admin-badge">🔐 Admin — add images or videos</span>
          <div className="slider-upload-btns">
            <input ref={imgRef} type="file" multiple
              accept=".jpg,.jpeg,.png,.webp,.gif"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <input ref={vidRef} type="file" multiple
              accept=".mp4,.webm,.ogg,.mov"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button className="btn-outline btn-sm" onClick={() => imgRef.current.click()} disabled={uploading}>
              🖼️ Add Image
            </button>
            <button className="btn-primary btn-sm" onClick={() => vidRef.current.click()} disabled={uploading}>
              {uploading ? '⏳ Uploading…' : '🎬 Add Video'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state — admin only */}
      {items.length === 0 && isAdmin && (
        <div className="container">
          <div className="slider-empty">
            <span>🎬</span>
            <p>No media yet. Add images or videos above.</p>
          </div>
        </div>
      )}

      {/* Slider */}
      {items.length > 0 && (
        <div className="container">
        <div className="slider-wrapper">
          <div className="slider-card">
            <AnimatePresence custom={dir} mode="wait">
              <motion.div
                key={current.id}
                className="slider-slide"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <SlideMedia item={current} isActive={true} />

                {/* Media type badge */}
                {current.media_type === 'video' && (
                  <div className="slide-type-badge">▶ Video</div>
                )}

                {/* Caption */}
                {current.caption && (
                  <div className="slider-caption">{current.caption}</div>
                )}

                {/* Admin delete */}
                {isAdmin && (
                  <button
                    className="slide-delete-btn"
                    onClick={() => setConfirmId(current.id)}
                    title="Remove"
                  >🗑</button>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Arrows */}
            {items.length > 1 && (
              <>
                <button className="slider-arrow left"  onClick={prev} aria-label="Previous">‹</button>
                <button className="slider-arrow right" onClick={next} aria-label="Next">›</button>
              </>
            )}
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="slider-dots">
              {items.map((item, i) => (
                <button
                  key={i}
                  className={`slider-dot ${i === index ? 'active' : ''} ${item.media_type === 'video' ? 'video-dot' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  title={item.media_type === 'video' ? '▶ Video' : '🖼 Image'}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="slider-counter">
            {index + 1} / {items.length}
            {current?.media_type === 'video' && <span className="counter-type"> · ▶ Video</span>}
          </div>
        </div>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            className="slider-confirm-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="slider-confirm-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div>🗑️</div>
              <h3>Remove this item?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-btns">
                <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn-danger"  onClick={() => handleDelete(confirmId)}>Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
