'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

const PERIODS = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: 'All time', value: 99999 }
]

export default function DashboardPage() {
    const router = useRouter()
    const [business, setBusiness] = useState(null)
    const [worker, setWorker] = useState(null)
    const [requests, setRequests] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState(30)
    const [visibleReviews, setVisibleReviews] = useState(5)
    const [copied, setCopied] = useState(false)

    useEffect(() => { loadDashboard() }, [])

    async function loadDashboard() {
        try {
            // 1. Check for owner session first
            const bizRes = await fetch('/api/business/me')
            const bizData = await bizRes.json()

            if (bizData.business) {
                setBusiness(bizData.business)
                const [reqRes, revRes] = await Promise.all([
                    fetch('/api/requests'),
                    fetch('/api/reviews')
                ])
                const reqData = await reqRes.json()
                const revData = await revRes.json()
                if (reqData.requests) setRequests(reqData.requests)
                if (revData.reviews) setReviews(revData.reviews)
                setLoading(false)
                return
            }

            // 2. Fall back to worker session check
            const workerRes = await fetch('/api/workers/me')
            const workerData = await workerRes.json()

            if (workerData.worker) {
                router.push('/worker/dashboard')
                return
            }

            // If neither is logged in, redirect to login
            router.push('/business/login')
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
        })).sort((a, b) => parseFloat(b.avg) - parseFloat(b.avg))
    }

    const categoryAnalytics = getCategoryAnalytics(periodReviews)

    const getColor = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '#16a34a'
        if (n >= 3) return '#d97706'
        return '#dc2626'
    }

    const getChartData = (reviewsList, daysCount) => {
        if (daysCount === 7) {
            const data = []
            for (let i = 6; i >= 0; i--) {
                const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                const label = d.toLocaleDateString('en-ZA', { weekday: 'short' })
                const key = d.toDateString()
                const count = reviewsList.filter(r => new Date(r.created_at).toDateString() === key).length
                data.push({ label, value: count })
            }
            return data
        } else if (daysCount === 30) {
            const data = []
            for (let i = 29; i >= 0; i--) {
                const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                const isLabel = i % 6 === 0
                const label = isLabel ? d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''
                const key = d.toDateString()
                const count = reviewsList.filter(r => new Date(r.created_at).toDateString() === key).length
                data.push({ label, value: count, tooltip: `${count} review(s) on ${d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` })
            }
            return data
        } else if (daysCount === 90) {
            const data = []
            for (let i = 9; i >= 0; i--) {
                const start = new Date(Date.now() - (i + 1) * 9 * 24 * 60 * 60 * 1000)
                const end = new Date(Date.now() - i * 9 * 24 * 60 * 60 * 1000)
                const label = `${end.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`
                const count = reviewsList.filter(r => {
                    const rd = new Date(r.created_at)
                    return rd >= start && rd < end
                }).length
                data.push({ label, value: count })
            }
            return data
        } else {
            const data = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' })
                const count = reviewsList.filter(r => {
                    const rd = new Date(r.created_at)
                    return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()
                }).length
                data.push({ label, value: count })
            }
            return data
        }
    }

    const chartData = getChartData(periodReviews, period)
    const maxChartValue = Math.max(...chartData.map(d => d.value), 1)

    const handleCopyLink = () => {
        if (typeof window === 'undefined') return
        const feedbackUrl = `${window.location.origin}/feedback/${business?.slug}`
        navigator.clipboard.writeText(feedbackUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const TrendBadge = ({ pct }) => {
        if (pct === null) return null
        const up = pct >= 0
        return (
            <span style={{
                fontSize: '0.68rem', fontWeight: '600',
                color: up ? '#16a34a' : '#dc2626',
                background: up ? '#f0fdf4' : '#fef2f2',
                padding: '0.2rem 0.5rem',
                borderRadius: '100px',
                marginLeft: '0.5rem',
                letterSpacing: '0.01em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                border: `1px solid ${up ? '#bbf7d0' : '#fecaca'}`
            }}>
                {up ? '↑' : '↓'}{Math.abs(pct)}%
            </span>
        )
    }

    const statusColors = { pending: '#d97706', sent: '#3b82f6', reviewed: '#16a34a' }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading dashboard...</p>
        </div>
    )

    return (
        <BusinessLayout>
            <style>{`
                .dash-page { max-width: 1200px; margin: 0; padding: 2rem 3rem 4rem 3rem; box-sizing: border-box; }
                .dash-title { font-size: 1.5rem; fontWeight: 700; color: var(--text-main); letter-spacing: -0.03em; margin-bottom: 0.2rem; }
                .period-container { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 1rem; }
                .dash-period-btn { padding: 0.4rem 0.875rem; font-size: 0.8rem; font-weight: 500; border-radius: 100px; cursor: pointer; transition: all 0.15s ease; }
                .dash-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
                .dash-stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; min-width: 0; box-sizing: border-box; box-shadow: var(--shadow-sm); transition: all 0.2s ease; }
                .dash-stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
                .dash-stat-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; }
                .dash-stat-num { font-size: 2.25rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.04em; }
                .dash-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
                .dash-bottom { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; align-items: start; }
                .dash-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; min-width: 0; box-sizing: border-box; overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s ease; }
                .dash-card:hover { box-shadow: var(--shadow-md); }
                .dash-review-row { padding: 1rem 0; border-bottom: 1px solid var(--border-color); min-width: 0; overflow: hidden; }
                .dash-review-row:last-child { border-bottom: none; }
                .dash-review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 0.5rem; }
                .dash-review-name { font-size: 0.875rem; font-weight: 600; color: var(--text-main); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .dash-review-stars { color: #f59e0b; font-size: 0.85rem; flex-shrink: 0; letter-spacing: 1px; }
                
                /* Chart Styling */
                .chart-container { display: flex; height: 160px; align-items: flex-end; justify-content: space-between; padding: 1rem 0.5rem 0.5rem 0.5rem; position: relative; border-bottom: 1px solid var(--border-hover); margin-bottom: 0.5rem; }
                .chart-bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; height: 100%; justify-content: flex-end; }
                .chart-bar { width: 50%; max-width: 24px; border-radius: 4px 4px 0 0; background: linear-gradient(to top, var(--primary), #10b981); transition: all 0.2s ease; cursor: pointer; }
                .chart-bar:hover { background: var(--primary-hover); transform: scaleX(1.05); }
                .chart-bar-label { font-size: 0.68rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 500; text-align: center; height: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
                .chart-tooltip { position: absolute; bottom: 105%; background: var(--text-main); color: #fff; padding: 4px 8px; font-size: 0.68rem; border-radius: 4px; opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease; transform: translateY(4px); white-space: nowrap; z-index: 10; box-shadow: var(--shadow-md); }
                .chart-bar-col:hover .chart-tooltip { opacity: 1; transform: translateY(-2px); }

                /* Action Tiles */
                .action-tile { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: #f8fafc; border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; font-weight: 500; text-decoration: none; margin-bottom: 0.5rem; transition: all 0.15s ease; }
                .action-tile:hover { background: #f1f5f9; border-color: var(--border-hover); transform: translateX(2px); }

                @media (max-width: 900px) {
                    .dash-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 767px) {
                    .dash-page { padding: 1.25rem 1rem; }
                    .dash-title { font-size: 1.25rem; }
                    .dash-stats { gap: 0.625rem; }
                    .dash-stat-num { font-size: 1.75rem; }
                    .dash-cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .dash-bottom { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
                    .chart-bar { width: 60%; }
                }
            `}</style>
            <Sidebar business={business} />
            <div style={{ width: '100%', minWidth: 0 }} className="main-with-sidebar">
                <div className="dash-page">

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <h1 className="dash-title">Overview</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                Welcome back, <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{business?.name || 'Partner'}</span>
                            </p>
                        </div>

                        {/* Period filter */}
                        <div className="period-container">
                            {PERIODS.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => { setPeriod(p.value); setVisibleReviews(5) }}
                                    className="dash-period-btn"
                                    style={{
                                        background: period === p.value ? 'var(--text-main)' : '#ffffff',
                                        color: period === p.value ? '#ffffff' : 'var(--text-muted)',
                                        border: period === p.value ? '1px solid var(--text-main)' : '1px solid var(--border-hover)'
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="dash-stats">
                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Reviews</div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <span className="dash-stat-num" style={{ color: 'var(--primary)' }}>
                                    {periodReviews.length}
                                </span>
                                <TrendBadge pct={reviewTrend} />
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                <strong>{periodReviews.filter(r => r.rating >= 4).length}</strong> positive reviews
                            </div>
                        </div>

                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Avg Rating</div>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <span className="dash-stat-num" style={{ color: '#d97706' }}>
                                    {currentAvg ?? '—'}
                                </span>
                                {currentAvg && <span style={{ fontSize: '1rem', color: '#f59e0b', marginLeft: '3px' }}>★</span>}
                                <TrendBadge pct={ratingTrend} />
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Out of 5.0 maximum
                            </div>
                        </div>

                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Requests Sent</div>
                            <div className="dash-stat-num">
                                {periodRequests.length}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                <strong>{periodRequests.filter(r => r.status === 'pending').length}</strong> pending delivery
                            </div>
                        </div>

                        <div className="dash-stat-card">
                            <div className="dash-stat-label">Conversion</div>
                            <div className="dash-stat-num">
                                {responseRate}%
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Request-to-review rate
                            </div>
                        </div>
                    </div>

                    {/* Interactive Review Chart */}
                    <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Review generation trend</h2>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>Number of reviews captured over the current filter period</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            {chartData.map((item, idx) => {
                                const heightPct = (item.value / maxChartValue) * 100
                                return (
                                    <div key={idx} className="chart-bar-col">
                                        <div className="chart-tooltip">
                                            {item.tooltip || `${item.value} review(s) in this interval`}
                                        </div>
                                        <div
                                            className="chart-bar"
                                            style={{
                                                height: `${Math.max(heightPct, item.value > 0 ? 6 : 2)}%`,
                                                opacity: item.value > 0 ? 1 : 0.2
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                            {chartData.map((item, idx) => (
                                <span key={idx} className="chart-bar-label" style={{ flex: 1 }}>
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Category health */}
                    {categoryAnalytics.length > 0 && (
                        <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Category health</h2>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>Average scores across review rating items</p>
                                </div>
                                <a href="/business/reviews" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>All Reviews →</a>
                            </div>
                            <div className="dash-cat-grid">
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
                    <div className="dash-bottom">

                        {/* Recent reviews */}
                        <div className="dash-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                                    Recent reviews{' '}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.25rem' }}>
                                        ({periodReviews.length})
                                    </span>
                                </h2>
                                <a href="/business/reviews" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', flexShrink: 0 }}>All Reviews →</a>
                            </div>

                            {periodReviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                        No reviews captured during this timeframe
                                    </p>
                                    <a href="/business/send" style={{ color: 'var(--primary)', fontSize: '0.825rem', fontWeight: '600', textDecoration: 'none' }}>
                                        Send first request →
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {periodReviews.slice(0, visibleReviews).map(r => (
                                        <div key={r.id} className="dash-review-row">
                                            <div className="dash-review-header">
                                                <span className="dash-review-name">
                                                    {r.customer_name || 'Anonymous customer'}
                                                </span>
                                                <span className="dash-review-stars">
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
                                            {!r.feedback && r.is_public && (
                                                <p style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '600', margin: '0.25rem 0 0 0' }}>Sent to Google Business Profile ✓</p>
                                            )}
                                            {r.workers?.display_name && (
                                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                                    Served by: <strong>{r.workers.display_name}</strong>
                                                </p>
                                            )}
                                            <p style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '0.35rem', margin: 0 }}>
                                                {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    ))}

                                    {visibleReviews < periodReviews.length && (
                                        <button
                                            onClick={() => setVisibleReviews(v => v + 5)}
                                            style={{
                                                width: '100%', padding: '0.625rem',
                                                marginTop: '1rem', borderRadius: '8px',
                                                border: '1px solid var(--border-hover)', background: '#f8fafc',
                                                color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: '600',
                                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.target.style.background = '#f8fafc'}
                                        >
                                            Load more reviews ({periodReviews.length - visibleReviews} remaining)
                                        </button>
                                    )}
                                    {visibleReviews > 5 && (
                                        <button
                                            onClick={() => setVisibleReviews(5)}
                                            style={{
                                                width: '100%', padding: '0.5rem', marginTop: '0.25rem',
                                                borderRadius: '8px', border: 'none', background: 'transparent',
                                                color: 'var(--text-light)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit'
                                            }}
                                        >
                                            Show less
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

                            {/* Prominent Feedback Link Widget */}
                            <div className="dash-card" style={{ background: 'linear-gradient(135deg, #0b0f19, #1e293b)', color: '#ffffff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Feedback Link</h2>
                                    {copied && <span className="copy-badge" style={{ background: 'rgba(22, 163, 74, 0.2)', color: '#4ade80', borderColor: 'rgba(22, 163, 74, 0.3)' }}>Copied!</span>}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                                    Send this review collection link directly to customer phones via SMS or mail.
                                </p>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.35rem',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: '0.5rem',
                                    borderRadius: '10px',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, paddingLeft: '0.25rem' }}>
                                        {typeof window !== 'undefined' ? `${window.location.origin}/feedback/${business?.slug}` : `.../feedback/${business?.slug}`}
                                    </span>
                                    <button
                                        onClick={handleCopyLink}
                                        style={{
                                            background: '#16a34a',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '0.4rem 0.75rem',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#15803d'}
                                        onMouseLeave={e => e.target.style.background = '#16a34a'}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Recent requests */}
                            <div className="dash-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Recent requests</h2>
                                    <a href="/business/send" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', flexShrink: 0 }}>Send New →</a>
                                </div>
                                {periodRequests.length === 0 ? (
                                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>No requests sent during this timeframe</p>
                                ) : (
                                    periodRequests.slice(0, 5).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.customer_name || r.customer_number}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '600',
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
                            <div className="dash-card">
                                <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1rem', margin: 0 }}>Quick actions</h2>
                                
                                <a href="/business/send" className="action-tile">
                                    <span>Send feedback request</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </a>

                                {!worker && (
                                    <>
                                        <a href="/business/reviews" className="action-tile">
                                            <span>View all reviews</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </a>

                                        <a href="/business/settings" className="action-tile">
                                            <span>Manage Account</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </a>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </BusinessLayout>
    )
}