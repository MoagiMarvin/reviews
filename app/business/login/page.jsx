'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ email: '', password: '' })

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
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>Welcome back</h1>
                <p style={subStyle}>Log in to your business dashboard</p>

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={groupStyle}>
                        <label style={labelStyle}>Email</label>
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

                    <div style={groupStyle}>
                        <label style={labelStyle}>Password</label>
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

                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <p style={footerStyle}>
                    No account yet?{' '}
                    <a href="/business/register" style={linkStyle}>Register here</a>
                </p>
            </div>
        </div>
    )
}

const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: '#fafafa'
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px'
}

const titleStyle = {
    fontSize: '1.4rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: '#111'
}

const subStyle = {
    color: '#888',
    fontSize: '0.875rem',
    marginBottom: '1.5rem'
}

const errorStyle = {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
}

const groupStyle = { marginBottom: '1rem' }

const labelStyle = {
    fontSize: '0.8rem',
    color: '#555',
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: '500'
}

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#111'
}

const btnStyle = {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    marginTop: '0.5rem'
}

const footerStyle = {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#888'
}

const linkStyle = {
    color: '#111',
    fontWeight: '500'
}