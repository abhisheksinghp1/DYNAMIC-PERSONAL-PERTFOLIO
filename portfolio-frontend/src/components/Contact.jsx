import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import toast from 'react-hot-toast'
import { personalInfo } from '../data/portfolio'
import './Contact.css'

/* ── Chat message bubble ─────────────────────────────────────────────── */
function ChatBubble({ msg, isOwn }) {
  return (
    <motion.div
      className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {!isOwn && (
        <div className="bubble-avatar">APS</div>
      )}
      <div className="bubble-body">
        <p className="bubble-text">{msg.text}</p>
        <span className="bubble-time">{msg.time}</span>
      </div>
    </motion.div>
  )
}

/* ── Typing indicator ────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="chat-bubble other typing-indicator">
      <div className="bubble-avatar">APS</div>
      <div className="bubble-body">
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

/* ── Main Contact component ──────────────────────────────────────────── */
export default function Contact() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Chat messages shown in the preview window
  const [chatMessages, setChatMessages] = useState([
    {
      id: 0,
      text: "Hey! 👋 I'm Abhishek. Drop me a message — I'd love to hear from you!",
      time: 'now',
      isOwn: false,
    },
  ])
  const [showTyping, setShowTyping] = useState(false)
  const chatEndRef = useRef(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, showTyping])

  // Mirror the user's message into the chat preview as they type
  useEffect(() => {
    if (!form.message.trim()) return
    const id = setTimeout(() => {
      setChatMessages(prev => {
        // Replace the last "preview" bubble or add one
        const filtered = prev.filter(m => m.id !== 'preview')
        return [
          ...filtered,
          {
            id: 'preview',
            text: form.message,
            time: 'just now',
            isOwn: true,
          },
        ]
      })
    }, 300)
    return () => clearTimeout(id)
  }, [form.message])

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!form.email.trim())   e.email   = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = 'Enter a valid email'
    if (!form.message.trim()) e.message = 'Message is required'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSending(true)

    // Show typing indicator in chat
    setShowTyping(true)

    try {
      const res = await fetch('http://localhost:8000/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Message from ${form.name}`,
          message: form.message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map(d => d.msg).join(', ')
          : data.detail || 'Something went wrong'
        throw new Error(msg)
      }

      // Remove typing indicator, add reply bubble
      setShowTyping(false)
      setChatMessages(prev => [
        ...prev.filter(m => m.id !== 'preview'),
        { id: Date.now(), text: form.message, time: 'just now', isOwn: true },
        {
          id: Date.now() + 1,
          text: `Thanks ${form.name}! 🙌 Got your message. I'll reply to ${form.email} soon!`,
          time: 'just now',
          isOwn: false,
        },
      ])

      setSent(true)
      setForm({ name: '', email: '', message: '' })
      toast.success('Message sent! Check your inbox for a confirmation.')

    } catch (err) {
      setShowTyping(false)
      toast.error(err.message || 'Failed to send. Is the server running?')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section contact-section" id="contact" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">Let's <span>Connect</span></h2>
          <p className="section-subtitle">
            Have a project in mind? Let's build something great together.
          </p>
        </motion.div>

        <div className="contact-grid">

          {/* ── Left: Chat preview window ─────────────────────────────── */}
          <motion.div
            className="chat-window glow-card"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="chat-header">
              <div className="chat-avatar">APS</div>
              <div className="chat-info">
                <span className="chat-name">Abhishek Pratap Singh</span>
                <span className="chat-status">
                  <span className="badge-dot" /> Online
                </span>
              </div>
            </div>

            <div className="chat-messages">
              {chatMessages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} isOwn={msg.isOwn} />
              ))}
              {showTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-preview">
              <span className="chat-input-text">
                {form.message
                  ? form.message.length > 40
                    ? form.message.slice(0, 40) + '…'
                    : form.message
                  : 'Type your message below…'}
              </span>
              <span className="chat-send-icon">➤</span>
            </div>
          </motion.div>

          {/* ── Right: Form ───────────────────────────────────────────── */}
          <motion.div
            className="contact-form-wrap"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {sent ? (
              <div className="sent-state glow-card">
                <div className="sent-icon">🎉</div>
                <h3>Message Sent!</h3>
                <p>Thanks for reaching out. I'll get back to you at <strong>{form.email || 'your email'}</strong> soon.</p>
                <button className="btn-primary" onClick={() => setSent(false)}>
                  Send Another
                </button>
              </div>
            ) : (
              <form className="contact-form glow-card" onSubmit={handleSubmit} noValidate>
                <h3 className="form-title">Send a Message</h3>
                <p className="form-subtitle">
                  Your message appears live in the chat preview →
                </p>

                <div className="form-row">
                  <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
                    <label htmlFor="name">Your Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>

                  <div className={`form-field ${errors.email ? 'has-error' : ''}`}>
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>

                <div className={`form-field ${errors.message ? 'has-error' : ''}`}>
                  <label htmlFor="message">
                    Message
                    <span className="label-hint">— watch it appear in the chat!</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Hi Abhishek, I'd love to discuss a project with you…"
                    value={form.message}
                    onChange={handleChange}
                  />
                  {errors.message && <span className="field-error">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className="btn-primary submit-btn"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span className="spinner" /> Sending…
                    </>
                  ) : (
                    <>Send Message ➤</>
                  )}
                </button>

                <p className="form-note">
                  📬 Delivered to <strong>aps11102003@gmail.com</strong>
                </p>
              </form>
            )}

            {/* Contact info cards */}
            <div className="contact-info-cards">
              {[
                { icon: '✉️', label: 'Email', value: personalInfo.email, href: `mailto:${personalInfo.email}` },
                { icon: '📍', label: 'Location', value: personalInfo.location, href: null },
                { icon: '💼', label: 'LinkedIn', value: 'abhisheksinghp1', href: personalInfo.linkedin },
              ].map(item => (
                <a
                  key={item.label}
                  className="info-card glow-card"
                  href={item.href || '#'}
                  target={item.href && !item.href.startsWith('mailto') ? '_blank' : undefined}
                  rel="noreferrer"
                  data-hover
                >
                  <span className="info-icon">{item.icon}</span>
                  <div>
                    <span className="info-label">{item.label}</span>
                    <span className="info-value">{item.value}</span>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
