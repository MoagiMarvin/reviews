'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WorkerSidebar from '@/components/worker/WorkerSidebar'
import WorkerLayout from '@/components/worker/WorkerLayout'

export default function WorkerSendPage() {
    const router = useRouter()
    const [worker, setWorker] = useState(null)
    const [business, setBusiness] = useState(null)
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
            const meRes = await fetch('/api/workers/me')
            const meData = await meRes.json()

            if (!meData.worker) {
                router.push('/business/login')
                return
            }

            setWorker(meData.worker)
            setBusiness(meData.business)

            const [settingsRes, reqRes] = await Promise.all([
                fetch('/api/business/settings'),
                fetch('/api/workers/requests')
            ])
            const settingsData = await settingsRes.json()
            const reqData = await reqRes.json()

            if (settingsData.settings) {
                const saved = settingsData.settings.send_delay_minutes
                setDelay(saved !== null && saved !== undefined ? saved : 60)
            }
            if (reqData.requests) setRequests(reqData.requests)
        } catch {
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
            body: JSON.stringify({ customerNumber: form.customerNumber, customerName: form.customerName, delayMinutes: delay })
        })

        const data = await res.json()
        if (data.error) { setError(data.error); setSending(false); return }

        setSuccess(true)
        setForm({ customerNumber: '', customerName: '' })
        setSending(false)

        const reqRes = await fetch('/api/workers/requests')
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
        <div style={centerStyle}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading page data...</p>
        </div>
    )

    return (
        <WorkerLayout>
            <style>{`
                .wsend-page { max-width: 1200px; margin: 0; padding: 2rem 3rem 4rem 3rem; box-sizing: border-box; }
                .wsend-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.03em; margin-bottom: 0.2rem; }
                .wsend-sub { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 2rem; }
                .wsend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
                .wsend-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-sizing: border-box; box-shadow: var(--shadow-sm); }
                .wsend-card:hover { box-shadow: var(--shadow-md); }
                .wsend-card-title { font-size: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem; }
                .wsend-card-sub { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem; }
                
                .wsend-input {
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
                .wsend-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
                }

                .wsend-btn {
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
                .wsend-btn:hover { background: #1e293b; }
                .wsend-btn:disabled { background: var(--text-light); cursor: not-allowed; }

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
                    width: 28px; height: 28px; border-radius: 50%;
                    background: #128c7e; color: #fff; font-size: 0.7rem;
                    font-weight: 700; display: flex; align-items: center; justify-content: center;
                }
                .wa-chat-body {
                    background: #efeae2;
                    background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0);
                    background-size: 16px 16px;
                    padding: 1rem; min-height: 160px;
                    display: flex; flex-direction: column; justify-content: flex-end;
                }
                .wa-bubble {
                    align-self: flex-start; background: #ffffff; color: #111111;
                    padding: 0.625rem 0.875rem; border-radius: 0 8px 8px 8px;
                    max-width: 85%; font-size: 0.8rem; line-height: 1.5;
                    box-shadow: 0 1px 1.5px rgba(0,0,0,0.12);
                    white-space: pre-wrap; position: relative;
                }
                .wa-time-check {
                    display: flex; align-items: center; justify-content: flex-end;
                    gap: 2px; font-size: 0.6rem; color: #888; margin-top: 0.25rem;
                }

                .status-msg {
                    padding: 0.875rem 1rem; border-radius: var(--radius-md);
                    margin-bottom: 1.25rem; font-size: 0.875rem; font-weight: 500;
                    display: flex; align-items: center; gap: 0.5rem;
                    animation: slideDown 0.15s ease-out;
                }
                @keyframes slideDown {
                    from { transform: translateY(-8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 767px) {
                    .wsend-grid { grid-template-columns: 1fr; gap: 1rem; }
                    .wsend-page { padding: 1.25rem 1rem; }
                }
            `}</style>
            <WorkerSidebar worker={worker} business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div className="wsend-page">
                    <h1 className="wsend-title">Send Request</h1>
                    <p className="wsend-sub">
                        Send a customer a rating request {delay === 0 ? 'instantly' : `scheduled for ${delayLabel(delay)} delay`}
                    </p>

                    <div className="wsend-grid">

                        {/* Form */}
                        <div className="wsend-card">
                            <h2 className="wsend-card-title">New feedback request</h2>
                            <p className="wsend-card-sub">Queue a feedback request to a customer's WhatsApp line</p>

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
                                        className="wsend-input"
                                    />
                                </div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>Customer name (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sipho"
                                        value={form.customerName}
                                        onChange={e => setForm({ ...form, customerName: e.target.value })}
                                        className="wsend-input"
                                    />
                                </div>

                                {/* WhatsApp preview */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>WhatsApp preview</label>
                                    <div className="wa-mockup">
                                        <div className="wa-header">
                                            <div className="wa-avatar">
                                                {business?.name ? business.name.slice(0, 1).toUpperCase() : 'R'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: '600', lineHeight: 1.1 }}>{business?.name || 'Business'}</div>
                                                <div style={{ fontSize: '0.58rem', opacity: 0.8 }}>online</div>
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

                                <button type="submit" disabled={sending || !form.customerNumber} className="wsend-btn">
                                    {sending ? 'Sending...' : 'Send WhatsApp Request'}
                                </button>
                            </form>

                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.5rem 0.75rem', background: '#f8fafc',
                                border: '1px solid var(--border-color)', borderRadius: '8px',
                                fontSize: '0.78rem', color: 'var(--text-muted)'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Configured delay: <strong>{delayLabel(delay)}</strong></span>
                            </div>
                        </div>

                        {/* Recent requests */}
                        <div className="wsend-card">
                            <h2 className="wsend-card-title">My Recent Requests</h2>
                            <p className="wsend-card-sub">{requests.length} request{requests.length !== 1 ? 's' : ''} sent by you</p>

                            {requests.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', padding: '1rem 0', textAlign: 'center' }}>No requests dispatched yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {requests.slice(0, 10).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        </WorkerLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }
const mainStyle = { width: '100%', minWidth: 0 }
const labelStyle = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }
