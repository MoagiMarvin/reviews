'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

export default function ReviewsPage() {
    const [business, setBusiness] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
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

    const getCategoryAnalytics = () => {
        const catMap = {}
        reviews.forEach(r => {
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

    const filtered = reviews.filter(r => {
        if (filter === 'positive') return r.rating >= 4
        if (filter === 'negative') return r.rating < 4
        if (filter === 'google') return r.is_public
        if (filter === 'private') return !r.is_public
        return true
    })

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length
            ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
            : 0
    }))

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.875rem' }}>Loading...</p>
        </div>
    )

    return (
        <BusinessLayout>
            <style>{`
                .rev-page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; box-sizing: border-box; }
                .rev-title { font-size: 1.4rem; }
                .rev-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.625rem; margin-bottom: 1.5rem; }
                .rev-stat-card { background: #fff; border: 1px solid #ebebeb; border-radius: 10px; padding: 1rem 1.125rem; min-width: 0; box-sizing: border-box; }
                .rev-stat-num { font-size: 1.75rem; }
                .rev-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.625rem; }
                .rev-main { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 1rem; align-items: start; }
                .rev-list-card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 1.25rem; min-width: 0; box-sizing: border-box; overflow: hidden; }
                .rev-sidebar-card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 1.25rem; min-width: 0; box-sizing: border-box; }
                .rev-card { padding: 0.875rem; border-radius: 9px; margin-bottom: 0.5rem; border: 1px solid #f3f4f6; background: #fff; cursor: pointer; transition: all 0.15s; min-width: 0; box-sizing: border-box; overflow: hidden; }
                .rev-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
                .rev-card-left { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
                .rev-card-name { font-size: 0.85rem; font-weight: 600; color: #111; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .rev-card-right { text-align: right; flex-shrink: 0; }
                @media (max-width: 767px) {
                    .rev-page { padding: 1.25rem 1rem; }
                    .rev-title { font-size: 1.25rem; }
                    .rev-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .rev-stat-card { padding: 0.875rem; }
                    .rev-stat-num { font-size: 1.5rem; }
                    .rev-cat-grid { grid-template-columns: minmax(0, 1fr); }
                    .rev-main { grid-template-columns: minmax(0, 1fr); }
                }
            `}</style>
            <Sidebar business={business} />
            <div style={{ width: '100%', minWidth: 0 }}>
                <div className="rev-page">

                    {/* Page header */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <h1 className="rev-title" style={{ fontWeight: '700', color: '#111', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>
                            Reviews
                        </h1>
                        <p style={{ color: '#999', fontSize: '0.85rem' }}>
                            All feedback from your customers
                        </p>
                    </div>

                    {/* Stats row */}
                    <div className="rev-stats">
                        {[
                            { label: 'Total', value: reviews.length, color: '#111' },
                            { label: 'Avg rating', value: avgRating ? `${avgRating}★` : '—', color: '#d97706' },
                            { label: 'Positive', value: reviews.filter(r => r.rating >= 4).length, color: '#16a34a' },
                            { label: 'Negative', value: reviews.filter(r => r.rating < 4).length, color: '#dc2626' },
                            { label: 'On Google', value: reviews.filter(r => r.is_public).length, color: '#3b82f6' },
                        ].map(s => (
                            <div key={s.label} className="rev-stat-card">
                                <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {s.label}
                                </div>
                                <div className="rev-stat-num" style={{ fontWeight: '700', color: s.color, letterSpacing: '-0.02em' }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Category breakdown */}
                    {categoryAnalytics.length > 0 && (
                        <div style={{
                            background: '#fff',
                            border: '1px solid #ebebeb',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            marginBottom: '1.25rem',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                        }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }}>
                                What customers are saying
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '1.125rem' }}>
                                Average score per category
                            </p>
                            <div className="rev-cat-grid">
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div key={category} style={{
                                        background: getStatusBg(avg),
                                        border: `1px solid ${getStatusColor(avg)}1a`,
                                        borderRadius: '9px',
                                        padding: '0.875rem',
                                        minWidth: 0,
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                                            <span style={{ fontSize: '0.825rem', fontWeight: '500', color: '#222', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {category}
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                color: getStatusColor(avg),
                                                background: '#fff',
                                                padding: '0.15rem 0.45rem',
                                                borderRadius: '100px',
                                                border: `1px solid ${getStatusColor(avg)}2a`,
                                                flexShrink: 0,
                                                marginLeft: '0.25rem'
                                            }}>
                                                {getStatusLabel(avg)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden', minWidth: 0 }}>
                                                <div style={{
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    width: `${(parseFloat(avg) / 5) * 100}%`,
                                                    background: getStatusColor(avg),
                                                    transition: 'width 0.4s ease'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: getStatusColor(avg), minWidth: '30px', flexShrink: 0 }}>
                                                {avg}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '0.35rem' }}>
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
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'positive', label: 'Positive' },
                                    { key: 'negative', label: 'Negative' },
                                    { key: 'google', label: 'On Google' },
                                    { key: 'private', label: 'Private' }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key)}
                                        style={{
                                            padding: '0.3rem 0.7rem',
                                            borderRadius: '100px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.15s',
                                            background: filter === tab.key ? '#111' : 'transparent',
                                            color: filter === tab.key ? '#fff' : '#888',
                                            border: filter === tab.key ? '1px solid #111' : '1px solid #e5e5e5'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {filtered.length === 0 ? (
                                <p style={{ fontSize: '0.875rem', color: '#ccc', padding: '1rem 0' }}>No reviews found</p>
                            ) : (
                                filtered.map(r => (
                                    <div
                                        key={r.id}
                                        className="rev-card"
                                        style={{
                                            borderColor: selected?.id === r.id ? '#e5e5e5' : '#f3f4f6',
                                            background: selected?.id === r.id ? '#fafafa' : '#fff',
                                        }}
                                        onClick={() => setSelected(selected?.id === r.id ? null : r)}
                                    >
                                        {/* Header row */}
                                        <div className="rev-card-header">
                                            <div className="rev-card-left">
                                                <div style={{
                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                    background: '#f0fdf4', border: '1px solid #dcfce7',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', flexShrink: 0
                                                }}>
                                                    {(r.customer_name || 'A').slice(0, 1).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="rev-card-name">
                                                        {r.customer_name || 'Anonymous'}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: '#bbb', marginTop: '1px' }}>
                                                        {new Date(r.created_at).toLocaleDateString('en-ZA', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rev-card-right">
                                                <div style={{ color: '#f59e0b', fontSize: '0.85rem', lineHeight: 1 }}>
                                                    {'★'.repeat(r.rating)}
                                                    <span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - r.rating)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.68rem', marginTop: '3px' }}>
                                                    {r.is_public
                                                        ? <span style={{ color: '#16a34a' }}>On Google ✓</span>
                                                        : <span style={{ color: '#ccc' }}>Private</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsed preview */}
                                        {r.feedback && selected?.id !== r.id && (
                                            <p style={{
                                                fontSize: '0.78rem', color: '#888', marginTop: '0.5rem',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {r.feedback}
                                            </p>
                                        )}

                                        {/* Expanded detail */}
                                        {selected?.id === r.id && (
                                            <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #f3f4f6' }}>

                                                {r.category_ratings && Object.keys(r.category_ratings).length > 0 && (
                                                    <div style={{ marginBottom: '0.875rem' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                                                            Category breakdown
                                                        </div>
                                                        {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                            <div key={cat} style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '0.45rem 0.625rem', borderRadius: '6px', marginBottom: '0.2rem',
                                                                background: '#fff', border: '1px solid #f3f4f6'
                                                            }}>
                                                                <span style={{ fontSize: '0.8rem', color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                                    <div style={{ width: '72px', height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            height: '5px', borderRadius: '3px',
                                                                            width: `${(val / 5) * 100}%`,
                                                                            background: val <= 2 ? '#dc2626' : val === 3 ? '#d97706' : '#16a34a'
                                                                        }} />
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: '0.78rem', fontWeight: '600', minWidth: '28px',
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
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                                                            {r.rating >= 4 ? 'Compliment' : 'Feedback'}
                                                        </div>
                                                        <p style={{
                                                            fontSize: '0.85rem', color: '#444', lineHeight: '1.6',
                                                            background: '#f9fafb', padding: '0.7rem 0.875rem', borderRadius: '8px'
                                                        }}>
                                                            {r.feedback}
                                                        </p>
                                                    </div>
                                                )}

                                                <div style={{ fontSize: '0.68rem', color: '#ccc' }}>
                                                    {new Date(r.created_at).toLocaleString('en-ZA', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ fontSize: '0.68rem', color: '#ccc', marginTop: '0.4rem', textAlign: 'right' }}>
                                            {selected?.id === r.id ? '↑ collapse' : '↓ details'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Rating breakdown sidebar */}
                        <div className="rev-sidebar-card">
                            <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111', marginBottom: '1rem' }}>
                                Rating breakdown
                            </h2>
                            {ratingCounts.map(({ star, count, pct }) => (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#666', width: '22px', flexShrink: 0 }}>
                                        {star}★
                                    </span>
                                    <div style={{ flex: 1, height: '7px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', minWidth: 0 }}>
                                        <div style={{
                                            height: '7px', borderRadius: '4px',
                                            width: `${pct}%`,
                                            background: star >= 4 ? '#16a34a' : star === 3 ? '#d97706' : '#dc2626',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#aaa', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                                        {count}
                                    </span>
                                </div>
                            ))}

                            {avgRating && (
                                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                        {avgRating}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
                                        avg out of 5
                                    </div>
                                    <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                                        {'★'.repeat(Math.round(parseFloat(avgRating)))}
                                        <span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - Math.round(parseFloat(avgRating)))}</span>
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