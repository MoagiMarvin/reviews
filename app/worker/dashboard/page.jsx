'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WorkerSidebar from '@/components/worker/WorkerSidebar'
import WorkerLayout from '@/components/worker/WorkerLayout'

export default function WorkerDashboardPage() {
    const router = useRouter()
    const [worker, setWorker] = useState(null)
    const [business, setBusiness] = useState(null)
    const [reviews, setReviews] = useState([])
    const [requests, setRequests] = useState([])
    const [ratingsAllowed, setRatingsAllowed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [visibleReviews, setVisibleReviews] = useState(5)

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

            const [revRes, reqRes] = await Promise.all([
                fetch('/api/workers/reviews'),
                fetch('/api/workers/requests')
            ])
            const revData = await revRes.json()
            const reqData = await reqRes.json()

            if (revData.allowed !== undefined) setRatingsAllowed(revData.allowed)
            if (revData.reviews) setReviews(revData.reviews)
            if (reqData.requests) setRequests(reqData.requests)
        } catch {
            router.push('/business/login')
        } finally {
            setLoading(false)
        }
    }

    const avg = (list) => list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null
    const currentAvg = avg(reviews)
    const positiveCount = reviews.filter(r => r.rating >= 4).length
    const sentCount = requests.length
    const reviewedCount = requests.filter(r => r.status === 'reviewed').length

    const getCategoryAnalytics = (list) => {
        const catMap = {}
        list.forEach(r => {
            if (r.category_ratings && typeof r.category_ratings === 'object') {
                Object.entries(r.category_ratings).forEach(([cat, val]) => {
                    if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 }
                    catMap[cat].total += val
                    catMap[cat].count += 1
                })
            }
        })
        return Object.entries(catMap).map(([cat, data]) => ({
            category: cat,
            avg: (data.total / data.count).toFixed(1),
            count: data.count
        })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))
    }

    const categoryAnalytics = getCategoryAnalytics(reviews)

    const getColor = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '#16a34a'
        if (n >= 3) return '#d97706'
        return '#dc2626'
    }

    const statusColors = { pending: '#d97706', sent: '#3b82f6', reviewed: '#16a34a' }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading your dashboard...</p>
        </div>
    )

    return (
        <WorkerLayout>
            <style>{`
                .wdash-page { max-width: 1200px; margin: 0; padding: 2rem 3rem 4rem 3rem; box-sizing: border-box; }
                .wdash-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.03em; margin-bottom: 0.2rem; }
                .wdash-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
                .wdash-stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; min-width: 0; box-sizing: border-box; box-shadow: var(--shadow-sm); transition: all 0.2s ease; }
                .wdash-stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
                .wdash-stat-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
                .wdash-stat-num { font-size: 2.25rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.04em; }
                .wdash-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; min-width: 0; box-sizing: border-box; overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s ease; }
                .wdash-card:hover { box-shadow: var(--shadow-md); }
                .wdash-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
                .wdash-bottom { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; align-items: start; }
                .wdash-review-row { padding: 1rem 0; border-bottom: 1px solid var(--border-color); min-width: 0; overflow: hidden; }
                .wdash-review-row:last-child { border-bottom: none; }

                @media (max-width: 900px) {
                    .wdash-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 767px) {
                    .wdash-page { padding: 1.25rem 1rem; }
                    .wdash-title { font-size: 1.25rem; }
                    .wdash-stats { gap: 0.625rem; }
                    .wdash-stat-num { font-size: 1.75rem; }
                    .wdash-cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .wdash-bottom { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
                }
            `}</style>
            <WorkerSidebar worker={worker} business={business} />
            <div style={{ width: '100%', minWidth: 0 }} className="main-with-sidebar">
                <div className="wdash-page">

                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 className="wdash-title">My Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            Welcome back, <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{worker?.display_name || 'Staff'}</span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontWeight: '600' }}>Staff</span>
                        </p>
                    </div>

                    {/* Stats Row */}
                    <div className="wdash-stats">
                        <div className="wdash-stat-card">
                            <div className="wdash-stat-label">Requests Sent</div>
                            <div className="wdash-stat-num" style={{ color: '#3b82f6' }}>
                                {sentCount}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Total requests you've sent
                            </div>
                        </div>

                        {ratingsAllowed && (
                            <>
                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">My Reviews</div>
                                    <div className="wdash-stat-num" style={{ color: 'var(--primary)' }}>
                                        {reviews.length}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        <strong>{positiveCount}</strong> positive (4-5★)
                                    </div>
                                </div>

                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">Avg Rating</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span className="wdash-stat-num" style={{ color: '#d97706' }}>
                                            {currentAvg ?? '—'}
                                        </span>
                                        {currentAvg && <span style={{ fontSize: '1rem', color: '#f59e0b', marginLeft: '3px' }}>★</span>}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        Out of 5.0 maximum
                                    </div>
                                </div>

                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">Conversion</div>
                                    <div className="wdash-stat-num">
                                        {sentCount > 0 ? Math.round((reviews.length / sentCount) * 100) : 0}%
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        Request-to-review rate
                                    </div>
                                </div>
                            </>
                        )}

                        {!ratingsAllowed && (
                            <>
                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">Pending</div>
                                    <div className="wdash-stat-num" style={{ color: '#d97706' }}>
                                        {requests.filter(r => r.status === 'pending').length}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        Awaiting delivery
                                    </div>
                                </div>

                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">Delivered</div>
                                    <div className="wdash-stat-num" style={{ color: '#16a34a' }}>
                                        {requests.filter(r => r.status === 'sent' || r.status === 'reviewed').length}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        Successfully sent
                                    </div>
                                </div>

                                <div className="wdash-stat-card">
                                    <div className="wdash-stat-label">Reviewed</div>
                                    <div className="wdash-stat-num" style={{ color: 'var(--primary)' }}>
                                        {reviewedCount}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                        Customers responded
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Category health - only if ratings allowed */}
                    {ratingsAllowed && categoryAnalytics.length > 0 && (
                        <div className="wdash-card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>My Category Scores</h2>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>How customers rated you across different categories</p>
                            </div>
                            <div className="wdash-cat-grid">
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div key={category} style={{
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        padding: '0.875rem',
                                        border: '1px solid var(--border-color)',
                                        minWidth: 0,
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: '500', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category}</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: getColor(avg), flexShrink: 0, marginLeft: '0.25rem' }}>{avg}</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '6px', borderRadius: '3px',
                                                width: `${(parseFloat(avg) / 5) * 100}%`,
                                                background: getColor(avg),
                                                transition: 'width 0.4s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                            {count} review{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom section */}
                    <div className="wdash-bottom">

                        {/* Reviews or requests list */}
                        {ratingsAllowed ? (
                            <div className="wdash-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                                        My Reviews{' '}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.25rem' }}>
                                            ({reviews.length})
                                        </span>
                                    </h2>
                                </div>

                                {reviews.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                            No reviews linked to you yet
                                        </p>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                            Reviews will appear here when customers you served submit feedback
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {reviews.slice(0, visibleReviews).map(r => (
                                            <div key={r.id} className="wdash-review-row">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {r.customer_name || 'Anonymous customer'}
                                                    </span>
                                                    <span style={{ color: '#f59e0b', fontSize: '0.85rem', flexShrink: 0, letterSpacing: '1px' }}>
                                                        {'★'.repeat(r.rating)}
                                                        <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - r.rating)}</span>
                                                    </span>
                                                </div>
                                                {r.category_ratings && (
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                                                        {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                            <span key={cat} style={{
                                                                fontSize: '0.67rem', padding: '0.15rem 0.45rem',
                                                                borderRadius: '4px',
                                                                background: val <= 2 ? '#fef2f2' : val === 3 ? '#fffbeb' : '#f0fdf4',
                                                                color: val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a',
                                                                border: `1px solid ${val <= 2 ? '#fecaca' : val === 3 ? '#fde68a' : '#bbf7d0'}`,
                                                                fontWeight: '500'
                                                            }}>
                                                                {cat}: {val}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {r.feedback && (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0', lineHeight: '1.5' }}>
                                                        "{r.feedback}"
                                                    </p>
                                                )}
                                                <p style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '0.35rem', margin: 0 }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        ))}

                                        {visibleReviews < reviews.length && (
                                            <button
                                                onClick={() => setVisibleReviews(v => v + 5)}
                                                style={{
                                                    width: '100%', padding: '0.625rem',
                                                    marginTop: '1rem', borderRadius: '8px',
                                                    border: '1px solid var(--border-hover)', background: '#f8fafc',
                                                    color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '600',
                                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                                                }}
                                            >
                                                Load more ({reviews.length - visibleReviews} remaining)
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="wdash-card">
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 1.25rem 0' }}>
                                    My Recent Requests
                                </h2>
                                {requests.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No requests sent yet</p>
                                        <a href="/worker/send" style={{ color: 'var(--primary)', fontSize: '0.825rem', fontWeight: '600', textDecoration: 'none' }}>
                                            Send first request →
                                        </a>
                                    </div>
                                ) : (
                                    requests.slice(0, 10).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.customer_name || r.customer_number}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: statusColors[r.status], textTransform: 'capitalize', flexShrink: 0 }}>
                                                {r.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Right column — Quick actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

                            {/* Recent requests summary */}
                            <div className="wdash-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Recent Requests</h2>
                                    <a href="/worker/send" style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'none', flexShrink: 0 }}>Send New →</a>
                                </div>
                                {requests.length === 0 ? (
                                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>No requests sent yet</p>
                                ) : (
                                    requests.slice(0, 5).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.customer_name || r.customer_number}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: statusColors[r.status], textTransform: 'capitalize', flexShrink: 0 }}>
                                                {r.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Quick actions */}
                            <div className="wdash-card">
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1rem', margin: 0 }}>Quick Actions</h2>
                                <a href="/worker/send" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', borderRadius: '8px', background: '#f8fafc',
                                    border: '1px solid var(--border-color)', color: 'var(--text-main)',
                                    fontSize: '0.85rem', fontWeight: '500', textDecoration: 'none',
                                    marginTop: '0.75rem', transition: 'all 0.15s ease'
                                }}>
                                    <span>Send feedback request</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </a>
                                <a href="/worker/change-password" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', borderRadius: '8px', background: '#f8fafc',
                                    border: '1px solid var(--border-color)', color: 'var(--text-main)',
                                    fontSize: '0.85rem', fontWeight: '500', textDecoration: 'none',
                                    marginTop: '0.5rem', transition: 'all 0.15s ease'
                                }}>
                                    <span>Change password</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </a>
                            </div>

                            {/* Info about ratings */}
                            {!ratingsAllowed && (
                                <div className="wdash-card" style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        <div>
                                            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                                                Review ratings are managed by the business owner. Contact your manager for feedback on your performance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </WorkerLayout>
    )
}
