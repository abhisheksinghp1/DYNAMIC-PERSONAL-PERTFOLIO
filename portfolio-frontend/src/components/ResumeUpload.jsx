import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './ResumeUpload.css'

const API = 'http://localhost:8000'

export default function ResumeUpload() {
  const { isAdmin, authFetch } = useAdmin()
  const [info, setInfo]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const [show, setShow]         = useState(false)
  const fileRef = useRef()

  const fetchInfo = async () => {
    try {
      const res = await fetch(`${API}/api/resume/info`)
      if (res.ok) setInfo(await res.json())
    } catch {}
  }

  useEffect(() => { fetchInfo() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) { toast.error('Only PDF files allowed'); return }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await authFetch('/api/resume/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        toast.success('Resume uploaded!')
        fetchInfo()
        setShow(false)
      } else {
        toast.error(data.detail || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="resume-upload-widget">
      <button className="resume-upload-btn" onClick={() => setShow(s => !s)}>
        📄 {info?.uploaded ? 'Update Resume' : 'Upload Resume'}
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            className="resume-upload-panel glow-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <h4>Resume PDF</h4>
            {info?.uploaded ? (
              <p className="resume-current">
                ✅ Current: <strong>{info.filename}</strong><br />
                <span className="resume-date">Uploaded: {new Date(info.uploaded_at).toLocaleDateString()}</span>
              </p>
            ) : (
              <p className="resume-none">No resume uploaded yet.</p>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              className="btn-primary btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading…' : '📤 Choose PDF'}
            </button>
            <p className="resume-hint">Max 10MB · PDF only</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
