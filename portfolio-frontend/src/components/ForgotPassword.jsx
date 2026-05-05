import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import './ForgotPassword.css'

const API          = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ADMIN_EMAIL  = 'abhishekpratapsingh1103@gmail.com'
const ADMIN_PHONE  = '9721513367'

// Step 1 — choose method (email / sms)
// Step 2 — enter OTP + new password

export default function ForgotPassword({ onClose, onBackToLogin }) {
  const [step, setStep]         = useState(1)
  const [method, setMethod]     = useState('email')
  const [loading, setLoading]   = useState(false)
  const [otp, setOtp]           = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [masked, setMasked]     = useState('')

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      const data = await res.json()
      if (res.ok) {
        setMasked(data.masked || '')
        toast.success(data.message)
        setStep(2)
        // 5-min countdown
        let secs = 300
        setCountdown(secs)
        const t = setInterval(() => {
          secs -= 1
          setCountdown(secs)
          if (secs <= 0) clearInterval(t)
        }, 1000)
      } else {
        toast.error(data.detail || 'Failed to send OTP')
      }
    } catch {
      toast.error('Network error. Is the backend running?')
    }
    setLoading(false)
  }

  // ── Step 2: Verify OTP + reset password ──────────────────────────
  const handleReset = async (e) => {
    e.preventDefault()
    if (!otp.trim())        { toast.error('Enter the OTP'); return }
    if (newPw.length < 6)   { toast.error('Password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, new_password: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password reset successfully! 🎉')
        onBackToLogin()
      } else {
        toast.error(data.detail || 'Failed to reset password')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <motion.div
      className="fp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="fp-card"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="fp-accent" />
        <button className="fp-close" onClick={onClose}>✕</button>

        <div className="fp-icon">🔑</div>
        <h2>Forgot Password</h2>

        {/* Step indicator */}
        <div className="fp-steps">
          <div className={`fp-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Choose Method
          </div>
          <div className="fp-step-line" />
          <div className={`fp-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Verify & Reset
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              className="fp-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="fp-desc">
                Choose how you want to receive the OTP to reset your password.
              </p>

              {/* Method selector */}
              <div className="fp-method-grid">
                <button
                  className={`fp-method-btn ${method === 'email' ? 'selected' : ''}`}
                  onClick={() => setMethod('email')}
                >
                  <span className="fp-method-icon">✉️</span>
                  <span className="fp-method-label">Email</span>
                  <span className="fp-method-value">{ADMIN_EMAIL}</span>
                </button>

                <button
                  className={`fp-method-btn ${method === 'sms' ? 'selected' : ''}`}
                  onClick={() => setMethod('sms')}
                >
                  <span className="fp-method-icon">📱</span>
                  <span className="fp-method-label">Mobile</span>
                  <span className="fp-method-value">+91 {ADMIN_PHONE}</span>
                </button>
              </div>

              <button
                className="btn-primary fp-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Sending…</>
                  : `Send OTP via ${method === 'email' ? 'Email' : 'SMS'} →`
                }
              </button>

              <button className="fp-back-link" onClick={onBackToLogin}>
                ← Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              className="fp-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="fp-desc">
                OTP sent to <strong>{masked}</strong>
              </p>

              {countdown > 0 ? (
                <div className="fp-countdown">
                  ⏱ Expires in <strong>{formatCountdown(countdown)}</strong>
                </div>
              ) : (
                <div className="fp-expired">
                  ⚠️ OTP expired.{' '}
                  <button className="fp-resend" onClick={() => { setStep(1); setOtp('') }}>
                    Request new OTP
                  </button>
                </div>
              )}

              <form onSubmit={handleReset} className="fp-form" noValidate>
                <div className="fp-field">
                  <label>OTP Code</label>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="fp-otp-input"
                  />
                </div>

                <div className="fp-field">
                  <label>New Password</label>
                  <div className="fp-pw-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                    />
                    <button type="button" className="fp-eye" onClick={() => setShowPw(v => !v)}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="fp-field">
                  <label>Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <span className="fp-mismatch">Passwords do not match</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary fp-btn"
                  disabled={loading || countdown === 0}
                >
                  {loading
                    ? <><span className="spinner" /> Resetting…</>
                    : '✓ Reset Password'
                  }
                </button>

                <button
                  type="button"
                  className="fp-back-link"
                  onClick={() => { setStep(1); setOtp('') }}
                >
                  ← Change method / Resend OTP
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
