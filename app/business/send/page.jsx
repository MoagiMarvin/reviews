'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

export default function SendPage() {
    const [business, setBusiness] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [delay, setDelay] = useState(60)
    const [requests, setRequests] = useState([])
    const [form, setForm] = useState({
        customerNumber: '',
        customerName: ''
    })

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            const [bizRes, settingsRes, reqRes] = await Promise.all([
                fetch('/api/business/me'),
                fetch('/api/business/settings'),
                fetch('/api/requests')
            ])

            const bizData = await bizRes.json()
            const settingsData = await settingsRes.json()
            const reqData = await reqRes.json()

            if (bizData.business) setBusiness(bizData.business)

            if (settingsData.settings) {
                const savedDelay = settingsData.settings.send_delay_minutes
                setDelay(savedDelay !== null && savedDelay !== undefined ? savedDelay : 60)
            }

            if (reqData.requests) setRequests(reqData.requests)

        } catch (err) {
            setError('Failed to load')
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
            body: JSON.stringify({
                customerNumber: form.customerNumber,
                customerName: form.customerName,
                delayMinutes: delay
            })
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

        const reqRes = await fetch('/api/requests')
        const reqData = await reqRes.json()
        if (reqData.requests) setRequests(reqData.requests)

        setTimeout(() => setSuccess(false), 4000)
    }

    const statusColors = {
        pending: '#f59e0b',
        sent: '#3b82f6',
        reviewed: '#10b981'
    }

    const delayLabel = (mins) => {
        if (mins === 0) return 'Instantly'
        if (mins < 60) return `${mins} minutes`
        if (mins === 60) return '1 hour'
        if (mins < 1440) return `${mins / 60} hours`
        return '24 hours'
    }

    const scheduledTime = () => {
        if (delay === 0) return 'now'
        const t = new Date(Date.now() + delay * 60 * 1000)
        return t.toLocaleTimeString('en-ZA', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) return (
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Loading...</p>
        </div>
    )

    return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div style={pageStyle}>

                    <h1 style={pageTitleStyle}>Send request</h1>
                    <p style={pageSubStyle}>
                        Customer receives WhatsApp{' '}
                        {delay === 0 ? 'instantly' : `after ${delayLabel(delay)}`}
                    </p>

                    <div style={gridStyle}>

                        {/* Form */}
                        <div style={cardStyle}>
                            <h2 style={cardTitleStyle}>New feedback request</h2>

                            {error && <div style={errorStyle}>{error}</div>}

                            {success && (
                                <div style={successStyle}>
                                    {delay === 0
                                        ? 'WhatsApp sent immediately ✓'
                                        : `Queued ✓ — WhatsApp sends at ${scheduledTime()}`}
                                </div>
                            )}

                            <form onSubmit={handleSend}>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>WhatsApp number</label>
                                    <input
                                        type="tel"
                                        placeholder="082 000 0000"
                                        value={form.customerNumber}
                                        onChange={e => setForm({ ...form, customerNumber: e.target.value })}
                                        required
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={groupStyle}>
                                    <label style={labelStyle}>Customer name (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sipho"
                                        value={form.customerName}
                                        onChange={e => setForm({ ...form, customerName: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* WhatsApp preview */}
                                <div style={previewStyle}>
                                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                                        WhatsApp preview
                                    </p>
                                    <div style={bubbleStyle}>
                                        {`Hey ${form.customerName || 'there'} 👋\n\nThanks for visiting `}
                                        <strong>{business?.name}</strong>
                                        {` today!\n\nHow was your experience? Takes 30 seconds:\n👉 ${process.env.NEXT_PUBLIC_APP_URL || 'repuvault.co.za'}/feedback/${business?.slug}\n\nWe appreciate your support 🙏`}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }}>
                                        {delay === 0
                                            ? 'Sends immediately'
                                            : `Sends in ${delayLabel(delay)} · at ${scheduledTime()}`}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    style={btnStyle}
                                >
                                    {sending ? 'Sending...' : 'Send request'}
                                </button>
                            </form>

                            {/* Delay info */}
                            <div style={delayInfoStyle}>
                                <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>
                                    Current delay setting
                                </p>
                                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                    {delayLabel(delay)}
                                </p>
                                <a
                                    href="/business/settings"
                                    style={{ fontSize: '0.75rem', color: '#16a34a', textDecoration: 'none' }}
                                >
                                    Change in settings →
                                </a>
                            </div>

                            {/* Feedback link */}
                            <div style={linkBoxStyle}>
                                <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>
                                    Or share your feedback link directly
                                </p>
                                <p style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111' }}>
                                    {process.env.NEXT_PUBLIC_APP_URL}/feedback/{business?.slug}
                                </p>
                            </div>
                        </div>

                        {/* Recent requests */}
                        <div style={cardStyle}>
                            <h2 style={cardTitleStyle}>Recent requests</h2>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                                {requests.length} total sent
                            </p>

                            {requests.length === 0 ? (
                                <p style={emptyStyle}>No requests sent yet</p>
                            ) : (
                                requests.slice(0, 15).map(r => (
                                    <div key={r.id} style={rowStyle}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                                {r.customer_name || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>
                                                {r.customer_number} · {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: statusColors[r.status],
                                            textTransform: 'capitalize'
                                        }}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const layoutStyle = { display: 'flex', minHeight: '100vh', background: '#fafafa' }
const mainStyle = { flex: 1, overflow: 'auto' }
const pageStyle = { maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }
const pageTitleStyle = { fontSize: '1.4rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }
const pageSubStyle = { color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }
const cardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem' }
const cardTitleStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#111', marginBottom: '1rem' }
const groupStyle = { marginBottom: '0.875rem' }
const labelStyle = { fontSize: '0.8rem', color: '#555', display: 'block', marginBottom: '0.4rem', fontWeight: '500' }
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const previewStyle = { background: '#f9fafb', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }
const bubbleStyle = { background: '#1F2C34', color: '#E9EDE5', borderRadius: '12px 12px 12px 0', padding: '0.875rem 1rem', fontSize: '0.8rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }
const btnStyle = { width: '100%', padding: '0.875rem', borderRadius: '8px', background: '#111', color: '#fff', fontSize: '0.9rem', fontWeight: '600', border: 'none', cursor: 'pointer', marginBottom: '1rem' }
const delayInfoStyle = { padding: '0.875rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5', marginBottom: '0.75rem' }
const linkBoxStyle = { padding: '0.875rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }
const errorStyle = { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }
const successStyle = { background: '#f0fdf4', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }
const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #f3f4f6' }
const emptyStyle = { fontSize: '0.85rem', color: '#aaa' }