import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import toast from 'react-hot-toast'
import './ChangePassword.css'

const ADMIN_EMAIL = 'abhishekpratapsingh1103@gmail.com'

// Step 1: Request OTP
// Step 2: Enter OTP + new password

export default function ChangePassword({ onClose }) {
  const { authFetch }   = useAdmin()
  const [step, setStep] = useState(1)   // 1 = request OTP, 2 = verify OTP
  const [loading, setLoading] = useState(false)
  const [otp, setOtp]         = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [countdown, setCountdown] = useState(0)

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleRequestOtp = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/auth/request-otp', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`OTP sent to ${ADMIN_EMAIL}`)
        setStep(2)
        // Start 5-min countdown
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

  // ── Step 2: Verify OTP + change password ─────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!otp.trim()) { toast.error('Enter the OTP'); return }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, new_password: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed successfully! 🎉')
        onClose()
      } else {
        toast.error(data.detail || 'Failed to change password')
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <motion.div
      className="cp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cp-card"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="cp-accent" />
        <button className="cp-close" onClick={onClose}>✕</button>

        <div className="cp-icon">🔐</div>
        <h2>Change Password</h2>

        {/* Step indicator */}
        <div className="cp-steps">
          <div className={`cp-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Send OTP
          </div>
          <div className="cp-step-line" />
          <div className={`cp-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Verify & Update
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              className="cp-step-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="cp-desc">
                An OTP will be sent to your registered email:
              </p>
              <div className="cp-email-badge">
                ✉️ {ADMIN_EMAIL}
              </div>
              <button
                className="btn-primary cp-btn"
                onClick={handleRequestOtp}
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Sending…</> : 'Send OTP →'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              className="cp-step-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="cp-desc">
                Enter the 6-digit OTP sent to <strong>{ADMIN_EMAIL}</strong>
              </p>

              {countdown > 0 && (
                <div className="cp-countdown">
                  ⏱ OTP expires in <strong>{formatCountdown(countdown)}</strong>
                </div>
              )}
              {countdown === 0 && (
                <div className="cp-expired">
                  ⚠️ OTP expired.{' '}
                  <button className="cp-resend" onClick={() => { setStep(1); setOtp('') }}>
                    Request new OTP
                  </button>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="cp-form" noValidate>
                {/* OTP input */}
                <div className="cp-field">
                  <label>OTP Code</label>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="cp-otp-input"
                  />
                </div>

                {/* New password */}
                <div className="cp-field">
                  <label>New Password</label>
                  <div className="cp-pw-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="cp-eye"
                      onClick={() => setShowPw(v => !v)}
                    >{showPw ? '🙈' : '👁️'}</button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="cp-field">
                  <label>Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <span className="cp-mismatch">Passwords do not match</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary cp-btn"
                  disabled={loading || countdown === 0}
                >
                  {loading ? <><span className="spinner" /> Updating…</> : '✓ Change Password'}
                </button>

                <button
                  type="button"
                  className="cp-back"
                  onClick={() => { setStep(1); setOtp('') }}
                >
                  ← Resend OTP
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
