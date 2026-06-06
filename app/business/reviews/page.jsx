'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/business/Sidebar'

export default function ReviewsPage() {
    const [business, setBusiness] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

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

    const positive = reviews.filter(r => r.rating >= 4).length
    const negative = reviews.filter(r => r.rating < 4).length
    const sentToGoogle = reviews.filter(r => r.is_public).length

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
        <div style={layoutStyle}>
            <Sidebar business={business} />
            <div style={mainStyle}>
                <div style={pageStyle}>

                    <h1 style={pageTitleStyle}>Reviews</h1>
                    <p style={pageSubStyle}>
                        All feedback received from your customers
                    </p>

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
                            <div style={{ ...statValStyle, color: '#16a34a' }}>{positive}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Negative</div>
                            <div style={{ ...statValStyle, color: '#dc2626' }}>{negative}</div>
                        </div>
                        <div style={statCardStyle}>
                            <div style={statLabelStyle}>Sent to Google</div>
                            <div style={{ ...statValStyle, color: '#3b82f6' }}>{sentToGoogle}</div>
                        </div>
                    </div>

                    <div style={gridStyle}>

                        {/* Reviews list */}
                        <div style={cardStyle}>

                            {/* Filter tabs */}
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
                                            border: filter === tab.key
                                                ? '1px solid #111'
                                                : '1px solid #e5e5e5'
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
                                    <div key={r.id} style={reviewCardStyle}>
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
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                                                    {'★'.repeat(r.rating)}
                                                    <span style={{ color: '#e5e5e5' }}>
                                                        {'★'.repeat(5 - r.rating)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                                    {r.is_public ? (
                                                        <span style={{ color: '#16a34a' }}>Sent to Google ✓</span>
                                                    ) : (
                                                        <span style={{ color: '#888' }}>Private</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {r.feedback && (
                                            <p style={feedbackStyle}>{r.feedback}</p>
                                        )}

                                        {r.category_ratings && (
                                            <div style={categoryStyle}>
                                                {Object.entries(r.category_ratings).map(([cat, val]) => (
                                                    <div key={cat} style={catRowStyle}>
                                                        <span style={{ fontSize: '0.75rem', color: '#555' }}>{cat}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                                            {'★'.repeat(val)}{'☆'.repeat(5 - val)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Rating breakdown */}
                        <div>
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Rating breakdown</h2>
                                {ratingCounts.map(({ star, count, pct }) => (
                                    <div key={star} style={barRowStyle}>
                                        <span style={{ fontSize: '0.8rem', color: '#555', width: '20px' }}>
                                            {star}★
                                        </span>
                                        <div style={barTrackStyle}>
                                            <div style={{
                                                ...barFillStyle,
                                                width: `${pct}%`,
                                                background: star >= 4 ? '#16a34a' : star === 3 ? '#f59e0b' : '#dc2626'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#888', width: '30px', textAlign: 'right' }}>
                                            {count}
                                        </span>
                                    </div>
                                ))}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
    color: '#111'
}

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '1rem',
    alignItems: 'start'
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.25rem'
}

const cardTitleStyle = {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#111',
    marginBottom: '1rem'
}

const tabsStyle = {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem'
}

const tabBtnStyle = {
    padding: '0.35rem 0.75rem',
    borderRadius: '100px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s'
}

const reviewCardStyle = {
    padding: '1rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const reviewHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.625rem'
}

const avatarStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f0fdf4',
    border: '1px solid #dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#16a34a',
    flexShrink: 0
}

const feedbackStyle = {
    fontSize: '0.875rem',
    color: '#444',
    lineHeight: '1.6',
    marginTop: '0.5rem',
    background: '#f9fafb',
    padding: '0.75rem',
    borderRadius: '8px'
}

const categoryStyle = {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
}

const catRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
}

const barRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.625rem'
}

const barTrackStyle = {
    flex: 1,
    height: '8px',
    background: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden'
}

const barFillStyle = {
    height: '8px',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
}

const emptyStyle = {
    fontSize: '0.875rem',
    color: '#aaa',
    padding: '1rem 0'
}