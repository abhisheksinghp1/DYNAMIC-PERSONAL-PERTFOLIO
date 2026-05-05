import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './DocumentVault.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FILE_ICONS = {
  'application/pdf':    '📄',
  'image/jpeg':         '🖼️',
  'image/png':          '🖼️',
  'image/webp':         '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain':         '📃',
}

function fileIcon(mime) {
  return FILE_ICONS[mime] || '📁'
}

function formatSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function DocumentVault() {
  const { isAdmin, authFetch } = useAdmin()
  const [docs, setDocs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [confirmId, setConfirmId]     = useState(null)
  const [search, setSearch]           = useState('')
  const fileRef                       = useRef()

  // Only render for admin
  if (!isAdmin) return null

  const fetchDocs = async () => {
    try {
      const res = await authFetch('/api/documents/')
      if (res.ok) setDocs(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await authFetch('/api/documents/upload', { method: 'POST', body: form })
        if (res.ok) {
          toast.success(`"${file.name}" uploaded`)
        } else {
          const err = await res.json()
          toast.error(err.detail || `Failed to upload "${file.name}"`)
        }
      } catch {
        toast.error(`Upload failed for "${file.name}"`)
      }
    }

    setUploading(false)
    fileRef.current.value = ''
    fetchDocs()
  }

  const handleDelete = async (id) => {
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Document deleted')
      setDocs(d => d.filter(doc => doc.id !== id))
    } else {
      toast.error('Failed to delete document')
    }
    setConfirmId(null)
  }

  const handleDownload = async (id, name) => {
    try {
      const res = await authFetch(`/api/documents/${id}/download`)
      if (!res.ok) { toast.error('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const filtered = docs.filter(d =>
    d.original_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      className="doc-vault"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="vault-header">
        <div className="vault-title">
          <span className="vault-icon">🔐</span>
          <div>
            <h2>Private Document Vault</h2>
            <p>Only visible to you. {docs.length} document{docs.length !== 1 ? 's' : ''} stored.</p>
          </div>
        </div>

        <div className="vault-actions">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            className="btn-primary vault-upload-btn"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><span className="spinner" /> Uploading…</>
            ) : (
              '⬆️ Upload Files'
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      {docs.length > 0 && (
        <div className="vault-search">
          <input
            type="text"
            placeholder="🔍 Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="vault-search-input"
          />
        </div>
      )}

      {/* Supported formats note */}
      <p className="vault-formats">
        Supported: PDF, JPG, PNG, DOCX, XLSX, TXT (max 50 MB each)
      </p>

      {/* Document list */}
      {loading ? (
        <div className="vault-loading">Loading vault…</div>
      ) : filtered.length === 0 ? (
        <div className="vault-empty">
          {docs.length === 0 ? (
            <>
              <span>📂</span>
              <p>Your vault is empty. Upload your first document.</p>
            </>
          ) : (
            <>
              <span>🔍</span>
              <p>No documents match "{search}"</p>
            </>
          )}
        </div>
      ) : (
        <div className="vault-list">
          <AnimatePresence>
            {filtered.map(doc => (
              <motion.div
                key={doc.id}
                className="vault-item"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="vault-item-icon">{fileIcon(doc.mime_type)}</div>
                <div className="vault-item-info">
                  <span className="vault-item-name">{doc.original_name}</span>
                  <span className="vault-item-meta">
                    {formatSize(doc.size_bytes)} · {formatDate(doc.uploaded_at)}
                  </span>
                </div>
                <div className="vault-item-actions">
                  <button
                    className="vault-btn download"
                    onClick={() => handleDownload(doc.id, doc.original_name)}
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    className="vault-btn delete"
                    onClick={() => setConfirmId(doc.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
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
            className="vault-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              className="vault-confirm-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🗑️</div>
              <h3>Delete Document?</h3>
              <p>This cannot be undone.</p>
              <div className="confirm-btns">
                <button className="btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(confirmId)}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
