'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/business/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push('/business/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Welcome back
        </h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Log in to your business dashboard
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '0.4rem' }}>
              Email address
            </label>
            <input
              name="email"
              type="email"
              placeholder="you@business.co.za"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#888' }}>
          No account yet?{' '}
          <a href="/business/register" style={{ color: '#000', fontWeight: '500' }}>
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #e5e5e5',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
}

const btnStyle = {
  width: '100%',
  padding: '0.875rem',
  borderRadius: '8px',
  background: '#000',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer'
}