'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

export default function SendPage() {
    const router = useRouter()
    const [business, setBusiness] = useState(null)
    const [worker, setWorker] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [delay, setDelay] = useState(60)
    const [requests, setRequests] = useState([])
    const [form, setForm] = useState({ customerNumber: '', customerName: '' })

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            // 1. Check for owner session first
            const bizRes = await fetch('/api/business/me')
            const bizData = await bizRes.json()

            if (bizData.business) {
                setBusiness(bizData.business)

                const [settingsRes, reqRes] = await Promise.all([
                    fetch('/api/business/settings'),
                    fetch('/api/requests')
                ])
                const settingsData = await settingsRes.json()
                const reqData = await reqRes.json()

                if (settingsData.settings) {
                    const saved = settingsData.settings.send_delay_minutes
                    setDelay(saved !== null && saved !== undefined ? saved : 60)
                }
                if (reqData.requests) setRequests(reqData.requests)
                setLoading(false)
                return
            }

            // 2. Fall back to worker session check
            const workerRes = await fetch('/api/workers/me')
            const workerData = await workerRes.json()

            if (workerData.worker) {
                router.push('/worker/send')
                return
            }

            // If neither is logged in, redirect to login
            router.push('/business/login')
        } catch (err) {
            setError('Failed to load initial data')
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
            body: JSON.stringify({ customerNumber: form.customerNumber, customerName: form.customerName, delayMinutes: delay })
        })

        const data = await res.json()
        if (data.error) { setError(data.error); setSending(false); return }

        setSuccess(true)
        setForm({ customerNumber: '', customerName: '' })
        setSending(false)

        const reqRes = await fetch('/api/requests')
        const reqData = await reqRes.json()
        if (reqData.requests) setRequests(reqData.requests)
        setTimeout(() => setSuccess(false), 4000)
    }

    const delayLabel = (mins) => {
        if (mins === 0) return 'Instantly'
        if (mins < 60) return `${mins} min`
        if (mins === 60) return '1 hour'
        if (mins < 1440) return `${mins / 60} hours`
        return '24 hours'
    }

    const scheduledTime = () => {
        if (delay === 0) return 'now'
        const t = new Date(Date.now() + delay * 60 * 1000)
        return t.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    }

    const statusColors = { pending: '#d97706', sent: '#3b82f6', reviewed: '#16a34a' }

    if (loading) return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={{ ...centerStyle, paddingLeft: '220px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading page data...</p>
            </div>
        </BusinessLayout>
    )

    return (
        <BusinessLayout>
            <style>{`
                .send-page { max-width: 1200px; margin: 0; padding: 2rem 3rem 4rem 3rem; box-sizing: border-box; }
                .send-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.03em; margin-bottom: 0.2rem; }
                .send-sub { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 2rem; }
                .send-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
                .send-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-sizing: border-box; box-shadow: var(--shadow-sm); }
                .send-card:hover { box-shadow: var(--shadow-md); }
                .send-card-title { fontSize: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem; }
                .send-card-sub { fontSize: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem; }
                
                .send-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-hover);
                    font-size: 0.9rem;
                    outline: none;
                    box-sizing: border-box;
                    font-family: inherit;
                    color: var(--text-main);
                    transition: all 0.15s ease;
                }
                .send-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
                }

                .send-btn {
                    width: 100%;
                    padding: 0.875rem;
                    border-radius: var(--radius-md);
                    background: var(--text-main);
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    margin-bottom: 1.25rem;
                    transition: background 0.15s ease;
                }
                .send-btn:hover {
                    background: #1e293b;
                }
                .send-btn:disabled {
                    background: var(--text-light);
                    cursor: not-allowed;
                }

                /* High Fidelity WhatsApp Mockup */
                .wa-mockup {
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--border-hover);
                    margin-bottom: 1.25rem;
                }
                .wa-header {
                    background: #075e54;
                    color: #fff;
                    padding: 0.625rem 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .wa-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #128c7e;
                    color: #fff;
                    font-size: 0.7rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .wa-chat-body {
                    background: #efeae2;
                    background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0);
                    background-size: 16px 16px;
                    padding: 1rem;
                    min-height: 160px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }
                .wa-bubble {
                    align-self: flex-start;
                    background: #ffffff;
                    color: #111111;
                    padding: 0.625rem 0.875rem;
                    border-radius: 0 8px 8px 8px;
                    max-width: 85%;
                    font-size: 0.8rem;
                    line-height: 1.5;
                    box-shadow: 0 1px 1.5px rgba(0,0,0,0.12);
                    white-space: pre-wrap;
                    position: relative;
                }
                .wa-time-check {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 2px;
                    font-size: 0.6rem;
                    color: #888;
                    margin-top: 0.25rem;
                }

                .delay-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.5rem 0.75rem;
                    background: #f8fafc;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    font-size: 0.78rem;
                    color: var(--text-muted);
                }

                .status-msg {
                    padding: 0.875rem 1rem;
                    border-radius: var(--radius-md);
                    margin-bottom: 1.25rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    animation: slideDown 0.15s ease-out;
                }
                @keyframes slideDown {
                    from { transform: translateY(-8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 767px) {
                    .send-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .send-page { padding: 1.25rem 1rem; }
                }
            `}</style>
            <Sidebar business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div className="send-page">
                    <h1 className="send-title">Send Request</h1>
                    <p className="send-sub">
                        Send a customer a rating request {delay === 0 ? 'instantly' : `scheduled for ${delayLabel(delay)} delay`}
                    </p>

                    <div className="send-grid">

                        {/* Form */}
                        <div className="send-card">
                            <h2 className="send-card-title">New feedback request</h2>
                            <p className="send-card-sub">Queue a feedback request to a customer's WhatsApp line</p>

                            {error && (
                                <div className="status-msg" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="status-msg" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {delay === 0 ? 'WhatsApp request dispatched ✓' : `Queued successfully ✓ — sends at ${scheduledTime()}`}
                                </div>
                            )}

                            <form onSubmit={handleSend}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>WhatsApp mobile number</label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 082 000 0000"
                                        value={form.customerNumber}
                                        onChange={e => setForm({ ...form, customerNumber: e.target.value })}
                                        required
                                        className="send-input"
                                    />
                                </div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>Customer name (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sipho"
                                        value={form.customerName}
                                        onChange={e => setForm({ ...form, customerName: e.target.value })}
                                        className="send-input"
                                    />
                                </div>

                                {/* Mockup */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>WhatsApp preview mockup</label>
                                    <div className="wa-mockup">
                                        <div className="wa-header">
                                            <div className="wa-avatar">
                                                {business?.name ? business.name.slice(0, 1).toUpperCase() : 'R'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: '600', lineHeight: 1.1 }}>{business?.name || 'Credly Business'}</div>
                                                <div style={{ fontSize: '0.58rem', opacity: 0.8 }}>online</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.85 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                            </div>
                                        </div>
                                        <div className="wa-chat-body">
                                            <div className="wa-bubble">
                                                {`Hey ${form.customerName || 'there'} 👋\n\nThanks for visiting `}
                                                <strong>{business?.name || 'our shop'}</strong>
                                                {`!\n\nHow was your experience?\n👉 ${typeof window !== 'undefined' ? window.location.origin : '...'}/feedback/${business?.slug || 'slug'}\n\nWe appreciate your support 🙏`}
                                                <div className="wa-time-check">
                                                    <span>{new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={sending || !form.customerNumber} className="send-btn">
                                    {sending ? 'Sending...' : 'Send WhatsApp Request'}
                                </button>
                            </form>

                            <div className="delay-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Configured delay: <strong>{delayLabel(delay)}</strong></span>
                                {!worker && (
                                    <a href="/business/settings" style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Change</a>
                                )}
                            </div>
                        </div>

                        {/* Recent requests list */}
                        <div className="send-card">
                            <h2 className="send-card-title">Recent requests</h2>
                            <p className="send-card-sub">{requests.length} request logs captured in database</p>

                            {requests.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', padding: '1rem 0', textAlign: 'center' }}>No requests dispatched yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {requests.slice(0, 10).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: varStyle.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.customer_name || 'Unknown customer'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {r.customer_number} · {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: statusColors[r.status], textTransform: 'capitalize', marginLeft: '0.5rem', flexShrink: 0 }}>
                                                {r.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }
const mainStyle = { width: '100%', minWidth: 0 }
const labelStyle = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }
const varStyle = { text: 'var(--text-main)' }