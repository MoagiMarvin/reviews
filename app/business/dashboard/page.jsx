'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

const PERIODS = [
    { label: 'This week', value: 7 },
    { label: 'This month', value: 30 },
    { label: '3 months', value: 90 },
    { label: 'All time', value: 99999 }
]

export default function DashboardPage() {
    const router = useRouter()
    const [business, setBusiness] = useState(null)
    const [requests, setRequests] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState(30)
    const [visibleReviews, setVisibleReviews] = useState(5)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

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
            if (!bizData.business) { router.push('/business/login'); return }
            setBusiness(bizData.business)
            if (reqData.requests) setRequests(reqData.requests)
            if (revData.reviews) setReviews(revData.reviews)
        } catch (err) {
            router.push('/business/login')
        } finally {
            setLoading(false)
        }
    }

    const filterByPeriod = (items, days) => {
        if (days === 99999) return items
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        return items.filter(i => new Date(i.created_at) >= cutoff)
    }

    const filterPrevPeriod = (items, days) => {
        if (days === 99999) return []
        const now = Date.now()
        const start = new Date(now - days * 2 * 24 * 60 * 60 * 1000)
        const end = new Date(now - days * 24 * 60 * 60 * 1000)
        return items.filter(i => { const d = new Date(i.created_at); return d >= start && d < end })
    }

    const periodReviews = filterByPeriod(reviews, period)
    const prevReviews = filterPrevPeriod(reviews, period)
    const periodRequests = filterByPeriod(requests, period)

    const avg = (list) => list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null
    const currentAvg = avg(periodReviews)
    const prevAvg = avg(prevReviews)

    const trendPct = (curr, prev) => {
        if (!prev || prev === 0) return null
        return Math.round(((curr - prev) / prev) * 100)
    }

    const reviewTrend = trendPct(periodReviews.length, prevReviews.length)
    const ratingTrend = currentAvg && prevAvg ? trendPct(parseFloat(currentAvg), parseFloat(prevAvg)) : null
    const responseRate = periodRequests.length ? Math.round((periodReviews.length / periodRequests.length) * 100) : 0

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
        })).sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg))
    }

    const categoryAnalytics = getCategoryAnalytics(periodReviews)

    const getColor = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '#16a34a'
        if (n >= 3) return '#f59e0b'
        return '#dc2626'
    }

    const getIcon = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '🟢'
        if (n >= 3) return '🟡'
        return '🔴'
    }

    const TrendBadge = ({ pct }) => {
        if (pct === null) return null
        const up = pct >= 0
        return (
            <span style={{
                fontSize: '0.7rem', fontWeight: '600',
                color: up ? '#16a34a' : '#dc2626',
                background: up ? '#f0fdf4' : '#fef2f2',
                padding: '0.15rem 0.5rem', borderRadius: '100px', marginLeft: '0.5rem'
            }}>
                {up ? '↑' : '↓'} {Math.abs(pct)}%
            </span>
        )
    }

    const statusColors = { pending: '#f59e0b', sent: '#3b82f6', reviewed: '#10b981' }

    if (loading) return <div style={centerStyle}><p style={{ color: '#888' }}>Loading...</p></div>

    return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={mainStyle}>
                <div style={pageStyle}>

                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={pageTitleStyle}>Overview</h1>
                        <p style={pageSubStyle}>Welcome back</p>
                        <div style={periodRowStyle}>
                            {PERIODS.map(p => (
                                <button key={p.value} onClick={() => { setPeriod(p.value); setVisibleReviews(5) }}
                                    style={{
                                        ...periodBtnStyle,
                                        background: period === p.value ? '#111' : 'transparent',
                                        color: period === p.value ? '#fff' : '#888',
                                        border: period === p.value ? '1px solid #111' : '1px solid #e5e5e5'
                                    }}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={statsGridStyle}>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Reviews</div>
                            <div style={statValRowStyle}>
                                <span style={{ ...statValStyle, color: '#16a34a' }}>{periodReviews.length}</span>
                                <TrendBadge pct={reviewTrend} />
                            </div>
                            <div style={statSubStyle}>{periodReviews.filter(r => r.rating >= 4).length} positive</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Avg rating</div>
                            <div style={statValRowStyle}>
                                <span style={{ ...statValStyle, color: '#f59e0b' }}>{currentAvg ? `${currentAvg} ★` : '—'}</span>
                                <TrendBadge pct={ratingTrend} />
                            </div>
                            <div style={statSubStyle}>out of 5.0</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Requests</div>
                            <div style={statValRowStyle}><span style={statValStyle}>{periodRequests.length}</span></div>
                            <div style={statSubStyle}>{periodRequests.filter(r => r.status === 'pending').length} pending</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Response</div>
                            <div style={statValRowStyle}><span style={statValStyle}>{responseRate}%</span></div>
                            <div style={statSubStyle}>response rate</div>
                        </div>
                    </div>

                    {/* Category health */}
                    {categoryAnalytics.length > 0 && (
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <h2 style={cardTitleStyle}>Category health</h2>
                                <a href="/business/reviews" style={viewAllStyle}>Full breakdown →</a>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Average per category</p>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div key={category} style={{ background: '#f9fafb', borderRadius: '8px', padding: '0.875rem', border: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#333', fontWeight: '500' }}>{getIcon(avg)} {category}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: getColor(avg) }}>{avg}</span>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', height: '6px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '6px', borderRadius: '3px', width: `${(parseFloat(avg) / 5) * 100}%`, background: getColor(avg) }} />
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.3rem' }}>{count} review{count !== 1 ? 's' : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Single column on mobile, two on desktop */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', alignItems: 'start', marginTop: '1rem' }}>

                        {/* Recent reviews */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={cardTitleStyle}>Recent reviews <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: '400' }}>{periodReviews.length} total</span></h2>
                                <a href="/business/reviews" style={viewAllStyle}>View all →</a>
                            </div>
                            {periodReviews.length === 0 ? (
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>No reviews in this period</p>
                                    <a href="/business/send" style={{ color: '#16a34a', fontSize: '0.85rem', textDecoration: 'none' }}>Send a request →</a>
                                </div>
                            ) : (
                                <>
                                    {periodReviews.slice(0, visibleReviews).map(r => (
                                        <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>{r.customer_name || 'Anonymous'}</span>
                                                <span style={{ color: '#F5A623', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}<span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - r.rating)}</span></span>
                                            </div>
                                            {r.category_ratings && (
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                    {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                        <span key={cat} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: val <= 2 ? '#fef2f2' : val === 3 ? '#fffbeb' : '#f0fdf4', color: val <= 2 ? '#dc2626' : val === 3 ? '#f59e0b' : '#16a34a', border: `1px solid ${val <= 2 ? '#fecaca' : val === 3 ? '#fde68a' : '#bbf7d0'}` }}>
                                                            {cat}: {val}/5
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {r.feedback && <p style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.feedback}</p>}
                                            {!r.feedback && r.is_public && <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>Sent to Google ✓</p>}
                                            <p style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '4px' }}>{new Date(r.created_at).toLocaleDateString('en-ZA')}</p>
                                        </div>
                                    ))}
                                    {visibleReviews < periodReviews.length && (
                                        <button onClick={() => setVisibleReviews(v => v + 5)} style={loadMoreStyle}>
                                            Load more ({periodReviews.length - visibleReviews} remaining)
                                        </button>
                                    )}
                                    {visibleReviews > 5 && (
                                        <button onClick={() => setVisibleReviews(5)} style={showLessStyle}>Show less</button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Recent requests */}
                            <div style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={cardTitleStyle}>Recent requests</h2>
                                    <a href="/business/send" style={viewAllStyle}>Send new →</a>
                                </div>
                                {periodRequests.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: '#aaa' }}>No requests in this period</p>
                                ) : (
                                    periodRequests.slice(0, 5).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>{r.customer_name || r.customer_number}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>{new Date(r.created_at).toLocaleDateString('en-ZA')}</div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: statusColors[r.status], textTransform: 'capitalize' }}>{r.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Quick actions */}
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Quick actions</h2>
                                <a href="/business/send" style={actionBtnStyle}>Send feedback request</a>
                                <a href="/business/reviews" style={actionBtnStyle}>View all reviews</a>
                                <a href="/business/settings" style={actionBtnStyle}>Update settings</a>
                                <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Your feedback link</p>
                                    <p style={{ fontSize: '0.8rem', fontWeight: '500', color: '#111', wordBreak: 'break-all' }}>
                                        {process.env.NEXT_PUBLIC_APP_URL}/feedback/{business?.slug}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const mainStyle = { flex: 1, overflow: 'auto' }
const pageStyle = { maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }
const pageTitleStyle = { fontSize: '1.4rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }
const pageSubStyle = { color: '#888', fontSize: '0.875rem', marginBottom: '0.75rem' }
const periodRowStyle = { display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }
const periodBtnStyle = { padding: '0.4rem 0.875rem', borderRadius: '100px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }
const statCardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1rem' }
const statLabelStyle = { fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }
const statValRowStyle = { display: 'flex', alignItems: 'center', marginBottom: '0.2rem' }
const statValStyle = { fontSize: '1.6rem', fontWeight: '600', color: '#111' }
const statSubStyle = { fontSize: '0.7rem', color: '#aaa' }
const cardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem', marginBottom: '0' }
const cardTitleStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#111' }
const viewAllStyle = { fontSize: '0.8rem', color: '#888', textDecoration: 'none' }
const loadMoreStyle = { width: '100%', padding: '0.75rem', marginTop: '0.75rem', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#f9fafb', color: '#555', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }
const showLessStyle = { width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }
const actionBtnStyle = { display: 'block', padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#f9fafb', border: '1px solid #e5e5e5', color: '#111', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', textAlign: 'center' }