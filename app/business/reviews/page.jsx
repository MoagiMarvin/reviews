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

    // Build category analytics from all reviews
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
        if (n >= 3) return '#f59e0b'
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
        if (n >= 3) return 'Needs attention'
        return 'Urgent'
    }

    const getStatusIcon = (avg) => {
        const n = parseFloat(avg)
        if (n >= 4) return '🟢'
        if (n >= 3) return '🟡'
        return '🔴'
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
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Loading...</p>
        </div>
    )

    return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div style={pageStyle}>

                    <h1 style={pageTitleStyle}>Reviews</h1>
                    <p style={pageSubStyle}>All feedback received from your customers</p>

                    {/* Stats row */}
                    <div style={statsGridStyle}>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Total reviews</div>
                            <div style={statValStyle}>{reviews.length}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Average rating</div>
                            <div style={{ ...statValStyle, color: '#f59e0b' }}>
                                {avgRating ? `${avgRating} ★` : '—'}
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Positive</div>
                            <div style={{ ...statValStyle, color: '#16a34a' }}>
                                {reviews.filter(r => r.rating >= 4).length}
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Negative</div>
                            <div style={{ ...statValStyle, color: '#dc2626' }}>
                                {reviews.filter(r => r.rating < 4).length}
                            </div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>On Google</div>
                            <div style={{ ...statValStyle, color: '#3b82f6' }}>
                                {reviews.filter(r => r.is_public).length}
                            </div>
                        </div>
                    </div>

                    {/* Category analytics */}
                    {categoryAnalytics.length > 0 && (
                        <div style={analyticsCardStyle}>
                            <h2 style={cardTitleStyle}>What customers are saying</h2>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>
                                Average rating per category across all reviews
                            </p>
                            <div style={analyticsGridStyle}>
                                {categoryAnalytics.map(({ category, avg, count }) => (
                                    <div
                                        key={category}
                                        style={{
                                            ...analyticsCatStyle,
                                            background: getStatusBg(avg),
                                            border: `1px solid ${getStatusColor(avg)}22`
                                        }}
                                    >
                                        <div style={catAnalyticsHeaderStyle}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                                {getStatusIcon(avg)} {category}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                color: getStatusColor(avg),
                                                background: '#fff',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '100px',
                                                border: `1px solid ${getStatusColor(avg)}33`
                                            }}>
                                                {getStatusLabel(avg)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                            <div style={barTrackStyle}>
                                                <div style={{
                                                    ...barFillStyle,
                                                    width: `${(parseFloat(avg) / 5) * 100}%`,
                                                    background: getStatusColor(avg)
                                                }} />
                                            </div>
                                            <span style={{
                                                fontSize: '1rem',
                                                fontWeight: '700',
                                                color: getStatusColor(avg),
                                                minWidth: '32px'
                                            }}>
                                                {avg}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.4rem' }}>
                                            Based on {count} review{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={gridStyle}>

                        {/* Reviews list */}
                        <div style={cardStyle}>
                            <div style={tabsStyle}>
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
                                            ...tabBtnStyle,
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
                                <p style={emptyStyle}>No reviews found</p>
                            ) : (
                                filtered.map(r => (
                                    <div
                                        key={r.id}
                                        style={{
                                            ...reviewCardStyle,
                                            background: selected?.id === r.id ? '#f9fafb' : '#fff'
                                        }}
                                        onClick={() => setSelected(selected?.id === r.id ? null : r)}
                                    >
                                        {/* Header */}
                                        <div style={reviewHeaderStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={avatarStyle}>
                                                    {(r.customer_name || 'A').slice(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111' }}>
                                                        {r.customer_name || 'Anonymous'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                                                        {new Date(r.created_at).toLocaleDateString('en-ZA', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                                                    {'★'.repeat(r.rating)}
                                                    <span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - r.rating)}</span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                                    {r.is_public
                                                        ? <span style={{ color: '#16a34a' }}>On Google ✓</span>
                                                        : <span style={{ color: '#888' }}>Private</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview when collapsed */}
                                        {r.feedback && selected?.id !== r.id && (
                                            <p style={{
                                                fontSize: '0.8rem',
                                                color: '#666',
                                                marginTop: '0.5rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {r.feedback}
                                            </p>
                                        )}

                                        {/* Expanded detail */}
                                        {selected?.id === r.id && (
                                            <div style={detailStyle}>

                                                {/* Category breakdown */}
                                                {r.category_ratings && Object.keys(r.category_ratings).length > 0 && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <div style={sectionTitleStyle}>Category breakdown</div>
                                                        {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                            <div key={cat} style={catDetailRowStyle}>
                                                                <span style={{ fontSize: '0.825rem', color: '#333', flex: 1 }}>
                                                                    {cat}
                                                                </span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                                    <div style={{ width: '80px', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            height: '6px',
                                                                            borderRadius: '3px',
                                                                            width: `${(val / 5) * 100}%`,
                                                                            background: val <= 2 ? '#dc2626' : val === 3 ? '#f59e0b' : '#16a34a'
                                                                        }} />
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: '600',
                                                                        color: val <= 2 ? '#dc2626' : val === 3 ? '#f59e0b' : '#16a34a',
                                                                        minWidth: '28px'
                                                                    }}>
                                                                        {val}/5
                                                                    </span>
                                                                    <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                                                                        {'★'.repeat(val)}
                                                                        <span style={{ color: '#e5e5e5' }}>{'★'.repeat(5 - val)}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Feedback */}
                                                {r.feedback && (
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <div style={sectionTitleStyle}>
                                                            {r.rating >= 4 ? 'Compliment' : 'Feedback'}
                                                        </div>
                                                        <p style={feedbackTextStyle}>{r.feedback}</p>
                                                    </div>
                                                )}

                                                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>
                                                    {new Date(r.created_at).toLocaleString('en-ZA', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.4rem', textAlign: 'right' }}>
                                            {selected?.id === r.id ? '↑ Collapse' : '↓ View detail'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right sidebar */}
                        <div>
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Rating breakdown</h2>
                                {ratingCounts.map(({ star, count, pct }) => (
                                    <div key={star} style={barRowStyle}>
                                        <span style={{ fontSize: '0.8rem', color: '#555', width: '24px' }}>
                                            {star}★
                                        </span>
                                        <div style={barTrackStyle}>
                                            <div style={{
                                                ...barFillStyle,
                                                width: `${pct}%`,
                                                background: star >= 4 ? '#16a34a' : star === 3 ? '#f59e0b' : '#dc2626'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#888', width: '24px', textAlign: 'right' }}>
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const layoutStyle = { display: 'flex', minHeight: '100vh', background: '#fafafa' }
const mainStyle = { marginLeft: '220px', flex: 1, overflow: 'auto' }
const pageStyle = { maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }
const pageTitleStyle = { fontSize: '1.4rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }
const pageSubStyle = { color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }
const statCardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1rem 1.25rem' }
const statLabelStyle = { fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }
const statValStyle = { fontSize: '1.8rem', fontWeight: '600', color: '#111' }
const analyticsCardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }
const analyticsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }
const analyticsCatStyle = { borderRadius: '10px', padding: '1rem' }
const catAnalyticsHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1rem', alignItems: 'start' }
const cardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem' }
const cardTitleStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#111', marginBottom: '1rem' }
const tabsStyle = { display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }
const tabBtnStyle = { padding: '0.35rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
const reviewCardStyle = { padding: '1rem', borderRadius: '10px', marginBottom: '0.5rem', border: '1px solid #f3f4f6', transition: 'background 0.15s', cursor: 'pointer' }
const reviewHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600', color: '#16a34a', flexShrink: 0 }
const detailStyle = { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }
const sectionTitleStyle = { fontSize: '0.7rem', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.625rem' }
const catDetailRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.25rem', background: '#fff', border: '1px solid #f3f4f6' }
const feedbackTextStyle = { fontSize: '0.875rem', color: '#444', lineHeight: '1.6', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }
const barRowStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }
const barTrackStyle = { flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }
const barFillStyle = { height: '8px', borderRadius: '4px', transition: 'width 0.3s ease' }
const emptyStyle = { fontSize: '0.875rem', color: '#aaa', padding: '1rem 0' }