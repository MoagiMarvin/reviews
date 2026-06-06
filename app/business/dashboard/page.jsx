'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()
    const [business, setBusiness] = useState(null)
    const [requests, setRequests] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ customerNumber: '', customerName: '' })

    useEffect(() => { loadDashboard() }, [])

    async function loadDashboard() {
        try {
            // Get business info
            const bizRes = await fetch('/api/business/me')
            const bizData = await bizRes.json()

            if (!bizData.business) {
                router.push('/business/login')
                return
            }

            setBusiness(bizData.business)

            // Get requests
            const reqRes = await fetch('/api/requests')
            const reqData = await reqRes.json()
            if (reqData.requests) setRequests(reqData.requests)

            // Get reviews
            const revRes = await fetch('/api/reviews')
            const revData = await revRes.json()
            if (revData.reviews) setReviews(revData.reviews)

        } catch (err) {
            router.push('/business/login')
        } finally {
            setLoading(false)
        }
    }

    async function handleSend(e) {
        e.preventDefault()
        setSending(true)
        setError('')
        setSuccess(false)

        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })

        const data = await res.json()

        if (data.error) {
            setError(data.error)
            setSending(false)
            return
        }

        setSuccess(true)
        setForm({ customerNumber: '', customerName: '' })
        setSending(false)

        // Refresh requests
        const reqRes = await fetch('/api/requests')
        const reqData = await reqRes.json()
        if (reqData.requests) setRequests(reqData.requests)

        setTimeout(() => setSuccess(false), 4000)
    }

    async function handleLogout() {
        await fetch('/api/business/logout', { method: 'POST' })
        router.push('/business/login')
    }

    if (loading) {
        return (
            <div style={centerStyle}>
                <p style={{ color: '#888' }}>Loading...</p>
            </div>
        )
    }

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null

    const statusColors = {
        pending: '#f59e0b',
        sent: '#3b82f6',
        reviewed: '#10b981'
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>

            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {business?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                        /feedback/{business?.slug}
                    </div>
                </div>
                <button onClick={handleLogout} style={logoutStyle}>
                    Log out
                </button>
            </div>

            <div style={pageStyle}>

                {/* Stats */}
                <div style={statsStyle}>
                    <div style={statStyle}>
                        <div style={statLabelStyle}>Requests sent</div>
                        <div style={statValStyle}>{requests.length}</div>
                    </div>
                    <div style={statStyle}>
                        <div style={statLabelStyle}>Reviews received</div>
                        <div style={{ ...statValStyle, color: '#10b981' }}>
                            {reviews.length}
                        </div>
                    </div>
                    <div style={statStyle}>
                        <div style={statLabelStyle}>Average rating</div>
                        <div style={{ ...statValStyle, color: '#f59e0b' }}>
                            {avgRating ? `${avgRating} ★` : '—'}
                        </div>
                    </div>
                    <div style={statStyle}>
                        <div style={statLabelStyle}>Response rate</div>
                        <div style={statValStyle}>
                            {requests.length
                                ? `${Math.round((reviews.length / requests.length) * 100)}%`
                                : '0%'}
                        </div>
                    </div>
                </div>

                <div style={gridStyle}>

                    {/* Send form */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>Send feedback request</h2>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>
                            Customer gets WhatsApp in 1 hour
                        </p>

                        {error && <div style={errorStyle}>{error}</div>}
                        {success && (
                            <div style={successStyle}>
                                Queued — WhatsApp sends in 1 hour ✓
                            </div>
                        )}

                        <form onSubmit={handleSend}>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={labelStyle}>WhatsApp number</label>
                                <input
                                    type="tel"
                                    placeholder="082 000 0000"
                                    value={form.customerNumber}
                                    onChange={(e) => setForm({ ...form, customerNumber: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Customer name (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sipho"
                                    value={form.customerName}
                                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <button type="submit" disabled={sending} style={btnStyle}>
                                {sending ? 'Sending...' : 'Send request'}
                            </button>
                        </form>

                        <div style={linkBoxStyle}>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>
                                Your feedback link
                            </p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111' }}>
                                {process.env.NEXT_PUBLIC_APP_URL}/feedback/{business?.slug}
                            </p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div>

                        {/* Recent requests */}
                        <div style={{ ...cardStyle, marginBottom: '1rem' }}>
                            <h2 style={cardTitleStyle}>Recent requests</h2>
                            {requests.length === 0 ? (
                                <p style={emptyStyle}>No requests yet</p>
                            ) : (
                                requests.slice(0, 6).map((r) => (
                                    <div key={r.id} style={rowStyle}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                                {r.customer_name || r.customer_number}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                                {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: statusColors[r.status]
                                        }}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Recent reviews */}
                        <div style={cardStyle}>
                            <h2 style={cardTitleStyle}>Recent reviews</h2>
                            {reviews.length === 0 ? (
                                <p style={emptyStyle}>No reviews yet</p>
                            ) : (
                                reviews.slice(0, 5).map((r) => (
                                    <div key={r.id} style={reviewRowStyle}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                                {r.customer_name || 'Anonymous'}
                                            </span>
                                            <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                            </span>
                                        </div>
                                        {r.feedback && (
                                            <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>
                                                {r.feedback}
                                            </p>
                                        )}
                                        {!r.feedback && r.is_public && (
                                            <p style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                                Sent to Google ✓
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '4px' }}>
                                            {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

const centerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}

const headerStyle = {
    background: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10
}

const logoutStyle = {
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '0.4rem 0.875rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    color: '#666'
}

const pageStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '1.5rem 1rem'
}

const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.5rem'
}

const statStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1rem 1.25rem'
}

const statLabelStyle = {
    fontSize: '0.75rem',
    color: '#888',
    marginBottom: '0.4rem'
}

const statValStyle = {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#111'
}

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    alignItems: 'start'
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.25rem'
}

const cardTitleStyle = {
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
    color: '#111'
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
    fontFamily: 'inherit'
}

const btnStyle = {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer'
}

const linkBoxStyle = {
    marginTop: '1.25rem',
    padding: '0.875rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e5e5'
}

const errorStyle = {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
}

const successStyle = {
    background: '#f0fdf4',
    color: '#16a34a',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
}

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const reviewRowStyle = {
    padding: '0.75rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const emptyStyle = {
    fontSize: '0.85rem',
    color: '#aaa',
    padding: '0.5rem 0'
}