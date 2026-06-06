'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/business/Sidebar'

export default function DashboardPage() {
    const router = useRouter()
    const [business, setBusiness] = useState(null)
    const [requests, setRequests] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadDashboard() }, [])

    async function loadDashboard() {
        try {
            const [bizRes, reqRes, revRes] = await Promise.all([
                fetch('/api/business/me'),
                fetch('/api/requests'),
                fetch('/api/reviews')
            ])

            const bizData = await bizRes.json()
            const reqData = await reqRes.json()
            const revData = await revRes.json()

            if (!bizData.business) {
                router.push('/business/login')
                return
            }

            setBusiness(bizData.business)
            if (reqData.requests) setRequests(reqData.requests)
            if (revData.reviews) setReviews(revData.reviews)

        } catch (err) {
            router.push('/business/login')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Loading...</p>
        </div>
    )

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null

    const responseRate = requests.length
        ? Math.round((reviews.length / requests.length) * 100)
        : 0

    const pending = requests.filter(r => r.status === 'pending').length
    const sent = requests.filter(r => r.status === 'sent').length
    const reviewed = requests.filter(r => r.status === 'reviewed').length

    const statusColors = {
        pending: '#f59e0b',
        sent: '#3b82f6',
        reviewed: '#10b981'
    }

    const positiveReviews = reviews.filter(r => r.rating >= 4).length
    const negativeReviews = reviews.filter(r => r.rating < 4).length

    return (
        <div style={layoutStyle}>
            <Sidebar business={business} />
            <div style={mainStyle}>
                <div style={pageStyle}>

                    <h1 style={pageTitleStyle}>Overview</h1>
                    <p style={pageSubStyle}>
                        Welcome back — here is how things are looking
                    </p>

                    {/* Stats */}
                    <div style={statsGridStyle}>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Total requests</div>
                            <div style={statValStyle}>{requests.length}</div>
                            <div style={statSubStyle}>
                                {pending} pending · {sent} sent · {reviewed} reviewed
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Reviews received</div>
                            <div style={{ ...statValStyle, color: '#16a34a' }}>
                                {reviews.length}
                            </div>
                            <div style={statSubStyle}>
                                {positiveReviews} positive · {negativeReviews} negative
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Average rating</div>
                            <div style={{ ...statValStyle, color: '#f59e0b' }}>
                                {avgRating ? `${avgRating} ★` : '—'}
                            </div>
                            <div style={statSubStyle}>
                                out of 5.0
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Response rate</div>
                            <div style={statValStyle}>{responseRate}%</div>
                            <div style={statSubStyle}>
                                of requests reviewed
                            </div>
                        </div>
                    </div>

                    <div style={gridStyle}>

                        {/* Recent reviews */}
                        <div style={cardStyle}>
                            <div style={cardHeaderStyle}>
                                <h2 style={cardTitleStyle}>Recent reviews</h2>
                                <a href="/business/reviews" style={viewAllStyle}>
                                    View all →
                                </a>
                            </div>

                            {reviews.length === 0 ? (
                                <div style={emptyStyle}>
                                    <p style={{ marginBottom: '0.5rem' }}>No reviews yet</p>
                                    <a href="/business/send" style={linkStyle}>
                                        Send your first request →
                                    </a>
                                </div>
                            ) : (
                                reviews.slice(0, 5).map(r => (
                                    <div key={r.id} style={reviewRowStyle}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                                {r.customer_name || 'Anonymous'}
                                            </span>
                                            <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                                                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                            </span>
                                        </div>
                                        {r.feedback && (
                                            <p style={{
                                                fontSize: '0.8rem',
                                                color: '#666',
                                                lineHeight: '1.5',
                                                marginBottom: '4px'
                                            }}>
                                                {r.feedback}
                                            </p>
                                        )}
                                        {!r.feedback && r.is_public && (
                                            <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                                                Sent to Google ✓
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.7rem', color: '#bbb' }}>
                                            {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right column */}
                        <div>

                            {/* Recent requests */}
                            <div style={{ ...cardStyle, marginBottom: '1rem' }}>
                                <div style={cardHeaderStyle}>
                                    <h2 style={cardTitleStyle}>Recent requests</h2>
                                    <a href="/business/send" style={viewAllStyle}>
                                        Send new →
                                    </a>
                                </div>

                                {requests.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                        No requests yet
                                    </p>
                                ) : (
                                    requests.slice(0, 6).map(r => (
                                        <div key={r.id} style={rowStyle}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                                    {r.customer_name || r.customer_number}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA')}
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

                            {/* Quick actions */}
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Quick actions</h2>
                                <a href="/business/send" style={actionBtnStyle}>
                                    Send feedback request
                                </a>
                                <a href="/business/reviews" style={actionBtnStyle}>
                                    View all reviews
                                </a>
                                <a href="/business/settings" style={actionBtnStyle}>
                                    Update settings
                                </a>
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.875rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5'
                                }}>
                                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>
                                        Your feedback link
                                    </p>
                                    <p style={{ fontSize: '0.8rem', fontWeight: '500', color: '#111' }}>
                                        repuvault.co.za/feedback/{business?.slug}
                                    </p>
                                </div>
                            </div>

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

const layoutStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: '#fafafa'
}

const mainStyle = {
    marginLeft: '220px',
    flex: 1,
    overflow: 'auto'
}

const pageStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1.5rem'
}

const pageTitleStyle = {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#111',
    marginBottom: '0.25rem'
}

const pageSubStyle = {
    color: '#888',
    fontSize: '0.875rem',
    marginBottom: '1.5rem'
}

const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.5rem'
}

const statCardStyle = {
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
    color: '#111',
    marginBottom: '0.25rem'
}

const statSubStyle = {
    fontSize: '0.7rem',
    color: '#aaa'
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

const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
}

const cardTitleStyle = {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#111'
}

const viewAllStyle = {
    fontSize: '0.8rem',
    color: '#888',
    textDecoration: 'none'
}

const reviewRowStyle = {
    padding: '0.75rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.625rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const emptyStyle = {
    fontSize: '0.85rem',
    color: '#aaa',
    padding: '0.5rem 0'
}

const linkStyle = {
    color: '#16a34a',
    fontSize: '0.85rem',
    textDecoration: 'none'
}

const actionBtnStyle = {
    display: 'block',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    background: '#f9fafb',
    border: '1px solid #e5e5e5',
    color: '#111',
    fontSize: '0.875rem',
    textDecoration: 'none',
    marginBottom: '0.5rem',
    textAlign: 'center'
}