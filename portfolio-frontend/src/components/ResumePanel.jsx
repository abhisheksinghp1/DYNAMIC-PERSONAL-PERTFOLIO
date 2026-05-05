import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './ResumePanel.css'

const API = 'http://localhost:8000'

export default function ResumePanel({ onClose }) {
  const { authFetch } = useAdmin()
  const [info, setInfo]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const fetchInfo = async () => {
    try {
      const res = await fetch(`${API}/api/resume/info`)
      setInfo(await res.json())
    } catch { setInfo({ uploaded: false }) }
  }

  useEffect(() => { fetchInfo() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      toast.error('Only PDF files allowed')
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await authFetch('/api/resume/upload', { method: 'POST', body: form })
      if (res.ok) {
        toast.success('Resume uploaded! ✅')
        fetchInfo()
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Upload failed')
      }
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete the uploaded resume?')) return
    const res = await authFetch('/api/resume/', { method: 'DELETE' })
    if (res.ok) { toast.success('Resume deleted'); fetchInfo() }
    else toast.error('Delete failed')
  }

  return (
    <motion.div
      className="resume-panel-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="resume-panel"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="panel-close" onClick={onClose}>✕</button>
        <div className="panel-icon">📄</div>
        <h3>Resume Manager</h3>
        <p className="panel-sub">Upload your PDF resume. Visitors can download it via "Hire Me".</p>

        {info?.uploaded ? (
          <div className="resume-status uploaded">
            <span>✅ Resume uploaded</span>
            <span className="resume-date">{info.uploaded_at?.slice(0, 10)}</span>
          </div>
        ) : (
          <div className="resume-status empty">
            ⚠️ No resume uploaded yet
          </div>
        )}

        <div className="panel-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            className="btn-primary"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading…' : info?.uploaded ? '🔄 Replace Resume' : '⬆️ Upload Resume'}
          </button>

          {info?.uploaded && (
            <>
              <a
                href={`${API}/api/resume/download`}
                className="btn-outline"
                download="Abhishek_Pratap_Singh_Resume.pdf"
              >
                ⬇️ Preview
              </a>
              <button className="btn-danger" onClick={handleDelete}>
                🗑 Delete
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
