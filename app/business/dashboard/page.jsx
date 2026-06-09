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
        if (n >= 3) return '#d97706'
        return '#dc2626'
    }

    const TrendBadge = ({ pct }) => {
        if (pct === null) return null
        const up = pct >= 0
        return (
            <span style={{
                fontSize: '0.68rem', fontWeight: '600',
                color: up ? '#16a34a' : '#dc2626',
                background: up ? '#f0fdf4' : '#fef2f2',
                padding: '0.15rem 0.4rem',
                borderRadius: '100px',
                marginLeft: '0.4rem',
                letterSpacing: '0.01em'
            }}>
                {up ? '↑' : '↓'}{Math.abs(pct)}%
            </span>
        )
    }

    const statusColors = { pending: '#d97706', sent: '#3b82f6', reviewed: '#10b981' }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.875rem' }}>Loading...</p>
        </div>
    )

    const p = isMobile ? '1.25rem 1rem' : '2rem 1.5rem'

    return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: p }}>

                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{
                            fontSize: isMobile ? '1.25rem' : '1.4rem',
                            fontWeight: '700',
                            color: '#111',
                            letterSpacing: '-0.02em',
                            marginBottom: '0.2rem'
                        }}>
                            Overview
                        </h1>
                        <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '0.875rem' }}>
                            {business?.name ? `${business.name}` : 'Welcome back'}
                        </p>

                        {/* Period filter */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {PERIODS.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => { setPeriod(p.value); setVisibleReviews(5) }}
                                    style={{
                                        padding: isMobile ? '0.35rem 0.7rem' : '0.4rem 0.875rem',
                                        borderRadius: '100px',
                                        fontSize: isMobile ? '0.78rem' : '0.8rem',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                        background: period === p.value ? '#111' : 'transparent',
                                        color: period === p.value ? '#fff' : '#888',
                                        border: period === p.value ? '1px solid #111' : '1px solid #e5e5e5'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats — 2x2 grid always */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.625rem',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: isMobile ? '0.875rem' : '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Reviews</div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <span style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '700', color: '#16a34a', letterSpacing: '-0.03em' }}>
                                    {periodReviews.length}
                                </span>
                                <TrendBadge pct={reviewTrend} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.2rem' }}>
                                {periodReviews.filter(r => r.rating >= 4).length} positive
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: isMobile ? '0.875rem' : '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Avg rating</div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <span style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '700', color: '#d97706', letterSpacing: '-0.03em' }}>
                                    {currentAvg ?? '—'}
                                </span>
                                {currentAvg && <span style={{ fontSize: '0.8rem', color: '#d97706', marginLeft: '2px' }}>★</span>}
                                <TrendBadge pct={ratingTrend} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.2rem' }}>out of 5.0</div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: isMobile ? '0.875rem' : '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Requests</div>
                            <div style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '700', color: '#111', letterSpacing: '-0.03em' }}>
                                {periodRequests.length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.2rem' }}>
                                {periodRequests.filter(r => r.status === 'pending').length} pending
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: isMobile ? '0.875rem' : '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Response</div>
                            <div style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '700', color: '#111', letterSpacing: '-0.03em' }}>
                                {responseRate}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.2rem' }}>response rate</div>
                        </div>
                    </div>

                    {/* Category health */}
                    {categoryAnalytics.length > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111' }}>Category health</h2>
                                <a href="/business/reviews" style={{ fontSize: '0.78rem', color: '#aaa', textDecoration: 'none' }}>Full breakdown →</a>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '1rem' }}>Average per category</p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '0.625rem'
                            }}>
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div key={category} style={{
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        border: '1px solid #f3f4f6'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.78rem', color: '#333', fontWeight: '500' }}>{category}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: getColor(avg) }}>{avg}</span>
                                        </div>
                                        <div style={{ height: '5px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '5px', borderRadius: '3px',
                                                width: `${(parseFloat(avg) / 5) * 100}%`,
                                                background: getColor(avg),
                                                transition: 'width 0.4s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '0.67rem', color: '#bbb', marginTop: '0.3rem' }}>
                                            {count} review{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom section — stacks on mobile */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: '1rem',
                        alignItems: 'start'
                    }}>

                        {/* Recent reviews */}
                        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111' }}>
                                    Recent reviews{' '}
                                    <span style={{ fontSize: '0.75rem', color: '#ccc', fontWeight: '400' }}>
                                        {periodReviews.length}
                                    </span>
                                </h2>
                                <a href="/business/reviews" style={{ fontSize: '0.78rem', color: '#aaa', textDecoration: 'none' }}>View all →</a>
                            </div>

                            {periodReviews.length === 0 ? (
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                        No reviews yet for this period
                                    </p>
                                    <a href="/business/send" style={{ color: '#16a34a', fontSize: '0.825rem', textDecoration: 'none' }}>
                                        Send a request →
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {periodReviews.slice(0, visibleReviews).map(r => (
                                        <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111' }}>
                                                    {r.customer_name || 'Anonymous'}
                                                </span>
                                                <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                                                    {'★'.repeat(r.rating)}
                                                    <span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - r.rating)}</span>
                                                </span>
                                            </div>
                                            {r.category_ratings && (
                                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '3px' }}>
                                                    {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                        <span key={cat} style={{
                                                            fontSize: '0.67rem', padding: '0.1rem 0.4rem',
                                                            borderRadius: '100px',
                                                            background: val <= 2 ? '#fef2f2' : val === 3 ? '#fffbeb' : '#f0fdf4',
                                                            color: val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a',
                                                            border: `1px solid ${val <= 2 ? '#fecaca' : val === 3 ? '#fde68a' : '#bbf7d0'}`
                                                        }}>
                                                            {cat}: {val}/5
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {r.feedback && (
                                                <p style={{ fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.feedback}
                                                </p>
                                            )}
                                            {!r.feedback && r.is_public && (
                                                <p style={{ fontSize: '0.72rem', color: '#16a34a' }}>Sent to Google ✓</p>
                                            )}
                                            <p style={{ fontSize: '0.68rem', color: '#ccc', marginTop: '3px' }}>
                                                {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                            </p>
                                        </div>
                                    ))}

                                    {visibleReviews < periodReviews.length && (
                                        <button
                                            onClick={() => setVisibleReviews(v => v + 5)}
                                            style={{
                                                width: '100%', padding: '0.625rem',
                                                marginTop: '0.75rem', borderRadius: '8px',
                                                border: '1px solid #ebebeb', background: '#f9fafb',
                                                color: '#666', fontSize: '0.825rem',
                                                cursor: 'pointer', fontFamily: 'inherit'
                                            }}
                                        >
                                            Load more ({periodReviews.length - visibleReviews} left)
                                        </button>
                                    )}
                                    {visibleReviews > 5 && (
                                        <button
                                            onClick={() => setVisibleReviews(5)}
                                            style={{
                                                width: '100%', padding: '0.5rem', marginTop: '0.25rem',
                                                borderRadius: '8px', border: 'none', background: 'transparent',
                                                color: '#ccc', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit'
                                            }}
                                        >
                                            Show less
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Recent requests */}
                            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111' }}>Recent requests</h2>
                                    <a href="/business/send" style={{ fontSize: '0.78rem', color: '#aaa', textDecoration: 'none' }}>Send new →</a>
                                </div>
                                {periodRequests.length === 0 ? (
                                    <p style={{ fontSize: '0.825rem', color: '#ccc' }}>No requests this period</p>
                                ) : (
                                    periodRequests.slice(0, 5).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f5f5f5' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.customer_name || r.customer_number}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: '#ccc', marginTop: '1px' }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA')}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: '600',
                                                color: statusColors[r.status],
                                                textTransform: 'capitalize', flexShrink: 0
                                            }}>
                                                {r.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Quick actions */}
                            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.25rem' }}>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111', marginBottom: '0.875rem' }}>Quick actions</h2>
                                {[
                                    { href: '/business/send', label: 'Send feedback request' },
                                    { href: '/business/reviews', label: 'View all reviews' },
                                    { href: '/business/settings', label: 'Update settings' },
                                ].map(action => (
                                    <a
                                        key={action.href}
                                        href={action.href}
                                        style={{
                                            display: 'block', padding: '0.6rem 0.875rem',
                                            borderRadius: '8px', background: '#f9fafb',
                                            border: '1px solid #ebebeb', color: '#333',
                                            fontSize: '0.85rem', textDecoration: 'none',
                                            marginBottom: '0.4rem', transition: 'background 0.15s'
                                        }}
                                    >
                                        {action.label}
                                    </a>
                                ))}

                                {/* Feedback link */}
                                <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #ebebeb' }}>
                                    <p style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Your feedback link
                                    </p>
                                    <p style={{ fontSize: '0.78rem', fontWeight: '500', color: '#555', wordBreak: 'break-all', lineHeight: '1.4' }}>
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