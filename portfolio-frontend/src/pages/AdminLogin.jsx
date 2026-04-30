import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './AdminLogin.css'

export default function AdminLogin({ onClose }) {
  const { login } = useAdmin()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back, Admin! 🔐')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="login-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="login-card"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h2>Admin Login</h2>
          <p>Sign in to manage your portfolio content</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Signing in…</>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p className="login-hint">
          Default: <code>admin</code> / <code>admin123</code>
        </p>

        <button className="login-close" onClick={onClose} aria-label="Close">✕</button>
      </motion.div>
    </motion.div>
  )
}
