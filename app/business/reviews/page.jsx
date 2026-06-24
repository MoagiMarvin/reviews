'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

export default function ReviewsPage() {
    const [business, setBusiness] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [timeRange, setTimeRange] = useState('all')
    const [selected, setSelected] = useState(null)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            const [bizRes, revRes] = await Promise.all([
                fetch('/api/business/me'),
                fetch('/api/reviews')
            ])
            const bizData = await bizRes.json()
            const revData = await revRes.json()
            if (bizData.business) setBusiness(bizData.business)
            if (revData.reviews) setReviews(revData.reviews)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getTimeRangeStart = () => {
        const now = new Date()
        if (timeRange === '7d') {
            const d = new Date(now); d.setDate(d.getDate() - 7); return d
        }
        if (timeRange === '30d') {
            const d = new Date(now); d.setDate(d.getDate() - 30); return d
        }
        if (timeRange === 'month') {
            return new Date(now.getFullYear(), now.getMonth(), 1)
        }
        return null
    }

    const timeStart = getTimeRangeStart()
    const timeFiltered = timeStart
        ? reviews.filter(r => new Date(r.created_at) >= timeStart)
        : reviews

    const getCategoryAnalytics = () => {
        const catMap = {}
        timeFiltered.forEach(r => {
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

    const categoryAnalytics = getCategoryAnalytics()

    const getStatusColor = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '#16a34a'
        if (n >= 3) return '#d97706'
        return '#dc2626'
    }

    const getStatusBg = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '#f0fdf4'
        if (n >= 3) return '#fffbeb'
        return '#fef2f2'
    }

    const getStatusLabel = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return 'Good'
        if (n >= 3) return 'Watch'
        return 'Urgent'
    }

    const filtered = timeFiltered.filter(r => {
        if (filter === 'positive') return r.rating >= 4
        if (filter === 'negative') return r.rating < 4
        if (filter === 'google') return r.is_public
        if (filter === 'private') return !r.is_public
        return true
    })

    const filterCounts = {
        all: timeFiltered.length,
        positive: timeFiltered.filter(r => r.rating >= 4).length,
        negative: timeFiltered.filter(r => r.rating < 4).length,
        google: timeFiltered.filter(r => r.is_public).length,
        private: timeFiltered.filter(r => !r.is_public).length,
    }

    const avgRating = timeFiltered.length
        ? (timeFiltered.reduce((s, r) => s + r.rating, 0) / timeFiltered.length).toFixed(1)
        : null

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: timeFiltered.filter(r => r.rating === star).length,
        pct: timeFiltered.length
            ? Math.round((timeFiltered.filter(r => r.rating === star).length / timeFiltered.length) * 100)
            : 0
    }))

    if (loading) return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', paddingLeft: '220px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading reviews...</p>
            </div>
        </BusinessLayout>
    )

    return (
        <BusinessLayout>
            <style>{`
                .rev-page { max-width: 1200px; margin: 0; padding: 2rem 3rem 4rem 3rem; box-sizing: border-box; }
                .rev-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.03em; margin-bottom: 0.2rem; }
                .rev-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
                .rev-stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem 1.125rem; min-width: 0; box-sizing: border-box; box-shadow: var(--shadow-sm); }
                .rev-stat-num { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; }
                .rev-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
                .rev-main { display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 1.5rem; align-items: start; }
                .rev-list-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; min-width: 0; box-sizing: border-box; overflow: hidden; box-shadow: var(--shadow-sm); }
                .rev-sidebar-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; min-width: 0; box-sizing: border-box; box-shadow: var(--shadow-sm); }
                .rev-card { padding: 1rem; border-radius: var(--radius-md); margin-bottom: 0.625rem; border: 1px solid var(--border-color); background: #ffffff; cursor: pointer; transition: all 0.2s ease; min-width: 0; box-sizing: border-box; overflow: hidden; }
                .rev-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
                .rev-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
                .rev-card-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
                .rev-card-name { font-size: 0.875rem; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .rev-card-right { text-align: right; flex-shrink: 0; }
                .rev-filter-btn { padding: 0.35rem 0.875rem; font-size: 0.8rem; font-weight: 500; border-radius: 100px; cursor: pointer; transition: all 0.15s ease; }
                
                @media (max-width: 900px) {
                    .rev-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                }
                @media (max-width: 767px) {
                    .rev-page { padding: 1.25rem 1rem; }
                    .rev-title { font-size: 1.25rem; }
                    .rev-stats { gap: 0.5rem; }
                    .rev-stat-card { padding: 0.75rem; }
                    .rev-stat-num { font-size: 1.5rem; }
                    .rev-cat-grid { grid-template-columns: minmax(0, 1fr); }
                    .rev-main { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
                }
            `}</style>
            <Sidebar business={business} />
            <div style={{ width: '100%', minWidth: 0 }} className="main-with-sidebar">
                <div className="rev-page">

                    {/* Page header */}
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="rev-title">Reviews</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                Manage and respond to customer reviews and ratings
                            </p>
                        </div>
                        {/* Time range picker */}
                        <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '100px', padding: '0.25rem', boxShadow: 'var(--shadow-sm)' }}>
                            {[
                                { key: 'all', label: 'All time' },
                                { key: 'month', label: 'This month' },
                                { key: '30d', label: '30 days' },
                                { key: '7d', label: '7 days' },
                            ].map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => { setTimeRange(t.key); setFilter('all') }}
                                    style={{
                                        padding: '0.3rem 0.85rem',
                                        fontSize: '0.78rem',
                                        fontWeight: '600',
                                        borderRadius: '100px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        background: timeRange === t.key ? 'var(--text-main)' : 'transparent',
                                        color: timeRange === t.key ? '#ffffff' : 'var(--text-muted)',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="rev-stats">
                        {[
                            { label: 'Total', value: timeFiltered.length, color: 'var(--text-main)' },
                            { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—', color: '#d97706' },
                            { label: 'Positive', value: timeFiltered.filter(r => r.rating >= 4).length, color: 'var(--primary)' },
                            { label: 'Negative', value: timeFiltered.filter(r => r.rating < 4).length, color: '#dc2626' },
                            { label: 'On Google', value: timeFiltered.filter(r => r.is_public).length, color: '#2563eb' },
                        ].map(s => (
                            <div key={s.label} className="rev-stat-card">
                                <div style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {s.label}
                                </div>
                                <div className="rev-stat-num" style={{ color: s.color }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Category breakdown */}
                    {categoryAnalytics.length > 0 && (
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            marginBottom: '1.5rem',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                                Customer parameters scores
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 1.25rem 0' }}>
                                Average values compiled by rating category items
                            </p>
                            <div className="rev-cat-grid">
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div key={category} style={{
                                        background: getStatusBg(avg),
                                        border: `1px solid ${getStatusColor(avg)}1a`,
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        minWidth: 0,
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {category}
                                            </span>
                                            <span style={{
                                                fontSize: '0.68rem',
                                                fontWeight: '700',
                                                color: getStatusColor(avg),
                                                background: '#ffffff',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '100px',
                                                border: `1px solid ${getStatusColor(avg)}2a`,
                                                flexShrink: 0,
                                                marginLeft: '0.25rem'
                                            }}>
                                                {getStatusLabel(avg)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', minWidth: 0 }}>
                                                <div style={{
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    width: `${(parseFloat(avg) / 5) * 100}%`,
                                                    background: getStatusColor(avg),
                                                    transition: 'width 0.4s ease'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '1rem', fontWeight: '800', color: getStatusColor(avg), minWidth: '32px', flexShrink: 0, textAlign: 'right' }}>
                                                {avg}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                            {count} review{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main content — list + sidebar */}
                    <div className="rev-main">

                        {/* Reviews list */}
                        <div className="rev-list-card">

                            {/* Filter tabs */}
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                {[
                                    { key: 'all', label: 'All Reviews' },
                                    { key: 'positive', label: 'Positive' },
                                    { key: 'negative', label: 'Negative' },
                                    { key: 'google', label: 'On Google' },
                                    { key: 'private', label: 'Private Only' }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key)}
                                        className="rev-filter-btn"
                                        style={{
                                            background: filter === tab.key ? 'var(--text-main)' : '#ffffff',
                                            color: filter === tab.key ? '#ffffff' : 'var(--text-muted)',
                                            border: filter === tab.key ? '1px solid var(--text-main)' : '1px solid var(--border-hover)'
                                        }}
                                    >
                                        {tab.label}
                                        <span style={{
                                            marginLeft: '0.35rem',
                                            fontSize: '0.7rem',
                                            fontWeight: '700',
                                            opacity: filter === tab.key ? 0.75 : 0.55
                                        }}>({filterCounts[tab.key]})</span>
                                    </button>
                                ))}
                            </div>

                            {filtered.length === 0 ? (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', padding: '2rem 0', textAlign: 'center' }}>No customer reviews match this filter criteria</p>
                            ) : (
                                filtered.map(r => (
                                    <div
                                        key={r.id}
                                        className="rev-card"
                                        style={{
                                            borderColor: selected?.id === r.id ? 'var(--text-light)' : 'var(--border-color)',
                                            background: selected?.id === r.id ? 'var(--bg-app)' : '#ffffff',
                                            boxShadow: selected?.id === r.id ? 'var(--shadow-sm)' : 'none'
                                        }}
                                        onClick={() => setSelected(selected?.id === r.id ? null : r)}
                                    >
                                        {/* Header row */}
                                        <div className="rev-card-header">
                                            <div className="rev-card-left">
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', flexShrink: 0
                                                }}>
                                                    {(r.customer_name || 'A').slice(0, 1).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="rev-card-name">
                                                        {r.customer_name || 'Anonymous customer'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                                        {new Date(r.created_at).toLocaleDateString('en-ZA', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                        {r.workers?.display_name && ` · Served by ${r.workers.display_name}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rev-card-right">
                                                <div style={{ color: '#f59e0b', fontSize: '0.85rem', lineHeight: 1 }}>
                                                    {'★'.repeat(r.rating)}
                                                    <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - r.rating)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.68rem', marginTop: '4px', fontWeight: '500' }}>
                                                    {r.is_public
                                                        ? <span style={{ color: 'var(--primary)' }}>Google ✓</span>
                                                        : <span style={{ color: 'var(--text-light)' }}>Private</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsed preview */}
                                        {r.feedback && selected?.id !== r.id && (
                                            <p style={{
                                                fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                fontStyle: 'italic', margin: '0.75rem 0 0 0'
                                            }}>
                                                "{r.feedback}"
                                            </p>
                                        )}

                                        {/* Expanded detail */}
                                        {selected?.id === r.id && (
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', animation: 'slideDown 0.15s ease-out' }}>

                                                {r.category_ratings && Object.keys(r.category_ratings).length > 0 && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                                            Parameters ratings
                                                        </div>
                                                        {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                            <div key={cat} style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.25rem',
                                                                background: '#ffffff', border: '1px solid var(--border-color)'
                                                            }}>
                                                                <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-main)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                                    <div style={{ width: '72px', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            height: '5px', borderRadius: '3px',
                                                                            width: `${(val / 5) * 100}%`,
                                                                            background: val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a'
                                                                        }} />
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: '0.78rem', fontWeight: '700', minWidth: '28px', textRight: 'right',
                                                                        color: val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a'
                                                                    }}>
                                                                        {val}/5
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {r.feedback && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                                            {r.rating >= 4 ? 'Compliment text' : 'Feedback details'}
                                                        </div>
                                                        <p style={{
                                                            fontSize: '0.825rem', color: '#334155', lineHeight: '1.6',
                                                            background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px',
                                                            border: '1px solid var(--border-color)', margin: 0, fontStyle: 'italic'
                                                        }}>
                                                            "{r.feedback}"
                                                        </p>
                                                    </div>
                                                )}

                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Submission Time</span>
                                                    <span>
                                                        {new Date(r.created_at).toLocaleString('en-ZA', {
                                                            day: 'numeric', month: 'long', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
                                            {selected?.id === r.id ? 'Click to collapse ↑' : 'Click for details ↓'}
                                        </div>
                                    </div>
                                ))
                             )}
                        </div>

                        {/* Rating breakdown sidebar */}
                        <div className="rev-sidebar-card">
                            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1.25rem', margin: 0 }}>
                                Score distribution
                            </h2>
                            {ratingCounts.map(({ star, count, pct }) => (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', width: '22px', flexShrink: 0 }}>
                                        {star}★
                                    </span>
                                    <div style={{ flex: 1, height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: 0 }}>
                                        <div style={{
                                            height: '7px', borderRadius: '4px',
                                            width: `${pct}%`,
                                            background: star >= 4 ? 'var(--primary)' : star === 3 ? '#d97706' : '#dc2626',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', width: '20px', textAlign: 'right', flexShrink: 0, fontWeight: '500' }}>
                                        {count}
                                    </span>
                                </div>
                            ))}

                            {avgRating && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                        {avgRating}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Average Score
                                    </div>
                                    <div style={{ color: '#f59e0b', fontSize: '1rem', marginTop: '0.5rem', letterSpacing: '2px' }}>
                                        {'★'.repeat(Math.round(parseFloat(avgRating)))}
                                        <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - Math.round(parseFloat(avgRating)))}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </BusinessLayout>
    )
}