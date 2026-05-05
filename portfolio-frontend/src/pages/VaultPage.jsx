import React from 'react'
import { useAdmin } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import DocumentVault from '../components/DocumentVault'
import './VaultPage.css'

export default function VaultPage() {
  const { isAdmin } = useAdmin()
  const navigate    = useNavigate()

  // Redirect visitors away — this page is admin-only
  if (!isAdmin) {
    return (
      <div className="vault-denied">
        <span>🔒</span>
        <h2>Access Denied</h2>
        <p>This section is private. Please log in as admin.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    )
  }

  return (
    <main className="vault-page">
      <DocumentVault />
    </main>
  )
}
