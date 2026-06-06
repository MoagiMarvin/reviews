'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        googleReviewLink: ''
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/business/register', {
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

        router.push('/business/login')
    }

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>Create account</h1>
                <p style={subStyle}>Start collecting reviews for your business</p>

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={groupStyle}>
                        <label style={labelStyle}>Business name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g. Kabo's Kitchen"
                            value={form.name}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

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
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={groupStyle}>
                        <label style={labelStyle}>Google review link</label>
                        <input
                            name="googleReviewLink"
                            type="url"
                            placeholder="https://g.page/r/..."
                            value={form.googleReviewLink}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                        <p style={hintStyle}>Get this from your Google Business Profile</p>
                    </div>

                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Creating...' : 'Create account'}
                    </button>
                </form>

                <p style={footerStyle}>
                    Already have an account?{' '}
                    <a href="/business/login" style={linkStyle}>Log in</a>
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

const groupStyle = {
    marginBottom: '1rem'
}

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

const hintStyle = {
    fontSize: '0.75rem',
    color: '#aaa',
    marginTop: '0.3rem'
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